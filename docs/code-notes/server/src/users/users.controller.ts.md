# server/src/users/users.controller.ts 逐行注释

[打开源码](../../../../../server/src/users/users.controller.ts) · 37 行 · 32 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import { AuthGuard } from '../auth/auth.guard';
// 注释：从 ../auth/auth.guard 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 3 行**

```text
import { CurrentUser } from '../auth/current-user.decorator';
// 注释：从 ../auth/current-user.decorator 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
import type { SessionUser } from '../auth/session-user';
// 注释：从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 5 行**

```text
import { CreateUserDto } from './dto/create-user.dto';
// 注释：从 ./dto/create-user.dto 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 6 行**

```text
import { UpdateUserDto } from './dto/update-user.dto';
// 注释：从 ./dto/update-user.dto 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 7 行**

```text
import { UsersService } from './users.service';
// 注释：从 ./users.service 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 9 行**

```text
@Controller('api/users')
// 注释：装饰器 Controller：声明 HTTP 控制器及路由前缀。
```

**源码第 10 行**

```text
@UseGuards(AuthGuard)
// 注释：装饰器 UseGuards：执行路由前先应用权限守卫。
```

**源码第 11 行**

```text
export class UsersController {
// 注释：声明 `UsersController` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```

**源码第 12 行**

```text
  constructor(private readonly users: UsersService) {}
// 注释：定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 14 行**

```text
  @Get()
// 注释：装饰器 Get：把方法绑定到 GET 路由。
```

**源码第 15 行**

```text
  list(@CurrentUser() me: SessionUser) {
// 注释：定义方法 list；括号中声明参数，花括号内实现逻辑。
```

**源码第 16 行**

```text
    return this.users.list(me);
// 注释：返回 this.users.list(me) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 17 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 19 行**

```text
  @Post()
// 注释：装饰器 Post：把方法绑定到 POST 路由。
```

**源码第 20 行**

```text
  create(@CurrentUser() me: SessionUser, @Body() dto: CreateUserDto) {
// 注释：定义方法 create；括号中声明参数，花括号内实现逻辑。
```

**源码第 21 行**

```text
    return this.users.create(me, dto);
// 注释：返回 this.users.create(me, dto) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 22 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 24 行**

```text
  @Put(':username')
// 注释：装饰器 Put：给后面的类、方法或参数附加元数据。
```

**源码第 25 行**

```text
  update(
// 注释：调用 update，把括号中的值作为参数传入。
```

**源码第 26 行**

```text
    @CurrentUser() me: SessionUser,
// 注释：装饰器 CurrentUser：给后面的类、方法或参数附加元数据。
```

**源码第 27 行**

```text
    @Param('username') username: string,
// 注释：装饰器 Param：读取 URL 路径参数。
```

**源码第 28 行**

```text
    @Body() dto: UpdateUserDto,
// 注释：装饰器 Body：读取请求体。
```

**源码第 29 行**

```text
  ) {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 30 行**

```text
    return this.users.update(me, username, dto);
// 注释：返回 this.users.update(me, username, dto) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 31 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 33 行**

```text
  @Delete(':username')
// 注释：装饰器 Delete：把方法绑定到 DELETE 路由。
```

**源码第 34 行**

```text
  remove(@CurrentUser() me: SessionUser, @Param('username') username: string) {
// 注释：定义方法 remove；括号中声明参数，花括号内实现逻辑。
```

**源码第 35 行**

```text
    return this.users.remove(me, username);
// 注释：返回 this.users.remove(me, username) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 36 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 37 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
