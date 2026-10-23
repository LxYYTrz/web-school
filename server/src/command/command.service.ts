/**
 * ============================================================================
 * 文件作用：控制指令服务（下行链路的核心：白名单 + 审计 + 下发）
 * 所属模块：server/src/command/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件回答"控制指令是怎么从浏览器走到 PLC 的" ★
 * ============================================================================
 *
 * 【完整下行链路（本文件是第 ③④ 步）】
 *
 *   ① 浏览器（操作员点击"启动/停止/复位"按钮）
 *        │  POST /api/lines/line-01/commands
 *        │  Body: { deviceId:'plc-01', type:'reset', params:{}, operator:'admin' }
 *        ▼
 *   ② CommandController（HTTP 层）→ 转交本服务
 *        ▼
 *   ③ ★ CommandService（本文件）★
 *        ├─ 校验 type 是否在白名单内（安全边界一：不允许任意写寄存器）
 *        ├─ 校验 lineId / deviceId 是否存在（安全边界二：编码必须在册）
 *        ├─ INSERT control_commands（status='sent'）→ 生成审计记录
 *        └─ publish 到 MQTT 主题 tl/v1/{line}/cmd/{device}
 *        ▼
 *   ④ EMQX Broker → 采集器订阅的 tl/v1/line-01/cmd/+ 主题
 *        ▼
 *   ⑤ 采集器收到指令 → 写 PLC（PLC 自身联锁有最终否决权）→ 0.3~若干秒后
 *        publish cmd_ack { cmdId, status:'acked' }
 *        ▼
 *   ⑥ 回到 MqttIngestService.dispatch → kind === 'cmd_ack'
 *        → HistoryWriterService.ackCommand() 更新 control_commands 状态
 *
 * 【为什么 cmdId 这么重要】
 *   cmdId 就是数据库 control_commands.idempotency_key（UUID）。
 *   它把「云端下发的指令」和「边缘回的回执」绑定在一起，形成闭环审计：
 *     - 幂等：重复回执不会重复改状态（ackCommand 里 WHERE status IN ('pending','sent')）
 *     - 可追溯：查这条指令是谁、什么时候、对哪台设备下的、回执是什么
 *     - 可对账：15 秒无回执可以置 timeout（待实现，见 server/README.md 的 TODO）
 *
 * 【安全说明（非常重要）】
 *   - 指令类型是**白名单**（start/stop/reset/changeover），
 *     永远不提供"写任意寄存器"的能力 —— 那是极危险的通用远程执行接口。
 *   - 急停（E-Stop）**不在本系统范围内**：急停必须是硬件回路，
 *     网页永远不做急停按钮。软件急停是不可靠的。
 *   - 当前版本**没有鉴权**（TODO 第 4 步接 JWT + RBAC + user_line_scope），
 *     现阶段仅供联调，绝不能直接暴露到公网。
 */
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

/**
 * 指令请求体结构（对应前端 POST 的 JSON Body）。
 */
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
      // ---------- 落审计表 ----------
      // INSERT ... RETURNING idempotency_key：直接拿数据库生成的 UUID 作为 cmdId。
      // 这样 cmdId 由数据库统一生成，避免客户端伪造/重复
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
    // ---------- 校验 1：参数完整 + 类型在白名单内 ----------
    // 任一不满足就拒绝。**先校验再落库再下发**，绝不能"先发出去再说"
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
      return {
        ok: false,
        error: `deviceId/type 非法;type 白名单: ${[...ALLOWED_TYPES].join('|')}`,
      };
    }
    // ---------- 校验 2：编码必须在数据库中登记 ----------
    // code → id。查不到说明产线/设备没配到系统里，属于配置错误，拒绝下发
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
    // 取回生成的 UUID 字符串
    const cmdId = String(r.rows[0].idempotency_key);

    // 契约 §5 第 5 条:全流程落 audit_logs
    // detail 里带 operator —— 机器通道的 operator 是 'ai:feishu:ou_xxx' 这种,
    // 光看 user_id(会兜底成 admin)追不到人,必须把操作者身份写进 detail。
    this.pool
      .query(
        `INSERT INTO audit_logs (user_id, action, target, detail)
         VALUES ($1, 'command:execute', $2, $3::jsonb)`,
        [userId, `${body.type} @ ${lineCode}/${body.deviceId}`,
         JSON.stringify({ cmdId, params: body.params ?? {}, operator })],
      )
      .catch((e) => this.logger.error(`写 audit_logs 失败: ${e.message}`));

    // ---------- 通过 MQTT 下发到边缘 ----------
    this.mqtt.publishCommand(lineCode, body.deviceId, {
      cmdId,
      ts: Date.now(),
      lineId: lineCode,
      deviceId: body.deviceId,
      type: body.type,
      params: body.params ?? {},
      operator,
    });
    // ---------- 返回给前端 ----------
    // 前端拿 cmdId 后可以查询指令最终状态（acked/rejected/failed）
    return { ok: true, cmdId };
  }

  private async resolveUserId(username: string): Promise<number> {
    const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
    // 查到了就直接返回
    if (r.rows[0]) return Number(r.rows[0].id);
    // session 有但 DB 没这人 → 兜底 admin;不应发生,只是防御
    const a = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    return Number(a.rows[0].id);
  }
}
