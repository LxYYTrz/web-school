# server/mcp/line-twin-mcp.js 逐行说明

[打开源码](../../../../server/mcp/line-twin-mcp.js) · 713 行 · 571 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>#!/usr/bin/env node</code> | 指定运行这个脚本时使用的解释器。 |
| 2 | <code>'use strict';</code> | 续写当前表达式、对象、类型或调用。 |
| 27 | <code>const path = require('path');</code> | 声明变量 `path` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 28 | <code>const fs = require('fs');</code> | 声明变量 `fs` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 29 | <code>const crypto = require('crypto');</code> | 声明变量 `crypto` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 32 | <code>const SERVER_ROOT = path.resolve(__dirname, '..');</code> | 声明变量 `SERVER_ROOT` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 33 | <code>require(path.join(SERVER_ROOT, 'node_modules', 'dotenv')).config({</code> | 定义或调用 `require`，参数由括号给出。 |
| 34 | <code>path: path.join(SERVER_ROOT, '.env'),</code> | 设置字段 `path`。 |
| 35 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 37 | <code>const { McpServer } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/mcp.js'));</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 38 | <code>const { StdioServerTransport } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/stdio.js'));</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 39 | <code>const { z } = require(path.join(SERVER_ROOT, 'node_modules', 'zod'));</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 40 | <code>const { Pool } = require(path.join(SERVER_ROOT, 'node_modules', 'pg'));</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 41 | <code>const Redis = require(path.join(SERVER_ROOT, 'node_modules', 'ioredis'));</code> | 声明变量 `Redis` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 45 | <code>const contract = require(path.join(SERVER_ROOT, 'src', 'command', 'command-contract.json'));</code> | 声明变量 `contract` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 47 | <code>const REDIS_URL = process.env.REDIS_URL &#124;&#124; 'redis://localhost:6379';</code> | 声明变量 `REDIS_URL` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 48 | <code>const DATABASE_URL =</code> | 声明变量 `DATABASE_URL` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 49 | <code>process.env.DATABASE_URL &#124;&#124; 'postgres://postgres:postgres123@localhost:5432/linetwin';</code> | 续写当前表达式、对象、类型或调用。 |
| 52 | <code>const PROPOSAL_TTL_SEC = 900;</code> | 声明变量 `PROPOSAL_TTL_SEC` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 53 | <code>const PROPOSAL_CHANNEL = 'ai:proposal';</code> | 声明变量 `PROPOSAL_CHANNEL` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 55 | <code>function log(...args) {</code> | 定义函数 `log`。 关键字：`function`＝定义函数。 |
| 57 | <code>process.stderr.write('[line-twin-mcp] ' + args.join(' ') + '\n');</code> | 调用函数、设置值或更新状态。 |
| 58 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 60 | <code>const pool = new Pool({ connectionString: DATABASE_URL });</code> | 声明变量 `pool` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 61 | <code>const redis = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });</code> | 声明变量 `redis` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例；`false`＝布尔假值。 |
| 62 | <code>redis.on('error', (e) =&gt; log('redis error:', e.message));</code> | 调用函数、设置值或更新状态。 |
| 69 | <code>const lineIdCache = new Map(); // code -&gt; { id, name } &#124; null,60s 过期(对齐 CatalogService)</code> | 声明变量 `lineIdCache` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 70 | <code>async function resolveLine(code) {</code> | 定义函数 `resolveLine`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 71 | <code>const hit = lineIdCache.get(code);</code> | 声明变量 `hit` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 72 | <code>if (hit &amp;&amp; Date.now() - hit.at &lt; 60000) return hit.row;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 73 | <code>const { rows } = await pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 74 | <code>'SELECT id, code, name FROM production_lines WHERE code = $1 LIMIT 1', [code]);</code> | 续写当前表达式、对象、类型或调用。 |
| 75 | <code>lineIdCache.set(code, { at: Date.now(), row: rows[0] &#124;&#124; null });</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 76 | <code>if (!rows[0]) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 77 | <code>const { rows: all } = await pool.query('SELECT code FROM production_lines ORDER BY id');</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 78 | <code>throw new Error(`未知产线编码 ${code}。可用:${all.map((r) =&gt; r.code).join('&#124;') &#124;&#124; '(库中没有任何产线)'}`);</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 79 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 80 | <code>return rows[0];</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 81 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 83 | <code>const server = new McpServer(</code> | 声明变量 `server` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 84 | <code>{ name: 'line-twin', version: '1.1.0' },</code> | 续写当前表达式、对象、类型或调用。 |
| 85 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 86 | <code>capabilities: { tools: {} },</code> | 设置字段 `capabilities`。 |
| 87 | <code>instructions:</code> | 设置字段 `instructions`。 |
| 88 | <code>'这是产线(line-01)的数据源与控制通道,分两类工具:' +</code> | 续写当前表达式、对象、类型或调用。 |
| 89 | <code>'【查询类(只读)】get_line_snapshot / get_line_history / get_recent_events;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 90 | <code>'【控制类】run_operation / execute_action(直控,直接下发不等人工确认)、' +</code> | 续写当前表达式、对象、类型或调用。 |
| 91 | <code>'propose_action(只提交建议,等人点确认)。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 92 | <code>'★ 选哪条路,取决于你所在的通道:' +</code> | 续写当前表达式、对象、类型或调用。 |
| 93 | <code>'  · 你在飞书/Lark 里(系统提示说你在 Feishu 工作区,用户在跟你直接对话)→ ' +</code> | 续写当前表达式、对象、类型或调用。 |
| 94 | <code>'    用 run_operation 直控。用户说「传送带启动&#124;传送带运行&#124;手动跑一下传送带」→ conveyor_start;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 95 | <code>'    「传送带停止」→ conveyor_stop;「启动产线&#124;开始生产&#124;开工」→ line_start;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 96 | <code>'    「停止产线&#124;停机」→ line_stop;「释放手动&#124;退出手动」→ release_manual。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 97 | <code>'  · 你在网页抽屉里(系统提示说明该通道只允许提交建议)→ 用 propose_action,不要用直控工具。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 98 | <code>'run_operation 内部会按 PLC 联锁要求的顺序执行(传送带必须:停止 → 获取手动 → 正转),' +</code> | 续写当前表达式、对象、类型或调用。 |
| 99 | <code>'并逐步返回回执。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 100 | <code>'不要凭空猜测状态:任何结论都应先调用工具查证;执行结果要如实汇报,rejected/timeout 不许说成成功。',</code> | 续写当前表达式、对象、类型或调用。 |
| 101 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 102 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 115 | <code>async function getLineSnapshot(lineId) {</code> | 定义函数 `getLineSnapshot`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 116 | <code>const [status, edge] = await redis.mget(`rt:${lineId}:status`, `rt:${lineId}:edge`);</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 117 | <code>const keys = await redis.keys(`rt:${lineId}:robot:*`);</code> | 声明变量 `keys` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 118 | <code>const frames = keys.length ? await redis.mget(keys) : [];</code> | 声明变量 `frames` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 119 | <code>const robots = {};</code> | 声明变量 `robots` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 120 | <code>keys.forEach((k, i) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 121 | <code>const deviceId = k.split(':').pop();</code> | 声明变量 `deviceId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 122 | <code>robots[deviceId] = frames[i] ? JSON.parse(frames[i]) : null;</code> | 续写当前表达式、对象、类型或调用。 关键字：`null`＝空值。 |
| 123 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 125 | <code>const state = status ? JSON.parse(status) : null;</code> | 声明变量 `state` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 126 | <code>const edgeState = edge ? JSON.parse(edge) : null;</code> | 声明变量 `edgeState` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 127 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 128 | <code>lineId,</code> | 续写当前表达式、对象、类型或调用。 |
| 129 | <code>readAt: Date.now(),</code> | 设置字段 `readAt`。 |
| 130 | <code>status: state,</code> | 设置字段 `status`。 |
| 131 | <code>edge: edgeState,</code> | 设置字段 `edge`。 |
| 132 | <code>robots,</code> | 续写当前表达式、对象、类型或调用。 |
| 133 | <code>freshness: {</code> | 设置字段 `freshness`。 |
| 134 | <code>statusMs: state ? Date.now() - (state.ts ?? 0) : null,</code> | 设置字段 `statusMs`。 关键字：`null`＝空值。 |
| 135 | <code>edgeMs: edgeState ? Date.now() - (edgeState.ts ?? 0) : null,</code> | 设置字段 `edgeMs`。 关键字：`null`＝空值。 |
| 136 | <code>note: 'null 表示该数据已超过 TTL 未更新(空闲产线属正常),不等于设备离线',</code> | 设置字段 `note`。 |
| 137 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 138 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 139 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 141 | <code>async function getLineHistory(lineCode, minutes, limit) {</code> | 定义函数 `getLineHistory`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 142 | <code>const line = await resolveLine(lineCode);</code> | 声明变量 `line` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 143 | <code>const { rows } = await pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 144 | <code>`SELECT time, state, product_code, good_count, ng_count, beat_ms</code> | 读取数据。 关键字：`SELECT`＝读取指定列。 |
| 145 | <code>FROM line_status_history</code> | 指定读取来源表。 关键字：`FROM`＝指定查询来源表。 |
| 146 | <code>WHERE line_id = $1 AND "time" &gt; now() - ($2 &#124;&#124; ' minutes')::interval</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与。 |
| 147 | <code>ORDER BY "time" DESC</code> | 指定结果排序。 关键字：`ORDER`＝指定排序；`BY`＝指定分组或排序字段。 |
| 148 | <code>LIMIT $3`,</code> | 限制结果行数。 关键字：`LIMIT`＝限制返回行数。 |
| 149 | <code>[line.id, String(minutes), limit],</code> | 续写当前表达式、对象、类型或调用。 |
| 150 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 151 | <code>return { lineId: line.code, lineName: line.name, minutes, count: rows.length, rows };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 152 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 154 | <code>async function getRecentEvents(lineCode, hours, onlyProblems, limit) {</code> | 定义函数 `getRecentEvents`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 156 | <code>const line = await resolveLine(lineCode);</code> | 声明变量 `line` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 157 | <code>const { rows } = await pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 158 | <code>`SELECT time, device_id, type, level, code, message, payload</code> | 读取数据。 关键字：`SELECT`＝读取指定列。 |
| 159 | <code>FROM production_events</code> | 指定读取来源表。 关键字：`FROM`＝指定查询来源表。 |
| 160 | <code>WHERE line_id = $1</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行。 |
| 161 | <code>AND "time" &gt; now() - ($2 &#124;&#124; ' hours')::interval</code> | 叠加筛选条件。 关键字：`AND`＝逻辑与。 |
| 162 | <code>AND ($3::boolean IS NOT TRUE OR level IN ('warning','critical'))</code> | 叠加筛选条件。 关键字：`AND`＝逻辑与；`IS`＝检查空值或布尔值；`NOT`＝逻辑否定；`OR`＝逻辑或；`IN`＝检查是否属于集合。 |
| 163 | <code>ORDER BY "time" DESC</code> | 指定结果排序。 关键字：`ORDER`＝指定排序；`BY`＝指定分组或排序字段。 |
| 164 | <code>LIMIT $4`,</code> | 限制结果行数。 关键字：`LIMIT`＝限制返回行数。 |
| 165 | <code>[line.id, String(hours), onlyProblems, limit],</code> | 续写当前表达式、对象、类型或调用。 |
| 166 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 167 | <code>return { lineId: line.code, hours, onlyProblems, count: rows.length, rows };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 168 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 176 | <code>async function proposeAction(lineId, deviceId, type, params, reason) {</code> | 定义函数 `proposeAction`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 177 | <code>if (!contract.allowedTypes.includes(type)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 178 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 179 | <code>ok: false,</code> | 设置字段 `ok`。 关键字：`false`＝布尔假值。 |
| 180 | <code>error: `type 不在白名单。可选:${contract.allowedTypes.join('&#124;')}`,</code> | 设置字段 `error`。 |
| 181 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 182 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 185 | <code>if (!contract.executableTypes.includes(type)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 186 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 187 | <code>ok: false,</code> | 设置字段 `ok`。 关键字：`false`＝布尔假值。 |
| 188 | <code>error: `${type} 在现场 PLC 无对应寄存器,edge 一定会回 rejected,不要建议该指令。可执行:${contract.executableTypes.join('&#124;')}`,</code> | 设置字段 `error`。 |
| 189 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 190 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 192 | <code>const enums = contract.paramEnums[type];</code> | 声明变量 `enums` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 193 | <code>if (enums) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 194 | <code>const action = (params &#124;&#124; {}).action;</code> | 声明变量 `action` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 195 | <code>if (typeof action !== 'string' &#124;&#124; !(action in enums)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型；`in`＝遍历键或判断成员。 |
| 196 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 197 | <code>ok: false,</code> | 设置字段 `ok`。 关键字：`false`＝布尔假值。 |
| 198 | <code>error: `${type}.params.action 必须是 ${Object.keys(enums).join('&#124;')},收到 ${JSON.stringify(action)}`,</code> | 设置字段 `error`。 |
| 199 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 200 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 201 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 203 | <code>const proposal = {</code> | 声明变量 `proposal` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 204 | <code>id: 'p-' + crypto.randomUUID(),</code> | 设置字段 `id`。 |
| 205 | <code>lineId,</code> | 续写当前表达式、对象、类型或调用。 |
| 206 | <code>deviceId,</code> | 续写当前表达式、对象、类型或调用。 |
| 207 | <code>type,</code> | 续写当前表达式、对象、类型或调用。 |
| 208 | <code>params: params &#124;&#124; {},</code> | 设置字段 `params`。 |
| 209 | <code>reason,</code> | 续写当前表达式、对象、类型或调用。 |
| 210 | <code>status: 'pending',</code> | 设置字段 `status`。 |
| 211 | <code>createdAt: Date.now(),</code> | 设置字段 `createdAt`。 |
| 212 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 214 | <code>await redis.set(`ai:proposal:${proposal.id}`, JSON.stringify(proposal), 'EX', PROPOSAL_TTL_SEC);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 216 | <code>await redis.publish(PROPOSAL_CHANNEL, JSON.stringify(proposal));</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 218 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 219 | <code>ok: true,</code> | 设置字段 `ok`。 关键字：`true`＝布尔真值。 |
| 220 | <code>proposalId: proposal.id,</code> | 设置字段 `proposalId`。 |
| 221 | <code>instruction:</code> | 设置字段 `instruction`。 |
| 222 | <code>'建议已提交,会由值班人在 UI 上人工确认后才会真正下发。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 223 | <code>'请在回复里说明这条建议的理由和预期影响,不要声称已经执行。',</code> | 续写当前表达式、对象、类型或调用。 |
| 224 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 225 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 242 | <code>const MACHINE_TOKEN = process.env.MACHINE_COMMAND_TOKEN &#124;&#124; '';</code> | 声明变量 `MACHINE_TOKEN` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 243 | <code>const API_BASE = (process.env.LINE_TWIN_API_BASE &#124;&#124; 'http://127.0.0.1:3000').replace(/\/+$/, '');</code> | 声明变量 `API_BASE` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 245 | <code>const ACK_WAIT_MS = Number(process.env.MACHINE_ACK_TIMEOUT_MS &#124;&#124; 18000);</code> | 声明变量 `ACK_WAIT_MS` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 247 | <code>const STATE_WAIT_MS = Number(process.env.MACHINE_STATE_TIMEOUT_MS &#124;&#124; 10000);</code> | 声明变量 `STATE_WAIT_MS` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 249 | <code>const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, ms));</code> | 声明变量 `sleep` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 252 | <code>function machineChannelReady() {</code> | 定义函数 `machineChannelReady`。 关键字：`function`＝定义函数。 |
| 253 | <code>return Boolean(MACHINE_TOKEN);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 254 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 257 | <code>async function machineIssue({ lineId, deviceId, type, params, operator }) {</code> | 定义函数 `machineIssue`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 258 | <code>if (!machineChannelReady()) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 259 | <code>return { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 260 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 261 | <code>let res;</code> | 声明变量 `res` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 262 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 263 | <code>res = await fetch(`${API_BASE}/api/machine/commands`, {</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 264 | <code>method: 'POST',</code> | 设置字段 `method`。 |
| 265 | <code>headers: { 'Content-Type': 'application/json', 'x-machine-token': MACHINE_TOKEN },</code> | 设置字段 `headers`。 |
| 266 | <code>body: JSON.stringify({ lineId, deviceId, type, params: params &#124;&#124; {}, operator }),</code> | 设置字段 `body`。 |
| 267 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 268 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 269 | <code>return { ok: false, error: `调用后端失败:${e.message}` };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 270 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 271 | <code>const body = await res.json().catch(() =&gt; ({}));</code> | 声明变量 `body` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`catch`＝捕获异常。 |
| 272 | <code>if (!res.ok) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 273 | <code>return { ok: false, error: body?.msg &#124;&#124; body?.message &#124;&#124; `后端返回 HTTP ${res.status}` };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 274 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 275 | <code>if (!body?.ok) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 276 | <code>return { ok: false, error: body?.error &#124;&#124; '后端拒绝下发' };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 277 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 278 | <code>return { ok: true, cmdId: body.cmdId };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 279 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 285 | <code>async function waitAck(cmdId, timeoutMs = ACK_WAIT_MS) {</code> | 定义函数 `waitAck`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 286 | <code>const deadline = Date.now() + timeoutMs;</code> | 声明变量 `deadline` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 287 | <code>while (Date.now() &lt; deadline) {</code> | 控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。 |
| 288 | <code>const { rows } = await pool.query(</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 289 | <code>`SELECT status, ack_payload, acked_at FROM control_commands WHERE idempotency_key = $1`,</code> | 读取数据。 |
| 290 | <code>[cmdId],</code> | 续写当前表达式、对象、类型或调用。 |
| 291 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 292 | <code>const row = rows[0];</code> | 声明变量 `row` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 293 | <code>if (row &amp;&amp; row.status !== 'pending' &amp;&amp; row.status !== 'sent') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 294 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 295 | <code>status: row.status,</code> | 设置字段 `status`。 |
| 296 | <code>message: row.ack_payload?.message &#124;&#124; '',</code> | 设置字段 `message`。 |
| 297 | <code>ackedAt: row.acked_at,</code> | 设置字段 `ackedAt`。 |
| 298 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 299 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 300 | <code>await sleep(400);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 301 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 302 | <code>return { status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 303 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 306 | <code>async function currentState(lineId) {</code> | 定义函数 `currentState`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 307 | <code>const raw = await redis.get(`rt:${lineId}:status`);</code> | 声明变量 `raw` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 308 | <code>if (!raw) return null;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 309 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 310 | <code>return JSON.parse(raw)?.state ?? null;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 311 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 312 | <code>return null;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 313 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 314 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 317 | <code>async function waitState(lineId, wanted, timeoutMs = STATE_WAIT_MS) {</code> | 定义函数 `waitState`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 318 | <code>const list = Array.isArray(wanted) ? wanted : [wanted];</code> | 声明变量 `list` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 319 | <code>const deadline = Date.now() + timeoutMs;</code> | 声明变量 `deadline` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 320 | <code>let last = null;</code> | 声明变量 `last` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。 |
| 321 | <code>while (Date.now() &lt; deadline) {</code> | 控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。 |
| 322 | <code>last = await currentState(lineId);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 323 | <code>if (last &amp;&amp; list.includes(last)) return { reached: true, state: last };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 324 | <code>await sleep(500);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 325 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 326 | <code>return { reached: false, state: last };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 327 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 333 | <code>function preconditionError(type, action, state) {</code> | 定义函数 `preconditionError`。 关键字：`function`＝定义函数。 |
| 334 | <code>if (!state) return '读不到当前产线状态(快照为空),拒绝盲发指令';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 335 | <code>if (state === 'init_error') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 336 | <code>return '产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 337 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 338 | <code>if (type === 'mode_set') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 339 | <code>if (action === 'acquire') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 340 | <code>return state === 'stopped' ? null : `获取手动模式只能在 stopped 状态执行,当前是 ${state}`;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 341 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 342 | <code>if (action === 'release') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 343 | <code>return state === 'manual_mode' ? null : `释放手动只能在 manual_mode 状态执行,当前是 ${state}`;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 344 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 345 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 346 | <code>if (type === 'conveyor') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 347 | <code>return state === 'manual_mode' ? null : `传送带只能在手动模式(manual_mode)下运行,当前是 ${state}`;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 348 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 349 | <code>if (type === 'start') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 350 | <code>if (state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 351 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 352 | <code>return null;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 353 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 358 | <code>async function execStep({ lineId, deviceId, type, params, operator, waitFor, skipPrecondition }) {</code> | 定义函数 `execStep`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 359 | <code>const action = params?.action;</code> | 声明变量 `action` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 360 | <code>const before = await currentState(lineId);</code> | 声明变量 `before` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 361 | <code>if (!skipPrecondition) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 362 | <code>const bad = preconditionError(type, action, before);</code> | 声明变量 `bad` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 363 | <code>if (bad) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 364 | <code>return { type, params: params &#124;&#124; {}, ok: false, status: 'skipped', message: bad, stateBefore: before };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 365 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 366 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 367 | <code>const issued = await machineIssue({ lineId, deviceId, type, params, operator });</code> | 声明变量 `issued` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 368 | <code>if (!issued.ok) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 369 | <code>return { type, params: params &#124;&#124; {}, ok: false, status: 'failed', message: issued.error, stateBefore: before };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 370 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 371 | <code>const ack = await waitAck(issued.cmdId);</code> | 声明变量 `ack` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 372 | <code>const step = {</code> | 声明变量 `step` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 373 | <code>type,</code> | 续写当前表达式、对象、类型或调用。 |
| 374 | <code>params: params &#124;&#124; {},</code> | 设置字段 `params`。 |
| 375 | <code>cmdId: issued.cmdId,</code> | 设置字段 `cmdId`。 |
| 376 | <code>ok: ack.status === 'acked',</code> | 设置字段 `ok`。 |
| 377 | <code>status: ack.status,</code> | 设置字段 `status`。 |
| 378 | <code>message: ack.message,</code> | 设置字段 `message`。 |
| 379 | <code>stateBefore: before,</code> | 设置字段 `stateBefore`。 |
| 380 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 381 | <code>if (waitFor &amp;&amp; step.ok) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 382 | <code>const st = await waitState(lineId, waitFor);</code> | 声明变量 `st` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 383 | <code>step.stateAfter = st.state;</code> | 调用函数、设置值或更新状态。 |
| 384 | <code>step.stateReached = st.reached;</code> | 调用函数、设置值或更新状态。 |
| 385 | <code>if (!st.reached) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 386 | <code>step.ok = false;</code> | 调用函数、设置值或更新状态。 关键字：`false`＝布尔假值。 |
| 387 | <code>step.message = `指令已下发并回执,但产线状态没有变成 ${waitFor}(当前 ${st.state})`;</code> | 调用函数、设置值或更新状态。 |
| 388 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 389 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 390 | <code>return step;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 391 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 401 | <code>const OPERATIONS = {</code> | 声明变量 `OPERATIONS` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 402 | <code>conveyor_start: {</code> | 设置字段 `conveyor_start`。 |
| 403 | <code>title: '传送带正转',</code> | 设置字段 `title`。 |
| 404 | <code>desc: '按「停止 → 获取手动模式 → 传送带正转」三步执行(PLC 只允许手动模式下动传送带)',</code> | 设置字段 `desc`。 |
| 405 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 406 | <code>conveyor_stop: { title: '停止传送带', desc: '传送带停止(电平型,写 0)' },</code> | 设置字段 `conveyor_stop`。 |
| 407 | <code>line_start: { title: '启动产线', desc: '必要时先释放手动模式,再启动' },</code> | 设置字段 `line_start`。 |
| 408 | <code>line_stop: { title: '停止产线', desc: '停止信号' },</code> | 设置字段 `line_stop`。 |
| 409 | <code>release_manual: { title: '释放手动模式', desc: '退出手动模式,回到 stopped' },</code> | 设置字段 `release_manual`。 |
| 410 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 412 | <code>async function runOperation(op, { lineId, deviceId, operator, dryRun }) {</code> | 定义函数 `runOperation`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 413 | <code>const meta = OPERATIONS[op];</code> | 声明变量 `meta` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 414 | <code>if (!meta) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 415 | <code>return { ok: false, error: `未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('&#124;')}` };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 416 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 417 | <code>const state0 = await currentState(lineId);</code> | 声明变量 `state0` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 418 | <code>const steps = [];</code> | 声明变量 `steps` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 420 | <code>if (op === 'conveyor_start') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 421 | <code>if (dryRun) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 422 | <code>steps.push({ type: 'stop', params: {} });</code> | 调用函数、设置值或更新状态。 |
| 423 | <code>steps.push({ type: 'mode_set', params: { action: 'acquire' } });</code> | 调用函数、设置值或更新状态。 |
| 424 | <code>steps.push({ type: 'conveyor', params: { action: 'forward' } });</code> | 调用函数、设置值或更新状态。 |
| 425 | <code>return { ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 426 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 427 | <code>steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, waitFor: 'stopped' }));</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 428 | <code>if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 429 | <code>steps.push(</code> | 调用函数、设置值或更新状态。 |
| 430 | <code>await execStep({</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 431 | <code>lineId, deviceId, type: 'mode_set', params: { action: 'acquire' }, operator, waitFor: 'manual_mode',</code> | 续写当前表达式、对象、类型或调用。 |
| 432 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 433 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 434 | <code>if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 435 | <code>steps.push(</code> | 调用函数、设置值或更新状态。 |
| 436 | <code>await execStep({</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 437 | <code>lineId, deviceId, type: 'conveyor', params: { action: 'forward' }, operator,</code> | 续写当前表达式、对象、类型或调用。 |
| 438 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 439 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 440 | <code>} else if (op === 'conveyor_stop') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 441 | <code>if (dryRun) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 442 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 443 | <code>ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,</code> | 设置字段 `ok`。 关键字：`true`＝布尔真值。 |
| 444 | <code>planned: [{ type: 'conveyor', params: { action: 'stop' } }],</code> | 设置字段 `planned`。 |
| 445 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 446 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 448 | <code>steps.push(</code> | 调用函数、设置值或更新状态。 |
| 449 | <code>await execStep({</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 450 | <code>lineId, deviceId, type: 'conveyor', params: { action: 'stop' }, operator, skipPrecondition: true,</code> | 续写当前表达式、对象、类型或调用。 关键字：`true`＝布尔真值。 |
| 451 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 452 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 453 | <code>} else if (op === 'line_start') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 454 | <code>if (dryRun) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 455 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 456 | <code>ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,</code> | 设置字段 `ok`。 关键字：`true`＝布尔真值。 |
| 457 | <code>planned: [</code> | 设置字段 `planned`。 |
| 458 | <code>...(state0 === 'manual_mode' ? [{ type: 'mode_set', params: { action: 'release' } }] : []),</code> | 调用函数、设置值或更新状态。 |
| 459 | <code>{ type: 'start', params: {} },</code> | 续写当前表达式、对象、类型或调用。 |
| 460 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 461 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 462 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 463 | <code>if (state0 === 'manual_mode') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 464 | <code>steps.push(</code> | 调用函数、设置值或更新状态。 |
| 465 | <code>await execStep({</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 466 | <code>lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped',</code> | 续写当前表达式、对象、类型或调用。 |
| 467 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 468 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 469 | <code>if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 470 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 471 | <code>steps.push(await execStep({ lineId, deviceId, type: 'start', params: {}, operator }));</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 472 | <code>} else if (op === 'line_stop') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 473 | <code>if (dryRun) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 474 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 475 | <code>ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,</code> | 设置字段 `ok`。 关键字：`true`＝布尔真值。 |
| 476 | <code>planned: [{ type: 'stop', params: {} }],</code> | 设置字段 `planned`。 |
| 477 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 478 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 479 | <code>steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, skipPrecondition: true }));</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成；`true`＝布尔真值。 |
| 480 | <code>} else if (op === 'release_manual') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 481 | <code>if (dryRun) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 482 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 483 | <code>ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,</code> | 设置字段 `ok`。 关键字：`true`＝布尔真值。 |
| 484 | <code>planned: [{ type: 'mode_set', params: { action: 'release' } }],</code> | 设置字段 `planned`。 |
| 485 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 486 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 487 | <code>steps.push(</code> | 调用函数、设置值或更新状态。 |
| 488 | <code>await execStep({ lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped' }),</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 489 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 490 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 492 | <code>const ok = steps.length &gt; 0 &amp;&amp; steps.every((s) =&gt; s.ok);</code> | 声明变量 `ok` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 493 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 494 | <code>ok,</code> | 续写当前表达式、对象、类型或调用。 |
| 495 | <code>operation: op,</code> | 设置字段 `operation`。 |
| 496 | <code>title: meta.title,</code> | 设置字段 `title`。 |
| 497 | <code>stateBefore: state0,</code> | 设置字段 `stateBefore`。 |
| 498 | <code>stateAfter: await currentState(lineId),</code> | 设置字段 `stateAfter`。 关键字：`await`＝等待异步操作完成。 |
| 499 | <code>steps,</code> | 续写当前表达式、对象、类型或调用。 |
| 500 | <code>summary: steps.map((s) =&gt; `${s.type}${s.params?.action ? ':' + s.params.action : ''} → ${s.status}`).join(' , '),</code> | 设置字段 `summary`。 |
| 501 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 502 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 508 | <code>const READ_ONLY = { readOnlyHint: true };</code> | 声明变量 `READ_ONLY` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`true`＝布尔真值。 |
| 510 | <code>server.registerTool(</code> | 调用函数、设置值或更新状态。 |
| 511 | <code>'get_line_snapshot',</code> | 续写当前表达式、对象、类型或调用。 |
| 512 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 513 | <code>title: '产线实时快照',</code> | 设置字段 `title`。 |
| 514 | <code>description:</code> | 设置字段 `description`。 |
| 515 | <code>'读取产线当前实时状态:产线状态机、边缘网关在线情况、各机器人关节角。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 516 | <code>'注意 status/edge/robots 中出现 null 表示该数据超过 TTL 未刷新(空闲产线正常),不代表设备故障。',</code> | 续写当前表达式、对象、类型或调用。 |
| 517 | <code>inputSchema: { lineId: z.string().describe('产线编码,例如 line-01') },</code> | 设置字段 `inputSchema`。 |
| 518 | <code>annotations: READ_ONLY,</code> | 设置字段 `annotations`。 |
| 519 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 520 | <code>async ({ lineId }) =&gt; ({ content: [{ type: 'text', text: JSON.stringify(await getLineSnapshot(lineId)) }] }),</code> | 定义或调用 `async`，参数由括号给出。 关键字：`async`＝声明异步函数；`await`＝等待异步操作完成。 |
| 521 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 523 | <code>server.registerTool(</code> | 调用函数、设置值或更新状态。 |
| 524 | <code>'get_line_history',</code> | 续写当前表达式、对象、类型或调用。 |
| 525 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 526 | <code>title: '产线状态历史',</code> | 设置字段 `title`。 |
| 527 | <code>description: '按时间倒序读取产线状态变化历史,用于回答「刚才发生了什么」「什么时候停的」。',</code> | 设置字段 `description`。 |
| 528 | <code>inputSchema: {</code> | 设置字段 `inputSchema`。 |
| 529 | <code>lineId: z.string(),</code> | 设置字段 `lineId`。 |
| 530 | <code>minutes: z.number().int().min(1).max(10080).default(60).describe('回溯分钟数,默认 60'),</code> | 设置字段 `minutes`。 关键字：`default`＝指定默认导出或默认分支。 |
| 531 | <code>limit: z.number().int().min(1).max(500).default(100),</code> | 设置字段 `limit`。 关键字：`default`＝指定默认导出或默认分支。 |
| 532 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 533 | <code>annotations: READ_ONLY,</code> | 设置字段 `annotations`。 |
| 534 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 535 | <code>async ({ lineId, minutes, limit }) =&gt; ({</code> | 定义或调用 `async`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 536 | <code>content: [{ type: 'text', text: JSON.stringify(await getLineHistory(lineId, minutes ?? 60, limit ?? 100)) }],</code> | 设置字段 `content`。 关键字：`await`＝等待异步操作完成。 |
| 537 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 538 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 540 | <code>server.registerTool(</code> | 调用函数、设置值或更新状态。 |
| 541 | <code>'get_recent_events',</code> | 续写当前表达式、对象、类型或调用。 |
| 542 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 543 | <code>title: '近期报警与事件',</code> | 设置字段 `title`。 |
| 544 | <code>description: '读取生产事件流。排查故障时通常把 onlyProblems 设为 true,只看 warning/critical。',</code> | 设置字段 `description`。 |
| 545 | <code>inputSchema: {</code> | 设置字段 `inputSchema`。 |
| 546 | <code>lineId: z.string(),</code> | 设置字段 `lineId`。 |
| 547 | <code>hours: z.number().int().min(1).max(168).default(24),</code> | 设置字段 `hours`。 关键字：`default`＝指定默认导出或默认分支。 |
| 548 | <code>onlyProblems: z.boolean().default(true).describe('只看 warning/critical'),</code> | 设置字段 `onlyProblems`。 关键字：`default`＝指定默认导出或默认分支；`true`＝布尔真值。 |
| 549 | <code>limit: z.number().int().min(1).max(200).default(50),</code> | 设置字段 `limit`。 关键字：`default`＝指定默认导出或默认分支。 |
| 550 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 551 | <code>annotations: READ_ONLY,</code> | 设置字段 `annotations`。 |
| 552 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 553 | <code>async ({ lineId, hours, onlyProblems, limit }) =&gt; ({</code> | 定义或调用 `async`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 554 | <code>content: [</code> | 设置字段 `content`。 |
| 555 | <code>{ type: 'text', text: JSON.stringify(await getRecentEvents(lineId, hours ?? 24, onlyProblems ?? true, limit ?? 50)) },</code> | 续写当前表达式、对象、类型或调用。 关键字：`await`＝等待异步操作完成；`true`＝布尔真值。 |
| 556 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 557 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 558 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 560 | <code>server.registerTool(</code> | 调用函数、设置值或更新状态。 |
| 561 | <code>'propose_action',</code> | 续写当前表达式、对象、类型或调用。 |
| 562 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 563 | <code>title: '提交控制建议(需人工确认)',</code> | 设置字段 `title`。 |
| 564 | <code>description:</code> | 设置字段 `description`。 |
| 565 | <code>'当诊断结论需要改变产线状态时调用本工具提交一条**建议**。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 566 | <code>'它只做校验和登记,不会执行 —— 会在值班人界面上生成一张待确认卡片,人工点击后才真正下发。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 567 | <code>'可执行类型:' + contract.executableTypes.join('&#124;') + '。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 568 | <code>(contract.paramEnums.mode_set ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('&#124;') : '') +</code> | 续写当前表达式、对象、类型或调用。 |
| 569 | <code>(contract.paramEnums.conveyor ? ';conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('&#124;') : '') +</code> | 续写当前表达式、对象、类型或调用。 |
| 570 | <code>'不要为 reset/changeover/alarm_clear 提建议 —— 现场 PLC 没有对应寄存器。',</code> | 续写当前表达式、对象、类型或调用。 |
| 571 | <code>inputSchema: {</code> | 设置字段 `inputSchema`。 |
| 572 | <code>lineId: z.string(),</code> | 设置字段 `lineId`。 |
| 573 | <code>deviceId: z.string().describe('设备编码,例如 robot-01'),</code> | 设置字段 `deviceId`。 |
| 574 | <code>type: z.enum(contract.executableTypes).describe('控制指令类型'),</code> | 设置字段 `type`。 关键字：`enum`＝定义枚举。 |
| 575 | <code>params: z.record(z.unknown()).optional().describe('指令参数,含 action 枚举值'),</code> | 设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 576 | <code>reason: z.string().describe('为什么需要这条操作,会写进 UI 给值班人看,写清楚依据'),</code> | 设置字段 `reason`。 |
| 577 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 578 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 579 | <code>async ({ lineId, deviceId, type, params, reason }) =&gt; ({</code> | 定义或调用 `async`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 580 | <code>content: [{ type: 'text', text: JSON.stringify(await proposeAction(lineId, deviceId, type, params, reason)) }],</code> | 设置字段 `content`。 关键字：`await`＝等待异步操作完成。 |
| 581 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 582 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 584 | <code>server.registerTool(</code> | 调用函数、设置值或更新状态。 |
| 585 | <code>'run_operation',</code> | 续写当前表达式、对象、类型或调用。 |
| 586 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 587 | <code>title: '执行产线操作(直控)',</code> | 设置字段 `title`。 |
| 588 | <code>description:</code> | 设置字段 `description`。 |
| 589 | <code>'★ 直控工具:把一句人话翻译成正确的 PLC 操作序列并**直接执行**,不用人工点确认。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 590 | <code>'可用操作:' +</code> | 续写当前表达式、对象、类型或调用。 |
| 591 | <code>Object.entries(OPERATIONS)</code> | 调用函数、设置值或更新状态。 |
| 592 | <code>.map(([k, v]) =&gt; `${k}(${v.title}:${v.desc})`)</code> | 调用函数、设置值或更新状态。 |
| 593 | <code>.join(';') +</code> | 调用函数、设置值或更新状态。 |
| 594 | <code>'。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 595 | <code>'用户说「传送带启动/传送带运行」→ conveyor_start;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 596 | <code>'「传送带停止」→ conveyor_stop;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 597 | <code>'「启动产线/开始生产」→ line_start;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 598 | <code>'「停止产线」→ line_stop;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 599 | <code>'「释放手动/退出手动模式」→ release_manual。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 600 | <code>'每一步都会等 PLC 回执,返回里逐步给出 status(acked/rejected/timeout)。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 601 | <code>'如实汇报每一步的结果,不要把 rejected/timeout 说成成功。',</code> | 续写当前表达式、对象、类型或调用。 |
| 602 | <code>inputSchema: {</code> | 设置字段 `inputSchema`。 |
| 603 | <code>lineId: z.string().default('line-01').describe('产线编码,默认 line-01'),</code> | 设置字段 `lineId`。 关键字：`default`＝指定默认导出或默认分支。 |
| 604 | <code>deviceId: z.string().default('robot-01').describe('设备编码,默认 robot-01'),</code> | 设置字段 `deviceId`。 关键字：`default`＝指定默认导出或默认分支。 |
| 605 | <code>operation: z.enum(Object.keys(OPERATIONS)).describe('要执行的操作'),</code> | 设置字段 `operation`。 关键字：`enum`＝定义枚举。 |
| 606 | <code>operator: z.string().optional().describe('操作者标识,例如 ai:feishu:ou_xxx,会写进审计'),</code> | 设置字段 `operator`。 |
| 607 | <code>dryRun: z.boolean().default(false).describe('只预演不下发(排查/确认流程用)'),</code> | 设置字段 `dryRun`。 关键字：`default`＝指定默认导出或默认分支；`false`＝布尔假值。 |
| 608 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 609 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 610 | <code>async ({ lineId, deviceId, operation, operator, dryRun }) =&gt; ({</code> | 定义或调用 `async`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 611 | <code>content: [</code> | 设置字段 `content`。 |
| 612 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 613 | <code>type: 'text',</code> | 设置字段 `type`。 |
| 614 | <code>text: JSON.stringify(</code> | 设置字段 `text`。 |
| 615 | <code>await runOperation(operation, {</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 616 | <code>lineId: lineId &#124;&#124; 'line-01',</code> | 设置字段 `lineId`。 |
| 617 | <code>deviceId: deviceId &#124;&#124; 'robot-01',</code> | 设置字段 `deviceId`。 |
| 618 | <code>operator: operator &#124;&#124; 'ai:line-twin',</code> | 设置字段 `operator`。 |
| 619 | <code>dryRun: Boolean(dryRun),</code> | 设置字段 `dryRun`。 |
| 620 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 621 | <code>),</code> | 续写当前表达式、对象、类型或调用。 |
| 622 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 623 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 624 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 625 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 627 | <code>server.registerTool(</code> | 调用函数、设置值或更新状态。 |
| 628 | <code>'execute_action',</code> | 续写当前表达式、对象、类型或调用。 |
| 629 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 630 | <code>title: '下发单条控制指令(直控)',</code> | 设置字段 `title`。 |
| 631 | <code>description:</code> | 设置字段 `description`。 |
| 632 | <code>'★ 直控工具:直接下发**一条**控制指令并等 PLC 回执。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 633 | <code>'可执行类型:' + contract.executableTypes.join('&#124;') + '。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 634 | <code>(contract.paramEnums.mode_set</code> | 续写当前表达式、对象、类型或调用。 |
| 635 | <code>? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('&#124;') + ';'</code> | 续写当前表达式、对象、类型或调用。 |
| 636 | <code>: '') +</code> | 续写当前表达式、对象、类型或调用。 |
| 637 | <code>(contract.paramEnums.conveyor</code> | 续写当前表达式、对象、类型或调用。 |
| 638 | <code>? 'conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('&#124;') + ';'</code> | 续写当前表达式、对象、类型或调用。 |
| 639 | <code>: '') +</code> | 续写当前表达式、对象、类型或调用。 |
| 640 | <code>'「启动产线」用 type=start;「停止」用 type=stop;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 641 | <code>'「获取手动」type=mode_set,params.action=acquire;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 642 | <code>'「释放手动」type=mode_set,params.action=release;' +</code> | 续写当前表达式、对象、类型或调用。 |
| 643 | <code>'「传送带正转/停止」type=conveyor,params.action=forward&#124;stop。' +</code> | 续写当前表达式、对象、类型或调用。 |
| 644 | <code>'除非用户明确要单步,否则优先用 run_operation —— 它会按正确的顺序执行。',</code> | 续写当前表达式、对象、类型或调用。 |
| 645 | <code>inputSchema: {</code> | 设置字段 `inputSchema`。 |
| 646 | <code>lineId: z.string().default('line-01'),</code> | 设置字段 `lineId`。 关键字：`default`＝指定默认导出或默认分支。 |
| 647 | <code>deviceId: z.string().default('robot-01'),</code> | 设置字段 `deviceId`。 关键字：`default`＝指定默认导出或默认分支。 |
| 648 | <code>type: z.enum(contract.executableTypes),</code> | 设置字段 `type`。 关键字：`enum`＝定义枚举。 |
| 649 | <code>params: z.record(z.unknown()).optional(),</code> | 设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 650 | <code>operator: z.string().optional(),</code> | 设置字段 `operator`。 |
| 651 | <code>dryRun: z.boolean().default(false),</code> | 设置字段 `dryRun`。 关键字：`default`＝指定默认导出或默认分支；`false`＝布尔假值。 |
| 652 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 653 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 654 | <code>async ({ lineId, deviceId, type, params, operator, dryRun }) =&gt; {</code> | 定义或调用 `async`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 655 | <code>const enums = contract.paramEnums[type];</code> | 声明变量 `enums` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 656 | <code>if (enums) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 657 | <code>const action = (params &#124;&#124; {}).action;</code> | 声明变量 `action` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 658 | <code>if (typeof action !== 'string' &#124;&#124; !(action in enums)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型；`in`＝遍历键或判断成员。 |
| 659 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 660 | <code>content: [</code> | 设置字段 `content`。 |
| 661 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 662 | <code>type: 'text',</code> | 设置字段 `type`。 |
| 663 | <code>text: JSON.stringify({</code> | 设置字段 `text`。 |
| 664 | <code>ok: false,</code> | 设置字段 `ok`。 关键字：`false`＝布尔假值。 |
| 665 | <code>error: `${type}.params.action 必须是 ${Object.keys(enums).join('&#124;')},收到 ${JSON.stringify(action)}`,</code> | 设置字段 `error`。 |
| 666 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 667 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 668 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 669 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 670 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 671 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 672 | <code>if (dryRun) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 673 | <code>const state = await currentState(lineId &#124;&#124; 'line-01');</code> | 声明变量 `state` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 674 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 675 | <code>content: [</code> | 设置字段 `content`。 |
| 676 | <code>{</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 677 | <code>type: 'text',</code> | 设置字段 `type`。 |
| 678 | <code>text: JSON.stringify({</code> | 设置字段 `text`。 |
| 679 | <code>ok: true,</code> | 设置字段 `ok`。 关键字：`true`＝布尔真值。 |
| 680 | <code>dryRun: true,</code> | 设置字段 `dryRun`。 关键字：`true`＝布尔真值。 |
| 681 | <code>type,</code> | 续写当前表达式、对象、类型或调用。 |
| 682 | <code>params: params &#124;&#124; {},</code> | 设置字段 `params`。 |
| 683 | <code>stateBefore: state,</code> | 设置字段 `stateBefore`。 |
| 684 | <code>precondition: preconditionError(type, (params &#124;&#124; {}).action, state),</code> | 设置字段 `precondition`。 |
| 685 | <code>note: 'dryRun:只预演,没有下发任何指令',</code> | 设置字段 `note`。 |
| 686 | <code>}),</code> | 续写当前表达式、对象、类型或调用。 |
| 687 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 688 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 689 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 690 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 691 | <code>const step = await execStep({</code> | 声明变量 `step` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 692 | <code>lineId: lineId &#124;&#124; 'line-01',</code> | 设置字段 `lineId`。 |
| 693 | <code>deviceId: deviceId &#124;&#124; 'robot-01',</code> | 设置字段 `deviceId`。 |
| 694 | <code>type,</code> | 续写当前表达式、对象、类型或调用。 |
| 695 | <code>params: params &#124;&#124; {},</code> | 设置字段 `params`。 |
| 696 | <code>operator: operator &#124;&#124; 'ai:line-twin',</code> | 设置字段 `operator`。 |
| 697 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 698 | <code>return { content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 699 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 700 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 704 | <code>async function main() {</code> | 定义函数 `main`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 705 | <code>const transport = new StdioServerTransport();</code> | 声明变量 `transport` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 706 | <code>await server.connect(transport);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 707 | <code>log(`已启动;proposal 频道=${PROPOSAL_CHANNEL},ttl=${PROPOSAL_TTL_SEC}s`);</code> | 定义或调用 `log`，参数由括号给出。 |
| 708 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 710 | <code>main().catch((e) =&gt; {</code> | 定义或调用 `main`，参数由括号给出。 关键字：`catch`＝捕获异常。 |
| 711 | <code>log('致命错误:', e &amp;&amp; e.stack ? e.stack : e);</code> | 定义或调用 `log`，参数由括号给出。 |
| 712 | <code>process.exit(1);</code> | 调用函数、设置值或更新状态。 |
| 713 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
