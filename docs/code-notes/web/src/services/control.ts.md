# web/src/services/control.ts 逐行说明

[打开源码](../../../../../web/src/services/control.ts) · 57 行 · 46 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { getSocket } from './socket';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import type { CommandAck } from './types';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 4 | <code>const BASE = (import.meta.env.VITE_API_BASE as string &#124; undefined) &#124;&#124; '';</code> | 声明变量 `BASE` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号；`undefined`＝未定义值。 |
| 7 | <code>let onUnauthorized: (() =&gt; void) &#124; null = null;</code> | 声明变量 `onUnauthorized` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。 |
| 8 | <code>export function setControlUnauthorizedHandler(fn: () =&gt; void) { onUnauthorized = fn; }</code> | 定义函数 `setControlUnauthorizedHandler`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。 |
| 10 | <code>export interface SendCommandParams {</code> | 声明 `SendCommandParams` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 11 | <code>deviceId: string;</code> | 设置字段 `deviceId`。 |
| 12 | <code>type: 'start' &#124; 'stop' &#124; 'reset' &#124; 'changeover' &#124; 'mode_set' &#124; 'alarm_clear' &#124; string;</code> | 设置字段 `type`。 |
| 13 | <code>params?: Record&lt;string, unknown&gt;;</code> | 续写当前表达式、对象、类型或调用。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 14 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 16 | <code>export interface SendCommandResult {</code> | 声明 `SendCommandResult` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 17 | <code>ok: boolean;</code> | 设置字段 `ok`。 |
| 18 | <code>cmdId?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 19 | <code>error?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 20 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 24 | <code>export async function apiSendCommand(</code> | 定义函数 `apiSendCommand`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。 |
| 25 | <code>lineId: string,</code> | 设置字段 `lineId`。 |
| 26 | <code>cmd: SendCommandParams,</code> | 设置字段 `cmd`。 |
| 27 | <code>): Promise&lt;SendCommandResult&gt; {</code> | 续写当前表达式、对象、类型或调用。 |
| 28 | <code>const res = await fetch(`${BASE}/api/lines/${lineId}/commands`, {</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 29 | <code>method: 'POST',</code> | 设置字段 `method`。 |
| 30 | <code>credentials: 'include',</code> | 设置字段 `credentials`。 |
| 31 | <code>headers: { 'Content-Type': 'application/json' },</code> | 设置字段 `headers`。 |
| 32 | <code>body: JSON.stringify(cmd),</code> | 设置字段 `body`。 |
| 33 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 34 | <code>if (res.status === 401) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 35 | <code>onUnauthorized?.();</code> | 调用函数、设置值或更新状态。 |
| 36 | <code>throw new Error('未登录或会话已过期');</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 37 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 38 | <code>if (!res.ok) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 39 | <code>let msg = `POST commands → ${res.status}`;</code> | 声明变量 `msg` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 40 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 41 | <code>const j = await res.json();</code> | 声明变量 `j` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 42 | <code>if (j?.msg) msg += `: ${j.msg}`;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 43 | <code>else if (j?.error) msg += `: ${j.error}`;</code> | 控制分支、循环或异常处理流程。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 44 | <code>} catch { /* 不是 JSON */ }</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 45 | <code>throw new Error(msg);</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 46 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 47 | <code>return res.json() as Promise&lt;SendCommandResult&gt;;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 48 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 52 | <code>export function onCommandAck(cb: (ack: CommandAck) =&gt; void): () =&gt; void {</code> | 定义函数 `onCommandAck`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。 |
| 53 | <code>const socket = getSocket();</code> | 声明变量 `socket` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 54 | <code>const handler = (msg: CommandAck) =&gt; cb(msg);</code> | 声明变量 `handler` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 55 | <code>socket.on('command_ack', handler);</code> | 调用函数、设置值或更新状态。 |
| 56 | <code>return () =&gt; { socket.off('command_ack', handler); };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 57 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
