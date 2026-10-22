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
import Redis from 'ioredis';             // Redis 客户端类型
import { REDIS } from '../infra/tokens'; // Redis 注入令牌

/**
 * 产线实时快照服务。
 */
@Injectable()
export class LineStateService {
  private readonly logger = new Logger(LineStateService.name);

  /**
   * 构造函数：注入全局 Redis 客户端（由 InfraModule 提供）。
   */
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /**
   * 写入机器人最新一帧（TTL 60 秒）。
   * @param lineId   产线编码，如 'line-01'
   * @param deviceId 设备编码，如 'robot-01'
   * @param frame    契约定义的 robot_state 报文对象
   */
  setRobotFrame(lineId: string, deviceId: string, frame: unknown) {
    // 不 await：这是"热路径"，每 100ms 调一次，不能阻塞 MQTT 消息处理。
    // 写失败只记日志，不能让 Redis 故障拖垮整个实时链路。
    // 参数含义：key, value, 'EX'(设置过期时间), 秒数
    this.redis
      .set(`rt:${lineId}:robot:${deviceId}`, JSON.stringify(frame), 'EX', 60)
      .catch((e: Error) => this.logger.error(`写机器人快照失败: ${e.message}`));
  }

  /**
   * 写入产线状态最新值（TTL 120 秒）。
   * @param lineId 产线编码
   * @param status 契约定义的 line_status 报文对象
   */
  setLineStatus(lineId: string, status: unknown) {
    this.redis
      .set(`rt:${lineId}:status`, JSON.stringify(status), 'EX', 120)
      .catch((e: Error) => this.logger.error(`写产线状态快照失败: ${e.message}`));
  }

  /**
   * 写入边缘在线状态（TTL 300 秒）。
   * 注意：这个数据源有两处 —— ① MQTT 的 edge/status 主题（retained + LWT）；
   *   ② 采集器正常下线时不会发消息，靠 MQTT 遗嘱（LWT）由 Broker 代发 offline。
   */
  setEdgeStatus(lineId: string, status: unknown) {
    this.redis
      .set(`rt:${lineId}:edge`, JSON.stringify(status), 'EX', 300)
      .catch((e: Error) => this.logger.error(`写边缘状态失败: ${e.message}`));
  }

  /**
   * 读取整条产线的当前快照（供 REST 接口返回给前端首屏）。
   *
   * 返回结构（与前端 web/src/services/types.ts 的 LineSnapshot 对齐）：
   *   { lineId, ts, status, edge, robots: { [deviceId]: RobotState } }
   */
  async getLineSnapshot(lineId: string) {
    try {
      // ① 一次性取 status 与 edge 两个 key（MGET 比两次 GET 少一次往返）
      const [status, edge] = await this.redis.mget(`rt:${lineId}:status`, `rt:${lineId}:edge`);

      // ② 找出该产线所有机器人快照的 key。
      //    注意：Redis 的 KEYS 是 O(N) 全库扫描，产线多、实例多时是性能隐患，
      //    未来可改用 SCAN 或维护一个 Set 索引（当前单产线场景可接受）
      const keys = await this.redis.keys(`rt:${lineId}:robot:*`);

      // ③ 批量取出所有值（有 key 才查，避免空数组报错）
      const frames = keys.length ? await this.redis.mget(keys) : [];

      // ④ 拼装成 { deviceId: frame } 的字典
      const robots: Record<string, unknown> = {};
      keys.forEach((k, i) => {
        // key 形如 rt:line-01:robot:robot-01，取最后一段就是 deviceId
        const deviceId = k.split(':').pop() as string;
        const raw = frames[i]; // 与 keys 顺序一一对应的值
        robots[deviceId] = raw ? JSON.parse(raw) : null; // 空值统一给 null，前端好判空
      });

      // ⑤ 组装最终快照。ts 是本次快照的生成时刻（不是数据时刻）
      return {
        lineId,
        ts: Date.now(),
        status: status ? JSON.parse(status) : null,
        edge: edge ? JSON.parse(edge) : null,
        robots,
      };
    } catch (e) {
      // Redis 异常时不能抛 500 让前端白屏 —— 返回带 error 字段的结构，
      // 前端会静默忽略并等待 WebSocket 的实时数据兜底
      return { lineId, ts: Date.now(), error: (e as Error).message };
    }
  }
}
