# CLAUDE.md

> 产线数字孪生监控平台(`line-twin`)的项目级指引。
> **新 Claude Code session 第一件事**:读这个文件 + `docs/contract/README.md` + `docs/deployment.md`。
> 这一份是 2026-10-14 拉通"中转站对齐 + RBAC + 云端部署"后写的,记录关键决策、当前状态、待办,让另一台电脑(产线现场 Windows)上的新 session 能"续接"上下文。

---

## 1. 这是什么项目

**产线数字孪生监控平台**:机器人六轴实时孪生 + 多角色 RBAC(操作员 / 客户 / 数据分析员)。

8 步路线当前进度:

- [x] 1 数据契约 + DDL + 基础设施 + mock 采集器
- [x] 2 后端最小链路(`MQTT → TimescaleDB / Redis / WebSocket`)
- [x] 3 前端孪生(Three.js 程序化 6 轴机械臂)
- [x] 4 登录 + RBAC 三角色
- [ ] 5 图片链路(用户决定不做,2026-10-22 已彻底移除)
- [x] 6 控制链路 —— 代码 + **现场点位已落地**(契约 v1.2);真实下发待人工验证
- [x] 7 上云 —— 部署 + SSH 隧道建通,`http://119.91.145.27:8081/` **已见真实 PLC 数据**
- [x] 8 到现场 —— **PLC 已真实连通**,17 word 点位表落地(11→17 于 2026-10-16),
      10 态 state + 6 个产线 IO 只读点流通到公网

> **当前唯一未验证项**:控制指令的 **PLC 侧物理动作**是否与回执一致
> (回执 acked 说明写寄存器成功了,但传送带是否真转、停止是否真停要人看一眼)。
> 详见 §5.2。

## 2. 架构(铁律)

```
产线设备(机器人 / PLC)
    │ 产线局域网
工控机(高配 Windows): EMQX + Redis + PostgreSQL/TimescaleDB + NestJS 后端 + edge 采集器
    │ SSH 反向隧道(工控机主动外连;工厂防火墙零配置)
云服务器(低配 Linux): Nginx 静态前端 + 纯转发
    │ HTTPS
浏览器(Vue3 + Three.js)
```

**关键**:云服务器**只做**展示 + 纯转发,**全部数据处理和数据存储都在工控机**。
契约层(见 §3)保证换设备不动云端代码。

> **2026-10-23 决策**:数据库**只走本地**。云端的 PostgreSQL 容器(`lt-cloud-db`)
> 已删除,云端不再有数据库端口,隧道也只挂一条 `-R 3300` 转发。

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

> **2026-10-23**:孪生页 `IoPanel` 里那行「良品 / 不良 / 节拍 / 倍率」数值已**移除**。
> 原因:这 4 个字段现场 PLC 点位表根本没提供,edge 恒输出默认值 0,
> 摆出来会被误读成"真实计数是 0"(良品率 100%、节拍 0 秒),属于假数据。
> 契约字段本身仍保留(只增不改),将来 PLC 补点位后可以再展示。
> 同理 `robot.mode` / `alarmCode` / `program` / `productCode` 目前也是默认值,
> 需要时同样应考虑隐藏而非展示假值。

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
- **菜单按 level 显隐**:`/users` 路由 meta.requiredLevel=3;
  `/twin` `/io` 全部可见。**`/status`(产线状态页)已于 2026-10-16 停用** ——
  路由与菜单项都被注释(`@deprecated` 标记,文件保留不删),恢复步骤写在
  `web/src/views/StatusView.vue` 顶部;信号观测改由 `/io` 页承担。
- **首启建 admin**:`server/src/auth/users-bootstrap.service.ts` 在 `app.app_users` 空时自动建 `admin` 用户,初始密码取自 `ADMIN_PASSWORD` 环境变量(`.env.example` 里默认 `admin123`,生产必须改)。
- **后端 `/api/auth/me`**:`GET /api/auth/me`(AuthGuard 保护),返回当前 session 用户;401 = 未登录。

### 4.3 前端 dev 演示模式(`web/`)

- **生产 build**(`npm run build`):**走真实链路**,mock 不生效。
- **Demo build**(`VITE_MOCK_ONLY=true npm run build`):mock fallback 生效,无后端也能进所有页面看 UI。`web/src/stores/auth.ts` `web/src/views/LoginView.vue` `web/src/composables/useLineData.ts` 三处都改用 `import.meta.env.VITE_MOCK_ONLY === 'true'` 而不是 `import.meta.env.DEV`(因为生产 build 的 `DEV` 是 false,会让 mock 失效)。
- **云服务器当前跑的是生产 build**(2026-10-16 实测更正,原文写的"demo build"是错的)。
  判据:线上 `dist/assets/index-*.js` 里 **grep 不到 `MOCK_CYCLE`** —— 未设
  `VITE_MOCK_ONLY` 时 mock 代码块会被 tree-shake 掉,所以生产包里不含 mock 字符串。
  **以后打包云端一律用 `npm run build`,不要加 `VITE_MOCK_ONLY=true`**。
  `/api/` 与 `/socket.io/` 通过 SSH 隧道转发到工控机后端,所以
  `http://119.91.145.27:8081/` 拿到的是**真实 PLC 数据**(2026-10-16 验证:
  `state=unloading` + `io.sensorArrive=1`,来自 word 6 与 word 11~16)。
  代价:后端/隧道断时**没有 mock 兜底**,页面只会空着,不会显示假数据。
- 本机开发时前端 dev server 绑 IPv6 回环,用 `http://localhost:5173`(不是 `127.0.0.1`)。

### 4.4 云端部署

- 云服务器:`119.91.145.27`(OpenClaw 龙芯,腾讯云轻量云,VM-0-3-ubuntu)
- 公网入口:`http://119.91.145.27:8081/`(8081 是因为 DSH caddy 占 80)
- 容器:**只有 `lt-cloud-nginx`**(nginx:1.27-alpine)。
  ★ 云端数据库容器 `lt-cloud-db` 已于 2026-10-23 删除(数据库只走本地,见 §2)
- 部署位置:`/opt/line-twin/`(`deploy/` + `dist/`)
- **腾讯云安全组**已加 8081 端口规则(自定义 / TCP / 8081 / 0.0.0.0/0 / 允许 / 备注:line-twin nginx)
- 实战部署过程、踩坑:`docs/deployment.md` §7
- **2026-10-15 补充**:sshd 已设 `GatewayPorts clientspecified`,
  nginx upstream 改为 `172.18.0.1:3300`(见 §4.5 为什么不能用 127.0.0.1)

### 4.5 SSH 通道(命脉)—— 已建通 ✅

工控机**主动**建隧道(**工厂防火墙零配置**):

```bash
# 只有一条转发:云端 3300 → 工控机 3000(网站流量)
ssh -N -R 172.18.0.1:3300:127.0.0.1:3000 \
    -i C:\ProgramData\line-twin\tunnel_ed25519 \
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

- **数据库只走本地(2026-10-23)**:工控机自己的 PostgreSQL 16 + TimescaleDB(:5432),
  历史数据和业务表都在本机。**云端没有数据库,隧道也没有数据库方向的转发。**
- **必须用密钥**(免密)+ `ControlMaster=no`(否则复用 socket 导致 hang)
- **隧道断 = 网站不可访问**(架构唯一单点),需做成开机自启 + 断线重连(见 §5.2)
- ⚠️ **隧道密钥是 SYSTEM 属主的专用密钥**
  `C:\ProgramData\line-twin\tunnel_ed25519` —— OpenSSH 要求「私钥属主 == 运行身份」,
  所以 **Administrator 身份用不了它**(别去改它的 ACL)。巡检脚本跑在 SYSTEM 上下文。
- ⚠️ **巡检的健康检查不用 ssh 探测(2026-10-23 改)**:实测 `ssh.exe` 在 SYSTEM 身份下
  **会间歇性卡死**(打印了版本/跑完命令都不退出,同一台机器用 Administrator 完全正常),
  靠 ssh 探测会把好端端的隧道误杀、或者隧道真断了不自愈。改成**端到端实测**:
  ① 隧道进程在 ② 公网 `http://119.91.145.27:8081/api/auth/me` 有 HTTP 响应
  (走完「公网 → 云 nginx → 隧道 → 工控机后端」,证明 -R 那半边真的通)。
  两项全过才算健康,否则才重建。


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

### 4.7 飞书通道(hermes ↔ 飞书,2026-10-23 落地)

- **飞书是 hermes 自带的插件**,不是 line-twin 的模块。line-twin 侧只提供了
  MCP 工具与一个「机器通道」HTTP 端点,其余都是 hermes 的事。
- **两条并行入口,同一个 agent**:
  - 网页 AI 抽屉 → `server/src/ai/` → hermes `api_server`(127.0.0.1:8642)
  - 飞书私聊/群 @ → hermes `feishu` 适配器 → 同一个 agent + 同一套 MCP 工具
- **连接方式:WebSocket 长连接**(工控机主动外连,不需要公网地址/端口映射,
  工厂防火墙零配置,与 §4.5 SSH 隧道同一思路)。
- **飞书应用是扫码自动建的**(hermes 官方 device-code 流程),凭据在
  `C:\Users\Administrator\AppData\Local\hermes\.env` 的 `FEISHU_*`。
- **飞书通道支持直控产线(演示阶段)** —— MCP 新增 `run_operation` /
  `execute_action`,「传送带启动」= 停止 → 等 stopped → 获取手动 → 等
  manual_mode → 传送带正转(PLC 联锁规定只有手动模式能动传送带,顺序写死在
  工具里,不指望模型记住)。走的是新的机器通道端点:
  `POST /api/machine/commands`(header `x-machine-token`)。
  - ★ **MCP 里没有 MQTT 客户端、没有 Modbus 代码**。直控 = 换了一种认证方式
    (机器令牌),**不是绕过校验的野路子**:白名单/枚举/审计/MQTT 仍然只有
    `CommandService.issue()` 这一份实现。
  - ★ **网页通道不受影响**:仍走 `propose_action` + 人工点确认;
    `ai.service.ts` 的 system prompt 显式禁用直控工具。
  - ★ **投产前必须关掉**:`server/.env` 的 `MACHINE_COMMAND_TOKEN` 留空
    = 整条通道 503。
- **gateway 必须常驻**:飞书通道和网页 AI 抽屉都靠它。
  已注册 Windows 计划任务 `Hermes_Gateway` 开机自启;
  `hermes gateway status` 看连通(`gateway_state.json` 里 `platforms.feishu.state=connected`)。
- ⚠️ **本次发现的老问题**:hermes gateway 之前**根本没在跑**(陈旧状态文件,
  8642 没监听),所以网页 AI 抽屉一直是 503。已随本次修复。
- ⚠️ **本次发现的老问题 2**:**两个 PLC 采集器在互相踢 MQTT**(见 §4.8),
  导致「上行状态偶尔上得来、下行指令一条也收不到」,AI 下的指令永远 timeout。
- 完整运维手册(装法、命令、访问控制、踩坑、依赖清单、实测记录):
  **`docs/feishu-hermes.md`**

### 4.8 采集器单实例(2026-10-23 修)

- **PLC 的 MB_SERVER 只接受 1 条 Modbus TCP 连接** —— 第二个采集器永远连不上。
- 更隐蔽的坑:两个采集器用**同一个 MQTT client_id**,会在 Broker 上**互相踢下线**,
  表现是「状态偶尔能上、下行指令一条收不到」。现场排查了半天才定位。
- 现在有**三道防线**:
  1. `edge/plc_collector.py` 加**单实例文件锁**(`edge/.plc_collector.lock`),
     拿不到锁直接退出,不去抢 PLC 也不去踢 MQTT;
  2. client_id 带 PID(`plc-edge-{line}-{pid}`),万一有两个也不会互踢;
  3. `ensure_collector.ps1` 加**互斥锁**,把「检查有没有采集器 + 启动采集器」
     变成原子动作(boot/logon/watchdog 三个计划任务会在同一秒触发,
     2026-10-23 就是这么起了两个)。
- ⚠️ `register-mapping.csv` 现在是 **13 读点位 + 4 写点位**(日志实测),
  与 §4.1 的 17 点位表对不上 —— 现场点位表有过改动,**以 CSV 实际内容为准**。

## 5. 已就位 / 待办

### 5.1 已完成 ✅

**2026-10-23 本轮(飞书通道 + 直控)**

- ✅ **hermes ↔ 飞书打通** —— 扫码自动创建飞书机器人应用,WebSocket 长连接,
  gateway 实测 `feishu: connected`,`hermes send` 出站验证成功
- ✅ **飞书直控产线(演示阶段)** —— 新增 `run_operation` / `execute_action`
  两个 MCP 工具 + 后端 `POST /api/machine/commands` 机器通道;
  实测「传送带启动」三步(停止→获取手动→正转)全部 acked,测试后产线已恢复原状
- ✅ **网页通道护栏没被绕过** —— 同样问「传送带启动」,网页 AI 只提建议,
  新增指令数 = 0
- ✅ **修掉采集器互踢的老 bug** —— 单实例文件锁 + client_id 带 PID +
  启动脚本互斥锁;之前两个采集器把下行指令全吞了
- ✅ **hermes gateway 恢复常驻** —— 注册 Windows 计划任务 `Hermes_Gateway` 开机自启;
  修复了「状态文件显示 running 但进程早没了」的假象(网页 AI 抽屉此前一直 503)
- ✅ **飞书依赖补齐** —— `lark-oapi 1.6.8` + `qrcode 7.4.2` 装进 hermes 运行时 venv
  (`pm install --extra feishu` 只下到 uv cache,不落到 venv,必须手动 `uv pip install`)

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
- 云端部署(`lt-cloud-nginx` :8081,**只有 Nginx**)
- 控制链路代码骨架(CommandGuard level>=2 / audit_logs / 15s 超时 / WS cmd_ack)
- 前端 IoPanel + ControlButtons(确认弹窗 + ack 状态机)

### 5.2 待办

- [ ] **收紧飞书访问控制 + 关掉直控通道** —— 当前 `FEISHU_ALLOW_ALL_USERS=true`
      (任何人可私聊 hermes)且 `MACHINE_COMMAND_TOKEN` 非空(任何人可让产线动起来)。
      投产前:飞书改白名单/配对审批,`server/.env` 的 `MACHINE_COMMAND_TOKEN` 留空
      (见 `docs/feishu-hermes.md` §6)
- [x] **控制指令真实下发验证** —— **已完成,证据在库里**:
      `control_commands` 里 2026-10-22 有 12 条 `acked`
      (start / stop / mode_set acquire|release / conveyor forward|stop),
      2026-10-23 飞书直控又跑了完整三步(停止→获取手动→传送带正转),全部 acked。
      当时写的"从未真正写过 PLC 寄存器"已经不成立,PLC 侧动作需人工复核是否
      与产线实际动作一致(传送带正转是否真的转、停止信号是否真的停)。
- [ ] **机器人动起来后验证 3D 孪生** —— 目前 `joints` 全 0(机器人静止或未接入),
      机械臂不会动。机器人一动,孪生页应同步摆动
- [x] **隧道做成开机自启** —— 已完成:计划任务 `line-twin-tunnel-{boot,logon,watchdog}`
      以 SYSTEM 身份跑 `ensure_tunnel.ps1`,已做互斥锁 + 端到端实测自愈
      (见 §4.5)
- [ ] **本机数据库备份** —— 数据只存在工控机这一台机器上了(云端库已删),
      必须配 `pg_dump` 定期备份(备份文件再同步到云端/离线盘)。
      当前 `server/.env` 的 `DATABASE_URL` 是 `postgres://postgres:postgres123@localhost:5432/linetwin`
- [ ] **生产安全收尾** —— `server/.env` 的 `ADMIN_PASSWORD=admin123` 和
      `SESSION_SECRET` 必须改;Mosquitto 目前 `allow_anonymous true` 且只监听回环,
      若要厂区多机访问需配密码文件

### 5.3 不做(用户决定)

- ❌ 路线 5 图片链路(2026-10-22 已整体移除:后端 vision 模块 + 前端视觉页 + edge 转发器 + DB 表 + 权限)

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
| `docs/feishu-hermes.md` | **hermes ↔ 飞书通道运维手册**(凭据位置、命令、访问控制、踩坑) |
| `docs/deployment.md` | 架构 + 实战部署记录(踩坑 + 验证清单) |
| `edge/register-mapping.csv` | **17 点位** Modbus 映射(现场实测;电气工程师 xls 为准) |
| `edge/plc_collector.py` | 真实 PLC 采集器(pymodbus 3.x + `STATE_MAP` + `CMD_DISPATCH` + 字序可配) |
| `edge/_test_decode.py` | 解码测试(7 读点 + 10 态枚举 + 4 写点地址,双字序) |
| `edge/_test_cmd.py` | 指令派发测试(7 type / 脉冲 vs 电平 / 枚举校验 / 无点位 rejected) |
| `db/init/001_init.sql` | 业务表(robot_state/line_status/event) |
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
| `deploy/docker-compose.cloud.yml` | 云服务器 compose(**只有 nginx**) |
| `deploy/docker-compose.ipc.yml` | 工控机 compose(EMQX + Redis) |

## 8. 重要环境信息(**敏感**,不进仓库**)

下面这些**不要 commit**,只放在 `~/line-twin-deploy-info.md`(本机)/工控机 `~/line-twin-deploy-info.md`:

- 云服务器:`119.91.145.27`,root 凭据
- 腾讯云账号(控制台登录)、API key(改安全组用)
- SSH 私钥 `agent-claude-line-twin-dev` 位置
- session 密钥 `SESSION_SECRET`、admin 密码 `ADMIN_PASSWORD`(在 `server/.env`)
- 本机数据库密码 `postgres123`(在 `server/.env` 的 `DATABASE_URL`)
