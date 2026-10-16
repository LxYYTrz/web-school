import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../infra/tokens';

// Redis 实时快照:前端首屏/断线重连后直接读这里,不用等下一帧实时数据
@Injectable()
export class LineStateService {
  private readonly logger = new Logger(LineStateService.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // EX 60:超过 60s 没有新帧,快照自动过期 → 前端可据此提示"数据停滞"
  setRobotFrame(lineId: string, deviceId: string, frame: unknown) {
    this.redis
      .set(`rt:${lineId}:robot:${deviceId}`, JSON.stringify(frame), 'EX', 60)
      .catch((e: Error) => this.logger.error(`写机器人快照失败: ${e.message}`));
  }

  // 产线 IO 快照(契约 §3.8)。跟机器人帧一样 EX 60:
  // 超过 60s 没新帧就过期 → 前端能据此提示"数据停滞"而不是卡在旧值上
  setIoFrame(lineId: string, frame: unknown) {
    this.redis
      .set(`rt:${lineId}:io`, JSON.stringify(frame), 'EX', 60)
      .catch((e: Error) => this.logger.error(`写 IO 快照失败: ${e.message}`));
  }

  setLineStatus(lineId: string, status: unknown) {
    this.redis
      .set(`rt:${lineId}:status`, JSON.stringify(status), 'EX', 120)
      .catch((e: Error) => this.logger.error(`写产线状态快照失败: ${e.message}`));
  }

  setEdgeStatus(lineId: string, status: unknown) {
    this.redis
      .set(`rt:${lineId}:edge`, JSON.stringify(status), 'EX', 300)
      .catch((e: Error) => this.logger.error(`写边缘状态失败: ${e.message}`));
  }

  async getLineSnapshot(lineId: string) {
    try {
      const [status, edge, io] = await this.redis.mget(
        `rt:${lineId}:status`,
        `rt:${lineId}:edge`,
        `rt:${lineId}:io`,
      );
      const keys = await this.redis.keys(`rt:${lineId}:robot:*`);
      const frames = keys.length ? await this.redis.mget(keys) : [];
      const robots: Record<string, unknown> = {};
      keys.forEach((k, i) => {
        const deviceId = k.split(':').pop() as string;
        const raw = frames[i];
        robots[deviceId] = raw ? JSON.parse(raw) : null;
      });
      return {
        lineId,
        ts: Date.now(),
        status: status ? JSON.parse(status) : null,
        edge: edge ? JSON.parse(edge) : null,
        io: io ? JSON.parse(io) : null,
        robots,
      };
    } catch (e) {
      return { lineId, ts: Date.now(), error: (e as Error).message };
    }
  }
}
