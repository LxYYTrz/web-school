# server/ — 后端（NestJS）

> **一句话定位**：整个系统的"数据处理中枢"。它订阅 MQTT、把数据分发到
> 缓存 / 数据库 / 浏览器；也接收浏览器的控制指令、落审计、再下发回 MQTT。

---

## 1. 它在整体架构中的位置

```
        产线局域网                工控机（高配 Windows）              云服务器
   ┌────────────────┐   MQTT   ┌─────────────────────────┐  隧道  ┌──────────┐
   │ PLC / 机器人    │ ───────▶ │ edge/ 采集器（Python）   │        │ Nginx    │
   └────────────────┘          │        ↓                │        │ + 前端   │
                               │ EMQX Broker（本机）      │        └──────────┘
                               │        ↓ subscribe      │
                               │ ★ server/ 本目录 ★      │
                               │   → Redis（快照）        │
                               │   → TimescaleDB（历史）   │
                               │   → WebSocket（推送）     │
                               └─────────────────────────┘
                                        │ SSH 隧道
                                        ▼
                                     浏览器（web/）
```

---

## 2. 最小链路

MQTT 订阅 → 解析数据契约报文 → 三路分发
（**Redis 实时快照** / **TimescaleDB 历史** / **socket.io 推送**），
外加联调用的指令下发接口（白名单 + 审计落库）。

---

## 3. 目录结构（★ 每个文件夹/文件的作用）

| 文件 | 职责 |
|---|---|
| `src/main.ts` | **进程入口**：创建 Nest 应用、开启 CORS 与优雅关闭、监听 3000 端口（HTTP 与 WebSocket 共用） |
| `src/app.module.ts` | **根模块**：声明系统由哪六个模块组成 |
| `src/config/configuration.ts` | **配置唯一入口**：所有环境变量在这里读取并转成 `config` 对象 |
| `src/infra/` | **基础设施（全局）**：PG 连接池、Redis 客户端、编码映射缓存 |
| `src/infra/infra.module.ts` | 提供并全局导出 `PG_POOL` / `REDIS` / `CatalogService` |
| `src/infra/tokens.ts` | 注入令牌常量（单独成文件以切断循环依赖） |
| `src/infra/catalog.service.ts` | **code → id 映射**：把 MQTT 里的 `'line-01'` 翻译成数据库主键 `1` |
| `src/state/` | **实时快照**：Redis 存"最新一帧"，供前端首屏 / 断线重连 |
| `src/state/line-state.service.ts` | 写快照（覆盖写 + TTL）、读快照（组装整条产线） |
| `src/history/` | **历史落库**：机器人帧 1 秒批量写；状态 / 事件即时写 |
| `src/history/history-writer.service.ts` | TimescaleDB 写入 + 指令回执状态更新 |
| `src/ingest/` | **上行入口**：订阅 MQTT → 解析 → 三路分发（本系统的数据流中心） |
| `src/ingest/mqtt-ingest.service.ts` | ★ 最重要的文件：MQTT 连接、主题订阅、报文分发、指令 publish |
| `src/realtime/` | **实时出口**：WebSocket 广播 + REST 快照查询 |
| `src/realtime/telemetry.gateway.ts` | socket.io 网关：按产线分房间（room）广播 |
| `src/realtime/snapshot.controller.ts` | `GET /api/lines/:lineId/snapshot` |
| `src/command/` | **下行控制**：白名单校验 → 落审计 → MQTT 下发 |
| `src/command/command.service.ts` | 指令业务逻辑 |
| `src/command/command.controller.ts` | `POST /api/lines/:lineId/commands` |
| `tools/ws-test.html` | **联调工具**：不启动前端也能验证 WebSocket 链路 |
| `.env` / `.env.example` | 运行时配置（`.env` 含密码，已 gitignore） |

---

## 4. 依赖说明（package.json）

> JSON 文件不支持注释，所以在这里逐条解释每个依赖的用途。

| 依赖 | 用途 |
|---|---|
| `@nestjs/common` | NestJS 核心：装饰器（`@Module`/`@Injectable`/`@Controller`）、模块系统、生命周期钩子 |
| `@nestjs/core` | NestJS 内核：依赖注入容器、模块解析、`NestFactory` |
| `@nestjs/platform-express` | Express 适配器：提供 HTTP 服务器（承载 REST 与 WebSocket） |
| `@nestjs/platform-socket.io` | socket.io 适配器：把 NestJS 的 WebSocket 网关接到 socket.io 上 |
| `@nestjs/websockets` | WebSocket 装饰器：`@WebSocketGateway`、`@SubscribeMessage` 等 |
| `dotenv` | 启动时把 `.env` 载入 `process.env` |
| `ioredis` | Redis 客户端（自动重连、Pipeline 支持好） |
| `mqtt` | MQTT 客户端（mqtt.js）：连接 EMQX/Mosquitto、订阅、发布 |
| `pg` | PostgreSQL 客户端 + 连接池 |
| `reflect-metadata` | 装饰器元数据 polyfill（**必须第一个 import**） |
| `rxjs` | 响应式流库（NestJS 内部依赖，WebSocket/事件用得上） |

开发依赖：`typescript`（编译器）、`tsx`（开发时直接跑 TS，免编译）、`@types/*`（类型声明）。

---

## 5. 启动

```bash
cp .env.example .env        # 按需修改(默认值对应 deploy/ 的开发环境)
npm install
npm run start:dev           # tsx watch;如遇问题改用 npm run build && npm start
```

前置条件：`deploy/` 的基础设施已启动，`edge/` 的 `mock_collector.py` 正在运行。

生产运行：`npm run build && node dist/main.js`（现场用的是这一条）。

---

## 6. 验证（全部基于 mock 数据）

1. **快照接口**
   ```bash
   curl http://localhost:3000/api/lines/line-01/snapshot
   ```
   → 返回产线状态 + 边缘在线状态 + 机器人最新一帧(来自 Redis)

2. **WebSocket**:浏览器打开 `tools/ws-test.html`(需联网加载 socket.io-client CDN)
   → 应滚动看到 `robot_state`(10Hz)、`line_status`(1Hz)、每 8.5s 一条 `event`

3. **指令闭环**(mock 采集器会自动回 ack):
   ```bash
   curl -X POST http://localhost:3000/api/lines/line-01/commands \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"plc-01","type":"reset","operator":"admin"}'
   ```
   → 返回 `{"ok":true,"cmdId":"..."}`;再查库:
   ```sql
   SELECT type, status, acked_at FROM control_commands ORDER BY id DESC LIMIT 1;
   ```
   status 应为 `acked`

4. **历史入库**:
   ```sql
   SELECT count(*) FROM robot_joint_states;   -- 持续增长(10Hz,每秒批量写)
   SELECT * FROM production_events ORDER BY "time" DESC LIMIT 5;
   ```

---

## 7. 数据流速查（★ 面试/汇报可直接用）

**上行（设备 → 浏览器）**
```
PLC/机器人 → edge 采集器 →(MQTT publish, TCP 1883/8883)→ EMQX
  →(subscribe)→ MqttIngestService.dispatch()
    ├→ LineStateService.setRobotFrame()   → Redis（覆盖写,TTL 60s）
    ├→ HistoryWriterService.bufferRobotFrame() → 1s 批量 INSERT → TimescaleDB
    └→ TelemetryGateway.broadcastRobot()   →(socket.io)→ 浏览器
```

**首屏/重连**
```
浏览器 → GET /api/lines/line-01/snapshot → SnapshotController
  → LineStateService.getLineSnapshot() → Redis MGET → JSON → 浏览器
```

**下行（浏览器 → PLC）**
```
浏览器 POST /api/lines/line-01/commands → CommandController
  → CommandService（白名单校验 → INSERT control_commands → publish MQTT）
  → EMQX → edge 采集器 → 写 PLC → publish cmd_ack
  → MqttIngestService.dispatch('cmd_ack') → HistoryWriterService.ackCommand()
  → control_commands.status 更新为 acked/rejected/failed
```

---

## 8. 已知 TODO(按路线图接入)

- 第 4 步:登录 + JWT;WS 订阅与指令接口的 RBAC / `user_line_scope` 校验(当前均无鉴权,仅联调!)
- 第 6 步:指令超时器(15s 无 ack → status=timeout)
- 生产部署:MQTT 走 8883/TLS;CORS 收敛;EMQX 关闭匿名登录
- `/api/health` 健康检查接口(CLAUDE.md §4.5 提到云端定时探测隧道状态,尚未实现)
