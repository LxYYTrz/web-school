/**
 // 这一段负责配置和实现 server/src/config/configuration.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：统一配置入口（所有环境变量的唯一读取点）
 * 所属模块：server/src/config/
 * ============================================================================
 *
 * 【宏观定位】整个后端「读配置」的唯一出口。
 *   好处：改部署环境（本地 / 工控机 / 云端）时，只改 .env，不动任何业务代码。
 *
 * 【配置从哪来】优先级（后者覆盖前者）：
 *   1. 代码里的默认值（下面这些 `?? 'xxx'`）—— 仅供本地开发
 *   2. server/.env 文件 —— 由 dotenv 在启动时读入 process.env
 *   3. 操作系统环境变量 —— 优先级最高（容器/生产环境常用）
 *
 * 【为什么要 dotenv】`import 'dotenv/config'` 是副作用导入：它会在模块加载时
 *   自动读取当前工作目录下的 .env 文件，把键值对写入 process.env。
 *   注意：它读的是「进程启动目录」下的 .env，所以必须在 server/ 目录下启动进程，
 *   否则找不到（现场都是 `cd server && node dist\main.js`）。
 *
 * 【各配置项与真实基础设施的对应关系】
 *
 *   mqtt.url    ──▶ EMQX / Mosquitto 的 MQTT 端口
 *                  工控机本机部署 → mqtt://localhost:1883
 *   mqtt.clientId ─▶ MQTT 客户端标识。Broker 要求每个在线客户端 ID 唯一，
 *                  否则新连接会把旧连接踢下线（MQTT 协议规定的行为）。
 *                  这里用 `line-twin-server-${进程PID}`：同一台机器跑多个实例也不会冲突。
 *   pg.connectionString ─▶ PostgreSQL/TimescaleDB 连接串
 *                  生产数据库在工控机本机，不经 SSH 隧道。
 *   redis.url   ──▶ Redis（工控机本机 Memurai / Redis）地址
 *   http.port   ──▶ 后端 HTTP + WebSocket 共用端口（默认 3000）
 *   http.corsOrigin ─▶ 跨域白名单。生产应收敛为前端域名（当前是 '*'）
 *   topicPrefix ──▶ 数据契约的 MQTT 主题前缀，见 docs/contract/README.md
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
// 导出这一行声明的符号，供项目其他模块使用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值
  // ---------------- MQTT（消息总线）配置 ----------------
  mqtt: {
  // 声明或设置 mqtt，用于MQTT 客户端或项目 MQTT 服务实例，以本处定义为准。
  // mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
    // Broker 地址。`??` 表示「环境变量不存在时才用默认值」（null/undefined 才触发）
    url: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
    // 声明或设置 url，用于当前服务的连接地址。
    // url：当前服务的连接地址；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；MQTT_URL：process.env 对象上的字段或操作
    // 用户名/密码。空字符串视为「未配置」，用 || 转成 undefined，让 mqtt 库走匿名连接
    username: process.env.MQTT_USERNAME || undefined,
    // 声明或设置 username，用于账号用户名。
    // username：账号用户名；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；MQTT_USERNAME：process.env 对象上的字段或操作
    password: process.env.MQTT_PASSWORD || undefined,
    // 声明或设置 password，用于登录口令或数据库保存的口令摘要，具体取决于所在对象。
    // password：登录口令或数据库保存的口令摘要，具体取决于所在对象；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；MQTT_PASSWORD：process.env 对象上的字段或操作
    // 客户端 ID：必须全局唯一。这里拼上进程 PID 防止多实例互相踢线
    clientId: `line-twin-server-${process.pid}`,
    // 声明或设置 clientId，用于MQTT 客户端唯一标识。
    // clientId：MQTT 客户端唯一标识；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；pid：本处声明的字段或类型，类型为 number
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // ---------------- PostgreSQL / TimescaleDB（历史数据 + 业务表）配置 ----------------
  pg: {
  // 声明或设置 pg，用于当前对象或接口的对应数据。
  // pg 是此处声明的字段，类型或取值约束为 {
    // 完整连接串，等价于 host/port/user/password/database 五个参数
    connectionString:
    // 声明或设置 connectionString，用于PostgreSQL 的完整连接地址与登录配置。
    // connectionString：PostgreSQL 的完整连接地址与登录配置
      process.env.DATABASE_URL ?? 'postgres://postgres:postgres123@localhost:5432/linetwin',
      // 完整连接串，等价于 host/port/user/password/database 五个参数。
      // process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；DATABASE_URL：process.env 对象上的字段或操作
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // ---------------- Redis（实时快照缓存）配置 ----------------
  redis: {
  // 声明或设置 redis，用于注入或创建的 Redis 客户端。
  // redis：注入或创建的 Redis 客户端
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    // 声明或设置 url，用于当前服务的连接地址。
    // url：当前服务的连接地址；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；REDIS_URL：process.env 对象上的字段或操作
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // ---------------- HTTP / WebSocket 服务配置 ----------------
  http: {
  // 声明或设置 http，用于当前对象或接口的对应数据。
  // http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误
    // 监听端口。Number() 把字符串环境变量转成数字
    port: Number(process.env.PORT ?? 3000),
    // 将输入转换为 JavaScript 数值。
    // port：网络连接的目标端口；Number：将值转换为数字的 JavaScript 构造函数；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503
    // 多个 origin 用逗号分隔(供 cookie 跨域携带);dev 默认 vite dev server
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    // 声明或设置 corsOrigin，用于当前对象或接口的对应数据。
    // process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；CORS_ORIGIN：process.env 对象上的字段或操作
    sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me',
    // 声明或设置 sessionSecret，用于登录 Cookie 签名密钥。
    // sessionSecret：登录 Cookie 签名密钥；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；SESSION_SECRET：process.env 对象上的字段或操作
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  app: {
  // 声明或设置 app，用于当前对象或接口的对应数据。
  // app 是此处声明的字段，类型或取值约束为 {
    // 首次启动自动 bootstrap admin 的初始密码;null 表示禁用自动建号
    adminPassword:
    // 声明或设置 adminPassword，用于当前对象或接口的对应数据。
    // adminPassword 是初始管理员账号口令配置，值从环境变量或本文件默认值取得
      process.env.ADMIN_PASSWORD === '' ? null : process.env.ADMIN_PASSWORD ?? 'admin123',
      // 把右侧表达式的结果写入 process.env.ADMIN_PASSWORD。
      // process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；ADMIN_PASSWORD：process.env 对象上的字段或操作
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // ---------------- 数据契约主题前缀 ----------------
  // 所有 MQTT 主题以此开头：tl/v1/{lineId}/...
  // 契约版本升级（如 v1 → v2）时只改这里 + 各端对齐，破坏性变更可灰度并行
  topicPrefix: process.env.TOPIC_PREFIX ?? 'tl/v1',
  // 声明或设置 topicPrefix，用于当前对象或接口的对应数据。
  // process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；TOPIC_PREFIX：process.env 对象上的字段或操作
  // ---------------- 机器通道(AI / 脚本直控)----------------
  // 给「不是浏览器」的控制入口用:hermes 的 MCP server 用它调 /api/machine/commands,
  // 让飞书里的 AI 能直接下发指令(演示阶段用)。
  // 留空 = 通道关闭,端点一律 503 —— 不静默放行,也不静默失败。
  machine: {
  // 声明或设置 machine，用于当前对象或接口的对应数据。
  // machine 是此处声明的字段，类型或取值约束为 {
    commandToken: process.env.MACHINE_COMMAND_TOKEN ?? '',
    // 声明或设置 commandToken，用于本机机器控制通道的共享令牌，为空时关闭通道。
    // commandToken：本机机器控制通道的共享令牌，为空时关闭通道；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；MACHINE_COMMAND_TOKEN：process.env 对象上的字段或操作
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  ai: {
  // 声明或设置 ai，用于当前对象或接口的对应数据。
  // ai 是此处声明的字段，类型或取值约束为 {
    // Hermes 自带的 OpenAI 兼容 API Server。只绑 loopback,外部够不着;
    // 浏览器也永远拿不到 apiKey —— 所有调用都从这里出。
    baseUrl: process.env.AI_BASE_URL ?? 'http://127.0.0.1:8642/v1',
    // 声明或设置 baseUrl，用于Hermes API 的服务根地址。
    // baseUrl：Hermes API 的服务根地址；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；AI_BASE_URL：process.env 对象上的字段或操作
    // 缺 key 时 AI 端点一律 503,不静默降级成"假装能聊"
    apiKey: process.env.AI_API_KEY ?? '',
    // 声明或设置 apiKey，用于后端调用 Hermes 所用的 API 密钥。
    // apiKey：后端调用 Hermes 所用的 API 密钥；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；AI_API_KEY：process.env 对象上的字段或操作
    model: process.env.AI_MODEL ?? 'hermes-agent',
    // 声明或设置 model，用于发送给 Hermes 的模型标识。
    // model：发送给 Hermes 的模型标识；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；AI_MODEL：process.env 对象上的字段或操作
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 120000),
    // 将输入转换为 JavaScript 数值。
    // Number：将值转换为数字的 JavaScript 构造函数；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；AI_TIMEOUT_MS：process.env 对象上的字段或操作
    // hermes session 前缀:同一用户复用同一 session,才能保住它的 memory/skills
    sessionPrefix: process.env.AI_SESSION_PREFIX ?? 'lt',
    // 声明或设置 sessionPrefix，用于生成按用户隔离的 AI 会话编号的前缀。
    // sessionPrefix：生成按用户隔离的 AI 会话编号的前缀；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；AI_SESSION_PREFIX：process.env 对象上的字段或操作
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/config/configuration.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
