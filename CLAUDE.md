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
- [x] 4 登录 + RBAC 三角色
- [ ] 5 图片链路(用户决定不做)
- [x] 6 控制链路 —— 代码 + **现场点位已落地**(契约 v1.2);真实下发待人工验证
- [x] 7 上云 —— 部署 + SSH 隧道建通,`http://119.91.145.27:8081/` **已见真实 PLC 数据**
- [x] 8 到现场 —— **PLC 已真实连通**,17 word 点位表落地(11→17 于 2026-10-16),
      10 态 state + 6 个产线 IO 只读点流通到公网

> **当前唯一未验证项**:控制指令从未真正写过 PLC 寄存器(不可逆动作,须人工在产线旁执行)。
> 详见 §5.2。

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

> 现场变更点的两种情况:
> - **只加/改读取点位** → 只动 `register-mapping.csv`
> - **新增控制写入点** → CSV 加 `cmd.*` 行 + `plc_collector.CMD_DISPATCH` 把
>   对应 `None` 改成点名。**契约、云端、前端都不用动**(除非要新增指令 type,
>   那才需要扩 `docs/contract/README.md` §3.6 + 一个 `db/init/00X_*.sql`)

## 4. 关键技术决策(必读)

### 4.1 PLC 适配器(`edge/`)

**⚠️ 2026-10-16 现场扩点:11 word → 17 word(34 字节)。**

电气新增 6 个**只读 IO 点位**,TIA 侧 `MB_SERVER` HOLD 区已从 11 word 扩到 17 word,
**已实测 word 0..16 整块连读成功、无 Illegal Data Address**。
旧版本按 23 word 假设导致读越界报 `exception_code=2` 的教训仍然有效 ——
**点位表不得超过 PLC 实际开放的长度**。

**`edge/register-mapping.csv` — 17 个点位:**

| word | 契约字段 | 类型 | 缩放 | 说明 |
|---|---|---|---|---|
| 0-5 | `robot.joints[0..5]` | INT | ×10 存储 ÷10 | J1~J6 关节角 (deg) |
| 6 | `line.state` | UINT | ×1 | 产线状态,10 值枚举 |
| 7 | `cmd.stop` | UINT | — | 停止信号输入,写 1,PLC 完成后自动置 0 |
| 8 | `cmd.modeToggle` | UINT | — | 手动模式切换,1=获取 2=释放,PLC 切换后自动置 0 |
| 9 | `cmd.start` | UINT | — | 启动信号输入,写 1,PLC 完成后自动置 0 |
| 10 | `cmd.conveyor` | UINT | — | 传送带控制,**电平**,1=正转 0=停止 |
| 11 | `io.sensorIn` | UINT | ×1 | 入料传感器,1=有料 |
| 12 | `io.sensorArrive` | UINT | ×1 | 到料传感器,1=有料 |
| 13 | `io.sensorRetreat` | UINT | ×1 | 退料传感器,1=有料 |
| 14 | `io.lightColor` | UINT | ×1 | 产线灯光颜色,0=绿 1=黄 2=红 |
| 15 | `io.trayUp` | UINT | ×1 | 托料盘上升,1=上升 0=下降 |
| 16 | `io.blockUp` | UINT | ×1 | 阻挡干上升,1=上升 0=下降 |

`io.*` 走独立主题 `tl/v1/{lineId}/telemetry/io`(契约 §3.8),打到前端「IO 信号」标签页。
单个点位读失败 → 该字段为 `null`,**不兜底成 0**(0 对传感器/灯色是有意义的真实值)。

**PLC 未提供、edge 输出默认值的契约字段**(按"只增不改"保留):
`speedPct`(0)/ `robot.mode`('manual')/ `alarmCode`(0)/ `tcp`(null)/
`program`('')/ `productCode`('')/ `goodCount`(0)/ `ngCount`(0)/ `beatMs`(0)

- **`edge/plc_collector.py`**:pymodbus 3.x(`slave=` → `device_id=`,3.10 强制);
  `PLC_WORD_ORDER` 环境变量(BIG 默认 / LITTLE);
  `STATE_MAP` 负责 PLC 整数 → 契约字符串;`io_payload()` 组 IO 报文;
  `CMD_DISPATCH` 负责指令 → 寄存器。
- **⚠️ MB_SERVER 只允许一个客户端** —— 2026-10-16 实测:采集器占着 503 时,
  任何第二个连接(含临时探测脚本)都被 RST 拒绝。想单独连 PLC 调试
  **必须先停采集器**,用完记得拉回来。
- **`edge/_test_decode.py`**:13 读点 + 10 态枚举 + 4 写点地址 + io_payload 组装。
- **`edge/_test_cmd.py`**:7 type 白名单 / 无点位 rejected / 只写一次 / 枚举校验 / 通信异常,全过。

**现场 10 态 state 枚举**(PLC `dataDB[6]` 原始整数):

| 整数 | 契约值 | 含义 |
|---|---|---|
| 0 | `waiting_feed` | 等待入料 |
| 1 | `feeding` | 入料中 |
| 2 | `assembling` | 装配中 |
| 3 | `unloading` | 下料中 |
| 4 | `unload_done` | 下料完成 |
| 5 | `waiting_next` | 等待后站入料 |
| 100 | `init_error` | 初始化错误状态 |
| 101 | `stopped` | 停止状态 |
| 102 | `manual_mode` | 手动控制模式 |

原 4 态(`running`/`idle`/`alarm`/`offline`)保留,与 10 态并存(DB 约束见 §4.6)。

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
- **云服务器**当前跑的是 **demo build**,但 `/api/` 与 `/socket.io/` 已通过 SSH 隧道
  转发到工控机后端 —— 所以 `http://119.91.145.27:8081/` 上 **状态/孪生页拿到的是真实
  PLC 数据**(2026-10-15 验证:`state=manual_mode`,来自 PLC word 6 = 102)。
  仅"无后端时的 demo fallback"分支还用得到 mock。
- 本机开发时前端 dev server 绑 IPv6 回环,用 `http://localhost:5173`(不是 `127.0.0.1`)。

### 4.4 云端部署

- 云服务器:`119.91.145.27`(OpenClaw 龙芯,腾讯云轻量云,VM-0-3-ubuntu)
- 公网入口:`http://119.91.145.27:8081/`(8081 是因为 DSH caddy 占 80)
- 容器:`lt-cloud-nginx`(nginx:1.27-alpine)+ `lt-cloud-db`(timescale/timescaledb:latest-pg16)
- 部署位置:`/opt/line-twin/`(`deploy/` + `db/` + `dist/`)
- **腾讯云安全组**已加 8081 端口规则(自定义 / TCP / 8081 / 0.0.0.0/0 / 允许 / 备注:line-twin nginx)
- 实战部署过程、踩坑:`docs/deployment.md` §7
- **2026-10-15 补充**:sshd 已设 `GatewayPorts clientspecified`,
  nginx upstream 改为 `172.18.0.1:3300`(见 §4.5 为什么不能用 127.0.0.1)

### 4.5 SSH 通道(命脉)—— 已建通 ✅

工控机**主动**建隧道(**工厂防火墙零配置**):

```bash
ssh -N -R 172.18.0.1:3300:127.0.0.1:3000 \
    -i ~/.ssh/agent-claude-line-twin-dev \
    -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -o ControlMaster=no -o ControlPath=none \
    root@119.91.145.27
```

**⚠️ 为什么绑 `172.18.0.1` 而不是 `127.0.0.1`**(踩过的坑):

nginx 跑在**容器** `lt-cloud-nginx` 里,它看到的 `127.0.0.1` 是**容器自己**的
回环,够不到宿主机 loopback 上的隧道 → **502 Bad Gateway**。
必须把远程端口绑到宿主机的 docker 网桥 `172.18.0.1`,容器才够得着。

这样**只绑网桥、不绑 `0.0.0.0`**,3300 不会暴露到公网。配套要求:
- 云端 sshd 配 `GatewayPorts clientspecified`(否则 sshd 强制回绑 loopback)
- 云端 nginx upstream 指向 `172.18.0.1:3300`

注意:宿主机上 `curl 127.0.0.1:3300` 会失败(HTTP 000),这是**正常的** —— 只绑了网桥。

- `-L` DB 那条暂未建(用户决定暂不接云端 DB)
- **必须用密钥**(免密)+ `ControlMaster=no`(否则复用 socket 导致 hang)
- **隧道断 = 网站不可访问**(架构唯一单点),需做成开机自启 + 断线重连(见 §5.2)

### 4.6 控制链路(路线 6,2026-10-15 拍板 + 现场点位落地)

- **范围**:只读 + I/O 展示 + 软控制。孪生页右侧 `IoPanel`(六轴关节角 + I/O 灯矩阵 + 数值)+ 控制按钮区;
  独立的「IO 信号」标签页只读展示 word 11~16。
- **PLC**:**现场点位表只开放 4 个写入点**,契约 7 个 type 里只有 4 个可执行:

| type | 现场寄存器 | 触发语义 | 状态 |
|---|---|---|---|
| `start` | word 9 | 写 1,PLC 完成后自动置 0 | ✅ 可执行 |
| `stop` | word 7 | 写 1,PLC 完成后自动置 0 | ✅ 可执行 |
| `mode_set` | word 8 | `action: acquire(1) / release(2)`,PLC 切换后自动置 0 | ✅ 可执行 |
| `conveyor` | word 10 | **电平**,`action: forward(1) / stop(0)` | ✅ 可执行 |
| `reset` | — | — | ❌ 现场无寄存器 → edge 回 **rejected** |
| `changeover` | — | — | ❌ 同上 |
| `alarm_clear` | — | — | ❌ 同上 |

  > **"不可执行"是刻意设计**:保留在白名单里为契约完整性(只增不改),
  > 但 edge 检测到无对应点位时回 `rejected` + 说明原因,**绝不假装 acked**
  > —— 否则操作员会以为指令生效了。前端把三个按钮置灰并标注原因。
  > 现场若新增寄存器:CSV 加 `cmd.*` 行 + `CMD_DISPATCH` 的 `None` 改回点名即可,契约不动。

- **⚠️ v1.3 写点时序变更**:原设计是 edge "写 1 → sleep 100ms → 写 0" 模拟按下触发。
  现场确认 **PLC 在完成动作/模式切换后自己把寄存器清零**,所以 edge 现在**只写值、
  不再回写 0**。两个写者抢同一个寄存器反而可能把 PLC 刚写好的值覆盖掉。
- **契约 v1.1 → v1.2**:`mode_set.params` 从 `{mode: manual|auto|remote}`
  **修正**为 `{action: acquire|release}`(现场只有"获取/释放手动"两态,
  原值是对机器人运行模式的误解);**新增** `conveyor` 类型。
  DB CHECK 约束分别在 `db/init/003_`(v1.1)、`005_`(v1.2)。
- **`line.state` 10 态**:`db/init/004_line_state_stages.sql` 放宽两个表的 CHECK;
  前端 `web/src/services/lineState.ts` **单点定义** 中文 + 语义色,
  `StatusView.vue` / `IoPanel.vue` 共用(避免三处各写一份映射)。
- **PLC 前置条件**(2026-10-16 现场确认;前端 `ControlButtons.vue` 的 `can()` 已按此
  **真正禁用按钮**并在下方给出原因文案,`confirm()` 里再挡一次防状态竞态;
  **PLC 联锁仍是最终否决权**,两边都要有):

  ```
  stopped(101) ──[获取手动]──▶ manual_mode(102)
       ▲                            │
       └────[释放手动]─────────────┘   释放后 PLC 自动切回 stopped(101)
  ```

  | 指令 | 可用条件 |
  |---|---|
  | `mode_set` acquire | 仅 `stopped(101)` |
  | `mode_set` release | 仅 `manual_mode(102)` |
  | `conveyor` | 仅 `manual_mode(102)` |
  | `start` | 不可在 `manual_mode(102)` 下(先释放手动);`init_error` 下不可用 |
  | `stop` | 除 `init_error` 外均可用 |
  | 全部 | `init_error(100)` 下**全部禁用** |

  > `init_error` **只能由产线物理按钮解除,网页永远不提供解除手段** ——
  > 按钮区会直接显示"请到产线现场按物理按钮复位"。
- **写权限**:`level >= 2`(`server/src/command/command.guard.ts`),前端按 `auth.canCommand` 显隐。
- **params 枚举校验**:后端 `command.service.ts` 的 `PARAM_ENUMS` 拦非法值,
  非法请求根本不会 publish 到 MQTT,PLC 不会被写。

## 5. 已就位 / 待办

### 5.1 已完成 ✅

**2026-10-16 本轮(现场扩点 11 → 17 word)**

- ✅ **TIA HOLD 区扩到 17 word 并实测通过** —— word 0..16 整块连读成功,无 Illegal Data Address
- ✅ **新增 6 个只读 IO 点位**(word 11~16)—— 点位表 + 采集器 `io_payload()`
  + 契约 §3.8 + 独立主题 `telemetry/io` + Redis 快照 + WS `io_state` + 「IO 信号」标签页
- ✅ **控制按钮改为真前置条件** —— 按 §4.6 的状态机禁用,`init_error` 全禁并提示物理按钮解除
- ✅ **写点时序收敛** —— PLC 自行清零,edge 只写一次不回写 0
- ✅ 端到端已验:snapshot 拿到真实 `io`,`state=unloading` 与 `lightColor=1(黄灯)` 互相印证

**2026-10-15 本轮(现场实测驱动)**

- ✅ **PLC 真实连通** —— `plc_collector.py` 实连 S7-1200 (`192.168.10.31:503`),
  读 word 0..10 全部成功。实测读到 `state=102(manual_mode)`,
  **证明 PLC 侧 DB 有人在写**(之前全 0 是因为用了错误的 23-word 点位表)
- ✅ **点位表纠正为现场 11 word** —— 旧版 23 word 是错的,PLC HOLD 区本来就只开放 11。
  PLC 侧**无需改动**
- ✅ **产线状态 10 态** —— PLC 整数 → 契约字符串(`STATE_MAP`)+ DB 约束(004)
  + 前端单点映射(`lineState.ts`)+ 语义色
- ✅ **控制链路落到真地址** —— word 7/8/9/10,契约 v1.2(+`conveyor`,
  `mode_set.params` 修正为 `{action}`)。3 个现场无寄存器的指令明确 rejected 不假 ack
- ✅ **SSH 隧道建通** —— `-R 172.18.0.1:3300:127.0.0.1:3000`,
  公网 `http://119.91.145.27:8081/` **已能拿到真实 PLC 数据**
- ✅ 测试全绿 —— `_test_decode.py`(7 读点 + 10 态 + 4 写点,双字序)、
  `_test_cmd.py`(7 type / 脉冲 vs 电平 / 枚举校验 / 无点位 rejected)
- ✅ 后端 `build` + 前端 `vue-tsc --noEmit` 均无错

**此前已完成**

- RBAC 后端 + 前端 + 路由守卫 + 角色菜单 + 用户管理页,端到端验证通过
- 云端部署(`lt-cloud-nginx` :8081 + `lt-cloud-db`)
- 控制链路代码骨架(CommandGuard level>=2 / audit_logs / 15s 超时 / WS cmd_ack)
- 前端 IoPanel + ControlButtons(确认弹窗 + ack 状态机)

### 5.2 待办

- [ ] **控制指令真实下发验证(唯一剩下的硬骨头)** —— 代码路径已通、参数已校验、
      但**从未真正写过一次 PLC 寄存器**。这类动作不可逆(会启动产线/转传送带),
      必须**由人在产线旁盯着再点**。建议顺序:
  1. 确认产线处于 `stopped(101)` 状态
  2. 点「获取手动模式」→ TIA 里看 `dataDB[8]` 是否出现 1 然后被采集器回写成 0(脉冲)
  3. 手动模式下点「传送带正转」→ TIA 里看 `dataDB[10]` 是否变成 1 并**保持**(电平)
  4. 点「传送带停止」→ 确认 `dataDB[10]` 回 0
  5. 手动模式下点「启动」→ 确认 `dataDB[9]` 脉冲 + 产线状态跳到 0(等待入料)
- [ ] **机器人动起来后验证 3D 孪生** —— 目前 `joints` 全 0(机器人静止或未接入),
      机械臂不会动。机器人一动,孪生页应同步摆动
- [ ] **云端 DB 分层**(用户已决定暂不接)—— 历史数据目前仍写本机 PG。
      若要上云:`-L 15432:127.0.0.1:5432` 避开本机 PG 占的 5432,
      后端 `DATABASE_URL` 指向 15432,密码取云端 `/opt/line-twin/deploy/.env`
- [ ] **隧道做成开机自启** —— 当前是手工起的进程。用 NSSM / 任务计划注册成服务,
      并加断线重连监控(契约:隧道断 = 网站不可访问,是本架构唯一单点)
- [ ] **生产安全收尾** —— `server/.env` 的 `ADMIN_PASSWORD=admin123` 和
      `SESSION_SECRET` 必须改;Mosquitto 目前 `allow_anonymous true` 且只监听回环,
      若要厂区多机访问需配密码文件

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

### 6.4 SSH 密钥(工控机 → 云服务器)—— 已就位 ✅

```bash
# 1. 工控机上生成(或从开发机带过来)
ssh-keygen -t ed25519 -N "" -f ~/.ssh/agent-claude-line-twin-dev -C "agent-claude-line-twin-dev"
# 2. 把公钥追加到云端 /root/.ssh/authorized_keys
cat ~/.ssh/agent-claude-line-twin-dev.pub
# 3. 验证:
ssh -o ControlMaster=no -o ControlPath=none \
    -i ~/.ssh/agent-claude-line-twin-dev \
    root@119.91.145.27 'echo ok'
```

> 2026-10-15 实况:该密钥已加进云端 authorized_keys 并验证可用。
> 同机上原有的 `external_access` / `agent_client_access` 两个私钥**已损坏**
> (`ssh-keygen` 报 invalid format),**不要用**。
> 云端还要求 `sshd` 设 `GatewayPorts clientspecified`,否则隧道会被强制回绑
> 127.0.0.1 导致 nginx 502(见 §4.5)。

### 6.5 部署后端(工控机,一次)

- `cd server && npm install && npm run build`
- 改 `.env`(从 `.env.example` 复制),设 `SESSION_SECRET` 和 `ADMIN_PASSWORD`
- `node dist/main.js` 或用 NSSM/任务计划注册成开机自启服务

### 6.6 部署前端(云服务器,一次)

按 `docs/deployment.md` §7.4-7.7:本地 build → scp dist → ssh 上 mv + docker compose up -d --force-recreate nginx。

## 7. 文件指引(按重要性)

| 路径 | 作用 |
|---|---|
| `docs/contract/README.md` | **数据契约 v1.3**(边缘/后端/前端唯一约定) |
| `docs/deployment.md` | 架构 + 实战部署记录(踩坑 + 验证清单) |
| `edge/register-mapping.csv` | **17 点位** Modbus 映射(现场实测;电气工程师 xls 为准) |
| `edge/plc_collector.py` | 真实 PLC 采集器(pymodbus 3.x + `STATE_MAP` + `CMD_DISPATCH` + 字序可配) |
| `edge/_test_decode.py` | 解码测试(7 读点 + 10 态枚举 + 4 写点地址,双字序) |
| `edge/_test_cmd.py` | 指令派发测试(7 type / 脉冲 vs 电平 / 枚举校验 / 无点位 rejected) |
| `db/init/001_init.sql` | 业务表(robot_state/line_status/event/vision_result) |
| `db/init/002_app_users.sql` | RBAC 表(app_users + level CHECK) |
| `db/init/003_control_commands_extension.sql` | 契约 v1.1:type CHECK 扩到 6 项 |
| `db/init/004_line_state_stages.sql` | **契约 v1.1**:state CHECK 放宽到 10 态工序 + 原 4 态 |
| `db/init/005_control_commands_conveyor.sql` | **契约 v1.2**:type CHECK 加 `conveyor` |
| `server/src/auth/` | 登录/会话/三级权限/首启建 admin |
| `server/src/users/` | 用户管理 CRUD |
| `server/src/command/` | 指令路由 + CommandGuard(level>=2)+ service(审计 + 15s 超时 + params 枚举校验 + operator 从 session) |
| `web/src/services/lineState.ts` | **产线状态单点映射**(中文 + 语义色),StatusView/IoPanel 共用 |
| `web/src/services/ioPoints.ts` | **IO 点位单点映射**(word/字段/文案/语义色),契约 §3.8 |
| `web/src/views/IoView.vue` | 「IO 信号」标签页(只读,level 1 可见) |
| `web/src/stores/auth.ts` | RBAC 前端 store(dev fallback) |
| `web/src/services/auth.ts` | fetch HTTP 客户端(401 跳登录) |
| `web/src/services/control.ts` | apiSendCommand + onCommandAck(socket)封装 |
| `web/src/views/LoginView.vue` | 登录页 |
| `web/src/views/UsersView.vue` | 用户管理页(admin only) |
| `web/src/components/IoPanel.vue` | 孪生页右侧:六轴关节角 + I/O 灯矩阵 + 报警灯 + 前置条件提示 |
| `web/src/components/ControlButtons.vue` | 4 个可执行按钮(启动/停止/手动模式/传送带)+ 3 个置灰 + 确认弹窗 + ack 状态机 + 15s UI 超时 |
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
