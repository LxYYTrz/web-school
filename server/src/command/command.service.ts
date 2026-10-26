/**
 // 这一段负责后端指令服务，执行白名单校验、审计落库和 MQTT 下发，为后续代码提供当前文件的处理入口。
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Inject：NestJS 按指定令牌注入依赖的装饰器；Injectable：NestJS 把类注册为可注入服务的装饰器；Logger：NestJS 按模块名称记录日志的工具类；OnModuleDestroy：NestJS 模块销毁清理回调接口；OnModuleInit：NestJS 模块初始化回调接口
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。
// Pool：pg 驱动提供的 PostgreSQL 连接池类
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌
import { CatalogService } from '../infra/catalog.service';
// 从 ../infra/catalog.service 导入这一行列出的符号，供本文件调用。
// CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键
import { MqttIngestService } from '../ingest/mqtt-ingest.service';
// 从 ../ingest/mqtt-ingest.service 导入这一行列出的符号，供本文件调用。
// MqttIngestService：后端 MQTT 接入服务，订阅上行消息并发布控制指令
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别
import { ALLOWED_TYPES, validateParams } from './command-contract';
// 从 ./command-contract 导入这一行列出的符号，供本文件调用。
// ALLOWED_TYPES：从控制契约加载的合法指令类型集合；validateParams：从 ./command-contract 导入的对象，用于本文件的调用或类型约束

// 白名单与 params 校验表已抽到 command-contract.ts(数据在 command-contract.json,
// AI 的只读 MCP server 共读同一份),此处只消费不重复定义。

// 契约 §5 第 4 条:15s 无 ack 置 timeout
const CMD_TIMEOUT_SEC = 15;
// 根据 15 设置 CMD_TIMEOUT_SEC，供当前流程后续使用。
// CMD_TIMEOUT_SEC：本处保存 15 的结果

/**
 * 指令请求体结构（对应前端 POST 的 JSON Body）。
 */
// 这一段声明 CommandBody，用于后端控制接口的请求体结构，包含设备编码、指令类型和参数。
export interface CommandBody {
// 定义 CommandBody，约束或实现本模块涉及的数据和行为。
// CommandBody：后端控制接口的请求体结构，包含设备编码、指令类型和参数
  deviceId?: string;
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  type?: string;
  // 声明或设置 type，用于当前报文、指令或对象的类别字段。
  // type：当前报文、指令或对象的类别字段
  params?: Record<string, unknown>;
  // 声明或设置 params，用于指令附加参数对象。
  // params：指令附加参数对象；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 CommandBody 的字段或服务能力，供项目其他模块使用。

// 这一段声明 CommandService，用于后端指令服务，执行白名单校验、审计落库和 MQTT 下发。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class CommandService implements OnModuleInit, OnModuleDestroy {
// 定义 CommandService，约束或实现本模块涉及的数据和行为。
// CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发；OnModuleInit：NestJS 模块初始化回调接口；OnModuleDestroy：NestJS 模块销毁清理回调接口
  private readonly logger = new Logger(CommandService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发；name：当前对象的名称字段
  private timer?: NodeJS.Timeout;
  // 声明或设置 timer，用于周期任务计时器句柄。
  // timer：周期任务计时器句柄

  // 这一段定义 constructor，用于初始化 command.service 使用的实例状态和依赖。
  constructor(
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // constructor 是类实例创建时执行的初始化方法；括号内声明构造参数
    @Inject(PG_POOL) private readonly pool: Pool,
    // 装饰器 Inject：按令牌注入指定依赖。
    // Inject：NestJS 按指定令牌注入依赖的装饰器；PG_POOL：infra/tokens 定义的数据库连接池注入令牌；pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类
    private readonly catalog: CatalogService,
    // 声明类属性或构造参数 catalog，类型为 CatalogService。
    // catalog：产线设备目录服务实例；CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键
    private readonly mqtt: MqttIngestService,
    // 声明类属性或构造参数 mqtt，类型为 MqttIngestService。
    // mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令；MqttIngestService：后端 MQTT 接入服务，订阅上行消息并发布控制指令
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
  // 构造函数只保存参数属性或注入依赖，没有额外的初始化语句
  // 这一段提供了初始化 command.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onModuleInit，用于在模块启动时初始化 command.service 所需的连接、订阅或周期任务。
  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
  // onModuleInit：在模块启动时初始化 command.service 所需的连接、订阅或周期任务
    this.timer = setInterval(() => this.sweepTimeout(), 1000);
    // 把右侧表达式的结果写入 this.timer。
    // timer：周期任务计时器句柄；setInterval：按固定间隔重复执行回调并返回计时器句柄；sweepTimeout：将超时仍未收到回执的控制记录标记为 timeout
    this.timer.unref();
    // 使计时器不再单独阻止 Node.js 进程退出。
    // timer：周期任务计时器句柄；unref：使计时器不再单独阻止 Node.js 进程退出
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块启动时初始化 command.service 所需的连接、订阅或周期任务的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onModuleDestroy，用于在模块关闭时清理 command.service 持有的连接、订阅或计时器。
  onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
  // onModuleDestroy：在模块关闭时清理 command.service 持有的连接、订阅或计时器
    if (this.timer) clearInterval(this.timer);
    // 检查(this.timer) clearInterval(this.timer);，按判断结果进入对应的处理分支。
    // timer：周期任务计时器句柄；clearInterval：停止指定的周期计时器
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块关闭时清理 command.service 持有的连接、订阅或计时器的实现；实际结果由运行时输入和执行分支决定。

  // 契约 §5 第 4 条:扫 sent 超 15s 的置 timeout
  // 这一段定义 sweepTimeout，用于将超时仍未收到回执的控制记录标记为 timeout。
  private async sweepTimeout() {
  // 定义方法 sweepTimeout；括号中声明参数，花括号内实现逻辑。
  // sweepTimeout：将超时仍未收到回执的控制记录标记为 timeout
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      // ---------- 落审计表 ----------
      // INSERT ... RETURNING idempotency_key：直接拿数据库生成的 UUID 作为 cmdId。
      // 这样 cmdId 由数据库统一生成，避免客户端伪造/重复
      const r = await this.pool.query(
      // 通过数据库连接池执行参数化查询，将结果保存或写入 r。
      // r：本处保存 await this.pool.query( `UPDATE control_commands SET status =… 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        `UPDATE control_commands
            SET status = 'timeout'
          WHERE status = 'sent'
            AND issued_at < now() - ($1 || ' seconds')::interval
            RETURNING id`,
            // 请求数据库在写入后返回新记录的主键 id。
            // RETURNING id 让 PostgreSQL 返回本次写入记录的主键，供后续审计或关联使用
        [String(CMD_TIMEOUT_SEC)],
        // 将输入转换为 JavaScript 文本值。
        // String：将值转换为文本的 JavaScript 构造函数；CMD_TIMEOUT_SEC：本处保存 15 的结果
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      if (r.rowCount) {
      // 检查(r.rowCount)，按判断结果进入对应的处理分支。
      // r：本处保存 await this.pool.query( `UPDATE control_commands SET status =… 的结果；rowCount：数据库报告的匹配或变更记录数
        this.logger.warn(`超时 ${r.rowCount} 条 sent 命令 → timeout`);
        // 记录警告日志或显示警告提示，以接收对象为准。
        // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；r：本处保存 await this.pool.query( `UPDATE control_commands SET status =… 的结果；rowCount：数据库报告的匹配或变更记录数
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    } catch (e) {
    // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
    // e：本处保存的局部数据
      this.logger.error(`sweepTimeout 失败: ${(e as Error).message}`);
      // 记录错误日志或显示失败提示，以接收对象为准。
      // logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了将超时仍未收到回执的控制记录标记为 timeout的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 issue，用于校验指令和目标设备，写入审计记录并经 MQTT 下发。
  async issue(lineCode: string, body: CommandBody, user: SessionUser) {
  // 定义方法 issue；括号中声明参数，花括号内实现逻辑。
  // issue：校验指令和目标设备，写入审计记录并经 MQTT 下发；lineCode：对外使用的产线字符串编码；body：当前 HTTP 请求或消息的正文；CommandBody：后端控制接口的请求体结构，包含设备编码、指令类型和参数；user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    // ---------- 校验 1：参数完整 + 类型在白名单内 ----------
    // 任一不满足就拒绝。**先校验再落库再下发**，绝不能"先发出去再说"
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
    // 检查(!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type))，按判断结果进入对应的处理分支。
    // body：当前 HTTP 请求或消息的正文；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；ALLOWED_TYPES：从控制契约加载的合法指令类型集合；has：检查集合是否包含指定元素或映射是否存在指定键
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        ok: false,
        // 声明或设置 ok，用于操作是否成功的布尔结果。
        // ok：操作是否成功的布尔结果
        error: `deviceId/type 非法;type 白名单: ${[...ALLOWED_TYPES].join('|')}`,
        // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
        // error：失败原因或错误对象；ALLOWED_TYPES：从控制契约加载的合法指令类型集合；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // ---------- 校验 2：编码必须在数据库中登记 ----------
    // code → id。查不到说明产线/设备没配到系统里，属于配置错误，拒绝下发
    const lineId = this.catalog.lineId(lineCode);
    // 从目录缓存读取产线编码对应的数据库主键，将结果保存或写入 lineId。
    // lineId：产线标识，接口通常使用 line-01 等编码；catalog：产线设备目录服务实例；lineCode：对外使用的产线字符串编码
    const deviceId = this.catalog.deviceId(body.deviceId);
    // 从目录缓存读取设备编码对应的数据库主键，将结果保存或写入 deviceId。
    // deviceId：设备标识，接口使用配置中的设备编码；catalog：产线设备目录服务实例；body：当前 HTTP 请求或消息的正文
    if (lineId === undefined || deviceId === undefined) {
    // 检查(lineId === undefined || deviceId === undefined)，按判断结果进入对应的处理分支。
    // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码
      return { ok: false, error: '未知产线或设备编码' };
      // 把{ ok: false, error: '未知产线或设备编码' }作为当前函数的结果返回。
      // ok：操作是否成功的布尔结果；error：失败原因或错误对象
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    // params 值域校验(契约 §3.6):mode_set/conveyor 的 action 必须是枚举值
    const pv = validateParams(body.type, body.params);
    // 按控制契约校验指令附加参数，将结果保存或写入 pv。
    // pv：本处保存 validateParams(body.type, body.params) 的结果；validateParams：从 ./command-contract 导入的对象，用于本文件的调用或类型约束；body：当前 HTTP 请求或消息的正文；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
    if (!pv.ok) return { ok: false, error: pv.error };
    // 检查(!pv.ok) return { ok: false, error: pv.error };，按判断结果进入对应的处理分支。
    // pv：本处保存 validateParams(body.type, body.params) 的结果；ok：操作是否成功的布尔结果；error：失败原因或错误对象

    // operator 从 session 取(契约 §5 第 2 条:严禁信客户端)
    const operator = user?.username || 'unknown';
    // 根据 user?.username || 'unknown' 设置 operator，供当前流程后续使用。
    // operator：本处保存 user?.username || 'unknown' 的结果；user：当前会话或调用方的用户信息；username：账号用户名
    const userId = await this.resolveUserId(operator);
    // 根据用户名查找用于审计关联的数据库用户主键，将结果保存或写入 userId。
    // userId：本处保存 await this.resolveUserId(operator) 的结果；resolveUserId：根据用户名查找用于审计关联的数据库用户主键；operator：本处保存 user?.username || 'unknown' 的结果

    const r = await this.pool.query(
    // 通过数据库连接池执行参数化查询，将结果保存或写入 r。
    // r：本处保存 await this.pool.query( `INSERT INTO control_commands (line_i… 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      `INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)
       VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,
       // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
       // RETURNING id 让 PostgreSQL 返回本次写入记录的主键，供后续审计或关联使用
      [lineId, deviceId, userId, body.type, JSON.stringify(body.params ?? {})],
      // 把对象编码为 JSON 文本。
      // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；userId：本处保存 await this.resolveUserId(operator) 的结果；body：当前 HTTP 请求或消息的正文；type：当前报文、指令或对象的类别字段；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；params：指令附加参数对象
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // 取回生成的 UUID 字符串
    const cmdId = String(r.rows[0].idempotency_key);
    // 将输入转换为 JavaScript 文本值，将结果保存或写入 cmdId。
    // cmdId：控制指令唯一编号，用于关联下发与回执；String：将值转换为文本的 JavaScript 构造函数；r：本处保存 await this.pool.query( `INSERT INTO control_commands (line_i… 的结果；rows：数据库查询结果中的记录数组；idempotency_key：r.rows[0] 对象上的字段或操作

    // 契约 §5 第 5 条:全流程落 audit_logs
    // detail 里带 operator —— 机器通道的 operator 是 'ai:feishu:ou_xxx' 这种,
    // 光看 user_id(会兜底成 admin)追不到人,必须把操作者身份写进 detail。
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。
    // pool：注入或创建的 PostgreSQL 连接池
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
      // query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        `INSERT INTO audit_logs (user_id, action, target, detail)
         VALUES ($1, 'command:execute', $2, $3::jsonb)`,
         // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
         // $1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
        [userId, `${body.type} @ ${lineCode}/${body.deviceId}`,
        // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
        // userId：本处保存 await this.resolveUserId(operator) 的结果；body：当前 HTTP 请求或消息的正文；type：当前报文、指令或对象的类别字段；lineCode：对外使用的产线字符串编码；deviceId：设备标识，接口使用配置中的设备编码
         JSON.stringify({ cmdId, params: body.params ?? {}, operator })],
         // 把对象编码为 JSON 文本。
         // JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；cmdId：控制指令唯一编号，用于关联下发与回执；params：指令附加参数对象；body：当前 HTTP 请求或消息的正文
      )
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 此处结束当前调用的参数列表，随后使用该调用的返回结果
      .catch((e) => this.logger.error(`写 audit_logs 失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明

    // ---------- 通过 MQTT 下发到边缘 ----------
    this.mqtt.publishCommand(lineCode, body.deviceId, {
    // 把已校验的控制报文发布到目标设备的 MQTT 指令主题。
    // mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令；publishCommand：把已校验的控制报文发布到目标设备的 MQTT 指令主题；lineCode：对外使用的产线字符串编码；body：当前 HTTP 请求或消息的正文；deviceId：设备标识，接口使用配置中的设备编码
      cmdId,
      // 把变量 cmdId 作为同名对象字段加入当前对象。
      // cmdId：控制指令唯一编号，用于关联下发与回执
      ts: Date.now(),
      // 取得当前时间戳；Date.now 使用毫秒。
      // ts：数据产生时的毫秒时间戳；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒
      lineId: lineCode,
      // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
      // lineId：产线标识，接口通常使用 line-01 等编码；lineCode：对外使用的产线字符串编码
      deviceId: body.deviceId,
      // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
      // deviceId：设备标识，接口使用配置中的设备编码；body：当前 HTTP 请求或消息的正文
      type: body.type,
      // 声明或设置 type，用于当前报文、指令或对象的类别字段。
      // type：当前报文、指令或对象的类别字段；body：当前 HTTP 请求或消息的正文
      params: body.params ?? {},
      // 声明或设置 params，用于指令附加参数对象。
      // params：指令附加参数对象；body：当前 HTTP 请求或消息的正文
      operator,
      // 把变量 operator 作为同名对象字段加入当前对象。
      // operator 是上方取得或计算的同名局部值，在此作为返回对象的 operator 属性
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // ---------- 返回给前端 ----------
    // 前端拿 cmdId 后可以查询指令最终状态（acked/rejected/failed）
    return { ok: true, cmdId };
    // 把{ ok: true, cmdId }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；cmdId：控制指令唯一编号，用于关联下发与回执
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了校验指令和目标设备，写入审计记录并经 MQTT 下发的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 resolveUserId，用于根据用户名查找用于审计关联的数据库用户主键。
  private async resolveUserId(username: string): Promise<number> {
  // 定义方法 resolveUserId；括号中声明参数，花括号内实现逻辑。
  // resolveUserId：根据用户名查找用于审计关联的数据库用户主键；username：账号用户名；Promise：JavaScript 异步结果类型，表示操作将来完成或失败
    const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
    // 通过数据库连接池执行参数化查询，将结果保存或写入 r。
    // r：本处保存 await this.pool.query('SELECT id FROM users WHERE username =… 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果；username：账号用户名
    // 查到了就直接返回
    if (r.rows[0]) return Number(r.rows[0].id);
    // 检查(r.rows[0]) return Number(r.rows[0].id);，按判断结果进入对应的处理分支。
    // r：本处保存 await this.pool.query('SELECT id FROM users WHERE username =… 的结果；rows：数据库查询结果中的记录数组；Number：将值转换为数字的 JavaScript 构造函数；id：当前记录或对象的标识
    // session 有但 DB 没这人 → 兜底 admin;不应发生,只是防御
    const a = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    // 通过数据库连接池执行参数化查询，将结果保存或写入 a。
    // a：本处保存 await this.pool.query(`SELECT id FROM users WHERE username =… 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
    return Number(a.rows[0].id);
    // 把Number(a.rows[0].id)作为当前函数的结果返回。
    // Number：将值转换为数字的 JavaScript 构造函数；a：本处保存 await this.pool.query(`SELECT id FROM users WHERE username =… 的结果；rows：数据库查询结果中的记录数组；id：当前记录或对象的标识
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了根据用户名查找用于审计关联的数据库用户主键的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端指令服务，执行白名单校验、审计落库和 MQTT 下发所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 CommandService 的字段或服务能力，供项目其他模块使用。
