# server/src/auth/current-user.decorator.ts 逐行注释

[打开源码](../../../../../server/src/auth/current-user.decorator.ts) · 12 行 · 10 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import type { Request } from 'express';
// 注释：从 express 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 3 行**

```text
import type { SessionUser } from './session-user';
// 注释：从 ./session-user 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 6 行**

```text
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser => {
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量；`unknown`＝需检查后才能使用的类型。
```

**源码第 7 行**

```text
  const req = ctx.switchToHttp().getRequest<Request>();
// 注释：声明 req，初始值由 ctx.switchToHttp().getRequest<Request>() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 8 行**

```text
  return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 9 行**

```text
    username: req.session!.username as string,
// 注释：设置字段 `username`。
```

**源码第 10 行**

```text
    level: req.session!.level as number,
// 注释：设置字段 `level`。
```

**源码第 11 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 12 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```
