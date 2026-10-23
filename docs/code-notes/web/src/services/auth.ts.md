# web/src/services/auth.ts 逐行说明

[打开源码](../../../../../web/src/services/auth.ts) · 68 行 · 48 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import type { AuthUser, Level } from '../stores/auth';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 4 | <code>const BASE = (import.meta.env.VITE_API_BASE as string &#124; undefined) &#124;&#124; '';</code> | 声明变量 `BASE` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号；`undefined`＝未定义值。 |
| 8 | <code>let onUnauthorized: (() =&gt; void) &#124; null = null;</code> | 声明变量 `onUnauthorized` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。 |
| 9 | <code>export function setUnauthorizedHandler(fn: () =&gt; void) { onUnauthorized = fn; }</code> | 定义函数 `setUnauthorizedHandler`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。 |
| 11 | <code>async function http&lt;T&gt;(method: string, path: string, body?: unknown): Promise&lt;T&gt; {</code> | 定义函数 `http`。 关键字：`async`＝声明异步函数；`function`＝定义函数；`unknown`＝需检查后才能使用的类型。 |
| 12 | <code>const res = await fetch(BASE + path, {</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 13 | <code>method,</code> | 续写当前表达式、对象、类型或调用。 |
| 14 | <code>credentials: 'include',  // cookie-session 必须</code> | 设置字段 `credentials`。 |
| 15 | <code>headers: body ? { 'Content-Type': 'application/json' } : undefined,</code> | 设置字段 `headers`。 关键字：`undefined`＝未定义值。 |
| 16 | <code>body: body ? JSON.stringify(body) : undefined,</code> | 设置字段 `body`。 关键字：`undefined`＝未定义值。 |
| 17 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 18 | <code>if (res.status === 401) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 19 | <code>onUnauthorized?.();</code> | 调用函数、设置值或更新状态。 |
| 20 | <code>throw new Error('未登录或会话已过期');</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 21 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 22 | <code>if (!res.ok) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 23 | <code>let msg = `${method} ${path} → ${res.status}`;</code> | 声明变量 `msg` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 24 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 25 | <code>const j = await res.json();</code> | 声明变量 `j` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 26 | <code>if (j?.msg) msg += `: ${j.msg}`;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 27 | <code>} catch { /* 不是 JSON */ }</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 28 | <code>throw new Error(msg);</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 29 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 31 | <code>if (res.status === 204) return undefined as unknown as T;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`undefined`＝未定义值；`unknown`＝需检查后才能使用的类型。 |
| 32 | <code>return res.json() as Promise&lt;T&gt;;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 33 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 37 | <code>export function apiLogin(username: string, password: string): Promise&lt;AuthUser&gt; {</code> | 定义函数 `apiLogin`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。 |
| 38 | <code>return http&lt;AuthUser&gt;('POST', '/api/auth/login', { username, password });</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 39 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 41 | <code>export function apiLogout(): Promise&lt;{ success: true }&gt; {</code> | 定义函数 `apiLogout`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。 |
| 42 | <code>return http&lt;{ success: true }&gt;('POST', '/api/auth/logout');</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 43 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 46 | <code>export function apiMe(): Promise&lt;AuthUser&gt; {</code> | 定义函数 `apiMe`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。 |
| 47 | <code>return http&lt;AuthUser&gt;('GET', '/api/auth/me');</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 48 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 52 | <code>export interface UserRow { username: string; level: Level; created_at: string }</code> | 声明 `UserRow` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 54 | <code>export function apiListUsers(): Promise&lt;{ users: UserRow[] }&gt; {</code> | 定义函数 `apiListUsers`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。 |
| 55 | <code>return http&lt;{ users: UserRow[] }&gt;('GET', '/api/users');</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 56 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 58 | <code>export function apiCreateUser(username: string, password: string, level: Level): Promise&lt;{ success: true; username: string }&gt; {</code> | 定义函数 `apiCreateUser`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。 |
| 59 | <code>return http&lt;{ success: true; username: string }&gt;('POST', '/api/users', { username, password, level });</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 60 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 62 | <code>export function apiUpdateUser(username: string, body: { new_password?: string; new_level?: Level }): Promise&lt;{ success: true }&gt; {</code> | 定义函数 `apiUpdateUser`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。 |
| 63 | <code>return http&lt;{ success: true }&gt;('PUT', `/api/users/${encodeURIComponent(username)}`, body);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 64 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 66 | <code>export function apiDeleteUser(username: string): Promise&lt;{ success: true }&gt; {</code> | 定义函数 `apiDeleteUser`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。 |
| 67 | <code>return http&lt;{ success: true }&gt;('DELETE', `/api/users/${encodeURIComponent(username)}`);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 68 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
