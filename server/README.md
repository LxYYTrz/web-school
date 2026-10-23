# 后端

NestJS 后端运行在工控机，监听 `3000`，同时提供 REST 与 Socket.IO。主要模块：

| 目录 | 职责 |
|---|---|
| `src/ingest/` | 订阅 MQTT 契约主题并分发报文。 |
| `src/state/` | Redis 最新快照，供首屏和重连读取。 |
| `src/history/` | PostgreSQL/TimescaleDB 历史数据与指令回执。 |
| `src/realtime/` | Socket.IO 实时推送与快照接口。 |
| `src/command/` | 控制白名单、权限、审计和 MQTT 下发。 |
| `src/auth/`、`src/users/` | Cookie 会话登录、三级用户管理。 |
| `src/ai/`、`mcp/line-twin-mcp.js` | 网页 AI 建议与 MCP 查询/机器通道。 |

基础服务为本机 MQTT Broker `1883`、Redis 兼容服务 `6379`、PostgreSQL/TimescaleDB `5432`。先执行 `db/init/` 的 SQL，再按 `.env.example` 配置 `server/.env`：

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

开发时可用 `npm.cmd run start:dev`。`GET /api/lines/line-01/snapshot` 返回 Redis 快照；`GET /api/auth/me` 在未登录时返回 `401`。控制接口要求 Cookie 会话且 `level >= 2`，操作人由会话确定。机器通道使用独立令牌，投产前按 `CLAUDE.md` 的待办收紧。MCP 查询工具不包含已移除的视觉统计。
