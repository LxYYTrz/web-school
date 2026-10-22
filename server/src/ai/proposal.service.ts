import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS } from '../infra/tokens';
import { TelemetryGateway } from '../realtime/telemetry.gateway';
import { ALLOWED_TYPES, EXECUTABLE_TYPES, validateParams } from '../command/command-contract';

/**
 * AI 建议的中转站。
 *
 * 写入方是 mcp/line-twin-mcp.js 里的 propose_action 工具 —— 它只校验 + 落 Redis +
 * publish,没有任何下发能力。本服务订阅频道后做**二次校验**再推给 UI:
 * agent 是概率模型,MCP 侧放行过一次不代表这里就该放行,
 * 控制链路上的每一层都应该假设上一层可能被绕过。
 */

export interface AiProposal {
  id: string;
  lineId: string;
  deviceId: string;
  type: string;
  params: Record<string, unknown>;
  reason: string;
  status: 'pending';
  createdAt: number;
}

const PROPOSAL_CHANNEL = 'ai:proposal';
const keyOf = (id: string) => `ai:proposal:${id}`;

// 取出即删除,保证同一条建议只能被确认一次。
// 用 Lua 而不是 GETDEL —— Memurai 的 GETDEL 支持随版本而异,eval 是通用能力。
const CLAIM_LUA = `
local v = redis.call('GET', KEYS[1])
if v == false then return nil end
redis.call('DEL', KEYS[1])
return v
`;

@Injectable()
export class ProposalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProposalService.name);
  // ioredis 的订阅连接不能同时跑普通命令,必须单独开一条
  private sub?: Redis;

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly gateway: TelemetryGateway,
  ) {}

  onModuleInit() {
    this.sub = this.redis.duplicate();
    this.sub.on('error', (e) => this.logger.error(`pubsub 连接错误: ${e.message}`));
    this.sub.subscribe(PROPOSAL_CHANNEL, (err) => {
      if (err) return this.logger.error(`订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}`);
      this.logger.log(`已订阅 ${PROPOSAL_CHANNEL}`);
    });
    this.sub.on('message', (channel, raw) => {
      if (channel !== PROPOSAL_CHANNEL) return;
      void this.onProposalMessage(raw);
    });
  }

  async onModuleDestroy() {
    if (this.sub) await this.sub.quit().catch(() => undefined);
  }

  private async onProposalMessage(raw: string) {
    let p: AiProposal;
    try {
      p = JSON.parse(raw) as AiProposal;
    } catch (e) {
      return this.logger.warn(`丢弃非法提案 JSON: ${(e as Error).message}`);
    }

    const bad = this.revalidate(p);
    if (bad) {
      // 这是安全事件:MCP 侧本不该放出这种东西。记日志但不推 UI。
      return this.logger.warn(`拒绝二次校验未通过的提案 ${p?.id}: ${bad}`);
    }

    // MCP 侧已写过;这里补写一次,让 NestJS 重启后仍能确认历史建议
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 900);
    this.gateway.broadcastAiProposal(p.lineId, p);
    this.logger.log(`建议 ${p.id}(${p.type} @ ${p.lineId}/${p.deviceId}) 已推送 UI,等待人工确认`);
  }

  /** 二次校验:白名单 + 可执行性 + params 值域。返回错误串表示拒绝。 */
  revalidate(p: AiProposal): string | null {
    if (!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失';
    if (!ALLOWED_TYPES.has(p.type)) return `type 不在白名单:${p.type}`;
    if (!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`;
    const pv = validateParams(p.type, p.params);
    if (!pv.ok) return pv.error;
    return null;
  }

  /** 原子取出并删除 —— 取出即消费,防止同一条建议被重复确认。 */
  async claim(id: string): Promise<AiProposal | null> {
    const raw = (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string | null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AiProposal;
    } catch {
      return null;
    }
  }

  /** 找回已消费的建议,用于失败时还回给用户一个明确原因。 */
  async restore(p: AiProposal) {
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 120);
  }

  get ttlSec() {
    return 900;
  }
}
