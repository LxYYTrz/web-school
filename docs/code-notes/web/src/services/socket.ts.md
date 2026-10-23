# web/src/services/socket.ts 逐行说明

[打开源码](../../../../../web/src/services/socket.ts) · 88 行 · 20 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 42 | <code>import { io, type Socket } from 'socket.io-client';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 49 | <code>const BASE = (import.meta.env.VITE_API_BASE as string &#124; undefined) &#124;&#124; undefined;</code> | 声明变量 `BASE` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号；`undefined`＝未定义值。 |
| 57 | <code>let socket: Socket &#124; null = null;</code> | 声明变量 `socket` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。 |
| 59 | <code>export function getSocket(): Socket {</code> | 定义函数 `getSocket`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。 |
| 61 | <code>if (!socket) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 62 | <code>socket = io(BASE ?? '/', {</code> | 调用函数、设置值或更新状态。 |
| 63 | <code>transports: ['websocket'],</code> | 设置字段 `transports`。 |
| 64 | <code>reconnectionAttempts: Infinity,</code> | 设置字段 `reconnectionAttempts`。 |
| 65 | <code>reconnectionDelay: 1000,</code> | 设置字段 `reconnectionDelay`。 |
| 66 | <code>reconnectionDelayMax: 5000,</code> | 设置字段 `reconnectionDelayMax`。 |
| 67 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 68 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 70 | <code>return socket;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 71 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 79 | <code>export async function fetchSnapshot(lineId: string) {</code> | 定义函数 `fetchSnapshot`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。 |
| 81 | <code>const base = BASE ?? '';</code> | 声明变量 `base` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 83 | <code>const res = await fetch(`${base}/api/lines/${lineId}/snapshot`);</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 85 | <code>if (!res.ok) throw new Error(`snapshot ${res.status}`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 87 | <code>return res.json();</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 88 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
