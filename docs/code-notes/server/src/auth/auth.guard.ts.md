# server/src/auth/auth.guard.ts 逐行注释

[打开源码](../../../../../server/src/auth/auth.guard.ts) · 15 行 · 13 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import type { Request } from 'express';
// 注释：从 express 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 5 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 6 行**

```text
export class AuthGuard implements CanActivate {
// 注释：声明 `AuthGuard` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。
```

**源码第 7 行**

```text
  canActivate(context: ExecutionContext): boolean {
// 注释：定义方法 canActivate；括号中声明参数，花括号内实现逻辑。
```

**源码第 8 行**

```text
    const req = context.switchToHttp().getRequest<Request>();
// 注释：声明 req，初始值由 context.switchToHttp().getRequest<Request>() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 9 行**

```text
    const session = req.session;
// 注释：声明 session，初始值由 req.session 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 10 行**

```text
    if (!session || !session.username || typeof session.level !== 'number') {
// 注释：判断 if (!session || !session.username || typeof session.level !== 'number') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型。
```

**源码第 11 行**

```text
      throw new UnauthorizedException({ code: 401, msg: '未登录' });
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 12 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 13 行**

```text
    return true;
// 注释：返回 true 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 14 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 15 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
