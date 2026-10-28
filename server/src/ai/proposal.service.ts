/**
 * 后端的待确认建议接入与领取服务，连接项目 MCP 和网页人工确认入口。
 * 启动后使用独立 Redis 订阅连接接收 ai:proposal，解析并校验后保存 900 秒，再经网关推送。
 * claim 用 Lua 原子取出并删除，避免同一建议并发重复领取；restore 在相应失败路径短暂还回建议。
 * 建议通知与取得建议均不代表 PLC 已执行；真正下发由 AiController.confirm 接回 CommandService。
 */
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

  // 创建独立 Redis 订阅连接并监听 ai:proposal，消息到达时才调用 onProposalMessage。
  // duplicate 复用配置但创建另一连接，避免订阅模式占用普通 GET/SET 使用的客户端。
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
      // 把 Redis 建议频道消息解析后推送到对应产线界面。
    });
  }

  async onModuleDestroy() {
    if (this.sub) await this.sub.quit().catch(() => undefined);
  }

  // 解析并二次校验来自工具侧的建议，再保存待确认 key 并经 TelemetryGateway 通知网页。
  // 本段只接入建议，未调用 CommandService，也未向 MQTT 控制主题发布命令。
  private async onProposalMessage(raw: string) {
    let p: AiProposal;
    // 声明变量 p，类型为 AiProposal；其值稍后赋入。
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
    // 向产线房间广播 AI 待确认建议。
    this.logger.log(`建议 ${p.id}(${p.type} @ ${p.lineId}/${p.deviceId}) 已推送 UI,等待人工确认`);
  }

  // 检查建议必需字段、类型白名单、现场可执行类型和 params 枚举，返回错误文字或 null。
  revalidate(p: AiProposal): string | null {
    if (!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失';
    if (!ALLOWED_TYPES.has(p.type)) return `type 不在白名单:${p.type}`;
    if (!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`;
    const pv = validateParams(p.type, p.params);
    if (!pv.ok) return pv.error;
    return null;
    // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
  }

  // 确认入口用建议 id 原子取出并删除 Redis 中的待确认建议。
  // eval 执行本文件 CLAIM_LUA；GET 与 DEL 同次脚本完成，重复领取得到空值，不等于 PLC 命令已去重。
  async claim(id: string): Promise<AiProposal | null> {
    const raw = (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string | null;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AiProposal;
    } catch {
      return null;
      // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
    }
  }

  // 命令服务返回拒绝的相应分支将已领取建议短暂恢复，便于后续处理。
  // 当前恢复有效期为 120 秒；这不会撤销已经下发的任何现场命令。
  async restore(p: AiProposal) {
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 120);
  }

  get ttlSec() {
  // 读取建议缓存剩余有效秒数。
    return 900;
    // 本行数值是当前计算或配置的结果，由调用方按照所在函数的单位使用
  }
}
