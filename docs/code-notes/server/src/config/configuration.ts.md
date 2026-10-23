# server/src/config/configuration.ts 逐行说明

[打开源码](../../../../../server/src/config/configuration.ts) · 94 行 · 36 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 34 | <code>import 'dotenv/config';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 38 | <code>export const config = {</code> | 声明变量 `config` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 40 | <code>mqtt: {</code> | 设置字段 `mqtt`。 |
| 42 | <code>url: process.env.MQTT_URL ?? 'mqtt://localhost:1883',</code> | 设置字段 `url`。 |
| 44 | <code>username: process.env.MQTT_USERNAME &#124;&#124; undefined,</code> | 设置字段 `username`。 关键字：`undefined`＝未定义值。 |
| 45 | <code>password: process.env.MQTT_PASSWORD &#124;&#124; undefined,</code> | 设置字段 `password`。 关键字：`undefined`＝未定义值。 |
| 47 | <code>clientId: `line-twin-server-${process.pid}`,</code> | 设置字段 `clientId`。 |
| 48 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 50 | <code>pg: {</code> | 设置字段 `pg`。 |
| 52 | <code>connectionString:</code> | 设置字段 `connectionString`。 |
| 53 | <code>process.env.DATABASE_URL ?? 'postgres://postgres:postgres123@localhost:5432/linetwin',</code> | 续写当前表达式、对象、类型或调用。 |
| 54 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 56 | <code>redis: {</code> | 设置字段 `redis`。 |
| 57 | <code>url: process.env.REDIS_URL ?? 'redis://localhost:6379',</code> | 设置字段 `url`。 |
| 58 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 60 | <code>http: {</code> | 设置字段 `http`。 |
| 62 | <code>port: Number(process.env.PORT ?? 3000),</code> | 设置字段 `port`。 |
| 64 | <code>corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',</code> | 设置字段 `corsOrigin`。 |
| 65 | <code>sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me',</code> | 设置字段 `sessionSecret`。 |
| 66 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 67 | <code>app: {</code> | 设置字段 `app`。 |
| 69 | <code>adminPassword:</code> | 设置字段 `adminPassword`。 |
| 70 | <code>process.env.ADMIN_PASSWORD === '' ? null : process.env.ADMIN_PASSWORD ?? 'admin123',</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 71 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 75 | <code>topicPrefix: process.env.TOPIC_PREFIX ?? 'tl/v1',</code> | 设置字段 `topicPrefix`。 |
| 80 | <code>machine: {</code> | 设置字段 `machine`。 |
| 81 | <code>commandToken: process.env.MACHINE_COMMAND_TOKEN ?? '',</code> | 设置字段 `commandToken`。 |
| 82 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 83 | <code>ai: {</code> | 设置字段 `ai`。 |
| 86 | <code>baseUrl: process.env.AI_BASE_URL ?? 'http://127.0.0.1:8642/v1',</code> | 设置字段 `baseUrl`。 |
| 88 | <code>apiKey: process.env.AI_API_KEY ?? '',</code> | 设置字段 `apiKey`。 |
| 89 | <code>model: process.env.AI_MODEL ?? 'hermes-agent',</code> | 设置字段 `model`。 |
| 90 | <code>timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 120000),</code> | 设置字段 `timeoutMs`。 |
| 92 | <code>sessionPrefix: process.env.AI_SESSION_PREFIX ?? 'lt',</code> | 设置字段 `sessionPrefix`。 |
| 93 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 94 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
