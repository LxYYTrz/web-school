#!/usr/bin/env node
'use strict';

/**
 * line-twin 只读 MCP server —— 供 hermes agent 查询产线数据 / 校验并提交控制建议。
 *
 * ⚠️ 安全边界(选「hermes 装在工控机」方案的核心前提):
 *   本文件里**没有任何** MQTT 客户端、没有任何 Modbus 代码、没有 shell / 文件写入。
 *   4 个查询工具只读 Redis / Postgres;propose_action 只做白名单校验 + 落 Redis + 发
 *   Redis 通知,由 NestJS 推送成 UI 建议卡片。真正下发指令的唯一路径是:
 *   人在 UI 点确认 → POST /api/ai/proposals/:id/confirm → CommandService.issue()。
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
  { name: 'line-twin', version: '1.0.0' },
  {
    capabilities: { tools: {} },
    instructions:
      '这是产线(line-01)的只读数据源与控制建议通道。' +
      '可以查询实时快照、历史状态、报警事件、视觉检测统计。' +
      '需要改变产线状态时,必须调用 propose_action 提交建议 —— ' +
      '它不会自动执行,会生成一条待人工确认的卡片。' +
      '不要凭空猜测状态:任何结论都应先调用工具查证。',
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

async function getVisionStats(lineCode, hours) {
  const line = await resolveLine(lineCode);
  const { rows } = await pool.query(
    `SELECT result, count(*)::int AS n
       FROM vision_images
      WHERE line_id = $1 AND captured_at > now() - ($2 || ' hours')::interval
      GROUP BY result`,
    [line.id, String(hours)],
  );
  const stat = { ok: 0, ng: 0 };
  for (const r of rows) stat[r.result] = r.n;
  const total = stat.ok + stat.ng;
  return {
    lineId: line.code,
    hours,
    ok: stat.ok,
    ng: stat.ng,
    total,
    ngRate: total ? Math.round((stat.ng / total) * 10000) / 100 : null,
    note: total === 0 ? '该时间窗内没有任何视觉检测记录,无法计算不良率(不代表不良率为 0)' : undefined,
  };
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
  'get_vision_stats',
  {
    title: '视觉检测统计',
    description: '统计指定时间窗内的视觉检测 OK/NG 数量与 NG 率,用于回答「不良率是多少」。',
    inputSchema: {
      lineId: z.string(),
      hours: z.number().int().min(1).max(168).default(24),
    },
    annotations: READ_ONLY,
  },
  async ({ lineId, hours }) => ({
    content: [{ type: 'text', text: JSON.stringify(await getVisionStats(lineId, hours ?? 24)) }],
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
