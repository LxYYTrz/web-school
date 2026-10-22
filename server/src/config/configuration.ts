/**
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
 *   否则找不到（部署手册里都是 `cd server && node dist\main.js`）。
 *
 * 【各配置项与真实基础设施的对应关系】
 *
 *   mqtt.url    ──▶ EMQX / Mosquitto 的 MQTT 端口
 *                  工控机本机部署 → mqtt://localhost:1883
 *                  云端部署     → mqtt://<云服务器IP>:8883（TLS，见部署手册）
 *   mqtt.clientId ─▶ MQTT 客户端标识。Broker 要求每个在线客户端 ID 唯一，
 *                  否则新连接会把旧连接踢下线（MQTT 协议规定的行为）。
 *                  这里用 `cloud-server-${进程PID}`：同一台机器跑多个实例也不会冲突。
 *   pg.connectionString ─▶ PostgreSQL/TimescaleDB 连接串
 *                  注意：**最终部署形态下，这里的 localhost:5432 是 SSH 隧道的入口**，
 *                  隧道另一端才是云服务器上的真实数据库（见 docs/deployment.md）。
 *   redis.url   ──▶ Redis（工控机本机 Memurai / Redis）地址
 *   http.port   ──▶ 后端 HTTP + WebSocket 共用端口（默认 3000）
 *   http.corsOrigin ─▶ 跨域白名单。生产应收敛为前端域名（当前是 '*'）
 *   topicPrefix ──▶ 数据契约的 MQTT 主题前缀，见 docs/contract/README.md
 */

import 'dotenv/config'; // 副作用导入：启动时自动把 server/.env 载入 process.env

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
    clientId: `cloud-server-${process.pid}`,
  },

  // ---------------- PostgreSQL / TimescaleDB（历史数据 + 业务表）配置 ----------------
  pg: {
    // 完整连接串，等价于 host/port/user/password/database 五个参数
    connectionString:
      process.env.DATABASE_URL ?? 'postgres://postgres:postgres123@localhost:5432/linetwin',
  },

  // ---------------- Redis（实时快照缓存）配置 ----------------
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  // ---------------- HTTP / WebSocket 服务配置 ----------------
  http: {
    // 监听端口。Number() 把字符串环境变量转成数字
    port: Number(process.env.PORT ?? 3000),
    // 跨域来源。开发期需要 '*'；TODO 生产收敛为前端域名（安全要求，见上）
    corsOrigin: process.env.CORS_ORIGIN ?? '*', // TODO 生产收敛为前端域名
  },

  // ---------------- 数据契约主题前缀 ----------------
  // 所有 MQTT 主题以此开头：tl/v1/{lineId}/...
  // 契约版本升级（如 v1 → v2）时只改这里 + 各端对齐，破坏性变更可灰度并行
  topicPrefix: process.env.TOPIC_PREFIX ?? 'tl/v1',
};
