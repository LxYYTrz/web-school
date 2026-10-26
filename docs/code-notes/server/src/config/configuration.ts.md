# server/src/config/configuration.ts 逐行注释

[打开源码](../../../../../server/src/config/configuration.ts) · 94 行 · 36 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 34 行**

```text
import 'dotenv/config';
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 38 行**

```text
export const config = {
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。
```

**源码第 40 行**

```text
  mqtt: {
// 注释：设置字段 `mqtt`。
```

**源码第 42 行**

```text
    url: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
// 注释：设置字段 `url`。
```

**源码第 44 行**

```text
    username: process.env.MQTT_USERNAME || undefined,
// 注释：设置字段 `username`。 关键字：`undefined`＝未定义值。
```

**源码第 45 行**

```text
    password: process.env.MQTT_PASSWORD || undefined,
// 注释：设置字段 `password`。 关键字：`undefined`＝未定义值。
```

**源码第 47 行**

```text
    clientId: `line-twin-server-${process.pid}`,
// 注释：设置字段 `clientId`。
```

**源码第 48 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 50 行**

```text
  pg: {
// 注释：设置字段 `pg`。
```

**源码第 52 行**

```text
    connectionString:
// 注释：设置字段 `connectionString`。
```

**源码第 53 行**

```text
      process.env.DATABASE_URL ?? 'postgres://postgres:postgres123@localhost:5432/linetwin',
// 注释：读取进程环境变量中的配置值。
```

**源码第 54 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 56 行**

```text
  redis: {
// 注释：设置字段 `redis`。
```

**源码第 57 行**

```text
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
// 注释：设置字段 `url`。
```

**源码第 58 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 60 行**

```text
  http: {
// 注释：设置字段 `http`。
```

**源码第 62 行**

```text
    port: Number(process.env.PORT ?? 3000),
// 注释：设置字段 `port`。
```

**源码第 64 行**

```text
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
// 注释：设置字段 `corsOrigin`。
```

**源码第 65 行**

```text
    sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me',
// 注释：设置字段 `sessionSecret`。
```

**源码第 66 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 67 行**

```text
  app: {
// 注释：设置字段 `app`。
```

**源码第 69 行**

```text
    adminPassword:
// 注释：设置字段 `adminPassword`。
```

**源码第 70 行**

```text
      process.env.ADMIN_PASSWORD === '' ? null : process.env.ADMIN_PASSWORD ?? 'admin123',
// 注释：把右侧表达式的结果写入 process.env.ADMIN_PASSWORD。 关键字：`null`＝空值。
```

**源码第 71 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 75 行**

```text
  topicPrefix: process.env.TOPIC_PREFIX ?? 'tl/v1',
// 注释：设置字段 `topicPrefix`。
```

**源码第 80 行**

```text
  machine: {
// 注释：设置字段 `machine`。
```

**源码第 81 行**

```text
    commandToken: process.env.MACHINE_COMMAND_TOKEN ?? '',
// 注释：设置字段 `commandToken`。
```

**源码第 82 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 83 行**

```text
  ai: {
// 注释：设置字段 `ai`。
```

**源码第 86 行**

```text
    baseUrl: process.env.AI_BASE_URL ?? 'http://127.0.0.1:8642/v1',
// 注释：设置字段 `baseUrl`。
```

**源码第 88 行**

```text
    apiKey: process.env.AI_API_KEY ?? '',
// 注释：设置字段 `apiKey`。
```

**源码第 89 行**

```text
    model: process.env.AI_MODEL ?? 'hermes-agent',
// 注释：设置字段 `model`。
```

**源码第 90 行**

```text
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 120000),
// 注释：设置字段 `timeoutMs`。
```

**源码第 92 行**

```text
    sessionPrefix: process.env.AI_SESSION_PREFIX ?? 'lt',
// 注释：设置字段 `sessionPrefix`。
```

**源码第 93 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 94 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```
