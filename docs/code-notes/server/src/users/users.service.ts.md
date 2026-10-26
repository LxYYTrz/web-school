# server/src/users/users.service.ts 逐行注释

[打开源码](../../../../../server/src/users/users.service.ts) · 117 行 · 97 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import * as bcrypt from 'bcryptjs';
// 注释：从 bcryptjs 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 3 行**

```text
import { Pool } from 'pg';
// 注释：从 pg 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
import { PG_POOL } from '../infra/tokens';
// 注释：从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 5 行**

```text
import type { SessionUser } from '../auth/session-user';
// 注释：从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 6 行**

```text
import { CreateUserDto } from './dto/create-user.dto';
// 注释：从 ./dto/create-user.dto 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 7 行**

```text
import { UpdateUserDto } from './dto/update-user.dto';
// 注释：从 ./dto/update-user.dto 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 10 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 11 行**

```text
export class UsersService {
// 注释：声明 `UsersService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```

**源码第 12 行**

```text
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
// 注释：定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 15 行**

```text
  async list(me: SessionUser) {
// 注释：定义方法 list；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 16 行**

```text
    const { rows } = await this.pool.query(
// 注释：从右侧结果中取出 rows，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 17 行**

```text
      'SELECT username, level, created_at FROM app.app_users ORDER BY level DESC, username',
// 注释：提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
```

**源码第 18 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 19 行**

```text
    const all = rows.map((r) => ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date }));
// 注释：声明 all，初始值由 rows.map((r) => ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date })) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 20 行**

```text
    return { users: this.visibleUsers(me, all) };
// 注释：返回 { users: this.visibleUsers(me, all) } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 21 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 24 行**

```text
  async create(me: SessionUser, dto: CreateUserDto): Promise<{ success: true; username: string }> {
// 注释：定义方法 create；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数；`true`＝布尔真值。
```

**源码第 25 行**

```text
    this.assertAdmin(me);
// 注释：调用 this.assertAdmin，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 26 行**

```text
    const exists = await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]);
// 注释：声明 exists，初始值由 await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 27 行**

```text
    if (exists.rowCount && exists.rowCount > 0) {
// 注释：判断 if (exists.rowCount && exists.rowCount > 0) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 28 行**

```text
      throw new BadRequestException({ code: 409, msg: '用户名已存在' });
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 29 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 30 行**

```text
    const hash = await bcrypt.hash(dto.password, 10);
// 注释：声明 hash，初始值由 await bcrypt.hash(dto.password, 10) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 31 行**

```text
    await this.pool.query(
// 注释：调用 this.pool.query，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 32 行**

```text
      'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, $3)',
// 注释：提供 SQL 语句，写入表 app.app_users 中的数据；实际参数由外层查询调用传入。
```

**源码第 33 行**

```text
      [dto.username, hash, dto.level],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 34 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 35 行**

```text
    return { success: true, username: dto.username };
// 注释：返回 { success: true, username: dto.username } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 36 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 39 行**

```text
  async update(me: SessionUser, targetUsername: string, dto: UpdateUserDto) {
// 注释：定义方法 update；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 40 行**

```text
    if (dto.new_password === undefined && dto.new_level === undefined) {
// 注释：判断 if (dto.new_password === undefined && dto.new_level === undefined) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值。
```

**源码第 41 行**

```text
      throw new BadRequestException({ code: 400, msg: '至少提供 new_password 或 new_level 其中一项' });
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 42 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 43 行**

```text
    if (dto.new_level !== undefined && me.level !== 3) {
// 注释：判断 if (dto.new_level !== undefined && me.level !== 3) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值。
```

**源码第 44 行**

```text
      throw new ForbiddenException({ code: 403, msg: '仅管理员可修改用户等级' });
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 45 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 46 行**

```text
    const target = await this.fetchTarget(targetUsername);
// 注释：声明 target，初始值由 await this.fetchTarget(targetUsername) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 47 行**

```text
    if (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' });
// 注释：判断 if (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' }); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 49 行**

```text
    if (dto.new_password !== undefined && !this.canChangePwd(me, target)) {
// 注释：判断 if (dto.new_password !== undefined && !this.canChangePwd(me, target)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`this`＝当前对象实例。
```

**源码第 50 行**

```text
      throw new ForbiddenException({ code: 403, msg: '权限不足,无法修改该用户密码' });
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 51 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 53 行**

```text
    const sets: string[] = [];
// 注释：声明 sets，初始值由 [] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 54 行**

```text
    const args: (string | number)[] = [];
// 注释：声明 args，初始值由 [] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 55 行**

```text
    if (dto.new_password !== undefined) {
// 注释：判断 if (dto.new_password !== undefined) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值。
```

**源码第 56 行**

```text
      const hash = await bcrypt.hash(dto.new_password, 10);
// 注释：声明 hash，初始值由 await bcrypt.hash(dto.new_password, 10) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 57 行**

```text
      sets.push('password = $' + (args.length + 1));
// 注释：调用 sets.push，把括号中的值作为参数传入。
```

**源码第 58 行**

```text
      args.push(hash);
// 注释：调用 args.push，把括号中的值作为参数传入。
```

**源码第 59 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 60 行**

```text
    if (dto.new_level !== undefined) {
// 注释：判断 if (dto.new_level !== undefined) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值。
```

**源码第 61 行**

```text
      sets.push('level = $' + (args.length + 1));
// 注释：调用 sets.push，把括号中的值作为参数传入。
```

**源码第 62 行**

```text
      args.push(dto.new_level);
// 注释：调用 args.push，把括号中的值作为参数传入。
```

**源码第 63 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 64 行**

```text
    args.push(targetUsername);
// 注释：调用 args.push，把括号中的值作为参数传入。
```

**源码第 65 行**

```text
    const { rowCount } = await this.pool.query(
// 注释：从右侧结果中取出 rowCount，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 66 行**

```text
      `UPDATE app.app_users SET ${sets.join(', ')} WHERE username = $${args.length}`,
// 注释：修改数据。
```

**源码第 67 行**

```text
      args,
// 注释：把变量 args 作为同名对象字段加入当前对象。
```

**源码第 68 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 69 行**

```text
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
// 注释：判断 if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' }); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 70 行**

```text
    return { success: true };
// 注释：返回 { success: true } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 71 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 74 行**

```text
  async remove(me: SessionUser, targetUsername: string) {
// 注释：定义方法 remove；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 75 行**

```text
    this.assertAdmin(me);
// 注释：调用 this.assertAdmin，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 76 行**

```text
    if (targetUsername === me.username) {
// 注释：判断 if (targetUsername === me.username) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 77 行**

```text
      throw new BadRequestException({ code: 400, msg: '不能删除自己的账号' });
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 78 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 79 行**

```text
    const { rowCount } = await this.pool.query(
// 注释：从右侧结果中取出 rowCount，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 80 行**

```text
      'DELETE FROM app.app_users WHERE username = $1',
// 注释：提供 SQL 语句，删除表 app.app_users 中的数据；实际参数由外层查询调用传入。
```

**源码第 81 行**

```text
      [targetUsername],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 82 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 83 行**

```text
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
// 注释：判断 if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' }); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 84 行**

```text
    return { success: true };
// 注释：返回 { success: true } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 85 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 89 行**

```text
  private canChangePwd(me: SessionUser, target: { username: string; level: number }): boolean {
// 注释：定义方法 canChangePwd；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问。
```

**源码第 90 行**

```text
    if (me.level === 3) return true;
// 注释：判断 if (me.level === 3) return true; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 91 行**

```text
    if (me.level === 2) return target.username === me.username || target.level === 1;
// 注释：判断 if (me.level === 2) return target.username === me.username || target.level === 1; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 92 行**

```text
    return target.username === me.username;
// 注释：返回 target.username === me.username 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 93 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 95 行**

```text
  private visibleUsers<T extends { username: string; level: number }>(me: SessionUser, all: T[]): T[] {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问；`extends`＝继承父类。
```

**源码第 96 行**

```text
    if (me.level === 3) return all;
// 注释：判断 if (me.level === 3) return all; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 97 行**

```text
    if (me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username);
// 注释：判断 if (me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 98 行**

```text
    return all.filter((u) => u.username === me.username);
// 注释：返回 all.filter((u) => u.username === me.username) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 99 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 103 行**

```text
  private assertAdmin(me: SessionUser) {
// 注释：定义方法 assertAdmin；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问。
```

**源码第 104 行**

```text
    if (me.level !== 3) {
// 注释：判断 if (me.level !== 3) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 105 行**

```text
      throw new ForbiddenException({ code: 403, msg: '权限不足,仅管理员可执行此操作' });
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 106 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 107 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 109 行**

```text
  private async fetchTarget(username: string): Promise<{ username: string; level: number } | null> {
// 注释：定义方法 fetchTarget；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数；`null`＝空值。
```

**源码第 110 行**

```text
    const { rows } = await this.pool.query(
// 注释：从右侧结果中取出 rows，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 111 行**

```text
      'SELECT username, level FROM app.app_users WHERE username = $1 LIMIT 1',
// 注释：提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
```

**源码第 112 行**

```text
      [username],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 113 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 114 行**

```text
    if (rows.length === 0) return null;
// 注释：判断 if (rows.length === 0) return null; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 115 行**

```text
    return { username: rows[0].username as string, level: rows[0].level as number };
// 注释：返回 { username: rows[0].username as string, level: rows[0].level as number } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 116 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 117 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
