# server/src/ai/ai.service.ts 逐行说明

[打开源码](../../../../../server/src/ai/ai.service.ts) · 202 行 · 139 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { Injectable, Logger, MessageEvent, ServiceUnavailableException } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import { Observable, Subscriber } from 'rxjs';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 3 | <code>import { config } from '../config/configuration';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 4 | <code>import type { SessionUser } from '../auth/session-user';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 17 | <code>export interface AiStreamEvent {</code> | 声明 `AiStreamEvent` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 18 | <code>type: 'delta' &#124; 'tool' &#124; 'error' &#124; 'done';</code> | 设置字段 `type`。 |
| 19 | <code>text?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 20 | <code>name?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 21 | <code>message?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 22 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 24 | <code>export interface ChatBody {</code> | 声明 `ChatBody` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 25 | <code>lineId?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 26 | <code>message?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 27 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 29 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 30 | <code>export class AiService {</code> | 声明 `AiService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
| 31 | <code>private readonly logger = new Logger(AiService.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 33 | <code>constructor() {}</code> | 定义或调用 `constructor`，参数由括号给出。 |
| 36 | <code>assertConfigured() {</code> | 定义或调用 `assertConfigured`，参数由括号给出。 |
| 37 | <code>if (!config.ai.apiKey) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 38 | <code>throw new ServiceUnavailableException({</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 39 | <code>code: 503,</code> | 设置字段 `code`。 |
| 40 | <code>msg: 'AI 未配置(缺 AI_API_KEY),请先启动 hermes gateway 并填写 API_SERVER_KEY',</code> | 设置字段 `msg`。 |
| 41 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 42 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 43 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 49 | <code>private sessionId(user: SessionUser) {</code> | 定义或调用 `sessionId`，参数由括号给出。 关键字：`private`＝限定类内部访问。 |
| 50 | <code>return `${config.ai.sessionPrefix}-${user.username}`;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 51 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 53 | <code>stream(body: ChatBody, user: SessionUser): Observable&lt;MessageEvent&gt; {</code> | 定义或调用 `stream`，参数由括号给出。 |
| 54 | <code>return new Observable&lt;MessageEvent&gt;((subscriber: Subscriber&lt;MessageEvent&gt;) =&gt; {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`new`＝创建对象实例。 |
| 55 | <code>const ac = new AbortController();</code> | 声明变量 `ac` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 56 | <code>let cancelled = false;</code> | 声明变量 `cancelled` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`false`＝布尔假值。 |
| 59 | <code>const seenTools = new Set&lt;string&gt;();</code> | 声明变量 `seenTools` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 61 | <code>const push = (e: AiStreamEvent) =&gt; {</code> | 声明变量 `push` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 62 | <code>if (!cancelled) subscriber.next({ data: e } as MessageEvent);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 63 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 65 | <code>(async () =&gt; {</code> | 续写当前表达式、对象、类型或调用。 关键字：`async`＝声明异步函数。 |
| 66 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 67 | <code>const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 68 | <code>method: 'POST',</code> | 设置字段 `method`。 |
| 69 | <code>signal: ac.signal,</code> | 设置字段 `signal`。 |
| 70 | <code>headers: {</code> | 设置字段 `headers`。 |
| 71 | <code>'Content-Type': 'application/json',</code> | 续写当前表达式、对象、类型或调用。 |
| 72 | <code>Authorization: `Bearer ${config.ai.apiKey}`,</code> | 设置字段 `Authorization`。 |
| 73 | <code>'X-Hermes-Session-Id': this.sessionId(user),</code> | 续写当前表达式、对象、类型或调用。 关键字：`this`＝当前对象实例。 |
| 74 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 75 | <code>body: JSON.stringify({</code> | 设置字段 `body`。 |
| 76 | <code>model: config.ai.model,</code> | 设置字段 `model`。 |
| 77 | <code>stream: true,</code> | 设置字段 `stream`。 关键字：`true`＝布尔真值。 |
| 78 | <code>messages: [</code> | 设置字段 `messages`。 |
| 79 | <code>{ role: 'system', content: this.systemPrompt(body.lineId ?? 'line-01') },</code> | 续写当前表达式、对象、类型或调用。 关键字：`this`＝当前对象实例。 |
| 80 | <code>{ role: 'user', content: body.message ?? '' },</code> | 续写当前表达式、对象、类型或调用。 |
| 81 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 82 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 83 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 85 | <code>if (!res.ok &#124;&#124; !res.body) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 86 | <code>const detail = await res.text().catch(() =&gt; '');</code> | 声明变量 `detail` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`catch`＝捕获异常。 |
| 87 | <code>throw new Error(`hermes ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 88 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 90 | <code>for await (const evt of this.parseSse(res.body)) {</code> | 控制分支、循环或异常处理流程。 关键字：`for`＝遍历集合或区间；`await`＝等待异步操作完成；`const`＝声明不可重新绑定的变量；`of`＝遍历可迭代值；`this`＝当前对象实例。 |
| 91 | <code>if (cancelled) break;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`break`＝结束当前循环或分支。 |
| 92 | <code>this.handleChunk(evt, push, seenTools);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 93 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 94 | <code>push({ type: 'done' });</code> | 定义或调用 `push`，参数由括号给出。 |
| 95 | <code>subscriber.complete();</code> | 调用函数、设置值或更新状态。 |
| 96 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 97 | <code>if (!cancelled) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 98 | <code>const msg = (e as Error).message;</code> | 声明变量 `msg` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 100 | <code>if (!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例。 |
| 101 | <code>push({ type: 'error', message: msg });</code> | 定义或调用 `push`，参数由括号给出。 |
| 102 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 103 | <code>subscriber.complete();</code> | 调用函数、设置值或更新状态。 |
| 104 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 105 | <code>})();</code> | 续写当前表达式、对象、类型或调用。 |
| 107 | <code>return () =&gt; {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 108 | <code>cancelled = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 109 | <code>ac.abort();</code> | 调用函数、设置值或更新状态。 |
| 110 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 111 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 112 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 118 | <code>private async *parseSse(body: ReadableStream&lt;Uint8Array&gt;): AsyncGenerator&lt;any, void, void&gt; {</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数；`any`＝跳过静态类型检查；`void`＝表示没有返回值。 |
| 119 | <code>const reader = body.getReader();</code> | 声明变量 `reader` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 120 | <code>const decoder = new TextDecoder();</code> | 声明变量 `decoder` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 121 | <code>let buf = '';</code> | 声明变量 `buf` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 122 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 123 | <code>for (;;) {</code> | 控制分支、循环或异常处理流程。 关键字：`for`＝遍历集合或区间。 |
| 124 | <code>const { done, value } = await reader.read();</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 125 | <code>if (done) break;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`break`＝结束当前循环或分支。 |
| 126 | <code>buf += decoder.decode(value, { stream: true });</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 128 | <code>let idx: number;</code> | 声明变量 `idx` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 129 | <code>while ((idx = buf.indexOf('\n\n')) &gt;= 0) {</code> | 控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。 |
| 130 | <code>const frame = buf.slice(0, idx);</code> | 声明变量 `frame` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 131 | <code>buf = buf.slice(idx + 2);</code> | 调用函数、设置值或更新状态。 |
| 132 | <code>for (const line of frame.split('\n')) {</code> | 控制分支、循环或异常处理流程。 关键字：`for`＝遍历集合或区间；`const`＝声明不可重新绑定的变量；`of`＝遍历可迭代值。 |
| 133 | <code>if (!line.startsWith('data:')) continue;         // event:/id:/注释行一律忽略</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。 |
| 134 | <code>const data = line.slice(5).trim();</code> | 声明变量 `data` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 135 | <code>if (!data &#124;&#124; data === '[DONE]') continue;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。 |
| 136 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 137 | <code>yield JSON.parse(data);</code> | 续写当前表达式、对象、类型或调用。 |
| 138 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 140 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 141 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 142 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 143 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 144 | <code>} finally {</code> | 续写当前表达式、对象、类型或调用。 关键字：`finally`＝执行收尾逻辑。 |
| 145 | <code>reader.cancel().catch(() =&gt; undefined);</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常；`undefined`＝未定义值。 |
| 146 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 147 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 149 | <code>private handleChunk(c: any, push: (e: AiStreamEvent) =&gt; void, seenTools: Set&lt;string&gt;) {</code> | 定义或调用 `handleChunk`，参数由括号给出。 关键字：`private`＝限定类内部访问；`any`＝跳过静态类型检查；`void`＝表示没有返回值。 |
| 153 | <code>if (typeof c?.tool === 'string') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型。 |
| 154 | <code>const name = this.friendlyTool(c.tool);</code> | 声明变量 `name` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 155 | <code>if (name &amp;&amp; !seenTools.has(name)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 156 | <code>seenTools.add(name);   // 同一工具 running/completed 会各来一帧,只报一次</code> | 调用函数、设置值或更新状态。 |
| 157 | <code>push({ type: 'tool', name });</code> | 定义或调用 `push`，参数由括号给出。 |
| 158 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 159 | <code>return;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 160 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 165 | <code>const text = c?.choices?.[0]?.delta?.content;</code> | 声明变量 `text` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 166 | <code>if (typeof text === 'string' &amp;&amp; text) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型。 |
| 167 | <code>push({ type: 'delta', text });</code> | 定义或调用 `push`，参数由括号给出。 |
| 168 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 169 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 177 | <code>private friendlyTool(raw: string): string &#124; null {</code> | 定义或调用 `friendlyTool`，参数由括号给出。 关键字：`private`＝限定类内部访问；`null`＝空值。 |
| 178 | <code>if (raw === 'tool_describe' &#124;&#124; raw.startsWith('hermes_')) return null;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 179 | <code>return raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '');</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 180 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 191 | <code>private systemPrompt(lineId: string) {</code> | 定义或调用 `systemPrompt`，参数由括号给出。 关键字：`private`＝限定类内部访问。 |
| 192 | <code>return [</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 193 | <code>`你是产线数字孪生平台的运维助手,当前产线 ${lineId}。`,</code> | 续写当前表达式、对象、类型或调用。 |
| 194 | <code>'用中文回答,结论要有工具查证支撑,不要凭空推断。',</code> | 续写当前表达式、对象、类型或调用。 |
| 195 | <code>'需要改变产线状态时调用 propose_action 提交建议,由值班人人工确认后才执行。',</code> | 续写当前表达式、对象、类型或调用。 |
| 196 | <code>'本通道(网页助手)禁止直接下发控制指令:不要调用 run_operation / execute_action,',</code> | 续写当前表达式、对象、类型或调用。 |
| 197 | <code>'一律用 propose_action 走人工确认流程。',</code> | 续写当前表达式、对象、类型或调用。 |
| 198 | <code>'IMPORTANT: 建议提交后并未执行。在人工确认之前,严禁使用「已停机」「已启动」' +</code> | 续写当前表达式、对象、类型或调用。 |
| 199 | <code>'「已执行」这类过去完成式的表述,一律用「建议」「待确认」等措辞。',</code> | 续写当前表达式、对象、类型或调用。 |
| 200 | <code>].join('\n');</code> | 续写当前表达式、对象、类型或调用。 |
| 201 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 202 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
