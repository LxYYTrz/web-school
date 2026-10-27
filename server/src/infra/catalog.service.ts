/**
 // 这一段负责后端产线和设备目录服务，把字符串编码解析为数据库主键，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：产线/设备「编码 → 数据库主键」映射缓存服务
 * 所属模块：server/src/infra/
 * ============================================================================
 *
 * 【它解决什么问题】
 *   数据契约规定：MQTT 报文和主题里用的是**人类可读的编码**（code）：
 *       主题  tl/v1/line-01/telemetry/robot/robot-01
 *       报文  { "deviceId": "robot-01" }
 *   而数据库表用的是**自增主键**（id）：
 *       production_lines(id=1, code='line-01')
 *       devices(id=2, code='robot-01', line_id=1)
 *   写入时必须把 code 换成 id（外键约束要求），所以需要一张映射表。
 *
 * 【为什么用内存 Map 缓存，而不是每次查库】
 *   机器人帧是 10Hz，每一帧都要查一次设备表的话，就是每秒 10 次 × N 个设备的
 *   无意义数据库查询。映射关系几乎不变（产线/设备很少增删），
 *   所以缓存在内存里，每 60 秒刷新一次即可 —— 新增产线无需重启服务。
 *
 * 【生命周期】
 *   onModuleInit   ：服务启动时立即加载一次（避免第一条消息查库）
 *   onModuleDestroy：服务关闭时清掉定时器，防止进程无法退出
 *
 * 【在数据流中的位置】
 *   MQTT 报文 ──(dispatch)──▶ ingest ──▶ history.insertLineStatus()
 *                                            │
 *                                            └──▶ catalog.lineId('line-01') ──▶ 1
 */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Inject：NestJS 按指定令牌注入依赖的装饰器；Injectable：NestJS 把类注册为可注入服务的装饰器；Logger：NestJS 按模块名称记录日志的工具类；OnModuleDestroy：NestJS 模块销毁清理回调接口；OnModuleInit：NestJS 模块初始化回调接口
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。
// Pool：pg 驱动提供的 PostgreSQL 连接池类
import { PG_POOL } from './tokens';
// 从 ./tokens 导入这一行列出的符号，供本文件调用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌

// 产线/设备编码 → 数据库 id 的映射缓存。
// MQTT 报文里只有 code(见数据契约),入库前需要解析为外键 id。
/**
 * 编码映射服务。
 * OnModuleInit / OnModuleDestroy 是 NestJS 的生命周期钩子接口，
 * Nest 会在模块初始化/销毁时自动调用对应方法。
 */
// 这一段声明 CatalogService，用于后端产线和设备目录服务，把字符串编码解析为数据库主键。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class CatalogService implements OnModuleInit, OnModuleDestroy {
// 定义 CatalogService，约束或实现本模块涉及的数据和行为。
// CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键；OnModuleInit：NestJS 模块初始化回调接口；OnModuleDestroy：NestJS 模块销毁清理回调接口
  // NestJS 日志器：会自动带上类名前缀，如 [CatalogService]
  private readonly logger = new Logger(CatalogService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键；name：当前对象的名称字段
  // 产线映射：Map<code, id>，例如 'line-01' → 1
  private lines = new Map<string, number>();
  // 声明或设置 lines，用于当前对象或接口的对应数据。
  // Map：JavaScript 按键保存值的集合
  // 设备映射：Map<code, id>，例如 'robot-01' → 2
  private devices = new Map<string, number>();
  // 声明或设置 devices，用于当前对象或接口的对应数据。
  // Map：JavaScript 按键保存值的集合
  // 定时刷新句柄。类型 NodeJS.Timeout 是因为 setInterval 在 Node 环境下返回它
  // （在浏览器里返回 number，这是 TS 的 lib 差异）
  private timer?: NodeJS.Timeout;
  // 声明或设置 timer，用于周期任务计时器句柄。
  // timer：周期任务计时器句柄

  /**
   * 构造函数：由 Nest 注入 PG 连接池。
   * @Inject(PG_POOL) 显式指定令牌（因为 Pool 是类实例而非注入类）
   */
  // 这一段定义 constructor，用于初始化 catalog.service 使用的实例状态和依赖。
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // Inject：NestJS 按指定令牌注入依赖的装饰器；PG_POOL：infra/tokens 定义的数据库连接池注入令牌；pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类
  // 这一段提供了初始化 catalog.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onModuleInit，用于在模块启动时初始化 catalog.service 所需的连接、订阅或周期任务。
  async onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
  // onModuleInit：在模块启动时初始化 catalog.service 所需的连接、订阅或周期任务
    // 先加载一次：保证服务刚起来就能处理报文，不会因为映射空而丢数据

    // 模块启动时先等待 reload() 载入数据库基础档案，再每 60 秒重新加载映射。
    // 这份目录用于把消息中的 line-01、robot-01 等业务编码对应到数据库内部 id，避免每帧都重复查相同档案。
    // 目录保存在 NestJS 进程的 Map 中，和 Redis 的现场快照是不同位置、不同用途的缓存。

    await this.reload();
    // 重新加载产线和设备编码到主键的目录映射。
    // reload：重新加载产线和设备编码到主键的目录映射
    // 每分钟刷新一次;新增产线/设备无需重启服务
    // 定时刷新：每 60 秒重载一次映射。
    // .catch 兜住异常，避免定时器里的 Promise 变成 unhandled rejection 导致进程崩溃
    this.timer = setInterval(() => {
    // 把右侧表达式的结果写入 this.timer。
    // timer：周期任务计时器句柄；setInterval：按固定间隔重复执行回调并返回计时器句柄
      this.reload().catch((e: Error) => this.logger.error(`映射刷新失败: ${e.message}`));
      // 重新加载产线和设备编码到主键的目录映射。
      // reload：重新加载产线和设备编码到主键的目录映射；catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
    }, 60_000);
    // 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
    // 本行完成上面一层已说明的函数、分支或对象配置
    // unref()：告诉 Node「这个定时器不算活跃句柄」。
    // 好处：即使忘了 clearInterval，进程也能正常退出（不会被定时器吊住）
    this.timer.unref();
    // 使计时器不再单独阻止 Node.js 进程退出。
    // timer：周期任务计时器句柄；unref：使计时器不再单独阻止 Node.js 进程退出
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块启动时初始化 catalog.service 所需的连接、订阅或周期任务的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 模块销毁钩子：进程退出时调用，清理定时器。
   */
  // 这一段定义 onModuleDestroy，用于在模块关闭时清理 catalog.service 持有的连接、订阅或计时器。
  onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
  // onModuleDestroy：在模块关闭时清理 catalog.service 持有的连接、订阅或计时器
    if (this.timer) clearInterval(this.timer);
    // 检查(this.timer) clearInterval(this.timer);，按判断结果进入对应的处理分支。
    // timer：周期任务计时器句柄；clearInterval：停止指定的周期计时器
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块关闭时清理 catalog.service 持有的连接、订阅或计时器的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 reload，用于重新加载产线和设备编码到主键的目录映射。
  async reload() {
  // 定义方法 reload；括号中声明参数，花括号内实现逻辑。
  // reload：重新加载产线和设备编码到主键的目录映射
    // 查产线表：只取 id 和 code 两列

    // 从 production_lines 和 devices 读取 id、code，分别重建产线与设备的 code → id 映射。
    // 例如教学数据 line-01 → 1、robot-01 → 2；实际编号取决于数据库记录，不能根据编码末尾数字推算。
    // 历史写入和命令服务使用这份目录进行关联；调用方遇到查不到的编码时按各自分支返回或放弃该条处理。

    const lines = await this.pool.query('SELECT id, code FROM production_lines');
    // 通过数据库连接池执行参数化查询，将结果保存或写入 lines。
    // lines：本处保存 await this.pool.query('SELECT id, code FROM production_lines… 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
    // 查设备表：只取 id 和 code 两列
    const devices = await this.pool.query('SELECT id, code FROM devices');
    // 通过数据库连接池执行参数化查询，将结果保存或写入 devices。
    // devices：本处保存 await this.pool.query('SELECT id, code FROM devices') 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
    // 把查询结果转成 Map：rows.map(r => [String(r.code), Number(r.id)])
    // String/Number 强制转型 —— pg 返回的 bigint 是字符串，id 是 number
    this.lines = new Map(lines.rows.map((r) => [String(r.code), Number(r.id)]));
    // 把右侧表达式的结果写入 this.lines。
    // lines：this 对象上的字段或操作；Map：JavaScript 按键保存值的集合；rows：数据库查询结果中的记录数组；map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；r：当前方法接收的参数；String：将值转换为文本的 JavaScript 构造函数；code：业务编码、状态码或数据库查询字段，结合所在报文解释；Number：将值转换为数字的 JavaScript 构造函数；id：当前记录或对象的标识
    this.devices = new Map(devices.rows.map((r) => [String(r.code), Number(r.id)]));
    // 把右侧表达式的结果写入 this.devices。
    // devices：this 对象上的字段或操作；Map：JavaScript 按键保存值的集合；rows：数据库查询结果中的记录数组；map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；r：当前方法接收的参数；String：将值转换为文本的 JavaScript 构造函数；code：业务编码、状态码或数据库查询字段，结合所在报文解释；Number：将值转换为数字的 JavaScript 构造函数；id：当前记录或对象的标识
    // 打印加载结果，方便运维确认种子数据是否正确
    this.logger.log(`编码映射已加载:${this.lines.size} 条产线 / ${this.devices.size} 台设备`);
    // 输出调试或运行日志。
    // logger：当前模块的日志记录器；log：输出调试或运行日志；lines：this 对象上的字段或操作；size：本处声明的字段或类型，类型为 number；devices：this 对象上的字段或操作
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了重新加载产线和设备编码到主键的目录映射的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 产线编码 → 数据库主键。
   * 找不到时打 warn 并返回 undefined（调用方负责放弃这条数据，而不是写脏数据）
   */
  // 这一段定义 lineId，用于从目录缓存读取产线编码对应的数据库主键。
  lineId(code: string): number | undefined {
  // 定义方法 lineId；括号中声明参数，花括号内实现逻辑。
  // lineId：产线标识，接口通常使用 line-01 等编码；code：业务编码、状态码或数据库查询字段，结合所在报文解释
    const id = this.lines.get(code);
    // 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 id。
    // id：当前记录或对象的标识；lines：this 对象上的字段或操作；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；code：业务编码、状态码或数据库查询字段，结合所在报文解释
    // 找不到编码通常意味着：① 种子数据没执行；② 现场新增了产线但没同步数据库
    if (id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`);
    // 检查(id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`);，按判断结果进入对应的处理分支。
    // id：当前记录或对象的标识；logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；code：业务编码、状态码或数据库查询字段，结合所在报文解释
    return id;
    // 把id作为当前函数的结果返回。
    // id：当前记录或对象的标识
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了从目录缓存读取产线编码对应的数据库主键的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 设备编码 → 数据库主键。逻辑同 lineId。
   */
  // 这一段定义 deviceId，用于从目录缓存读取设备编码对应的数据库主键。
  deviceId(code: string): number | undefined {
  // 定义方法 deviceId；括号中声明参数，花括号内实现逻辑。
  // deviceId：设备标识，接口使用配置中的设备编码；code：业务编码、状态码或数据库查询字段，结合所在报文解释
    const id = this.devices.get(code);
    // 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 id。
    // id：当前记录或对象的标识；devices：this 对象上的字段或操作；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；code：业务编码、状态码或数据库查询字段，结合所在报文解释
    if (id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`);
    // 检查(id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`);，按判断结果进入对应的处理分支。
    // id：当前记录或对象的标识；logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；code：业务编码、状态码或数据库查询字段，结合所在报文解释
    return id;
    // 把id作为当前函数的结果返回。
    // id：当前记录或对象的标识
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了从目录缓存读取设备编码对应的数据库主键的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端产线和设备目录服务，把字符串编码解析为数据库主键所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 CatalogService 的字段或服务能力，供项目其他模块使用。
