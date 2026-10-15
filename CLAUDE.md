# CLAUDE.md

> 产线数字孪生监控平台(`line-twin`)的项目级指引。
> **新 Claude Code session 第一件事**:读这个文件 + `docs/contract/README.md` + `docs/deployment.md`。
> 这一份是 2026-10-14 拉通"中转站对齐 + RBAC + 云端部署"后写的,记录关键决策、当前状态、待办,让另一台电脑(产线现场 Windows)上的新 session 能"续接"上下文。

---

## 1. 这是什么项目

**产线数字孪生监控平台**:机器人六轴实时孪生 + 机器视觉图片展示 + 多角色 RBAC(操作员 / 客户 / 数据分析员)。

8 步路线当前进度:

- [x] 1 数据契约 + DDL + 基础设施 + mock 采集器
- [x] 2 后端最小链路(`MQTT → TimescaleDB / Redis / WebSocket`)
- [x] 3 前端孪生(Three.js 程序化 6 轴机械臂)
- [x] 4 登录 + RBAC 三角色(后端 + 前端完成,路线 5/6 用户先不做)
- [ ] 5 图片链路
- [x] 6 控制链路(代码就位;**plc_collector 写命令点位地址是 PLACEHOLDER,等电气工程师填真实 DB 字地址**)
- [x] 7 上云(部署定稿)
- [x] 8 到现场(PLC 适配器代码完成,**未真实连过 PLC**)

## 2. 架构(铁律)

```
产线设备(机器人 / 视觉 / PLC)
    │ 产线局域网
工控机(高配 Windows): EMQX + Redis + MinIO + NestJS 后端 + edge 采集器
    │ SSH 双隧道(工控机主动外连;工厂防火墙零配置)
云服务器(低配 Linux): Nginx 静态前端 + PostgreSQL/TimescaleDB + 纯转发
    │ HTTPS
浏览器(Vue3 + Three.js)
```

**关键**:云服务器**只做**展示 + 数据库 + 纯转发,**全部数据处理在工控机**。契约层(见 §3)保证换设备不动云端代码。

详细架构与部署:`docs/deployment.md`

## 3. 契约优先

**`docs/contract/README.md` 是边缘 / 后端 / 前端三方之间唯一的约定**。**只增字段,不改名、不删字段**;破坏性变更升 `v2` 并行运行。

到现场只需:
1. 用真实采集器(目前 `edge/plc_collector.py`)替换 mock
2. 按 `edge/register-mapping.csv` 填点位
3. **其它代码不动**

## 4. 关键技术决策(必读)

### 4.1 PLC 适配器(`edge/`)

- **`edge/register-mapping.csv`**:21 个点位,按电气工程师 `DB3-Modbus-映射表.xls` 填好。覆盖契约所有需要从 PLC 拿的字段(`joints[6]/tcp[6]/speedPct/mode/program/alarmCode/state/beatMs/productCode/goodCount/ngCount`)。
- **`edge/plc_collector.py`**:升级到 pymodbus 3.x(`BinaryPayloadDecoder`/`Endian` 3.8 已 deprecate,3.16 移除);`slave=` → `device_id=`(3.10 强制);size_map 加 `INT/UINT/DINT` 别名(西门子 DBW/DBD 类型);新增 `PLC_WORD_ORDER` 环境变量(BIG 默认 / LITTLE 用于西门子 DINT 反向)。
- **`edge/_test_decode.py`**:21 点位 × 2 种字序 = 42 用例,**全过**(本地不连 PLC,纯验证解码逻辑)。

### 4.2 RBAC

- **DB**:`db/init/002_app_users.sql` 在 `app` schema 建 `app_users` 表,字段 `username/password(level 1-3)/created_at`。
- **后端**:`server/src/auth/`(controller/service/module/guard/dto/decorator/users-bootstrap) + `server/src/users/`(CRUD)。三级权限严格对照 origin/1.0.1:
  - `level=3` admin: 看全部用户 + CRUD
  - `level=2` 二级: 看 level=1+自己 + 改 level=1 密码
  - `level=1` 普通: 只看自己 + 改自己密码
- **前端**:`web/src/stores/auth.ts`(pinia store) + `web/src/services/auth.ts`(fetch 封装 HTTP,401 跳登录) + `web/src/views/LoginView.vue` + `web/src/views/UsersView.vue`。
- **菜单按 level 显隐**:`/users` 路由 meta.requiredLevel=3,`/vision` 待 5 做完后置 2;`/twin` `/status` 全部可见。
- **首启建 admin**:`server/src/auth/users-bootstrap.service.ts` 在 `app.app_users` 空时自动建 `admin` 用户,初始密码取自 `ADMIN_PASSWORD` 环境变量(`.env.example` 里默认 `admin123`,生产必须改)。
- **后端 `/api/auth/me`**:`GET /api/auth/me`(AuthGuard 保护),返回当前 session 用户;401 = 未登录。

### 4.3 前端 dev 演示模式(`web/`)

- **生产 build**(`npm run build`):**走真实链路**,mock 不生效。
- **Demo build**(`VITE_MOCK_ONLY=true npm run build`):mock fallback 生效,无后端也能进所有页面看 UI。`web/src/stores/auth.ts` `web/src/views/LoginView.vue` `web/src/composables/useLineData.ts` 三处都改用 `import.meta.env.VITE_MOCK_ONLY === 'true'` 而不是 `import.meta.env.DEV`(因为生产 build 的 `DEV` 是 false,会让 mock 失效)。
- **云服务器**目前跑的是 **demo build**(`dist/index-BdcBtyL2.js` + `index-Dhosg6aQ.css`),所以 `http://119.91.145.27:8081/` 登录页 submit 后能 demo fallback 进首页,孪生/状态/视觉页有 mock 数据。

### 4.4 云端部署

- 云服务器:`119.91.145.27`(OpenClaw 龙芯,腾讯云轻量云,VM-0-3-ubuntu)
- 公网入口:`http://119.91.145.27:8081/`(8081 是因为 DSH caddy 占 80)
- 容器:`lt-cloud-nginx`(nginx:1.27-alpine)+ `lt-cloud-db`(timescale/timescaledb:latest-pg16)
- 部署位置:`/opt/line-twin/`(`deploy/` + `db/` + `dist/`)
- **腾讯云安全组**已加 8081 端口规则(自定义 / TCP / 8081 / 0.0.0.0/0 / 允许 / 备注:line-twin nginx)
- 实战部署过程、踩坑:`docs/deployment.md` §7

### 4.5 SSH 通道(命脉)

工控机**主动**建双向隧道(**工厂防火墙零配置**):

```bash
ssh -N -R 3300:127.0.0.1:3000 -L 5432:127.0.0.1:5432 root@119.91.145.27
```

- `-R 3300:127.0.0.1:3000`:云端 3300 → 工控机后端 3000
- `-L 5432:127.0.0.1:5432`:工控机本地 5432 → 云端数据库
- **必须用密钥**(免密)+ `-o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes` + NSSM/任务计划做断线自动拉起
- **隧道断 = 网站不可访问**(架构唯一单点)

### 4.6 控制链路(路线 6,2026-10-15 拍板)

- **范围**:只读 + I/O 展示 + 软控制。孪生页右侧 `IoPanel`(报警灯 + I/O 灯矩阵 + 数值)+ 5 个控制按钮。
- **数据源**:**复用现有 21 点位**(契约 v1.1 扩 type 白名单)。契约 type 由 `start/stop/reset/changeover` 扩到 6 项(+ `mode_set` / `alarm_clear`),DB CHECK 约束扩在 `db/init/003_control_commands_extension.sql`。
- **PLC**:S7-1200 + Modbus TCP(MB_SERVER),与 `edge/plc_collector.py` 一致。
- **位置**:孪生页 `/twin` 右侧(`web/src/components/IoPanel.vue` + `web/src/components/ControlButtons.vue`)。
- **写权限**:**level >= 2** 才能下发控制指令(`server/src/command/command.guard.ts`)。前端按 `auth.canCommand` 显隐按钮。
- **契约**:只增字段不动既有;`mode_set.params.mode ∈ {manual,auto,remote}`(电平);`alarm_clear`(脉冲);`operator` 由后端从 session 注入,**前端不得传**。
- **edge 写命令点位**:`edge/register-mapping.csv` 加 `cmd.start/stop/reset/alarmClear/modeSet` 5 项,**地址是 PLACEHOLDER (100~104)**,等电气工程师填真实 DB 字地址(`docs/contract/README.md` §5 + `edge/plc_collector.py` `CMD_DISPATCH`)。
- **测试**:`edge/_test_cmd.py` 8 用例覆盖白名单 / pulse+100ms 回 0 / mode 校验 / 调试跳过 / 通信异常;`edge/_test_decode.py` 21 用例未受影响。

## 5. 已就位 / 待办

### 5.1 已完成 ✅

- PLC 适配器代码(`edge/plc_collector.py` 升级 + `edge/register-mapping.csv` 21 点位 + 单元测试 42/42 过)
- **控制链路(路线 6)代码就位**:契约 v1.1 扩 type 白名单 / DB 003 / edge 写命令 + 真写 PLC / 后端 CommandGuard(level>=2)+ audit_logs + 15s 超时 + WS cmd_ack 推送 / 前端 IoPanel + ControlButtons(带确认弹窗 + 状态机 + 15s UI 超时)/ `edge/_test_cmd.py` 8 用例全过
- RBAC 后端 + 前端 + 路由守卫 + 角色菜单 + 用户管理页
- 云端部署(`http://119.91.145.27:8081/` 当前 demo build,含 mock fallback)
- 部署文档更新(`docs/deployment.md` 实战记录)
- 仓库分支:`line-twin-dev`(已 push 到 `https://github.com/LxYYTrz/web-school`,有 6 个 commit)

### 5.2 待办(产线现场就位后)

- [ ] **plc_collector.py 真实 PLC 连一次** —— 单元测试只测了解码逻辑,**未真实连过 S7-1200**。现场必做:
  - TIA 强置 DB3.joints[0]=450,IPC 读 Holding Register 0 看是不是 450(确认 MB_SERVER 通 + 字序对)
  - 跑 `edge/plc_collector.py`,订阅 EMQX 主题,看 `tl/v1/line-01/telemetry/robot/robot-01` 有没有 5~10Hz 帧
  - 读 goodCount/ngCount 出乱码 → `PLC_WORD_ORDER=LITTLE` 再试
- [ ] **plc_collector.py 控制点位真实地址验证(路线 6 §4.6)** —— `register-mapping.csv` 里 `cmd.start/stop/reset/alarmClear/modeSet` 5 项的地址 (100~104) 是 PLACEHOLDER,等电气工程师按"DB3-控制信号映射"给真实 DB 字地址后:
  - 改 csv,跑 `_test_decode.py` + `_test_cmd.py`,确保全过
  - TIA 强置 cmd_ack 标志(若 PLC 端做回执),前端按"启动"看按钮变 "已执行 ✓"
  - 真实按启动/停止/复位/清警,观察 PLC 侧变量是否真变化(PLC 程序边沿检测或电平保持)
- [ ] **工控机 SSH 隧道建通** —— 上一步完成后,工控机跑:
  ```bash
  ssh -N -R 3300:127.0.0.1:3000 -L 5432:127.0.0.1:5432 \
    -i ~/.ssh/agent-claude-line-twin-dev \
    -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
    -o ControlMaster=no -o ControlPath=none \
    root@119.91.145.27
  ```
  (注意:之前 hang 的根因是 ControlMaster 复用 socket,加 `-o ControlMaster=no` 必带)
- [ ] **真实环境联调** —— 浏览器访问 `http://119.91.145.27:8081/`,看孪生画面实时动起来
- [ ] **后端 RBAC 端到端验证** —— `admin/admin123` 登录,新建 level=1 / 2 / 3 用户,验证菜单差异

### 5.3 不做(用户决定)

- ❌ 路线 5 图片链路(用户决定先不做)

## 6. 现场操作清单(产线 Windows 第一次开干)

### 6.1 装环境

- [Claude Code for Windows](https://claude.com/claude-code) 安装
- Python 3.11+(plc_collector.py 用,装 pymodbus 3.10+ 和 paho-mqtt 2.0+)
- Node.js 20+(前端 dev/build)
- Git

### 6.2 拉代码

```bash
git clone -b line-twin-dev https://github.com/LxYYTrz/web-school.git
cd web-school
```

### 6.3 装依赖

```bash
# 后端(产线工控机需要,产线 Windows 不需要)
cd server && npm install

# 前端 demo build(产线 Windows 上要看页面就 build 这个版本)
cd ../web
VITE_MOCK_ONLY=true npm run build
# 跑 dev 实时改实时看:
npm run dev
# 浏览器开 http://localhost:5173

# edge 采集器(产线工控机)
cd ../edge
pip install -r requirements.txt
python plc_collector.py
# (或本地试 mock: COLLECTOR=mock python mock_collector.py)
```

### 6.4 SSH 密钥(工控机 → 云服务器)

```bash
# 1. 工控机上生成(或从开发机带过来)
ssh-keygen -t ed25519 -N "" -f ~/.ssh/agent-claude-line-twin-dev -C "agent-claude-line-twin-dev"
# 2. 把公钥给云端运维 agent 追加到 /root/.ssh/authorized_keys
cat ~/.ssh/agent-claude-line-twin-dev.pub
# 3. 然后:
ssh -o ControlMaster=no -o ControlPath=none \
    -i ~/.ssh/agent-claude-line-twin-dev \
    root@119.91.145.27 'echo ok'
```

### 6.5 部署后端(工控机,一次)

- `cd server && npm install && npm run build`
- 改 `.env`(从 `.env.example` 复制),设 `SESSION_SECRET` 和 `ADMIN_PASSWORD`
- `node dist/main.js` 或用 NSSM/任务计划注册成开机自启服务

### 6.6 部署前端(云服务器,一次)

按 `docs/deployment.md` §7.4-7.7:本地 build → scp dist → ssh 上 mv + docker compose up -d --force-recreate nginx。

## 7. 文件指引(按重要性)

| 路径 | 作用 |
|---|---|
| `docs/contract/README.md` | **数据契约 v1**(边缘/后端/前端唯一约定) |
| `docs/deployment.md` | 架构 + 实战部署记录(踩坑 + 验证清单) |
| `edge/register-mapping.csv` | 21 点位 Modbus 映射(电气工程师 xls 来的) |
| `edge/plc_collector.py` | 真实 PLC 采集器(pymodbus 3.x + 字序可配) |
| `edge/_test_decode.py` | 解码单元测试(42 用例) |
| `db/init/001_init.sql` | 业务表(robot_state/line_status/event/vision_result) |
| `db/init/002_app_users.sql` | RBAC 表(app_users + level CHECK) |
| `db/init/003_control_commands_extension.sql` | 路线 6:control_commands.type CHECK 扩到 6 项(mode_set/alarm_clear) |
| `server/src/auth/` | 登录/会话/三级权限/首启建 admin |
| `server/src/users/` | 用户管理 CRUD |
| `server/src/command/` | **路线 6**:指令路由 + CommandGuard(level>=2)+ service(审计 + 15s 超时 + operator 从 session) |
| `web/src/stores/auth.ts` | RBAC 前端 store(dev fallback) |
| `web/src/services/auth.ts` | fetch HTTP 客户端(401 跳登录) |
| `web/src/services/control.ts` | **路线 6**:apiSendCommand + onCommandAck(socket)封装 |
| `web/src/views/LoginView.vue` | 登录页 |
| `web/src/views/UsersView.vue` | 用户管理页(admin only) |
| `web/src/components/IoPanel.vue` | **路线 6**:孪生页右侧 I/O 灯矩阵 + 报警灯(契约 v1.1) |
| `web/src/components/ControlButtons.vue` | **路线 6**:5 个控制按钮 + 确认弹窗 + ack 状态机 + 15s UI 超时 |
| `web/src/composables/useLineData.ts` | 产线数据 composable(mock fallback) |
| `edge/_test_cmd.py` | **路线 6**:控制命令 dispatch 单元测试(8 用例) |
| `deploy/docker-compose.cloud.yml` | 云服务器 compose(nginx + timescaledb) |
| `deploy/docker-compose.ipc.yml` | 工控机 compose(EMQX + Redis + MinIO) |

## 8. 重要环境信息(**敏感**,不进仓库**)

下面这些**不要 commit**,只放在 `~/line-twin-deploy-info.md`(本机)/工控机 `~/line-twin-deploy-info.md`:

- 云服务器:`119.91.145.27`,root 凭据
- 腾讯云账号(控制台登录)、API key(改安全组用)
- SSH 私钥 `agent-claude-line-twin-dev` 位置
- 数据库密码 `POSTGRES_PASSWORD`(在 `deploy/.env`)
- session 密钥 `SESSION_SECRET`、admin 密码 `ADMIN_PASSWORD`(在 `server/.env`)
