# web/src/router/index.ts 逐行说明

[打开源码](../../../../../web/src/router/index.ts) · 73 行 · 36 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 23 | <code>import { createRouter, createWebHistory } from 'vue-router';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 24 | <code>import { useAuthStore } from '../stores/auth';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 25 | <code>import { setUnauthorizedHandler } from '../services/auth';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 28 | <code>export const router = createRouter({</code> | 声明变量 `router` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 30 | <code>history: createWebHistory(),</code> | 设置字段 `history`。 |
| 32 | <code>routes: [</code> | 设置字段 `routes`。 |
| 34 | <code>{ path: '/', redirect: '/twin' },</code> | 续写当前表达式、对象、类型或调用。 |
| 35 | <code>{ path: '/login', name: 'login', component: () =&gt; import('../views/LoginView.vue'), meta: { title: '登录', public: true } },</code> | 续写当前表达式、对象、类型或调用。 关键字：`import`＝导入模块或符号；`public`＝公开成员；`true`＝布尔真值。 |
| 37 | <code>{ path: '/twin', name: 'twin', component: () =&gt; import('../views/TwinView.vue'), meta: { title: '实时孪生' } },</code> | 续写当前表达式、对象、类型或调用。 关键字：`import`＝导入模块或符号。 |
| 39 | <code>{ path: '/io', name: 'io', component: () =&gt; import('../views/IoView.vue'), meta: { title: 'IO 信号' } },</code> | 续写当前表达式、对象、类型或调用。 关键字：`import`＝导入模块或符号。 |
| 40 | <code>{ path: '/users', name: 'users', component: () =&gt; import('../views/UsersView.vue'), meta: { title: '用户管理', requiredLevel: 3 } },</code> | 续写当前表达式、对象、类型或调用。 关键字：`import`＝导入模块或符号。 |
| 41 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 42 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 45 | <code>setUnauthorizedHandler(() =&gt; {</code> | 定义或调用 `setUnauthorizedHandler`，参数由括号给出。 |
| 46 | <code>const auth = useAuthStore();</code> | 声明变量 `auth` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 47 | <code>auth.user = null;</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 48 | <code>if (router.currentRoute.value.path !== '/login') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 49 | <code>router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });</code> | 调用函数、设置值或更新状态。 |
| 50 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 51 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 54 | <code>router.beforeEach(async (to) =&gt; {</code> | 调用函数、设置值或更新状态。 关键字：`async`＝声明异步函数。 |
| 55 | <code>const auth = useAuthStore();</code> | 声明变量 `auth` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 56 | <code>if (!auth.ready) await auth.refresh();</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`await`＝等待异步操作完成。 |
| 58 | <code>if (to.path === '/login' &amp;&amp; auth.isLoggedIn) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 59 | <code>return { path: '/twin' };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 60 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 62 | <code>if (to.meta.public) return true;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`public`＝公开成员；`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 64 | <code>if (!auth.isLoggedIn) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 65 | <code>return { path: '/login', query: { redirect: to.fullPath } };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 66 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 68 | <code>const need = to.meta.requiredLevel as number &#124; undefined;</code> | 声明变量 `need` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`undefined`＝未定义值。 |
| 69 | <code>if (need &amp;&amp; (auth.user?.level ?? 0) &lt; need) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 70 | <code>return { path: '/twin' };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 71 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 72 | <code>return true;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 73 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
