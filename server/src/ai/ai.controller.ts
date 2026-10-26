import {
// 导入或导出模块符号。 关键字：import＝导入模块或符号。
  BadRequestException, Body, Controller, Get, Inject, Logger, Param, Post, Sse, UseGuards,
  // 继续当前表达式；这一行的值由外层代码块或调用使用。
} from '@nestjs/common';
// 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：from＝指定导入来源。
import { MessageEvent } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Observable } from 'rxjs';
// 从 rxjs 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthGuard } from '../auth/auth.guard';
// 从 ../auth/auth.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CurrentUser } from '../auth/current-user.decorator';
// 从 ../auth/current-user.decorator 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandGuard } from '../command/command.guard';
// 从 ../command/command.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandService } from '../command/command.service';
// 从 ../command/command.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AiService, ChatBody } from './ai.service';
// 从 ./ai.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ProposalService } from './proposal.service';
// 从 ./proposal.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * AI 助手端点。
 *
 * 权限模型:
 *   chat    —— 任何登录用户(AI 能看只读数据)
 *   confirm —— level >= 2,与手动按控制按钮的门槛完全一致,
 *              复用同一对 AuthGuard + CommandGuard,语义不分叉。
 */
@Controller('api/ai')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
export class AiController {
// 声明 AiController 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  private readonly logger = new Logger(AiController.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。

  constructor(
  // 调用 constructor，把括号中的值作为参数传入。
    private readonly ai: AiService,
    // 声明类属性或构造参数 ai，类型为 AiService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly proposals: ProposalService,
    // 声明类属性或构造参数 proposals，类型为 ProposalService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly commands: CommandService,
    // 声明类属性或构造参数 commands，类型为 CommandService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    @Inject(PG_POOL) private readonly pool: Pool,
    // 装饰器 Inject：按令牌注入指定依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。

  /** AI 是否可用。给抽屉做灰态用,不额外探测 hermes 以免每次开抽屉都打一次端口。 */
  @Get('status')
  // 装饰器 Get：把方法绑定到 GET 路由。
  @UseGuards(AuthGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  status() {
  // 定义方法 status；括号中声明参数，花括号内实现逻辑。
    return {
    // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
      enabled: Boolean(config.ai.apiKey),
      // 设置字段 enabled。
      model: config.ai.model,
      // 设置字段 model。
    };
    // 结束当前对象或代码块，并完成这条语句。
  }
  // 结束当前对象、函数或条件代码块。

  // 注意顺序:controller 里的 SSE 必须由 HTTP 方法装饰器先声明路径和方法,
  // @Sse() 只负责标记「这个响应是事件流」。少了 @Post 路由根本不会注册(404)。
  @Post('chat')
  // 装饰器 Post：把方法绑定到 POST 路由。
  @Sse('chat')
  // 装饰器 Sse：给后面的类、方法或参数附加元数据。
  @UseGuards(AuthGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  chat(@Body() body: ChatBody, @CurrentUser() user: SessionUser): Observable<MessageEvent> {
  // 定义方法 chat；括号中声明参数，花括号内实现逻辑。
    this.ai.assertConfigured();
    // 调用 this.ai.assertConfigured，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    if (!body?.message?.trim()) {
    // 判断 if (!body?.message?.trim()) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new BadRequestException({ code: 400, msg: 'message 不能为空' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    return this.ai.stream(body, user);
    // 返回 this.ai.stream(body, user) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

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
  // 装饰器 Post：把方法绑定到 POST 路由。
  @UseGuards(AuthGuard, CommandGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  async confirm(@Param('id') id: string, @CurrentUser() user: SessionUser) {
  // 定义方法 confirm；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    const p = await this.proposals.claim(id);
    // 声明 p，初始值由 await this.proposals.claim(id) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
    if (!p) return { ok: false, error: '建议不存在、已确认过或已过期' };
    // 判断 if (!p) return { ok: false, error: '建议不存在、已确认过或已过期' }; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。

    // 第三层校验:MCP 侧放过、Redis 二次校验放过,下发前再确认一次
    const bad = this.proposals.revalidate(p);
    // 声明 bad，初始值由 this.proposals.revalidate(p) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    if (bad) return { ok: false, error: `建议未通过下发前校验:${bad}` };
    // 判断 if (bad) return { ok: false, error: 建议未通过下发前校验:${bad} }; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。

    const r = await this.commands.issue(p.lineId, {
    // 声明 r，初始值由 await this.commands.issue(p.lineId, { 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      deviceId: p.deviceId,
      // 设置字段 deviceId。
      type: p.type,
      // 设置字段 type。 关键字：type＝定义类型别名。
      params: p.params,
      // 设置字段 params。
    }, user);
    // 结束当前对象、函数或条件代码块。

    if (!r.ok) {
    // 判断 if (!r.ok) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      // 短暂失败(比如 DB 抖了一下)不该让人白提一次建议,还回去并缩短 TTL
      await this.proposals.restore(p);
      // 调用 this.proposals.restore，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成；this＝当前对象实例。
      return r;
      // 返回 r 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。

    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：this＝当前对象实例。
      .query(
      // 调用 .query，把括号中的值作为参数传入。
        `INSERT INTO audit_logs (user_id, action, target, detail)
        // 写入数据。 关键字：INSERT＝写入新行；INTO＝指定写入目标。
         SELECT id, 'command:execute:ai-confirmed', $2, $3::jsonb
         // 读取数据。 关键字：SELECT＝读取指定列。
           FROM users WHERE username = $1`,
           // 指定读取来源表。 关键字：FROM＝指定查询来源表；WHERE＝限定目标行。
        [
        // 开始当前表达式的分组或数组内容。
          user.username,
          // 继续当前表达式；这一行的值由外层代码块或调用使用。
          `${p.type} @ ${p.lineId}/${p.deviceId}`,
          // 构造模板字符串，把 ${...} 中的值插入目标路径或文本。 关键字：type＝定义类型别名。
          JSON.stringify({
          // 调用 JSON.stringify，把括号中的值作为参数传入。
            cmdId: r.cmdId,
            // 设置字段 cmdId。
            proposalId: p.id,
            // 设置字段 proposalId。
            aiReason: p.reason,
            // 设置字段 aiReason。
            params: p.params,
            // 设置字段 params。
          }),
          // 结束当前回调或对象，并完成外层函数调用。
        ],
        // 结束当前数组，继续外层表达式。
      )
      // 结束当前集合、分组或调用参数。
      .catch((e) => this.logger.error(`写 AI 确认审计失败: ${e.message}`));
      // 调用 .catch，把括号中的值作为参数传入。 关键字：catch＝捕获异常；this＝当前对象实例。

    return { ok: true, cmdId: r.cmdId, proposalId: p.id };
    // 返回 { ok: true, cmdId: r.cmdId, proposalId: p.id } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
