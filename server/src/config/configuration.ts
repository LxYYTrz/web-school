import 'dotenv/config';

// 统一配置入口:全部从环境变量读取,默认值仅供本地开发
export const config = {
  mqtt: {
    url: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    clientId: `cloud-server-${process.pid}`,
  },
  pg: {
    connectionString:
      process.env.DATABASE_URL ?? 'postgres://postgres:postgres123@localhost:5432/linetwin',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  http: {
    port: Number(process.env.PORT ?? 3000),
    // 多个 origin 用逗号分隔(供 cookie 跨域携带);dev 默认 vite dev server
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me',
  },
  app: {
    // 首次启动自动 bootstrap admin 的初始密码;null 表示禁用自动建号
    adminPassword:
      process.env.ADMIN_PASSWORD === '' ? null : process.env.ADMIN_PASSWORD ?? 'admin123',
  },
  topicPrefix: process.env.TOPIC_PREFIX ?? 'tl/v1',
};
