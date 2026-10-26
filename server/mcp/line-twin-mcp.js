#!/usr/bin/env node
// 指定运行这个脚本时使用的解释器。
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
// 声明 path，初始值由 require('path') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const fs = require('fs');
// 声明 fs，初始值由 require('fs') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const crypto = require('crypto');
// 声明 crypto，初始值由 require('crypto') 计算得到。 关键字：const＝声明不可重新绑定的变量。

// 复用后端的 node_modules 与 .env,不重复维护一份连接配置
const SERVER_ROOT = path.resolve(__dirname, '..');
// 声明 SERVER_ROOT，初始值由 path.resolve(__dirname, '..') 计算得到。 关键字：const＝声明不可重新绑定的变量。
require(path.join(SERVER_ROOT, 'node_modules', 'dotenv')).config({
// 调用 require；括号中的表达式是传入的参数。
  path: path.join(SERVER_ROOT, '.env'),
  // 设置字段 path。
});
// 结束当前回调或对象，并完成外层函数调用。

const { McpServer } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/mcp.js'));
// 从右侧结果中取出 McpServer，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。
const { StdioServerTransport } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/stdio.js'));
// 从右侧结果中取出 StdioServerTransport，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。
const { z } = require(path.join(SERVER_ROOT, 'node_modules', 'zod'));
// 从右侧结果中取出 z，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。
const { Pool } = require(path.join(SERVER_ROOT, 'node_modules', 'pg'));
// 从右侧结果中取出 Pool，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。
const Redis = require(path.join(SERVER_ROOT, 'node_modules', 'ioredis'));
// 声明 Redis，初始值由 require(path.join(SERVER_ROOT, 'node_modules', 'ioredis')) 计算得到。 关键字：const＝声明不可重新绑定的变量。

// 指令白名单:与后端 CommandService 共读同一份 command-contract.json,
// 避免「AI 认为可执行的」与「系统真正放行的」出现漂移
const contract = require(path.join(SERVER_ROOT, 'src', 'command', 'command-contract.json'));
// 声明 contract，初始值由 require(path.join(SERVER_ROOT, 'src', 'command', 'command-contract.json')) 计算得到。 关键字：const＝声明不可重新绑定的变量。

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// 声明 REDIS_URL，初始值由 process.env.REDIS_URL || 'redis://localhost:6379' 计算得到。 关键字：const＝声明不可重新绑定的变量。
const DATABASE_URL =
// 声明 DATABASE_URL，初始值由  计算得到。 关键字：const＝声明不可重新绑定的变量。
  process.env.DATABASE_URL || 'postgres://postgres:postgres123@localhost:5432/linetwin';
  // 读取指定环境变量；若未设置则使用右侧默认值。

// 提案落 Redis 的 TTL。够人看完一条回复并点确认,又不至于隔夜复活。
const PROPOSAL_TTL_SEC = 900;
// 声明 PROPOSAL_TTL_SEC，初始值由 900 计算得到。 关键字：const＝声明不可重新绑定的变量。
const PROPOSAL_CHANNEL = 'ai:proposal';
// 声明 PROPOSAL_CHANNEL，初始值由 'ai:proposal' 计算得到。 关键字：const＝声明不可重新绑定的变量。

function log(...args) {
// 定义函数 log。 关键字：function＝定义函数。
  // 只走 stderr —— stdout 是 MCP 传输通道
  process.stderr.write('[line-twin-mcp] ' + args.join(' ') + '\n');
  // 调用 process.stderr.write，把括号中的值作为参数传入。
}
// 结束当前对象、函数或条件代码块。

const pool = new Pool({ connectionString: DATABASE_URL });
// 声明 pool，初始值由 new Pool({ connectionString: DATABASE_URL }) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
const redis = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
// 声明 redis，初始值由 new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 }) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例；false＝布尔假值。
redis.on('error', (e) => log('redis error:', e.message));
// 调用 redis.on，把括号中的值作为参数传入。

// 编码 → BIGINT 主键的转换。
// Redis 侧的 key 用的是字符串编码('line-01'),可以直接拼;
// 但 Postgres 侧所有业务表的 line_id 都是 bigint 外键,必须先查 production_lines
// 换成 id。漏掉这一步会让每个 PG 查询都报
// 「无效的 bigint 输入语法 "line-01"」。后端 CatalogService 做的是同一件事。
const lineIdCache = new Map(); // code -> { id, name } | null,60s 过期(对齐 CatalogService)
// 声明 lineIdCache，初始值由 new Map(); // code -> { id, name } | null,60s 过期(对齐 CatalogService) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
async function resolveLine(code) {
// 定义函数 resolveLine。 关键字：async＝声明异步函数；function＝定义函数。
  const hit = lineIdCache.get(code);
  // 声明 hit，初始值由 lineIdCache.get(code) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (hit && Date.now() - hit.at < 60000) return hit.row;
  // 判断 if (hit && Date.now() - hit.at < 60000) return hit.row; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  const { rows } = await pool.query(
  // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    'SELECT id, code, name FROM production_lines WHERE code = $1 LIMIT 1', [code]);
    // 提供 SQL 语句，读取表 production_lines 中的数据；实际参数由外层查询调用传入。
  lineIdCache.set(code, { at: Date.now(), row: rows[0] || null });
  // 调用 lineIdCache.set，把括号中的值作为参数传入。 关键字：null＝空值。
  if (!rows[0]) {
  // 判断 if (!rows[0]) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    const { rows: all } = await pool.query('SELECT code FROM production_lines ORDER BY id');
    // 从右侧结果中取出 rows: all，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    throw new Error(`未知产线编码 ${code}。可用:${all.map((r) => r.code).join('|') || '(库中没有任何产线)'}`);
    // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
  }
  // 结束当前对象、函数或条件代码块。
  return rows[0];
  // 返回 rows[0] 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

const server = new McpServer(
// 声明 server，初始值由 new McpServer( 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  { name: 'line-twin', version: '1.1.0' },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  {
  // 开始一个对象字面量，后续行逐项填写字段。
    capabilities: { tools: {} },
    // 设置字段 capabilities。
    instructions:
    // 设置字段 instructions。
      '这是产线(line-01)的数据源与控制通道,分两类工具:' +
      // 把这一段文字与下一段拼接。
      '【查询类(只读)】get_line_snapshot / get_line_history / get_recent_events;' +
      // 把这一段文字与下一段拼接。
      '【控制类】run_operation / execute_action(直控,直接下发不等人工确认)、' +
      // 把这一段文字与下一段拼接。
      'propose_action(只提交建议,等人点确认)。' +
      // 把这一段文字与下一段拼接。
      '★ 选哪条路,取决于你所在的通道:' +
      // 把这一段文字与下一段拼接。
      '  · 你在飞书/Lark 里(系统提示说你在 Feishu 工作区,用户在跟你直接对话)→ ' +
      // 把这一段文字与下一段拼接。
      '    用 run_operation 直控。用户说「传送带启动|传送带运行|手动跑一下传送带」→ conveyor_start;' +
      // 把这一段文字与下一段拼接。
      '    「传送带停止」→ conveyor_stop;「启动产线|开始生产|开工」→ line_start;' +
      // 把这一段文字与下一段拼接。
      '    「停止产线|停机」→ line_stop;「释放手动|退出手动」→ release_manual。' +
      // 把这一段文字与下一段拼接。
      '  · 你在网页抽屉里(系统提示说明该通道只允许提交建议)→ 用 propose_action,不要用直控工具。' +
      // 把这一段文字与下一段拼接。
      'run_operation 内部会按 PLC 联锁要求的顺序执行(传送带必须:停止 → 获取手动 → 正转),' +
      // 把这一段文字与下一段拼接。
      '并逐步返回回执。' +
      // 把这一段文字与下一段拼接。
      '不要凭空猜测状态:任何结论都应先调用工具查证;执行结果要如实汇报,rejected/timeout 不许说成成功。',
      // 把这一段文字作为当前调用、数组或对象的值。
  },
  // 结束当前对象或代码块，并完成这条语句。
);
// 结束当前函数的参数列表并完成调用。

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
// 定义函数 getLineSnapshot。 关键字：async＝声明异步函数；function＝定义函数。
  const [status, edge] = await redis.mget(`rt:${lineId}:status`, `rt:${lineId}:edge`);
  // 调用 redis.mget；括号中的表达式是传入的参数。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  const keys = await redis.keys(`rt:${lineId}:robot:*`);
  // 声明 keys，初始值由 await redis.keys(rt:${lineId}:robot:*) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  const frames = keys.length ? await redis.mget(keys) : [];
  // 声明 frames，初始值由 keys.length ? await redis.mget(keys) : [] 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  const robots = {};
  // 声明 robots，初始值由 {} 计算得到。 关键字：const＝声明不可重新绑定的变量。
  keys.forEach((k, i) => {
  // 调用 keys.forEach，把括号中的值作为参数传入。
    const deviceId = k.split(':').pop();
    // 声明 deviceId，初始值由 k.split(':').pop() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    robots[deviceId] = frames[i] ? JSON.parse(frames[i]) : null;
    // 将 frames[i] ? JSON.parse(frames[i]) : null 的结果写入 robots[deviceId]。 关键字：null＝空值。
  });
  // 结束当前回调或对象，并完成外层函数调用。

  const state = status ? JSON.parse(status) : null;
  // 声明 state，初始值由 status ? JSON.parse(status) : null 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  const edgeState = edge ? JSON.parse(edge) : null;
  // 声明 edgeState，初始值由 edge ? JSON.parse(edge) : null 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  return {
  // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    lineId,
    // 把变量 lineId 作为同名对象字段加入当前对象。
    readAt: Date.now(),
    // 设置字段 readAt。
    status: state,
    // 设置字段 status。
    edge: edgeState,
    // 设置字段 edge。
    robots,
    // 把变量 robots 作为同名对象字段加入当前对象。
    freshness: {
    // 设置字段 freshness。
      statusMs: state ? Date.now() - (state.ts ?? 0) : null,
      // 设置字段 statusMs。 关键字：null＝空值。
      edgeMs: edgeState ? Date.now() - (edgeState.ts ?? 0) : null,
      // 设置字段 edgeMs。 关键字：null＝空值。
      note: 'null 表示该数据已超过 TTL 未更新(空闲产线属正常),不等于设备离线',
      // 设置字段 note。 关键字：null＝空值。
    },
    // 结束当前对象或代码块，并完成这条语句。
  };
  // 结束当前对象或代码块，并完成这条语句。
}
// 结束当前对象、函数或条件代码块。

async function getLineHistory(lineCode, minutes, limit) {
// 定义函数 getLineHistory。 关键字：async＝声明异步函数；function＝定义函数。
  const line = await resolveLine(lineCode);
  // 声明 line，初始值由 await resolveLine(lineCode) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  const { rows } = await pool.query(
  // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    `SELECT time, state, product_code, good_count, ng_count, beat_ms
    // 读取数据。 关键字：SELECT＝读取指定列。
       FROM line_status_history
       // 指定读取来源表。 关键字：FROM＝指定查询来源表。
      WHERE line_id = $1 AND "time" > now() - ($2 || ' minutes')::interval
      // 限定处理范围。 关键字：WHERE＝限定目标行；AND＝逻辑与。
      ORDER BY "time" DESC
      // 指定结果排序。 关键字：ORDER＝指定排序；BY＝指定分组或排序字段。
      LIMIT $3`,
      // 限制结果行数。 关键字：LIMIT＝限制返回行数。
    [line.id, String(minutes), limit],
    // 开始当前表达式的分组或数组内容。
  );
  // 结束当前函数的参数列表并完成调用。
  return { lineId: line.code, lineName: line.name, minutes, count: rows.length, rows };
  // 返回 { lineId: line.code, lineName: line.name, minutes, count: rows.length, rows } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

async function getRecentEvents(lineCode, hours, onlyProblems, limit) {
// 定义函数 getRecentEvents。 关键字：async＝声明异步函数；function＝定义函数。
  // 只给索引能覆盖的量;robot_joint_states 是 5-10Hz 的高频表,一律不直查
  const line = await resolveLine(lineCode);
  // 声明 line，初始值由 await resolveLine(lineCode) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  const { rows } = await pool.query(
  // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    `SELECT time, device_id, type, level, code, message, payload
    // 读取数据。 关键字：SELECT＝读取指定列。
       FROM production_events
       // 指定读取来源表。 关键字：FROM＝指定查询来源表。
      WHERE line_id = $1
      // 限定处理范围。 关键字：WHERE＝限定目标行。
        AND "time" > now() - ($2 || ' hours')::interval
        // 叠加筛选条件。 关键字：AND＝逻辑与。
        AND ($3::boolean IS NOT TRUE OR level IN ('warning','critical'))
        // 叠加筛选条件。 关键字：AND＝逻辑与；IS＝检查空值或布尔值；NOT＝逻辑否定；OR＝逻辑或；IN＝检查是否属于集合。
      ORDER BY "time" DESC
      // 指定结果排序。 关键字：ORDER＝指定排序；BY＝指定分组或排序字段。
      LIMIT $4`,
      // 限制结果行数。 关键字：LIMIT＝限制返回行数。
    [line.id, String(hours), onlyProblems, limit],
    // 开始当前表达式的分组或数组内容。
  );
  // 结束当前函数的参数列表并完成调用。
  return { lineId: line.code, hours, onlyProblems, count: rows.length, rows };
  // 返回 { lineId: line.code, hours, onlyProblems, count: rows.length, rows } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/**
 * 提交一条控制建议 —— **只校验和登记,绝不执行**。
 *
 * 故意不实现任何下发逻辑:下发权只在人手里。若本函数出现 MQTT/网络写操作,
 * 「AI 永不自动控制设备」这条不变式就破了。
 */
async function proposeAction(lineId, deviceId, type, params, reason) {
// 定义函数 proposeAction。 关键字：async＝声明异步函数；function＝定义函数。
  if (!contract.allowedTypes.includes(type)) {
  // 判断 if (!contract.allowedTypes.includes(type)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return {
    // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
      ok: false,
      // 设置字段 ok。 关键字：false＝布尔假值。
      error: `type 不在白名单。可选:${contract.allowedTypes.join('|')}`,
      // 设置字段 error。 关键字：type＝定义类型别名。
    };
    // 结束当前对象或代码块，并完成这条语句。
  }
  // 结束当前对象、函数或条件代码块。
  // 只推荐现场真有寄存器、能真正下发的指令;
  // reset/changeover/alarm_clear 在这台 PLC 上没有对应寄存器,提了也必然被拒
  if (!contract.executableTypes.includes(type)) {
  // 判断 if (!contract.executableTypes.includes(type)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return {
    // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
      ok: false,
      // 设置字段 ok。 关键字：false＝布尔假值。
      error: `${type} 在现场 PLC 无对应寄存器,edge 一定会回 rejected,不要建议该指令。可执行:${contract.executableTypes.join('|')}`,
      // 设置字段 error。 关键字：type＝定义类型别名。
    };
    // 结束当前对象或代码块，并完成这条语句。
  }
  // 结束当前对象、函数或条件代码块。

  const enums = contract.paramEnums[type];
  // 声明 enums，初始值由 contract.paramEnums[type] 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (enums) {
  // 判断 if (enums) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    const action = (params || {}).action;
    // 声明 action，初始值由 (params || {}).action 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (typeof action !== 'string' || !(action in enums)) {
    // 判断 if (typeof action !== 'string' || !(action in enums)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型；in＝遍历键或判断成员。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        ok: false,
        // 设置字段 ok。 关键字：false＝布尔假值。
        error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
        // 设置字段 error。 关键字：type＝定义类型别名。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  const proposal = {
  // 声明 proposal，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
    id: 'p-' + crypto.randomUUID(),
    // 设置字段 id。
    lineId,
    // 把变量 lineId 作为同名对象字段加入当前对象。
    deviceId,
    // 把变量 deviceId 作为同名对象字段加入当前对象。
    type,
    // 把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
    params: params || {},
    // 设置字段 params。
    reason,
    // 把变量 reason 作为同名对象字段加入当前对象。
    status: 'pending',
    // 设置字段 status。
    createdAt: Date.now(),
    // 设置字段 createdAt。
  };
  // 结束当前对象或代码块，并完成这条语句。

  await redis.set(`ai:proposal:${proposal.id}`, JSON.stringify(proposal), 'EX', PROPOSAL_TTL_SEC);
  // 调用 redis.set，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  // 通知 NestJS 推送成 UI 卡片。pubsub 断线不影响提案本身 —— 它已经在 Redis 里了
  await redis.publish(PROPOSAL_CHANNEL, JSON.stringify(proposal));
  // 调用 redis.publish，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。

  return {
  // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    ok: true,
    // 设置字段 ok。 关键字：true＝布尔真值。
    proposalId: proposal.id,
    // 设置字段 proposalId。
    instruction:
    // 设置字段 instruction。
      '建议已提交,会由值班人在 UI 上人工确认后才会真正下发。' +
      // 把这一段文字与下一段拼接。
      '请在回复里说明这条建议的理由和预期影响,不要声称已经执行。',
      // 把这一段文字作为当前调用、数组或对象的值。
  };
  // 结束当前对象或代码块，并完成这条语句。
}
// 结束当前对象、函数或条件代码块。

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
// 声明 MACHINE_TOKEN，初始值由 process.env.MACHINE_COMMAND_TOKEN || '' 计算得到。 关键字：const＝声明不可重新绑定的变量。
const API_BASE = (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '');
// 声明 API_BASE，初始值由 (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '') 计算得到。 关键字：const＝声明不可重新绑定的变量。
// 契约 §5:15s 无回执置 timeout。MCP 侧等 15s 略多一点(留网络余量)。
const ACK_WAIT_MS = Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000);
// 声明 ACK_WAIT_MS，初始值由 Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000) 计算得到。 关键字：const＝声明不可重新绑定的变量。
// 等 PLC 状态切换的时限(停止 → stopped、获取手动 → manual_mode)
const STATE_WAIT_MS = Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000);
// 声明 STATE_WAIT_MS，初始值由 Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000) 计算得到。 关键字：const＝声明不可重新绑定的变量。

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 声明 sleep，初始值由 (ms) => new Promise((r) => setTimeout(r, ms)) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。

/** 机器通道是否可用 */
function machineChannelReady() {
// 定义函数 machineChannelReady。 关键字：function＝定义函数。
  return Boolean(MACHINE_TOKEN);
  // 返回 Boolean(MACHINE_TOKEN) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 调后端机器通道下发一条指令 */
async function machineIssue({ lineId, deviceId, type, params, operator }) {
// 定义函数 machineIssue。 关键字：async＝声明异步函数；function＝定义函数。
  if (!machineChannelReady()) {
  // 判断 if (!machineChannelReady()) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' };
    // 返回 { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
  let res;
  // 声明可重新赋值的变量 res，稍后再赋值。 关键字：let＝声明可重新赋值的变量。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    res = await fetch(`${API_BASE}/api/machine/commands`, {
    // 把右侧表达式的结果写入 res。 关键字：await＝等待异步操作完成。
      method: 'POST',
      // 设置字段 method。
      headers: { 'Content-Type': 'application/json', 'x-machine-token': MACHINE_TOKEN },
      // 设置字段 headers。
      body: JSON.stringify({ lineId, deviceId, type, params: params || {}, operator }),
      // 设置字段 body。 关键字：type＝定义类型别名。
    });
    // 结束当前回调或对象，并完成外层函数调用。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    return { ok: false, error: `调用后端失败:${e.message}` };
    // 返回 { ok: false, error: 调用后端失败:${e.message} } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
  const body = await res.json().catch(() => ({}));
  // 声明 body，初始值由 await res.json().catch(() => ({})) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；catch＝捕获异常。
  if (!res.ok) {
  // 判断 if (!res.ok) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { ok: false, error: body?.msg || body?.message || `后端返回 HTTP ${res.status}` };
    // 返回 { ok: false, error: body?.msg || body?.message || 后端返回 HTTP ${res.status} } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
  if (!body?.ok) {
  // 判断 if (!body?.ok) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { ok: false, error: body?.error || '后端拒绝下发' };
    // 返回 { ok: false, error: body?.error || '后端拒绝下发' } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
  return { ok: true, cmdId: body.cmdId };
  // 返回 { ok: true, cmdId: body.cmdId } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。

/**
 * 等回执。edge 写完 PLC 会 publish cmd_ack,后端把 control_commands.status
 * 更新成 acked/rejected/failed。这里直接读表,不另开通道。
 */
async function waitAck(cmdId, timeoutMs = ACK_WAIT_MS) {
// 定义函数 waitAck。 关键字：async＝声明异步函数；function＝定义函数。
  const deadline = Date.now() + timeoutMs;
  // 声明 deadline，初始值由 Date.now() + timeoutMs 计算得到。 关键字：const＝声明不可重新绑定的变量。
  while (Date.now() < deadline) {
  // 控制分支、循环或异常处理流程。 关键字：while＝按条件重复执行。
    const { rows } = await pool.query(
    // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      `SELECT status, ack_payload, acked_at FROM control_commands WHERE idempotency_key = $1`,
      // 读取数据。
      [cmdId],
      // 开始当前表达式的分组或数组内容。
    );
    // 结束当前函数的参数列表并完成调用。
    const row = rows[0];
    // 声明 row，初始值由 rows[0] 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (row && row.status !== 'pending' && row.status !== 'sent') {
    // 判断 if (row && row.status !== 'pending' && row.status !== 'sent') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        status: row.status,
        // 设置字段 status。
        message: row.ack_payload?.message || '',
        // 设置字段 message。
        ackedAt: row.acked_at,
        // 设置字段 ackedAt。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
    await sleep(400);
    // 调用 sleep，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  }
  // 结束当前对象、函数或条件代码块。
  return { status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null };
  // 返回 { status: 'timeout', message: ${Math.round(timeoutMs / 1000)}s 内没有回执, ackedAt: null } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
}
// 结束当前对象、函数或条件代码块。

/** 读当前产线状态字符串(waiting_feed / stopped / manual_mode / init_error ...) */
async function currentState(lineId) {
// 定义函数 currentState。 关键字：async＝声明异步函数；function＝定义函数。
  const raw = await redis.get(`rt:${lineId}:status`);
  // 声明 raw，初始值由 await redis.get(rt:${lineId}:status) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  if (!raw) return null;
  // 判断 if (!raw) return null; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；null＝空值。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    return JSON.parse(raw)?.state ?? null;
    // 返回 JSON.parse(raw)?.state ?? null 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
  } catch {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    return null;
    // 返回 null 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

/** 等产线状态变成期望值之一 */
async function waitState(lineId, wanted, timeoutMs = STATE_WAIT_MS) {
// 定义函数 waitState。 关键字：async＝声明异步函数；function＝定义函数。
  const list = Array.isArray(wanted) ? wanted : [wanted];
  // 声明 list，初始值由 Array.isArray(wanted) ? wanted : [wanted] 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const deadline = Date.now() + timeoutMs;
  // 声明 deadline，初始值由 Date.now() + timeoutMs 计算得到。 关键字：const＝声明不可重新绑定的变量。
  let last = null;
  // 声明 last，初始值由 null 计算得到。 关键字：let＝声明可重新赋值的变量；null＝空值。
  while (Date.now() < deadline) {
  // 控制分支、循环或异常处理流程。 关键字：while＝按条件重复执行。
    last = await currentState(lineId);
    // 把右侧表达式的结果写入 last。 关键字：await＝等待异步操作完成。
    if (last && list.includes(last)) return { reached: true, state: last };
    // 判断 if (last && list.includes(last)) return { reached: true, state: last }; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；true＝布尔真值。
    await sleep(500);
    // 调用 sleep，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  }
  // 结束当前对象、函数或条件代码块。
  return { reached: false, state: last };
  // 返回 { reached: false, state: last } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
}
// 结束当前对象、函数或条件代码块。

/**
 * 前置条件校验(契约 §4.6 的 PLC 状态机)。
 * 返回 null = 可以执行;返回字符串 = 不能执行的原因。
 */
function preconditionError(type, action, state) {
// 定义函数 preconditionError。 关键字：function＝定义函数。
  if (!state) return '读不到当前产线状态(快照为空),拒绝盲发指令';
  // 判断 if (!state) return '读不到当前产线状态(快照为空),拒绝盲发指令'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  if (state === 'init_error') {
  // 判断 if (state === 'init_error') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return '产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位';
    // 返回 '产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  if (type === 'mode_set') {
  // 判断 if (type === 'mode_set') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    if (action === 'acquire') {
    // 判断 if (action === 'acquire') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return state === 'stopped' ? null : `获取手动模式只能在 stopped 状态执行,当前是 ${state}`;
      // 返回 state === 'stopped' ? null : 获取手动模式只能在 stopped 状态执行,当前是 ${state} 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
    }
    // 结束当前对象、函数或条件代码块。
    if (action === 'release') {
    // 判断 if (action === 'release') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return state === 'manual_mode' ? null : `释放手动只能在 manual_mode 状态执行,当前是 ${state}`;
      // 返回 state === 'manual_mode' ? null : 释放手动只能在 manual_mode 状态执行,当前是 ${state} 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
  if (type === 'conveyor') {
  // 判断 if (type === 'conveyor') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return state === 'manual_mode' ? null : `传送带只能在手动模式(manual_mode)下运行,当前是 ${state}`;
    // 返回 state === 'manual_mode' ? null : 传送带只能在手动模式(manual_mode)下运行,当前是 ${state} 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
  }
  // 结束当前对象、函数或条件代码块。
  if (type === 'start') {
  // 判断 if (type === 'start') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    if (state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)';
    // 判断 if (state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  return null;
  // 返回 null 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
}
// 结束当前对象、函数或条件代码块。

/**
 * 执行一步:校验 → 下发 → 等回执 → (可选)等状态到位。
 */
async function execStep({ lineId, deviceId, type, params, operator, waitFor, skipPrecondition }) {
// 定义函数 execStep。 关键字：async＝声明异步函数；function＝定义函数。
  const action = params?.action;
  // 声明 action，初始值由 params?.action 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const before = await currentState(lineId);
  // 声明 before，初始值由 await currentState(lineId) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  if (!skipPrecondition) {
  // 判断 if (!skipPrecondition) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    const bad = preconditionError(type, action, before);
    // 声明 bad，初始值由 preconditionError(type, action, before) 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (bad) {
    // 判断 if (bad) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return { type, params: params || {}, ok: false, status: 'skipped', message: bad, stateBefore: before };
      // 返回 { type, params: params || {}, ok: false, status: 'skipped', message: bad, stateBefore: before } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
  const issued = await machineIssue({ lineId, deviceId, type, params, operator });
  // 声明 issued，初始值由 await machineIssue({ lineId, deviceId, type, params, operator }) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  if (!issued.ok) {
  // 判断 if (!issued.ok) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { type, params: params || {}, ok: false, status: 'failed', message: issued.error, stateBefore: before };
    // 返回 { type, params: params || {}, ok: false, status: 'failed', message: issued.error, stateBefore: before } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
  const ack = await waitAck(issued.cmdId);
  // 声明 ack，初始值由 await waitAck(issued.cmdId) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  const step = {
  // 声明 step，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
    type,
    // 把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
    params: params || {},
    // 设置字段 params。
    cmdId: issued.cmdId,
    // 设置字段 cmdId。
    ok: ack.status === 'acked',
    // 设置字段 ok。
    status: ack.status,
    // 设置字段 status。
    message: ack.message,
    // 设置字段 message。
    stateBefore: before,
    // 设置字段 stateBefore。
  };
  // 结束当前对象或代码块，并完成这条语句。
  if (waitFor && step.ok) {
  // 判断 if (waitFor && step.ok) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    const st = await waitState(lineId, waitFor);
    // 声明 st，初始值由 await waitState(lineId, waitFor) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    step.stateAfter = st.state;
    // 把右侧表达式的结果写入 step.stateAfter。
    step.stateReached = st.reached;
    // 把右侧表达式的结果写入 step.stateReached。
    if (!st.reached) {
    // 判断 if (!st.reached) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      step.ok = false;
      // 把右侧表达式的结果写入 step.ok。 关键字：false＝布尔假值。
      step.message = `指令已下发并回执,但产线状态没有变成 ${waitFor}(当前 ${st.state})`;
      // 把右侧表达式的结果写入 step.message。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
  return step;
  // 返回 step 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/**
 * 组合操作:把「一次人话指令」翻译成正确的 PLC 操作序列。
 *
 * conveyor_start 的序列来自现场联锁(CLAUDE.md §4.6):
 *   停止 → 等 stopped → 获取手动模式 → 等 manual_mode → 传送带正转
 * 只在手动模式下传送带才允许动作,直接发 conveyor 会被 PLC 拒绝,
 * 所以「先停止再获取手动」不是多余的步骤,是必须的。
 */
const OPERATIONS = {
// 声明 OPERATIONS，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  conveyor_start: {
  // 设置字段 conveyor_start。
    title: '传送带正转',
    // 设置字段 title。
    desc: '按「停止 → 获取手动模式 → 传送带正转」三步执行(PLC 只允许手动模式下动传送带)',
    // 设置字段 desc。
  },
  // 结束当前对象或代码块，并完成这条语句。
  conveyor_stop: { title: '停止传送带', desc: '传送带停止(电平型,写 0)' },
  // 设置字段 conveyor_stop。
  line_start: { title: '启动产线', desc: '必要时先释放手动模式,再启动' },
  // 设置字段 line_start。
  line_stop: { title: '停止产线', desc: '停止信号' },
  // 设置字段 line_stop。
  release_manual: { title: '释放手动模式', desc: '退出手动模式,回到 stopped' },
  // 设置字段 release_manual。
};
// 结束当前对象或代码块，并完成这条语句。

async function runOperation(op, { lineId, deviceId, operator, dryRun }) {
// 定义函数 runOperation。 关键字：async＝声明异步函数；function＝定义函数。
  const meta = OPERATIONS[op];
  // 声明 meta，初始值由 OPERATIONS[op] 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (!meta) {
  // 判断 if (!meta) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { ok: false, error: `未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('|')}` };
    // 返回 { ok: false, error: 未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('|')} } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
  const state0 = await currentState(lineId);
  // 声明 state0，初始值由 await currentState(lineId) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  const steps = [];
  // 声明 steps，初始值由 [] 计算得到。 关键字：const＝声明不可重新绑定的变量。

  if (op === 'conveyor_start') {
  // 判断 if (op === 'conveyor_start') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    if (dryRun) {
    // 判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      steps.push({ type: 'stop', params: {} });
      // 调用 steps.push，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
      steps.push({ type: 'mode_set', params: { action: 'acquire' } });
      // 调用 steps.push，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
      steps.push({ type: 'conveyor', params: { action: 'forward' } });
      // 调用 steps.push，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
      return { ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps };
      // 返回 { ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
    }
    // 结束当前对象、函数或条件代码块。
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, waitFor: 'stopped' }));
    // 调用 steps.push，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
    if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    // 判断 if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps }; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。
    steps.push(
    // 调用 steps.push，把括号中的值作为参数传入。
      await execStep({
      // 调用 execStep，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
        lineId, deviceId, type: 'mode_set', params: { action: 'acquire' }, operator, waitFor: 'manual_mode',
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：type＝定义类型别名。
      }),
      // 结束当前回调或对象，并完成外层函数调用。
    );
    // 结束当前函数的参数列表并完成调用。
    if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    // 判断 if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps }; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。
    steps.push(
    // 调用 steps.push，把括号中的值作为参数传入。
      await execStep({
      // 调用 execStep，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
        lineId, deviceId, type: 'conveyor', params: { action: 'forward' }, operator,
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：type＝定义类型别名。
      }),
      // 结束当前回调或对象，并完成外层函数调用。
    );
    // 结束当前函数的参数列表并完成调用。
  } else if (op === 'conveyor_stop') {
  // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
    if (dryRun) {
    // 判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 设置字段 ok。 关键字：true＝布尔真值。
        planned: [{ type: 'conveyor', params: { action: 'stop' } }],
        // 设置字段 planned。 关键字：type＝定义类型别名。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
    // 传送带停止是电平写 0,不受「必须在手动模式」限制 → 跳过前置校验
    steps.push(
    // 调用 steps.push，把括号中的值作为参数传入。
      await execStep({
      // 调用 execStep，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
        lineId, deviceId, type: 'conveyor', params: { action: 'stop' }, operator, skipPrecondition: true,
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：true＝布尔真值。
      }),
      // 结束当前回调或对象，并完成外层函数调用。
    );
    // 结束当前函数的参数列表并完成调用。
  } else if (op === 'line_start') {
  // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
    if (dryRun) {
    // 判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 设置字段 ok。 关键字：true＝布尔真值。
        planned: [
        // 设置字段 planned。
          ...(state0 === 'manual_mode' ? [{ type: 'mode_set', params: { action: 'release' } }] : []),
          // 调用 ...，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
          { type: 'start', params: {} },
          // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
        ],
        // 结束当前数组，继续外层表达式。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
    if (state0 === 'manual_mode') {
    // 判断 if (state0 === 'manual_mode') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      steps.push(
      // 调用 steps.push，把括号中的值作为参数传入。
        await execStep({
        // 调用 execStep，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
          lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped',
          // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：type＝定义类型别名。
        }),
        // 结束当前回调或对象，并完成外层函数调用。
      );
      // 结束当前函数的参数列表并完成调用。
      if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
      // 判断 if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps }; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。
    }
    // 结束当前对象、函数或条件代码块。
    steps.push(await execStep({ lineId, deviceId, type: 'start', params: {}, operator }));
    // 调用 steps.push，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  } else if (op === 'line_stop') {
  // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
    if (dryRun) {
    // 判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 设置字段 ok。 关键字：true＝布尔真值。
        planned: [{ type: 'stop', params: {} }],
        // 设置字段 planned。 关键字：type＝定义类型别名。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, skipPrecondition: true }));
    // 调用 steps.push，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成；true＝布尔真值。
  } else if (op === 'release_manual') {
  // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
    if (dryRun) {
    // 判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 设置字段 ok。 关键字：true＝布尔真值。
        planned: [{ type: 'mode_set', params: { action: 'release' } }],
        // 设置字段 planned。 关键字：type＝定义类型别名。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
    steps.push(
    // 调用 steps.push，把括号中的值作为参数传入。
      await execStep({ lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped' }),
      // 调用 execStep，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
    );
    // 结束当前函数的参数列表并完成调用。
  }
  // 结束当前对象、函数或条件代码块。

  const ok = steps.length > 0 && steps.every((s) => s.ok);
  // 声明 ok，初始值由 steps.length > 0 && steps.every((s) => s.ok) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  return {
  // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    ok,
    // 把变量 ok 作为同名对象字段加入当前对象。
    operation: op,
    // 设置字段 operation。
    title: meta.title,
    // 设置字段 title。
    stateBefore: state0,
    // 设置字段 stateBefore。
    stateAfter: await currentState(lineId),
    // 设置字段 stateAfter。 关键字：await＝等待异步操作完成。
    steps,
    // 把变量 steps 作为同名对象字段加入当前对象。
    summary: steps.map((s) => `${s.type}${s.params?.action ? ':' + s.params.action : ''} → ${s.status}`).join(' , '),
    // 设置字段 summary。 关键字：type＝定义类型别名。
  };
  // 结束当前对象或代码块，并完成这条语句。
}
// 结束当前对象、函数或条件代码块。

// ---------------------------------------------------------------------------
// 注册
// ---------------------------------------------------------------------------

const READ_ONLY = { readOnlyHint: true };
// 声明 READ_ONLY，初始值由 { readOnlyHint: true } 计算得到。 关键字：const＝声明不可重新绑定的变量；true＝布尔真值。

server.registerTool(
// 调用 server.registerTool，把括号中的值作为参数传入。
  'get_line_snapshot',
  // 把这一段文字作为当前调用、数组或对象的值。
  {
  // 开始一个对象字面量，后续行逐项填写字段。
    title: '产线实时快照',
    // 设置字段 title。
    description:
    // 设置字段 description。
      '读取产线当前实时状态:产线状态机、边缘网关在线情况、各机器人关节角。' +
      // 把这一段文字与下一段拼接。
      '注意 status/edge/robots 中出现 null 表示该数据超过 TTL 未刷新(空闲产线正常),不代表设备故障。',
      // 把这一段文字作为当前调用、数组或对象的值。 关键字：null＝空值。
    inputSchema: { lineId: z.string().describe('产线编码,例如 line-01') },
    // 设置字段 inputSchema。
    annotations: READ_ONLY,
    // 设置字段 annotations。
  },
  // 结束当前对象或代码块，并完成这条语句。
  async ({ lineId }) => ({ content: [{ type: 'text', text: JSON.stringify(await getLineSnapshot(lineId)) }] }),
  // 调用 async；括号中的表达式是传入的参数。 关键字：async＝声明异步函数；await＝等待异步操作完成。
);
// 结束当前函数的参数列表并完成调用。

server.registerTool(
// 调用 server.registerTool，把括号中的值作为参数传入。
  'get_line_history',
  // 把这一段文字作为当前调用、数组或对象的值。
  {
  // 开始一个对象字面量，后续行逐项填写字段。
    title: '产线状态历史',
    // 设置字段 title。
    description: '按时间倒序读取产线状态变化历史,用于回答「刚才发生了什么」「什么时候停的」。',
    // 设置字段 description。
    inputSchema: {
    // 设置字段 inputSchema。
      lineId: z.string(),
      // 设置字段 lineId。
      minutes: z.number().int().min(1).max(10080).default(60).describe('回溯分钟数,默认 60'),
      // 设置字段 minutes。 关键字：default＝指定默认导出或默认分支。
      limit: z.number().int().min(1).max(500).default(100),
      // 设置字段 limit。 关键字：default＝指定默认导出或默认分支。
    },
    // 结束当前对象或代码块，并完成这条语句。
    annotations: READ_ONLY,
    // 设置字段 annotations。
  },
  // 结束当前对象或代码块，并完成这条语句。
  async ({ lineId, minutes, limit }) => ({
  // 调用 async；括号中的表达式是传入的参数。 关键字：async＝声明异步函数。
    content: [{ type: 'text', text: JSON.stringify(await getLineHistory(lineId, minutes ?? 60, limit ?? 100)) }],
    // 设置字段 content。 关键字：await＝等待异步操作完成。
  }),
  // 结束当前回调或对象，并完成外层函数调用。
);
// 结束当前函数的参数列表并完成调用。

server.registerTool(
// 调用 server.registerTool，把括号中的值作为参数传入。
  'get_recent_events',
  // 把这一段文字作为当前调用、数组或对象的值。
  {
  // 开始一个对象字面量，后续行逐项填写字段。
    title: '近期报警与事件',
    // 设置字段 title。
    description: '读取生产事件流。排查故障时通常把 onlyProblems 设为 true,只看 warning/critical。',
    // 设置字段 description。 关键字：true＝布尔真值。
    inputSchema: {
    // 设置字段 inputSchema。
      lineId: z.string(),
      // 设置字段 lineId。
      hours: z.number().int().min(1).max(168).default(24),
      // 设置字段 hours。 关键字：default＝指定默认导出或默认分支。
      onlyProblems: z.boolean().default(true).describe('只看 warning/critical'),
      // 设置字段 onlyProblems。 关键字：default＝指定默认导出或默认分支；true＝布尔真值。
      limit: z.number().int().min(1).max(200).default(50),
      // 设置字段 limit。 关键字：default＝指定默认导出或默认分支。
    },
    // 结束当前对象或代码块，并完成这条语句。
    annotations: READ_ONLY,
    // 设置字段 annotations。
  },
  // 结束当前对象或代码块，并完成这条语句。
  async ({ lineId, hours, onlyProblems, limit }) => ({
  // 调用 async；括号中的表达式是传入的参数。 关键字：async＝声明异步函数。
    content: [
    // 设置字段 content。
      { type: 'text', text: JSON.stringify(await getRecentEvents(lineId, hours ?? 24, onlyProblems ?? true, limit ?? 50)) },
      // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：await＝等待异步操作完成；true＝布尔真值。
    ],
    // 结束当前数组，继续外层表达式。
  }),
  // 结束当前回调或对象，并完成外层函数调用。
);
// 结束当前函数的参数列表并完成调用。

server.registerTool(
// 调用 server.registerTool，把括号中的值作为参数传入。
  'propose_action',
  // 把这一段文字作为当前调用、数组或对象的值。
  {
  // 开始一个对象字面量，后续行逐项填写字段。
    title: '提交控制建议(需人工确认)',
    // 设置字段 title。
    description:
    // 设置字段 description。
      '当诊断结论需要改变产线状态时调用本工具提交一条**建议**。' +
      // 把这一段文字与下一段拼接。
      '它只做校验和登记,不会执行 —— 会在值班人界面上生成一张待确认卡片,人工点击后才真正下发。' +
      // 把这一段文字与下一段拼接。
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      // 把这一段文字与下一段拼接。
      (contract.paramEnums.mode_set ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') : '') +
      // 开始当前表达式的分组或数组内容。
      (contract.paramEnums.conveyor ? ';conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') : '') +
      // 开始当前表达式的分组或数组内容。
      '不要为 reset/changeover/alarm_clear 提建议 —— 现场 PLC 没有对应寄存器。',
      // 把这一段文字作为当前调用、数组或对象的值。
    inputSchema: {
    // 设置字段 inputSchema。
      lineId: z.string(),
      // 设置字段 lineId。
      deviceId: z.string().describe('设备编码,例如 robot-01'),
      // 设置字段 deviceId。
      type: z.enum(contract.executableTypes).describe('控制指令类型'),
      // 设置字段 type。 关键字：enum＝定义枚举。
      params: z.record(z.unknown()).optional().describe('指令参数,含 action 枚举值'),
      // 设置字段 params。 关键字：unknown＝需检查后才能使用的类型。
      reason: z.string().describe('为什么需要这条操作,会写进 UI 给值班人看,写清楚依据'),
      // 设置字段 reason。
    },
    // 结束当前对象或代码块，并完成这条语句。
  },
  // 结束当前对象或代码块，并完成这条语句。
  async ({ lineId, deviceId, type, params, reason }) => ({
  // 调用 async；括号中的表达式是传入的参数。 关键字：async＝声明异步函数。
    content: [{ type: 'text', text: JSON.stringify(await proposeAction(lineId, deviceId, type, params, reason)) }],
    // 设置字段 content。 关键字：await＝等待异步操作完成。
  }),
  // 结束当前回调或对象，并完成外层函数调用。
);
// 结束当前函数的参数列表并完成调用。

server.registerTool(
// 调用 server.registerTool，把括号中的值作为参数传入。
  'run_operation',
  // 把这一段文字作为当前调用、数组或对象的值。
  {
  // 开始一个对象字面量，后续行逐项填写字段。
    title: '执行产线操作(直控)',
    // 设置字段 title。
    description:
    // 设置字段 description。
      '★ 直控工具:把一句人话翻译成正确的 PLC 操作序列并**直接执行**,不用人工点确认。' +
      // 把这一段文字与下一段拼接。
      '可用操作:' +
      // 把这一段文字与下一段拼接。
      Object.entries(OPERATIONS)
      // 调用 Object.entries，把括号中的值作为参数传入。
        .map(([k, v]) => `${k}(${v.title}:${v.desc})`)
        // 调用 .map，把括号中的值作为参数传入。
        .join(';') +
        // 调用 .join，把括号中的值作为参数传入。
      '。' +
      // 把这一段文字与下一段拼接。
      '用户说「传送带启动/传送带运行」→ conveyor_start;' +
      // 把这一段文字与下一段拼接。
      '「传送带停止」→ conveyor_stop;' +
      // 把这一段文字与下一段拼接。
      '「启动产线/开始生产」→ line_start;' +
      // 把这一段文字与下一段拼接。
      '「停止产线」→ line_stop;' +
      // 把这一段文字与下一段拼接。
      '「释放手动/退出手动模式」→ release_manual。' +
      // 把这一段文字与下一段拼接。
      '每一步都会等 PLC 回执,返回里逐步给出 status(acked/rejected/timeout)。' +
      // 把这一段文字与下一段拼接。
      '如实汇报每一步的结果,不要把 rejected/timeout 说成成功。',
      // 把这一段文字作为当前调用、数组或对象的值。
    inputSchema: {
    // 设置字段 inputSchema。
      lineId: z.string().default('line-01').describe('产线编码,默认 line-01'),
      // 设置字段 lineId。 关键字：default＝指定默认导出或默认分支。
      deviceId: z.string().default('robot-01').describe('设备编码,默认 robot-01'),
      // 设置字段 deviceId。 关键字：default＝指定默认导出或默认分支。
      operation: z.enum(Object.keys(OPERATIONS)).describe('要执行的操作'),
      // 设置字段 operation。 关键字：enum＝定义枚举。
      operator: z.string().optional().describe('操作者标识,例如 ai:feishu:ou_xxx,会写进审计'),
      // 设置字段 operator。
      dryRun: z.boolean().default(false).describe('只预演不下发(排查/确认流程用)'),
      // 设置字段 dryRun。 关键字：default＝指定默认导出或默认分支；false＝布尔假值。
    },
    // 结束当前对象或代码块，并完成这条语句。
  },
  // 结束当前对象或代码块，并完成这条语句。
  async ({ lineId, deviceId, operation, operator, dryRun }) => ({
  // 调用 async；括号中的表达式是传入的参数。 关键字：async＝声明异步函数。
    content: [
    // 设置字段 content。
      {
      // 开始一个对象字面量，后续行逐项填写字段。
        type: 'text',
        // 设置字段 type。 关键字：type＝定义类型别名。
        text: JSON.stringify(
        // 设置字段 text。
          await runOperation(operation, {
          // 调用 runOperation，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
            lineId: lineId || 'line-01',
            // 设置字段 lineId。
            deviceId: deviceId || 'robot-01',
            // 设置字段 deviceId。
            operator: operator || 'ai:line-twin',
            // 设置字段 operator。
            dryRun: Boolean(dryRun),
            // 设置字段 dryRun。
          }),
          // 结束当前回调或对象，并完成外层函数调用。
        ),
        // 结束当前函数的参数列表并完成调用。
      },
      // 结束当前对象或代码块，并完成这条语句。
    ],
    // 结束当前数组，继续外层表达式。
  }),
  // 结束当前回调或对象，并完成外层函数调用。
);
// 结束当前函数的参数列表并完成调用。

server.registerTool(
// 调用 server.registerTool，把括号中的值作为参数传入。
  'execute_action',
  // 把这一段文字作为当前调用、数组或对象的值。
  {
  // 开始一个对象字面量，后续行逐项填写字段。
    title: '下发单条控制指令(直控)',
    // 设置字段 title。
    description:
    // 设置字段 description。
      '★ 直控工具:直接下发**一条**控制指令并等 PLC 回执。' +
      // 把这一段文字与下一段拼接。
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      // 把这一段文字与下一段拼接。
      (contract.paramEnums.mode_set
      // 开始当前表达式的分组或数组内容。
        ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') + ';'
        // 调用 Object.keys；括号中的表达式是传入的参数。
        : '') +
        // 条件不满足时拼接空字符串，然后继续组装提示文本。
      (contract.paramEnums.conveyor
      // 开始当前表达式的分组或数组内容。
        ? 'conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') + ';'
        // 调用 Object.keys；括号中的表达式是传入的参数。
        : '') +
        // 条件不满足时拼接空字符串，然后继续组装提示文本。
      '「启动产线」用 type=start;「停止」用 type=stop;' +
      // 把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
      '「获取手动」type=mode_set,params.action=acquire;' +
      // 把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
      '「释放手动」type=mode_set,params.action=release;' +
      // 把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
      '「传送带正转/停止」type=conveyor,params.action=forward|stop。' +
      // 把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
      '除非用户明确要单步,否则优先用 run_operation —— 它会按正确的顺序执行。',
      // 把这一段文字作为当前调用、数组或对象的值。
    inputSchema: {
    // 设置字段 inputSchema。
      lineId: z.string().default('line-01'),
      // 设置字段 lineId。 关键字：default＝指定默认导出或默认分支。
      deviceId: z.string().default('robot-01'),
      // 设置字段 deviceId。 关键字：default＝指定默认导出或默认分支。
      type: z.enum(contract.executableTypes),
      // 设置字段 type。 关键字：enum＝定义枚举。
      params: z.record(z.unknown()).optional(),
      // 设置字段 params。 关键字：unknown＝需检查后才能使用的类型。
      operator: z.string().optional(),
      // 设置字段 operator。
      dryRun: z.boolean().default(false),
      // 设置字段 dryRun。 关键字：default＝指定默认导出或默认分支；false＝布尔假值。
    },
    // 结束当前对象或代码块，并完成这条语句。
  },
  // 结束当前对象或代码块，并完成这条语句。
  async ({ lineId, deviceId, type, params, operator, dryRun }) => {
  // 调用 async；括号中的表达式是传入的参数。 关键字：async＝声明异步函数。
    const enums = contract.paramEnums[type];
    // 声明 enums，初始值由 contract.paramEnums[type] 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (enums) {
    // 判断 if (enums) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      const action = (params || {}).action;
      // 声明 action，初始值由 (params || {}).action 计算得到。 关键字：const＝声明不可重新绑定的变量。
      if (typeof action !== 'string' || !(action in enums)) {
      // 判断 if (typeof action !== 'string' || !(action in enums)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型；in＝遍历键或判断成员。
        return {
        // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
          content: [
          // 设置字段 content。
            {
            // 开始一个对象字面量，后续行逐项填写字段。
              type: 'text',
              // 设置字段 type。 关键字：type＝定义类型别名。
              text: JSON.stringify({
              // 设置字段 text。
                ok: false,
                // 设置字段 ok。 关键字：false＝布尔假值。
                error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
                // 设置字段 error。 关键字：type＝定义类型别名。
              }),
              // 结束当前回调或对象，并完成外层函数调用。
            },
            // 结束当前对象或代码块，并完成这条语句。
          ],
          // 结束当前数组，继续外层表达式。
        };
        // 结束当前对象或代码块，并完成这条语句。
      }
      // 结束当前对象、函数或条件代码块。
    }
    // 结束当前对象、函数或条件代码块。
    if (dryRun) {
    // 判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      const state = await currentState(lineId || 'line-01');
      // 声明 state，初始值由 await currentState(lineId || 'line-01') 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      return {
      // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        content: [
        // 设置字段 content。
          {
          // 开始一个对象字面量，后续行逐项填写字段。
            type: 'text',
            // 设置字段 type。 关键字：type＝定义类型别名。
            text: JSON.stringify({
            // 设置字段 text。
              ok: true,
              // 设置字段 ok。 关键字：true＝布尔真值。
              dryRun: true,
              // 设置字段 dryRun。 关键字：true＝布尔真值。
              type,
              // 把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
              params: params || {},
              // 设置字段 params。
              stateBefore: state,
              // 设置字段 stateBefore。
              precondition: preconditionError(type, (params || {}).action, state),
              // 设置字段 precondition。 关键字：type＝定义类型别名。
              note: 'dryRun:只预演,没有下发任何指令',
              // 设置字段 note。
            }),
            // 结束当前回调或对象，并完成外层函数调用。
          },
          // 结束当前对象或代码块，并完成这条语句。
        ],
        // 结束当前数组，继续外层表达式。
      };
      // 结束当前对象或代码块，并完成这条语句。
    }
    // 结束当前对象、函数或条件代码块。
    const step = await execStep({
    // 声明 step，初始值由 await execStep({ 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      lineId: lineId || 'line-01',
      // 设置字段 lineId。
      deviceId: deviceId || 'robot-01',
      // 设置字段 deviceId。
      type,
      // 把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
      params: params || {},
      // 设置字段 params。
      operator: operator || 'ai:line-twin',
      // 设置字段 operator。
    });
    // 结束当前回调或对象，并完成外层函数调用。
    return { content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] };
    // 返回 { content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  },
  // 结束当前对象或代码块，并完成这条语句。
);
// 结束当前函数的参数列表并完成调用。

// ---------------------------------------------------------------------------

async function main() {
// 定义函数 main。 关键字：async＝声明异步函数；function＝定义函数。
  const transport = new StdioServerTransport();
  // 声明 transport，初始值由 new StdioServerTransport() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  await server.connect(transport);
  // 调用 server.connect，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  log(`已启动;proposal 频道=${PROPOSAL_CHANNEL},ttl=${PROPOSAL_TTL_SEC}s`);
  // 调用 log；括号中的表达式是传入的参数。
}
// 结束当前对象、函数或条件代码块。

main().catch((e) => {
// 调用 main；括号中的表达式是传入的参数。 关键字：catch＝捕获异常。
  log('致命错误:', e && e.stack ? e.stack : e);
  // 调用 log；括号中的表达式是传入的参数。
  process.exit(1);
  // 调用 process.exit，把括号中的值作为参数传入。
});
// 结束当前回调或对象，并完成外层函数调用。
