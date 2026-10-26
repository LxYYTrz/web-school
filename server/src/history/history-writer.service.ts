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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CatalogService } from '../infra/catalog.service';
// 从 ../infra/catalog.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * 机器人帧的内存缓冲结构（对应 robot_joint_states 表的一行）。
 * 用 interface 而不是 any，是为了让 TS 在编译期就能查出字段拼写错误。
 */
interface RobotRow {
// 声明 RobotRow 的结构。 关键字：interface＝定义类型接口。
  time: Date;
  // 设置字段 time。
  deviceId: number;
  // 设置字段 deviceId。
  joints: number[];
  // 设置字段 joints。
  tcp: number[] | null;
  // 设置字段 tcp。 关键字：null＝空值。
  speedPct: number | null;
  // 设置字段 speedPct。 关键字：null＝空值。
  mode: string | null;
  // 设置字段 mode。 关键字：null＝空值。
  program: string | null;
  // 设置字段 program。 关键字：null＝空值。
  alarmCode: number;
  // 设置字段 alarmCode。
}
// 结束当前对象、函数或条件代码块。

// 历史数据落库(TimescaleDB)。机器人帧频率高,先缓冲再每秒批量 INSERT;
// 状态/事件频率低,即时写入。
/**
 * 历史数据写入服务。
 */
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class HistoryWriterService implements OnModuleInit, OnModuleDestroy {
// 声明 HistoryWriterService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  private readonly logger = new Logger(HistoryWriterService.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。
  // 机器人帧缓冲队列：高频数据先进这里，攒够 1 秒再批量写
  private robotBuffer: RobotRow[] = [];
  // 声明类属性或构造参数 robotBuffer，类型为 RobotRow[] = []。 关键字：private＝限定类内部访问。
  // 批量落库的定时器句柄
  private timer?: NodeJS.Timeout;
  // 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：private＝限定类内部访问。

  /**
   * 构造函数：注入 PG 连接池 + 编码映射服务。
   */
  constructor(
  // 调用 constructor，把括号中的值作为参数传入。
    @Inject(PG_POOL) private readonly pool: Pool,
    // 装饰器 Inject：按令牌注入指定依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly catalog: CatalogService,
    // 声明类属性或构造参数 catalog，类型为 CatalogService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。

  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
    // 每 1000ms 把缓冲区里的机器人帧批量写入数据库
    this.timer = setInterval(() => this.flushRobots(), 1000);
    // 把右侧表达式的结果写入 this.timer。 关键字：this＝当前对象实例。
    // unref：不让定时器吊住进程退出
    this.timer.unref();
    // 调用 this.timer.unref，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 模块销毁钩子：进程退出时清理定时器。
   * （注意：退出时缓冲区里未落库的最后 1 秒数据会丢失，这是当前设计的取舍；
   *   文档 deployment.md 第 6 节提到未来可加本地落盘缓冲补传）
   */
  onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
    if (this.timer) clearInterval(this.timer);
    // 判断 if (this.timer) clearInterval(this.timer); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  bufferRobotFrame(deviceCode: string, msg: any) {
  // 定义方法 bufferRobotFrame；括号中声明参数，花括号内实现逻辑。 关键字：any＝跳过静态类型检查。
    // ① 翻译 code → id。查不到就直接丢弃这条（返回 undefined）
    const deviceId = this.catalog.deviceId(deviceCode);
    // 声明 deviceId，初始值由 this.catalog.deviceId(deviceCode) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    if (deviceId === undefined) return;
    // 判断 if (deviceId === undefined) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值；return＝返回结果并结束当前函数。
    // ② 背压保护：缓冲超过 10000 行说明数据库长时间不可用（写库一直在失败）。
    //    此时丢弃**最老**的一帧（shift），保留最新状态。
    //    为什么保新弃旧？因为最新状态信息量最大（实时快照在 Redis 里也还在）。
    //    没有这层保护，缓冲会无限增长直到 OOM 把进程拖死。
    if (this.robotBuffer.length >= 10000) {
    // 判断 if (this.robotBuffer.length >= 10000) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；this＝当前对象实例。
      // DB 长时间不可用时的兜底:丢最老的帧防内存暴涨(最新状态仍在 Redis)
      this.robotBuffer.shift();
      // 调用 this.robotBuffer.shift，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    // ③ 组装成一行，push 进缓冲
    this.robotBuffer.push({
    // 调用 this.robotBuffer.push，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      time: toTime(msg),
      // 设置字段 time。
      deviceId,
      // 把变量 deviceId 作为同名对象字段加入当前对象。
      joints: msg.joints,
      // 设置字段 joints。
      tcp: Array.isArray(msg.tcp) ? msg.tcp : null,
      // 设置字段 tcp。 关键字：null＝空值。
      speedPct: msg.speedPct ?? null,
      // 设置字段 speedPct。 关键字：null＝空值。
      mode: msg.mode ?? null,
      // 设置字段 mode。 关键字：null＝空值。
      program: msg.program ?? null,
      // 设置字段 program。 关键字：null＝空值。
      alarmCode: typeof msg.alarmCode === 'number' ? msg.alarmCode : 0,
      // 设置字段 alarmCode。 关键字：typeof＝读取值的运行时类型。
    });
    // 结束当前回调或对象，并完成外层函数调用。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 把缓冲区里的机器人帧批量写入数据库（由定时器每秒触发一次）。
   * 这是整个服务里最需要理解的函数 —— 重点是"多行 INSERT"的拼装方式。
   */
  private flushRobots() {
  // 定义方法 flushRobots；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问。
    // ① splice(0, length) 取出全部并清空缓冲。
    //    注意：必须在取出的瞬间清空，这样新到的帧会进入新的缓冲，
    //    不会和正在写入的这批混淆（避免写入期间数据丢失）
    const rows = this.robotBuffer.splice(0, this.robotBuffer.length);
    // 声明 rows，初始值由 this.robotBuffer.splice(0, this.robotBuffer.length) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    // 没有数据就直接返回（不发空 SQL）
    if (rows.length === 0) return;
    // 判断 if (rows.length === 0) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    // ② 收集参数值数组（PostgreSQL 占位符 $1 $2 ... 依次对应）
    const values: any[] = [];
    // 声明 values，初始值由 [] 计算得到。 关键字：const＝声明不可重新绑定的变量；any＝跳过静态类型检查。
    // ③ 拼 VALUES 子句。每行 8 个字段 → 占位符编号为 i*8+1 .. i*8+8
    const tuple = rows
    // 声明 tuple，初始值由 rows 计算得到。 关键字：const＝声明不可重新绑定的变量。
      .map((r, i) => {
      // 调用 .map，把括号中的值作为参数传入。
        const o = i * 8;
        // 声明 o，初始值由 i * 8 计算得到。 关键字：const＝声明不可重新绑定的变量。
        // 把 8 个字段值按顺序 push 进参数数组
        values.push(r.time, r.deviceId, r.joints, r.tcp, r.speedPct, r.mode, r.program, r.alarmCode);
        // 调用 values.push，把括号中的值作为参数传入。
        // 返回这一行的占位符串，如 ($1,$2,...,$8)
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`;
        // 返回 ($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8}) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
      })
      // 继续当前表达式；这一行的值由外层代码块或调用使用。
      .join(',');
      // 调用 .join，把括号中的值作为参数传入。
    // ④ 拼出最终 SQL：
    //    INSERT INTO 表名(列...) VALUES (一行),(另一行)...
    //    这是 PostgreSQL 的"多行 VALUES"批量插入语法，一条语句插 N 行，
    //    只做一次网络往返、一次 WAL fsync，效率远高于 N 条单行 INSERT。
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .query(
      // 调用 .query，把括号中的值作为参数传入。
        `INSERT INTO robot_joint_states
        // 写入数据。 关键字：INSERT＝写入新行；INTO＝指定写入目标。
           ("time", device_id, joints, tcp_pose, speed_pct, mode, program, alarm_code)
           // 开始当前表达式的分组或数组内容。
         VALUES ${tuple}`,
         // 列出待写入的值。 关键字：VALUES＝给出插入值。
        values,
        // 把变量 values 作为同名对象字段加入当前对象。
      )
      // 结束当前集合、分组或调用参数。
      // ⑤ 失败只记日志，不抛出。
      //    原因：写历史库失败不该让整个实时链路崩溃（实时快照在 Redis，页面还能看）
      .catch((e: Error) =>
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常。
        this.logger.error(`批量写 robot_joint_states 失败,${rows.length} 行丢弃: ${e.message}`),
        // 调用 this.logger.error，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      );
      // 结束当前函数的参数列表并完成调用。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 写入产线状态：同时写「当前状态」表和「状态历史」表。
   * @param lineCode 产线编码
   * @param msg      契约定义的 line_status 报文
   */
  insertLineStatus(lineCode: string, msg: any) {
  // 定义方法 insertLineStatus；括号中声明参数，花括号内实现逻辑。 关键字：any＝跳过静态类型检查。
    // ① code → id
    const lineId = this.catalog.lineId(lineCode);
    // 声明 lineId，初始值由 this.catalog.lineId(lineCode) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    if (lineId === undefined) return;
    // 判断 if (lineId === undefined) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值；return＝返回结果并结束当前函数。
    // ② 时间戳
    const t = toTime(msg);
    // 声明 t，初始值由 toTime(msg) 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // ③ 组装参数数组。**注意顺序要和后面的占位符编号严格对应**：
    //    args = [lineId, state, productCode, goodCount, ngCount, beatMs, t]
    //    索引：      1        2       3           4           5        6      7
    const args = [
    // 声明 args，初始值由 [ 计算得到。 关键字：const＝声明不可重新绑定的变量。
      lineId, msg.state ?? 'idle', msg.productCode ?? null,
      // 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：null＝空值。
      num(msg.goodCount), num(msg.ngCount), msg.beatMs ?? null, t,
      // 调用 num；括号中的表达式是传入的参数。 关键字：null＝空值。
    ];
    // 继续当前表达式；这一行的值由外层代码块或调用使用。
    // ④ UPSERT 到「当前状态」表（每产线一行）。
    //    ON CONFLICT (line_id) DO UPDATE：主键冲突时执行 UPDATE 而不是报错。
    //    这就是「幂等写入」—— 重复收到同样的状态只会覆盖，不会插重复行。
    const upsert = this.pool.query(
    // 声明 upsert，初始值由 this.pool.query( 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
      `INSERT INTO line_current_status (line_id, state, product_code, good_count, ng_count, beat_ms, updated_at)
      // 写入数据。 关键字：INSERT＝写入新行；INTO＝指定写入目标。
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       // 列出待写入的值。 关键字：VALUES＝给出插入值。
       ON CONFLICT (line_id) DO UPDATE SET
       // 设置连接或冲突条件。 关键字：ON＝指定连接或冲突条件；DO＝执行匿名 SQL 代码块；UPDATE＝修改已有行；SET＝指定更新字段或配置值。
         state = EXCLUDED.state, product_code = EXCLUDED.product_code,
         // 把右侧表达式的结果写入 state。
         good_count = EXCLUDED.good_count, ng_count = EXCLUDED.ng_count,
         // 把右侧表达式的结果写入 good_count。
         beat_ms = EXCLUDED.beat_ms, updated_at = EXCLUDED.updated_at`,
         // 把右侧表达式的结果写入 beat_ms。
      args,
      // 把变量 args 作为同名对象字段加入当前对象。
    );
    // 结束当前函数的参数列表并完成调用。
    // ⑤ INSERT 到「状态历史」表（追加，不覆盖，hypertable 按时间分区）。
    //    这里 VALUES 的顺序是 ($7,$1,$2,$3,$4,$5,$6)：
    //    因为表的第一列是 "time"，而时间戳在参数数组里排第 7 位。
    //    ——这是最容易看错的地方，注释标出来。
    const history = this.pool.query(
    // 声明 history，初始值由 this.pool.query( 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
      `INSERT INTO line_status_history ("time", line_id, state, product_code, good_count, ng_count, beat_ms)
      // 写入数据。 关键字：INSERT＝写入新行；INTO＝指定写入目标。
       VALUES ($7,$1,$2,$3,$4,$5,$6)`,
       // 列出待写入的值。 关键字：VALUES＝给出插入值。
      args,
      // 把变量 args 作为同名对象字段加入当前对象。
    );
    // 结束当前函数的参数列表并完成调用。
    // ⑥ 两条语句并发执行，等都完成后再处理错误（任一失败即记日志）
    Promise.all([upsert, history]).catch((e: Error) =>
    // 调用 Promise.all，把括号中的值作为参数传入。 关键字：catch＝捕获异常。
      this.logger.error(`写产线状态失败: ${e.message}`),
      // 调用 this.logger.error，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    );
    // 结束当前函数的参数列表并完成调用。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 写入生产事件（启动/停止/报警/单件完成/换型/自定义）。
   * @param lineCode 产线编码
   * @param msg      契约定义的 event 报文
   */
  insertEvent(lineCode: string, msg: any) {
  // 定义方法 insertEvent；括号中声明参数，花括号内实现逻辑。 关键字：any＝跳过静态类型检查。
    const lineId = this.catalog.lineId(lineCode);
    // 声明 lineId，初始值由 this.catalog.lineId(lineCode) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    if (lineId === undefined) return;
    // 判断 if (lineId === undefined) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值；return＝返回结果并结束当前函数。
    // ② 事件的设备可能是可选的（产线级事件可能不带 deviceId）
    const deviceId = msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined;
    // 声明 deviceId，初始值由 msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例；undefined＝未定义值。
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .query(
      // 调用 .query，把括号中的值作为参数传入。
        `INSERT INTO production_events ("time", line_id, device_id, type, level, code, message, payload)
        // 写入数据。 关键字：INSERT＝写入新行；INTO＝指定写入目标。
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
         // 列出待写入的值。 关键字：VALUES＝给出插入值。
        [
        // 开始当前表达式的分组或数组内容。
          toTime(msg), lineId, deviceId ?? null, msg.type ?? 'custom', msg.level ?? 'info',
          // 调用 toTime；括号中的表达式是传入的参数。 关键字：null＝空值。
          msg.code ?? null, msg.message ?? null, JSON.stringify(msg.payload ?? {}),
          // 调用 JSON.stringify；括号中的表达式是传入的参数。 关键字：null＝空值。
        ],
        // 结束当前数组，继续外层表达式。
      )
      // 结束当前集合、分组或调用参数。
      .catch((e: Error) => this.logger.error(`写事件失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 处理控制指令回执（cmd_ack）：更新 control_commands 的状态。
   * @param msg 契约定义的 command_ack 报文 { cmdId, ts, status, message }
   */
  ackCommand(msg: any) {
  // 定义方法 ackCommand；括号中声明参数，花括号内实现逻辑。 关键字：any＝跳过静态类型检查。
    // ① 没有 cmdId 的回执无法定位指令，直接忽略
    if (!msg.cmdId) return;
    // 判断 if (!msg.cmdId) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    // 未知状态不能冒充执行成功；保留原状态，交由超时扫描处理。
    if (!['acked', 'rejected', 'failed'].includes(msg.status)) {
    // 判断 if (!['acked', 'rejected', 'failed'].includes(msg.status)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      this.logger.warn(`忽略非法指令回执状态: ${String(msg.status)}`);
      // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      return;
      // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .query(
      // 调用 .query，把括号中的值作为参数传入。
        `UPDATE control_commands
        // 修改数据。 关键字：UPDATE＝修改已有行。
           SET status = $2, ack_payload = $3, acked_at = now()
           // 调用 now；括号中的表达式是传入的参数。
         WHERE idempotency_key = $1 AND status IN ('pending','sent')`,
         // 限定处理范围。 关键字：WHERE＝限定目标行；AND＝逻辑与；IN＝检查是否属于集合。
        [String(msg.cmdId), msg.status, JSON.stringify(msg)],
        // 开始当前表达式的分组或数组内容。
      )
      // 结束当前集合、分组或调用参数。
      .then((r) => {
      // 调用 .then，把括号中的值作为参数传入。
        // rowCount === 0 说明没匹配到行：要么 cmdId 未知，要么指令已是终态
        if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);
        // 判断 if (r.rowCount === 0) this.logger.warn(收到未知 cmdId 的 ack: ${msg.cmdId}); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；this＝当前对象实例。
      })
      // 继续当前表达式；这一行的值由外层代码块或调用使用。
      .catch((e: Error) => this.logger.error(`更新指令回执失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

/**
 * 工具函数：从报文里取时间戳。
 * 契约规定 ts 是 Unix 毫秒（由边缘打），所以 new Date(ms)。
 * 如果报文里没有 ts（异常情况），退化为「服务器当前时间」——
 * 宁可时间不精确，也不要让一条数据因为时间缺失而整条丢弃。
 */
function toTime(msg: any): Date {
// 定义函数 toTime。 关键字：function＝定义函数；any＝跳过静态类型检查。
  return typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date();
  // 返回 typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date() 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；typeof＝读取值的运行时类型；new＝创建对象实例。
}
// 结束当前对象、函数或条件代码块。

function num(v: any): number {
// 定义函数 num。 关键字：function＝定义函数；any＝跳过静态类型检查。
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  // 返回 typeof v === 'number' && Number.isFinite(v) ? v : 0 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；typeof＝读取值的运行时类型。
}
// 结束当前对象、函数或条件代码块。
