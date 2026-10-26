# server/src/users/users.module.ts 逐行注释

[打开源码](../../../../../server/src/users/users.module.ts) · 12 行 · 11 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { Module } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import { UsersController } from './users.controller';
// 注释：从 ./users.controller 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 3 行**

```text
import { UsersService } from './users.service';
// 注释：从 ./users.service 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
import { AuthModule } from '../auth/auth.module';
// 注释：从 ../auth/auth.module 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 6 行**

```text
@Module({
// 注释：装饰器 Module：声明 NestJS 模块的依赖和导出。
```

**源码第 7 行**

```text
  imports: [AuthModule],
// 注释：设置字段 `imports`。
```

**源码第 8 行**

```text
  controllers: [UsersController],
// 注释：设置字段 `controllers`。
```

**源码第 9 行**

```text
  providers: [UsersService],
// 注释：设置字段 `providers`。
```

**源码第 10 行**

```text
  exports: [UsersService],
// 注释：设置字段 `exports`。
```

**源码第 11 行**

```text
})
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 12 行**

```text
export class UsersModule {}
// 注释：声明 `UsersModule` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```
