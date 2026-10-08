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
    corsOrigin: process.env.CORS_ORIGIN ?? '*', // TODO 生产收敛为前端域名
  },
  topicPrefix: process.env.TOPIC_PREFIX ?? 'tl/v1',
};
