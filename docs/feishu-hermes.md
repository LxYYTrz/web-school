# hermes ↔ 飞书通道(运维手册)

> 2026-10-23 落地。飞书是 hermes 的**消息通道**,不是 line-twin 的一部分 ——
> 它跟网页 AI 抽屉(`server/src/ai/`)是**两条并行的入口**,最终都落到同一个
> hermes agent + 同一套 line-twin MCP 工具。
>
> 2026-10-23 追加:飞书通道**支持直控产线**(演示阶段),网页通道仍然是人工确认。

---

## 1. 架构

```
                    ┌───────────────────────────────┐
  浏览器 ──HTTP──▶  │  line-twin 后端 (NestJS:3000) │  ─┐
                    │  server/src/ai/ (AI 抽屉)     │    │  OpenAI 兼容
                    └───────────────────────────────┘    │  HTTP + Bearer
                                                         ▼
  飞书 App ──WS──▶ ┌───────────────────────────────────────────────┐
                    │  hermes gateway (127.0.0.1:8642)               │
                    │   ├─ api_server  ← line-twin 后端走这条         │
                    │   └─ feishu      ← 飞书走这条(WebSocket)         │
                    │        ↓                                        │
                    │   MCP: mcp_servers.line-twin                   │
                    │        ├─ 只读查询工具                          │
                    │        ├─ propose_action(建议,人工确认)        │
                    │        └─ run_operation / execute_action(直控)  │
                    └───────────────────────────────────────────────┘
```

**关键点**

- hermes **不写任何 line-twin 代码**。飞书适配器是 hermes 自带的插件
  (`hermes-agent/plugins/platforms/feishu/`),line-twin 只需要保证 MCP 工具可用。
- 飞书走 **WebSocket 长连接**:工控机主动外连飞书,**不需要公网地址 / 端口映射**,
  工厂防火墙零配置(与 §4.5 SSH 隧道同一思路:只出不进)。
- 私聊 = 一个用户一个会话;群聊里**必须 @ 机器人**才回话。

---

## 2. 装在哪

| 组件 | 位置 |
|---|---|
| hermes home | `C:\Users\Administrator\AppData\Local\hermes` |
| hermes 代码 | `<hermes home>\hermes-agent` |
| 凭据(.env) | `<hermes home>\.env` |
| 配置(config.yaml) | `<hermes home>\config.yaml` |
| gateway 日志 | `<hermes home>\logs\gateway.log` |
| MCP stderr 日志 | `<hermes home>\logs\mcp-stderr.log` |
| 飞书插件源码 | `<hermes home>\hermes-agent\plugins\platforms\feishu\` |
| 开机自启 | Windows 计划任务 `Hermes_Gateway` |

---

## 3. 飞书应用

**是扫码自动建的,不是手搓的。** 2026-10-23 用 hermes 官方 device-code 流程
(`hermes gateway setup` 的同一个后端)扫码创建,飞书自动配好了权限并返回凭据。

| 项 | 值 |
|---|---|
| App ID | `cli_aa5004521138dd2d` |
| App Secret | 存在 `<hermes home>\.env` 的 `FEISHU_APP_SECRET`(**不进仓库**) |
| 机器人名 | 飞书用户5639VI的智能助手 |
| 用户 open_id | `ou_22cb992778e0ab0bc2fb90f7291a5ac0` |
| 机器人 open_id | `ou_615e1ca3bf624d7c57982907aeed8b54` |

> 重新建应用:在飞书手机端打开
> `https://open.feishu.cn/page/launcher?user_code=<code>&from=hermes&tp=hermes`
> 扫码后把新凭据写进 `.env` 即可。也可以直接跑 `hermes gateway setup` 走交互向导。

---

## 4. `.env` 里的飞书配置

```bash
FEISHU_APP_ID=cli_aa5004521138dd2d
FEISHU_APP_SECRET=<见 .env,勿外传>
FEISHU_DOMAIN=feishu                # 中国版;国际版 Lark 用 lark
FEISHU_CONNECTION_MODE=websocket     # 长连接,免公网地址
FEISHU_ALLOW_ALL_USERS=true          # 任何人都能私聊(开发期设定,见 §6)
FEISHU_ALLOWED_USERS=                # 白名单(留空)
FEISHU_GROUP_POLICY=open             # 群里 @ 就回
FEISHU_REQUIRE_MENTION=true          # 群里必须 @ 才回
FEISHU_HOME_CHANNEL=                 # cron / 通知的落地群,可在飞书里 /set-home 设
```

改完 **必须重启 gateway**(`hermes gateway restart`),`.env` 不是热加载的。

---

## 5. 飞书直控产线(演示阶段)

### 5.1 用户怎么说

| 飞书里说 | AI 执行 |
|---|---|
| 「传送带启动」「传送带运行」「手动跑一下传送带」 | `conveyor_start` = **停止 → 等 stopped → 获取手动 → 等 manual_mode → 传送带正转** |
| 「传送带停止」「停传送带」 | `conveyor_stop`(电平写 0) |
| 「启动产线」「开始生产」「开工」 | `line_start`(必要时先释放手动) |
| 「停止产线」「停机」 | `line_stop` |
| 「释放手动」「退出手动模式」 | `release_manual` |

> 「先停止再获取手动再传送带运行」不是多余的步骤 —— PLC 联锁规定**只有
> manual_mode 状态下才允许动传送带**,直接发 conveyor 会被拒绝。
> 这个顺序写在 MCP 的 `run_operation` 里(不是指望模型自己记住),每步都等回执。

### 5.2 链路

```
飞书消息 → hermes(feishu 通道)
  → MCP 工具 run_operation(line-twin-mcp.js)
      → POST http://127.0.0.1:3000/api/machine/commands   (x-machine-token)
          → CommandService.issue()  ← 白名单 + params 枚举 + 审计 + MQTT
              → edge → PLC 寄存器 → cmd_ack → control_commands.status
      ← 等回执(acked / rejected / timeout),逐步返回
```

**要点**:MCP 里**没有** MQTT 客户端、**没有** Modbus 代码。直控 = 换了一种
认证方式(机器令牌),**不是绕过校验的野路子** —— 校验、审计、下发仍然只有
后端 `CommandService.issue()` 这一份实现。

### 5.3 后端端点

```
POST /api/machine/commands
Header: x-machine-token: <MACHINE_COMMAND_TOKEN>
Body:   { lineId, deviceId, type, params, operator }
```

- 密钥在 **`D:\line-twin\server\.env`** 的 `MACHINE_COMMAND_TOKEN`
- **留空 = 整条通道关闭**(后端 503,MCP 侧也拒发)—— 投产收紧就改这一行
- `operator` 会写进 `audit_logs.detail`,用来追「这次是谁干的」
- 机器通道的 `operator` 会兜底成 admin 的 user_id,但 detail 里保留原字符串

### 5.4 网页通道不受影响

网页 AI 抽屉**仍然只提建议、人工点确认**:
`server/src/ai/ai.service.ts` 的 system prompt 显式禁用 `run_operation` /
`execute_action`,强制走 `propose_action`。
通道选择规则写在 MCP 的 `instructions` 里(「你在飞书 → 直控;网页抽屉 → 提建议」),
靠各通道自己的系统提示来区分。

---

## 6. 访问控制(投产前要收紧)

当前是 `FEISHU_ALLOW_ALL_USERS=true`,**任何能私聊到机器人的人都能驱动 agent**。
agent 有 line-twin 的只读 MCP 工具 + **直控产线的权限**(演示阶段),
所以投产前必须同时收紧三处:

```bash
# ① 飞书谁能私聊(hermes .env)
FEISHU_ALLOW_ALL_USERS=false
FEISHU_ALLOWED_USERS=ou_你的open_id,ou_同事的open_id
# 或用配对审批:陌生人私聊要你 hermes pairing approve

# ② 机器通道关掉(line-twin server/.env)
MACHINE_COMMAND_TOKEN=          # 留空 = 直控通道整体 503

# ③ 群里按群设规则(hermes config.yaml)
#    platforms.feishu.extra.group_rules: policy open|allowlist|admin_only|disabled
```

> 注意:直控通道开着的时候,**任何能跟机器人说话的人都能让产线动起来**。
> 演示阶段可以,投产绝对不行。

---

## 7. 常用命令

```bash
# 状态(平台连通情况在 gateway_state.json 里)
hermes gateway status

# 重启(改完 .env 或 MCP 代码后都要)
hermes gateway restart

# 往飞书发一条(不需要 LLM,直接投递)
hermes send -t feishu:<chat_id> "内容"
hermes send -t feishu:ou_xxx -f message.txt

# 看日志
type C:\Users\Administrator\AppData\Local\hermes\logs\gateway.log
type C:\Users\Administrator\AppData\Local\hermes\logs\mcp-stderr.log
```

连通判据(`gateway_state.json`):

```json
"platforms": { "api_server": {"state": "connected"}, "feishu": {"state": "connected"} }
```

改了 `server/mcp/line-twin-mcp.js` 之后**必须重启 gateway** —— MCP server 是
gateway 拉起的子进程,改了文件它不会自己重载。

---

## 8. 踩坑记录

| 坑 | 现象 | 解法 |
|---|---|---|
| **两个采集器互相踢** | 上行状态偶尔上得来,**下行指令一条也收不到**,AI 下的指令永远 timeout | 2026-10-23 实测:三个计划任务(boot/logon/watchdog)同一秒触发,各起了一个采集器。PLC 的 MB_SERVER 只允许一条连接(第二个连不上),而且两个采集器 MQTT client_id 相同 → 在 Broker 上互踢。已修:① 采集器加**单实例文件锁**(`edge/.plc_collector.lock`),拿不到锁直接退出;② client_id 带 PID;③ `ensure_collector.ps1` 加**互斥锁**,让「检查+启动」变成原子动作 |
| **hermes gateway 根本没在跑** | line-twin 网页 AI 抽屉报 503;`gateway_state.json` 显示 running 但 8642 没监听 | 陈旧状态文件。`hermes gateway status` 会报 "Stale gateway_state.json";`hermes gateway install` 重装计划任务 |
| `lark-oapi not installed` | 飞书平台一直 disconnected | `pm install --extra feishu` 只把包下到 uv cache,**没装进运行时 venv**。手动:`uv pip install --python <hermes home>\installs\<id>\environments\<id>\venv\Scripts\python.exe lark-oapi==1.6.8 qrcode==7.4.2` |
| `websockets not installed` | websocket 模式不可用 | 本机 venv 里已有 `websockets 15.0.1`,无需处理 |
| 改了 MCP 代码不生效 | 老工具还在跑 | `hermes gateway restart`(MCP 是 gateway 的子进程) |
| 卡片按钮点了报 `200340` | 飞书没配卡片回调 | 开发配置 → 事件与回调 → **回调配置** 标签页(和事件配置是分开的)加 `card.action.trigger`,并 **发布版本** |
| 群聊不回应 | — | 必须 @ 机器人;检查 `FEISHU_GROUP_POLICY` 和白名单 |
| `Another local Hermes gateway is already using this Feishu app_id` | 起第二个 gateway 被拒 | 同一个 app_id 只能一个实例在用 |

---

## 9. 依赖清单(本机实测)

| 包 | 版本 | 用途 |
|---|---|---|
| `lark-oapi` | 1.6.8 | 飞书官方 SDK(WebSocket + REST) |
| `qrcode` | 7.4.2 | 终端渲染扫码二维码(可选) |
| `websockets` | 15.0.1 | WS 模式(原本就有) |
| `aiohttp` | 3.14.3 | webhook 模式(原本就有,本方案不用) |

> 这些装在 hermes 运行时 venv:
> `<hermes home>\installs\<install_id>\environments\<env_id>\venv\`
> `hermes pm update` / `repair` 可能重建它 —— 重建后要复查 `lark_oapi` 还在不在。

---

## 10. 实测记录(2026-10-23)

飞书通道跑通「传送带启动」,三步全部 `acked`:

| # | 指令 | cmdId | 回执 | 状态迁移 |
|---|---|---|---|---|
| 1 | `stop` | 6fff5586… | acked | waiting_feed → stopped |
| 2 | `mode_set acquire` | e0c22c3d… | acked | stopped → manual_mode |
| 3 | `conveyor forward` | 5892ae39… | acked | manual_mode(电平,持续转) |

测试后已把产线恢复原状:`conveyor stop` → `mode_set release` → `start`,
状态回到 `waiting_feed`。

网页 AI 抽屉同时测过:同样问「传送带启动」,**只查了快照,新增指令数 = 0**
(人工确认的护栏没被绕过)。
