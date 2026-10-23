# server/src/main.ts 逐行说明

[打开源码](../../../../server/src/main.ts) · 94 行 · 26 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 49 | <code>import 'reflect-metadata';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 51 | <code>import { NestFactory } from '@nestjs/core';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 52 | <code>import { NestExpressApplication } from '@nestjs/platform-express';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 53 | <code>import cookieSession from 'cookie-session';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 55 | <code>import { AppModule } from './app.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 57 | <code>import { config } from './config/configuration';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 64 | <code>async function bootstrap() {</code> | 定义函数 `bootstrap`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 65 | <code>const app = await NestFactory.create&lt;NestExpressApplication&gt;(AppModule);</code> | 声明变量 `app` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 68 | <code>app.use(</code> | 调用函数、设置值或更新状态。 |
| 69 | <code>cookieSession({</code> | 调用函数、设置值或更新状态。 |
| 70 | <code>name: 'lt_sess',</code> | 设置字段 `name`。 |
| 71 | <code>keys: [config.http.sessionSecret],</code> | 设置字段 `keys`。 |
| 72 | <code>httpOnly: true,</code> | 设置字段 `httpOnly`。 关键字：`true`＝布尔真值。 |
| 73 | <code>sameSite: 'lax',</code> | 设置字段 `sameSite`。 |
| 74 | <code>secure: false,</code> | 设置字段 `secure`。 关键字：`false`＝布尔假值。 |
| 75 | <code>maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天</code> | 设置字段 `maxAge`。 |
| 76 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 77 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 80 | <code>const raw = config.http.corsOrigin;</code> | 声明变量 `raw` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 81 | <code>const origins = raw === '*' ? true : raw.split(',').map((s) =&gt; s.trim());</code> | 声明变量 `origins` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`true`＝布尔真值。 |
| 82 | <code>app.enableCors({ origin: origins, credentials: true });</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 85 | <code>app.enableShutdownHooks();</code> | 调用函数、设置值或更新状态。 |
| 87 | <code>await app.listen(config.http.port);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 89 | <code>console.log(`[server] HTTP/WebSocket listening on :${config.http.port}`);</code> | 调用函数、设置值或更新状态。 |
| 90 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 94 | <code>void bootstrap();</code> | 续写当前表达式、对象、类型或调用。 关键字：`void`＝表示没有返回值。 |
