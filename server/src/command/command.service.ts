import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';
import { CatalogService } from '../infra/catalog.service';
import { MqttIngestService } from '../ingest/mqtt-ingest.service';

// 指令白名单,与数据契约一致;不提供任意写寄存器能力
const ALLOWED_TYPES = new Set(['start', 'stop', 'reset', 'changeover']);

export interface CommandBody {
  deviceId?: string;
  type?: string;
  params?: Record<string, unknown>;
  operator?: string;
}

@Injectable()
export class CommandService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly catalog: CatalogService,
    private readonly mqtt: MqttIngestService,
  ) {}

  async issue(lineCode: string, body: CommandBody) {
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
      return { ok: false, error: 'deviceId/type 非法;type 白名单: start|stop|reset|changeover' };
    }
    const lineId = this.catalog.lineId(lineCode);
    const deviceId = this.catalog.deviceId(body.deviceId);
    if (lineId === undefined || deviceId === undefined) {
      return { ok: false, error: '未知产线或设备编码' };
    }

    // 联调阶段操作员从 body 传入;正式版必须从 JWT 中取,绝不信客户端
    const userId = await this.resolveUserId(body.operator);

    const r = await this.pool.query(
      `INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)
       VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,
      [lineId, deviceId, userId, body.type, JSON.stringify(body.params ?? {})],
    );
    const cmdId = String(r.rows[0].idempotency_key);

    this.mqtt.publishCommand(lineCode, body.deviceId, {
      cmdId,
      ts: Date.now(),
      lineId: lineCode,
      deviceId: body.deviceId,
      type: body.type,
      params: body.params ?? {},
      operator: body.operator ?? 'dev',
    });
    return { ok: true, cmdId };
  }

  private async resolveUserId(username?: string): Promise<number> {
    if (username) {
      const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (r.rows[0]) return Number(r.rows[0].id);
    }
    const r = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    return Number(r.rows[0].id);
  }
}
