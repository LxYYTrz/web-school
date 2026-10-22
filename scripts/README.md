# scripts/ — 一键启动脚本

> **一句话定位**：把"手工敲一串命令"变成"双击一个 .bat 文件"。

---

## 1. 两个脚本的区别

| 脚本 | 场景 | 启动什么 | 需要云服务器/隧道？ |
|---|---|---|---|
| `start-local.bat` | ★ **工控机本地闭环**（U 盘部署包） | 后端(3000) + mock 采集器 + 前端 dev(5173) | **不需要**，全程离线可用 |
| `start-ipc.bat` | **工控机 + 云服务器**（正式形态） | 中间件(EMQX/Redis) + 后端 + 采集器 + SSH 隧道 | 需要 |

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
  lt-collector   mock 采集器
  lt-tunnel      SSH 双隧道  ★ 这个窗口绝对不能关
```

**使用前必须修改**脚本顶部的两个变量：
```bat
set CLOUD_USER=linetwin
set CLOUD_HOST=119.91.145.27
```

---

## 4. 常见问题

| 现象 | 原因 |
|---|---|
| 后端报 `password authentication failed` | PG 密码不是 `postgres123` → 改 `server/.env` 的 `DATABASE_URL` |
| 后端报 MQTT 连接失败 | Mosquitto/EMQX 没启动，或端口不是 1883 |
| 采集器窗口报 `No connection could be made` | 同上，Broker 没起 |
| 页面打开但没数据 | 前端能连后端说明链路通；检查采集器是否在发数据 + 后端 `rt:*` 快照键 |
| 浏览器打不开 5173 | 看 `lt-web` 窗口是否还在运行；Vite 首次启动要 5~10 秒 |
| 某端口被占用 | `netstat -ano | findstr :端口号` 找 PID，任务管理器结束它 |
