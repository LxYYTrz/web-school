# 部署方案(定稿)

> 决策(2026-10-08 与用户确认):**云服务器 = 展示 + 数据库 + 纯转发,工控机 = 全部数据处理。**

## 1. 最终拓扑

```
                        公网
                          │
                ┌─────────┴──────────┐
                │   云服务器(低配 Linux) │
                │                     │
                │  Nginx:静态前端 dist │  ← 浏览器只跟云服务器说话
                │   + 纯转发 /api、     │
                │     /socket.io      │
                │  PostgreSQL         │  ← 只听 127.0.0.1
                │  (TimescaleDB)      │
                └─────────┬──────────┘
                          │  SSH 双隧道(工控机主动外连,工厂防火墙零配置)
                          │  -R 3300:127.0.0.1:3000   云端→工控机(Web 流量)
                          │  -L 5432:127.0.0.1:5432   工控机→云端(数据库)
                ┌─────────┴──────────┐
                │  工控机(高配 Windows) │
                │                     │
                │  NestJS 后端:3000    │  ← 所有数据处理/转发/审计
                │  EMQX(本机 MQTT)    │
                │  Redis(快照缓存)    │
                │  MinIO(视觉图片)    │
                │  edge 采集器         │
                └─────────┬──────────┘
                          │  产线局域网
              ┌───────────┼───────────┐
           机器人        视觉         PLC
         (六轴数据)   (拍照/结果)  (传送带/状态)
```

## 2. 各机器部署清单

| 机器 | 跑什么 | 怎么跑 |
|---|---|---|
| 云服务器 | Nginx + TimescaleDB | `docker compose -f deploy/docker-compose.cloud.yml up -d`,前端 `web/` 构建后把 `dist/` 放到 `deploy/dist/` |
| 工控机 | EMQX + Redis + MinIO | 有 Docker:`docker compose -f deploy/docker-compose.ipc.yml up -d`;无 Docker:装原生 EMQX/Redis(Memurai)/MinIO,端口一致即可 |
| 工控机 | NestJS 后端 | 原生运行:`cd server && npm install && npm run build && node dist/main.js`(用 NSSM 或任务计划注册成开机自启服务) |
| 工控机 | 采集器 | `python edge/mock_collector.py`(现场换成 plc_collector.py) |
| 开发机 | 完整一套(开发用) | `deploy/docker-compose.yml`(三合一开发版)+ server + web dev |

## 3. 隧道(整个系统的命脉)

工控机上一条 SSH 命令建立双向通道(Windows 10+ 自带 ssh):

```bash
ssh -N -R 3300:127.0.0.1:3000 -L 5432:127.0.0.1:5432 linetwin@云服务器IP
```

- `-R 3300:127.0.0.1:3000`:云服务器的 3300 端口 → 工控机后端 3000(Nginx 转发的入口)
- `-L 5432:127.0.0.1:5432`:工控机访问本地 5432 → 云服务器数据库(工控机后端 `DATABASE_URL=postgres://...@localhost:5432/linetwin`)
- 云服务器 sshd 需要 `GatewayPorts no`(默认即可,3300 只绑回环)

**必须做两件事**:① 用密钥登录(免密,别用密码交互);② 加保活自动重连——命令加
`-o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes`,
再用 NSSM / 任务计划把它做成断线自动拉起的服务。**隧道断 = 网站不可访问**,这是本架构唯一的单点,
要监控它(后端暴露 `/api/health`,云端定时探测)。

如果以后觉得 SSH 隧道不稳,可平替为 frp(云跑 frps、工控机跑 frpc),转发语义相同,代码零改动。

## 4. 数据流(对应新拓扑)

- **上行**:设备 → 采集器 → 工控机 EMQX → 工控机后端 →(历史数据经隧道写入云数据库 / Redis 快照在工控机本地 / WebSocket 经隧道推给浏览器)
- **图片**:相机 → 视觉程序 → 采集器上传 → 工控机 MinIO;浏览器里的 `<img>` URL 指向 `/api/vision/images/...`,经隧道由工控机后端从 MinIO 读流返回(所以 nginx 不需要单独代理 MinIO)
- **下行控制**:浏览器 → 云 Nginx → 隧道 → 工控机后端(鉴权+审计)→ 工控机 EMQX → 采集器 → PLC(联锁否决权在 PLC)

注意:后端生成图片 URL 时用**相对路径**(`/api/vision/images/xx`),不要写死工控机 IP,否则外部浏览器打不开。

## 5. 端口与防火墙

| 机器 | 对外 | 仅本机 |
|---|---|---|
| 云服务器 | 80/443(Nginx)、22(SSH) | 5432(PG)、3300(隧道入口) |
| 工控机 | 无(全部回环) | 1883/18083(EMQX)、6379(Redis)、9000/9001(MinIO)、3000(后端) |

工控机不需要任何入站开放;云服务器安全组只开 22/80/443。

## 6. 已知取舍(记录在案)

- 历史数据在云端、计算在工控机:分析员查历史曲线时,查询经隧道到工控机后端、后端再经隧道查云数据库——绕一圈但逻辑简单;量大后可在工控机加本地缓存/降采样。
- 工厂断外网时:产线照常运行(采集/控制都在工控机本地闭环),网站不可访问;Redis 快照在工控机本地,恢复后自动续上。机器人帧历史在断网期间会丢(写入云库失败);后续如需保全,在工控机后端加本地落盘缓冲再补传(HistoryWriter 已留批量缓冲结构)。
