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

import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';                 // PG 连接池
import { PG_POOL } from '../infra/tokens'; // PG 注入令牌
import { CatalogService } from '../infra/catalog.service'; // 编码映射
import { MqttIngestService } from '../ingest/mqtt-ingest.service'; // MQTT 发布通道

/**
 * 指令类型白名单（安全边界）。
 * 与数据契约 docs/contract/README.md 3.5 节保持一致。
 * 用 Set 而不是数组：查找是 O(1)，且天然去重。
 */
const ALLOWED_TYPES = new Set(['start', 'stop', 'reset', 'changeover']);

/**
 * 指令请求体结构（对应前端 POST 的 JSON Body）。
 */
export interface CommandBody {
  deviceId?: string;                // 目标设备编码，如 'plc-01'
  type?: string;                    // 指令类型，必须命中白名单
  params?: Record<string, unknown>; // 附加参数（按 type 解释）
  operator?: string;                // 操作人（联调期由前端传，正式版从 JWT 取）
}

/**
 * 控制指令服务。
 */
@Injectable()
export class CommandService {
  /**
   * 构造函数：注入 PG 连接池、编码映射服务、MQTT 发布通道。
   */
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly catalog: CatalogService,
    private readonly mqtt: MqttIngestService,
  ) {}

  /**
   * 下发一条控制指令。
   *
   * @param lineCode 产线编码（来自 URL 路径 /api/lines/{lineId}/commands）
   * @param body     指令内容
   * @returns { ok: true, cmdId } 或 { ok: false, error: '原因' }
   */
  async issue(lineCode: string, body: CommandBody) {
    // ---------- 校验 1：参数完整 + 类型在白名单内 ----------
    // 任一不满足就拒绝。**先校验再落库再下发**，绝不能"先发出去再说"
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
      return { ok: false, error: 'deviceId/type 非法;type 白名单: start|stop|reset|changeover' };
    }

    // ---------- 校验 2：编码必须在数据库中登记 ----------
    // code → id。查不到说明产线/设备没配到系统里，属于配置错误，拒绝下发
    const lineId = this.catalog.lineId(lineCode);
    const deviceId = this.catalog.deviceId(body.deviceId);
    if (lineId === undefined || deviceId === undefined) {
      return { ok: false, error: '未知产线或设备编码' };
    }

    // ---------- 解析操作人（审计需要） ----------
    // 联调阶段操作员从 body 传入;正式版必须从 JWT 中取,绝不信客户端
    const userId = await this.resolveUserId(body.operator);

    // ---------- 落审计表 ----------
    // INSERT ... RETURNING idempotency_key：直接拿数据库生成的 UUID 作为 cmdId。
    // 这样 cmdId 由数据库统一生成，避免客户端伪造/重复
    const r = await this.pool.query(
      `INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)
       VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,
      [
        lineId,                                       // $1 产线 id
        deviceId,                                     // $2 设备 id
        userId,                                       // $3 操作人 id
        body.type,                                    // $4 指令类型
        JSON.stringify(body.params ?? {}),            // $5 参数(JSONB)
      ],
    );
    // 取回生成的 UUID 字符串
    const cmdId = String(r.rows[0].idempotency_key);

    // ---------- 通过 MQTT 下发到边缘 ----------
    this.mqtt.publishCommand(lineCode, body.deviceId, {
      cmdId,                        // 指令唯一标识（回执靠它对账）
      ts: Date.now(),               // 下发时间戳
      lineId: lineCode,             // 产线编码
      deviceId: body.deviceId,      // 设备编码
      type: body.type,              // 指令类型
      params: body.params ?? {},    // 指令参数
      operator: body.operator ?? 'dev', // 操作人（给边缘做日志/显示用）
    });

    // ---------- 返回给前端 ----------
    // 前端拿 cmdId 后可以查询指令最终状态（acked/rejected/failed）
    return { ok: true, cmdId };
  }

  /**
   * 解析操作人用户名 → 用户表主键。
   * 查不到就退回 admin（联调期的兜底；正式版这个方法应直接删掉，改从 JWT 取）
   */
  private async resolveUserId(username?: string): Promise<number> {
    // 优先按传入的用户名查
    if (username) {
      const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
      // 查到了就直接返回
      if (r.rows[0]) return Number(r.rows[0].id);
    }
    // 查不到（或没传）：退回 admin 用户
    const r = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    return Number(r.rows[0].id);
  }
}
