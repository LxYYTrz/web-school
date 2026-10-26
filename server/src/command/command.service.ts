/**
 * ============================================================================
 * 文件作用：控制指令服务（下行链路的核心：白名单 + 审计 + 下发）
 * 所属模块：server/src/command/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件回答"控制指令是怎么从浏览器走到 PLC 的" ★
 * ============================================================================
 *
 * 【完整下行链路（本文件是第 ③④ 步）】
 *
 *   ① 浏览器（操作员点击"启动/停止/复位"按钮）
 *        │  POST /api/lines/line-01/commands
 *        │  Body: { deviceId:'plc-01', type:'stop', params:{} }
 *        ▼
 *   ② CommandController（HTTP 层）→ 转交本服务
 *        ▼
 *   ③ ★ CommandService（本文件）★
 *        ├─ 校验 type 是否在白名单内（安全边界一：不允许任意写寄存器）
 *        ├─ 校验 lineId / deviceId 是否存在（安全边界二：编码必须在册）
 *        ├─ INSERT control_commands（status='sent'）→ 生成审计记录
 *        └─ publish 到 MQTT 主题 tl/v1/{line}/cmd/{device}
 *        ▼
 *   ④ MQTT Broker → 采集器订阅的 tl/v1/line-01/cmd/+ 主题
 *        ▼
 *   ⑤ 采集器收到指令 → 写 PLC（PLC 自身联锁有最终否决权）→ 0.3~若干秒后
 *        publish cmd_ack { cmdId, status:'acked' }
 *        ▼
 *   ⑥ 回到 MqttIngestService.dispatch → kind === 'cmd_ack'
 *        → HistoryWriterService.ackCommand() 更新 control_commands 状态
 *
 * 【为什么 cmdId 这么重要】
 *   cmdId 就是数据库 control_commands.idempotency_key（UUID）。
 *   它把「后端下发的指令」和「边缘回的回执」绑定在一起，形成闭环审计：
 *     - 幂等：重复回执不会重复改状态（ackCommand 里 WHERE status IN ('pending','sent')）
 *     - 可追溯：查这条指令是谁、什么时候、对哪台设备下的、回执是什么
 *     - 可对账：15 秒无回执置 timeout
 *
 * 【安全说明（非常重要）】
 *   - 指令类型使用 command-contract.json 中的白名单，
 *     永远不提供"写任意寄存器"的能力 —— 那是极危险的通用远程执行接口。
 *   - 急停（E-Stop）**不在本系统范围内**：急停必须是硬件回路，
 *     网页永远不做急停按钮。软件急停是不可靠的。
 *   - HTTP 控制入口由 AuthGuard + CommandGuard 校验会话和操作级别。
 */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CatalogService } from '../infra/catalog.service';
// 从 ../infra/catalog.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { MqttIngestService } from '../ingest/mqtt-ingest.service';
// 从 ../ingest/mqtt-ingest.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ALLOWED_TYPES, validateParams } from './command-contract';
// 从 ./command-contract 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 白名单与 params 校验表已抽到 command-contract.ts(数据在 command-contract.json,
// AI 的只读 MCP server 共读同一份),此处只消费不重复定义。

// 契约 §5 第 4 条:15s 无 ack 置 timeout
const CMD_TIMEOUT_SEC = 15;
// 声明 CMD_TIMEOUT_SEC，初始值由 15 计算得到。 关键字：const＝声明不可重新绑定的变量。

/**
 * 指令请求体结构（对应前端 POST 的 JSON Body）。
 */
export interface CommandBody {
// 声明 CommandBody 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  deviceId?: string;
  // 声明 可选字段 deviceId，类型为 string。
  type?: string;
  // 声明 可选字段 type，类型为 string。 关键字：type＝定义类型别名。
  params?: Record<string, unknown>;
  // 声明 可选字段 params，类型为 Record<string, unknown>。 关键字：unknown＝需检查后才能使用的类型。
}
// 结束当前对象、函数或条件代码块。

@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class CommandService implements OnModuleInit, OnModuleDestroy {
// 声明 CommandService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  private readonly logger = new Logger(CommandService.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。
  private timer?: NodeJS.Timeout;
  // 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：private＝限定类内部访问。

  constructor(
  // 调用 constructor，把括号中的值作为参数传入。
    @Inject(PG_POOL) private readonly pool: Pool,
    // 装饰器 Inject：按令牌注入指定依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly catalog: CatalogService,
    // 声明类属性或构造参数 catalog，类型为 CatalogService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly mqtt: MqttIngestService,
    // 声明类属性或构造参数 mqtt，类型为 MqttIngestService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。

  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
    this.timer = setInterval(() => this.sweepTimeout(), 1000);
    // 把右侧表达式的结果写入 this.timer。 关键字：this＝当前对象实例。
    this.timer.unref();
    // 调用 this.timer.unref，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
    if (this.timer) clearInterval(this.timer);
    // 判断 if (this.timer) clearInterval(this.timer); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  // 契约 §5 第 4 条:扫 sent 超 15s 的置 timeout
  private async sweepTimeout() {
  // 定义方法 sweepTimeout；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问；async＝声明异步函数。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      // ---------- 落审计表 ----------
      // INSERT ... RETURNING idempotency_key：直接拿数据库生成的 UUID 作为 cmdId。
      // 这样 cmdId 由数据库统一生成，避免客户端伪造/重复
      const r = await this.pool.query(
      // 声明 r，初始值由 await this.pool.query( 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
        `UPDATE control_commands
        // 修改数据。 关键字：UPDATE＝修改已有行。
            SET status = 'timeout'
            // 继续当前表达式；这一行的值由外层代码块或调用使用。
          WHERE status = 'sent'
          // 限定处理范围。 关键字：WHERE＝限定目标行。
            AND issued_at < now() - ($1 || ' seconds')::interval
            // 叠加筛选条件。 关键字：AND＝逻辑与。
            RETURNING id`,
            // 返回变更结果。 关键字：RETURNING＝返回变更后的字段。
        [String(CMD_TIMEOUT_SEC)],
        // 开始当前表达式的分组或数组内容。
      );
      // 结束当前函数的参数列表并完成调用。
      if (r.rowCount) {
      // 判断 if (r.rowCount) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        this.logger.warn(`超时 ${r.rowCount} 条 sent 命令 → timeout`);
        // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      }
      // 结束当前对象、函数或条件代码块。
    } catch (e) {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      this.logger.error(`sweepTimeout 失败: ${(e as Error).message}`);
      // 调用 this.logger.error，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  async issue(lineCode: string, body: CommandBody, user: SessionUser) {
  // 定义方法 issue；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    // ---------- 校验 1：参数完整 + 类型在白名单内 ----------
    // 任一不满足就拒绝。**先校验再落库再下发**，绝不能"先发出去再说"
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
    // 判断 if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        ok: false,
        // 设置字段 ok。 关键字：false＝布尔假值。
        error: `deviceId/type 非法;type 白名单: ${[...ALLOWED_TYPES].join('|')}`,
        // 设置字段 error。 关键字：type＝定义类型别名。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
    // ---------- 校验 2：编码必须在数据库中登记 ----------
    // code → id。查不到说明产线/设备没配到系统里，属于配置错误，拒绝下发
    const lineId = this.catalog.lineId(lineCode);
    // 声明 lineId，初始值由 this.catalog.lineId(lineCode) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    const deviceId = this.catalog.deviceId(body.deviceId);
    // 声明 deviceId，初始值由 this.catalog.deviceId(body.deviceId) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    if (lineId === undefined || deviceId === undefined) {
    // 判断 if (lineId === undefined || deviceId === undefined) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值。
      return { ok: false, error: '未知产线或设备编码' };
      // 返回 { ok: false, error: '未知产线或设备编码' } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
    }
    // 结束当前对象、函数或条件代码块。

    // params 值域校验(契约 §3.6):mode_set/conveyor 的 action 必须是枚举值
    const pv = validateParams(body.type, body.params);
    // 声明 pv，初始值由 validateParams(body.type, body.params) 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (!pv.ok) return { ok: false, error: pv.error };
    // 判断 if (!pv.ok) return { ok: false, error: pv.error }; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。

    // operator 从 session 取(契约 §5 第 2 条:严禁信客户端)
    const operator = user?.username || 'unknown';
    // 声明 operator，初始值由 user?.username || 'unknown' 计算得到。 关键字：const＝声明不可重新绑定的变量。
    const userId = await this.resolveUserId(operator);
    // 声明 userId，初始值由 await this.resolveUserId(operator) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。

    const r = await this.pool.query(
    // 声明 r，初始值由 await this.pool.query( 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      `INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)
      // 写入数据。 关键字：INSERT＝写入新行；INTO＝指定写入目标。
       VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,
       // 列出待写入的值。 关键字：VALUES＝给出插入值；RETURNING＝返回变更后的字段。
      [lineId, deviceId, userId, body.type, JSON.stringify(body.params ?? {})],
      // 开始当前表达式的分组或数组内容。 关键字：type＝定义类型别名。
    );
    // 结束当前函数的参数列表并完成调用。
    // 取回生成的 UUID 字符串
    const cmdId = String(r.rows[0].idempotency_key);
    // 声明 cmdId，初始值由 String(r.rows[0].idempotency_key) 计算得到。 关键字：const＝声明不可重新绑定的变量。

    // 契约 §5 第 5 条:全流程落 audit_logs
    // detail 里带 operator —— 机器通道的 operator 是 'ai:feishu:ou_xxx' 这种,
    // 光看 user_id(会兜底成 admin)追不到人,必须把操作者身份写进 detail。
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .query(
      // 调用 .query，把括号中的值作为参数传入。
        `INSERT INTO audit_logs (user_id, action, target, detail)
        // 写入数据。 关键字：INSERT＝写入新行；INTO＝指定写入目标。
         VALUES ($1, 'command:execute', $2, $3::jsonb)`,
         // 列出待写入的值。 关键字：VALUES＝给出插入值。
        [userId, `${body.type} @ ${lineCode}/${body.deviceId}`,
        // 开始当前表达式的分组或数组内容。 关键字：type＝定义类型别名。
         JSON.stringify({ cmdId, params: body.params ?? {}, operator })],
         // 调用 JSON.stringify，把括号中的值作为参数传入。
      )
      // 结束当前集合、分组或调用参数。
      .catch((e) => this.logger.error(`写 audit_logs 失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。

    // ---------- 通过 MQTT 下发到边缘 ----------
    this.mqtt.publishCommand(lineCode, body.deviceId, {
    // 调用 this.mqtt.publishCommand，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      cmdId,
      // 把变量 cmdId 作为同名对象字段加入当前对象。
      ts: Date.now(),
      // 设置字段 ts。
      lineId: lineCode,
      // 设置字段 lineId。
      deviceId: body.deviceId,
      // 设置字段 deviceId。
      type: body.type,
      // 设置字段 type。 关键字：type＝定义类型别名。
      params: body.params ?? {},
      // 设置字段 params。
      operator,
      // 把变量 operator 作为同名对象字段加入当前对象。
    });
    // 结束当前回调或对象，并完成外层函数调用。
    // ---------- 返回给前端 ----------
    // 前端拿 cmdId 后可以查询指令最终状态（acked/rejected/failed）
    return { ok: true, cmdId };
    // 返回 { ok: true, cmdId } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。

  private async resolveUserId(username: string): Promise<number> {
  // 定义方法 resolveUserId；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问；async＝声明异步函数。
    const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
    // 声明 r，初始值由 await this.pool.query('SELECT id FROM users WHERE username = $1', [username]) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
    // 查到了就直接返回
    if (r.rows[0]) return Number(r.rows[0].id);
    // 判断 if (r.rows[0]) return Number(r.rows[0].id); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    // session 有但 DB 没这人 → 兜底 admin;不应发生,只是防御
    const a = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    // 声明 a，初始值由 await this.pool.query(SELECT id FROM users WHERE username = 'admin') 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
    return Number(a.rows[0].id);
    // 返回 Number(a.rows[0].id) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
