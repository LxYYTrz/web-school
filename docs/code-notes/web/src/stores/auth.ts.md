# web/src/stores/auth.ts 逐行说明

[打开源码](../../../../../web/src/stores/auth.ts) · 58 行 · 42 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { defineStore } from 'pinia';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import { ref, computed } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 3 | <code>import { apiLogin, apiLogout, apiMe } from '../services/auth';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 7 | <code>export type Level = 1 &#124; 2 &#124; 3;</code> | 声明 `Level` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名。 |
| 9 | <code>export interface AuthUser {</code> | 声明 `AuthUser` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 10 | <code>username: string;</code> | 设置字段 `username`。 |
| 11 | <code>level: Level;</code> | 设置字段 `level`。 |
| 12 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 14 | <code>export const useAuthStore = defineStore('auth', () =&gt; {</code> | 声明变量 `useAuthStore` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 15 | <code>const user = ref&lt;AuthUser &#124; null&gt;(null);</code> | 声明变量 `user` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 16 | <code>const ready = ref(false);  // 首次拉 /me 完成(无论成功失败)才算 ready</code> | 声明变量 `ready` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。 |
| 18 | <code>const isLoggedIn = computed(() =&gt; user.value !== null);</code> | 声明变量 `isLoggedIn` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 19 | <code>const isAdmin = computed(() =&gt; user.value?.level === 3);</code> | 声明变量 `isAdmin` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 21 | <code>const canCommand = computed(() =&gt; (user.value?.level ?? 0) &gt;= 2);</code> | 声明变量 `canCommand` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 23 | <code>const canManageUsers = computed(() =&gt; user.value?.level === 3);</code> | 声明变量 `canManageUsers` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 25 | <code>async function refresh() {</code> | 定义函数 `refresh`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 26 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 27 | <code>user.value = await apiMe();</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 28 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 31 | <code>if (import.meta.env.VITE_MOCK_ONLY === 'true') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`import`＝导入模块或符号。 |
| 32 | <code>user.value = { username: 'demo', level: 3 };</code> | 调用函数、设置值或更新状态。 |
| 33 | <code>} else {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支。 |
| 34 | <code>user.value = null;</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 35 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 36 | <code>} finally {</code> | 续写当前表达式、对象、类型或调用。 关键字：`finally`＝执行收尾逻辑。 |
| 37 | <code>ready.value = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 38 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 39 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 41 | <code>async function login(username: string, password: string) {</code> | 定义函数 `login`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 42 | <code>const u = await apiLogin(username, password);</code> | 声明变量 `u` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 43 | <code>user.value = u;</code> | 调用函数、设置值或更新状态。 |
| 44 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 47 | <code>async function demoLogin(username: string, level: Level = 3) {</code> | 定义函数 `demoLogin`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 48 | <code>if (import.meta.env.VITE_MOCK_ONLY !== 'true') throw new Error('demoLogin 仅 mock-only 环境可用');</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`import`＝导入模块或符号；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 49 | <code>user.value = { username, level };</code> | 调用函数、设置值或更新状态。 |
| 50 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 52 | <code>async function logout() {</code> | 定义函数 `logout`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 53 | <code>await apiLogout();</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 54 | <code>user.value = null;</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 55 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 57 | <code>return { user, ready, isLoggedIn, isAdmin, canCommand, canManageUsers, refresh, login, demoLogin, logout };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 58 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
