# server/src/auth/current-user.decorator.ts 逐行说明

[打开源码](../../../../../server/src/auth/current-user.decorator.ts) · 12 行 · 10 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { createParamDecorator, ExecutionContext } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import type { Request } from 'express';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 3 | <code>import type { SessionUser } from './session-user';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 6 | <code>export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser =&gt; {</code> | 声明变量 `CurrentUser` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量；`unknown`＝需检查后才能使用的类型。 |
| 7 | <code>const req = ctx.switchToHttp().getRequest&lt;Request&gt;();</code> | 声明变量 `req` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 8 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 9 | <code>username: req.session!.username as string,</code> | 设置字段 `username`。 |
| 10 | <code>level: req.session!.level as number,</code> | 设置字段 `level`。 |
| 11 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 12 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
