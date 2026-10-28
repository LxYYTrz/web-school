/**
 * 网页控制入口和机器通道共用的后端命令业务服务。
 * issue 按字段/白名单 → 目录编号 → 参数 → 操作人 → 控制记录/cmdId → 异步审计 → MQTT 下发阅读。
 * resolveUserId 查询旧 users 表，找不到用户名时回退 admin；网页登录使用 app.app_users，不能把两表混为一谈。
 * 启动定时器独立运行 sweepTimeout，将超过 15 秒仍为 sent 的记录标记 timeout；这不撤销 PLC 写入。
 * 指令回执由 history/history-writer.service.ts 的 ackCommand 更新；HTTP 返回 ok/cmdId 不等待现场动作完成。
 */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';
import { CatalogService } from '../infra/catalog.service';
import { MqttIngestService } from '../ingest/mqtt-ingest.service';
import type { SessionUser } from '../auth/session-user';
import { ALLOWED_TYPES, validateParams } from './command-contract';

// 白名单与 params 校验表已抽到 command-contract.ts(数据在 command-contract.json,
// AI 的只读 MCP server 共读同一份),此处只消费不重复定义。

// 契约 §5 第 4 条:15s 无 ack 置 timeout
const CMD_TIMEOUT_SEC = 15;

/**
 * 指令请求体结构（对应前端 POST 的 JSON Body）。
 */
export interface CommandBody {
  deviceId?: string;
  type?: string;
  params?: Record<string, unknown>;
}

@Injectable()
export class CommandService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommandService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly catalog: CatalogService,
    private readonly mqtt: MqttIngestService,
  ) {}

  // 后端启动时安排每秒扫描一次长时间没有回执的 sent 记录。
  // 扫描与 HTTP 请求、MQTT 回执回调分别触发，不在每次点击按钮时创建一套扫描器。
  onModuleInit() {
    this.timer = setInterval(() => this.sweepTimeout(), 1000);
    this.timer.unref();
    // 使计时器不再单独阻止 Node.js 进程退出。
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // 将 issued_at 超过 15 秒且仍为 sent 的控制记录标为 timeout。
  // UPDATE RETURNING id 返回本次被更新的记录编号，rowCount 用于日志；这里不创建 cmdId，也不向 PLC 发送撤销。
  private async sweepTimeout() {
    try {
      // 扫描并更新超时记录；创建命令与审计的 INSERT 位于下面 issue() 中。
      // 这里沿用现有命令记录，只改状态，不生成新编号，也不实现现场去重。
      const r = await this.pool.query(
        `UPDATE control_commands
            SET status = 'timeout'
          WHERE status = 'sent'
            AND issued_at < now() - ($1 || ' seconds')::interval
            RETURNING id`,
            // RETURNING id 返回本次更新所匹配的既有记录编号。
            // rowCount 用于报告本批被标记为超时的记录数，不表示设备被停止。
        [String(CMD_TIMEOUT_SEC)],
      );
      if (r.rowCount) {
        this.logger.warn(`超时 ${r.rowCount} 条 sent 命令 → timeout`);
      }
    } catch (e) {
      this.logger.error(`sweepTimeout 失败: ${(e as Error).message}`);
    }
  }

  // 网页和机器控制入口共用本方法，按字段、契约、目录与参数检查后创建指令记录。
  // lineCode/body.deviceId 是外部编码，lineId/deviceId 是数据库内部编号；operator 保留传入的操作人字符串。
  // 记录取得 cmdId 后异步写审计，再交 MqttIngestService.publishCommand；返回时尚未等待 cmd_ack。
  async issue(lineCode: string, body: CommandBody, user: SessionUser) {
    // ---------- 校验 1：参数完整 + 类型在白名单内 ----------
    // 任一不满足就拒绝。**先校验再落库再下发**，绝不能"先发出去再说"
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
    // 先检查目标设备、指令类型是否齐全，并确认类型属于控制契约白名单。
    // body 来自控制入口解析的业务请求；ALLOWED_TYPES 是依据项目控制契约构造的集合，has 是 JavaScript Set 方法；权限已通过也仍需通过这里的业务检查。
      return {
        ok: false,
        error: `deviceId/type 非法;type 白名单: ${[...ALLOWED_TYPES].join('|')}`,
      };
    }
    // ---------- 校验 2：编码必须在数据库中登记 ----------
    // code → id。查不到说明产线/设备没配到系统里，属于配置错误，拒绝下发
    const lineId = this.catalog.lineId(lineCode);
    const deviceId = this.catalog.deviceId(body.deviceId);
    if (lineId === undefined || deviceId === undefined) {
      return { ok: false, error: '未知产线或设备编码' };
    }

    // params 值域校验(契约 §3.6):mode_set/conveyor 的 action 必须是枚举值
    const pv = validateParams(body.type, body.params);
    if (!pv.ok) return { ok: false, error: pv.error };

    // operator 从 session 取(契约 §5 第 2 条:严禁信客户端)
    const operator = user?.username || 'unknown';
    const userId = await this.resolveUserId(operator);

    // 先把这次操作写入 control_commands，保存产线、设备、关联用户、类型、参数，并把初始状态设为 sent。
    // lineId、deviceId、userId 在这条 SQL 中是数据库内部编号，$1～$5 对应下方参数数组，params 编码为 JSON。
    // RETURNING 取回 idempotency_key，后面作为 cmdId 放进 MQTT 消息和 HTTP 响应，让回执与页面等待都找到同一次操作。
    // 编号负责关联记录，当前采集器并没有因此获得持久去重能力，不能把它理解成物理动作恰好执行一次。

    const r = await this.pool.query(
      `INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)
       VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,
       // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
       // RETURNING id 让 PostgreSQL 返回本次写入记录的主键，供后续审计或关联使用
      [lineId, deviceId, userId, body.type, JSON.stringify(body.params ?? {})],
    );
    // 取回生成的 UUID 字符串
    const cmdId = String(r.rows[0].idempotency_key);
    // 取出刚创建的控制记录编号，供 MQTT 命令、网页等待和现场回执关联同一次操作。
    // r 是 INSERT RETURNING 的数据库结果；idempotency_key 由数据库生成；cmdId 是项目用于串联请求与回执的字符串，不单独保证物理动作只执行一次。

    // 契约 §5 第 5 条:全流程落 audit_logs
    // detail 里带 operator —— 机器通道的 operator 是 'ai:feishu:ou_xxx' 这种,
    // 光看 user_id(会兜底成 admin)追不到人,必须把操作者身份写进 detail。

    // 控制记录跟踪命令状态，审计记录说明这次操作相关信息。这里异步发起，失败只写日志。
    // 该查询、控制记录与 MQTT 发布没有组成保证同时成功的事务，不能把命令成功返回当成审计一定已写入。

    this.pool
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
        `INSERT INTO audit_logs (user_id, action, target, detail)
         VALUES ($1, 'command:execute', $2, $3::jsonb)`,
         // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
         // $1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
        [userId, `${body.type} @ ${lineCode}/${body.deviceId}`,
         JSON.stringify({ cmdId, params: body.params ?? {}, operator })],
      )
      .catch((e) => this.logger.error(`写 audit_logs 失败: ${e.message}`));

    // ---------- 通过 MQTT 下发到边缘 ----------
    this.mqtt.publishCommand(lineCode, body.deviceId, {
    // 把通过检查并已建立编号的控制请求交给 MQTT 接入服务发布。
    // mqtt 是项目注入的 MqttIngestService，publishCommand 是项目方法，内部使用 mqtt 库；参数包括产线编码、设备编码和下方组装的 cmdId、type、params 等字段。
      cmdId,
      ts: Date.now(),
      // 取得当前时间戳；Date.now 使用毫秒。
      lineId: lineCode,
      deviceId: body.deviceId,
      type: body.type,
      params: body.params ?? {},
      operator,
      // operator 是上方取得或计算的同名局部值，在此作为返回对象的 operator 属性
    });
    // ---------- 返回给前端 ----------
    // 前端拿 cmdId 后可以查询指令最终状态（acked/rejected/failed）
    return { ok: true, cmdId };
  }

  // 按操作人用户名在旧 users 表查询审计关联 id；未找到时按当前实现取 admin。
  // 这不是网页登录账号验证；app.app_users 与 users 分别存在，不能只看 control_commands.user_id 判断真实操作者。
  private async resolveUserId(username: string): Promise<number> {

    // 登录验证使用 app.app_users，但控制记录 user_id 引用的是 users；本方法处理这两套账号结构间的关联。
    // 先按 operator 的用户名查询 users，找不到则尝试返回 users 中 admin 的 id。
    // 因此 control_commands.user_id 不一定就是登录账号本人，核对操作人还应查看 audit_logs.detail.operator 等信息。

    const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
    // 查到了就直接返回
    if (r.rows[0]) return Number(r.rows[0].id);
    // session 有但 DB 没这人 → 兜底 admin;不应发生,只是防御
    const a = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    return Number(a.rows[0].id);
  }
}
