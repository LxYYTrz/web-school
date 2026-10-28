/**
 * 后端历史与操作结果写入服务，由 MQTT 接入层按消息类别调用。
 * 机器人帧先 bufferRobotFrame 入内存，再由启动定时器触发 flushRobots 批量写 robot_joint_states。
 * 工序状态分别更新 line_current_status 与追加 line_status_history；事件、边缘状态及命令回执走各自方法。
 * CatalogService 将外部编码转换成数据库内部编号；pg.Pool 执行参数化 SQL。
 * 入队不等于落库；写失败、缓冲上限和进程结束可能造成缺口；各表和实时推送没有统一事务。
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
// RobotRow 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
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

  // 启动时安排每秒一次的批处理触发；机器人帧仍由各次 bufferRobotFrame 逐条加入队列。
  // 计时器调用 flushRobots，把当前积累的多行组织成一次 INSERT，而不是每秒只选最后一帧。
  onModuleInit() {
    // 每 1000ms 把缓冲区里的机器人帧批量写入数据库

    // 每秒触发一次 flushRobots()，将这一秒内已经入队的多帧组织成一批写入。
    // 1000 是批量写入触发间隔，不是只保存每秒最后一帧的采样规则；帧先由 bufferRobotFrame() 逐条加入内存。
    // 定时器停止或进程退出前，尚未成功落库的缓冲仍可能丢失。

    this.timer = setInterval(() => this.flushRobots(), 1000);
    this.timer.unref();
    // 使计时器不再单独阻止 Node.js 进程退出。
  }

  // 停止后续批处理计时；此关闭方法没有额外等待或补写尚未入库的机器人缓冲。
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // 接入层提供设备业务编码和当前帧，先用 CatalogService 找内部 id，再组织历史字段入内存队列。
  // 未知设备会跳过这条历史路径；队列达到上限舍弃最老条目，不能只据此断定数据库故障。
  bufferRobotFrame(deviceCode: string, msg: any) {
    // ① 翻译 code → id。查不到就直接丢弃这条（返回 undefined）
    const deviceId = this.catalog.deviceId(deviceCode);
    // 将消息中的设备业务编码转换成历史表使用的内部设备编号。
    // catalog 是项目的基础目录服务，deviceCode 例如 robot-01；此处 deviceId 是数据库 devices.id，而非消息里的编码字符串。
    if (deviceId === undefined) return;
    // 目录中没有该设备时，结束这一帧的历史入队处理。
    // undefined 表示编码没有匹配的内部编号；这里只跳过历史缓冲路径，不代表其他独立的快照和实时推送也已停止。
    // ② 背压保护：缓冲达到 10000 行时限制队列长度；仅凭队列长度不能断定数据库故障。
    //    此时丢弃**最老**的一帧（shift），保留最新状态。
    //    这项保护会舍弃较早的待保存记录；Redis 快照由另一条独立路径写入，成功情况需分别判断。
    //    没有这层保护，缓冲会无限增长直到 OOM 把进程拖死。
    if (this.robotBuffer.length >= 10000) {
      // 队列达到上限时移除最老一帧，限制当前进程用于历史缓冲的内存占用。
      this.robotBuffer.shift();
      // 取出并移除数组第一个元素。
    }
    // ③ 组装成一行，push 进缓冲
    this.robotBuffer.push({
    // 把时间、内部设备编号和关节等字段组成一条待保存记录，加入当前后端进程的内存队列。
    // robotBuffer 是 HistoryWriterService 的数组；push 是 JavaScript 数组追加方法；msg 提供本帧现场数据，后面的 flushRobots 才执行数据库 INSERT。
      time: toTime(msg),
      // 将报文时间戳转换为数据库可用的时间值。
      deviceId,
      joints: msg.joints,
      tcp: Array.isArray(msg.tcp) ? msg.tcp : null,
      // 判断当前值是否为数组，以选择对应的数据处理分支。
      speedPct: msg.speedPct ?? null,
      mode: msg.mode ?? null,
      program: msg.program ?? null,
      alarmCode: typeof msg.alarmCode === 'number' ? msg.alarmCode : 0,
    });
  }

  // 从 robotBuffer 取出当前整批帧，生成对应的 SQL 占位符和参数数组，再交给 pg.Pool 执行。
  // 每行占 8 个参数，i*8 决定该行的占位偏移；取出后写入失败会记录错误并丢弃本批，没有自动补偿。
  private flushRobots() {
    // ① splice(0, length) 取出全部并清空缓冲。
    //    注意：必须在取出的瞬间清空，这样新到的帧会进入新的缓冲，
    //    不会和正在写入的这批混淆（避免写入期间数据丢失）
    const rows = this.robotBuffer.splice(0, this.robotBuffer.length);
    // 一次取出当前积累的待保存帧，并从内存缓冲中移除，供下面组装批量 INSERT。
    // splice 是 JavaScript 数组方法，rows 保存本批数据；此时尚未确认数据库写入成功，后续失败分支会记录错误并丢弃该批。
    // 没有数据就直接返回（不发空 SQL）
    if (rows.length === 0) return;
    // ② 收集参数值数组（PostgreSQL 占位符 $1 $2 ... 依次对应）
    const values: any[] = [];
    // ③ 拼 VALUES 子句。每行 8 个字段 → 占位符编号为 i*8+1 .. i*8+8
    const tuple = rows
      .map((r, i) => {
      // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
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
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
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

  // 工序消息使用内部产线 id：一条 SQL 更新当前表，另一条追加带时间的历史。
  // 两次查询共用字段参数，但 Promise.all 只是合并等待/错误处理，没有 BEGIN/COMMIT 事务。
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
      // 索引：      1        2       3           4           5        6      7。
      num(msg.goodCount), num(msg.ngCount), msg.beatMs ?? null, t,
      // 将输入规范化为可接受的数值或空值。
    ];
    // 此处结束上方数组的元素列表，并完成赋值或返回语句
    // ④ UPSERT 到「当前状态」表（每产线一行）。
    //    这就是「幂等写入」—— 重复收到同样的状态只会覆盖，不会插重复行。
    const upsert = this.pool.query(
      `INSERT INTO line_current_status (line_id, state, product_code, good_count, ng_count, beat_ms, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (line_id) DO UPDATE SET
         state = EXCLUDED.state, product_code = EXCLUDED.product_code,
         good_count = EXCLUDED.good_count, ng_count = EXCLUDED.ng_count,
         beat_ms = EXCLUDED.beat_ms, updated_at = EXCLUDED.updated_at`,
         // EXCLUDED 表示本次 INSERT 原本准备写入的值，冲突更新时从中取新值
      args,
    );
    // ⑤ INSERT 到「状态历史」表（追加，不覆盖，hypertable 按时间分区）。
    //    这里 VALUES 的顺序是 ($7,$1,$2,$3,$4,$5,$6)：
    //    因为表的第一列是 "time"，而时间戳在参数数组里排第 7 位。
    //    ——这是最容易看错的地方，注释标出来。
    const history = this.pool.query(
      `INSERT INTO line_status_history ("time", line_id, state, product_code, good_count, ng_count, beat_ms)
       VALUES ($7,$1,$2,$3,$4,$5,$6)`,
       // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
       // $1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
      args,
    );
    // ⑥ 两条语句并发执行，等都完成后再处理错误（任一失败即记日志）
    Promise.all([upsert, history]).catch((e: Error) =>
      this.logger.error(`写产线状态失败: ${e.message}`),
    );
  }

  // 将事件的时间、产线、可选设备、级别、文本和附加 payload 追加到 production_events。
  // 产线或设备编码先查目录；事件等级是 info/warning 等业务严重程度，与网页登录 level 无关。
  insertEvent(lineCode: string, msg: any) {
    const lineId = this.catalog.lineId(lineCode);
    if (lineId === undefined) return;
    // ② 事件的设备可能是可选的（产线级事件可能不带 deviceId）
    const deviceId = msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined;
    this.pool
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
        `INSERT INTO production_events ("time", line_id, device_id, type, level, code, message, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
         // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
         // $1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
        [
          toTime(msg), lineId, deviceId ?? null, msg.type ?? 'custom', msg.level ?? 'info',
          // 将报文时间戳转换为数据库可用的时间值。
          msg.code ?? null, msg.message ?? null, JSON.stringify(msg.payload ?? {}),
        ],
      )
      .catch((e: Error) => this.logger.error(`写事件失败: ${e.message}`));
  }

  // 以回执中的 cmdId 找控制记录，保存 acked/rejected/failed 状态、完整回执和接收时间。
  // SQL 只更新 pending、sent；已经 timeout 等终态的行不会被这次更新覆盖，实时广播在接入层另行发起。
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
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
        `UPDATE control_commands
           SET status = $2, ack_payload = $3, acked_at = now()
         WHERE idempotency_key = $1 AND status IN ('pending','sent')`,
         // $1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
        [String(msg.cmdId), msg.status, JSON.stringify(msg)],
      )
      .then((r) => {
        // rowCount === 0 说明没匹配到行：要么 cmdId 未知，要么指令已是终态
        if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);
      })
      .catch((e: Error) => this.logger.error(`更新指令回执失败: ${e.message}`));
  }
}

// 各写入方法共用的时间换算：数值 ts 按毫秒转 Date，否则使用后端当前时间。
// 这是缺失时间字段的回退，不说明现场重新采集过。
function toTime(msg: any): Date {
// 定义 toTime，用于将报文时间戳转换为数据库可用的时间值。
  return typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date();
}

// 工序计数字段入库前，仅保留有限数值，否则使用 0 作为当前写入默认值。
// 默认值不代表现场实际测得 0，需结合采集器是否存在对应点位说明。
function num(v: any): number {
// 定义 num，用于将输入规范化为可接受的数值或空值。
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
