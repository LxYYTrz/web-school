# 部署方案(定稿)

> 决策(2026-08 确认、**2026-10-23 收敛**):**云服务器 = 展示 + 纯转发;工控机 = 全部数据处理 + 数据库。**
>
> 数据库原本放在云端(容器 lt-cloud-db),2026-10-23 决定**只走本地**:
> 历史数据跟产线走,断外网也照常落库,云端连数据库隧道都不再挂。

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
                └─────────┬──────────┘
                          │  SSH 反向隧道(工控机主动外连,工厂防火墙零配置)
                          │  -R 172.18.0.1:3300:127.0.0.1:3000  云端→工控机(Web 流量)
                ┌─────────┴──────────┐
                │  工控机(高配 Windows) │
                │                     │
                │  NestJS 后端:3000    │  ← 所有数据处理/转发/审计
                │  PostgreSQL          │  ← 历史数据 + 业务表(只听 127.0.0.1)
                │  (TimescaleDB)      │
                │  EMQX(本机 MQTT)    │
                │  Redis(快照缓存)    │
                │  edge 采集器         │
                └─────────┬──────────┘
                          │  产线局域网
              ┌───────────┼───────────┐
           机器人             PLC
         (六轴数据)          (传送带/状态)
```

## 2. 各机器部署清单

| 机器 | 跑什么 | 怎么跑 |
|---|---|---|
| 云服务器 | 只有 Nginx | `docker compose -f deploy/docker-compose.cloud.yml up -d`,前端 `web/` 构建后把 `dist/` 放到 `deploy/dist/` |
| 工控机 | PostgreSQL + TimescaleDB | Windows 原生安装(见 `docs/工控机部署手册-U盘版.md` §2.6),端口 5432,执行 `db/init/*.sql` 建表 |
| 工控机 | EMQX + Redis | 有 Docker:`docker compose -f deploy/docker-compose.ipc.yml up -d`;无 Docker:装原生 EMQX/Redis(Memurai),端口一致即可 |
| 工控机 | NestJS 后端 | 原生运行:`cd server && npm install && npm run build && node dist/main.js`(用 NSSM 或任务计划注册成开机自启服务) |
| 工控机 | 采集器 | `python edge/mock_collector.py`(现场换成 plc_collector.py) |
| 开发机 | 完整一套(开发用) | `deploy/docker-compose.yml`(三合一开发版)+ server + web dev |

## 3. 隧道(整个系统的命脉)

工控机上一条 SSH 命令建立通道(Windows 10+ 自带 ssh):

```bash
ssh -N -R 172.18.0.1:3300:127.0.0.1:3000 linetwin@云服务器IP
```

- `-R 172.18.0.1:3300:127.0.0.1:3000`:云服务器的 3300 端口 → 工控机后端 3000(Nginx 转发的入口)
- ★ **远程端口要绑 `172.18.0.1`(云端宿主机的 docker 网桥),不能绑 `127.0.0.1`**:
  Nginx 跑在容器 `lt-cloud-nginx` 里,容器看到的 `127.0.0.1` 是容器自己,
  够不到宿主机上由隧道开的监听口 → **公网所有接口 502**。
  配套要求:云端 sshd 设 `GatewayPorts clientspecified`(否则 sshd 强制回绑回环)。
  线上实测用的就是这个值(2026-10-23 验证公网 `/api` 正常)。
- **只有这一条转发**:数据库在工控机本地,不需要数据库方向的转发

**必须做两件事**:① 用密钥登录(免密,别用密码交互);② 加保活自动重连——命令加
`-o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes`,
再用 NSSM / 任务计划把它做成断线自动拉起的服务。**隧道断 = 网站不可访问**,这是本架构唯一的单点,
要监控它(后端暴露 `/api/health`,云端定时探测)。

如果以后觉得 SSH 隧道不稳,可平替为 frp(云跑 frps、工控机跑 frpc),转发语义相同,代码零改动。

## 4. 数据流(对应新拓扑)

- **上行**:设备 → 采集器 → 工控机 EMQX → 工控机后端 →(历史写本机 PG / Redis 快照 / WebSocket 经隧道推给浏览器)
- **下行控制**:浏览器 → 云 Nginx → 隧道 → 工控机后端(鉴权+审计)→ 工控机 EMQX → 采集器 → PLC(联锁否决权在 PLC)

## 5. 端口与防火墙

| 机器 | 对外 | 仅本机 |
|---|---|---|
| 云服务器 | 8081/443(Nginx)、22(SSH) | 3300(隧道入口) |
| 工控机 | 无(全部回环) | 1883/18083(EMQX)、6379(Redis)、5432(PG)、3000(后端) |

工控机不需要任何入站开放;云服务器安全组只开 22/8081。**云端已无数据库端口**。

## 6. 已知取舍(记录在案)

- 历史数据在工控机本地:分析员查历史曲线时,查询经隧道到工控机后端、后端查本地 PG —— 少绕一圈,断网时历史也照常落库。代价:数据只存在工控机一台机器上,**必须配 `pg_dump` 定期备份**(备份文件再传到云端/离线盘)。
- 工厂断外网时:产线照常运行(采集/控制/落库都在工控机本地闭环),只有网站不可访问;外网恢复后隧道自愈,数据无需补传。

## 7. 实战部署记录(2026-10-14,云端 OpenClaw 龙芯服务器 119.91.145.27)

**首次端到端真实部署,踩到的坑写下来给后续重做参考。**

### 7.1 环境前提(腾讯云轻量应用服务器「OpenClaw(龙芯)-XWJN」)

| 项 | 值 |
|---|---|
| 公网 IP | 119.91.145.27 |
| 系统 | Ubuntu 24.04(内核 6.8.0-124-generic) |
| Docker | 29.1.3 + Compose 2.40.3(已装) |
| Node.js | **未装**(云端不构建前端,dist 在本地构建后上传) |
| 已部署 | OpenClaw/DSH 平台(caddy 监听 80+15130、dsh web 3080、hotspot-tracker 8848 等) |

### 7.2 端口冲突与决策

- **80 端口被 DSH caddy 占用** —— 不能动
- **8081 端口(line-twin 用的)由腾讯云安全组挡掉入站** —— 必须手动在腾讯云控制台「防火墙」页面加规则(自定义 / TCP / 8081 / 0.0.0.0/0 / 允许)
- 最终公网入口:`http://119.91.145.27:8081/`

### 7.3 SSH 通道(开发者 agent 接入用)

云服务器的 `/root/.ssh/authorized_keys` 已有 3 个公钥(line-twin-deploy / external-access / agent-client)。新加 agent 走公钥最省事:

```bash
# 本地生成(Windows / Linux 都一样)
ssh-keygen -t ed25519 -N "" -f ~/.ssh/agent-claude-line-twin-dev -C "agent-claude-line-twin-dev"

# 把公钥(~/.ssh/agent-claude-line-twin-dev.pub 内容)给运维 agent,让它:
echo '<公钥>' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

之后 `ssh -i ~/.ssh/agent-claude-line-twin-dev root@119.91.145.27` 即可连上。

> Windows 上 `chmod 600` 对私钥不生效,但 OpenSSH_for_Windows 通常容忍;连不上再处理。

### 7.4 部署步骤(从零部署 line-twin 到云端)

**前置:本地 web 已 `npm run build`(在 web/dist/ 下,2026-10-14 时间戳)。**

```bash
# 1. 上传文件(从开发机)
scp -i ~/.ssh/agent-claude-line-twin-dev deploy/nginx/cloud.conf      root@119.91.145.27:/opt/line-twin/deploy/nginx/
scp -i ~/.ssh/agent-claude-line-twin-dev -r web/dist                   root@119.91.145.27:/opt/line-twin/dist_new

# 2. SSH 上去替换 + 重建
ssh -i ~/.ssh/agent-claude-line-twin-dev root@119.91.145.27
# 备份老 dist
mv /opt/line-twin/deploy/dist /opt/line-twin/deploy/dist.bak.$(date +%Y%m%d)
# 上传的新 dist 替换
mv /opt/line-twin/dist_new /opt/line-twin/deploy/dist
```

> 数据库**不在云端**(2026-10-23 起),云端只有 Nginx 一个容器,
> 不需要 `docker compose down` / 重建 db 容器,也没有 init SQL 的坑。

### 7.5 重启 nginx 加载新 dist

```bash
docker compose -f /opt/line-twin/deploy/docker-compose.cloud.yml up -d --force-recreate nginx
```

### 7.6 验证清单

| 检查 | 命令 / 方式 | 期望 |
|---|---|---|
| 容器状态 | `docker ps --format "{{.Names}}\t{{.Status}}"` | 只有 lt-cloud-nginx 一个 Up |
| 容器内 dist 新旧 | `docker exec lt-cloud-nginx stat -c "%y" /usr/share/nginx/html/index.html` | 2026-10-xx(新) |
| 公网入口 | `curl http://119.91.145.27:8081/` | HTTP 200,title 「产线数字孪生监控平台」|
| JS hash | `curl -s http://119.91.145.27:8081/ \| grep index-...js` | 跟本地 `web/dist/assets/index-*.js` hash 一致 |
| 工控机本地库 | `psql -h 127.0.0.1 -U postgres -d linetwin -c "\dt"` | 业务表都在 |

### 7.8 已知约束(部署层)

- ⚠️ `/api/` 和 `/socket.io/` 不通 —— **必须工控机建 SSH 隧道**(-R 172.18.0.1:3300:127.0.0.1:3000)
- ⚠️ 公网必须带 `:8081` 端口(80 被 DSH 占)
- ⚠️ 后端 NestJS **不在云端跑**,在工控机跑;RBAC 登录页能看,点登录会 502(等工控机上线)
- ⚠️ 腾讯云安全组只放行常见端口,自定义端口必须手动加规则
