import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';
import { CatalogService } from '../infra/catalog.service';
import { MqttIngestService } from '../ingest/mqtt-ingest.service';
import type { SessionUser } from '../auth/session-user';
import { ALLOWED_TYPES, validateParams } from './command-contract';

// 白名单与 params 校验表已抽到 command-contract.ts(数据在 command-contract.json,
// AI 的只读 MCP server 共读同一份),此处只消费不重复定义。

// 契约 §5 第 4 条:15s 无 ack 置 timeout
const CMD_TIMEOUT_SEC = 15;

export interface CommandBody {
  deviceId?: string;
  type?: string;
  params?: Record<string, unknown>;
}

@Injectable()
export class CommandService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommandService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly catalog: CatalogService,
    private readonly mqtt: MqttIngestService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.sweepTimeout(), 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // 契约 §5 第 4 条:扫 sent 超 15s 的置 timeout
  private async sweepTimeout() {
    try {
      const r = await this.pool.query(
        `UPDATE control_commands
            SET status = 'timeout'
          WHERE status = 'sent'
            AND issued_at < now() - ($1 || ' seconds')::interval
            RETURNING id`,
        [String(CMD_TIMEOUT_SEC)],
      );
      if (r.rowCount) {
        this.logger.warn(`超时 ${r.rowCount} 条 sent 命令 → timeout`);
      }
    } catch (e) {
      this.logger.error(`sweepTimeout 失败: ${(e as Error).message}`);
    }
  }

  async issue(lineCode: string, body: CommandBody, user: SessionUser) {
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
      return {
        ok: false,
        error: `deviceId/type 非法;type 白名单: ${[...ALLOWED_TYPES].join('|')}`,
      };
    }
    const lineId = this.catalog.lineId(lineCode);
    const deviceId = this.catalog.deviceId(body.deviceId);
    if (lineId === undefined || deviceId === undefined) {
      return { ok: false, error: '未知产线或设备编码' };
    }

    // params 值域校验(契约 §3.6):mode_set/conveyor 的 action 必须是枚举值
    const pv = validateParams(body.type, body.params);
    if (!pv.ok) return { ok: false, error: pv.error };

    // operator 从 session 取(契约 §5 第 2 条:严禁信客户端)
    const operator = user?.username || 'unknown';
    const userId = await this.resolveUserId(operator);

    const r = await this.pool.query(
      `INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)
       VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,
      [lineId, deviceId, userId, body.type, JSON.stringify(body.params ?? {})],
    );
    const cmdId = String(r.rows[0].idempotency_key);

    // 契约 §5 第 5 条:全流程落 audit_logs
    this.pool
      .query(
        `INSERT INTO audit_logs (user_id, action, target, detail)
         VALUES ($1, 'command:execute', $2, $3::jsonb)`,
        [userId, `${body.type} @ ${lineCode}/${body.deviceId}`,
         JSON.stringify({ cmdId, params: body.params ?? {} })],
      )
      .catch((e) => this.logger.error(`写 audit_logs 失败: ${e.message}`));

    this.mqtt.publishCommand(lineCode, body.deviceId, {
      cmdId,
      ts: Date.now(),
      lineId: lineCode,
      deviceId: body.deviceId,
      type: body.type,
      params: body.params ?? {},
      operator,
    });
    return { ok: true, cmdId };
  }

  private async resolveUserId(username: string): Promise<number> {
    const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (r.rows[0]) return Number(r.rows[0].id);
    // session 有但 DB 没这人 → 兜底 admin;不应发生,只是防御
    const a = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    return Number(a.rows[0].id);
  }
}