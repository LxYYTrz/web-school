import {
  BadRequestException, Body, Controller, Get, Inject, Logger, Param, Post, Sse, UseGuards,
} from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Pool } from 'pg';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session-user';
import { CommandGuard } from '../command/command.guard';
import { CommandService } from '../command/command.service';
import { PG_POOL } from '../infra/tokens';
import { config } from '../config/configuration';
import { AiService, ChatBody } from './ai.service';
import { ProposalService } from './proposal.service';

/**
 * AI 助手端点。
 *
 * 权限模型:
 *   chat    —— 任何登录用户(AI 能看只读数据)
 *   confirm —— level >= 2,与手动按控制按钮的门槛完全一致,
 *              复用同一对 AuthGuard + CommandGuard,语义不分叉。
 */
@Controller('api/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ai: AiService,
    private readonly proposals: ProposalService,
    private readonly commands: CommandService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  /** AI 是否可用。给抽屉做灰态用,不额外探测 hermes 以免每次开抽屉都打一次端口。 */
  @Get('status')
  @UseGuards(AuthGuard)
  status() {
    return {
      enabled: Boolean(config.ai.apiKey),
      model: config.ai.model,
    };
  }

  // 注意顺序:controller 里的 SSE 必须由 HTTP 方法装饰器先声明路径和方法,
  // @Sse() 只负责标记「这个响应是事件流」。少了 @Post 路由根本不会注册(404)。
  @Post('chat')
  @Sse('chat')
  @UseGuards(AuthGuard)
  chat(@Body() body: ChatBody, @CurrentUser() user: SessionUser): Observable<MessageEvent> {
    this.ai.assertConfigured();
    if (!body?.message?.trim()) {
      throw new BadRequestException({ code: 400, msg: 'message 不能为空' });
    }
    return this.ai.stream(body, user);
  }

  /**
   * 人工确认 AI 建议 → 真正下发。
   *
   * 复用 CommandService.issue():类型白名单、params 值域、catalog 编码解析、
   * control_commands 落库、MQTT 发布全部沿用现成实现,这里不做第二套。
   * 额外补一条 audit_logs(action='command:execute:ai-confirmed'),
   * 让审计能区分「人自己按的」和「AI 建议后人按的」。
   *
   * operator 只取自 session —— 提案体里就算塞了 username 也一律忽略(契约 §5 第 2 条)。
   */
  @Post('proposals/:id/confirm')
  @UseGuards(AuthGuard, CommandGuard)
  async confirm(@Param('id') id: string, @CurrentUser() user: SessionUser) {
    const p = await this.proposals.claim(id);
    if (!p) return { ok: false, error: '建议不存在、已确认过或已过期' };

    // 第三层校验:MCP 侧放过、Redis 二次校验放过,下发前再确认一次
    const bad = this.proposals.revalidate(p);
    if (bad) return { ok: false, error: `建议未通过下发前校验:${bad}` };

    const r = await this.commands.issue(p.lineId, {
      deviceId: p.deviceId,
      type: p.type,
      params: p.params,
    }, user);

    if (!r.ok) {
      // 短暂失败(比如 DB 抖了一下)不该让人白提一次建议,还回去并缩短 TTL
      await this.proposals.restore(p);
      return r;
    }

    this.pool
      .query(
        `INSERT INTO audit_logs (user_id, action, target, detail)
         SELECT id, 'command:execute:ai-confirmed', $2, $3::jsonb
           FROM users WHERE username = $1`,
        [
          user.username,
          `${p.type} @ ${p.lineId}/${p.deviceId}`,
          JSON.stringify({
            cmdId: r.cmdId,
            proposalId: p.id,
            aiReason: p.reason,
            params: p.params,
          }),
        ],
      )
      .catch((e) => this.logger.error(`写 AI 确认审计失败: ${e.message}`));

    return { ok: true, cmdId: r.cmdId, proposalId: p.id };
  }
}
