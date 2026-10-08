import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from './tokens';

// 产线/设备编码 → 数据库 id 的映射缓存。
// MQTT 报文里只有 code(见数据契约),入库前需要解析为外键 id。
@Injectable()
export class CatalogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CatalogService.name);
  private lines = new Map<string, number>();
  private devices = new Map<string, number>();
  private timer?: NodeJS.Timeout;

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    await this.reload();
    // 每分钟刷新一次;新增产线/设备无需重启服务
    this.timer = setInterval(() => {
      this.reload().catch((e: Error) => this.logger.error(`映射刷新失败: ${e.message}`));
    }, 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async reload() {
    const lines = await this.pool.query('SELECT id, code FROM production_lines');
    const devices = await this.pool.query('SELECT id, code FROM devices');
    this.lines = new Map(lines.rows.map((r) => [String(r.code), Number(r.id)]));
    this.devices = new Map(devices.rows.map((r) => [String(r.code), Number(r.id)]));
    this.logger.log(`编码映射已加载:${this.lines.size} 条产线 / ${this.devices.size} 台设备`);
  }

  lineId(code: string): number | undefined {
    const id = this.lines.get(code);
    if (id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`);
    return id;
  }

  deviceId(code: string): number | undefined {
    const id = this.devices.get(code);
    if (id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`);
    return id;
  }
}
