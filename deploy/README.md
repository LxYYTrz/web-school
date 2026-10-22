# deploy/ — 部署编排

> **一句话定位**：用 Docker Compose 把"中间件 + 入口"按机器角色拼起来。

---

## 1. ★ 三个 compose 文件的对应关系（部署时千万别搞混）

| 文件 | 部署在哪 | 包含什么 | 启动命令 |
|---|---|---|---|
| `docker-compose.yml` | **开发机** | EMQX + TimescaleDB + Redis（三合一） | `docker compose -f deploy/docker-compose.yml up -d` |
| `docker-compose.ipc.yml` | **工控机**（Windows，高配） | EMQX + Redis（**没有数据库**） | `docker compose -f deploy/docker-compose.ipc.yml up -d` |
| `docker-compose.cloud.yml` | **云服务器**（Linux，低配） | Nginx（前端+转发）+ TimescaleDB（**没有后端**） | `docker compose -f deploy/docker-compose.cloud.yml up -d` |

---

## 2. 为什么这样切分（部署定稿）

> 决策：云服务器 = 展示 + 数据库 + 纯转发；工控机 = 全部数据处理。

```
        ┌──────────────────────────┐              ┌───────────────────────────┐
        │ 工控机（Windows, 高配）  │  SSH 双隧道  │ 云服务器（Linux, 低配）   │
        │                          │ ───────────▶ │                           │
        │  EMQX   (ipc.yml)        │  Web 流量   │  Nginx  (cloud.yml)       │
        │  Redis  (ipc.yml)        │  ← 数据库 →  │  Postgres (cloud.yml)     │
        │  NestJS 后端（原生运行） │              │                           │
        │  edge 采集器（原生运行） │              │  零业务逻辑                │
        │  PLC / 机器人            │              │                           │
        └──────────────────────────┘              └───────────────────────────┘
```

**理由**
1. 产线数据处理必须和产线在一起 —— 断外网时产线照常工作。
2. 低配云服务器扛不住 10Hz 数据流。
3. 工控机**不需要任何入站端口**（单向出站），工厂防火墙零配置。
4. 新增产线 = 工控机上加一套（EMQX/Redis/后端/采集器），云端零改动。

---

## 3. 隧道命令（整个系统的命脉）

在**工控机**上执行（工厂通常不允许云端主动连入）：

```bash
ssh -N -R 3300:127.0.0.1:3000 -L 5432:127.0.0.1:5432 linetwin@云服务器IP
```

| 参数 | 方向 | 含义 |
|---|---|---|
| `-R 3300:127.0.0.1:3000` | 云服务器 → 工控机 | 云端 Nginx 把 Web 流量转到工控机后端 3000 |
| `-L 5432:127.0.0.1:5432` | 工控机 → 云服务器 | 工控机后端访问"本地 5432"实际打到云端数据库 |

生产必须加保活参数并做成开机自启服务：
```
-o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes
```
> ⚠ **隧道断 = 网站不可访问**，这是本架构唯一的单点，必须监控。

---

## 4. 文件说明

| 文件 | 作用 |
|---|---|
| `docker-compose.yml` | 开发机三合一编排。端口：1883/8883/18083/8083/5432/6379 |
| `docker-compose.ipc.yml` | 工控机编排。**端口全部绑 `127.0.0.1`**（只对本机可见） |
| `docker-compose.cloud.yml` | 云服务器编排。PG **只绑 `127.0.0.1`**；密码从 `deploy/.env` 读取（缺失则启动失败） |
| `nginx/cloud.conf` | ★ 云端 Nginx 站点配置：`/` 静态 SPA、`/api/` REST 反代、`/socket.io/` WebSocket 反代 |
| `nginx/certs/` | （未创建）上 HTTPS 时把证书放这里，并取消 compose 里 443 的注释 |

---

## 5. 端口与防火墙

| 机器 | 对外开放 | 仅本机 |
|---|---|---|
| 云服务器 | 80 / 443（Nginx）、22（SSH） | 5432（PG）、3300（隧道入口） |
| 工控机 | **无** | 1883/18083（EMQX）、6379（Redis）、3000（后端） |

云服务器安全组只开 22/80/443。5432、6379、18083、3300 一律不对公网。

---

## 6. 上线前检查清单

- [ ] 所有默认密码已改（`postgres123` / `admin123`）
- [ ] EMQX `EMQX_ALLOW_ANONYMOUS=false` + 配好账号认证与 ACL
- [ ] MQTT 走 8883/TLS（证书已配）
- [ ] `CORS_ORIGIN` 收敛为具体域名
- [ ] Nginx 已配 HTTPS 并把 80 跳转到 443
- [ ] TimescaleDB 设置了保留策略与压缩策略
- [ ] SSH 用密钥登录，禁用 root 密码登录
- [ ] SSH 隧道已做成开机自启 + 断线重连服务（NSSM）
- [ ] 数据库已配置定期 `pg_dump` 备份
