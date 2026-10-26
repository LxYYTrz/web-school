/**
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import Redis from 'ioredis';
// 从 ioredis 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { REDIS } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// Redis 实时快照:前端首屏/断线重连后直接读这里,不用等下一帧实时数据
/**
 * 产线实时快照服务。
 */
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class LineStateService {
// 声明 LineStateService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  private readonly logger = new Logger(LineStateService.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。

  constructor(@Inject(REDIS) private readonly redis: Redis) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  // EX 60:超过 60s 没有新帧,快照自动过期 → 前端可据此提示"数据停滞"
  /**
   * 写入机器人最新一帧（TTL 60 秒）。
   * @param lineId   产线编码，如 'line-01'
   * @param deviceId 设备编码，如 'robot-01'
   * @param frame    契约定义的 robot_state 报文对象
   */
  setRobotFrame(lineId: string, deviceId: string, frame: unknown) {
  // 定义方法 setRobotFrame；括号中声明参数，花括号内实现逻辑。 关键字：unknown＝需检查后才能使用的类型。
    // 不 await：这是"热路径"，每 100ms 调一次，不能阻塞 MQTT 消息处理。
    // 写失败只记日志，不能让 Redis 故障拖垮整个实时链路。
    // 参数含义：key, value, 'EX'(设置过期时间), 秒数
    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .set(`rt:${lineId}:robot:${deviceId}`, JSON.stringify(frame), 'EX', 60)
      // 调用 .set，把括号中的值作为参数传入。
      .catch((e: Error) => this.logger.error(`写机器人快照失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  // 产线 IO 快照(契约 §3.8)。跟机器人帧一样 EX 60:
  // 超过 60s 没新帧就过期 → 前端能据此提示"数据停滞"而不是卡在旧值上
  setIoFrame(lineId: string, frame: unknown) {
  // 定义方法 setIoFrame；括号中声明参数，花括号内实现逻辑。 关键字：unknown＝需检查后才能使用的类型。
    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .set(`rt:${lineId}:io`, JSON.stringify(frame), 'EX', 60)
      // 调用 .set，把括号中的值作为参数传入。
      .catch((e: Error) => this.logger.error(`写 IO 快照失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 写入产线状态最新值（TTL 120 秒）。
   * @param lineId 产线编码
   * @param status 契约定义的 line_status 报文对象
   */
  setLineStatus(lineId: string, status: unknown) {
  // 定义方法 setLineStatus；括号中声明参数，花括号内实现逻辑。 关键字：unknown＝需检查后才能使用的类型。
    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .set(`rt:${lineId}:status`, JSON.stringify(status), 'EX', 120)
      // 调用 .set，把括号中的值作为参数传入。
      .catch((e: Error) => this.logger.error(`写产线状态快照失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  setEdgeStatus(lineId: string, status: unknown) {
  // 定义方法 setEdgeStatus；括号中声明参数，花括号内实现逻辑。 关键字：unknown＝需检查后才能使用的类型。
    this.redis
    // 读取 this.redis，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .set(`rt:${lineId}:edge`, JSON.stringify(status), 'EX', 300)
      // 调用 .set，把括号中的值作为参数传入。
      .catch((e: Error) => this.logger.error(`写边缘状态失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  async getLineSnapshot(lineId: string) {
  // 定义方法 getLineSnapshot；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      const [status, edge, io] = await this.redis.mget(
      // 调用 this.redis.mget；括号中的表达式是传入的参数。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
        `rt:${lineId}:status`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用。
        `rt:${lineId}:edge`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用。
        `rt:${lineId}:io`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用。
      );
      // 结束当前函数的参数列表并完成调用。
      // ② 找出该产线所有机器人快照的 key。
      //    注意：Redis 的 KEYS 是 O(N) 全库扫描，产线多、实例多时是性能隐患，
      //    未来可改用 SCAN 或维护一个 Set 索引（当前单产线场景可接受）
      const keys = await this.redis.keys(`rt:${lineId}:robot:*`);
      // 声明 keys，初始值由 await this.redis.keys(rt:${lineId}:robot:*) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      // ③ 批量取出所有值（有 key 才查，避免空数组报错）
      const frames = keys.length ? await this.redis.mget(keys) : [];
      // 声明 frames，初始值由 keys.length ? await this.redis.mget(keys) : [] 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      // ④ 拼装成 { deviceId: frame } 的字典
      const robots: Record<string, unknown> = {};
      // 声明 robots，初始值由 {} 计算得到。 关键字：const＝声明不可重新绑定的变量；unknown＝需检查后才能使用的类型。
      keys.forEach((k, i) => {
      // 调用 keys.forEach，把括号中的值作为参数传入。
        // key 形如 rt:line-01:robot:robot-01，取最后一段就是 deviceId
        const deviceId = k.split(':').pop() as string;
        // 声明 deviceId，初始值由 k.split(':').pop() as string 计算得到。 关键字：const＝声明不可重新绑定的变量。
        const raw = frames[i];
        // 声明 raw，初始值由 frames[i] 计算得到。 关键字：const＝声明不可重新绑定的变量。
        robots[deviceId] = raw ? JSON.parse(raw) : null;
        // 将 raw ? JSON.parse(raw) : null 的结果写入 robots[deviceId]。 关键字：null＝空值。
      });
      // 结束当前回调或对象，并完成外层函数调用。
      // ⑤ 组装最终快照。ts 是本次快照的生成时刻（不是数据时刻）
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        lineId,
        // 把变量 lineId 作为同名对象字段加入当前对象。
        ts: Date.now(),
        // 设置字段 ts。
        status: status ? JSON.parse(status) : null,
        // 设置字段 status。 关键字：null＝空值。
        edge: edge ? JSON.parse(edge) : null,
        // 设置字段 edge。 关键字：null＝空值。
        io: io ? JSON.parse(io) : null,
        // 设置字段 io。 关键字：null＝空值。
        robots,
        // 把变量 robots 作为同名对象字段加入当前对象。
      };
      // 结束当前对象或代码块，并完成这条语句。
    } catch (e) {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      // Redis 异常时不能抛 500 让前端白屏 —— 返回带 error 字段的结构，
      // 前端会静默忽略并等待 WebSocket 的实时数据兜底
      return { lineId, ts: Date.now(), error: (e as Error).message };
      // 返回 { lineId, ts: Date.now(), error: (e as Error).message } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
