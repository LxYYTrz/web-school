/**
 // 这一段负责后端历史写入服务，将遥测、状态、事件和回执保存到数据库，为后续代码提供当前文件的处理入口。
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

/**
 * 机器人帧的内存缓冲结构（对应 robot_joint_states 表的一行）。
 * 用 interface 而不是 any，是为了让 TS 在编译期就能查出字段拼写错误。
 */
// 这一段声明 RobotRow，用于RobotRow 的相关数据和行为。
interface RobotRow {
// 定义 RobotRow，约束或实现本模块涉及的数据和行为。
// RobotRow 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  time: Date;
  // 声明或设置 time，用于当前对象或接口的对应数据。
  // time：Python 时间与暂停接口；Date：JavaScript 日期与当前时间 API
  deviceId: number;
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  joints: number[];
  // 声明或设置 joints，用于按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度。
  // joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度
  tcp: number[] | null;
  // 声明或设置 tcp，用于机器人末端位姿数据，无数据时为 null。
  // tcp：机器人末端位姿数据，无数据时为 null
  speedPct: number | null;
  // 声明或设置 speedPct，用于机器人速度百分比。
  // speedPct：机器人速度百分比
  mode: string | null;
  // 声明或设置 mode，用于机器人或设备运行模式。
  // mode：机器人或设备运行模式
  program: string | null;
  // 声明或设置 program，用于机器人当前程序名称。
  // program：机器人当前程序名称
  alarmCode: number;
  // 声明或设置 alarmCode，用于设备报警编号，0 表示无报警。
  // alarmCode：设备报警编号，0 表示无报警
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 RobotRow 的字段或服务能力，供项目其他模块使用。

// 历史数据落库(TimescaleDB)。机器人帧频率高,先缓冲再每秒批量 INSERT;
// 状态/事件频率低,即时写入。
/**
 * 历史数据写入服务。
 */
// 这一段声明 HistoryWriterService，用于后端历史写入服务，将遥测、状态、事件和回执保存到数据库。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class HistoryWriterService implements OnModuleInit, OnModuleDestroy {
// 定义 HistoryWriterService，约束或实现本模块涉及的数据和行为。
// HistoryWriterService：后端历史写入服务，将遥测、状态、事件和回执保存到数据库；OnModuleInit：NestJS 模块初始化回调接口；OnModuleDestroy：NestJS 模块销毁清理回调接口
  private readonly logger = new Logger(HistoryWriterService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；HistoryWriterService：后端历史写入服务，将遥测、状态、事件和回执保存到数据库；name：当前对象的名称字段
  // 机器人帧缓冲队列：高频数据先进这里，攒够 1 秒再批量写
  private robotBuffer: RobotRow[] = [];
  // 声明类属性或构造参数 robotBuffer，类型为 RobotRow[] = []。
  // robotBuffer：本处声明的字段或类型，类型为 RobotRow[]
  // 批量落库的定时器句柄
  private timer?: NodeJS.Timeout;
  // 声明或设置 timer，用于周期任务计时器句柄。
  // timer：周期任务计时器句柄

  /**
   * 构造函数：注入 PG 连接池 + 编码映射服务。
   */
  // 这一段定义 constructor，用于初始化 history-writer.service 使用的实例状态和依赖。
  constructor(
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // constructor 是类实例创建时执行的初始化方法；括号内声明构造参数
    @Inject(PG_POOL) private readonly pool: Pool,
    // 装饰器 Inject：按令牌注入指定依赖。
    // Inject：NestJS 按指定令牌注入依赖的装饰器；PG_POOL：infra/tokens 定义的数据库连接池注入令牌；pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类
    private readonly catalog: CatalogService,
    // 声明类属性或构造参数 catalog，类型为 CatalogService。
    // catalog：产线设备目录服务实例；CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
  // 构造函数只保存参数属性或注入依赖，没有额外的初始化语句
  // 这一段提供了初始化 history-writer.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onModuleInit，用于在模块启动时初始化 history-writer.service 所需的连接、订阅或周期任务。
  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
  // onModuleInit：在模块启动时初始化 history-writer.service 所需的连接、订阅或周期任务
    // 每 1000ms 把缓冲区里的机器人帧批量写入数据库

    // 每秒触发一次 flushRobots()，将这一秒内已经入队的多帧组织成一批写入。
    // 1000 是批量写入触发间隔，不是只保存每秒最后一帧的采样规则；帧先由 bufferRobotFrame() 逐条加入内存。
    // 定时器停止或进程退出前，尚未成功落库的缓冲仍可能丢失。

    this.timer = setInterval(() => this.flushRobots(), 1000);
    // 把右侧表达式的结果写入 this.timer。
    // timer：周期任务计时器句柄；setInterval：按固定间隔重复执行回调并返回计时器句柄；flushRobots：把累计机器人帧批量写入历史表，减少逐帧数据库操作
    // unref：不让定时器吊住进程退出
    this.timer.unref();
    // 使计时器不再单独阻止 Node.js 进程退出。
    // timer：周期任务计时器句柄；unref：使计时器不再单独阻止 Node.js 进程退出
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块启动时初始化 history-writer.service 所需的连接、订阅或周期任务的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 模块销毁钩子：进程退出时清理定时器。
   * （注意：退出时缓冲区里未落库的最后 1 秒数据会丢失，这是当前设计的取舍；
   *   文档 deployment.md 第 6 节提到未来可加本地落盘缓冲补传）
   */
  // 这一段定义 onModuleDestroy，用于在模块关闭时清理 history-writer.service 持有的连接、订阅或计时器。
  onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
  // onModuleDestroy：在模块关闭时清理 history-writer.service 持有的连接、订阅或计时器
    if (this.timer) clearInterval(this.timer);
    // 检查(this.timer) clearInterval(this.timer);，按判断结果进入对应的处理分支。
    // timer：周期任务计时器句柄；clearInterval：停止指定的周期计时器
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块关闭时清理 history-writer.service 持有的连接、订阅或计时器的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 bufferRobotFrame，用于将机器人遥测帧加入内存批量写入队列。

  // 这段把机器人帧整理进历史缓冲，尚未直接写数据库。
  // deviceCode 是外部设备编码，CatalogService 将它对应成内部 deviceId；time、joints 等一起组成一条待保存记录。
  // 目录找不到设备就跳过这一条历史入队，实时推送与 Redis 路径不因此必然停止。
  // 缓冲达到上限时丢弃较早条目，后续 flushRobots() 才执行批量 INSERT。

  bufferRobotFrame(deviceCode: string, msg: any) {
  // 将机器人帧整理为一条待保存历史，加入内存队列，等待定时批量写入。
  // deviceCode 是外部编码，catalog.deviceId() 查内部 id；msg 提供采集时间、joints 等字段，robotBuffer 保存本进程尚待落库的数据。
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
    // 检查(this.robotBuffer.length >= 10000)，按判断结果进入对应的处理分支。
    // robotBuffer：本处声明的字段或类型，类型为 RobotRow[]；length：本处声明的字段或类型，类型为 number
      // 队列达到上限时移除最老一帧，限制当前进程用于历史缓冲的内存占用。
      this.robotBuffer.shift();
      // 取出并移除数组第一个元素。
      // robotBuffer：本处声明的字段或类型，类型为 RobotRow[]；shift：取出并移除数组第一个元素
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // ③ 组装成一行，push 进缓冲
    this.robotBuffer.push({
    // 把时间、内部设备编号和关节等字段组成一条待保存记录，加入当前后端进程的内存队列。
    // robotBuffer 是 HistoryWriterService 的数组；push 是 JavaScript 数组追加方法；msg 提供本帧现场数据，后面的 flushRobots 才执行数据库 INSERT。
      time: toTime(msg),
      // 将报文时间戳转换为数据库可用的时间值。
      // time：Python 时间与暂停接口；toTime：将报文时间戳转换为数据库可用的时间值；msg：当前收到的消息或提示文字
      deviceId,
      // 把变量 deviceId 作为同名对象字段加入当前对象。
      // deviceId：设备标识，接口使用配置中的设备编码
      joints: msg.joints,
      // 声明或设置 joints，用于按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度。
      // joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；msg：当前收到的消息或提示文字
      tcp: Array.isArray(msg.tcp) ? msg.tcp : null,
      // 判断当前值是否为数组，以选择对应的数据处理分支。
      // tcp：机器人末端位姿数据，无数据时为 null；Array：JavaScript 数组辅助 API；isArray：本处声明的字段或类型，类型为 arg is any[]；msg：当前收到的消息或提示文字
      speedPct: msg.speedPct ?? null,
      // 声明或设置 speedPct，用于机器人速度百分比。
      // speedPct：机器人速度百分比；msg：当前收到的消息或提示文字
      mode: msg.mode ?? null,
      // 声明或设置 mode，用于机器人或设备运行模式。
      // mode：机器人或设备运行模式；msg：当前收到的消息或提示文字
      program: msg.program ?? null,
      // 声明或设置 program，用于机器人当前程序名称。
      // program：机器人当前程序名称；msg：当前收到的消息或提示文字
      alarmCode: typeof msg.alarmCode === 'number' ? msg.alarmCode : 0,
      // 声明或设置 alarmCode，用于设备报警编号，0 表示无报警。
      // alarmCode：设备报警编号，0 表示无报警；msg：当前收到的消息或提示文字
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了将机器人遥测帧加入内存批量写入队列的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 把缓冲区里的机器人帧批量写入数据库（由定时器每秒触发一次）。
   * 这是整个服务里最需要理解的函数 —— 重点是"多行 INSERT"的拼装方式。
   */
  // 这一段定义 flushRobots，用于把累计机器人帧批量写入历史表，减少逐帧数据库操作。

  // 从 robotBuffer 取出本批帧，按多行参数化 INSERT 写入 robot_joint_states。
  // values 按每条记录的八个字段排列，tuple 中的 $1 等占位符与该数组逐项对应，每条帧保留自己的时间和设备编号。
  // 当前 splice() 先移出缓冲；异步查询失败会记录错误，未在这里把这一批重新放回队列，因此不能保证失败后自动补齐历史。

  private flushRobots() {
  // 取出本批缓冲帧，组织参数化的多行 INSERT，写入 robot_joint_states。
  // rows 是从 robotBuffer 移出的本批记录；values 保存八字段一组的参数；写入失败不会自动把已移出的这批帧放回原队列。
    // ① splice(0, length) 取出全部并清空缓冲。
    //    注意：必须在取出的瞬间清空，这样新到的帧会进入新的缓冲，
    //    不会和正在写入的这批混淆（避免写入期间数据丢失）
    const rows = this.robotBuffer.splice(0, this.robotBuffer.length);
    // 一次取出当前积累的待保存帧，并从内存缓冲中移除，供下面组装批量 INSERT。
    // splice 是 JavaScript 数组方法，rows 保存本批数据；此时尚未确认数据库写入成功，后续失败分支会记录错误并丢弃该批。
    // 没有数据就直接返回（不发空 SQL）
    if (rows.length === 0) return;
    // 检查(rows.length === 0) return;，按判断结果进入对应的处理分支。
    // rows：数据库查询结果中的记录数组；length：本处声明的字段或类型，类型为 number
    // ② 收集参数值数组（PostgreSQL 占位符 $1 $2 ... 依次对应）
    const values: any[] = [];
    // 声明 values，初始值由 [] 计算得到，供当前处理流程继续使用。
    // values：本处保存 [] 的结果，类型为 any[]
    // ③ 拼 VALUES 子句。每行 8 个字段 → 占位符编号为 i*8+1 .. i*8+8
    const tuple = rows
    // 根据 rows 设置 tuple，供当前流程后续使用。
    // tuple：本处保存 rows .map((r, i) => { const o = i * 8; // 把 8 个字段值按顺序 push 进… 的结果；rows：数据库查询结果中的记录数组
      .map((r, i) => {
      // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
      // map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；r：当前方法接收的参数；i：当前方法接收的参数
        const o = i * 8;
        // 根据 i * 8 设置 o，供当前流程后续使用。
        // o：本处保存 i * 8 的结果；i：当前方法接收的参数
        // 把 8 个字段值按顺序 push 进参数数组
        values.push(r.time, r.deviceId, r.joints, r.tcp, r.speedPct, r.mode, r.program, r.alarmCode);
        // 向数组末尾追加元素。
        // values：本处保存 [] 的结果，类型为 any[]；push：向数组末尾追加元素；r：当前方法接收的参数；time：Python 时间与暂停接口；deviceId：设备标识，接口使用配置中的设备编码；joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；tcp：机器人末端位姿数据，无数据时为 null；speedPct：机器人速度百分比；mode：机器人或设备运行模式；program：机器人当前程序名称；alarmCode：设备报警编号，0 表示无报警
        // 返回这一行的占位符串，如 ($1,$2,...,$8)
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`;
        // 把`($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`作为当前函数的结果返回。
        // o：本处保存 i * 8 的结果
      })
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 本行完成上面一层已说明的函数、分支或对象配置
      .join(',');
      // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
      // join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
    // ④ 拼出最终 SQL：
    //    INSERT INTO 表名(列...) VALUES (一行),(另一行)...
    //    这是 PostgreSQL 的"多行 VALUES"批量插入语法，一条语句插 N 行，
    //    只做一次网络往返、一次 WAL fsync，效率远高于 N 条单行 INSERT。
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。
    // pool：注入或创建的 PostgreSQL 连接池
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
      // query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        `INSERT INTO robot_joint_states
           ("time", device_id, joints, tcp_pose, speed_pct, mode, program, alarm_code)
         VALUES ${tuple}`,
         // 列出待写入的值，供当前处理流程继续使用。
         // tuple：本处保存 rows .map((r, i) => { const o = i * 8; // 把 8 个字段值按顺序 push 进… 的结果
        values,
        // 把变量 values 作为同名对象字段加入当前对象。
        // values：本处保存 [] 的结果，类型为 any[]
      )
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 此处结束当前调用的参数列表，随后使用该调用的返回结果
      // ⑤ 失败只记日志，不抛出。
      //    原因：写历史库失败不该让整个实时链路崩溃（实时快照在 Redis，页面还能看）
      .catch((e: Error) =>
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型
        this.logger.error(`批量写 robot_joint_states 失败,${rows.length} 行丢弃: ${e.message}`),
        // 记录错误日志或显示失败提示，以接收对象为准。
        // logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；rows：数据库查询结果中的记录数组；length：本处声明的字段或类型，类型为 number；e：当前方法接收的参数，类型为 Error；message：消息正文或用于展示的结果说明
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把累计机器人帧批量写入历史表，减少逐帧数据库操作的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 写入产线状态：同时写「当前状态」表和「状态历史」表。
   * @param lineCode 产线编码
   * @param msg      契约定义的 line_status 报文
   */
  // 这一段定义 insertLineStatus，用于把产线状态帧写入历史状态表。

  // 工序状态消息在这里分别维护“当前记录”和“变化历史”，不与机器人关节表混用。
  // 先用产线业务编码取得内部 lineId，再把同一组状态字段用于两条 SQL：当前表按 line_id 更新，历史表追加带时间的新行。
  // 两条查询由代码分别发起并记录错误，没有构成保证同时成功的事务；网页首屏读取的 Redis 快照仍是另一份存储。

  insertLineStatus(lineCode: string, msg: any) {
  // 将一条工序状态分别写成产线当前记录与一条带时间的状态历史。
  // lineCode 先由 CatalogService 对应到内部 lineId；msg 提供状态和产量等字段；两条 SQL 并发发起，没有被这里包成同一事务。
    // ① code → id
    const lineId = this.catalog.lineId(lineCode);
    // 从目录缓存读取产线编码对应的数据库主键，将结果保存或写入 lineId。
    // lineId：产线标识，接口通常使用 line-01 等编码；catalog：产线设备目录服务实例；lineCode：对外使用的产线字符串编码
    if (lineId === undefined) return;
    // 检查(lineId === undefined) return;，按判断结果进入对应的处理分支。
    // lineId：产线标识，接口通常使用 line-01 等编码
    // ② 时间戳
    const t = toTime(msg);
    // 将报文时间戳转换为数据库可用的时间值，将结果保存或写入 t。
    // t：本处保存 toTime(msg) 的结果；toTime：将报文时间戳转换为数据库可用的时间值；msg：当前收到的消息或提示文字
    // ③ 组装参数数组。**注意顺序要和后面的占位符编号严格对应**：
    //    args = [lineId, state, productCode, goodCount, ngCount, beatMs, t]
    //    索引：      1        2       3           4           5        6      7
    const args = [
    // 根据 [ 设置 args，供当前流程后续使用。
    // args：本处保存 [ lineId, msg.state ?? 'idle', msg.productCode ?? null, num(… 的结果
      lineId, msg.state ?? 'idle', msg.productCode ?? null,
      // 索引：      1        2       3           4           5        6      7。
      // lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字；state：当前状态值或实时状态服务实例，以所在对象为准；productCode：当前产品编码
      num(msg.goodCount), num(msg.ngCount), msg.beatMs ?? null, t,
      // 将输入规范化为可接受的数值或空值。
      // num：将输入规范化为可接受的数值或空值；msg：当前收到的消息或提示文字；goodCount：合格品累计数量；ngCount：不合格品累计数量；beatMs：生产节拍，单位毫秒；t：本处保存 toTime(msg) 的结果
    ];
    // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    // 此处结束上方数组的元素列表，并完成赋值或返回语句
    // ④ UPSERT 到「当前状态」表（每产线一行）。
    //    ON CONFLICT (line_id) DO UPDATE：主键冲突时执行 UPDATE 而不是报错。
    //    这就是「幂等写入」—— 重复收到同样的状态只会覆盖，不会插重复行。
    const upsert = this.pool.query(
    // 通过数据库连接池执行参数化查询，将结果保存或写入 upsert。
    // upsert：本处保存 this.pool.query( `INSERT INTO line_current_status (line_id, … 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      `INSERT INTO line_current_status (line_id, state, product_code, good_count, ng_count, beat_ms, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (line_id) DO UPDATE SET
         state = EXCLUDED.state, product_code = EXCLUDED.product_code,
         good_count = EXCLUDED.good_count, ng_count = EXCLUDED.ng_count,
         beat_ms = EXCLUDED.beat_ms, updated_at = EXCLUDED.updated_at`,
         // 把右侧表达式的结果写入 beat_ms。
         // EXCLUDED 表示本次 INSERT 原本准备写入的值，冲突更新时从中取新值
      args,
      // 把变量 args 作为同名对象字段加入当前对象。
      // args：本处保存 [ lineId, msg.state ?? 'idle', msg.productCode ?? null, num(… 的结果
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // ⑤ INSERT 到「状态历史」表（追加，不覆盖，hypertable 按时间分区）。
    //    这里 VALUES 的顺序是 ($7,$1,$2,$3,$4,$5,$6)：
    //    因为表的第一列是 "time"，而时间戳在参数数组里排第 7 位。
    //    ——这是最容易看错的地方，注释标出来。
    const history = this.pool.query(
    // 通过数据库连接池执行参数化查询，将结果保存或写入 history。
    // history：历史写入服务实例；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      `INSERT INTO line_status_history ("time", line_id, state, product_code, good_count, ng_count, beat_ms)
       VALUES ($7,$1,$2,$3,$4,$5,$6)`,
       // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
       // $1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
      args,
      // 把变量 args 作为同名对象字段加入当前对象。
      // args：本处保存 [ lineId, msg.state ?? 'idle', msg.productCode ?? null, num(… 的结果
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // ⑥ 两条语句并发执行，等都完成后再处理错误（任一失败即记日志）
    Promise.all([upsert, history]).catch((e: Error) =>
    // 执行 all 对应的本地处理，使用本行提供的数据。
    // Promise：JavaScript 异步结果类型，表示操作将来完成或失败；all：本处声明的字段或类型，类型为 Promise<Awaited<T>[]>；upsert：本处保存 this.pool.query( `INSERT INTO line_current_status (line_id, … 的结果；history：历史写入服务实例；catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型
      this.logger.error(`写产线状态失败: ${e.message}`),
      // 记录错误日志或显示失败提示，以接收对象为准。
      // logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；e：当前方法接收的参数，类型为 Error；message：消息正文或用于展示的结果说明
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把产线状态帧写入历史状态表的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 写入生产事件（启动/停止/报警/单件完成/换型/自定义）。
   * @param lineCode 产线编码
   * @param msg      契约定义的 event 报文
   */
  // 这一段定义 insertEvent，用于把生产事件写入数据库事件表。
  insertEvent(lineCode: string, msg: any) {
  // 定义方法 insertEvent；括号中声明参数，花括号内实现逻辑。
  // insertEvent：把生产事件写入数据库事件表；lineCode：对外使用的产线字符串编码；msg：当前收到的消息或提示文字
    const lineId = this.catalog.lineId(lineCode);
    // 从目录缓存读取产线编码对应的数据库主键，将结果保存或写入 lineId。
    // lineId：产线标识，接口通常使用 line-01 等编码；catalog：产线设备目录服务实例；lineCode：对外使用的产线字符串编码
    if (lineId === undefined) return;
    // 检查(lineId === undefined) return;，按判断结果进入对应的处理分支。
    // lineId：产线标识，接口通常使用 line-01 等编码
    // ② 事件的设备可能是可选的（产线级事件可能不带 deviceId）
    const deviceId = msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined;
    // 从目录缓存读取设备编码对应的数据库主键，将结果保存或写入 deviceId。
    // deviceId：设备标识，接口使用配置中的设备编码；msg：当前收到的消息或提示文字；catalog：产线设备目录服务实例
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。
    // pool：注入或创建的 PostgreSQL 连接池
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
      // query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        `INSERT INTO production_events ("time", line_id, device_id, type, level, code, message, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
         // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
         // $1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
        [
        // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
        // 方括号内依次列出传给当前调用的数组参数或待保存的数据项
          toTime(msg), lineId, deviceId ?? null, msg.type ?? 'custom', msg.level ?? 'info',
          // 将报文时间戳转换为数据库可用的时间值。
          // toTime：将报文时间戳转换为数据库可用的时间值；msg：当前收到的消息或提示文字；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；level：用户操作级别或事件严重级别，依据当前接口结构区分
          msg.code ?? null, msg.message ?? null, JSON.stringify(msg.payload ?? {}),
          // 把对象编码为 JSON 文本。
          // msg：当前收到的消息或提示文字；code：业务编码、状态码或数据库查询字段，结合所在报文解释；message：消息正文或用于展示的结果说明；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；payload：消息或事件携带的数据内容
        ],
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 此处结束当前数组参数，各元素保持上方列出的顺序
      )
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 此处结束当前调用的参数列表，随后使用该调用的返回结果
      .catch((e: Error) => this.logger.error(`写事件失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把生产事件写入数据库事件表的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 处理控制指令回执（cmd_ack）：更新 control_commands 的状态。
   * @param msg 契约定义的 command_ack 报文 { cmdId, ts, status, message }
   */
  // 这一段定义 ackCommand，用于根据指令编号更新控制审计记录的回执状态。

  // 采集器业务回执到达后，用 msg.cmdId 对应 control_commands.idempotency_key，更新本次命令的状态与完整回执。
  // 只接受 acked、rejected、failed；SQL 还限制原记录必须处于 pending 或 sent，已经进入其他状态的记录不由这条更新覆盖。
  // acked 的现场含义来自采集器写入响应，不是本方法再次验证物理动作完成；数据库更新与网页实时通知也不是同一事务。

  ackCommand(msg: any) {
  // 按回执中的命令编号更新控制记录，保存回执状态、内容和接收时间。
  // msg.cmdId 对应 idempotency_key；只接受 acked、rejected、failed，SQL 同时要求原记录仍为 pending 或 sent，避免覆盖其他终态。
    // ① 没有 cmdId 的回执无法定位指令，直接忽略
    if (!msg.cmdId) return;
    // 检查(!msg.cmdId) return;，按判断结果进入对应的处理分支。
    // msg：当前收到的消息或提示文字；cmdId：控制指令唯一编号，用于关联下发与回执
    // 未知状态不能冒充执行成功；保留原状态，交由超时扫描处理。
    if (!['acked', 'rejected', 'failed'].includes(msg.status)) {
    // 检查(!['acked', 'rejected', 'failed'].includes(msg.status))，按判断结果进入对应的处理分支。
    // includes：判断数组或字符串是否包含指定内容；msg：当前收到的消息或提示文字；status：当前连接、产线、请求或指令的状态字段
      this.logger.warn(`忽略非法指令回执状态: ${String(msg.status)}`);
      // 记录警告日志或显示警告提示，以接收对象为准。
      // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；String：将值转换为文本的 JavaScript 构造函数；msg：当前收到的消息或提示文字；status：当前连接、产线、请求或指令的状态字段
      return;
      // 立即结束当前函数，不返回具体值。
      // 当前函数在此处结束，调用方不会从这条路径收到业务数据
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。
    // pool：注入或创建的 PostgreSQL 连接池
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
      // query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        `UPDATE control_commands
           SET status = $2, ack_payload = $3, acked_at = now()
         WHERE idempotency_key = $1 AND status IN ('pending','sent')`,
         // 执行 IN 对应的本地处理，使用本行提供的数据。
         // $1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
        [String(msg.cmdId), msg.status, JSON.stringify(msg)],
        // 将输入转换为 JavaScript 文本值。
        // String：将值转换为文本的 JavaScript 构造函数；msg：当前收到的消息或提示文字；cmdId：控制指令唯一编号，用于关联下发与回执；status：当前连接、产线、请求或指令的状态字段；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
      )
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 此处结束当前调用的参数列表，随后使用该调用的返回结果
      .then((r) => {
      // 执行 then 对应的本地处理，使用本行提供的数据。
      // then：本处声明的字段或类型，类型为 Promise<TResult1 | TResult2>；r：当前方法接收的参数
        // rowCount === 0 说明没匹配到行：要么 cmdId 未知，要么指令已是终态
        if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);
        // 检查(r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);，按判断结果进入对应的处理分支。
        // r：当前方法接收的参数；rowCount：数据库报告的匹配或变更记录数；logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；msg：当前收到的消息或提示文字；cmdId：控制指令唯一编号，用于关联下发与回执
      })
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 本行完成上面一层已说明的函数、分支或对象配置
      .catch((e: Error) => this.logger.error(`更新指令回执失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了根据指令编号更新控制审计记录的回执状态的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 HistoryWriterService 的字段或服务能力，供项目其他模块使用。

/**
 * 工具函数：从报文里取时间戳。
 * 契约规定 ts 是 Unix 毫秒（由边缘打），所以 new Date(ms)。
 * 如果报文里没有 ts（异常情况），退化为「服务器当前时间」——
 * 宁可时间不精确，也不要让一条数据因为时间缺失而整条丢弃。
 */
// 这一段定义 toTime，用于将报文时间戳转换为数据库可用的时间值。
function toTime(msg: any): Date {
// 定义 toTime，用于将报文时间戳转换为数据库可用的时间值。
// toTime：将报文时间戳转换为数据库可用的时间值；msg：当前收到的消息或提示文字；Date：JavaScript 日期与当前时间 API
  return typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date();
  // 把typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date()作为当前函数的结果返回。
  // msg：当前收到的消息或提示文字；ts：数据产生时的毫秒时间戳；Date：JavaScript 日期与当前时间 API
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了将报文时间戳转换为数据库可用的时间值的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 num，用于将输入规范化为可接受的数值或空值。
function num(v: any): number {
// 定义 num，用于将输入规范化为可接受的数值或空值。
// num：将输入规范化为可接受的数值或空值；v：当前方法接收的参数，类型为 any
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
  // 把typeof v === 'number' && Number.isFinite(v) ? v : 0作为当前函数的结果返回。
  // v：当前方法接收的参数，类型为 any；Number：将值转换为数字的 JavaScript 构造函数；isFinite：本处声明的字段或类型，类型为 boolean
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端历史写入服务，将遥测、状态、事件和回执保存到数据库所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了将输入规范化为可接受的数值或空值的实现；实际结果由运行时输入和执行分支决定。
