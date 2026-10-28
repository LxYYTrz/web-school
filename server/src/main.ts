/**
 * 后端进程入口，Node.js 执行 bootstrap()，由 NestFactory 根据 AppModule 创建 NestJS 应用。
 * 按创建应用 → 安装 cookie-session → 配置跨域 → 注册关闭钩子 → 监听端口的顺序阅读。
 * 应用创建后，各模块负责自己的初始化和回调；main.ts 不逐帧采集 PLC，也不创建前端 Vue 应用。
 */
// 1) 引入 reflect-metadata polyfill：让 TypeScript 装饰器能携带类型元数据（见上方说明）
import 'reflect-metadata';
// 从 reflect-metadata 加载本文件需要的对象，供后续处理使用。
// reflect-metadata 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
// 2) NestJS 核心工厂：创建/启动 HTTP + WebSocket 应用
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieSession from 'cookie-session';
// 3) 根模块：汇总所有业务模块（infra/state/history/realtime/ingest/command）
import { AppModule } from './app.module';
// 4) 统一配置对象：端口、数据库、MQTT 地址等，全部来自环境变量
import { config } from './config/configuration';

/**
 * 引导函数（bootstrap）：后端的异步启动流程。
 * 之所以要 async：NestFactory.create 会完成模块依赖解析、生命周期钩子
 * （onModuleInit）等异步工作，必须 await 之后才算「就绪」。
 */
async function bootstrap() {

  // 后端启动入口让 NestJS 根据 AppModule 创建应用实例，并装配模块和依赖。
  // app 是后端 NestExpressApplication，与浏览器 main.ts 中 Vue 的 app 是不同对象；后面的 app.use() 注册 HTTP 中间件。

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 登录会话:HttpOnly + SameSite=Lax;prod 上 HTTPS 后把 secure 改 true

  // 把 cookie-session 注册为后端 HTTP 中间件，使登录接口可以写 req.session，后续请求可以读取并验证它。
  // keys 来自配置中的会话签名密钥；HttpOnly 限制脚本读取，SameSite=Lax 约束 Cookie 发送，maxAge 设为 7 天。
  // secure=false 不强制只经 HTTPS 发送；签名用于检查篡改，不等于会话数据加密，也不是 Redis 服务端会话存储。

  app.use(
  // 将 cookie-session 注册为 NestJS/Express 的 HTTP 中间件，使后续接口能读取和写入 req.session。
    cookieSession({
    // 创建 cookie-session 中间件，由外层 app.use 安装，使登录响应能保存会话、后续请求能验证并读取会话。
    // cookieSession 来自 cookie-session 库；项目在登录控制器写 req.session，中间件负责处理签名 Cookie，不需要控制器自己拼接 Cookie。
      name: 'lt_sess',
      keys: [config.http.sessionSecret],
      // 配置登录 Cookie 的签名密钥，供中间件签名和检查内容是否被篡改。
      // keys 是 cookie-session 的配置项；config.http.sessionSecret 来自项目配置；签名用于校验完整性，不等于加密会话内容。
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
      // 把登录 Cookie 的最长有效期配置为 7 天，供浏览器按 Cookie 规则保存和发送。
      // maxAge 的单位是毫秒；7 × 24 × 60 × 60 × 1000 将 7 天换算成毫秒，与 Redis 快照的 60 秒有效期是不同配置。
    }),
  );

  // CORS:多个 origin 用逗号分隔;cross-origin cookie 必须 credentials=true
  const raw = config.http.corsOrigin;
  const origins = raw === '*' ? true : raw.split(',').map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: true });

  // 7) 优雅关闭钩子：进程退出时调用各模块的 onModuleDestroy
  app.enableShutdownHooks();
  // 8) 监听端口：HTTP REST 与 WebSocket(socket.io) 共用这一个端口

  // 应用完成前面的会话、跨域等配置后，监听 config.http.port 指定的 HTTP 端口，默认值来自统一配置。
  // 本地开发代理和公网 SSH 转发最终都要找到这个后端服务；进程开始监听本身不证明 PLC、数据库或实时数据已经全部可用。

  await app.listen(config.http.port);
  // 让后端 HTTP 服务在配置的端口开始接收请求。
  // 9) 启动成功日志：部署人员看到这行即代表后端已就绪（对应 CLAUDE.md §6 验收标准）
  console.log(`[server] HTTP/WebSocket listening on :${config.http.port}`);
}

// 10) 调用引导函数。用 `void` 显式忽略返回的 Promise：Node 进程会因 HTTP 监听
//     而保持存活，不需要 await；同时避免 lint 报 "floating promise"。
void bootstrap();
// 创建 NestJS 应用、配置会话和跨域并监听服务端口。
