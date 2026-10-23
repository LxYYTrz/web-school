/**
 * ============================================================================
 * 文件作用：历史数据落库服务（写 TimescaleDB）
 * 所属模块：server/src/history/
 * ============================================================================
 *
 * 【宏观定位】把"流动的实时数据"变成"可查询的历史"。前端看的是"现在"，
 *   这个服务负责把"过去"存下来：机器人轨迹、产线状态变化、生产事件。
 *
 * 【为什么要"缓冲再批量写"】
 *   机器人关节数据是 10Hz —— 一台机器人每秒 10 帧，10 台机器人就是每秒 100 行。
 *   如果每帧都发一条 INSERT：
 *     × 每条 SQL 都有网络往返 + 事务开销（PostgreSQL 每条语句一个隐式事务）
 *     × 每条 INSERT 都要 fsync WAL → 磁盘 IO 成为瓶颈
 *   所以本服务的策略是：
 *     内存缓冲数组 robotBuffer 收集帧 → 每 1 秒用一条多行 INSERT 批量落库
 *     100 行/秒 = 1 条 SQL/秒，吞吐提升约 100 倍。
 *   状态(1Hz)、事件(事件触发)频率低，直接即时写入，不用缓冲。
 *
 * 【数据写到哪些表】
 *   robot_joint_states  ← 机器人六轴帧（hypertable 时序表）
 *   line_status_history ← 产线状态历史序列（hypertable）
 *   line_current_status ← 产线"当前"状态（普通表，每产线一行，UPSERT）
 *   production_events   ← 事件/报警流（hypertable）
 *   control_commands    ← 指令回执状态更新（见 ackCommand）
 *
 * 【一个关键设计：code → id 的翻译在这里发生】
 *   MQTT 报文里是 "robot-01"（字符串 code），表里 device_id 是外键数字。
 *   翻译由 CatalogService 完成。查不到就**放弃这条数据**（return），
 *   宁可少一条也不能写错外键导致整批插入失败。
 *
 * 【在数据流中的位置】
 *   MQTT ─▶ ingest(MqttIngestService) ─▶ HistoryWriterService ─▶ TimescaleDB
 *                                                │
 *                                                └─▶ 定时器每秒 flushRobots()
 */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';
import { CatalogService } from '../infra/catalog.service';

/**
 * 机器人帧的内存缓冲结构（对应 robot_joint_states 表的一行）。
 * 用 interface 而不是 any，是为了让 TS 在编译期就能查出字段拼写错误。
 */
interface RobotRow {
  time: Date;
  deviceId: number;
  joints: number[];
  tcp: number[] | null;
  speedPct: number | null;
  mode: string | null;
  program: string | null;
  alarmCode: number;
}

// 历史数据落库(TimescaleDB)。机器人帧频率高,先缓冲再每秒批量 INSERT;
// 状态/事件频率低,即时写入。
/**
 * 历史数据写入服务。
 */
@Injectable()
export class HistoryWriterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HistoryWriterService.name);
  // 机器人帧缓冲队列：高频数据先进这里，攒够 1 秒再批量写
  private robotBuffer: RobotRow[] = [];
  // 批量落库的定时器句柄
  private timer?: NodeJS.Timeout;

  /**
   * 构造函数：注入 PG 连接池 + 编码映射服务。
   */
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly catalog: CatalogService,
  ) {}

  onModuleInit() {
    // 每 1000ms 把缓冲区里的机器人帧批量写入数据库
    this.timer = setInterval(() => this.flushRobots(), 1000);
    // unref：不让定时器吊住进程退出
    this.timer.unref();
  }

  /**
   * 模块销毁钩子：进程退出时清理定时器。
   * （注意：退出时缓冲区里未落库的最后 1 秒数据会丢失，这是当前设计的取舍；
   *   文档 deployment.md 第 6 节提到未来可加本地落盘缓冲补传）
   */
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  bufferRobotFrame(deviceCode: string, msg: any) {
    // ① 翻译 code → id。查不到就直接丢弃这条（返回 undefined）
    const deviceId = this.catalog.deviceId(deviceCode);
    if (deviceId === undefined) return;
    // ② 背压保护：缓冲超过 10000 行说明数据库长时间不可用（写库一直在失败）。
    //    此时丢弃**最老**的一帧（shift），保留最新状态。
    //    为什么保新弃旧？因为最新状态信息量最大（实时快照在 Redis 里也还在）。
    //    没有这层保护，缓冲会无限增长直到 OOM 把进程拖死。
    if (this.robotBuffer.length >= 10000) {
      // DB 长时间不可用时的兜底:丢最老的帧防内存暴涨(最新状态仍在 Redis)
      this.robotBuffer.shift();
    }
    // ③ 组装成一行，push 进缓冲
    this.robotBuffer.push({
      time: toTime(msg),
      deviceId,
      joints: msg.joints,
      tcp: Array.isArray(msg.tcp) ? msg.tcp : null,
      speedPct: msg.speedPct ?? null,
      mode: msg.mode ?? null,
      program: msg.program ?? null,
      alarmCode: typeof msg.alarmCode === 'number' ? msg.alarmCode : 0,
    });
  }

  /**
   * 把缓冲区里的机器人帧批量写入数据库（由定时器每秒触发一次）。
   * 这是整个服务里最需要理解的函数 —— 重点是"多行 INSERT"的拼装方式。
   */
  private flushRobots() {
    // ① splice(0, length) 取出全部并清空缓冲。
    //    注意：必须在取出的瞬间清空，这样新到的帧会进入新的缓冲，
    //    不会和正在写入的这批混淆（避免写入期间数据丢失）
    const rows = this.robotBuffer.splice(0, this.robotBuffer.length);
    // 没有数据就直接返回（不发空 SQL）
    if (rows.length === 0) return;
    // ② 收集参数值数组（PostgreSQL 占位符 $1 $2 ... 依次对应）
    const values: any[] = [];
    // ③ 拼 VALUES 子句。每行 8 个字段 → 占位符编号为 i*8+1 .. i*8+8
    const tuple = rows
      .map((r, i) => {
        const o = i * 8;
        // 把 8 个字段值按顺序 push 进参数数组
        values.push(r.time, r.deviceId, r.joints, r.tcp, r.speedPct, r.mode, r.program, r.alarmCode);
        // 返回这一行的占位符串，如 ($1,$2,...,$8)
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`;
      })
      .join(',');
    // ④ 拼出最终 SQL：
    //    INSERT INTO 表名(列...) VALUES (一行),(另一行)...
    //    这是 PostgreSQL 的"多行 VALUES"批量插入语法，一条语句插 N 行，
    //    只做一次网络往返、一次 WAL fsync，效率远高于 N 条单行 INSERT。
    this.pool
      .query(
        `INSERT INTO robot_joint_states
           ("time", device_id, joints, tcp_pose, speed_pct, mode, program, alarm_code)
         VALUES ${tuple}`,
        values,
      )
      // ⑤ 失败只记日志，不抛出。
      //    原因：写历史库失败不该让整个实时链路崩溃（实时快照在 Redis，页面还能看）
      .catch((e: Error) =>
        this.logger.error(`批量写 robot_joint_states 失败,${rows.length} 行丢弃: ${e.message}`),
      );
  }

  /**
   * 写入产线状态：同时写「当前状态」表和「状态历史」表。
   * @param lineCode 产线编码
   * @param msg      契约定义的 line_status 报文
   */
  insertLineStatus(lineCode: string, msg: any) {
    // ① code → id
    const lineId = this.catalog.lineId(lineCode);
    if (lineId === undefined) return;
    // ② 时间戳
    const t = toTime(msg);
    // ③ 组装参数数组。**注意顺序要和后面的占位符编号严格对应**：
    //    args = [lineId, state, productCode, goodCount, ngCount, beatMs, t]
    //    索引：      1        2       3           4           5        6      7
    const args = [
      lineId, msg.state ?? 'idle', msg.productCode ?? null,
      num(msg.goodCount), num(msg.ngCount), msg.beatMs ?? null, t,
    ];
    // ④ UPSERT 到「当前状态」表（每产线一行）。
    //    ON CONFLICT (line_id) DO UPDATE：主键冲突时执行 UPDATE 而不是报错。
    //    这就是「幂等写入」—— 重复收到同样的状态只会覆盖，不会插重复行。
    const upsert = this.pool.query(
      `INSERT INTO line_current_status (line_id, state, product_code, good_count, ng_count, beat_ms, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (line_id) DO UPDATE SET
         state = EXCLUDED.state, product_code = EXCLUDED.product_code,
         good_count = EXCLUDED.good_count, ng_count = EXCLUDED.ng_count,
         beat_ms = EXCLUDED.beat_ms, updated_at = EXCLUDED.updated_at`,
      args,
    );
    // ⑤ INSERT 到「状态历史」表（追加，不覆盖，hypertable 按时间分区）。
    //    这里 VALUES 的顺序是 ($7,$1,$2,$3,$4,$5,$6)：
    //    因为表的第一列是 "time"，而时间戳在参数数组里排第 7 位。
    //    ——这是最容易看错的地方，注释标出来。
    const history = this.pool.query(
      `INSERT INTO line_status_history ("time", line_id, state, product_code, good_count, ng_count, beat_ms)
       VALUES ($7,$1,$2,$3,$4,$5,$6)`,
      args,
    );
    // ⑥ 两条语句并发执行，等都完成后再处理错误（任一失败即记日志）
    Promise.all([upsert, history]).catch((e: Error) =>
      this.logger.error(`写产线状态失败: ${e.message}`),
    );
  }

  /**
   * 写入生产事件（启动/停止/报警/单件完成/换型/自定义）。
   * @param lineCode 产线编码
   * @param msg      契约定义的 event 报文
   */
  insertEvent(lineCode: string, msg: any) {
    const lineId = this.catalog.lineId(lineCode);
    if (lineId === undefined) return;
    // ② 事件的设备可能是可选的（产线级事件可能不带 deviceId）
    const deviceId = msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined;
    this.pool
      .query(
        `INSERT INTO production_events ("time", line_id, device_id, type, level, code, message, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          toTime(msg), lineId, deviceId ?? null, msg.type ?? 'custom', msg.level ?? 'info',
          msg.code ?? null, msg.message ?? null, JSON.stringify(msg.payload ?? {}),
        ],
      )
      .catch((e: Error) => this.logger.error(`写事件失败: ${e.message}`));
  }

  /**
   * 处理控制指令回执（cmd_ack）：更新 control_commands 的状态。
   * @param msg 契约定义的 command_ack 报文 { cmdId, ts, status, message }
   */
  ackCommand(msg: any) {
    // ① 没有 cmdId 的回执无法定位指令，直接忽略
    if (!msg.cmdId) return;
    // 未知状态不能冒充执行成功；保留原状态，交由超时扫描处理。
    if (!['acked', 'rejected', 'failed'].includes(msg.status)) {
      this.logger.warn(`忽略非法指令回执状态: ${String(msg.status)}`);
      return;
    }
    this.pool
      .query(
        `UPDATE control_commands
           SET status = $2, ack_payload = $3, acked_at = now()
         WHERE idempotency_key = $1 AND status IN ('pending','sent')`,
        [String(msg.cmdId), msg.status, JSON.stringify(msg)],
      )
      .then((r) => {
        // rowCount === 0 说明没匹配到行：要么 cmdId 未知，要么指令已是终态
        if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);
      })
      .catch((e: Error) => this.logger.error(`更新指令回执失败: ${e.message}`));
  }
}

/**
 * 工具函数：从报文里取时间戳。
 * 契约规定 ts 是 Unix 毫秒（由边缘打），所以 new Date(ms)。
 * 如果报文里没有 ts（异常情况），退化为「服务器当前时间」——
 * 宁可时间不精确，也不要让一条数据因为时间缺失而整条丢弃。
 */
function toTime(msg: any): Date {
  return typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date();
}

function num(v: any): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
