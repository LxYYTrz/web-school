# server/src/main.ts 逐行注释

[打开源码](../../../../server/src/main.ts) · 94 行 · 26 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 49 行**

```text
import 'reflect-metadata';
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 51 行**

```text
import { NestFactory } from '@nestjs/core';
// 注释：从 @nestjs/core 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 52 行**

```text
import { NestExpressApplication } from '@nestjs/platform-express';
// 注释：从 @nestjs/platform-express 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 53 行**

```text
import cookieSession from 'cookie-session';
// 注释：从 cookie-session 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 55 行**

```text
import { AppModule } from './app.module';
// 注释：从 ./app.module 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 57 行**

```text
import { config } from './config/configuration';
// 注释：从 ./config/configuration 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 64 行**

```text
async function bootstrap() {
// 注释：定义函数 `bootstrap`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 65 行**

```text
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
// 注释：声明 app，初始值由 await NestFactory.create<NestExpressApplication>(AppModule) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 68 行**

```text
  app.use(
// 注释：调用 app.use，把括号中的值作为参数传入。
```

**源码第 69 行**

```text
    cookieSession({
// 注释：调用 cookieSession，把括号中的值作为参数传入。
```

**源码第 70 行**

```text
      name: 'lt_sess',
// 注释：设置字段 `name`。
```

**源码第 71 行**

```text
      keys: [config.http.sessionSecret],
// 注释：设置字段 `keys`。
```

**源码第 72 行**

```text
      httpOnly: true,
// 注释：设置字段 `httpOnly`。 关键字：`true`＝布尔真值。
```

**源码第 73 行**

```text
      sameSite: 'lax',
// 注释：设置字段 `sameSite`。
```

**源码第 74 行**

```text
      secure: false,
// 注释：设置字段 `secure`。 关键字：`false`＝布尔假值。
```

**源码第 75 行**

```text
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
// 注释：设置字段 `maxAge`。
```

**源码第 76 行**

```text
    }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 77 行**

```text
  );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 80 行**

```text
  const raw = config.http.corsOrigin;
// 注释：声明 raw，初始值由 config.http.corsOrigin 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 81 行**

```text
  const origins = raw === '*' ? true : raw.split(',').map((s) => s.trim());
// 注释：声明 origins，初始值由 raw === '*' ? true : raw.split(',').map((s) => s.trim()) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`true`＝布尔真值。
```

**源码第 82 行**

```text
  app.enableCors({ origin: origins, credentials: true });
// 注释：调用 app.enableCors，把括号中的值作为参数传入。 关键字：`true`＝布尔真值。
```

**源码第 85 行**

```text
  app.enableShutdownHooks();
// 注释：调用 app.enableShutdownHooks，把括号中的值作为参数传入。
```

**源码第 87 行**

```text
  await app.listen(config.http.port);
// 注释：调用 app.listen，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 89 行**

```text
  console.log(`[server] HTTP/WebSocket listening on :${config.http.port}`);
// 注释：调用 console.log，把括号中的值作为参数传入。
```

**源码第 90 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 94 行**

```text
void bootstrap();
// 注释：调用 bootstrap；括号中的表达式是传入的参数。 关键字：`void`＝表示没有返回值。
```
