/**
 // 这一段负责配置和实现 server/src/main.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：后端进程入口（启动引导 / bootstrap）
 * 所属模块：server/（NestJS 后端，最终部署在"工控机"上）
 * ============================================================================
 *
 * 【宏观定位】整个系统的"心脏起搏点"。后端只有一个进程、只有这一个文件负责把
 *   所有模块装配起来并对外监听端口。它对应部署清单里的「NestJS 后端 :3000」。
 *
 * 【它在整体架构中的位置】
 *
 *   上行（设备 → 浏览器）：
 *     PLC/机器人 ──▶ edge 采集器 ──(MQTT)──▶ 本机 Broker
 *                                              │ 本进程订阅
 *                                              ▼
 *                              MqttIngestService(ingest/)
 *                                              │ 三路分发
 *                     ┌────────────────────────┼────────────────────────┐
 *                     ▼                        ▼                        ▼
 *            Redis 实时快照            TimescaleDB 历史           WebSocket 推送
 *              (state/)                 (history/)              (realtime/)
 *                     │                        │                        │
 *                     └────────── 浏览器 ◀─────┴──── 经 Nginx + SSH 隧道 ─┘
 *
 *   下行（浏览器 → 设备）：
 *     浏览器 ──(HTTPS)──▶ 云端 Nginx ──(SSH 隧道)──▶ 本进程 CommandController
 *                                              │
 *                                              ▼
 *                        CommandService → MQTT publish → 本机 Broker
 *                                              → 采集器 → 写 PLC
 *
 * 【本文件逐行说明】
 *   1. 'reflect-metadata'：NestJS 依赖「装饰器 + 依赖注入」元数据（如 @Injectable、
 *      @Inject 的类型信息），这个 polyfill 必须第一个 import，否则 DI 容器读不到
 *      构造函数参数类型，启动时会报 "Nest can't resolve dependencies"。
 *   2. NestFactory.create(AppModule)：创建应用实例。AppModule 是「根模块」，
 *      它 imports 的六个业务模块决定了系统里有哪些能力（见 app.module.ts）。
 *   3. enableCors：开发期前端 Vite 在 5173、后端在 3000，属于不同源，浏览器会拦截，
 *      所以必须放行。生产环境由 Nginx 做同源反代（前端与 /api 同域），此��宽松设置
 *      仅为开发方便，生产应通过 CORS_ORIGIN 收敛为具体前端域名。
 *   4. enableShutdownHooks：注册进程退出钩子。收到 Ctrl+C / SIGTERM 时会依次调用
 *      各服务的 onModuleDestroy()，作用是「优雅关闭」——关闭 MQTT 长连接、停掉批量
 *      落库的定时器、断开 PG/Redis 连接池，避免丢数据或残留半写状态。
 *   5. app.listen(port)：同时开启 HTTP 与 WebSocket。socket.io 默认复用同一个
 *      HTTP 端口（同一个 Node 进程、同一个 server 实例），所以只监听一个 3000 即可，
 *      不需要额外为 WebSocket 开端口 —— 这是生产部署时端口规划的关键点。
 */
// 1) 引入 reflect-metadata polyfill：让 TypeScript 装饰器能携带类型元数据（见上方说明）
import 'reflect-metadata';
// 从 reflect-metadata 加载本文件需要的对象，供后续处理使用。
// reflect-metadata 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
// 2) NestJS 核心工厂：创建/启动 HTTP + WebSocket 应用
import { NestFactory } from '@nestjs/core';
// 从 @nestjs/core 导入这一行列出的符号，供本文件调用。
// NestFactory：从 @nestjs/core 导入的对象，用于本文件的NestJS 应用创建与请求上下文支持
import { NestExpressApplication } from '@nestjs/platform-express';
// 从 @nestjs/platform-express 导入这一行列出的符号，供本文件调用。
// NestExpressApplication：从 @nestjs/platform-express 导入的对象，用于本文件的NestJS 对 Express HTTP 服务的类型支持
import cookieSession from 'cookie-session';
// 从 cookie-session 导入这一行列出的符号，供本文件调用。
// cookieSession：从 cookie-session 导入的对象，用于本文件的基于签名 Cookie 的登录会话中间件
// 3) 根模块：汇总所有业务模块（infra/state/history/realtime/ingest/command）
import { AppModule } from './app.module';
// 从 ./app.module 导入这一行列出的符号，供本文件调用。
// AppModule：从 ./app.module 导入的对象，用于本文件的调用或类型约束
// 4) 统一配置对象：端口、数据库、MQTT 地址等，全部来自环境变量
import { config } from './config/configuration';
// 从 ./config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值

/**
 * 引导函数（bootstrap）：后端的异步启动流程。
 * 之所以要 async：NestFactory.create 会完成模块依赖解析、生命周期钩子
 * （onModuleInit）等异步工作，必须 await 之后才算「就绪」。
 */
// 这一段定义 bootstrap，用于创建 NestJS 应用、配置会话和跨域并监听服务端口。
async function bootstrap() {
// 定义函数 bootstrap。
// bootstrap：创建 NestJS 应用、配置会话和跨域并监听服务端口
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 根据 await NestFactory.create<NestExpressApplication>(AppModule) 设置 app，供当前流程后续使用。
  // app：本处保存 await NestFactory.create<NestExpressApplication>(AppModule) 的结果；NestFactory：从 @nestjs/core 导入的对象，用于本文件的NestJS 应用创建与请求上下文支持；create：提供 create 的本地处理逻辑；NestExpressApplication：从 @nestjs/platform-express 导入的对象，用于本文件的NestJS 对 Express HTTP 服务的类型支持；AppModule：从 ./app.module 导入的对象，用于本文件的调用或类型约束

  // 登录会话:HttpOnly + SameSite=Lax;prod 上 HTTPS 后把 secure 改 true
  app.use(
  // 向应用实例注册状态管理、路由或界面组件插件。
  // app：本处保存 await NestFactory.create<NestExpressApplication>(AppModule) 的结果；use：本处声明的字段或类型，类型为 this
    cookieSession({
    // 执行 cookieSession 对应的本地处理，使用本行提供的数据。
    // cookieSession：从 cookie-session 导入的对象，用于本文件的基于签名 Cookie 的登录会话中间件
      name: 'lt_sess',
      // 声明或设置 name，用于当前对象的名称字段。
      // name：当前对象的名称字段
      keys: [config.http.sessionSecret],
      // 声明或设置 keys，用于当前对象或接口的对应数据。
      // config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；sessionSecret：登录 Cookie 签名密钥
      httpOnly: true,
      // 声明或设置 httpOnly，用于当前对象或接口的对应数据。
      // httpOnly 是此处声明的字段，类型或取值约束为 true
      sameSite: 'lax',
      // 声明或设置 sameSite，用于当前对象或接口的对应数据。
      // sameSite 是当前映射表的查找键；「lax」是使用该键时得到的文字或分类值
      secure: false,
      // 声明或设置 secure，用于当前对象或接口的对应数据。
      // secure 是此处声明的字段，类型或取值约束为 false
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
      // 声明或设置 maxAge，用于当前对象或接口的对应数据。
      // maxAge 是此处声明的字段，类型或取值约束为 7 * 24 * 60 * 60 * 1000
    }),
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 本行完成上面一层已说明的函数、分支或对象配置
  );
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  // CORS:多个 origin 用逗号分隔;cross-origin cookie 必须 credentials=true
  const raw = config.http.corsOrigin;
  // 根据 config.http.corsOrigin 设置 raw，供当前流程后续使用。
  // raw：本处保存 config.http.corsOrigin 的结果；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；corsOrigin：config.http 对象上的字段或操作
  const origins = raw === '*' ? true : raw.split(',').map((s) => s.trim());
  // 按分隔符拆分字符串，将结果保存或写入 origins。
  // origins：本处保存 raw === '*' ? true : raw.split(',').map((s) => s.trim()) 的结果；raw：本处保存 config.http.corsOrigin 的结果；split：按分隔符拆分字符串；map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；s：当前方法接收的参数；trim：移除字符串两端空白
  app.enableCors({ origin: origins, credentials: true });
  // 执行 enableCors 对应的本地处理，使用本行提供的数据。
  // app：本处保存 await NestFactory.create<NestExpressApplication>(AppModule) 的结果；enableCors：本处声明的字段或类型，类型为 void；origins：本处保存 raw === '*' ? true : raw.split(',').map((s) => s.trim()) 的结果；credentials：浏览器请求是否携带登录 Cookie 的配置

  // 7) 优雅关闭钩子：进程退出时调用各模块的 onModuleDestroy
  app.enableShutdownHooks();
  // 执行 enableShutdownHooks 对应的本地处理，使用本行提供的数据。
  // app：本处保存 await NestFactory.create<NestExpressApplication>(AppModule) 的结果；enableShutdownHooks：本处声明的字段或类型，类型为 this
  // 8) 监听端口：HTTP REST 与 WebSocket(socket.io) 共用这一个端口
  await app.listen(config.http.port);
  // 让后端 HTTP 服务在配置的端口开始接收请求。
  // app：本处保存 await NestFactory.create<NestExpressApplication>(AppModule) 的结果；listen：本处声明的字段或类型，类型为 Promise<TServer>；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；port：网络连接的目标端口
  // 9) 启动成功日志：部署人员看到这行即代表后端已就绪（对应 CLAUDE.md §6 验收标准）
  console.log(`[server] HTTP/WebSocket listening on :${config.http.port}`);
  // 输出调试或运行日志。
  // console：浏览器或 Node.js 的日志输出对象；log：输出调试或运行日志；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；port：网络连接的目标端口
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了创建 NestJS 应用、配置会话和跨域并监听服务端口的实现；实际结果由运行时输入和执行分支决定。

// 10) 调用引导函数。用 `void` 显式忽略返回的 Promise：Node 进程会因 HTTP 监听
//     而保持存活，不需要 await；同时避免 lint 报 "floating promise"。
void bootstrap();
// 创建 NestJS 应用、配置会话和跨域并监听服务端口。
// bootstrap：创建 NestJS 应用、配置会话和跨域并监听服务端口
// 这一段提供了配置和实现 server/src/main.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
