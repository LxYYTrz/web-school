/**
 * 网页 AI 的 HTTP/SSE 入口及人工建议确认入口，由 AiDrawer 经前端服务调用。
 * status 检查配置；chat 校验会话与消息后交 AiService 流式处理；confirm 先经过登录和控制级别守卫。
 * 确认按建议 id 原子领取并再次校验，然后调用共用 CommandService；失败恢复的分支与最终回执分别处理。
 */
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
// AiController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly ai: AiService,
    private readonly proposals: ProposalService,
    private readonly commands: CommandService,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
  // 构造函数只保存参数属性或注入依赖，没有额外的初始化语句

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
    // 检查 AI 密钥等必要配置，缺失时拒绝提供 AI 服务。
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

  // 用户点击建议确认后，先通过登录与控制级别守卫，再按建议 id 原子领取，避免并发确认重复领取同一建议。
  // 不存在、已经领取或过期时不继续；取得 p 后重新检查类型和参数，再把 p 的动作交给共用 CommandService.issue()。
  // 操作者 user 来自当前会话，不使用建议正文自报的用户名；命令服务校验未通过时按代码恢复建议。
  // 确认接口返回仍属于后端下发阶段，设备回执和物理动作结果要沿后续链路分别判断。

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
      // 将未能完成提交的建议恢复到 Redis 并保留剩余时效。
      return r;
    }

    this.pool
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
        `INSERT INTO audit_logs (user_id, action, target, detail)
         SELECT id, 'command:execute:ai-confirmed', $2, $3::jsonb
           FROM users WHERE username = $1`,
           // users 是保存早期用户数据的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
        [
          user.username,
          `${p.type} @ ${p.lineId}/${p.deviceId}`,
          // 构造模板字符串，把 ${...} 中的值插入目标路径或文本。
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
