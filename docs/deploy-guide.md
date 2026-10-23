# 部署手册(无需 AI 协助,照做即可)

<!--
  ============================================================================
  文件作用：【面向部署人员的逐步操作手册】（云端 + 工控机正式形态）
  所属模块：docs/
  ============================================================================

  【与其它文档的区别】
    docs/deployment.md            → 架构定稿与取舍（讲"为什么"）
    docs/工控机部署手册-U盘版.md   → 只在工控机本地跑的 U 盘人工版
    本文档                        → ★ 完整上线的操作手册（讲"怎么做"）

  【读法】
    §0 先看"一分钟认知"：三台机器各是什么角色
    §1 云服务器（Linux）：装 Docker → 放前端 dist → 改密码 → 起 compose
    §2 工控机（Windows）：装软件 → 起中间件 → 配 .env → 起后端 → 起采集器 → ★ 建 SSH 隧道
    §3 整体验收顺序（5 步，逐步验证）
    §4 常见问题（先查这里）
    §5 部署完回传给开发的信息

  【每一节都有"看到什么算成功"】——照着做，不用理解原理也能装完。
  ============================================================================
-->

> 面向部署人员。每一步都有"看到什么算成功"。遇到问题先看文末「常见问题」。

## 0. 一分钟认知

三台机器三种角色:

| 机器 | 角色 | 要部署的东西 |
|---|---|---|
| 云服务器(Linux) | 橱窗 | Nginx(一个 compose,只一个容器) |
| 工控机(Windows) | 全部数据处理 + 数据库 | PostgreSQL/TimescaleDB + 中间件 + 后端 + 采集器 + SSH 隧道 |
| 开发机(现在的电脑) | 开发 + 构建前端 | 只负责把 `web/` 构建出 `dist/` |

**最省事的离线方案:开发机和工控机都是 Windows,把整个 line-twin 文件夹(含 node_modules)
用 U 盘/局域网共享整体拷到工控机,工控机上零 npm/pip 安装。**

## 1. 云服务器(Linux)

```bash
# 1) 装 Docker(如已装跳过)
curl -fsSL https://get.docker.com | sh

# 2) 拿代码(二选一)
git clone https://github.com/LxYYTrz/web-school.git && cd web-school && git checkout line-twin
#   或者:直接把 line-twin 文件夹整体上传到云服务器

# 3) 前端构建产物放到位
#    在【开发机】上:cd web && npm install && npm run build
#    把生成的 web/dist/ 拷到云服务器的 line-twin/deploy/dist/

# 4) 启动(云端只有 Nginx,没有数据库)
cd line-twin
docker compose -f deploy/docker-compose.cloud.yml up -d
```

✅ 成功标志:`docker ps` 看到 `lt-cloud-nginx` 一个容器;浏览器打开 `http://119.91.145.27`
能看到前端页面(数据为空、机械臂不动,正常——工控机还没接)。

**防火墙**:控制台「防火墙」标签页放行 22(SSH)、80(HTTP)。**不用开数据库端口**。

**创建隧道专用账号**(给工控机用,不要用 root):

```bash
useradd -m -s /bin/bash linetwin
mkdir -p /home/linetwin/.ssh && touch /home/linetwin/.ssh/authorized_keys
chmod 700 /home/linetwin/.ssh && chmod 600 /home/linetwin/.ssh/authorized_keys
chown -R linetwin:linetwin /home/linetwin/.ssh
# 把工控机生成的公钥(id_ed25519.pub 内容)追加进 authorized_keys
```

## 2. 工控机(Windows)

### 2.1 软件清单(都可以离线 U 盘拷入)

| 软件 | 必需? | 说明 |
|---|---|---|
| Node.js 20 LTS | 必需 | 跑后端 |
| Python 3.11+ | 必需 | 跑采集器 |
| Docker Desktop | 二选一 | 用它跑 EMQX/Redis |
| 原生 EMQX + Memurai | 二选一 | 没 Docker 时装这两个原生 Windows 程序 |

### 2.2 拿代码

- 有外网:`git clone` 仓库并 `git checkout line-twin`,然后 `server/` 和 `edge/` 各自装依赖
- 无外网(推荐):**从开发机整体拷贝 line-twin 文件夹**(开发机上先 `cd server && npm install && npm run build`、`cd edge && pip install -r requirements.txt`),拷过来直接用

### 2.3 启动中间件

```bat
docker compose -f deploy\docker-compose.ipc.yml up -d
```
✅ `docker ps` 看到 lt-ipc-emqx / lt-ipc-redis。
(无 Docker:启动原生 EMQX、Memurai,端口保持 1883/6379。)

**数据库**(PostgreSQL 16 + TimescaleDB,Windows 原生装):端口 5432,
建表执行 `db\init\001_init.sql`(详见 `docs/工控机部署手册-U盘版.md` §2.6 / §3.2)。

### 2.4 配置并启动后端

`server/.env`(从 .env.example 复制)内容:

```
MQTT_URL=mqtt://localhost:1883
DATABASE_URL=postgres://postgres:本地库密码@localhost:5432/linetwin
REDIS_URL=redis://localhost:6379
PORT=3000
```

注意 `DATABASE_URL` 指的是**工控机本机**的 PostgreSQL —— 数据库只走本地,不经隧道。

```bat
cd server
node dist\main.js
```
✅ 打印 `MQTT 已连接` + `listening on :3000`。

### 2.5 启动采集器(mock 阶段)

```bat
cd edge
python mock_collector.py
```
✅ 打印 `mock collector 已启动`。(到现场后换成真实采集器 + 填映射表。)

### 2.6 建立 SSH 隧道(关键!)

```bat
:: 首次:生成密钥(一路回车)
ssh-keygen -t ed25519

:: 把 C:\Users\<你>\.ssh\id_ed25519.pub 的内容发给云服务器管理员,
:: 追加到 /home/linetwin/.ssh/authorized_keys

:: 建隧道(保持窗口开着)
ssh -N -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes ^
    -R 172.18.0.1:3300:127.0.0.1:3000 linetwin@119.91.145.27
    # ★ 数据库在工控机本地（2026-10-23 起云端库下线），不再需要 -L 5432 转发
```

> ⚠️ **`-R` 必须绑 `172.18.0.1`,不能绑 `127.0.0.1`。**
> 云端 nginx 跑在容器里,容器内的 `127.0.0.1` 是容器自己,连不到宿主机的 ssh -R 监听;
> `172.18.0.1` 是云端宿主机的 docker0 网关地址,容器可达。
> 绑错的后果:公网 `/api` 全部 502(`nginx ... connect() failed (111: Connection refused)`)。

✅ 命令不报错、不退出。验证:云服务器上 `ss -ltnp | grep 3300` 有监听。

**稳定后做成开机自启**(推荐用仓库里现成的看门狗,别手搓 NSSM):
```bat
powershell -ExecutionPolicy Bypass -File scripts\tunnel-keepalive.ps1 -InstallTask
```
它会注册一个 SYSTEM 身份的 Windows 计划任务:开机自启 + 进程挂了自动重启 + 30s 巡检一次。

### 2.7 一键启动(推荐用脚本,幂等)

```powershell
:: 工控机一键拉起全栈并自检(中间件 → 隧道 → 后端 → 采集器 → 体检)
.\scripts\ipc-recover.ps1

:: 单独体检(只读,不下发任何控制指令)
.\scripts\verify-line.ps1
```

老办法也可以:`scripts\start-ipc.bat`(改一下里面的云服务器地址),
它会开 4 个窗口:中间件 / 后端 / 采集器 / 隧道。

## 3. 整体验收顺序

| 步骤 | 操作 | 成功标志 |
|---|---|---|
| 1 | 云端 `docker ps` | 1 个容器运行(lt-cloud-nginx) |
| 2 | 浏览器开 `http://119.91.145.27` | 前端页面出来(暂无数据) |
| 3 | 工控机 `curl http://localhost:3000/api/lines/line-01/snapshot` | 返回 JSON,有 status/robots |
| 4 | 云端 `curl http://localhost:3300/api/lines/line-01/snapshot` | 同上(说明隧道通) |
| 5 | 浏览器刷新云端页面 | 机械臂在动、计数在涨 |

## 4. 常见问题

> **2026-10-23 事故复盘(2026-10-23 工控机重启后公网 /api 长时间 502)**
>
> | 现象 | 排查 |
> |---|---|
> | 公网页面能开,但 `/api` 全 502 | 隧道断了。云端 `docker logs lt-cloud-nginx --tail 20` 看是不是 `connect() failed (111)`;工控机看 ssh 进程在不在;跑 `scripts\verify-line.ps1` 一眼定位 |
> | 云端 `ss -ltnp` 里没有 3300 监听 | 隧道没建起来:工控机 ssh 窗口是否退出;`-R` 是否绑 `172.18.0.1:3300`(绑成 127.0.0.1 容器访问不到) |
> | 机器重启后站点就一直 502 | 隧道/中间件/后端没自启。执行 `scripts\ipc-recover.ps1` 恢复,并用 `scripts\tunnel-keepalive.ps1 -InstallTask` 装上开机自启 |

| 现象 | 排查 |
|---|---|
| 页面能开但没数据 | 隧道 -R 没建立:云端 `ss -tlnp \| grep 3300`;工控机 ssh 窗口是否退出 |
| 后端报数据库连接失败 | 本机 PostgreSQL 没起 / `DATABASE_URL` 密码不对 / 没执行 `db\init\001_init.sql` 建表 |
| 工控机无外网装不了依赖 | 从开发机整体拷贝 line-twin(含 node_modules) |
| Docker 拉镜像失败(无外网) | 开发机 `docker pull` 后 `docker save` 成 tar,U盘拷入后 `docker load` |
| 页面白屏/样式乱 | dist 没放对位置:应在云服务器的 `deploy/dist/` |
| 推送实时数据不更新 | Nginx 的 /socket.io 段 Upgrade 头缺失——确认用的是仓库里的 cloud.conf |
| 数据库本地表是空的 | 工控机执行 `psql -U postgres -d linetwin -f db\init\001_init.sql` 建表(见 U 盘手册 §3.2) |
| 80 端口被占(caddy 等) | `compose.cloud.yml` 默认就是 `8081:80`;80 空闲的机器可以改成 `"80:80"` |

## 5. 部署完回传给开发的信息

- 云服务器 IP / 域名(是否备案)
- 工控机是否能上外网
- 每一步的验收结果;失败步骤的完整报错文本
