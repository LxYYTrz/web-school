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
  vision: {
    // 视觉机上传图片的共享密钥(Header: X-Vision-Token)。
    // 空字符串 = 禁用上传接口(见 VisionTokenGuard:fail closed,绝不"没配就放开")。
    token: process.env.VISION_TOKEN ?? '',
    storageDir: process.env.VISION_STORAGE_DIR ?? 'D:/line-twin/data/vision',
    // 原图保留小时数;到期由 CleanupService 删文件 + 删表行
    retentionHours: Number(process.env.VISION_RETENTION_HOURS ?? 24),
    thumbMaxEdge: Number(process.env.VISION_THUMB_MAX_EDGE ?? 640),
    thumbQuality: Number(process.env.VISION_THUMB_QUALITY ?? 80),
    // 视觉机不上报 lineId/cameraId 时的兜底值
    defaultLineId: process.env.VISION_DEFAULT_LINE_ID ?? 'line-01',
    defaultCameraId: process.env.VISION_DEFAULT_CAMERA_ID ?? 'cam-01',
    // 纯内存保护上限,不是"业务限制"。这台机同时跑 PLC 轮询,
    // 一次 OOM 会连带采集器一起死,所以留了个远高于实际(5MB)的硬顶。
    maxUploadBytes: Number(process.env.VISION_MAX_UPLOAD_BYTES ?? 100 * 1024 * 1024),
    cleanupIntervalMs: Number(process.env.VISION_CLEANUP_INTERVAL_MS ?? 6 * 3600_000),
  },
  ai: {
    // Hermes 自带的 OpenAI 兼容 API Server。只绑 loopback,外部够不着;
    // 浏览器也永远拿不到 apiKey —— 所有调用都从这里出。
    baseUrl: process.env.AI_BASE_URL ?? 'http://127.0.0.1:8642/v1',
    // 缺 key 时 AI 端点一律 503,不静默降级成"假装能聊"
    apiKey: process.env.AI_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'hermes-agent',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 120000),
    // hermes session 前缀:同一用户复用同一 session,才能保住它的 memory/skills
    sessionPrefix: process.env.AI_SESSION_PREFIX ?? 'lt',
  },
};
