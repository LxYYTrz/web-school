# 部署手册(无需 AI 协助,照做即可)

> 面向部署人员。每一步都有"看到什么算成功"。遇到问题先看文末「常见问题」。

## 0. 一分钟认知

三台机器三种角色:

| 机器 | 角色 | 要部署的东西 |
|---|---|---|
| 云服务器(Linux) | 橱窗 + 数据库 | Nginx + PostgreSQL(一个 compose) |
| 工控机(Windows) | 全部数据处理 | 中间件三件套 + 后端 + 采集器 + SSH 隧道 |
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

# 4) 改密码:编辑 deploy/docker-compose.cloud.yml 里的 POSTGRES_PASSWORD

# 5) 启动
cd line-twin
docker compose -f deploy/docker-compose.cloud.yml up -d
```

✅ 成功标志:`docker ps` 看到 `lt-cloud-nginx`、`lt-cloud-db`;浏览器打开 `http://119.91.145.27`
能看到前端页面(数据为空、机械臂不动,正常——工控机还没接)。

**防火墙**:控制台「防火墙」标签页放行 22(SSH)、80(HTTP);5432 不要开。

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
| Docker Desktop | 二选一 | 用它跑 EMQX/Redis/MinIO |
| 原生 EMQX + Memurai + MinIO | 二选一 | 没 Docker 时装这三个原生 Windows 程序 |

### 2.2 拿代码

- 有外网:`git clone` 仓库并 `git checkout line-twin`,然后 `server/` 和 `edge/` 各自装依赖
- 无外网(推荐):**从开发机整体拷贝 line-twin 文件夹**(开发机上先 `cd server && npm install && npm run build`、`cd edge && pip install -r requirements.txt`),拷过来直接用

### 2.3 启动中间件

```bat
docker compose -f deploy\docker-compose.ipc.yml up -d
```
✅ `docker ps` 看到 lt-ipc-emqx / lt-ipc-redis / lt-ipc-minio。
(无 Docker:启动原生 EMQX、Memurai、MinIO,端口保持 1883/6379/9000。)

### 2.4 配置并启动后端

`server/.env`(从 .env.example 复制)内容:

```
MQTT_URL=mqtt://localhost:1883
DATABASE_URL=postgres://postgres:云端数据库密码@localhost:5432/linetwin
REDIS_URL=redis://localhost:6379
PORT=3000
```

注意 `DATABASE_URL` 写的是 **localhost**——经 SSH 隧道连到云端数据库(见 2.6)。

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
    -R 3300:127.0.0.1:3000 -L 5432:127.0.0.1:5432 linetwin@119.91.145.27
```

✅ 命令不报错、不退出。验证:云服务器上 `ss -tlnp | grep 3300` 有监听。

**稳定后做成开机自启**:用 NSSM(nssm.cc)把这条 ssh 命令注册成 Windows 服务,
失败自动重启。隧道断 = 网站打不开,务必做。

### 2.7 一键启动(可选)

日常启动也可以用 `scripts\start-ipc.bat`(改一下里面的云服务器地址),
它会开 4 个窗口:中间件 / 后端 / 采集器 / 隧道。

## 3. 整体验收顺序

| 步骤 | 操作 | 成功标志 |
|---|---|---|
| 1 | 云端 `docker ps` | 2 个容器运行 |
| 2 | 浏览器开 `http://119.91.145.27` | 前端页面出来(暂无数据) |
| 3 | 工控机 `curl http://localhost:3000/api/lines/line-01/snapshot` | 返回 JSON,有 status/robots |
| 4 | 云端 `curl http://localhost:3300/api/lines/line-01/snapshot` | 同上(说明隧道通) |
| 5 | 浏览器刷新云端页面 | 机械臂在动、计数在涨 |

## 4. 常见问题

| 现象 | 排查 |
|---|---|
| 页面能开但没数据 | 隧道 -R 没建立:云端 `ss -tlnp \| grep 3300`;工控机 ssh 窗口是否退出 |
| 后端报数据库连接失败 | 隧道 -L 没建立:工控机 `curl localhost:5432` 或看 ssh 窗口 |
| 工控机无外网装不了依赖 | 从开发机整体拷贝 line-twin(含 node_modules) |
| Docker 拉镜像失败(无外网) | 开发机 `docker pull` 后 `docker save` 成 tar,U盘拷入后 `docker load` |
| 页面白屏/样式乱 | dist 没放对位置:应在云服务器的 `deploy/dist/` |
| 推送实时数据不更新 | Nginx 的 /socket.io 段 Upgrade 头缺失——确认用的是仓库里的 cloud.conf |

## 5. 部署完回传给开发的信息

- 云服务器 IP / 域名(是否备案)
- 工控机是否能上外网
- 每一步的验收结果;失败步骤的完整报错文本
