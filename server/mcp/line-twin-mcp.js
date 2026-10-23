#!/usr/bin/env node
'use strict';

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
const fs = require('fs');
const crypto = require('crypto');

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

// 提案落 Redis 的 TTL。够人看完一条回复并点确认,又不至于隔夜复活。
const PROPOSAL_TTL_SEC = 900;
const PROPOSAL_CHANNEL = 'ai:proposal';

function log(...args) {
  // 只走 stderr —— stdout 是 MCP 传输通道
  process.stderr.write('[line-twin-mcp] ' + args.join(' ') + '\n');
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

const server = new McpServer(
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

// ---------------------------------------------------------------------------
// 工具实现
// ---------------------------------------------------------------------------

/**
 * 实时快照。数据在 Redis,各 key 带 TTL —— 这是「数据新鲜度」信号,不是「设备在线」信号:
 *   status null  → 超过 120s 没收到产线状态帧
 *   edge   null  → 超过 300s 没收到 edge 心跳
 *   robots[x] null→ 该机器人超过 60s 没数据
 * 空闲产线的这些值本来就会是 null,不要解读成「故障」。
 */
async function getLineSnapshot(lineId) {
  const [status, edge] = await redis.mget(`rt:${lineId}:status`, `rt:${lineId}:edge`);
  const keys = await redis.keys(`rt:${lineId}:robot:*`);
  const frames = keys.length ? await redis.mget(keys) : [];
  const robots = {};
  keys.forEach((k, i) => {
    const deviceId = k.split(':').pop();
    robots[deviceId] = frames[i] ? JSON.parse(frames[i]) : null;
  });

  const state = status ? JSON.parse(status) : null;
  const edgeState = edge ? JSON.parse(edge) : null;
  return {
    lineId,
    readAt: Date.now(),
    status: state,
    edge: edgeState,
    robots,
    freshness: {
      statusMs: state ? Date.now() - (state.ts ?? 0) : null,
      edgeMs: edgeState ? Date.now() - (edgeState.ts ?? 0) : null,
      note: 'null 表示该数据已超过 TTL 未更新(空闲产线属正常),不等于设备离线',
    },
  };
}

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

/**
 * 提交一条控制建议 —— **只校验和登记,绝不执行**。
 *
 * 故意不实现任何下发逻辑:下发权只在人手里。若本函数出现 MQTT/网络写操作,
 * 「AI 永不自动控制设备」这条不变式就破了。
 */
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
    lineId,
    deviceId,
    type,
    params: params || {},
    reason,
    status: 'pending',
    createdAt: Date.now(),
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

/** 调后端机器通道下发一条指令 */
async function machineIssue({ lineId, deviceId, type, params, operator }) {
  if (!machineChannelReady()) {
    return { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' };
  }
  let res;
  try {
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

/**
 * 等回执。edge 写完 PLC 会 publish cmd_ack,后端把 control_commands.status
 * 更新成 acked/rejected/failed。这里直接读表,不另开通道。
 */
async function waitAck(cmdId, timeoutMs = ACK_WAIT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { rows } = await pool.query(
      `SELECT status, ack_payload, acked_at FROM control_commands WHERE idempotency_key = $1`,
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
  }
  return { status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null };
}

/** 读当前产线状态字符串(waiting_feed / stopped / manual_mode / init_error ...) */
async function currentState(lineId) {
  const raw = await redis.get(`rt:${lineId}:status`);
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.state ?? null;
  } catch {
    return null;
  }
}

/** 等产线状态变成期望值之一 */
async function waitState(lineId, wanted, timeoutMs = STATE_WAIT_MS) {
  const list = Array.isArray(wanted) ? wanted : [wanted];
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await currentState(lineId);
    if (last && list.includes(last)) return { reached: true, state: last };
    await sleep(500);
  }
  return { reached: false, state: last };
}

/**
 * 前置条件校验(契约 §4.6 的 PLC 状态机)。
 * 返回 null = 可以执行;返回字符串 = 不能执行的原因。
 */
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
}

/**
 * 执行一步:校验 → 下发 → 等回执 → (可选)等状态到位。
 */
async function execStep({ lineId, deviceId, type, params, operator, waitFor, skipPrecondition }) {
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
        lineId, deviceId, type: 'mode_set', params: { action: 'acquire' }, operator, waitFor: 'manual_mode',
      }),
    );
    if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    steps.push(
      await execStep({
        lineId, deviceId, type: 'conveyor', params: { action: 'forward' }, operator,
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
        lineId, deviceId, type: 'conveyor', params: { action: 'stop' }, operator, skipPrecondition: true,
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
          lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped',
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
    );
  }

  const ok = steps.length > 0 && steps.every((s) => s.ok);
  return {
    ok,
    operation: op,
    title: meta.title,
    stateBefore: state0,
    stateAfter: await currentState(lineId),
    steps,
    summary: steps.map((s) => `${s.type}${s.params?.action ? ':' + s.params.action : ''} → ${s.status}`).join(' , '),
  };
}

// ---------------------------------------------------------------------------
// 注册
// ---------------------------------------------------------------------------

const READ_ONLY = { readOnlyHint: true };

server.registerTool(
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
  'propose_action',
  {
    title: '提交控制建议(需人工确认)',
    description:
      '当诊断结论需要改变产线状态时调用本工具提交一条**建议**。' +
      '它只做校验和登记,不会执行 —— 会在值班人界面上生成一张待确认卡片,人工点击后才真正下发。' +
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      (contract.paramEnums.mode_set ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') : '') +
      (contract.paramEnums.conveyor ? ';conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') : '') +
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
  'run_operation',
  {
    title: '执行产线操作(直控)',
    description:
      '★ 直控工具:把一句人话翻译成正确的 PLC 操作序列并**直接执行**,不用人工点确认。' +
      '可用操作:' +
      Object.entries(OPERATIONS)
        .map(([k, v]) => `${k}(${v.title}:${v.desc})`)
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
  'execute_action',
  {
    title: '下发单条控制指令(直控)',
    description:
      '★ 直控工具:直接下发**一条**控制指令并等 PLC 回执。' +
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      (contract.paramEnums.mode_set
        ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') + ';'
        : '') +
      (contract.paramEnums.conveyor
        ? 'conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') + ';'
        : '') +
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

// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(`已启动;proposal 频道=${PROPOSAL_CHANNEL},ttl=${PROPOSAL_TTL_SEC}s`);
}

main().catch((e) => {
  log('致命错误:', e && e.stack ? e.stack : e);
  process.exit(1);
});
