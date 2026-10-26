# server/src/auth/auth.service.ts 逐行注释

[打开源码](../../../../../server/src/auth/auth.service.ts) · 31 行 · 27 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { Inject, Injectable } from '@nestjs/common';
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

**源码第 7 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 8 行**

```text
export class AuthService {
// 注释：声明 `AuthService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```

**源码第 9 行**

```text
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
// 注释：定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 11 行**

```text
  async verifyCredentials(username: string, password: string): Promise<{ username: string; level: number }> {
// 注释：定义方法 verifyCredentials；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 12 行**

```text
    if (!username || !password) {
// 注释：判断 if (!username || !password) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 13 行**

```text
      throw new BadCredentials();
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 14 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 15 行**

```text
    const { rows } = await this.pool.query(
// 注释：从右侧结果中取出 rows，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 16 行**

```text
      'SELECT password, level FROM app.app_users WHERE username = $1 LIMIT 1',
// 注释：提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
```

**源码第 17 行**

```text
      [username],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 18 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 19 行**

```text
    if (rows.length === 0) throw new BadCredentials();
// 注释：判断 if (rows.length === 0) throw new BadCredentials(); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 20 行**

```text
    const ok = await bcrypt.compare(password, rows[0].password as string);
// 注释：声明 ok，初始值由 await bcrypt.compare(password, rows[0].password as string) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 21 行**

```text
    if (!ok) throw new BadCredentials();
// 注释：判断 if (!ok) throw new BadCredentials(); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 22 行**

```text
    return { username, level: rows[0].level as number };
// 注释：返回 { username, level: rows[0].level as number } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 23 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 24 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 26 行**

```text
import { UnauthorizedException } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 27 行**

```text
class BadCredentials extends UnauthorizedException {
// 注释：声明 `BadCredentials` 的结构。 关键字：`class`＝定义类；`extends`＝继承父类。
```

**源码第 28 行**

```text
  constructor() {
// 注释：定义类的构造函数；创建实例时接收参数并初始化依赖。
```

**源码第 29 行**

```text
    super({ code: 401, msg: '用户名或密码错误' });
// 注释：调用 super；括号中的表达式是传入的参数。 关键字：`super`＝父类实现。
```

**源码第 30 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 31 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
