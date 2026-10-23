# web/src/services/ai.ts 逐行说明

[打开源码](../../../../../web/src/services/ai.ts) · 124 行 · 97 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import type { AiProposal, AiStreamEvent } from './types';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 2 | <code>import { getSocket } from './socket';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 4 | <code>const BASE = (import.meta.env.VITE_API_BASE as string &#124; undefined) &#124;&#124; '';</code> | 声明变量 `BASE` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号；`undefined`＝未定义值。 |
| 6 | <code>let onUnauthorized: (() =&gt; void) &#124; null = null;</code> | 声明变量 `onUnauthorized` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。 |
| 7 | <code>export function setAiUnauthorizedHandler(fn: () =&gt; void) {</code> | 定义函数 `setAiUnauthorizedHandler`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。 |
| 8 | <code>onUnauthorized = fn;</code> | 调用函数、设置值或更新状态。 |
| 9 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 11 | <code>async function throwFor(res: Response, method: string, path: string): Promise&lt;never&gt; {</code> | 定义函数 `throwFor`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 12 | <code>if (res.status === 401) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 13 | <code>onUnauthorized?.();</code> | 调用函数、设置值或更新状态。 |
| 14 | <code>throw new Error('未登录或会话已过期');</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 15 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 16 | <code>let msg = `${method} ${path} → ${res.status}`;</code> | 声明变量 `msg` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 17 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 18 | <code>const j = await res.json();</code> | 声明变量 `j` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 19 | <code>if (j?.msg) msg += `: ${j.msg}`;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 20 | <code>else if (j?.error) msg += `: ${j.error}`;</code> | 控制分支、循环或异常处理流程。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 21 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 23 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 24 | <code>throw new Error(msg);</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 25 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 27 | <code>export async function apiAiStatus(): Promise&lt;{ enabled: boolean; model: string }&gt; {</code> | 定义函数 `apiAiStatus`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。 |
| 28 | <code>const res = await fetch(`${BASE}/api/ai/status`, { credentials: 'include' });</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 29 | <code>if (!res.ok) await throwFor(res, 'GET', '/api/ai/status');</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`await`＝等待异步操作完成。 |
| 30 | <code>return res.json();</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 31 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 42 | <code>export async function apiAiChat(</code> | 定义函数 `apiAiChat`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。 |
| 43 | <code>lineId: string,</code> | 设置字段 `lineId`。 |
| 44 | <code>message: string,</code> | 设置字段 `message`。 |
| 45 | <code>onEvent: (e: AiStreamEvent) =&gt; void,</code> | 设置字段 `onEvent`。 关键字：`void`＝表示没有返回值。 |
| 46 | <code>signal?: AbortSignal,</code> | 续写当前表达式、对象、类型或调用。 |
| 47 | <code>): Promise&lt;void&gt; {</code> | 续写当前表达式、对象、类型或调用。 关键字：`void`＝表示没有返回值。 |
| 48 | <code>const res = await fetch(`${BASE}/api/ai/chat`, {</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 49 | <code>method: 'POST',</code> | 设置字段 `method`。 |
| 50 | <code>credentials: 'include',</code> | 设置字段 `credentials`。 |
| 51 | <code>headers: { 'Content-Type': 'application/json' },</code> | 设置字段 `headers`。 |
| 52 | <code>body: JSON.stringify({ lineId, message }),</code> | 设置字段 `body`。 |
| 53 | <code>signal,</code> | 续写当前表达式、对象、类型或调用。 |
| 54 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 55 | <code>if (!res.ok) await throwFor(res, 'POST', '/api/ai/chat');</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`await`＝等待异步操作完成。 |
| 56 | <code>if (!res.body) throw new Error('浏览器不支持流式响应');</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 58 | <code>const reader = res.body.getReader();</code> | 声明变量 `reader` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 59 | <code>const decoder = new TextDecoder();</code> | 声明变量 `decoder` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 60 | <code>let buf = '';</code> | 声明变量 `buf` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 61 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 62 | <code>for (;;) {</code> | 控制分支、循环或异常处理流程。 关键字：`for`＝遍历集合或区间。 |
| 63 | <code>const { done, value } = await reader.read();</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 64 | <code>if (done) break;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`break`＝结束当前循环或分支。 |
| 65 | <code>buf += decoder.decode(value, { stream: true });</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 67 | <code>let idx: number;</code> | 声明变量 `idx` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 68 | <code>while ((idx = buf.indexOf('\n\n')) &gt;= 0) {</code> | 控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。 |
| 69 | <code>const frame = buf.slice(0, idx);</code> | 声明变量 `frame` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 70 | <code>buf = buf.slice(idx + 2);</code> | 调用函数、设置值或更新状态。 |
| 71 | <code>for (const line of frame.split('\n')) {</code> | 控制分支、循环或异常处理流程。 关键字：`for`＝遍历集合或区间；`const`＝声明不可重新绑定的变量；`of`＝遍历可迭代值。 |
| 72 | <code>if (!line.startsWith('data:')) continue;      // event:/id:/注释行忽略</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。 |
| 73 | <code>const payload = line.slice(5).trim();</code> | 声明变量 `payload` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 74 | <code>if (!payload) continue;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。 |
| 75 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 76 | <code>onEvent(JSON.parse(payload) as AiStreamEvent);</code> | 定义或调用 `onEvent`，参数由括号给出。 |
| 77 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 79 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 80 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 81 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 82 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 83 | <code>} finally {</code> | 续写当前表达式、对象、类型或调用。 关键字：`finally`＝执行收尾逻辑。 |
| 84 | <code>reader.cancel().catch(() =&gt; undefined);</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常；`undefined`＝未定义值。 |
| 85 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 86 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 94 | <code>export async function apiConfirmAiProposal(</code> | 定义函数 `apiConfirmAiProposal`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。 |
| 95 | <code>id: string,</code> | 设置字段 `id`。 |
| 96 | <code>): Promise&lt;{ ok: boolean; cmdId?: string; error?: string }&gt; {</code> | 续写当前表达式、对象、类型或调用。 |
| 97 | <code>const res = await fetch(`${BASE}/api/ai/proposals/${encodeURIComponent(id)}/confirm`, {</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 98 | <code>method: 'POST',</code> | 设置字段 `method`。 |
| 99 | <code>credentials: 'include',</code> | 设置字段 `credentials`。 |
| 100 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 101 | <code>if (res.status === 401) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 102 | <code>onUnauthorized?.();</code> | 调用函数、设置值或更新状态。 |
| 103 | <code>throw new Error('未登录或会话已过期');</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 104 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 105 | <code>const body = (await res.json().catch(() =&gt; ({}))) as {</code> | 声明变量 `body` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`catch`＝捕获异常。 |
| 106 | <code>ok: boolean;</code> | 设置字段 `ok`。 |
| 107 | <code>cmdId?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 108 | <code>error?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 109 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 110 | <code>if (res.status === 403) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 111 | <code>throw new Error(body.error &#124;&#124; '需 level &gt;= 2 才能下发控制指令');</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 112 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 113 | <code>if (!res.ok) throw new Error(body.error &#124;&#124; `确认失败:${res.status}`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 114 | <code>return body;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 115 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 118 | <code>export function onAiProposal(cb: (p: AiProposal) =&gt; void): () =&gt; void {</code> | 定义函数 `onAiProposal`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。 |
| 119 | <code>const socket = getSocket();</code> | 声明变量 `socket` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 120 | <code>socket.on('ai_proposal', cb);</code> | 调用函数、设置值或更新状态。 |
| 121 | <code>return () =&gt; {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 122 | <code>socket.off('ai_proposal', cb);</code> | 调用函数、设置值或更新状态。 |
| 123 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 124 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
