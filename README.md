# 产线数字孪生平台（line-twin）

监控一条 PLC 产线的状态、六轴机器人关节角和 6 路只读 IO；提供分级登录、人工控制、历史事件查询和 AI 助手。现场采集器已接入 S7-1200 的 Modbus TCP 点位。机械臂模型由 Three.js 程序生成，真实外观模型尚未接入。

## 数据怎么流动

```text
PLC ─Modbus TCP─> edge/plc_collector.py ─MQTT─> 本机 Broker
                                              │
                                              ▼
                                       NestJS server/
                                      ↙      ↓       ↘
                                Redis 快照  PostgreSQL  Socket.IO
                                      ↘      ↓       ↙
                           云端 Nginx ← SSH 反向隧道 ← 工控机
                                │
                                ▼
                        Vue 3 + Three.js web/
```

浏览器先读取 `GET /api/lines/:lineId/snapshot`，再订阅 Socket.IO 房间接收实时帧。控制命令经后端校验、审计和 MQTT 下发，采集器写 PLC 后发回 `cmd_ack`。网页控制需要登录且级别至少为 2；AI 网页通道提交待确认建议。机器令牌通道另有直接执行能力，详情见 `CLAUDE.md`。

## 仓库地图

| 路径 | 作用 |
|---|---|
| `docs/contract/` | MQTT 主题、报文和控制指令的数据契约；跨模块改动先核对这里。 |
| `edge/` | 真实 PLC 采集器、模拟采集器和寄存器点位表。 |
| `server/` | NestJS 后端、MCP 工具；处理 MQTT、Redis、PostgreSQL、Socket.IO、登录与控制。 |
| `web/` | Vue 3 页面、Three.js 六轴孪生、IO 面板和控制界面。 |
| `db/init/` | 数据库初始结构与增量迁移，含视觉域删除迁移。 |
| `deploy/nginx/cloud.conf` | 原生 Nginx 静态站点及 API/WebSocket 反向代理。 |
| `scripts/` | 工控机启动、SSH 隧道保活及全链路体检。 |
| `CLAUDE.md` | 现场点位、决策记录和待办。 |

## 本地运行

需要 Node.js 20+、Python 3.11+，以及运行在本机的 MQTT Broker `1883`、Redis 兼容服务 `6379`、PostgreSQL/TimescaleDB `5432`。先按文件名顺序执行 `db/init/` 中的 SQL，并设置 `server/.env`、`web/.env`；模板见各目录的 `.env.example`。

```powershell
cd server
npm.cmd ci
npm.cmd run build

cd ..\web
npm.cmd ci

cd ..\edge
py -3 -m pip install -r requirements.txt

cd ..
$env:COLLECTOR = 'mock'
.\scripts\start-local.bat
```

打开 `http://localhost:5173`。开发页面由 Vite 代理 `/api` 和 `/socket.io` 到本机后端 `3000`。现场运行 `edge/plc_collector.py`，并使用 `scripts/ipc-recover.ps1`；云服务器使用原生 Nginx。部署和验证步骤见 `deploy/README.md`、`scripts/README.md`。

## 当前边界

- PLC 已提供 17 个 word：六轴关节角、产线状态、4 个控制点和 6 路 IO。`goodCount`、`ngCount`、`beatMs`、`speedPct` 等契约字段目前由采集器填默认值，不能当作真实生产指标。
- 控制指令收到 `acked` 说明 PLC 写寄存器成功；物理动作是否符合预期仍需现场人工核验。
- 视觉检测域已移除；存量数据库执行 `db/init/006_drop_vision.sql`。
- 工控机保存全部历史数据；应配置定期数据库备份。上线前还需按 `CLAUDE.md` 的待办收紧机器直控、账号和 HTTPS 配置。
