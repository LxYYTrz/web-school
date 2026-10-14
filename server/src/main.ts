import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieSession from 'cookie-session';
import { AppModule } from './app.module';
import { config } from './config/configuration';

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

  app.enableShutdownHooks();
  await app.listen(config.http.port);
  console.log(`[server] HTTP/WebSocket listening on :${config.http.port}`);
}

void bootstrap();
