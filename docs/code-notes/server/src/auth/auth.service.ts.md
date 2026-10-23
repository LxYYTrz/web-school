# server/src/auth/auth.service.ts 逐行说明

[打开源码](../../../../../server/src/auth/auth.service.ts) · 31 行 · 27 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { Inject, Injectable } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import * as bcrypt from 'bcryptjs';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 3 | <code>import { Pool } from 'pg';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 4 | <code>import { PG_POOL } from '../infra/tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 7 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 8 | <code>export class AuthService {</code> | 声明 `AuthService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
| 9 | <code>constructor(@Inject(PG_POOL) private readonly pool: Pool) {}</code> | 定义或调用 `constructor`，参数由括号给出。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 11 | <code>async verifyCredentials(username: string, password: string): Promise&lt;{ username: string; level: number }&gt; {</code> | 定义或调用 `verifyCredentials`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 12 | <code>if (!username &#124;&#124; !password) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 13 | <code>throw new BadCredentials();</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 14 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 15 | <code>const { rows } = await this.pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 16 | <code>'SELECT password, level FROM app.app_users WHERE username = $1 LIMIT 1',</code> | 续写当前表达式、对象、类型或调用。 |
| 17 | <code>[username],</code> | 续写当前表达式、对象、类型或调用。 |
| 18 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 19 | <code>if (rows.length === 0) throw new BadCredentials();</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 20 | <code>const ok = await bcrypt.compare(password, rows[0].password as string);</code> | 声明变量 `ok` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 21 | <code>if (!ok) throw new BadCredentials();</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 22 | <code>return { username, level: rows[0].level as number };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 23 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 24 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 26 | <code>import { UnauthorizedException } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 27 | <code>class BadCredentials extends UnauthorizedException {</code> | 声明 `BadCredentials` 的结构。 关键字：`class`＝定义类；`extends`＝继承父类。 |
| 28 | <code>constructor() {</code> | 定义或调用 `constructor`，参数由括号给出。 |
| 29 | <code>super({ code: 401, msg: '用户名或密码错误' });</code> | 定义或调用 `super`，参数由括号给出。 关键字：`super`＝父类实现。 |
| 30 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 31 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
