# scripts/ — 一键启动脚本

> **一句话定位**：把"手工敲一串命令"变成"双击一个 .bat 文件"。

---

## 1. 两个脚本的区别

| 脚本 | 场景 | 启动什么 | 需要云服务器/隧道？ |
|---|---|---|---|
| `start-local.bat` | ★ **工控机本地闭环**（U 盘部署包） | 后端(3000) + mock 采集器 + 前端 dev(5173) | **不需要**，全程离线可用 |
| `start-ipc.bat` | **工控机 + 云服务器**（正式形态） | 中间件(EMQX/Redis) + 后端 + 采集器 + SSH 隧道 | 需要 |
| `ipc-recover.ps1` | **正式形态 · 推荐** | 同上，但幂等 + 后台起 + 自带体检 | 需要 |
| `tunnel-keepalive.ps1` | 隧道保活 | 只管 SSH 隧道，断线重连 / 开机自启 | 需要 |
| `verify-line.ps1` | 体检 | 不启动任何东西，只检查全链路是否健康 | 不需要（会访问公网） |

---

## 1.5 三个 PowerShell 脚本（推荐路径）

2026-10-23 的事故就是"机器重启 → 中间件/后端/采集器/隧道全没自动拉起 → 公网 `/api` 长时间 502"。
下面三个脚本把恢复动作固化成可重复执行的流程：

### `ipc-recover.ps1` —— 一键恢复（幂等）

```powershell
.\scripts\ipc-recover.ps1
.\scripts\ipc-recover.ps1 -CloudUser root -KeyPath "$env:USERPROFILE\.ssh\id_ed25519"
```

按依赖顺序拉起并在结束时自检：

1. Docker Desktop → `docker compose -f deploy/docker-compose.ipc.yml up -d`（EMQX/Redis）
2. **SSH 反向隧道**（后端要用经 `-L 5432` 的云端库，所以必须先于后端）
3. 后端 `node server/dist/main.js`（dist 缺失会先 `npm run build`）
4. 采集器 `python edge/plc_collector.py`
5. 调 `verify-line.ps1` 输出体检表

已在跑的进程会跳过（按端口 / 进程命令行判定），日志写到仓库 `logs/`。

### `tunnel-keepalive.ps1` —— 隧道保活（关掉待办"隧道做成开机自启"）

```powershell
.\scripts\tunnel-keepalive.ps1              # 前台看门狗，30s 一次
.\scripts\tunnel-keepalive.ps1 -Once        # 只检查+必要时重连一次
.\scripts\tunnel-keepalive.ps1 -InstallTask # 注册开机自启计划任务（SYSTEM 身份 + 异常自动重启）
.\scripts\tunnel-keepalive.ps1 -UninstallTask
```

> ⚠️ `-R` 的绑定地址默认 `172.18.0.1:3300`（云端宿主机的 docker0 网关）。
> nginx 跑在容器里，写成 `127.0.0.1:3300` 容器连不到宿主机的 ssh -R 监听 → 公网 `/api` 全 502。

### `verify-line.ps1` —— 全链路体检（只读，不下发任何控制指令）

```powershell
.\scripts\verify-line.ps1
```

检查：Docker/容器 → MQTT 1883 → Redis 6379 → 隧道进程 → 本地 `/api` → 公网 `/api` → **PLC 实时状态**（只读）。
退出码非 0 表示有 FAIL，可直接贴回会话排查。

---

## 1.6 PLC 只读探针

`edge/plc_read_state.py` —— 读一次 PLC，打印产线状态 / 关节角 / IO，只读不写：

```powershell
python edge/plc_read_state.py
```

输出里的 `产线状态 word6 = 101 -> stopped` 就是控制指令验证的第一步前置条件。

---

## 2. start-local.bat（工控机本地闭环）

```
双击 → 弹出 3 个窗口：
  lt-server   后端      http://localhost:3000
  lt-edge     采集器    python mock_collector.py
  lt-web      前端      http://localhost:5173
```

**前置条件**（U 盘部署包已内置）：
- Windows 服务里 Mosquitto(1883) / Memurai(6379) / PostgreSQL+TimescaleDB(5432) 都在运行
- 数据库已执行 `db/init/001_init.sql`
- `server/dist/main.js` 存在、`server/.env` 已预置
- `web/node_modules` 存在

**验收**
1. `curl http://localhost:3000/api/lines/line-01/snapshot` → `robots` 非空
2. 浏览器开 `http://localhost:5173` → 机械臂在动、计数在跳、顶栏"边缘 在线"是绿点
3. `lt-edge` 窗口有数据滚动；`lt-server` 窗口无红色报错

---

## 3. start-ipc.bat（工控机 + 云服务器）

```
双击 → 弹出 4 个窗口：
  lt-middleware  EMQX + Redis（Docker）
  lt-backend     后端
  lt-collector   采集器（现场=plc_collector）
  lt-tunnel      SSH 双隧道  ★ 这个窗口绝对不能关
```

**使用前必须修改**脚本顶部的两个变量：
```bat
set CLOUD_USER=root
set CLOUD_HOST=119.91.145.27
```

> 云端 `linetwin` 账号目前 `/home/linetwin/.ssh/authorized_keys` 是空的，用不了；
> 实际在用的是 `root` + 专用密钥（云端 `authorized_keys` 里注释带
> `line-twin-ipc` / `line-twin-tunnel-system` 的那两把）。
>
> 隧道的 `-R` 必须绑 `172.18.0.1:3300`，脚本里已经改好了；绑 `127.0.0.1:3300` 会导致公网 `/api` 全 502。

---

## 4. 常见问题

| 现象 | 原因 |
|---|---|
| 公网页面能开，但 `/api` 全 502 | 隧道断了。跑 `.\scripts\verify-line.ps1` 看「SSH 反向隧道进程」那行；云端 `ss -ltnp \| grep 3300` 无监听即隧道没建起来 |
| 公网 502 且云端报 `connect() failed (111)` | 同上，且确认 `-R` 绑的是 `172.18.0.1:3300` 而不是 `127.0.0.1:3300` |
| 后端报 `password authentication failed` | PG 密码不是 `postgres123` → 改 `server/.env` 的 `DATABASE_URL` |
| 后端报 MQTT 连接失败 | Mosquitto/EMQX 没启动，或端口不是 1883 |
| 采集器窗口报 `No connection could be made` | 同上，Broker 没起 |
| 页面打开但没数据 | 前端能连后端说明链路通；检查采集器是否在发数据 + 后端 `rt:*` 快照键 |
| 浏览器打不开 5173 | 看 `lt-web` 窗口是否还在运行；Vite 首次启动要 5~10 秒 |
| 某端口被占用 | `netstat -ano | findstr :端口号` 找 PID，任务管理器结束它 |
