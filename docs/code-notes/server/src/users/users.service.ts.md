# server/src/users/users.service.ts 逐行说明

[打开源码](../../../../../server/src/users/users.service.ts) · 117 行 · 97 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import * as bcrypt from 'bcryptjs';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 3 | <code>import { Pool } from 'pg';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 4 | <code>import { PG_POOL } from '../infra/tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 5 | <code>import type { SessionUser } from '../auth/session-user';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 6 | <code>import { CreateUserDto } from './dto/create-user.dto';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 7 | <code>import { UpdateUserDto } from './dto/update-user.dto';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 10 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 11 | <code>export class UsersService {</code> | 声明 `UsersService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
| 12 | <code>constructor(@Inject(PG_POOL) private readonly pool: Pool) {}</code> | 定义或调用 `constructor`，参数由括号给出。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 15 | <code>async list(me: SessionUser) {</code> | 定义或调用 `list`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 16 | <code>const { rows } = await this.pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 17 | <code>'SELECT username, level, created_at FROM app.app_users ORDER BY level DESC, username',</code> | 续写当前表达式、对象、类型或调用。 |
| 18 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 19 | <code>const all = rows.map((r) =&gt; ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date }));</code> | 声明变量 `all` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 20 | <code>return { users: this.visibleUsers(me, all) };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。 |
| 21 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 24 | <code>async create(me: SessionUser, dto: CreateUserDto): Promise&lt;{ success: true; username: string }&gt; {</code> | 定义或调用 `create`，参数由括号给出。 关键字：`async`＝声明异步函数；`true`＝布尔真值。 |
| 25 | <code>this.assertAdmin(me);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 26 | <code>const exists = await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]);</code> | 声明变量 `exists` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 27 | <code>if (exists.rowCount &amp;&amp; exists.rowCount &gt; 0) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 28 | <code>throw new BadRequestException({ code: 409, msg: '用户名已存在' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 29 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 30 | <code>const hash = await bcrypt.hash(dto.password, 10);</code> | 声明变量 `hash` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 31 | <code>await this.pool.query(</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 32 | <code>'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, $3)',</code> | 续写当前表达式、对象、类型或调用。 |
| 33 | <code>[dto.username, hash, dto.level],</code> | 续写当前表达式、对象、类型或调用。 |
| 34 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 35 | <code>return { success: true, username: dto.username };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 36 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 39 | <code>async update(me: SessionUser, targetUsername: string, dto: UpdateUserDto) {</code> | 定义或调用 `update`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 40 | <code>if (dto.new_password === undefined &amp;&amp; dto.new_level === undefined) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值。 |
| 41 | <code>throw new BadRequestException({ code: 400, msg: '至少提供 new_password 或 new_level 其中一项' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 42 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 43 | <code>if (dto.new_level !== undefined &amp;&amp; me.level !== 3) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值。 |
| 44 | <code>throw new ForbiddenException({ code: 403, msg: '仅管理员可修改用户等级' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 45 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 46 | <code>const target = await this.fetchTarget(targetUsername);</code> | 声明变量 `target` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 47 | <code>if (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' });</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 49 | <code>if (dto.new_password !== undefined &amp;&amp; !this.canChangePwd(me, target)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`this`＝当前对象实例。 |
| 50 | <code>throw new ForbiddenException({ code: 403, msg: '权限不足,无法修改该用户密码' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 51 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 53 | <code>const sets: string[] = [];</code> | 声明变量 `sets` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 54 | <code>const args: (string &#124; number)[] = [];</code> | 声明变量 `args` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 55 | <code>if (dto.new_password !== undefined) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值。 |
| 56 | <code>const hash = await bcrypt.hash(dto.new_password, 10);</code> | 声明变量 `hash` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 57 | <code>sets.push('password = $' + (args.length + 1));</code> | 调用函数、设置值或更新状态。 |
| 58 | <code>args.push(hash);</code> | 调用函数、设置值或更新状态。 |
| 59 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 60 | <code>if (dto.new_level !== undefined) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值。 |
| 61 | <code>sets.push('level = $' + (args.length + 1));</code> | 调用函数、设置值或更新状态。 |
| 62 | <code>args.push(dto.new_level);</code> | 调用函数、设置值或更新状态。 |
| 63 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 64 | <code>args.push(targetUsername);</code> | 调用函数、设置值或更新状态。 |
| 65 | <code>const { rowCount } = await this.pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 66 | <code>`UPDATE app.app_users SET ${sets.join(', ')} WHERE username = $${args.length}`,</code> | 修改数据。 |
| 67 | <code>args,</code> | 续写当前表达式、对象、类型或调用。 |
| 68 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 69 | <code>if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 70 | <code>return { success: true };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 71 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 74 | <code>async remove(me: SessionUser, targetUsername: string) {</code> | 定义或调用 `remove`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 75 | <code>this.assertAdmin(me);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 76 | <code>if (targetUsername === me.username) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 77 | <code>throw new BadRequestException({ code: 400, msg: '不能删除自己的账号' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 78 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 79 | <code>const { rowCount } = await this.pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 80 | <code>'DELETE FROM app.app_users WHERE username = $1',</code> | 续写当前表达式、对象、类型或调用。 |
| 81 | <code>[targetUsername],</code> | 续写当前表达式、对象、类型或调用。 |
| 82 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 83 | <code>if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 84 | <code>return { success: true };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 85 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 89 | <code>private canChangePwd(me: SessionUser, target: { username: string; level: number }): boolean {</code> | 定义或调用 `canChangePwd`，参数由括号给出。 关键字：`private`＝限定类内部访问。 |
| 90 | <code>if (me.level === 3) return true;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 91 | <code>if (me.level === 2) return target.username === me.username &#124;&#124; target.level === 1;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 92 | <code>return target.username === me.username;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 93 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 95 | <code>private visibleUsers&lt;T extends { username: string; level: number }&gt;(me: SessionUser, all: T[]): T[] {</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`extends`＝继承父类。 |
| 96 | <code>if (me.level === 3) return all;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 97 | <code>if (me.level === 2) return all.filter((u) =&gt; u.level === 1 &#124;&#124; u.username === me.username);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 98 | <code>return all.filter((u) =&gt; u.username === me.username);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 99 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 103 | <code>private assertAdmin(me: SessionUser) {</code> | 定义或调用 `assertAdmin`，参数由括号给出。 关键字：`private`＝限定类内部访问。 |
| 104 | <code>if (me.level !== 3) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 105 | <code>throw new ForbiddenException({ code: 403, msg: '权限不足,仅管理员可执行此操作' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 106 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 107 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 109 | <code>private async fetchTarget(username: string): Promise&lt;{ username: string; level: number } &#124; null&gt; {</code> | 定义或调用 `fetchTarget`，参数由括号给出。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数；`null`＝空值。 |
| 110 | <code>const { rows } = await this.pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 111 | <code>'SELECT username, level FROM app.app_users WHERE username = $1 LIMIT 1',</code> | 续写当前表达式、对象、类型或调用。 |
| 112 | <code>[username],</code> | 续写当前表达式、对象、类型或调用。 |
| 113 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 114 | <code>if (rows.length === 0) return null;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 115 | <code>return { username: rows[0].username as string, level: rows[0].level as number };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 116 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 117 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
