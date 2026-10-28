#!/usr/bin/env node
/**
 * Hermes 启动的独立 MCP 工具进程；main() 用 stdio 连接工具请求，不在这里另开 TCP 服务端口。
 * 先看配置与连接，再看查询、建议、机器指令、预设操作，最后看 registerTool 注册与 main 启动。
 * getLineSnapshot/getLineHistory/getRecentEvents 读取 Redis 或 PostgreSQL；proposeAction 登记待确认建议。
 * machineIssue 经 /api/machine/commands 调后端，waitAck 等业务回执；runOperation 串联代码预设步骤。
 * McpServer、zod、pg、ioredis 提供协议、校验和数据连接；本文件实现项目业务工具，不直接写 Modbus。
 * 网页与飞书的工具使用提示不是严格的通道身份隔离；真实控制仍受机器入口及命令服务检查。
 */
'use strict';
// 启用 JavaScript 严格模式，让部分隐式错误直接抛异常。

/**
 * line-twin MCP server —— 供 hermes agent 查询产线数据 / 校验并提交控制建议 / 直控执行。
 *
 * ⚠️ 安全边界(选「hermes 装在工控机」方案的核心前提):
 *   本文件里**没有任何** MQTT 客户端、没有任何 Modbus 代码、没有 shell / 文件写入。
 *   查询工具只读 Redis / Postgres;propose_action 只做白名单校验 + 落 Redis + 发
 *   Redis 通知,由 NestJS 推送成 UI 建议卡片。
 *
 * ⚠️ 直控通道(2026-10-23 新增,演示阶段用):
 *   run_operation / execute_action 会**直接下发指令**,不等人工点确认。
 *   但它们**不自己下发** —— 走的是本机后端 POST /api/machine/commands,
 *   由 NestJS 的 CommandService.issue() 完成白名单校验、审计落库、MQTT 发布。
 *   也就是说:AI 直控 = 换了一种认证方式,**不是绕过校验的野路子**。
 *   收紧方式:后端 MACHINE_COMMAND_TOKEN 留空 = 整条通道 503 关闭
 *   (MCP 侧没有 token 也会直接拒发)。详见 CLAUDE.md §4.7。
 *
 * ⚠️ stdout 是 MCP 的 stdio 传输通道 —— **任何日志都必须走 stderr**,
 *    往 stdout 写一个字节就会污染 JSON-RPC 帧。
 *
 * 启动方是 hermes(按 config.yaml 的 mcp_servers.line_twin 配置拉起),
 * 不是 NestJS;两者只通过 Redis 与 PostgreSQL 共享数据。
 */

const path = require('path');
// 加载 path 模块并保存到 path，供本文件后续调用。
// path 是从 path 加载的模块对象，提供该模块公开的函数和类型；require 是 Node.js 的 CommonJS 模块加载函数
const fs = require('fs');
// 加载 fs 模块并保存到 fs，供本文件后续调用。
// fs 是从 fs 加载的模块对象，提供该模块公开的函数和类型；require 是 Node.js 的 CommonJS 模块加载函数
const crypto = require('crypto');
// 加载 crypto 模块并保存到 crypto，供本文件后续调用。
// crypto 是从 crypto 加载的模块对象，提供该模块公开的函数和类型；require 是 Node.js 的 CommonJS 模块加载函数

// 复用后端的 node_modules 与 .env,不重复维护一份连接配置
const SERVER_ROOT = path.resolve(__dirname, '..');
require(path.join(SERVER_ROOT, 'node_modules', 'dotenv')).config({
  path: path.join(SERVER_ROOT, '.env'),
});

const { McpServer } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/mcp.js'));
const { StdioServerTransport } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/stdio.js'));
const { z } = require(path.join(SERVER_ROOT, 'node_modules', 'zod'));
const { Pool } = require(path.join(SERVER_ROOT, 'node_modules', 'pg'));
const Redis = require(path.join(SERVER_ROOT, 'node_modules', 'ioredis'));

// 指令白名单:与后端 CommandService 共读同一份 command-contract.json,
// 避免「AI 认为可执行的」与「系统真正放行的」出现漂移
const contract = require(path.join(SERVER_ROOT, 'src', 'command', 'command-contract.json'));

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres123@localhost:5432/linetwin';
  // 读取指定环境变量；若未设置则使用右侧默认值。

// 提案落 Redis 的 TTL。够人看完一条回复并点确认,又不至于隔夜复活。
const PROPOSAL_TTL_SEC = 900;
const PROPOSAL_CHANNEL = 'ai:proposal';

function log(...args) {
// 定义 log，用于把 MCP 运行日志写入标准错误，避免污染协议标准输出。
  // 只走 stderr —— stdout 是 MCP 传输通道
  process.stderr.write('[line-twin-mcp] ' + args.join(' ') + '\n');
  // 把本行提供的内容写到已打开的文件或通信目标。
}

const pool = new Pool({ connectionString: DATABASE_URL });
const redis = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
redis.on('error', (e) => log('redis error:', e.message));

// 编码 → BIGINT 主键的转换。
// Redis 侧的 key 用的是字符串编码('line-01'),可以直接拼;
// 但 Postgres 侧所有业务表的 line_id 都是 bigint 外键,必须先查 production_lines
// 换成 id。漏掉这一步会让每个 PG 查询都报
// 「无效的 bigint 输入语法 "line-01"」。后端 CatalogService 做的是同一件事。
const lineIdCache = new Map(); // code -> { id, name } | null,60s 过期(对齐 CatalogService)

// 查询工具把外部产线编码转换为数据库基础档案，后续历史/事件 SQL 使用内部 id。
// 找不到产线会按本函数错误路径结束，不能从 line-01 的字符串猜数据库编号。
async function resolveLine(code) {
  const hit = lineIdCache.get(code);
  if (hit && Date.now() - hit.at < 60000) return hit.row;
  const { rows } = await pool.query(
    'SELECT id, code, name FROM production_lines WHERE code = $1 LIMIT 1', [code]);
  lineIdCache.set(code, { at: Date.now(), row: rows[0] || null });
  if (!rows[0]) {
    const { rows: all } = await pool.query('SELECT code FROM production_lines ORDER BY id');
    throw new Error(`未知产线编码 ${code}。可用:${all.map((r) => r.code).join('|') || '(库中没有任何产线)'}`);
  }
  return rows[0];
}

// 这里创建项目自己的 MCP 工具服务，向 Hermes 提供名称明确、参数受约束的业务能力。
// 模型提出工具和参数，Hermes 组织调用，本文件的执行函数才实际查询 Redis、PostgreSQL 或访问后端机器接口。
// 工具说明中的网页与飞书使用规则主要约束模型选择，不能把提示词直接当成严格的通道身份隔离。

const server = new McpServer(
// 创建项目的 MCP 工具服务，用注册的名称、参数和执行函数向 Hermes 暴露业务能力。
// server 是 McpServer 实例；查询工具访问 Redis/PostgreSQL，控制工具调用后端机器接口，实际能力要看各工具执行函数。
  { name: 'line-twin', version: '1.1.0' },
  {
    capabilities: { tools: {} },
    instructions:
      '这是产线(line-01)的数据源与控制通道,分两类工具:' +
      '【查询类(只读)】get_line_snapshot / get_line_history / get_recent_events;' +
      '【控制类】run_operation / execute_action(直控,直接下发不等人工确认)、' +
      'propose_action(只提交建议,等人点确认)。' +
      '★ 选哪条路,取决于你所在的通道:' +
      '  · 你在飞书/Lark 里(系统提示说你在 Feishu 工作区,用户在跟你直接对话)→ ' +
      '    用 run_operation 直控。用户说「传送带启动|传送带运行|手动跑一下传送带」→ conveyor_start;' +
      '    「传送带停止」→ conveyor_stop;「启动产线|开始生产|开工」→ line_start;' +
      '    「停止产线|停机」→ line_stop;「释放手动|退出手动」→ release_manual。' +
      '  · 你在网页抽屉里(系统提示说明该通道只允许提交建议)→ 用 propose_action,不要用直控工具。' +
      'run_operation 内部会按 PLC 联锁要求的顺序执行(传送带必须:停止 → 获取手动 → 正转),' +
      '并逐步返回回执。' +
      '不要凭空猜测状态:任何结论都应先调用工具查证;执行结果要如实汇报,rejected/timeout 不许说成成功。',
  },
);

// 快照工具从 Redis 汇总工序、边缘状态和各设备最新帧，返回已保存的数据。
// 它不会为了模型回答临时请求 PLC；缺失或过期的 key 需要按空值理解。
async function getLineSnapshot(lineId) {
  const [status, edge] = await redis.mget(`rt:${lineId}:status`, `rt:${lineId}:edge`);
  // 一次读取多个 Redis 字符串键。
  const keys = await redis.keys(`rt:${lineId}:robot:*`);
  // 查询当前产线已保存机器人帧的 Redis key，后面再批量取值并解析 JSON。
  const frames = keys.length ? await redis.mget(keys) : [];
  const robots = {};
  keys.forEach((k, i) => {
  // 依次处理数组中的每个元素。
    const deviceId = k.split(':').pop();
    robots[deviceId] = frames[i] ? JSON.parse(frames[i]) : null;
    // 将 frames[i] ? JSON.parse(frames[i]) : null 的结果写入 robots[deviceId]。
  });

  const state = status ? JSON.parse(status) : null;
  const edgeState = edge ? JSON.parse(edge) : null;
  return {
    lineId,
    readAt: Date.now(),
    // 取得当前时间戳；Date.now 使用毫秒。
    status: state,
    edge: edgeState,
    robots,
    freshness: {
      statusMs: state ? Date.now() - (state.ts ?? 0) : null,
      // 取得当前时间戳；Date.now 使用毫秒。
      edgeMs: edgeState ? Date.now() - (edgeState.ts ?? 0) : null,
      // 取得当前时间戳；Date.now 使用毫秒。
      note: 'null 表示该数据已超过 TTL 未更新(空闲产线属正常),不等于设备离线',
    },
  };
}

// 查询 line_status_history 中给定时间窗口的工序记录，并限制返回条数。
// 这里的历史是产线状态历史，不是 robot_joint_states 的六轴轨迹回放。
async function getLineHistory(lineCode, minutes, limit) {
  const line = await resolveLine(lineCode);
  const { rows } = await pool.query(
    `SELECT time, state, product_code, good_count, ng_count, beat_ms
       FROM line_status_history
      WHERE line_id = $1 AND "time" > now() - ($2 || ' minutes')::interval
      ORDER BY "time" DESC
      LIMIT $3`,
    [line.id, String(minutes), limit],
  );
  return { lineId: line.code, lineName: line.name, minutes, count: rows.length, rows };
}

// 查询产线近期事件，可按 onlyProblems 收窄到告警等级，并按时间倒序限制条数。
async function getRecentEvents(lineCode, hours, onlyProblems, limit) {
  // 只给索引能覆盖的量;robot_joint_states 是 5-10Hz 的高频表,一律不直查
  const line = await resolveLine(lineCode);
  const { rows } = await pool.query(
    `SELECT time, device_id, type, level, code, message, payload
       FROM production_events
      WHERE line_id = $1
        AND "time" > now() - ($2 || ' hours')::interval
        AND ($3::boolean IS NOT TRUE OR level IN ('warning','critical'))
      ORDER BY "time" DESC
      LIMIT $4`,
    [line.id, String(hours), onlyProblems, limit],
  );
  return { lineId: line.code, hours, onlyProblems, count: rows.length, rows };
}

// 网页助手建议入口先校验契约、可执行类型和参数，再生成建议编号并写 Redis、发布通知。
// 返回 proposalId 表示建议已登记；用户确认由后端 AiController 处理，此函数不直接写 PLC。
async function proposeAction(lineId, deviceId, type, params, reason) {
  if (!contract.allowedTypes.includes(type)) {
    return {
      ok: false,
      error: `type 不在白名单。可选:${contract.allowedTypes.join('|')}`,
    };
  }
  // 只推荐现场真有寄存器、能真正下发的指令;
  // reset/changeover/alarm_clear 在这台 PLC 上没有对应寄存器,提了也必然被拒
  if (!contract.executableTypes.includes(type)) {
    return {
      ok: false,
      error: `${type} 在现场 PLC 无对应寄存器,edge 一定会回 rejected,不要建议该指令。可执行:${contract.executableTypes.join('|')}`,
    };
  }

  const enums = contract.paramEnums[type];
  if (enums) {
    const action = (params || {}).action;
    if (typeof action !== 'string' || !(action in enums)) {
      return {
        ok: false,
        error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
      };
    }
  }

  const proposal = {
    id: 'p-' + crypto.randomUUID(),
    // 生成随机 UUID 标识。
    lineId,
    deviceId,
    type,
    params: params || {},
    reason,
    status: 'pending',
    createdAt: Date.now(),
    // 取得当前时间戳；Date.now 使用毫秒。
  };

  await redis.set(`ai:proposal:${proposal.id}`, JSON.stringify(proposal), 'EX', PROPOSAL_TTL_SEC);
  // 通知 NestJS 推送成 UI 卡片。pubsub 断线不影响提案本身 —— 它已经在 Redis 里了
  await redis.publish(PROPOSAL_CHANNEL, JSON.stringify(proposal));

  return {
    ok: true,
    proposalId: proposal.id,
    instruction:
      '建议已提交,会由值班人在 UI 上人工确认后才会真正下发。' +
      '请在回复里说明这条建议的理由和预期影响,不要声称已经执行。',
  };
}

// ---------------------------------------------------------------------------
// 机器通道(直控):演示阶段让飞书里的 AI 直接下发指令
// ---------------------------------------------------------------------------
//
// 【为什么不是在这个文件里直接写 PLC】
//   本文件依然**不碰 Modbus、不碰 MQTT 发布**。它只做一件事:
//   调本机后端的 /api/machine/commands,让 NestJS 的 CommandService.issue()
//   去下发(白名单/枚举/审计/MQTT 全在后端那套里,一份实现)。
//   这样「AI 能直控」不等于「AI 绕过了所有校验」——校验仍然只有一处。
//
// 【演示阶段的取舍】
//   网页那条路依然是「人工点确认」;这条机器路是给飞书演示用的直通通道。
//   收紧方式:后端 MACHINE_COMMAND_TOKEN 留空 = 通道整体关闭(503)。
//   详见 CLAUDE.md §4.7。

const MACHINE_TOKEN = process.env.MACHINE_COMMAND_TOKEN || '';
const API_BASE = (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '');
// 契约 §5:15s 无回执置 timeout。MCP 侧等 15s 略多一点(留网络余量)。
const ACK_WAIT_MS = Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000);
// 等 PLC 状态切换的时限(停止 → stopped、获取手动 → manual_mode)
const STATE_WAIT_MS = Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 机器通道是否可用 */
function machineChannelReady() {
  return Boolean(MACHINE_TOKEN);
}

// 将本次工具控制请求通过 HTTP 交给本机后端 /api/machine/commands。
// fetch 是 Node.js HTTP API，x-machine-token 来自配置；通过后端检查才进入共用命令服务，返回 cmdId 后还需等回执。
async function machineIssue({ lineId, deviceId, type, params, operator }) {
  if (!machineChannelReady()) {
    return { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' };
  }
  let res;
  // 声明可重新赋值的变量 res，稍后再赋值。
  try {

    // 将这次工具操作提交给后端机器通道，API_BASE 是后端地址配置，x-machine-token 携带配置的机器令牌。
    // 后端通过机器通道守卫后仍调用共用 CommandService，再进入 MQTT、采集器和 PLC 的既有控制链。
    // operator 是此通道传入的操作者标识，不能把机器令牌检查和网页 cookie-session 登录验证混为一谈。

    res = await fetch(`${API_BASE}/api/machine/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-machine-token': MACHINE_TOKEN },
      body: JSON.stringify({ lineId, deviceId, type, params: params || {}, operator }),
    });
  } catch (e) {
    return { ok: false, error: `调用后端失败:${e.message}` };
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: body?.msg || body?.message || `后端返回 HTTP ${res.status}` };
  }
  if (!body?.ok) {
    return { ok: false, error: body?.error || '后端拒绝下发' };
  }
  return { ok: true, cmdId: body.cmdId };
}

// 按 cmdId 轮询 control_commands，等待记录离开 pending/sent，或到工具等待期限。
// 轮询间隔为 400ms，默认期限来自 ACK_WAIT_MS；数据库状态与现场物理完成必须分别解释。
async function waitAck(cmdId, timeoutMs = ACK_WAIT_MS) {
// 在超时时间内查询并等待指定指令的最终回执。
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
  // 持续检查(Date.now() < deadline)，按判断结果进入对应的处理分支。
    const { rows } = await pool.query(
      `SELECT status, ack_payload, acked_at FROM control_commands WHERE idempotency_key = $1`,
      // control_commands 是保存控制指令审计记录的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [cmdId],
    );
    const row = rows[0];
    if (row && row.status !== 'pending' && row.status !== 'sent') {
      return {
        status: row.status,
        message: row.ack_payload?.message || '',
        ackedAt: row.acked_at,
      };
    }
    await sleep(400);
    // 暂停当前线程指定秒数。
  }
  return { status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null };
}

// 从 Redis 读取该产线最后保存的工序字符串，解析失败或 key 缺失返回 null。
async function currentState(lineId) {
  const raw = await redis.get(`rt:${lineId}:status`);
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.state ?? null;
  } catch {
    return null;
    // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
  }
}

// 预设操作在需要时轮询工序快照，等待其进入 wanted 状态或结束等待。
// 这是读取已有上报，不等于重新采集 PLC；状态等待与 waitAck 的写入回执等待是两个阶段。
async function waitState(lineId, wanted, timeoutMs = STATE_WAIT_MS) {
  const list = Array.isArray(wanted) ? wanted : [wanted];
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
  // 持续检查(Date.now() < deadline)，按判断结果进入对应的处理分支。
    last = await currentState(lineId);
    if (last && list.includes(last)) return { reached: true, state: last };
    await sleep(500);
    // 暂停当前线程指定秒数。
  }
  return { reached: false, state: last };
}

// 按当前工序和动作检查单步操作的前置条件，返回错误原因或允许继续。
// 这些条件由项目代码写定，不能由模型自由省略；skipPrecondition 等参数要结合调用方逐步说明。
function preconditionError(type, action, state) {
  if (!state) return '读不到当前产线状态(快照为空),拒绝盲发指令';
  if (state === 'init_error') {
    return '产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位';
  }
  if (type === 'mode_set') {
    if (action === 'acquire') {
      return state === 'stopped' ? null : `获取手动模式只能在 stopped 状态执行,当前是 ${state}`;
    }
    if (action === 'release') {
      return state === 'manual_mode' ? null : `释放手动只能在 manual_mode 状态执行,当前是 ${state}`;
    }
  }
  if (type === 'conveyor') {
    return state === 'manual_mode' ? null : `传送带只能在手动模式(manual_mode)下运行,当前是 ${state}`;
  }
  if (type === 'start') {
    if (state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)';
  }
  return null;
  // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
}

// 执行一个预设步骤：读取工序和前置条件、提交机器指令、等待回执，并按需等待目标状态。
// 不同等待的结果都会影响是否继续后续步骤；正常写响应并不自动证明物理目标已完成。
async function execStep({ lineId, deviceId, type, params, operator, waitFor, skipPrecondition }) {
// 执行操作流程中的一个指令步骤并等待回执。
  const action = params?.action;
  const before = await currentState(lineId);
  if (!skipPrecondition) {
    const bad = preconditionError(type, action, before);
    if (bad) {
      return { type, params: params || {}, ok: false, status: 'skipped', message: bad, stateBefore: before };
    }
  }
  const issued = await machineIssue({ lineId, deviceId, type, params, operator });
  if (!issued.ok) {
    return { type, params: params || {}, ok: false, status: 'failed', message: issued.error, stateBefore: before };
  }
  const ack = await waitAck(issued.cmdId);
  const step = {
    type,
    params: params || {},
    cmdId: issued.cmdId,
    ok: ack.status === 'acked',
    status: ack.status,
    message: ack.message,
    stateBefore: before,
  };
  if (waitFor && step.ok) {
    const st = await waitState(lineId, waitFor);
    step.stateAfter = st.state;
    step.stateReached = st.reached;
    if (!st.reached) {
      step.ok = false;
      step.message = `指令已下发并回执,但产线状态没有变成 ${waitFor}(当前 ${st.state})`;
    }
  }
  return step;
}

/**
 * 组合操作:把「一次人话指令」翻译成正确的 PLC 操作序列。
 *
 * conveyor_start 的序列来自现场联锁(CLAUDE.md §4.6):
 *   停止 → 等 stopped → 获取手动模式 → 等 manual_mode → 传送带正转
 * 只在手动模式下传送带才允许动作,直接发 conveyor 会被 PLC 拒绝,
 * 所以「先停止再获取手动」不是多余的步骤,是必须的。
 */
const OPERATIONS = {
  conveyor_start: {
    title: '传送带正转',
    desc: '按「停止 → 获取手动模式 → 传送带正转」三步执行(PLC 只允许手动模式下动传送带)',
  },
  conveyor_stop: { title: '停止传送带', desc: '传送带停止(电平型,写 0)' },
  line_start: { title: '启动产线', desc: '必要时先释放手动模式,再启动' },
  line_stop: { title: '停止产线', desc: '停止信号' },
  release_manual: { title: '释放手动模式', desc: '退出手动模式,回到 stopped' },
};

// 按 op 选择代码写定的多步操作；dryRun 分支只返回步骤计划。
// 真实分支按顺序调用 execStep；例如传送带正转先停止、取得手动，再发正转，前序失败不继续。
async function runOperation(op, { lineId, deviceId, operator, dryRun }) {
  const meta = OPERATIONS[op];
  if (!meta) {
    return { ok: false, error: `未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('|')}` };
  }
  const state0 = await currentState(lineId);
  const steps = [];

  if (op === 'conveyor_start') {
    if (dryRun) {
      steps.push({ type: 'stop', params: {} });
      steps.push({ type: 'mode_set', params: { action: 'acquire' } });
      steps.push({ type: 'conveyor', params: { action: 'forward' } });
      return { ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps };
    }
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, waitFor: 'stopped' }));
    if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    steps.push(
      await execStep({
      // 执行操作流程中的一个指令步骤并等待回执。
        lineId, deviceId, type: 'mode_set', params: { action: 'acquire' }, operator, waitFor: 'manual_mode',
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
      }),
    );
    if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    steps.push(
      await execStep({
      // 执行操作流程中的一个指令步骤并等待回执。
        lineId, deviceId, type: 'conveyor', params: { action: 'forward' }, operator,
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
      }),
    );
  } else if (op === 'conveyor_stop') {
    if (dryRun) {
      return {
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        planned: [{ type: 'conveyor', params: { action: 'stop' } }],
      };
    }
    // 传送带停止是电平写 0,不受「必须在手动模式」限制 → 跳过前置校验
    steps.push(
      await execStep({
      // 执行操作流程中的一个指令步骤并等待回执。
        lineId, deviceId, type: 'conveyor', params: { action: 'stop' }, operator, skipPrecondition: true,
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
      }),
    );
  } else if (op === 'line_start') {
    if (dryRun) {
      return {
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        planned: [
          ...(state0 === 'manual_mode' ? [{ type: 'mode_set', params: { action: 'release' } }] : []),
          { type: 'start', params: {} },
        ],
      };
    }
    if (state0 === 'manual_mode') {
      steps.push(
        await execStep({
        // 执行操作流程中的一个指令步骤并等待回执。
          lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped',
          // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
        }),
      );
      if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    }
    steps.push(await execStep({ lineId, deviceId, type: 'start', params: {}, operator }));
  } else if (op === 'line_stop') {
    if (dryRun) {
      return {
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        planned: [{ type: 'stop', params: {} }],
      };
    }
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, skipPrecondition: true }));
  } else if (op === 'release_manual') {
    if (dryRun) {
      return {
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        planned: [{ type: 'mode_set', params: { action: 'release' } }],
      };
    }
    steps.push(
      await execStep({ lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped' }),
      // 执行操作流程中的一个指令步骤并等待回执。
    );
  }

  const ok = steps.length > 0 && steps.every((s) => s.ok);
  return {
    ok,
    operation: op,
    title: meta.title,
    stateBefore: state0,
    stateAfter: await currentState(lineId),
    // 读取产线最新工序状态。
    steps,
    // steps 是上方取得或计算的同名局部值，在此作为返回对象的 steps 属性
    summary: steps.map((s) => `${s.type}${s.params?.action ? ':' + s.params.action : ''} → ${s.status}`).join(' , '),
    // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
  };
}

// ---------------------------------------------------------------------------
// 注册
// ---------------------------------------------------------------------------

const READ_ONLY = { readOnlyHint: true };

// 注册 get_line_snapshot：名称与说明让调用方知道工具用途，inputSchema 用 zod 约束 lineId 参数。
// 执行函数调用本文件的 getLineSnapshot() 取得实际快照，再包装成 MCP 文本结果返回。
// READ_ONLY 是工具的只读提示，不能据此把所有其他工具也视为只读，控制能力要看对应执行函数。

server.registerTool(
// 将产线快照工具登记到 MCP 服务，供调用方发现并按参数规则执行。
// registerTool() 接收名称、工具说明、zod 入参定义和回调；getLineSnapshot(lineId) 取得实际数据，content 将结果包装成 MCP 文本。
  'get_line_snapshot',
  {
    title: '产线实时快照',
    description:
      '读取产线当前实时状态:产线状态机、边缘网关在线情况、各机器人关节角。' +
      '注意 status/edge/robots 中出现 null 表示该数据超过 TTL 未刷新(空闲产线正常),不代表设备故障。',
    inputSchema: { lineId: z.string().describe('产线编码,例如 line-01') },
    annotations: READ_ONLY,
  },
  async ({ lineId }) => ({ content: [{ type: 'text', text: JSON.stringify(await getLineSnapshot(lineId)) }] }),
);

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
  'get_line_history',
  {
    title: '产线状态历史',
    description: '按时间倒序读取产线状态变化历史,用于回答「刚才发生了什么」「什么时候停的」。',
    inputSchema: {
      lineId: z.string(),
      minutes: z.number().int().min(1).max(10080).default(60).describe('回溯分钟数,默认 60'),
      limit: z.number().int().min(1).max(500).default(100),
    },
    annotations: READ_ONLY,
  },
  async ({ lineId, minutes, limit }) => ({
    content: [{ type: 'text', text: JSON.stringify(await getLineHistory(lineId, minutes ?? 60, limit ?? 100)) }],
  }),
);

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
  'get_recent_events',
  {
    title: '近期报警与事件',
    description: '读取生产事件流。排查故障时通常把 onlyProblems 设为 true,只看 warning/critical。',
    inputSchema: {
      lineId: z.string(),
      hours: z.number().int().min(1).max(168).default(24),
      onlyProblems: z.boolean().default(true).describe('只看 warning/critical'),
      limit: z.number().int().min(1).max(200).default(50),
    },
    annotations: READ_ONLY,
  },
  async ({ lineId, hours, onlyProblems, limit }) => ({
    content: [
      { type: 'text', text: JSON.stringify(await getRecentEvents(lineId, hours ?? 24, onlyProblems ?? true, limit ?? 50)) },
    ],
  }),
);

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
  'propose_action',
  {
    title: '提交控制建议(需人工确认)',
    description:
      '当诊断结论需要改变产线状态时调用本工具提交一条**建议**。' +
      '它只做校验和登记,不会执行 —— 会在值班人界面上生成一张待确认卡片,人工点击后才真正下发。' +
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      (contract.paramEnums.mode_set ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') : '') +
      // 取得字典或对象中的所有键。
      (contract.paramEnums.conveyor ? ';conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') : '') +
      // 取得字典或对象中的所有键。
      '不要为 reset/changeover/alarm_clear 提建议 —— 现场 PLC 没有对应寄存器。',
    inputSchema: {
      lineId: z.string(),
      deviceId: z.string().describe('设备编码,例如 robot-01'),
      type: z.enum(contract.executableTypes).describe('控制指令类型'),
      params: z.record(z.unknown()).optional().describe('指令参数,含 action 枚举值'),
      reason: z.string().describe('为什么需要这条操作,会写进 UI 给值班人看,写清楚依据'),
    },
  },
  async ({ lineId, deviceId, type, params, reason }) => ({
    content: [{ type: 'text', text: JSON.stringify(await proposeAction(lineId, deviceId, type, params, reason)) }],
  }),
);

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
  'run_operation',
  {
    title: '执行产线操作(直控)',
    description:
      '★ 直控工具:把一句人话翻译成正确的 PLC 操作序列并**直接执行**,不用人工点确认。' +
      '可用操作:' +
      Object.entries(OPERATIONS)
        .map(([k, v]) => `${k}(${v.title}:${v.desc})`)
        // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
        .join(';') +
      '。' +
      '用户说「传送带启动/传送带运行」→ conveyor_start;' +
      '「传送带停止」→ conveyor_stop;' +
      '「启动产线/开始生产」→ line_start;' +
      '「停止产线」→ line_stop;' +
      '「释放手动/退出手动模式」→ release_manual。' +
      '每一步都会等 PLC 回执,返回里逐步给出 status(acked/rejected/timeout)。' +
      '如实汇报每一步的结果,不要把 rejected/timeout 说成成功。',
    inputSchema: {
      lineId: z.string().default('line-01').describe('产线编码,默认 line-01'),
      deviceId: z.string().default('robot-01').describe('设备编码,默认 robot-01'),
      operation: z.enum(Object.keys(OPERATIONS)).describe('要执行的操作'),
      operator: z.string().optional().describe('操作者标识,例如 ai:feishu:ou_xxx,会写进审计'),
      dryRun: z.boolean().default(false).describe('只预演不下发(排查/确认流程用)'),
    },
  },
  async ({ lineId, deviceId, operation, operator, dryRun }) => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          await runOperation(operation, {
          // 按现场联锁顺序执行完整控制操作并汇总步骤结果。
            lineId: lineId || 'line-01',
            deviceId: deviceId || 'robot-01',
            operator: operator || 'ai:line-twin',
            dryRun: Boolean(dryRun),
          }),
        ),
      },
    ],
  }),
);

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
  'execute_action',
  {
    title: '下发单条控制指令(直控)',
    description:
      '★ 直控工具:直接下发**一条**控制指令并等 PLC 回执。' +
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      (contract.paramEnums.mode_set
        ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') + ';'
        // 取得字典或对象中的所有键。
        : '') +
        // 条件不满足时拼接空字符串，然后继续组装提示文本。
      (contract.paramEnums.conveyor
        ? 'conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') + ';'
        // 取得字典或对象中的所有键。
        : '') +
        // 条件不满足时拼接空字符串，然后继续组装提示文本。
      '「启动产线」用 type=start;「停止」用 type=stop;' +
      '「获取手动」type=mode_set,params.action=acquire;' +
      '「释放手动」type=mode_set,params.action=release;' +
      '「传送带正转/停止」type=conveyor,params.action=forward|stop。' +
      '除非用户明确要单步,否则优先用 run_operation —— 它会按正确的顺序执行。',
    inputSchema: {
      lineId: z.string().default('line-01'),
      deviceId: z.string().default('robot-01'),
      type: z.enum(contract.executableTypes),
      params: z.record(z.unknown()).optional(),
      operator: z.string().optional(),
      dryRun: z.boolean().default(false),
    },
  },
  async ({ lineId, deviceId, type, params, operator, dryRun }) => {
    const enums = contract.paramEnums[type];
    if (enums) {
      const action = (params || {}).action;
      if (typeof action !== 'string' || !(action in enums)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: false,
                error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
              }),
            },
          ],
        };
      }
    }
    if (dryRun) {
      const state = await currentState(lineId || 'line-01');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: true,
              dryRun: true,
              type,
              params: params || {},
              stateBefore: state,
              precondition: preconditionError(type, (params || {}).action, state),
              // 根据当前现场状态生成不满足操作前提的说明。
              note: 'dryRun:只预演,没有下发任何指令',
            }),
          },
        ],
      };
    }
    const step = await execStep({
      lineId: lineId || 'line-01',
      deviceId: deviceId || 'robot-01',
      type,
      params: params || {},
      operator: operator || 'ai:line-twin',
    });
    return { content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] };
  },
);

// Hermes 启动本进程后，在这里用 StdioServerTransport 连接已注册的 MCP 工具。
// 标准输入输出承载协议数据；诊断日志用 stderr，不把此传输解释为另一个 TCP 服务。
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // 把 MCP 服务连接到标准输入输出管道，供启动本进程的 Hermes 调用工具；这里不建立 TCP 服务端口。
  log(`已启动;proposal 频道=${PROPOSAL_CHANNEL},ttl=${PROPOSAL_TTL_SEC}s`);
}

main().catch((e) => {
  log('致命错误:', e && e.stack ? e.stack : e);
  process.exit(1);
});
