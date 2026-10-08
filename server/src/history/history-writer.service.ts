import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';
import { CatalogService } from '../infra/catalog.service';

interface RobotRow {
  time: Date;
  deviceId: number;
  joints: number[];
  tcp: number[] | null;
  speedPct: number | null;
  mode: string | null;
  program: string | null;
  alarmCode: number;
}

// 历史数据落库(TimescaleDB)。机器人帧频率高,先缓冲再每秒批量 INSERT;
// 状态/事件/视觉频率低,即时写入。
@Injectable()
export class HistoryWriterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HistoryWriterService.name);
  private robotBuffer: RobotRow[] = [];
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly catalog: CatalogService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.flushRobots(), 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  bufferRobotFrame(lineCode: string, deviceCode: string, msg: any) {
    const deviceId = this.catalog.deviceId(deviceCode);
    if (deviceId === undefined) return;
    if (this.robotBuffer.length >= 10000) {
      // DB 长时间不可用时的兜底:丢最老的帧防内存暴涨(最新状态仍在 Redis)
      this.robotBuffer.shift();
    }
    this.robotBuffer.push({
      time: toTime(msg),
      deviceId,
      joints: msg.joints,
      tcp: Array.isArray(msg.tcp) ? msg.tcp : null,
      speedPct: msg.speedPct ?? null,
      mode: msg.mode ?? null,
      program: msg.program ?? null,
      alarmCode: typeof msg.alarmCode === 'number' ? msg.alarmCode : 0,
    });
  }

  private flushRobots() {
    const rows = this.robotBuffer.splice(0, this.robotBuffer.length);
    if (rows.length === 0) return;
    const values: any[] = [];
    const tuple = rows
      .map((r, i) => {
        const o = i * 8;
        values.push(r.time, r.deviceId, r.joints, r.tcp, r.speedPct, r.mode, r.program, r.alarmCode);
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`;
      })
      .join(',');
    this.pool
      .query(
        `INSERT INTO robot_joint_states
           ("time", device_id, joints, tcp_pose, speed_pct, mode, program, alarm_code)
         VALUES ${tuple}`,
        values,
      )
      .catch((e: Error) =>
        this.logger.error(`批量写 robot_joint_states 失败,${rows.length} 行丢弃: ${e.message}`),
      );
  }

  insertLineStatus(lineCode: string, msg: any) {
    const lineId = this.catalog.lineId(lineCode);
    if (lineId === undefined) return;
    const t = toTime(msg);
    const args = [
      lineId, msg.state ?? 'idle', msg.productCode ?? null,
      num(msg.goodCount), num(msg.ngCount), msg.beatMs ?? null, t,
    ];
    const upsert = this.pool.query(
      `INSERT INTO line_current_status (line_id, state, product_code, good_count, ng_count, beat_ms, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (line_id) DO UPDATE SET
         state = EXCLUDED.state, product_code = EXCLUDED.product_code,
         good_count = EXCLUDED.good_count, ng_count = EXCLUDED.ng_count,
         beat_ms = EXCLUDED.beat_ms, updated_at = EXCLUDED.updated_at`,
      args,
    );
    const history = this.pool.query(
      `INSERT INTO line_status_history ("time", line_id, state, product_code, good_count, ng_count, beat_ms)
       VALUES ($7,$1,$2,$3,$4,$5,$6)`,
      args,
    );
    Promise.all([upsert, history]).catch((e: Error) =>
      this.logger.error(`写产线状态失败: ${e.message}`),
    );
  }

  insertEvent(lineCode: string, msg: any) {
    const lineId = this.catalog.lineId(lineCode);
    if (lineId === undefined) return;
    const deviceId = msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined;
    this.pool
      .query(
        `INSERT INTO production_events ("time", line_id, device_id, type, level, code, message, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          toTime(msg), lineId, deviceId ?? null, msg.type ?? 'custom', msg.level ?? 'info',
          msg.code ?? null, msg.message ?? null, JSON.stringify(msg.payload ?? {}),
        ],
      )
      .catch((e: Error) => this.logger.error(`写事件失败: ${e.message}`));
  }

  insertVision(lineCode: string, msg: any) {
    const lineId = this.catalog.lineId(lineCode);
    if (lineId === undefined) return;
    // camera_id 解析不到时写 NULL(相机可能未登记),其余字段照存
    const cameraId = msg.cameraId ? this.catalog.deviceId(msg.cameraId) ?? null : null;
    this.pool
      .query(
        `INSERT INTO vision_images (line_id, camera_id, sn, result, defects, captured_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          lineId, cameraId, msg.sn ?? null, msg.result === 'ng' ? 'ng' : 'ok',
          JSON.stringify(msg.defects ?? []), toTime(msg),
        ],
      )
      .catch((e: Error) => this.logger.error(`写视觉结果失败: ${e.message}`));
  }

  ackCommand(msg: any) {
    if (!msg.cmdId) return;
    const status = ['acked', 'rejected', 'failed'].includes(msg.status) ? msg.status : 'acked';
    this.pool
      .query(
        `UPDATE control_commands
           SET status = $2, ack_payload = $3, acked_at = now()
         WHERE idempotency_key = $1 AND status IN ('pending','sent')`,
        [String(msg.cmdId), status, JSON.stringify(msg)],
      )
      .then((r) => {
        if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);
      })
      .catch((e: Error) => this.logger.error(`更新指令回执失败: ${e.message}`));
  }
}

function toTime(msg: any): Date {
  return typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date();
}

function num(v: any): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
