# server/mcp/line-twin-mcp.js 逐行注释

[打开源码](../../../../server/mcp/line-twin-mcp.js) · 713 行 · 571 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
#!/usr/bin/env node
// 注释：指定运行这个脚本时使用的解释器。
```

**源码第 2 行**

```text
'use strict';
// 注释：启用 JavaScript 严格模式，让部分隐式错误直接抛异常。
```

**源码第 27 行**

```text
const path = require('path');
// 注释：声明 path，初始值由 require('path') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 28 行**

```text
const fs = require('fs');
// 注释：声明 fs，初始值由 require('fs') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 29 行**

```text
const crypto = require('crypto');
// 注释：声明 crypto，初始值由 require('crypto') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 32 行**

```text
const SERVER_ROOT = path.resolve(__dirname, '..');
// 注释：声明 SERVER_ROOT，初始值由 path.resolve(__dirname, '..') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 33 行**

```text
require(path.join(SERVER_ROOT, 'node_modules', 'dotenv')).config({
// 注释：调用 require；括号中的表达式是传入的参数。
```

**源码第 34 行**

```text
  path: path.join(SERVER_ROOT, '.env'),
// 注释：设置字段 `path`。
```

**源码第 35 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 37 行**

```text
const { McpServer } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/mcp.js'));
// 注释：从右侧结果中取出 McpServer，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 38 行**

```text
const { StdioServerTransport } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/stdio.js'));
// 注释：从右侧结果中取出 StdioServerTransport，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 39 行**

```text
const { z } = require(path.join(SERVER_ROOT, 'node_modules', 'zod'));
// 注释：从右侧结果中取出 z，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 40 行**

```text
const { Pool } = require(path.join(SERVER_ROOT, 'node_modules', 'pg'));
// 注释：从右侧结果中取出 Pool，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 41 行**

```text
const Redis = require(path.join(SERVER_ROOT, 'node_modules', 'ioredis'));
// 注释：声明 Redis，初始值由 require(path.join(SERVER_ROOT, 'node_modules', 'ioredis')) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 45 行**

```text
const contract = require(path.join(SERVER_ROOT, 'src', 'command', 'command-contract.json'));
// 注释：声明 contract，初始值由 require(path.join(SERVER_ROOT, 'src', 'command', 'command-contract.json')) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 47 行**

```text
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// 注释：声明 REDIS_URL，初始值由 process.env.REDIS_URL || 'redis://localhost:6379' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 48 行**

```text
const DATABASE_URL =
// 注释：声明 DATABASE_URL，初始值由  计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 49 行**

```text
  process.env.DATABASE_URL || 'postgres://postgres:postgres123@localhost:5432/linetwin';
// 注释：读取指定环境变量；若未设置则使用右侧默认值。
```

**源码第 52 行**

```text
const PROPOSAL_TTL_SEC = 900;
// 注释：声明 PROPOSAL_TTL_SEC，初始值由 900 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 53 行**

```text
const PROPOSAL_CHANNEL = 'ai:proposal';
// 注释：声明 PROPOSAL_CHANNEL，初始值由 'ai:proposal' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 55 行**

```text
function log(...args) {
// 注释：定义函数 `log`。 关键字：`function`＝定义函数。
```

**源码第 57 行**

```text
  process.stderr.write('[line-twin-mcp] ' + args.join(' ') + '\n');
// 注释：调用 process.stderr.write，把括号中的值作为参数传入。
```

**源码第 58 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 60 行**

```text
const pool = new Pool({ connectionString: DATABASE_URL });
// 注释：声明 pool，初始值由 new Pool({ connectionString: DATABASE_URL }) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 61 行**

```text
const redis = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
// 注释：声明 redis，初始值由 new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 }) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例；`false`＝布尔假值。
```

**源码第 62 行**

```text
redis.on('error', (e) => log('redis error:', e.message));
// 注释：调用 redis.on，把括号中的值作为参数传入。
```

**源码第 69 行**

```text
const lineIdCache = new Map(); // code -> { id, name } | null,60s 过期(对齐 CatalogService)
// 注释：声明 lineIdCache，初始值由 new Map(); // code -> { id, name } | null,60s 过期(对齐 CatalogService) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 70 行**

```text
async function resolveLine(code) {
// 注释：定义函数 `resolveLine`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 71 行**

```text
  const hit = lineIdCache.get(code);
// 注释：声明 hit，初始值由 lineIdCache.get(code) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 72 行**

```text
  if (hit && Date.now() - hit.at < 60000) return hit.row;
// 注释：判断 if (hit && Date.now() - hit.at < 60000) return hit.row; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 73 行**

```text
  const { rows } = await pool.query(
// 注释：从右侧结果中取出 rows，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 74 行**

```text
    'SELECT id, code, name FROM production_lines WHERE code = $1 LIMIT 1', [code]);
// 注释：提供 SQL 语句，读取表 production_lines 中的数据；实际参数由外层查询调用传入。
```

**源码第 75 行**

```text
  lineIdCache.set(code, { at: Date.now(), row: rows[0] || null });
// 注释：调用 lineIdCache.set，把括号中的值作为参数传入。 关键字：`null`＝空值。
```

**源码第 76 行**

```text
  if (!rows[0]) {
// 注释：判断 if (!rows[0]) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 77 行**

```text
    const { rows: all } = await pool.query('SELECT code FROM production_lines ORDER BY id');
// 注释：从右侧结果中取出 rows: all，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 78 行**

```text
    throw new Error(`未知产线编码 ${code}。可用:${all.map((r) => r.code).join('|') || '(库中没有任何产线)'}`);
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 79 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 80 行**

```text
  return rows[0];
// 注释：返回 rows[0] 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 81 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 83 行**

```text
const server = new McpServer(
// 注释：声明 server，初始值由 new McpServer( 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 84 行**

```text
  { name: 'line-twin', version: '1.1.0' },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 85 行**

```text
  {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 86 行**

```text
    capabilities: { tools: {} },
// 注释：设置字段 `capabilities`。
```

**源码第 87 行**

```text
    instructions:
// 注释：设置字段 `instructions`。
```

**源码第 88 行**

```text
      '这是产线(line-01)的数据源与控制通道,分两类工具:' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 89 行**

```text
      '【查询类(只读)】get_line_snapshot / get_line_history / get_recent_events;' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 90 行**

```text
      '【控制类】run_operation / execute_action(直控,直接下发不等人工确认)、' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 91 行**

```text
      'propose_action(只提交建议,等人点确认)。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 92 行**

```text
      '★ 选哪条路,取决于你所在的通道:' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 93 行**

```text
      '  · 你在飞书/Lark 里(系统提示说你在 Feishu 工作区,用户在跟你直接对话)→ ' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 94 行**

```text
      '    用 run_operation 直控。用户说「传送带启动|传送带运行|手动跑一下传送带」→ conveyor_start;' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 95 行**

```text
      '    「传送带停止」→ conveyor_stop;「启动产线|开始生产|开工」→ line_start;' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 96 行**

```text
      '    「停止产线|停机」→ line_stop;「释放手动|退出手动」→ release_manual。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 97 行**

```text
      '  · 你在网页抽屉里(系统提示说明该通道只允许提交建议)→ 用 propose_action,不要用直控工具。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 98 行**

```text
      'run_operation 内部会按 PLC 联锁要求的顺序执行(传送带必须:停止 → 获取手动 → 正转),' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 99 行**

```text
      '并逐步返回回执。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 100 行**

```text
      '不要凭空猜测状态:任何结论都应先调用工具查证;执行结果要如实汇报,rejected/timeout 不许说成成功。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 101 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 102 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 115 行**

```text
async function getLineSnapshot(lineId) {
// 注释：定义函数 `getLineSnapshot`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 116 行**

```text
  const [status, edge] = await redis.mget(`rt:${lineId}:status`, `rt:${lineId}:edge`);
// 注释：调用 redis.mget；括号中的表达式是传入的参数。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 117 行**

```text
  const keys = await redis.keys(`rt:${lineId}:robot:*`);
// 注释：声明 keys，初始值由 await redis.keys(`rt:${lineId}:robot:*`) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 118 行**

```text
  const frames = keys.length ? await redis.mget(keys) : [];
// 注释：声明 frames，初始值由 keys.length ? await redis.mget(keys) : [] 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 119 行**

```text
  const robots = {};
// 注释：声明 robots，初始值由 {} 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 120 行**

```text
  keys.forEach((k, i) => {
// 注释：调用 keys.forEach，把括号中的值作为参数传入。
```

**源码第 121 行**

```text
    const deviceId = k.split(':').pop();
// 注释：声明 deviceId，初始值由 k.split(':').pop() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 122 行**

```text
    robots[deviceId] = frames[i] ? JSON.parse(frames[i]) : null;
// 注释：将 frames[i] ? JSON.parse(frames[i]) : null 的结果写入 robots[deviceId]。 关键字：`null`＝空值。
```

**源码第 123 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 125 行**

```text
  const state = status ? JSON.parse(status) : null;
// 注释：声明 state，初始值由 status ? JSON.parse(status) : null 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。
```

**源码第 126 行**

```text
  const edgeState = edge ? JSON.parse(edge) : null;
// 注释：声明 edgeState，初始值由 edge ? JSON.parse(edge) : null 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。
```

**源码第 127 行**

```text
  return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 128 行**

```text
    lineId,
// 注释：把变量 lineId 作为同名对象字段加入当前对象。
```

**源码第 129 行**

```text
    readAt: Date.now(),
// 注释：设置字段 `readAt`。
```

**源码第 130 行**

```text
    status: state,
// 注释：设置字段 `status`。
```

**源码第 131 行**

```text
    edge: edgeState,
// 注释：设置字段 `edge`。
```

**源码第 132 行**

```text
    robots,
// 注释：把变量 robots 作为同名对象字段加入当前对象。
```

**源码第 133 行**

```text
    freshness: {
// 注释：设置字段 `freshness`。
```

**源码第 134 行**

```text
      statusMs: state ? Date.now() - (state.ts ?? 0) : null,
// 注释：设置字段 `statusMs`。 关键字：`null`＝空值。
```

**源码第 135 行**

```text
      edgeMs: edgeState ? Date.now() - (edgeState.ts ?? 0) : null,
// 注释：设置字段 `edgeMs`。 关键字：`null`＝空值。
```

**源码第 136 行**

```text
      note: 'null 表示该数据已超过 TTL 未更新(空闲产线属正常),不等于设备离线',
// 注释：设置字段 `note`。 关键字：null＝空值。
```

**源码第 137 行**

```text
    },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 138 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 139 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 141 行**

```text
async function getLineHistory(lineCode, minutes, limit) {
// 注释：定义函数 `getLineHistory`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 142 行**

```text
  const line = await resolveLine(lineCode);
// 注释：声明 line，初始值由 await resolveLine(lineCode) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 143 行**

```text
  const { rows } = await pool.query(
// 注释：从右侧结果中取出 rows，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 144 行**

```text
    `SELECT time, state, product_code, good_count, ng_count, beat_ms
// 注释：读取数据。 关键字：`SELECT`＝读取指定列。
```

**源码第 145 行**

```text
       FROM line_status_history
// 注释：指定读取来源表。 关键字：`FROM`＝指定查询来源表。
```

**源码第 146 行**

```text
      WHERE line_id = $1 AND "time" > now() - ($2 || ' minutes')::interval
// 注释：限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与。
```

**源码第 147 行**

```text
      ORDER BY "time" DESC
// 注释：指定结果排序。 关键字：`ORDER`＝指定排序；`BY`＝指定分组或排序字段。
```

**源码第 148 行**

```text
      LIMIT $3`,
// 注释：限制结果行数。 关键字：`LIMIT`＝限制返回行数。
```

**源码第 149 行**

```text
    [line.id, String(minutes), limit],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 150 行**

```text
  );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 151 行**

```text
  return { lineId: line.code, lineName: line.name, minutes, count: rows.length, rows };
// 注释：返回 { lineId: line.code, lineName: line.name, minutes, count: rows.length, rows } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 152 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 154 行**

```text
async function getRecentEvents(lineCode, hours, onlyProblems, limit) {
// 注释：定义函数 `getRecentEvents`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 156 行**

```text
  const line = await resolveLine(lineCode);
// 注释：声明 line，初始值由 await resolveLine(lineCode) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 157 行**

```text
  const { rows } = await pool.query(
// 注释：从右侧结果中取出 rows，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 158 行**

```text
    `SELECT time, device_id, type, level, code, message, payload
// 注释：读取数据。 关键字：`SELECT`＝读取指定列。
```

**源码第 159 行**

```text
       FROM production_events
// 注释：指定读取来源表。 关键字：`FROM`＝指定查询来源表。
```

**源码第 160 行**

```text
      WHERE line_id = $1
// 注释：限定处理范围。 关键字：`WHERE`＝限定目标行。
```

**源码第 161 行**

```text
        AND "time" > now() - ($2 || ' hours')::interval
// 注释：叠加筛选条件。 关键字：`AND`＝逻辑与。
```

**源码第 162 行**

```text
        AND ($3::boolean IS NOT TRUE OR level IN ('warning','critical'))
// 注释：叠加筛选条件。 关键字：`AND`＝逻辑与；`IS`＝检查空值或布尔值；`NOT`＝逻辑否定；`OR`＝逻辑或；`IN`＝检查是否属于集合。
```

**源码第 163 行**

```text
      ORDER BY "time" DESC
// 注释：指定结果排序。 关键字：`ORDER`＝指定排序；`BY`＝指定分组或排序字段。
```

**源码第 164 行**

```text
      LIMIT $4`,
// 注释：限制结果行数。 关键字：`LIMIT`＝限制返回行数。
```

**源码第 165 行**

```text
    [line.id, String(hours), onlyProblems, limit],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 166 行**

```text
  );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 167 行**

```text
  return { lineId: line.code, hours, onlyProblems, count: rows.length, rows };
// 注释：返回 { lineId: line.code, hours, onlyProblems, count: rows.length, rows } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 168 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 176 行**

```text
async function proposeAction(lineId, deviceId, type, params, reason) {
// 注释：定义函数 `proposeAction`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 177 行**

```text
  if (!contract.allowedTypes.includes(type)) {
// 注释：判断 if (!contract.allowedTypes.includes(type)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 178 行**

```text
    return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 179 行**

```text
      ok: false,
// 注释：设置字段 `ok`。 关键字：`false`＝布尔假值。
```

**源码第 180 行**

```text
      error: `type 不在白名单。可选:${contract.allowedTypes.join('|')}`,
// 注释：设置字段 `error`。 关键字：type＝定义类型别名。
```

**源码第 181 行**

```text
    };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 182 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 185 行**

```text
  if (!contract.executableTypes.includes(type)) {
// 注释：判断 if (!contract.executableTypes.includes(type)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 186 行**

```text
    return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 187 行**

```text
      ok: false,
// 注释：设置字段 `ok`。 关键字：`false`＝布尔假值。
```

**源码第 188 行**

```text
      error: `${type} 在现场 PLC 无对应寄存器,edge 一定会回 rejected,不要建议该指令。可执行:${contract.executableTypes.join('|')}`,
// 注释：设置字段 `error`。 关键字：type＝定义类型别名。
```

**源码第 189 行**

```text
    };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 190 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 192 行**

```text
  const enums = contract.paramEnums[type];
// 注释：声明 enums，初始值由 contract.paramEnums[type] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 193 行**

```text
  if (enums) {
// 注释：判断 if (enums) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 194 行**

```text
    const action = (params || {}).action;
// 注释：声明 action，初始值由 (params || {}).action 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 195 行**

```text
    if (typeof action !== 'string' || !(action in enums)) {
// 注释：判断 if (typeof action !== 'string' || !(action in enums)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型；`in`＝遍历键或判断成员。
```

**源码第 196 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 197 行**

```text
        ok: false,
// 注释：设置字段 `ok`。 关键字：`false`＝布尔假值。
```

**源码第 198 行**

```text
        error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
// 注释：设置字段 `error`。 关键字：type＝定义类型别名。
```

**源码第 199 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 200 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 201 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 203 行**

```text
  const proposal = {
// 注释：声明 proposal，初始值由 { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 204 行**

```text
    id: 'p-' + crypto.randomUUID(),
// 注释：设置字段 `id`。
```

**源码第 205 行**

```text
    lineId,
// 注释：把变量 lineId 作为同名对象字段加入当前对象。
```

**源码第 206 行**

```text
    deviceId,
// 注释：把变量 deviceId 作为同名对象字段加入当前对象。
```

**源码第 207 行**

```text
    type,
// 注释：把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
```

**源码第 208 行**

```text
    params: params || {},
// 注释：设置字段 `params`。
```

**源码第 209 行**

```text
    reason,
// 注释：把变量 reason 作为同名对象字段加入当前对象。
```

**源码第 210 行**

```text
    status: 'pending',
// 注释：设置字段 `status`。
```

**源码第 211 行**

```text
    createdAt: Date.now(),
// 注释：设置字段 `createdAt`。
```

**源码第 212 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 214 行**

```text
  await redis.set(`ai:proposal:${proposal.id}`, JSON.stringify(proposal), 'EX', PROPOSAL_TTL_SEC);
// 注释：调用 redis.set，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 216 行**

```text
  await redis.publish(PROPOSAL_CHANNEL, JSON.stringify(proposal));
// 注释：调用 redis.publish，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 218 行**

```text
  return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 219 行**

```text
    ok: true,
// 注释：设置字段 `ok`。 关键字：`true`＝布尔真值。
```

**源码第 220 行**

```text
    proposalId: proposal.id,
// 注释：设置字段 `proposalId`。
```

**源码第 221 行**

```text
    instruction:
// 注释：设置字段 `instruction`。
```

**源码第 222 行**

```text
      '建议已提交,会由值班人在 UI 上人工确认后才会真正下发。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 223 行**

```text
      '请在回复里说明这条建议的理由和预期影响,不要声称已经执行。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 224 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 225 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 242 行**

```text
const MACHINE_TOKEN = process.env.MACHINE_COMMAND_TOKEN || '';
// 注释：声明 MACHINE_TOKEN，初始值由 process.env.MACHINE_COMMAND_TOKEN || '' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 243 行**

```text
const API_BASE = (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '');
// 注释：声明 API_BASE，初始值由 (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 245 行**

```text
const ACK_WAIT_MS = Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000);
// 注释：声明 ACK_WAIT_MS，初始值由 Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 247 行**

```text
const STATE_WAIT_MS = Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000);
// 注释：声明 STATE_WAIT_MS，初始值由 Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 249 行**

```text
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 注释：声明 sleep，初始值由 (ms) => new Promise((r) => setTimeout(r, ms)) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 252 行**

```text
function machineChannelReady() {
// 注释：定义函数 `machineChannelReady`。 关键字：`function`＝定义函数。
```

**源码第 253 行**

```text
  return Boolean(MACHINE_TOKEN);
// 注释：返回 Boolean(MACHINE_TOKEN) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 254 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 257 行**

```text
async function machineIssue({ lineId, deviceId, type, params, operator }) {
// 注释：定义函数 `machineIssue`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 258 行**

```text
  if (!machineChannelReady()) {
// 注释：判断 if (!machineChannelReady()) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 259 行**

```text
    return { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' };
// 注释：返回 { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 260 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 261 行**

```text
  let res;
// 注释：声明可重新赋值的变量 res，稍后再赋值。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 262 行**

```text
  try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 263 行**

```text
    res = await fetch(`${API_BASE}/api/machine/commands`, {
// 注释：把右侧表达式的结果写入 res。 关键字：`await`＝等待异步操作完成。
```

**源码第 264 行**

```text
      method: 'POST',
// 注释：设置字段 `method`。
```

**源码第 265 行**

```text
      headers: { 'Content-Type': 'application/json', 'x-machine-token': MACHINE_TOKEN },
// 注释：设置字段 `headers`。
```

**源码第 266 行**

```text
      body: JSON.stringify({ lineId, deviceId, type, params: params || {}, operator }),
// 注释：设置字段 `body`。 关键字：type＝定义类型别名。
```

**源码第 267 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 268 行**

```text
  } catch (e) {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 269 行**

```text
    return { ok: false, error: `调用后端失败:${e.message}` };
// 注释：返回 { ok: false, error: `调用后端失败:${e.message}` } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 270 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 271 行**

```text
  const body = await res.json().catch(() => ({}));
// 注释：声明 body，初始值由 await res.json().catch(() => ({})) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`catch`＝捕获异常。
```

**源码第 272 行**

```text
  if (!res.ok) {
// 注释：判断 if (!res.ok) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 273 行**

```text
    return { ok: false, error: body?.msg || body?.message || `后端返回 HTTP ${res.status}` };
// 注释：返回 { ok: false, error: body?.msg || body?.message || `后端返回 HTTP ${res.status}` } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 274 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 275 行**

```text
  if (!body?.ok) {
// 注释：判断 if (!body?.ok) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 276 行**

```text
    return { ok: false, error: body?.error || '后端拒绝下发' };
// 注释：返回 { ok: false, error: body?.error || '后端拒绝下发' } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 277 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 278 行**

```text
  return { ok: true, cmdId: body.cmdId };
// 注释：返回 { ok: true, cmdId: body.cmdId } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 279 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 285 行**

```text
async function waitAck(cmdId, timeoutMs = ACK_WAIT_MS) {
// 注释：定义函数 `waitAck`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 286 行**

```text
  const deadline = Date.now() + timeoutMs;
// 注释：声明 deadline，初始值由 Date.now() + timeoutMs 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 287 行**

```text
  while (Date.now() < deadline) {
// 注释：控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。
```

**源码第 288 行**

```text
    const { rows } = await pool.query(
// 注释：从右侧结果中取出 rows，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 289 行**

```text
      `SELECT status, ack_payload, acked_at FROM control_commands WHERE idempotency_key = $1`,
// 注释：读取数据。
```

**源码第 290 行**

```text
      [cmdId],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 291 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 292 行**

```text
    const row = rows[0];
// 注释：声明 row，初始值由 rows[0] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 293 行**

```text
    if (row && row.status !== 'pending' && row.status !== 'sent') {
// 注释：判断 if (row && row.status !== 'pending' && row.status !== 'sent') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 294 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 295 行**

```text
        status: row.status,
// 注释：设置字段 `status`。
```

**源码第 296 行**

```text
        message: row.ack_payload?.message || '',
// 注释：设置字段 `message`。
```

**源码第 297 行**

```text
        ackedAt: row.acked_at,
// 注释：设置字段 `ackedAt`。
```

**源码第 298 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 299 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 300 行**

```text
    await sleep(400);
// 注释：调用 sleep，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 301 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 302 行**

```text
  return { status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null };
// 注释：返回 { status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 303 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 306 行**

```text
async function currentState(lineId) {
// 注释：定义函数 `currentState`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 307 行**

```text
  const raw = await redis.get(`rt:${lineId}:status`);
// 注释：声明 raw，初始值由 await redis.get(`rt:${lineId}:status`) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 308 行**

```text
  if (!raw) return null;
// 注释：判断 if (!raw) return null; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 309 行**

```text
  try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 310 行**

```text
    return JSON.parse(raw)?.state ?? null;
// 注释：返回 JSON.parse(raw)?.state ?? null 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 311 行**

```text
  } catch {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 312 行**

```text
    return null;
// 注释：返回 null 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 313 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 314 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 317 行**

```text
async function waitState(lineId, wanted, timeoutMs = STATE_WAIT_MS) {
// 注释：定义函数 `waitState`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 318 行**

```text
  const list = Array.isArray(wanted) ? wanted : [wanted];
// 注释：声明 list，初始值由 Array.isArray(wanted) ? wanted : [wanted] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 319 行**

```text
  const deadline = Date.now() + timeoutMs;
// 注释：声明 deadline，初始值由 Date.now() + timeoutMs 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 320 行**

```text
  let last = null;
// 注释：声明 last，初始值由 null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。
```

**源码第 321 行**

```text
  while (Date.now() < deadline) {
// 注释：控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。
```

**源码第 322 行**

```text
    last = await currentState(lineId);
// 注释：把右侧表达式的结果写入 last。 关键字：`await`＝等待异步操作完成。
```

**源码第 323 行**

```text
    if (last && list.includes(last)) return { reached: true, state: last };
// 注释：判断 if (last && list.includes(last)) return { reached: true, state: last }; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 324 行**

```text
    await sleep(500);
// 注释：调用 sleep，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 325 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 326 行**

```text
  return { reached: false, state: last };
// 注释：返回 { reached: false, state: last } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 327 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 333 行**

```text
function preconditionError(type, action, state) {
// 注释：定义函数 `preconditionError`。 关键字：`function`＝定义函数。
```

**源码第 334 行**

```text
  if (!state) return '读不到当前产线状态(快照为空),拒绝盲发指令';
// 注释：判断 if (!state) return '读不到当前产线状态(快照为空),拒绝盲发指令'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 335 行**

```text
  if (state === 'init_error') {
// 注释：判断 if (state === 'init_error') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 336 行**

```text
    return '产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位';
// 注释：返回 '产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 337 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 338 行**

```text
  if (type === 'mode_set') {
// 注释：判断 if (type === 'mode_set') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 339 行**

```text
    if (action === 'acquire') {
// 注释：判断 if (action === 'acquire') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 340 行**

```text
      return state === 'stopped' ? null : `获取手动模式只能在 stopped 状态执行,当前是 ${state}`;
// 注释：返回 state === 'stopped' ? null : `获取手动模式只能在 stopped 状态执行,当前是 ${state}` 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 341 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 342 行**

```text
    if (action === 'release') {
// 注释：判断 if (action === 'release') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 343 行**

```text
      return state === 'manual_mode' ? null : `释放手动只能在 manual_mode 状态执行,当前是 ${state}`;
// 注释：返回 state === 'manual_mode' ? null : `释放手动只能在 manual_mode 状态执行,当前是 ${state}` 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 344 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 345 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 346 行**

```text
  if (type === 'conveyor') {
// 注释：判断 if (type === 'conveyor') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 347 行**

```text
    return state === 'manual_mode' ? null : `传送带只能在手动模式(manual_mode)下运行,当前是 ${state}`;
// 注释：返回 state === 'manual_mode' ? null : `传送带只能在手动模式(manual_mode)下运行,当前是 ${state}` 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 348 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 349 行**

```text
  if (type === 'start') {
// 注释：判断 if (type === 'start') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 350 行**

```text
    if (state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)';
// 注释：判断 if (state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 351 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 352 行**

```text
  return null;
// 注释：返回 null 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 353 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 358 行**

```text
async function execStep({ lineId, deviceId, type, params, operator, waitFor, skipPrecondition }) {
// 注释：定义函数 `execStep`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 359 行**

```text
  const action = params?.action;
// 注释：声明 action，初始值由 params?.action 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 360 行**

```text
  const before = await currentState(lineId);
// 注释：声明 before，初始值由 await currentState(lineId) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 361 行**

```text
  if (!skipPrecondition) {
// 注释：判断 if (!skipPrecondition) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 362 行**

```text
    const bad = preconditionError(type, action, before);
// 注释：声明 bad，初始值由 preconditionError(type, action, before) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 363 行**

```text
    if (bad) {
// 注释：判断 if (bad) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 364 行**

```text
      return { type, params: params || {}, ok: false, status: 'skipped', message: bad, stateBefore: before };
// 注释：返回 { type, params: params || {}, ok: false, status: 'skipped', message: bad, stateBefore: before } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 365 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 366 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 367 行**

```text
  const issued = await machineIssue({ lineId, deviceId, type, params, operator });
// 注释：声明 issued，初始值由 await machineIssue({ lineId, deviceId, type, params, operator }) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 368 行**

```text
  if (!issued.ok) {
// 注释：判断 if (!issued.ok) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 369 行**

```text
    return { type, params: params || {}, ok: false, status: 'failed', message: issued.error, stateBefore: before };
// 注释：返回 { type, params: params || {}, ok: false, status: 'failed', message: issued.error, stateBefore: before } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 370 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 371 行**

```text
  const ack = await waitAck(issued.cmdId);
// 注释：声明 ack，初始值由 await waitAck(issued.cmdId) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 372 行**

```text
  const step = {
// 注释：声明 step，初始值由 { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 373 行**

```text
    type,
// 注释：把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
```

**源码第 374 行**

```text
    params: params || {},
// 注释：设置字段 `params`。
```

**源码第 375 行**

```text
    cmdId: issued.cmdId,
// 注释：设置字段 `cmdId`。
```

**源码第 376 行**

```text
    ok: ack.status === 'acked',
// 注释：设置字段 `ok`。
```

**源码第 377 行**

```text
    status: ack.status,
// 注释：设置字段 `status`。
```

**源码第 378 行**

```text
    message: ack.message,
// 注释：设置字段 `message`。
```

**源码第 379 行**

```text
    stateBefore: before,
// 注释：设置字段 `stateBefore`。
```

**源码第 380 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 381 行**

```text
  if (waitFor && step.ok) {
// 注释：判断 if (waitFor && step.ok) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 382 行**

```text
    const st = await waitState(lineId, waitFor);
// 注释：声明 st，初始值由 await waitState(lineId, waitFor) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 383 行**

```text
    step.stateAfter = st.state;
// 注释：把右侧表达式的结果写入 step.stateAfter。
```

**源码第 384 行**

```text
    step.stateReached = st.reached;
// 注释：把右侧表达式的结果写入 step.stateReached。
```

**源码第 385 行**

```text
    if (!st.reached) {
// 注释：判断 if (!st.reached) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 386 行**

```text
      step.ok = false;
// 注释：把右侧表达式的结果写入 step.ok。 关键字：`false`＝布尔假值。
```

**源码第 387 行**

```text
      step.message = `指令已下发并回执,但产线状态没有变成 ${waitFor}(当前 ${st.state})`;
// 注释：把右侧表达式的结果写入 step.message。
```

**源码第 388 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 389 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 390 行**

```text
  return step;
// 注释：返回 step 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 391 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 401 行**

```text
const OPERATIONS = {
// 注释：声明 OPERATIONS，初始值由 { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 402 行**

```text
  conveyor_start: {
// 注释：设置字段 `conveyor_start`。
```

**源码第 403 行**

```text
    title: '传送带正转',
// 注释：设置字段 `title`。
```

**源码第 404 行**

```text
    desc: '按「停止 → 获取手动模式 → 传送带正转」三步执行(PLC 只允许手动模式下动传送带)',
// 注释：设置字段 `desc`。
```

**源码第 405 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 406 行**

```text
  conveyor_stop: { title: '停止传送带', desc: '传送带停止(电平型,写 0)' },
// 注释：设置字段 `conveyor_stop`。
```

**源码第 407 行**

```text
  line_start: { title: '启动产线', desc: '必要时先释放手动模式,再启动' },
// 注释：设置字段 `line_start`。
```

**源码第 408 行**

```text
  line_stop: { title: '停止产线', desc: '停止信号' },
// 注释：设置字段 `line_stop`。
```

**源码第 409 行**

```text
  release_manual: { title: '释放手动模式', desc: '退出手动模式,回到 stopped' },
// 注释：设置字段 `release_manual`。
```

**源码第 410 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 412 行**

```text
async function runOperation(op, { lineId, deviceId, operator, dryRun }) {
// 注释：定义函数 `runOperation`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 413 行**

```text
  const meta = OPERATIONS[op];
// 注释：声明 meta，初始值由 OPERATIONS[op] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 414 行**

```text
  if (!meta) {
// 注释：判断 if (!meta) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 415 行**

```text
    return { ok: false, error: `未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('|')}` };
// 注释：返回 { ok: false, error: `未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('|')}` } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 416 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 417 行**

```text
  const state0 = await currentState(lineId);
// 注释：声明 state0，初始值由 await currentState(lineId) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 418 行**

```text
  const steps = [];
// 注释：声明 steps，初始值由 [] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 420 行**

```text
  if (op === 'conveyor_start') {
// 注释：判断 if (op === 'conveyor_start') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 421 行**

```text
    if (dryRun) {
// 注释：判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 422 行**

```text
      steps.push({ type: 'stop', params: {} });
// 注释：调用 steps.push，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
```

**源码第 423 行**

```text
      steps.push({ type: 'mode_set', params: { action: 'acquire' } });
// 注释：调用 steps.push，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
```

**源码第 424 行**

```text
      steps.push({ type: 'conveyor', params: { action: 'forward' } });
// 注释：调用 steps.push，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
```

**源码第 425 行**

```text
      return { ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps };
// 注释：返回 { ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 426 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 427 行**

```text
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, waitFor: 'stopped' }));
// 注释：调用 steps.push，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 428 行**

```text
    if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
// 注释：判断 if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps }; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 429 行**

```text
    steps.push(
// 注释：调用 steps.push，把括号中的值作为参数传入。
```

**源码第 430 行**

```text
      await execStep({
// 注释：调用 execStep，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 431 行**

```text
        lineId, deviceId, type: 'mode_set', params: { action: 'acquire' }, operator, waitFor: 'manual_mode',
// 注释：组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：type＝定义类型别名。
```

**源码第 432 行**

```text
      }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 433 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 434 行**

```text
    if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
// 注释：判断 if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps }; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 435 行**

```text
    steps.push(
// 注释：调用 steps.push，把括号中的值作为参数传入。
```

**源码第 436 行**

```text
      await execStep({
// 注释：调用 execStep，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 437 行**

```text
        lineId, deviceId, type: 'conveyor', params: { action: 'forward' }, operator,
// 注释：组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：type＝定义类型别名。
```

**源码第 438 行**

```text
      }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 439 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 440 行**

```text
  } else if (op === 'conveyor_stop') {
// 注释：开始前一条件不满足时的分支。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。
```

**源码第 441 行**

```text
    if (dryRun) {
// 注释：判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 442 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 443 行**

```text
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
// 注释：设置字段 `ok`。 关键字：`true`＝布尔真值。
```

**源码第 444 行**

```text
        planned: [{ type: 'conveyor', params: { action: 'stop' } }],
// 注释：设置字段 `planned`。 关键字：type＝定义类型别名。
```

**源码第 445 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 446 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 448 行**

```text
    steps.push(
// 注释：调用 steps.push，把括号中的值作为参数传入。
```

**源码第 449 行**

```text
      await execStep({
// 注释：调用 execStep，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 450 行**

```text
        lineId, deviceId, type: 'conveyor', params: { action: 'stop' }, operator, skipPrecondition: true,
// 注释：组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：`true`＝布尔真值。
```

**源码第 451 行**

```text
      }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 452 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 453 行**

```text
  } else if (op === 'line_start') {
// 注释：开始前一条件不满足时的分支。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。
```

**源码第 454 行**

```text
    if (dryRun) {
// 注释：判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 455 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 456 行**

```text
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
// 注释：设置字段 `ok`。 关键字：`true`＝布尔真值。
```

**源码第 457 行**

```text
        planned: [
// 注释：设置字段 `planned`。
```

**源码第 458 行**

```text
          ...(state0 === 'manual_mode' ? [{ type: 'mode_set', params: { action: 'release' } }] : []),
// 注释：调用 ...，把括号中的值作为参数传入。 关键字：type＝定义类型别名。
```

**源码第 459 行**

```text
          { type: 'start', params: {} },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
```

**源码第 460 行**

```text
        ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 461 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 462 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 463 行**

```text
    if (state0 === 'manual_mode') {
// 注释：判断 if (state0 === 'manual_mode') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 464 行**

```text
      steps.push(
// 注释：调用 steps.push，把括号中的值作为参数传入。
```

**源码第 465 行**

```text
        await execStep({
// 注释：调用 execStep，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 466 行**

```text
          lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped',
// 注释：组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。 关键字：type＝定义类型别名。
```

**源码第 467 行**

```text
        }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 468 行**

```text
      );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 469 行**

```text
      if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
// 注释：判断 if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps }; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 470 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 471 行**

```text
    steps.push(await execStep({ lineId, deviceId, type: 'start', params: {}, operator }));
// 注释：调用 steps.push，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 472 行**

```text
  } else if (op === 'line_stop') {
// 注释：开始前一条件不满足时的分支。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。
```

**源码第 473 行**

```text
    if (dryRun) {
// 注释：判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 474 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 475 行**

```text
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
// 注释：设置字段 `ok`。 关键字：`true`＝布尔真值。
```

**源码第 476 行**

```text
        planned: [{ type: 'stop', params: {} }],
// 注释：设置字段 `planned`。 关键字：type＝定义类型别名。
```

**源码第 477 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 478 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 479 行**

```text
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, skipPrecondition: true }));
// 注释：调用 steps.push，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成；`true`＝布尔真值。
```

**源码第 480 行**

```text
  } else if (op === 'release_manual') {
// 注释：开始前一条件不满足时的分支。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。
```

**源码第 481 行**

```text
    if (dryRun) {
// 注释：判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 482 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 483 行**

```text
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
// 注释：设置字段 `ok`。 关键字：`true`＝布尔真值。
```

**源码第 484 行**

```text
        planned: [{ type: 'mode_set', params: { action: 'release' } }],
// 注释：设置字段 `planned`。 关键字：type＝定义类型别名。
```

**源码第 485 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 486 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 487 行**

```text
    steps.push(
// 注释：调用 steps.push，把括号中的值作为参数传入。
```

**源码第 488 行**

```text
      await execStep({ lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped' }),
// 注释：调用 execStep，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 489 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 490 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 492 行**

```text
  const ok = steps.length > 0 && steps.every((s) => s.ok);
// 注释：声明 ok，初始值由 steps.length > 0 && steps.every((s) => s.ok) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 493 行**

```text
  return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 494 行**

```text
    ok,
// 注释：把变量 ok 作为同名对象字段加入当前对象。
```

**源码第 495 行**

```text
    operation: op,
// 注释：设置字段 `operation`。
```

**源码第 496 行**

```text
    title: meta.title,
// 注释：设置字段 `title`。
```

**源码第 497 行**

```text
    stateBefore: state0,
// 注释：设置字段 `stateBefore`。
```

**源码第 498 行**

```text
    stateAfter: await currentState(lineId),
// 注释：设置字段 `stateAfter`。 关键字：`await`＝等待异步操作完成。
```

**源码第 499 行**

```text
    steps,
// 注释：把变量 steps 作为同名对象字段加入当前对象。
```

**源码第 500 行**

```text
    summary: steps.map((s) => `${s.type}${s.params?.action ? ':' + s.params.action : ''} → ${s.status}`).join(' , '),
// 注释：设置字段 `summary`。 关键字：type＝定义类型别名。
```

**源码第 501 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 502 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 508 行**

```text
const READ_ONLY = { readOnlyHint: true };
// 注释：声明 READ_ONLY，初始值由 { readOnlyHint: true } 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`true`＝布尔真值。
```

**源码第 510 行**

```text
server.registerTool(
// 注释：调用 server.registerTool，把括号中的值作为参数传入。
```

**源码第 511 行**

```text
  'get_line_snapshot',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 512 行**

```text
  {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 513 行**

```text
    title: '产线实时快照',
// 注释：设置字段 `title`。
```

**源码第 514 行**

```text
    description:
// 注释：设置字段 `description`。
```

**源码第 515 行**

```text
      '读取产线当前实时状态:产线状态机、边缘网关在线情况、各机器人关节角。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 516 行**

```text
      '注意 status/edge/robots 中出现 null 表示该数据超过 TTL 未刷新(空闲产线正常),不代表设备故障。',
// 注释：把这一段文字作为当前调用、数组或对象的值。 关键字：null＝空值。
```

**源码第 517 行**

```text
    inputSchema: { lineId: z.string().describe('产线编码,例如 line-01') },
// 注释：设置字段 `inputSchema`。
```

**源码第 518 行**

```text
    annotations: READ_ONLY,
// 注释：设置字段 `annotations`。
```

**源码第 519 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 520 行**

```text
  async ({ lineId }) => ({ content: [{ type: 'text', text: JSON.stringify(await getLineSnapshot(lineId)) }] }),
// 注释：调用 async；括号中的表达式是传入的参数。 关键字：`async`＝声明异步函数；`await`＝等待异步操作完成。
```

**源码第 521 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 523 行**

```text
server.registerTool(
// 注释：调用 server.registerTool，把括号中的值作为参数传入。
```

**源码第 524 行**

```text
  'get_line_history',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 525 行**

```text
  {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 526 行**

```text
    title: '产线状态历史',
// 注释：设置字段 `title`。
```

**源码第 527 行**

```text
    description: '按时间倒序读取产线状态变化历史,用于回答「刚才发生了什么」「什么时候停的」。',
// 注释：设置字段 `description`。
```

**源码第 528 行**

```text
    inputSchema: {
// 注释：设置字段 `inputSchema`。
```

**源码第 529 行**

```text
      lineId: z.string(),
// 注释：设置字段 `lineId`。
```

**源码第 530 行**

```text
      minutes: z.number().int().min(1).max(10080).default(60).describe('回溯分钟数,默认 60'),
// 注释：设置字段 `minutes`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 531 行**

```text
      limit: z.number().int().min(1).max(500).default(100),
// 注释：设置字段 `limit`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 532 行**

```text
    },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 533 行**

```text
    annotations: READ_ONLY,
// 注释：设置字段 `annotations`。
```

**源码第 534 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 535 行**

```text
  async ({ lineId, minutes, limit }) => ({
// 注释：调用 async；括号中的表达式是传入的参数。 关键字：`async`＝声明异步函数。
```

**源码第 536 行**

```text
    content: [{ type: 'text', text: JSON.stringify(await getLineHistory(lineId, minutes ?? 60, limit ?? 100)) }],
// 注释：设置字段 `content`。 关键字：`await`＝等待异步操作完成。
```

**源码第 537 行**

```text
  }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 538 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 540 行**

```text
server.registerTool(
// 注释：调用 server.registerTool，把括号中的值作为参数传入。
```

**源码第 541 行**

```text
  'get_recent_events',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 542 行**

```text
  {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 543 行**

```text
    title: '近期报警与事件',
// 注释：设置字段 `title`。
```

**源码第 544 行**

```text
    description: '读取生产事件流。排查故障时通常把 onlyProblems 设为 true,只看 warning/critical。',
// 注释：设置字段 `description`。 关键字：true＝布尔真值。
```

**源码第 545 行**

```text
    inputSchema: {
// 注释：设置字段 `inputSchema`。
```

**源码第 546 行**

```text
      lineId: z.string(),
// 注释：设置字段 `lineId`。
```

**源码第 547 行**

```text
      hours: z.number().int().min(1).max(168).default(24),
// 注释：设置字段 `hours`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 548 行**

```text
      onlyProblems: z.boolean().default(true).describe('只看 warning/critical'),
// 注释：设置字段 `onlyProblems`。 关键字：`default`＝指定默认导出或默认分支；`true`＝布尔真值。
```

**源码第 549 行**

```text
      limit: z.number().int().min(1).max(200).default(50),
// 注释：设置字段 `limit`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 550 行**

```text
    },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 551 行**

```text
    annotations: READ_ONLY,
// 注释：设置字段 `annotations`。
```

**源码第 552 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 553 行**

```text
  async ({ lineId, hours, onlyProblems, limit }) => ({
// 注释：调用 async；括号中的表达式是传入的参数。 关键字：`async`＝声明异步函数。
```

**源码第 554 行**

```text
    content: [
// 注释：设置字段 `content`。
```

**源码第 555 行**

```text
      { type: 'text', text: JSON.stringify(await getRecentEvents(lineId, hours ?? 24, onlyProblems ?? true, limit ?? 50)) },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：`await`＝等待异步操作完成；`true`＝布尔真值。
```

**源码第 556 行**

```text
    ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 557 行**

```text
  }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 558 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 560 行**

```text
server.registerTool(
// 注释：调用 server.registerTool，把括号中的值作为参数传入。
```

**源码第 561 行**

```text
  'propose_action',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 562 行**

```text
  {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 563 行**

```text
    title: '提交控制建议(需人工确认)',
// 注释：设置字段 `title`。
```

**源码第 564 行**

```text
    description:
// 注释：设置字段 `description`。
```

**源码第 565 行**

```text
      '当诊断结论需要改变产线状态时调用本工具提交一条**建议**。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 566 行**

```text
      '它只做校验和登记,不会执行 —— 会在值班人界面上生成一张待确认卡片,人工点击后才真正下发。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 567 行**

```text
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 568 行**

```text
      (contract.paramEnums.mode_set ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') : '') +
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 569 行**

```text
      (contract.paramEnums.conveyor ? ';conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') : '') +
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 570 行**

```text
      '不要为 reset/changeover/alarm_clear 提建议 —— 现场 PLC 没有对应寄存器。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 571 行**

```text
    inputSchema: {
// 注释：设置字段 `inputSchema`。
```

**源码第 572 行**

```text
      lineId: z.string(),
// 注释：设置字段 `lineId`。
```

**源码第 573 行**

```text
      deviceId: z.string().describe('设备编码,例如 robot-01'),
// 注释：设置字段 `deviceId`。
```

**源码第 574 行**

```text
      type: z.enum(contract.executableTypes).describe('控制指令类型'),
// 注释：设置字段 `type`。 关键字：`enum`＝定义枚举。
```

**源码第 575 行**

```text
      params: z.record(z.unknown()).optional().describe('指令参数,含 action 枚举值'),
// 注释：设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 576 行**

```text
      reason: z.string().describe('为什么需要这条操作,会写进 UI 给值班人看,写清楚依据'),
// 注释：设置字段 `reason`。
```

**源码第 577 行**

```text
    },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 578 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 579 行**

```text
  async ({ lineId, deviceId, type, params, reason }) => ({
// 注释：调用 async；括号中的表达式是传入的参数。 关键字：`async`＝声明异步函数。
```

**源码第 580 行**

```text
    content: [{ type: 'text', text: JSON.stringify(await proposeAction(lineId, deviceId, type, params, reason)) }],
// 注释：设置字段 `content`。 关键字：`await`＝等待异步操作完成。
```

**源码第 581 行**

```text
  }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 582 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 584 行**

```text
server.registerTool(
// 注释：调用 server.registerTool，把括号中的值作为参数传入。
```

**源码第 585 行**

```text
  'run_operation',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 586 行**

```text
  {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 587 行**

```text
    title: '执行产线操作(直控)',
// 注释：设置字段 `title`。
```

**源码第 588 行**

```text
    description:
// 注释：设置字段 `description`。
```

**源码第 589 行**

```text
      '★ 直控工具:把一句人话翻译成正确的 PLC 操作序列并**直接执行**,不用人工点确认。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 590 行**

```text
      '可用操作:' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 591 行**

```text
      Object.entries(OPERATIONS)
// 注释：调用 Object.entries，把括号中的值作为参数传入。
```

**源码第 592 行**

```text
        .map(([k, v]) => `${k}(${v.title}:${v.desc})`)
// 注释：调用 .map，把括号中的值作为参数传入。
```

**源码第 593 行**

```text
        .join(';') +
// 注释：调用 .join，把括号中的值作为参数传入。
```

**源码第 594 行**

```text
      '。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 595 行**

```text
      '用户说「传送带启动/传送带运行」→ conveyor_start;' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 596 行**

```text
      '「传送带停止」→ conveyor_stop;' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 597 行**

```text
      '「启动产线/开始生产」→ line_start;' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 598 行**

```text
      '「停止产线」→ line_stop;' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 599 行**

```text
      '「释放手动/退出手动模式」→ release_manual。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 600 行**

```text
      '每一步都会等 PLC 回执,返回里逐步给出 status(acked/rejected/timeout)。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 601 行**

```text
      '如实汇报每一步的结果,不要把 rejected/timeout 说成成功。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 602 行**

```text
    inputSchema: {
// 注释：设置字段 `inputSchema`。
```

**源码第 603 行**

```text
      lineId: z.string().default('line-01').describe('产线编码,默认 line-01'),
// 注释：设置字段 `lineId`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 604 行**

```text
      deviceId: z.string().default('robot-01').describe('设备编码,默认 robot-01'),
// 注释：设置字段 `deviceId`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 605 行**

```text
      operation: z.enum(Object.keys(OPERATIONS)).describe('要执行的操作'),
// 注释：设置字段 `operation`。 关键字：`enum`＝定义枚举。
```

**源码第 606 行**

```text
      operator: z.string().optional().describe('操作者标识,例如 ai:feishu:ou_xxx,会写进审计'),
// 注释：设置字段 `operator`。
```

**源码第 607 行**

```text
      dryRun: z.boolean().default(false).describe('只预演不下发(排查/确认流程用)'),
// 注释：设置字段 `dryRun`。 关键字：`default`＝指定默认导出或默认分支；`false`＝布尔假值。
```

**源码第 608 行**

```text
    },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 609 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 610 行**

```text
  async ({ lineId, deviceId, operation, operator, dryRun }) => ({
// 注释：调用 async；括号中的表达式是传入的参数。 关键字：`async`＝声明异步函数。
```

**源码第 611 行**

```text
    content: [
// 注释：设置字段 `content`。
```

**源码第 612 行**

```text
      {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 613 行**

```text
        type: 'text',
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 614 行**

```text
        text: JSON.stringify(
// 注释：设置字段 `text`。
```

**源码第 615 行**

```text
          await runOperation(operation, {
// 注释：调用 runOperation，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 616 行**

```text
            lineId: lineId || 'line-01',
// 注释：设置字段 `lineId`。
```

**源码第 617 行**

```text
            deviceId: deviceId || 'robot-01',
// 注释：设置字段 `deviceId`。
```

**源码第 618 行**

```text
            operator: operator || 'ai:line-twin',
// 注释：设置字段 `operator`。
```

**源码第 619 行**

```text
            dryRun: Boolean(dryRun),
// 注释：设置字段 `dryRun`。
```

**源码第 620 行**

```text
          }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 621 行**

```text
        ),
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 622 行**

```text
      },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 623 行**

```text
    ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 624 行**

```text
  }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 625 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 627 行**

```text
server.registerTool(
// 注释：调用 server.registerTool，把括号中的值作为参数传入。
```

**源码第 628 行**

```text
  'execute_action',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 629 行**

```text
  {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 630 行**

```text
    title: '下发单条控制指令(直控)',
// 注释：设置字段 `title`。
```

**源码第 631 行**

```text
    description:
// 注释：设置字段 `description`。
```

**源码第 632 行**

```text
      '★ 直控工具:直接下发**一条**控制指令并等 PLC 回执。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 633 行**

```text
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 634 行**

```text
      (contract.paramEnums.mode_set
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 635 行**

```text
        ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') + ';'
// 注释：调用 Object.keys；括号中的表达式是传入的参数。
```

**源码第 636 行**

```text
        : '') +
// 注释：条件不满足时拼接空字符串，然后继续组装提示文本。
```

**源码第 637 行**

```text
      (contract.paramEnums.conveyor
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 638 行**

```text
        ? 'conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') + ';'
// 注释：调用 Object.keys；括号中的表达式是传入的参数。
```

**源码第 639 行**

```text
        : '') +
// 注释：条件不满足时拼接空字符串，然后继续组装提示文本。
```

**源码第 640 行**

```text
      '「启动产线」用 type=start;「停止」用 type=stop;' +
// 注释：把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
```

**源码第 641 行**

```text
      '「获取手动」type=mode_set,params.action=acquire;' +
// 注释：把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
```

**源码第 642 行**

```text
      '「释放手动」type=mode_set,params.action=release;' +
// 注释：把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
```

**源码第 643 行**

```text
      '「传送带正转/停止」type=conveyor,params.action=forward|stop。' +
// 注释：把这一段文字与下一段拼接。 关键字：type＝定义类型别名。
```

**源码第 644 行**

```text
      '除非用户明确要单步,否则优先用 run_operation —— 它会按正确的顺序执行。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 645 行**

```text
    inputSchema: {
// 注释：设置字段 `inputSchema`。
```

**源码第 646 行**

```text
      lineId: z.string().default('line-01'),
// 注释：设置字段 `lineId`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 647 行**

```text
      deviceId: z.string().default('robot-01'),
// 注释：设置字段 `deviceId`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 648 行**

```text
      type: z.enum(contract.executableTypes),
// 注释：设置字段 `type`。 关键字：`enum`＝定义枚举。
```

**源码第 649 行**

```text
      params: z.record(z.unknown()).optional(),
// 注释：设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 650 行**

```text
      operator: z.string().optional(),
// 注释：设置字段 `operator`。
```

**源码第 651 行**

```text
      dryRun: z.boolean().default(false),
// 注释：设置字段 `dryRun`。 关键字：`default`＝指定默认导出或默认分支；`false`＝布尔假值。
```

**源码第 652 行**

```text
    },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 653 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 654 行**

```text
  async ({ lineId, deviceId, type, params, operator, dryRun }) => {
// 注释：调用 async；括号中的表达式是传入的参数。 关键字：`async`＝声明异步函数。
```

**源码第 655 行**

```text
    const enums = contract.paramEnums[type];
// 注释：声明 enums，初始值由 contract.paramEnums[type] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 656 行**

```text
    if (enums) {
// 注释：判断 if (enums) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 657 行**

```text
      const action = (params || {}).action;
// 注释：声明 action，初始值由 (params || {}).action 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 658 行**

```text
      if (typeof action !== 'string' || !(action in enums)) {
// 注释：判断 if (typeof action !== 'string' || !(action in enums)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型；`in`＝遍历键或判断成员。
```

**源码第 659 行**

```text
        return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 660 行**

```text
          content: [
// 注释：设置字段 `content`。
```

**源码第 661 行**

```text
            {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 662 行**

```text
              type: 'text',
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 663 行**

```text
              text: JSON.stringify({
// 注释：设置字段 `text`。
```

**源码第 664 行**

```text
                ok: false,
// 注释：设置字段 `ok`。 关键字：`false`＝布尔假值。
```

**源码第 665 行**

```text
                error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
// 注释：设置字段 `error`。 关键字：type＝定义类型别名。
```

**源码第 666 行**

```text
              }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 667 行**

```text
            },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 668 行**

```text
          ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 669 行**

```text
        };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 670 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 671 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 672 行**

```text
    if (dryRun) {
// 注释：判断 if (dryRun) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 673 行**

```text
      const state = await currentState(lineId || 'line-01');
// 注释：声明 state，初始值由 await currentState(lineId || 'line-01') 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 674 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 675 行**

```text
        content: [
// 注释：设置字段 `content`。
```

**源码第 676 行**

```text
          {
// 注释：开始一个对象字面量，后续行逐项填写字段。
```

**源码第 677 行**

```text
            type: 'text',
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 678 行**

```text
            text: JSON.stringify({
// 注释：设置字段 `text`。
```

**源码第 679 行**

```text
              ok: true,
// 注释：设置字段 `ok`。 关键字：`true`＝布尔真值。
```

**源码第 680 行**

```text
              dryRun: true,
// 注释：设置字段 `dryRun`。 关键字：`true`＝布尔真值。
```

**源码第 681 行**

```text
              type,
// 注释：把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
```

**源码第 682 行**

```text
              params: params || {},
// 注释：设置字段 `params`。
```

**源码第 683 行**

```text
              stateBefore: state,
// 注释：设置字段 `stateBefore`。
```

**源码第 684 行**

```text
              precondition: preconditionError(type, (params || {}).action, state),
// 注释：设置字段 `precondition`。 关键字：type＝定义类型别名。
```

**源码第 685 行**

```text
              note: 'dryRun:只预演,没有下发任何指令',
// 注释：设置字段 `note`。
```

**源码第 686 行**

```text
            }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 687 行**

```text
          },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 688 行**

```text
        ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 689 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 690 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 691 行**

```text
    const step = await execStep({
// 注释：声明 step，初始值由 await execStep({ 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 692 行**

```text
      lineId: lineId || 'line-01',
// 注释：设置字段 `lineId`。
```

**源码第 693 行**

```text
      deviceId: deviceId || 'robot-01',
// 注释：设置字段 `deviceId`。
```

**源码第 694 行**

```text
      type,
// 注释：把变量 type 作为同名对象字段加入当前对象。 关键字：type＝定义类型别名。
```

**源码第 695 行**

```text
      params: params || {},
// 注释：设置字段 `params`。
```

**源码第 696 行**

```text
      operator: operator || 'ai:line-twin',
// 注释：设置字段 `operator`。
```

**源码第 697 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 698 行**

```text
    return { content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] };
// 注释：返回 { content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 699 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 700 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 704 行**

```text
async function main() {
// 注释：定义函数 `main`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 705 行**

```text
  const transport = new StdioServerTransport();
// 注释：声明 transport，初始值由 new StdioServerTransport() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 706 行**

```text
  await server.connect(transport);
// 注释：调用 server.connect，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 707 行**

```text
  log(`已启动;proposal 频道=${PROPOSAL_CHANNEL},ttl=${PROPOSAL_TTL_SEC}s`);
// 注释：调用 log；括号中的表达式是传入的参数。
```

**源码第 708 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 710 行**

```text
main().catch((e) => {
// 注释：调用 main；括号中的表达式是传入的参数。 关键字：`catch`＝捕获异常。
```

**源码第 711 行**

```text
  log('致命错误:', e && e.stack ? e.stack : e);
// 注释：调用 log；括号中的表达式是传入的参数。
```

**源码第 712 行**

```text
  process.exit(1);
// 注释：调用 process.exit，把括号中的值作为参数传入。
```

**源码第 713 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```
