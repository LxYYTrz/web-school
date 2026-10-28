/**
 * 后端统一配置入口，dotenv/config 先加载进程工作目录下的 .env，随后读取 process.env。
 * 按数据库、Redis、MQTT、HTTP、管理员引导、机器通道和 AI 配置阅读；缺失值使用代码中的默认值。
 * 配置对象提供连接目标与选项，实际连接由 InfraModule、MqttIngestService 和 main.ts 等使用者建立。
 */
// dotenv/config 在配置模块求值前从当前进程工作目录读取 .env，默认不覆盖已存在的进程环境变量。
// 下面各字段再通过 process.env 取连接目标、端口等配置，缺失时才采用代码默认值。
// 运行进程的工作目录、已有环境变量和构建产物共同影响实际行为，不能只看到某个 .env 文件就断定进程已经使用它。

import 'dotenv/config';
// 从 dotenv/config 加载本文件需要的对象，供后续处理使用。
// dotenv/config 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用

// 统一配置入口:全部从环境变量读取,默认值仅供本地开发
// 统一配置对象：导出为 const，进程内全局唯一（Node 的模块缓存保证只求值一次）
export const config = {
  // ---------------- MQTT（消息总线）配置 ----------------
  mqtt: {
    // Broker 地址。`??` 表示「环境变量不存在时才用默认值」（null/undefined 才触发）
    url: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
    // 用户名/密码。空字符串视为「未配置」，用 || 转成 undefined，让 mqtt 库走匿名连接
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    // 客户端 ID：必须全局唯一。这里拼上进程 PID 防止多实例互相踢线
    clientId: `line-twin-server-${process.pid}`,
  },
  // ---------------- PostgreSQL / TimescaleDB（历史数据 + 业务表）配置 ----------------
  pg: {
    // 完整连接串，等价于 host/port/user/password/database 五个参数
    connectionString:
      process.env.DATABASE_URL ?? 'postgres://postgres:postgres123@localhost:5432/linetwin',
      // 完整连接串，等价于 host/port/user/password/database 五个参数。
  },
  // ---------------- Redis（实时快照缓存）配置 ----------------
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  // ---------------- HTTP / WebSocket 服务配置 ----------------
  http: {
    // 监听端口。Number() 把字符串环境变量转成数字
    port: Number(process.env.PORT ?? 3000),
    // 将输入转换为 JavaScript 数值。
    // 多个 origin 用逗号分隔(供 cookie 跨域携带);dev 默认 vite dev server
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me',
  },
  app: {
    // 首次启动自动 bootstrap admin 的初始密码;null 表示禁用自动建号
    adminPassword:
    // adminPassword 是初始管理员账号口令配置，值从环境变量或本文件默认值取得
      process.env.ADMIN_PASSWORD === '' ? null : process.env.ADMIN_PASSWORD ?? 'admin123',
  },
  // ---------------- 数据契约主题前缀 ----------------
  // 所有 MQTT 主题以此开头：tl/v1/{lineId}/...
  // 契约版本升级（如 v1 → v2）时只改这里 + 各端对齐，破坏性变更可灰度并行
  topicPrefix: process.env.TOPIC_PREFIX ?? 'tl/v1',
  // ---------------- 机器通道(AI / 脚本直控)----------------
  // 给「不是浏览器」的控制入口用:hermes 的 MCP server 用它调 /api/machine/commands,
  // 让飞书里的 AI 能直接下发指令(演示阶段用)。
  // 留空 = 通道关闭,端点一律 503 —— 不静默放行,也不静默失败。
  machine: {
    commandToken: process.env.MACHINE_COMMAND_TOKEN ?? '',
  },
  ai: {
    // Hermes 自带的 OpenAI 兼容 API Server。只绑 loopback,外部够不着;
    // 浏览器也永远拿不到 apiKey —— 所有调用都从这里出。
    baseUrl: process.env.AI_BASE_URL ?? 'http://127.0.0.1:8642/v1',
    // 缺 key 时 AI 端点一律 503,不静默降级成"假装能聊"
    apiKey: process.env.AI_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'hermes-agent',
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 120000),
    // 将输入转换为 JavaScript 数值。
    // hermes session 前缀:同一用户复用同一 session,才能保住它的 memory/skills
    sessionPrefix: process.env.AI_SESSION_PREFIX ?? 'lt',
  },
};
