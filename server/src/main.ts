/**
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
 *     PLC/机器人 ──▶ edge 采集器 ──(MQTT)──▶ EMQX Broker
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
 *                        CommandService → MQTT publish → EMQX
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
 *      仅为开发方便，生产应收敛为具体前端域名（见 configuration.ts 的 TODO）。
 *   4. enableShutdownHooks：注册进程退出钩子。收到 Ctrl+C / SIGTERM 时会依次调用
 *      各服务的 onModuleDestroy()，作用是「优雅关闭」——关闭 MQTT 长连接、停掉批量
 *      落库的定时器、断开 PG/Redis 连接池，避免丢数据或残留半写状态。
 *   5. app.listen(port)：同时开启 HTTP 与 WebSocket。socket.io 默认复用同一个
 *      HTTP 端口（同一个 Node 进程、同一个 server 实例），所以只监听一个 3000 即可，
 *      不需要额外为 WebSocket 开端口 —— 这是生产部署时端口规划的关键点。
 */
// 1) 引入 reflect-metadata polyfill：让 TypeScript 装饰器能携带类型元数据（见上方说明）
import 'reflect-metadata';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 登录会话:HttpOnly + SameSite=Lax;prod 上 HTTPS 后把 secure 改 true
  app.use(
    cookieSession({
      name: 'lt_sess',
      keys: [config.http.sessionSecret],
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    }),
  );

  // CORS:多个 origin 用逗号分隔;cross-origin cookie 必须 credentials=true
  const raw = config.http.corsOrigin;
  const origins = raw === '*' ? true : raw.split(',').map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: true });

  // 7) 优雅关闭钩子：进程退出时调用各模块的 onModuleDestroy
  app.enableShutdownHooks();
  // 8) 监听端口：HTTP REST 与 WebSocket(socket.io) 共用这一个端口
  await app.listen(config.http.port);
  // 9) 启动成功日志：部署人员看到这行即代表后端已就绪（对应 CLAUDE.md §6 验收标准）
  console.log(`[server] HTTP/WebSocket listening on :${config.http.port}`);
}

// 10) 调用引导函数。用 `void` 显式忽略返回的 Promise：Node 进程会因 HTTP 监听
//     而保持存活，不需要 await；同时避免 lint 报 "floating promise"。
void bootstrap();
