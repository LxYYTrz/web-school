# 产线数字孪生监控平台（line-twin）

外部网站：机器人六轴实时孪生 · 多角色 RBAC（操作员 / 客户 / 数据分析员）。

> **本仓库每一个文件、每一段代码都写满了中文注释**（从宏观架构到每一行）。
> 注释的目的不是"解释语法"，而是回答：
> **这个文件在整体体系里起什么作用？数据从哪里来、到哪里去？前后端怎么打通？服务怎么部署？**

---

## 目录

1. [★ 一分钟看懂整个系统](#1-一分钟看懂整个系统)
2. [★ 数据流全景（这是最常被问的部分）](#2-数据流全景)
3. [代码导读地图（按这个顺序读）](#3-代码导读地图按这个顺序读)
4. [目录结构与每个文件夹的作用](#4-目录结构与每个文件夹的作用)
5. [部署形态](#5-部署形态)
6. [本地起步（开发机）](#6-本地起步开发机)
7. [开发路线（每步带验收标准）](#7-开发路线每步带验收标准)

---

## 1. 一分钟看懂整个系统

### 1.1 它是什么

一个**外部网站**，用来远程监控产线：看机器人六轴怎么动、看产线跑了多少良品、
看有没有报警，并（后续）远程下发启停指令。

### 1.2 三台机器、三种角色（部署定稿）

```
┌───────────────┐  局域网   ┌──────────────────────────────────────┐   SSH    ┌──────────────┐
│  机器人 / PLC │ ────────▶ │ 工控机（Windows, 高配）              │   隧道   │ 云服务器      │
│               │  Modbus   │                                      │ ────────▶ │ (Linux,低配) │
│  现场设备      │  OPC UA   │  ★ edge 采集器（Python）             │  Web 流量  │              │
│               │  S7       │  ★ EMQX Broker（本机 MQTT）          │           │ ★ Nginx      │
│               │           │  ★ NestJS 后端 :3000 ★全部数据处理   │           │   前端 dist  │
│               │           │  ★ Redis（本机快照缓存）              │           │              │
│               │           │  ★ PostgreSQL（历史数据,本机）        │           │              │
│               │           └──────────────────────────────────────┘           └──────────────┘
└───────────────┘                                                     ↑                    │
                                                                          浏览器只跟云服务器说话 ↓
```

| 机器 | 跑什么 | 特点 |
|---|---|---|
| **云服务器**（低配 Linux） | Nginx（静态前端 + 纯转发） | **零业务逻辑、不存数据**；只对公网开 80/443/22 |
| **工控机**（高配 Windows） | 采集器 + EMQX + NestJS 后端 + Redis + PostgreSQL | **所有数据处理和存储都在这里**；断外网时产线照常运行 |
| **开发机** | 构建前端、跑开发版 | 只负责 `npm run build` 出 `dist/` |

### 1.3 三条核心设计原则

1. **契约先行** —— `docs/contract/README.md` 是边缘、后端、前端之间**唯一的约定**。
   到现场只需用真实采集器替换 `edge/mock_collector.py`、按映射表填点位，**其余代码不动**。
2. **边缘闭环** —— 数据处理跟着产线走。云端只负责展示和存储。
3. **单向出站** —— 工控机只主动向外连（SSH 隧道），工厂防火墙零配置，无需开入站端口。

---

## 2. 数据流全景

> **这是理解本系统最关键的一节。** 所有细节都能在代码注释里找到对应位置。

### 2.1 上行：设备 → 浏览器

```
①  PLC / 机器人
        │  Modbus TCP / OPC UA / S7（现场协议，由采集器适配）
        ▼
②  edge/mock_collector.py（工控机，Python）
        │  组装成契约 JSON
        ▼
③  MQTT publish（TCP：1883 明文 / 8883 TLS）
        │  主题 tl/v1/{lineId}/...
        ▼
④  EMQX Broker（工控机本机）
        │
        ▼
⑤  server/src/ingest/mqtt-ingest.service.ts  ← ★ 数据流总入口
        │  dispatch(topic, payload)：拆主题 → 解析 JSON → 按类型分发
        │
        ├──────────────▶ ⑥a  server/src/state/line-state.service.ts
        │                      Redis 覆盖写（TTL 60s）—— "最新一帧"
        │
        ├──────────────▶ ⑥b  server/src/history/history-writer.service.ts
        │                      1 秒批量 INSERT → TimescaleDB（历史）
        │
        └──────────────▶ ⑥c  server/src/realtime/telemetry.gateway.ts
                               socket.io 广播到房间 line:{lineId}
                                  │
                                  ▼
                             浏览器（web/）
```

### 2.2 首屏 / 断线重连：REST 快照

```
浏览器 ──GET /api/lines/line-01/snapshot──▶ SnapshotController
                                              │
                                              ▼
                                     LineStateService.getLineSnapshot()
                                              │  Redis MGET rt:line-01:*
                                              ▼
                                          JSON → 浏览器
```
> 为什么要这条通道？WebSocket 建连 + 等下一帧要几百毫秒，产线停机时更是永远等不到。
> 有了快照接口，页面**立刻**就有画面。

### 2.3 下行：浏览器 → PLC（控制指令）

```
①  浏览器 POST /api/lines/line-01/commands
      Body: { deviceId, type, params, operator }
        │  （经 云 Nginx → SSH 隧道 → 工控机后端）
        ▼
②  CommandController → CommandService
      ├─ 校验 type ∈ 白名单 {start, stop, reset, changeover}
      ├─ 校验 lineId / deviceId 存在（CatalogService）
      ├─ INSERT control_commands (status='sent') → 生成 cmdId(UUID)  ← 审计
      └─ publish → tl/v1/{lineId}/cmd/{deviceId}
        ▼
③  EMQX → 采集器（订阅了 tl/v1/{lineId}/cmd/+）
      └─ 写 PLC（★ PLC 自身的联锁逻辑有最终否决权）
        ▼
④  采集器 publish cmd_ack { cmdId, status }
        ▼
⑤  回到 ingest.dispatch（kind === 'cmd_ack'）
      └─ HistoryWriterService.ackCommand()
           UPDATE control_commands SET status='acked' WHERE idempotency_key=cmdId
```

> **急停不在本系统范围内**：急停必须是硬件回路，网页永远不做急停。

### 2.4 MQTT 协议在代码里是怎么落地的

| 机制 | 代码位置 | 作用 |
|---|---|---|
| CONNECT / keepalive=30 | `mqtt-ingest.service.ts` | 30 秒无流量自动发 PINGREQ |
| reconnectPeriod=2000 | 同上 | 断线每 2 秒自动重连 |
| SUBSCRIBE（5 类主题） | 同上 | 上行数据入口 |
| QoS 1 | 订阅 + 发布 | "至少送达一次" → **下游必须幂等**（UPSERT + cmdId 状态机） |
| retain | 采集器 publish | 后端晚启动也能立刻拿到状态 |
| LWT（遗嘱） | 采集器 `will_set` | 采集器崩溃 → Broker 自动发 offline → 产线离线状态自动产生 |

### 2.5 前后端是怎么"打通"的（三个关键点）

1. **开发期**：Vite 代理 —— `vite.config.ts` 把 `/api` 与 `/socket.io` 转发到 `localhost:3000`，
   浏览器只跟 5173 说话 → 天然同源，无跨域。
2. **生产期**：Nginx 同源反代 —— `deploy/nginx/cloud.conf` 把 `/api/`、`/socket.io/`
   转发到 SSH 隧道入口 `172.18.0.1:3300` → 浏览器只跟云服务器说话 → 依然同源。
3. **消息名对齐**（前后端必须一致）：

| 服务端 emit | 前端监听 | 频率 |
|---|---|---|
| `robot_state` | `robot_state` | 10Hz |
| `line_status` | `line_status` | 1Hz |
| `event` | `event` | 事件触发 |
| `edge_status` | `edge_status` | 极低频 |

---

## 3. 代码导读地图（按这个顺序读）

> 建议按序号读，每一步都建立在上一步之上。括号里是"这个文件里最该看的部分"。

### 第 1 步：看契约（不懂契约，看代码就是天书）

| 顺序 | 文件 | 看什么 |
|---|---|---|
| 1.1 | `docs/contract/README.md` | ★ 主题总览表、报文定义、枚举值 |
| 1.2 | `docs/contract/register-mapping.template.csv` | 现场点表模板（信号→寄存器地址） |

### 第 2 步：看数据起点

| 顺序 | 文件 | 看什么 |
|---|---|---|
| 2.1 | `edge/mock_collector.py` | 主题常量、报文结构、LWT/retain 的用法、下行回执（**开发版，看逻辑最清楚**） |
| 2.2 | `edge/plc_collector.py` | ★★ **现场版**：点位表驱动、Modbus TCP 读寄存器、字节序、工程量换算 |
| 2.3 | `edge/register-mapping.README.md` | 现场怎么把点位表填对（给电气工程师看的） |
| 2.4 | `edge/README.md` | 两个采集器怎么切换、现场注意事项 |

### 第 3 步：看数据终点（后端主干）

| 顺序 | 文件 | 看什么 |
|---|---|---|
| 3.1 | `server/src/main.ts` | 进程怎么起来、HTTP/WS 共用端口 |
| 3.2 | `server/src/app.module.ts` | 六个模块的关系 |
| 3.3 | **`server/src/ingest/mqtt-ingest.service.ts`** | ★★★ **全系统最重要**：订阅哪些主题、怎么解析、怎么三路分发 |
| 3.4 | `server/src/state/line-state.service.ts` | Redis key 设计、TTL 的妙用 |
| 3.5 | `server/src/history/history-writer.service.ts` | 为什么要缓冲批量写、多行 INSERT 怎么拼 |
| 3.6 | `server/src/realtime/telemetry.gateway.ts` | socket.io 房间机制、WebSocket 握手过程 |
| 3.7 | `server/src/realtime/snapshot.controller.ts` | 首屏快照接口 |
| 3.8 | `server/src/infra/catalog.service.ts` | code → id 的翻译 |
| 3.9 | `server/src/command/command.service.ts` | 下行链路、白名单、审计 |

### 第 4 步：看数据库

| 顺序 | 文件 | 看什么 |
|---|---|---|
| 4.1 | `db/init/001_init.sql` | 12 张表、权限矩阵、种子数据、code↔id 的锚点 |
| 4.2 | `db/README.md` | 表结构总览与生产注意事项 |

### 第 5 步：看前端

| 顺序 | 文件 | 看什么 |
|---|---|---|
| 5.1 | `web/src/main.ts` | 应用怎么挂载 |
| 5.2 | `web/src/services/socket.ts` | ★ 两条通信通道、开发/生产的 BASE 逻辑 |
| 5.3 | `web/src/composables/useLineData.ts` | ★★ 前端数据层：单例、预载、订阅、派生状态 |
| 5.4 | `web/src/App.vue` | 外壳与全局状态灯 |
| 5.5 | `web/src/views/TwinView.vue` | 数据 → 3D 画面的驱动路径 |
| 5.6 | `web/src/three/RobotArm.ts` | ★★ 关节父子层级（3D 机器人动画原理） |
| 5.7 | `web/src/three/SceneManager.ts` | 渲染主循环、资源释放 |
| 5.8 | `web/src/views/StatusView.vue` | 事件流、报警蜂鸣 |

### 第 6 步：看部署

| 顺序 | 文件 | 看什么 |
|---|---|---|
| 6.1 | `docs/deployment.md` | ★ 拓扑、隧道命令、端口清单、取舍记录 |
| 6.2 | `docs/deploy-guide.md` | 照做即可的部署手册 |
| 6.3 | `deploy/docker-compose.ipc.yml` | 工控机跑什么 |
| 6.4 | `deploy/docker-compose.cloud.yml` | 云端跑什么 |
| 6.5 | `deploy/nginx/cloud.conf` | ★ 浏览器是怎么访问到工控机后端的 |
| 6.6 | `scripts/start-local.bat` / `start-ipc.bat` | 一键启动 |

---

## 4. 目录结构与每个文件夹的作用

| 目录 | 说明 | 主要文件 |
|---|---|---|
| `edge/` | **边缘采集层**：数据起点。把现场协议翻译成契约 JSON | `plc_collector.py`（★现场版，读 Modbus）、`mock_collector.py`（开发版）、`register-mapping.csv`（点位表）、`requirements.txt`、`wheels/`（离线安装包） |
| `server/` | **后端**：数据处理中枢。MQTT ↔ Redis/PG/WebSocket | `src/ingest/`（入口）、`src/state/`（快照）、`src/history/`（落库）、`src/realtime/`（推送）、`src/command/`（控制）、`src/infra/`（连接池/映射）、`src/config/`（配置） |
| `web/` | **前端**：Vue3 + TS + Three.js | `src/composables/`（数据层）、`src/services/`（通信）、`src/three/`（3D）、`src/views/`（页面） |
| `db/` | **数据库结构** | `init/001_init.sql`（DDL+种子）、`init/006_drop_vision.sql`（迁移） |
| `deploy/` | **部署编排** | 三个 `docker-compose*.yml`（开发/工控机/云端）、`nginx/cloud.conf`（转发配置） |
| `scripts/` | **一键启动** | `start-local.bat`（本地闭环）、`start-ipc.bat`（工控机+云端） |
| `docs/` | **文档** | `contract/`（★数据契约）、`deployment.md`（部署方案）、`deploy-guide.md`（部署手册）、`产线数字孪生平台-技术设计文档.md`（设计文档）、`工控机部署手册-U盘版.md`（U 盘人工版） |

每个子目录都有**自己的 README.md**，逐个文件说明作用。

---

## 5. 部署形态

### 5.1 生产（云端 + 工控机）

```bash
# 云服务器
docker compose -f deploy/docker-compose.cloud.yml up -d
#   前端：把 web/dist/ 拷到 deploy/dist/
# 工控机
docker compose -f deploy/docker-compose.ipc.yml up -d
cd server && node dist\main.js
cd edge && python mock_collector.py
# 隧道（★ 做成开机自启服务，断了网站就不可访问）
ssh -N -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
    -R 172.18.0.1:3300:127.0.0.1:3000 linetwin@云服务器IP
```

### 5.2 本地闭环（工控机 U 盘部署包）

```bat
scripts\start-local.bat
```
→ 后端 3000 + 采集器 + 前端 5173，**不需要 Docker / 云服务器 / 隧道 / 联网**。

### 5.3 开发机

```bash
docker compose -f deploy/docker-compose.yml up -d   # 三合一中间件
cd server && npm run start:dev
cd edge && python mock_collector.py
cd web && npm run dev
```

详见 `docs/deploy-guide.md`（照做即可）与 `docs/工控机部署手册-U盘版.md`（人工版）。

---

## 6. 本地起步（开发机）

前置：Docker Desktop · Node.js 20+ · Python 3.11+ · git

```bash
# 1. 起基础设施
docker compose -f deploy/docker-compose.yml up -d

# 2. 验证
#    EMQX Dashboard  http://localhost:18083  (admin / admin123,仅开发默认值)

# 3. 跑 mock 采集器
cd edge
pip install -r requirements.txt
python mock_collector.py

# 4. 用 MQTTX(或 EMQX Dashboard 自带客户端)订阅 tl/v1/# 观察数据流
```

---

## 7. 开发路线(每步带验收标准)

1. [x] 数据契约 v1 + DDL + 基础设施 + mock 采集器(本仓库)
2. [x] 后端最小链路骨架(server/):订阅 MQTT → 写 TimescaleDB → WebSocket 推送 → Redis 快照
       验收:`curl localhost:3000/api/lines/line-01/snapshot` 有数据;server/tools/ws-test.html 看到实时帧滚动
3. [x] 前端孪生:Three.js 程序化 6 轴机械臂(占位模型,URDF 到手即换),关节随 mock 数据 10Hz 驱动
       验收:vue-tsc 类型检查 + vite build 通过;浏览器实时画面在本地三件套起齐后目检
4. [x] 登录 + RBAC 三角色(菜单 / 接口 / 字段三级控制)—— `server/src/auth/` + `web/src/views/LoginView.vue`
       验收:三个角色登录看到不同界面,客户调控制接口被拒
5. [x] 产线 IO 只读信号(契约 v1.3 §3.8,DB3 word 11~16)—— `web/src/views/IoView.vue` + `IoPanel.vue`
6. [x] 控制链路:指令白名单 + 审计 + MQTT 下行 + ack 回执 —— `server/src/command/`
7. [x] AI 产线助手(hermes agent)—— `server/src/ai/` + `web/src/components/AiDrawer.vue`
8. [x] 上云:云服务器跑 docker-compose.cloud.yml(只有 Nginx),工控机跑 docker-compose.ipc.yml + 后端 + 采集器
       + 本机 PostgreSQL,建 SSH 隧道(见 docs/deployment.md);隧道/后端/采集器均已挂开机自启与 5 分钟自愈巡检
       2026-10-23 收敛:云端数据库已删除,数据库只走工控机本地
9. [x] 到现场:真实 PLC 采集器 `edge/plc_collector.py`(Modbus TCP,11 word 点位表)+ 现场工具脚本
10. [x] 视觉检测域整体移除(2026-10-22):图片上传链路、视觉页、相机设备、`vision_images` 表
       与相关权限全部删除;存量库执行 `db/init/006_drop_vision.sql` 即可对齐

> **说明**:第 4~9 项是本仓库在起步包之后陆续补齐的,本节与 `server/src/`、`web/src/` 的实际目录一一对应。

---

## 8. 生产环境专有功能(相对起步包的增量)

起步包只有「孪生 + 状态」两页;生产环境在此之上还有:

| 能力 | 位置 | 说明 |
|---|---|---|
| **登录 + 三角色 RBAC** | `server/src/auth/`、`server/src/users/` | cookie-session 登录态;level 1 普通 / 2 操作员 / 3 管理员;菜单、接口、字段三级控制 |
| **产线 IO 只读信号** | `web/src/views/IoView.vue`、`web/src/components/IoPanel.vue` | DB3 MB_SERVER HOLD 区 word 11~16,只读不下发 |
| **控制指令闭环** | `server/src/command/` | 白名单(start/stop/mode_set/conveyor)、审计落库、MQTT 下行 + ack 回执 |
| **AI 产线助手** | `server/src/ai/`、`server/mcp/line-twin-mcp.js` | hermes agent 只读工具集;建议卡片需按角色二次确认 |
| **真 PLC 采集器** | `edge/plc_collector.py` | Modbus TCP / S7-1200,11 word 点位表,只读轮询 + 指令应答 |
| **开机自愈** | `deploy_work/ensure_*.ps1` + 计划任务 | 隧道 / 后端 / 采集器:开机 + 登录 + 每 5 分钟巡检,坏了自己拉起来 |

**已移除**:机器视觉(图片上传链路)——`vision/` 后端模块、视觉检测页、相机设备、
`vision_images` 表与相关权限均已删除,见 `db/init/006_drop_vision.sql`。
