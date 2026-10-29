/**
 * 后端最新状态服务，由 MQTT 接入层写入，由 realtime/snapshot.controller.ts 汇总读取。
 * 先看四种 SET：机器人与 IO 为 60 秒，工序为 120 秒，边缘状态为 300 秒；再看 getLineSnapshot 的汇总。
 * ioredis 负责访问 Redis；本文件规定 key、整帧 JSON 和有效期，不提供关节历史保存或网页实时广播。
 * 过期只影响后续 Redis 读取，不主动清空浏览器已有帧；网页停滞判断由相应页面另行实现。
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../infra/tokens';

// Redis 实时快照:前端首屏/断线重连后直接读这里,不用等下一帧实时数据
/**
 * 产线实时快照服务。
 */
@Injectable()
export class LineStateService {
  private readonly logger = new Logger(LineStateService.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // 接入层将机器人整帧交给这里，写入该产线、设备固定的 Redis key，供后续快照接口读取。
  // 新整帧覆盖旧值并设置 60 秒有效期；frame.ts 当前不先比较，已连接网页的实时推送另外处理。
  setRobotFrame(lineId: string, deviceId: string, frame: unknown) {
    // 不等待本次 Redis 异步写入结束；这里不把调用频率固定成某个现场采集周期。
    // 写失败只记日志，不能让 Redis 故障拖垮整个实时链路。
    // 参数含义：key, value, 'EX'(设置过期时间), 秒数

    // 将 frame 编码为 JSON，并对该机器人 key 设置 EX 60，即本次成功写入后 60 秒过期。
    // 每次成功 SET 都重新计时，即便关节数值相同也会刷新有效期；当前没有先比较两帧的 ts。
    // key 过期后新快照请求不再取得该旧帧，但不会删除 PostgreSQL 历史或主动清空浏览器已经保留的数据。

    this.redis
      .set(`rt:${lineId}:robot:${deviceId}`, JSON.stringify(frame), 'EX', 60)
      // 1. 这行把机器人整帧交给 Redis，set() 来自 ioredis 客户端库。
      // 2. 参数 1 是 key：产线和设备编码组合成固定存储名称。
      // 3. 示例 line-01、robot-01 对应 rt:line-01:robot:robot-01；下一帧使用同一名称，因此覆盖旧整帧。
      // 4. 参数 2 是 value：frame 是对象，JSON.stringify(frame) 将其编码成文本。
      // 5. 参数 3、4 合起来设置有效期：EX 表示按秒，60 表示本次成功 SET 后 60 秒过期。
      // 6. 每次成功写入重新计时，不先比较 frame.ts；角度相同也可以刷新有效期。
      // 7. key 过期影响后续快照读取，不会删除 PostgreSQL 历史，也不会主动清空浏览器已有画面。
      .catch((e: Error) => this.logger.error(`写机器人快照失败: ${e.message}`));
  }

  // IO 分支保存本产线最新 IO 整帧，固定 key 的有效期为 60 秒。
  // 这是 ioredis SET，不写 PostgreSQL；网页的 5 秒停滞提示是 IoView 根据帧时间另算。
  setIoFrame(lineId: string, frame: unknown) {
    this.redis
      .set(`rt:${lineId}:io`, JSON.stringify(frame), 'EX', 60)
      // 1. IO 每条产线使用一个固定 key，value 保存本次 IO 整帧 JSON。
      // 2. EX 60 是 Redis key 有效期；IoView 的 5 秒停滞判断使用帧 ts，属于另一个位置。
      // 3. 例如最后一帧还显示在网页里，后端 key 可以后来过期，两处状态不会因此自动同时清空。
      .catch((e: Error) => this.logger.error(`写 IO 快照失败: ${e.message}`));
  }

  // 工序消息写本产线的最新状态 key，有效期为 120 秒。
  // 工序的数据库当前表和历史表由 HistoryWriterService 分别写，本方法只负责 Redis。
  setLineStatus(lineId: string, status: unknown) {
    this.redis
      .set(`rt:${lineId}:status`, JSON.stringify(status), 'EX', 120)
      .catch((e: Error) => this.logger.error(`写产线状态快照失败: ${e.message}`));
  }

  // 边缘在线状态写本产线的 edge key，有效期为 300 秒。
  // 状态来自采集器在线通知、周期心跳或遗嘱消息；过期影响后续快照读取，不是现场设备动作判定。
  setEdgeStatus(lineId: string, status: unknown) {
    this.redis
      .set(`rt:${lineId}:edge`, JSON.stringify(status), 'EX', 300)
      .catch((e: Error) => this.logger.error(`写边缘状态失败: ${e.message}`));
  }

  // SnapshotController 为一次 HTTP 请求调用这里，汇总本产线已有的工序、边缘、IO 和机器人值。
  // mget 读取固定 key，机器人按 key 模式收集；返回 JSON 的组装时刻不等于每个字段的采集时刻。
  async getLineSnapshot(lineId: string) {
    try {
      const [status, edge, io] = await this.redis.mget(
      // 1. mget 是 ioredis 的批量字符串读取方法，按下面 key 的顺序返回值数组。
      // 2. 左侧解构把第 1、2、3 个结果分别保存为 status、edge、io。
      // 3. 每个值仍是保存时的 JSON 文本或空值，返回前要分别 JSON.parse。
      // 4. await 等待这次 I/O 的结果再继续组装快照，不会让当前线程同步忙等 Redis。
        `rt:${lineId}:status`,
        `rt:${lineId}:edge`,
        `rt:${lineId}:io`,
      );
      // ② 找出该产线所有机器人快照的 key。
      //    注意：Redis 的 KEYS 是 O(N) 全库扫描，产线多、实例多时是性能隐患，
      //    未来可改用 SCAN 或维护一个 Set 索引（当前单产线场景可接受）
      const keys = await this.redis.keys(`rt:${lineId}:robot:*`);
      // 1. 查找本产线所有机器人快照的存储名称，星号用于 Redis 的 key 模式匹配。
      // 2. 这里是 Redis KEYS，不是 JavaScript Object.keys，也不是 MQTT 主题订阅。
      // 3. 之后 mget 读取这些 key 的值，按设备编码组织成 robots；过期 key 不会提供原来的帧。
      // 4. KEYS 会遍历数据库中的键，当前实现没有在这里改成 SCAN 或额外设备索引。
      const frames = keys.length ? await this.redis.mget(keys) : [];
      // ④ 拼装成 { deviceId: frame } 的字典
      const robots: Record<string, unknown> = {};
      keys.forEach((k, i) => {
      // 依次处理数组中的每个元素。
        // key 形如 rt:line-01:robot:robot-01，取最后一段就是 deviceId
        const deviceId = k.split(':').pop() as string;
        const raw = frames[i];
        robots[deviceId] = raw ? JSON.parse(raw) : null;
        // 1. deviceId 来自该 key 最后一个冒号后的字符串，raw 是同下标读取到的内容。
        // 2. 有文本才解析成对象，否则本项设为 null。
        // 3. 这使 robots 可以按 robot-01 等编码访问；它保存已有状态，不是临时重新读取 PLC。
      });
      // ⑤ 组装最终快照。ts 是本次快照的生成时刻（不是数据时刻）
      return {
        lineId,
        ts: Date.now(),
        // 取得当前时间戳；Date.now 使用毫秒。
        status: status ? JSON.parse(status) : null,
        edge: edge ? JSON.parse(edge) : null,
        io: io ? JSON.parse(io) : null,
        robots,
      };
    } catch (e) {
      // Redis 异常时不能抛 500 让前端白屏 —— 返回带 error 字段的结构，
      // 前端会静默忽略并等待 WebSocket 的实时数据兜底
      return { lineId, ts: Date.now(), error: (e as Error).message };
    }
  }
}
