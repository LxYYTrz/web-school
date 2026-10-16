import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { config } from '../config/configuration';
import { PG_POOL } from '../infra/tokens';

/**
 * 图片保留期清理:原图按 VISION_RETENTION_HOURS(默认 24h)到期删除。
 *
 * 存储按天分目录,所以清理分两步:
 *   1. 查 DB 拿到过期的 object_key / thumb_key → unlink 文件
 *   2. 删对应的 vision_images 行
 * 只删**有记录**的文件 —— 避免递归扫目录时误删掉正在上传、或上传成功但入库失败的图。
 * 上传成功入库失败的文件会留孤儿,由人工/后续对账处理,不自动删。
 */
@Injectable()
export class VisionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VisionCleanupService.name);
  private readonly root = path.resolve(config.vision.storageDir);
  private timer?: NodeJS.Timeout;

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    // 启动后先等一轮,别和服务启动抢 PG/磁盘
    this.timer = setTimeout(() => {
      void this.runOnce();
      this.timer = setInterval(
        () => void this.runOnce(),
        config.vision.cleanupIntervalMs,
      );
      this.timer.unref();
    }, 30_000);
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  async runOnce(): Promise<{ files: number; rows: number }> {
    const cutoff = new Date(Date.now() - config.vision.retentionHours * 3600_000);
    try {
      const r = await this.pool.query(
        `SELECT id, object_key, thumb_key
           FROM vision_images
          WHERE created_at < $1
          ORDER BY created_at ASC
          LIMIT 2000`,
        [cutoff],
      );
      let files = 0;
      const ids: number[] = [];
      for (const row of r.rows) {
        ids.push(Number(row.id));
        for (const key of [row.object_key, row.thumb_key]) {
          if (key) files += await this.unlink(key);
        }
      }
      if (ids.length) {
        await this.pool.query('DELETE FROM vision_images WHERE id = ANY($1)', [ids]);
      }
      if (ids.length) {
        this.logger.log(`已清理 ${ids.length} 条记录、${files} 个文件(早于 ${cutoff.toISOString()})`);
      }
      return { files, rows: ids.length };
    } catch (e) {
      this.logger.error(`图片清理失败: ${(e as Error).message}`);
      return { files: 0, rows: 0 };
    }
  }

  /** 只允许删存储根以内的路径 */
  private async unlink(key: string): Promise<number> {
    const p = path.resolve(this.root, key);
    if (p !== this.root && !p.startsWith(this.root + path.sep)) return 0;
    try {
      await fs.unlink(p);
      return 1;
    } catch {
      return 0;   // 本来就不存在,不算失败
    }
  }
}
