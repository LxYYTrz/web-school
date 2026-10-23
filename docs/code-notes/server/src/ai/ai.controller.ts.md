# server/src/ai/ai.controller.ts 逐行说明

[打开源码](../../../../../server/src/ai/ai.controller.ts) · 111 行 · 78 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import {</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 2 | <code>BadRequestException, Body, Controller, Get, Inject, Logger, Param, Post, Sse, UseGuards,</code> | 续写当前表达式、对象、类型或调用。 |
| 3 | <code>} from '@nestjs/common';</code> | 续写当前表达式、对象、类型或调用。 关键字：`from`＝指定导入来源。 |
| 4 | <code>import { MessageEvent } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 5 | <code>import { Observable } from 'rxjs';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 6 | <code>import { Pool } from 'pg';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 7 | <code>import { AuthGuard } from '../auth/auth.guard';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 8 | <code>import { CurrentUser } from '../auth/current-user.decorator';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 9 | <code>import type { SessionUser } from '../auth/session-user';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 10 | <code>import { CommandGuard } from '../command/command.guard';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 11 | <code>import { CommandService } from '../command/command.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 12 | <code>import { PG_POOL } from '../infra/tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 13 | <code>import { config } from '../config/configuration';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 14 | <code>import { AiService, ChatBody } from './ai.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 15 | <code>import { ProposalService } from './proposal.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 25 | <code>@Controller('api/ai')</code> | 使用装饰器声明框架元数据或参数注入。 |
| 26 | <code>export class AiController {</code> | 声明 `AiController` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
| 27 | <code>private readonly logger = new Logger(AiController.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 29 | <code>constructor(</code> | 调用函数、设置值或更新状态。 |
| 30 | <code>private readonly ai: AiService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 31 | <code>private readonly proposals: ProposalService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 32 | <code>private readonly commands: CommandService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 33 | <code>@Inject(PG_POOL) private readonly pool: Pool,</code> | 使用装饰器声明框架元数据或参数注入。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 34 | <code>) {}</code> | 续写当前表达式、对象、类型或调用。 |
| 37 | <code>@Get('status')</code> | 使用装饰器声明框架元数据或参数注入。 |
| 38 | <code>@UseGuards(AuthGuard)</code> | 使用装饰器声明框架元数据或参数注入。 |
| 39 | <code>status() {</code> | 定义或调用 `status`，参数由括号给出。 |
| 40 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 41 | <code>enabled: Boolean(config.ai.apiKey),</code> | 设置字段 `enabled`。 |
| 42 | <code>model: config.ai.model,</code> | 设置字段 `model`。 |
| 43 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 44 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 48 | <code>@Post('chat')</code> | 使用装饰器声明框架元数据或参数注入。 |
| 49 | <code>@Sse('chat')</code> | 使用装饰器声明框架元数据或参数注入。 |
| 50 | <code>@UseGuards(AuthGuard)</code> | 使用装饰器声明框架元数据或参数注入。 |
| 51 | <code>chat(@Body() body: ChatBody, @CurrentUser() user: SessionUser): Observable&lt;MessageEvent&gt; {</code> | 定义或调用 `chat`，参数由括号给出。 |
| 52 | <code>this.ai.assertConfigured();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 53 | <code>if (!body?.message?.trim()) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 54 | <code>throw new BadRequestException({ code: 400, msg: 'message 不能为空' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 55 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 56 | <code>return this.ai.stream(body, user);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。 |
| 57 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 69 | <code>@Post('proposals/:id/confirm')</code> | 使用装饰器声明框架元数据或参数注入。 |
| 70 | <code>@UseGuards(AuthGuard, CommandGuard)</code> | 使用装饰器声明框架元数据或参数注入。 |
| 71 | <code>async confirm(@Param('id') id: string, @CurrentUser() user: SessionUser) {</code> | 定义或调用 `confirm`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 72 | <code>const p = await this.proposals.claim(id);</code> | 声明变量 `p` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 73 | <code>if (!p) return { ok: false, error: '建议不存在、已确认过或已过期' };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 76 | <code>const bad = this.proposals.revalidate(p);</code> | 声明变量 `bad` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 77 | <code>if (bad) return { ok: false, error: `建议未通过下发前校验:${bad}` };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 79 | <code>const r = await this.commands.issue(p.lineId, {</code> | 声明变量 `r` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 80 | <code>deviceId: p.deviceId,</code> | 设置字段 `deviceId`。 |
| 81 | <code>type: p.type,</code> | 设置字段 `type`。 |
| 82 | <code>params: p.params,</code> | 设置字段 `params`。 |
| 83 | <code>}, user);</code> | 续写当前表达式、对象、类型或调用。 |
| 85 | <code>if (!r.ok) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 87 | <code>await this.proposals.restore(p);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 88 | <code>return r;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 89 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 91 | <code>this.pool</code> | 续写当前表达式、对象、类型或调用。 关键字：`this`＝当前对象实例。 |
| 92 | <code>.query(</code> | 调用函数、设置值或更新状态。 |
| 93 | <code>`INSERT INTO audit_logs (user_id, action, target, detail)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 94 | <code>SELECT id, 'command:execute:ai-confirmed', $2, $3::jsonb</code> | 读取数据。 关键字：`SELECT`＝读取指定列。 |
| 95 | <code>FROM users WHERE username = $1`,</code> | 指定读取来源表。 关键字：`FROM`＝指定查询来源表；`WHERE`＝限定目标行。 |
| 96 | <code>[</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 97 | <code>user.username,</code> | 续写当前表达式、对象、类型或调用。 |
| 98 | <code>`${p.type} @ ${p.lineId}/${p.deviceId}`,</code> | 续写当前表达式、对象、类型或调用。 |
| 99 | <code>JSON.stringify({</code> | 调用函数、设置值或更新状态。 |
| 100 | <code>cmdId: r.cmdId,</code> | 设置字段 `cmdId`。 |
| 101 | <code>proposalId: p.id,</code> | 设置字段 `proposalId`。 |
| 102 | <code>aiReason: p.reason,</code> | 设置字段 `aiReason`。 |
| 103 | <code>params: p.params,</code> | 设置字段 `params`。 |
| 104 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 105 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 106 | <code>)</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 107 | <code>.catch((e) =&gt; this.logger.error(`写 AI 确认审计失败: ${e.message}`));</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常；`this`＝当前对象实例。 |
| 109 | <code>return { ok: true, cmdId: r.cmdId, proposalId: p.id };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 110 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 111 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
