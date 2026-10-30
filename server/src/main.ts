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
  // 1. NestFactory 来自 NestJS；AppModule 是项目根模块，列出需要装配的功能模块。
  // 2. create() 返回创建应用的异步结果，await 后才能继续安装中间件和监听端口。
  // 3. NestExpressApplication 是 TypeScript 类型约定，表明这里使用 Express 适配的后端应用。
  // 4. 这与浏览器 web/src/main.ts 的 Vue createApp 是两个进程、两套入口。

  // 登录会话:HttpOnly + SameSite=Lax;prod 上 HTTPS 后把 secure 改 true

  // 把 cookie-session 注册为后端 HTTP 中间件，使登录接口可以写 req.session，后续请求可以读取并验证它。
  // keys 来自配置中的会话签名密钥；HttpOnly 限制脚本读取，SameSite=Lax 约束 Cookie 发送，maxAge 设为 7 天。
  // secure=false 不强制只经 HTTPS 发送；签名用于检查篡改，不等于会话数据加密，也不是 Redis 服务端会话存储。

  app.use(
  // 将 cookie-session 注册为 NestJS/Express 的 HTTP 中间件，使后续接口能读取和写入 req.session。
    // 【调用各部分：部分 / 作用】
    // 部分 | 作用
    // cookieSession() | 创建第三方会话中间件，外层 app.use 安装它。
    // name | Cookie 名称。
    // keys | 配置的签名密钥，不在注释中展示实际值。
    // httpOnly | 限制浏览器脚本直接读取该 Cookie。
    // sameSite | 影响跨站请求携带 Cookie 的规则。
    // secure | 是否强制只经 HTTPS 发送，当前仓库配置为 false。
    // maxAge | 有效期的毫秒数，7×24×60×60×1000 表示 7 天。
    cookieSession({
    // 1. cookieSession 是第三方中间件工厂，外层 app.use() 将它装入 HTTP 请求处理链。
    // 2. name 决定 Cookie 名称，keys 提供签名密钥；username、level 等内容由登录控制器写 req.session。
    // 3. httpOnly 限制浏览器脚本读取；sameSite=lax 影响跨站发送规则；maxAge 使用毫秒。
    // 4. 当前 secure=false 不强制只经 HTTPS 发送。签名检查篡改，不等于把会话内容加密。
    // 5. 本项目不是只给浏览器一个编号、再到 Redis 查询用户会话的实现。
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
  // 1. origins 由当前跨域配置解析而来，credentials=true 允许该跨域响应按规则使用凭据。
  // 2. 它与前端 fetch 的 credentials: include 配合，但都不能绕过浏览器 Cookie、SameSite 或来源检查。
  // 3. 同一个网站入口经 Nginx 转发接口时，浏览器看到的访问来源还要按实际部署地址判断。

  // 7) 优雅关闭钩子：进程退出时调用各模块的 onModuleDestroy
  app.enableShutdownHooks();
  // 8) 监听端口：HTTP REST 与 WebSocket(socket.io) 共用这一个端口

  // 应用完成前面的会话、跨域等配置后，监听 config.http.port 指定的 HTTP 端口，默认值来自统一配置。
  // 本地开发代理和公网 SSH 转发最终都要找到这个后端服务；进程开始监听本身不证明 PLC、数据库或实时数据已经全部可用。

  await app.listen(config.http.port);
  // 1. 使用统一配置指定的端口接收 HTTP 和项目实时服务请求，默认值在 configuration.ts 中定义。
  // 2. 监听成功只说明后端入口已开始接收连接；Redis、数据库、Broker 和 PLC 是否正常要沿各自链路观察。
  // 3. 公网部署中，SSH 在工控机一侧最终连接的就是这个本机后端入口。
  console.log(`[server] HTTP/WebSocket listening on :${config.http.port}`);
}

// 10) 调用引导函数。用 `void` 显式忽略返回的 Promise：Node 进程会因 HTTP 监听
//     而保持存活，不需要 await；同时避免 lint 报 "floating promise"。
void bootstrap();
// 创建 NestJS 应用、配置会话和跨域并监听服务端口。
