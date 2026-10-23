# server/src/auth/auth.guard.ts 逐行说明

[打开源码](../../../../../server/src/auth/auth.guard.ts) · 15 行 · 13 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import type { Request } from 'express';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 5 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 6 | <code>export class AuthGuard implements CanActivate {</code> | 声明 `AuthGuard` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。 |
| 7 | <code>canActivate(context: ExecutionContext): boolean {</code> | 定义或调用 `canActivate`，参数由括号给出。 |
| 8 | <code>const req = context.switchToHttp().getRequest&lt;Request&gt;();</code> | 声明变量 `req` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 9 | <code>const session = req.session;</code> | 声明变量 `session` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 10 | <code>if (!session &#124;&#124; !session.username &#124;&#124; typeof session.level !== 'number') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型。 |
| 11 | <code>throw new UnauthorizedException({ code: 401, msg: '未登录' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 12 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 13 | <code>return true;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 14 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 15 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
