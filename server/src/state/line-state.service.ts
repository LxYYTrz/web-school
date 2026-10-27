/**
 // 这一段负责后端实时状态服务，将产线、机器人和 IO 快照存入 Redis，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：实时快照服务（Redis 缓存最新状态）
 * 所属模块：server/src/state/
 * ============================================================================
 *
 * 【它解决什么问题】
 *   浏览器的首屏 / WebSocket 断线重连时，最需要的是「当前这一刻的状态」。
 *   如果让前端等下一帧 MQTT 数据，可能要等 0.1~1 秒；更糟的是：
 *   产线停了（不再发数据）时，前端会永远白屏。
 *   所以后端在收到每帧数据时，顺手把「最新一帧」写进 Redis（带过期时间），
 *   前端首屏直接 REST 拉快照，立刻有画面。
 *
 * 【Redis Key 设计（重要，前端/运维都要懂）】
 *   rt:{lineId}:robot:{deviceId}  → 机器人最新一帧 JSON，TTL 60s
 *   rt:{lineId}:status             → 产线状态 JSON，TTL 120s
 *   rt:{lineId}:edge               → 边缘在线状态 JSON，TTL 300s
 *   前缀 rt = realtime；三级结构便于按产线批量查找（keys 'rt:line-01:robot:*'）
 *
 * 【TTL 的语义 —— 一个巧妙的设计】
 *   TTL 不是"缓存清理"，而是**数据新鲜度心跳**：
 *   如果产线停了不再上报，机器人帧的 60s TTL 到期后 key 自动消失，
 *   前端再拉快照时 robots 里就没有那台机器人了 —— 后端据此可以判定
 *   "数据停滞"，前端提示用户"数据可能已过期"。这比额外维护心跳协议简单得多。
 *   三种数据 TTL 不同，因为上报频率不同：
 *     机器人帧 10Hz → 60s（允许丢 600 帧仍算新鲜）
 *     产线状态 1Hz  → 120s
 *     边缘状态 极低频(仅连接/断开时) → 300s
 *
 * 【在数据流中的位置】
 *   MQTT ─▶ ingest ─▶ LineStateService.setRobotFrame() ─▶ Redis
 *                                                      └─▶ 浏览器 GET /api/lines/:id/snapshot
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Inject：NestJS 按指定令牌注入依赖的装饰器；Injectable：NestJS 把类注册为可注入服务的装饰器；Logger：NestJS 按模块名称记录日志的工具类
import Redis from 'ioredis';
// 从 ioredis 导入这一行列出的符号，供本文件调用。
// Redis：ioredis 提供的 Redis 客户端类
import { REDIS } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。
// REDIS：infra/tokens 定义的 Redis 客户端注入令牌

// Redis 实时快照:前端首屏/断线重连后直接读这里,不用等下一帧实时数据
/**
 * 产线实时快照服务。
 */
// 这一段声明 LineStateService，用于后端实时状态服务，将产线、机器人和 IO 快照存入 Redis。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class LineStateService {
// 定义 LineStateService，约束或实现本模块涉及的数据和行为。
// LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis
  private readonly logger = new Logger(LineStateService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis；name：当前对象的名称字段

  // 这一段定义 constructor，用于初始化 line-state.service 使用的实例状态和依赖。
  constructor(@Inject(REDIS) private readonly redis: Redis) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // Inject：NestJS 按指定令牌注入依赖的装饰器；REDIS：infra/tokens 定义的 Redis 客户端注入令牌；redis：注入或创建的 Redis 客户端；Redis：ioredis 提供的 Redis 客户端类
  // 这一段提供了初始化 line-state.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // EX 60:超过 60s 没有新帧,快照自动过期 → 前端可据此提示"数据停滞"
  /**
   * 写入机器人最新一帧（TTL 60 秒）。
   * @param lineId   产线编码，如 'line-01'
   * @param deviceId 设备编码，如 'robot-01'
   * @param frame    契约定义的 robot_state 报文对象
   */
  // 这一段定义 setRobotFrame，用于把指定机器人的最新遥测帧存入 Redis 并设置有效期。

  // 本方法保存某条产线中某台机器人的最新整帧，由 MQTT 接入服务的机器人分支调用。
  // lineId、deviceId 组成 Redis key，frame 是整帧业务对象；新写入覆盖同一设备原有 JSON，不逐项追加关节历史。
  // 浏览器首次加载经后端 getLineSnapshot() 取得这份状态；已连接网页的新帧由实时推送独立提供。

  setRobotFrame(lineId: string, deviceId: string, frame: unknown) {
  // 保存指定产线、指定设备的最新机器人整帧，供后续快照接口读取。
  // lineId、deviceId 是业务编码；frame 是接入服务传来的整帧对象；redis key 将二者组合起来，新帧覆盖同一设备旧值。
    // 不 await：这是"热路径"，每 100ms 调一次，不能阻塞 MQTT 消息处理。
    // 写失败只记日志，不能让 Redis 故障拖垮整个实时链路。
    // 参数含义：key, value, 'EX'(设置过期时间), 秒数

    // 将 frame 编码为 JSON，并对该机器人 key 设置 EX 60，即本次成功写入后 60 秒过期。
    // 每次成功 SET 都重新计时，即便关节数值相同也会刷新有效期；当前没有先比较两帧的 ts。
    // key 过期后新快照请求不再取得该旧帧，但不会删除 PostgreSQL 历史或主动清空浏览器已经保留的数据。

    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。
    // redis：注入或创建的 Redis 客户端
      .set(`rt:${lineId}:robot:${deviceId}`, JSON.stringify(frame), 'EX', 60)
      // 把对象编码为 JSON 文本。
      // set：按键写入当前映射、缓存或对象的值；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；frame：当前方法接收的参数，类型为 unknown
      .catch((e: Error) => this.logger.error(`写机器人快照失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把指定机器人的最新遥测帧存入 Redis 并设置有效期的实现；实际结果由运行时输入和执行分支决定。

  // 产线 IO 快照(契约 §3.8)。跟机器人帧一样 EX 60:
  // 超过 60s 没新帧就过期 → 前端能据此提示"数据停滞"而不是卡在旧值上
  // 这一段定义 setIoFrame，用于把产线最新 IO 信号帧存入 Redis 并设置有效期。
  setIoFrame(lineId: string, frame: unknown) {
  // 定义方法 setIoFrame；括号中声明参数，花括号内实现逻辑。
  // setIoFrame：把产线最新 IO 信号帧存入 Redis 并设置有效期；lineId：产线标识，接口通常使用 line-01 等编码；frame：当前方法接收的参数，类型为 unknown
    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。
    // redis：注入或创建的 Redis 客户端
      .set(`rt:${lineId}:io`, JSON.stringify(frame), 'EX', 60)
      // 把对象编码为 JSON 文本。
      // set：按键写入当前映射、缓存或对象的值；lineId：产线标识，接口通常使用 line-01 等编码；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；frame：当前方法接收的参数，类型为 unknown
      .catch((e: Error) => this.logger.error(`写 IO 快照失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把产线最新 IO 信号帧存入 Redis 并设置有效期的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 写入产线状态最新值（TTL 120 秒）。
   * @param lineId 产线编码
   * @param status 契约定义的 line_status 报文对象
   */
  // 这一段定义 setLineStatus，用于把产线最新工序和计数状态存入 Redis 并设置有效期。
  setLineStatus(lineId: string, status: unknown) {
  // 定义方法 setLineStatus；括号中声明参数，花括号内实现逻辑。
  // setLineStatus：把产线最新工序和计数状态存入 Redis 并设置有效期；lineId：产线标识，接口通常使用 line-01 等编码；status：当前连接、产线、请求或指令的状态字段
    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。
    // redis：注入或创建的 Redis 客户端
      .set(`rt:${lineId}:status`, JSON.stringify(status), 'EX', 120)
      // 把对象编码为 JSON 文本。
      // set：按键写入当前映射、缓存或对象的值；lineId：产线标识，接口通常使用 line-01 等编码；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；status：当前连接、产线、请求或指令的状态字段
      .catch((e: Error) => this.logger.error(`写产线状态快照失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把产线最新工序和计数状态存入 Redis 并设置有效期的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 setEdgeStatus，用于更新边缘采集器在线状态缓存。
  setEdgeStatus(lineId: string, status: unknown) {
  // 定义方法 setEdgeStatus；括号中声明参数，花括号内实现逻辑。
  // setEdgeStatus：更新边缘采集器在线状态缓存；lineId：产线标识，接口通常使用 line-01 等编码；status：当前连接、产线、请求或指令的状态字段
    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。
    // redis：注入或创建的 Redis 客户端
      .set(`rt:${lineId}:edge`, JSON.stringify(status), 'EX', 300)
      // 把对象编码为 JSON 文本。
      // set：按键写入当前映射、缓存或对象的值；lineId：产线标识，接口通常使用 line-01 等编码；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；status：当前连接、产线、请求或指令的状态字段
      .catch((e: Error) => this.logger.error(`写边缘状态失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数，类型为 Error；Error：标准错误对象类型；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了更新边缘采集器在线状态缓存的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 getLineSnapshot，用于读取并汇总产线状态、IO、边缘在线信息和机器人最新帧。

  // 快照接口调用本方法，从 Redis 汇总某条产线已经保存的工序、边缘状态、IO 和机器人帧。
  // mget 取得多个状态 key；机器人 key 按 rt:产线:robot:设备 查找，并组装成以设备编码为键的 robots 集合。
  // 返回的 JSON 供网页 preload() 使用。快照组装时刻与各帧自己的 ts 不同，不能用响应刚返回就证明每项现场数据都是新采集的。

  async getLineSnapshot(lineId: string) {
  // 从 Redis 汇总当前产线已有的状态、IO、边缘信息和机器人帧，返回快照对象。
  // lineId 用于组成 key；mget 读取多个状态值，robots 按设备编码组织；浏览器经 SnapshotController 使用结果，不直接访问 Redis。
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      const [status, edge, io] = await this.redis.mget(
      // 一次读取多个 Redis 字符串键。
      // status：当前连接、产线、请求或指令的状态字段；io：现场 IO 信号对象或当前 IO 状态帧；redis：注入或创建的 Redis 客户端；mget：一次读取多个 Redis 字符串键
        `rt:${lineId}:status`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        // lineId：产线标识，接口通常使用 line-01 等编码
        `rt:${lineId}:edge`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        // lineId：产线标识，接口通常使用 line-01 等编码
        `rt:${lineId}:io`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        // lineId：产线标识，接口通常使用 line-01 等编码
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      // ② 找出该产线所有机器人快照的 key。
      //    注意：Redis 的 KEYS 是 O(N) 全库扫描，产线多、实例多时是性能隐患，
      //    未来可改用 SCAN 或维护一个 Set 索引（当前单产线场景可接受）
      const keys = await this.redis.keys(`rt:${lineId}:robot:*`);
      // 取得字典或对象中的所有键，将结果保存或写入 keys。
      // keys：本处保存 await this.redis.keys(`rt:${lineId}:robot:*`) 的结果；redis：注入或创建的 Redis 客户端；lineId：产线标识，接口通常使用 line-01 等编码
      // ③ 批量取出所有值（有 key 才查，避免空数组报错）
      const frames = keys.length ? await this.redis.mget(keys) : [];
      // 一次读取多个 Redis 字符串键，将结果保存或写入 frames。
      // frames：本处保存 keys.length ? await this.redis.mget(keys) : [] 的结果；keys：本处保存 await this.redis.keys(`rt:${lineId}:robot:*`) 的结果；length：本处声明的字段或类型，类型为 number；redis：注入或创建的 Redis 客户端；mget：一次读取多个 Redis 字符串键
      // ④ 拼装成 { deviceId: frame } 的字典
      const robots: Record<string, unknown> = {};
      // 声明 robots，初始值由 {} 计算得到，供当前处理流程继续使用。
      // robots：按设备编码索引的机器人最新遥测集合；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
      keys.forEach((k, i) => {
      // 依次处理数组中的每个元素。
      // keys：本处保存 await this.redis.keys(`rt:${lineId}:robot:*`) 的结果；forEach：依次处理数组中的每个元素；k：当前方法接收的参数；i：当前方法接收的参数
        // key 形如 rt:line-01:robot:robot-01，取最后一段就是 deviceId
        const deviceId = k.split(':').pop() as string;
        // 按分隔符拆分字符串，将结果保存或写入 deviceId。
        // deviceId：设备标识，接口使用配置中的设备编码；k：当前方法接收的参数；split：按分隔符拆分字符串；pop：取出并移除数组最后一个元素
        const raw = frames[i];
        // 根据 frames[i] 设置 raw，供当前流程后续使用。
        // raw：本处保存 frames[i] 的结果；frames：本处保存 keys.length ? await this.redis.mget(keys) : [] 的结果；i：当前方法接收的参数
        robots[deviceId] = raw ? JSON.parse(raw) : null;
        // 将 raw ? JSON.parse(raw) : null 的结果写入 robots[deviceId]。
        // robots：按设备编码索引的机器人最新遥测集合；deviceId：设备标识，接口使用配置中的设备编码；raw：本处保存 frames[i] 的结果；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本
      });
      // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      // ⑤ 组装最终快照。ts 是本次快照的生成时刻（不是数据时刻）
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        lineId,
        // 把变量 lineId 作为同名对象字段加入当前对象。
        // lineId：产线标识，接口通常使用 line-01 等编码
        ts: Date.now(),
        // 取得当前时间戳；Date.now 使用毫秒。
        // ts：数据产生时的毫秒时间戳；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒
        status: status ? JSON.parse(status) : null,
        // 把 JSON 文本解析为数据对象。
        // status：当前连接、产线、请求或指令的状态字段；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本
        edge: edge ? JSON.parse(edge) : null,
        // 把 JSON 文本解析为数据对象。
        // JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本
        io: io ? JSON.parse(io) : null,
        // 把 JSON 文本解析为数据对象。
        // io：现场 IO 信号对象或当前 IO 状态帧；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本
        robots,
        // 把变量 robots 作为同名对象字段加入当前对象。
        // robots：按设备编码索引的机器人最新遥测集合
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    } catch (e) {
    // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
    // e：本处保存的局部数据
      // Redis 异常时不能抛 500 让前端白屏 —— 返回带 error 字段的结构，
      // 前端会静默忽略并等待 WebSocket 的实时数据兜底
      return { lineId, ts: Date.now(), error: (e as Error).message };
      // 把{ lineId, ts: Date.now(), error: (e as Error).message }作为当前函数的结果返回。
      // lineId：产线标识，接口通常使用 line-01 等编码；ts：数据产生时的毫秒时间戳；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；error：失败原因或错误对象；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了读取并汇总产线状态、IO、边缘在线信息和机器人最新帧的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端实时状态服务，将产线、机器人和 IO 快照存入 Redis所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 LineStateService 的字段或服务能力，供项目其他模块使用。
