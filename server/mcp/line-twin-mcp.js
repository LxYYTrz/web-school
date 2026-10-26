#!/usr/bin/env node
// 这一段负责为 Hermes 提供产线查询、待确认建议和本机受限控制工具，为后续代码提供当前文件的处理入口。
'use strict';
// 启用 JavaScript 严格模式，让部分隐式错误直接抛异常。
// 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定

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
// 组合并规范化为绝对路径，或按 Promise 对象完成异步结果，将结果保存或写入 SERVER_ROOT。
// SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果；path：本处保存 require('path') 的结果；resolve：组合并规范化为绝对路径，或按 Promise 对象完成异步结果；__dirname：本处保存的局部数据，类型为 string
require(path.join(SERVER_ROOT, 'node_modules', 'dotenv')).config({
// 执行 require 对应的本地处理，使用本行提供的数据。
// require：Node.js CommonJS 模块加载函数；path：本处保存 require('path') 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值
  path: path.join(SERVER_ROOT, '.env'),
  // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
  // join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

const { McpServer } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/mcp.js'));
// 执行 require 对应的本地处理，使用本行提供的数据。
// McpServer：MCP SDK 的工具服务类，向 AI 暴露已注册工具；require：Node.js CommonJS 模块加载函数；path：本处保存 require('path') 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果
const { StdioServerTransport } = require(path.join(SERVER_ROOT, 'node_modules', '@modelcontextprotocol/sdk/dist/cjs/server/stdio.js'));
// 执行 require 对应的本地处理，使用本行提供的数据。
// StdioServerTransport：MCP SDK 的标准输入输出传输类；require：Node.js CommonJS 模块加载函数；path：本处保存 require('path') 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果
const { z } = require(path.join(SERVER_ROOT, 'node_modules', 'zod'));
// 执行 require 对应的本地处理，使用本行提供的数据。
// z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；require：Node.js CommonJS 模块加载函数；path：本处保存 require('path') 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果
const { Pool } = require(path.join(SERVER_ROOT, 'node_modules', 'pg'));
// 执行 require 对应的本地处理，使用本行提供的数据。
// Pool：pg 驱动提供的 PostgreSQL 连接池类；require：Node.js CommonJS 模块加载函数；path：本处保存 require('path') 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果
const Redis = require(path.join(SERVER_ROOT, 'node_modules', 'ioredis'));
// 执行 require 对应的本地处理，使用本行提供的数据，将结果保存或写入 Redis。
// Redis：ioredis 提供的 Redis 客户端类；require：Node.js CommonJS 模块加载函数；path：本处保存 require('path') 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果

// 指令白名单:与后端 CommandService 共读同一份 command-contract.json,
// 避免「AI 认为可执行的」与「系统真正放行的」出现漂移
const contract = require(path.join(SERVER_ROOT, 'src', 'command', 'command-contract.json'));
// 执行 require 对应的本地处理，使用本行提供的数据，将结果保存或写入 contract。
// contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；require：Node.js CommonJS 模块加载函数；path：本处保存 require('path') 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；SERVER_ROOT：本处保存 path.resolve(__dirname, '..') 的结果

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// 根据 process.env.REDIS_URL || 'redis://localhost:6379' 设置 REDIS_URL，供当前流程后续使用。
// REDIS_URL：本处保存 process.env.REDIS_URL || 'redis://localhost:6379' 的结果；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv
const DATABASE_URL =
// 声明 DATABASE_URL，初始值由  计算得到，供当前处理流程继续使用。
// DATABASE_URL：本处保存 process.env.DATABASE_URL || 'postgres://postgres:postgres123… 的结果
  process.env.DATABASE_URL || 'postgres://postgres:postgres123@localhost:5432/linetwin';
  // 读取指定环境变量；若未设置则使用右侧默认值。
  // process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；DATABASE_URL：process.env 对象上的字段或操作

// 提案落 Redis 的 TTL。够人看完一条回复并点确认,又不至于隔夜复活。
const PROPOSAL_TTL_SEC = 900;
// 根据 900 设置 PROPOSAL_TTL_SEC，供当前流程后续使用。
// PROPOSAL_TTL_SEC：本处保存 900 的结果
const PROPOSAL_CHANNEL = 'ai:proposal';
// 根据 'ai:proposal' 设置 PROPOSAL_CHANNEL，供当前流程后续使用。
// PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果

// 这一段定义 log，用于把 MCP 运行日志写入标准错误，避免污染协议标准输出。
function log(...args) {
// 定义 log，用于把 MCP 运行日志写入标准错误，避免污染协议标准输出。
// log：把 MCP 运行日志写入标准错误，避免污染协议标准输出；args：当前方法接收的参数
  // 只走 stderr —— stdout 是 MCP 传输通道
  process.stderr.write('[line-twin-mcp] ' + args.join(' ') + '\n');
  // 把本行提供的内容写到已打开的文件或通信目标。
  // process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；stderr：本处声明的字段或类型，类型为 WriteStream & { fd: 2; }；write：提供 write 的本地处理逻辑；args：当前方法接收的参数；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了把 MCP 运行日志写入标准错误，避免污染协议标准输出的实现；实际结果由运行时输入和执行分支决定。

const pool = new Pool({ connectionString: DATABASE_URL });
// 创建或使用pg 驱动提供的 PostgreSQL 连接池类，将结果保存或写入 pool。
// pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类；connectionString：PostgreSQL 的完整连接地址与登录配置；DATABASE_URL：本处保存 process.env.DATABASE_URL || 'postgres://postgres:postgres123… 的结果
const redis = new Redis(REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
// 创建或使用ioredis 提供的 Redis 客户端类，将结果保存或写入 redis。
// redis：注入或创建的 Redis 客户端；Redis：ioredis 提供的 Redis 客户端类；REDIS_URL：本处保存 process.env.REDIS_URL || 'redis://localhost:6379' 的结果
redis.on('error', (e) => log('redis error:', e.message));
// 注册指定消息事件的回调。
// redis：注入或创建的 Redis 客户端；on：注册指定事件的回调函数；e：当前方法接收的参数；log：输出调试或运行日志；message：消息正文或用于展示的结果说明

// 编码 → BIGINT 主键的转换。
// Redis 侧的 key 用的是字符串编码('line-01'),可以直接拼;
// 但 Postgres 侧所有业务表的 line_id 都是 bigint 外键,必须先查 production_lines
// 换成 id。漏掉这一步会让每个 PG 查询都报
// 「无效的 bigint 输入语法 "line-01"」。后端 CatalogService 做的是同一件事。
const lineIdCache = new Map(); // code -> { id, name } | null,60s 过期(对齐 CatalogService)
// 创建或使用JavaScript 按键保存值的集合，将结果保存或写入 lineIdCache。
// lineIdCache：本处保存 new Map() 的结果；Map：JavaScript 按键保存值的集合
// 这一段定义 resolveLine，用于将产线编码查询为数据库产线记录并短暂缓存。
async function resolveLine(code) {
// 定义函数 resolveLine。
// resolveLine：将产线编码查询为数据库产线记录并短暂缓存；code：业务编码、状态码或数据库查询字段，结合所在报文解释
  const hit = lineIdCache.get(code);
  // 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 hit。
  // hit：本处保存 lineIdCache.get(code) 的结果；lineIdCache：本处保存 new Map() 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；code：业务编码、状态码或数据库查询字段，结合所在报文解释
  if (hit && Date.now() - hit.at < 60000) return hit.row;
  // 检查(hit && Date.now() - hit.at < 60000) return hit.row;，按判断结果进入对应的处理分支。
  // hit：本处保存 lineIdCache.get(code) 的结果；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；at：hit 对象上的字段或操作；row：hit 对象上的字段或操作
  const { rows } = await pool.query(
  // 通过数据库连接池执行参数化查询。
  // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
    'SELECT id, code, name FROM production_lines WHERE code = $1 LIMIT 1', [code]);
    // 提供 SQL 语句，读取表 production_lines 中的数据；实际参数由外层查询调用传入。
    // code：业务编码、状态码或数据库查询字段，结合所在报文解释
  lineIdCache.set(code, { at: Date.now(), row: rows[0] || null });
  // 按键写入当前映射、缓存或对象的值。
  // lineIdCache：本处保存 new Map() 的结果；set：按键写入当前映射、缓存或对象的值；code：业务编码、状态码或数据库查询字段，结合所在报文解释；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；rows：数据库查询结果中的记录数组
  if (!rows[0]) {
  // 检查(!rows[0])，按判断结果进入对应的处理分支。
  // rows：数据库查询结果中的记录数组
    const { rows: all } = await pool.query('SELECT code FROM production_lines ORDER BY id');
    // 通过数据库连接池执行参数化查询。
    // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
    throw new Error(`未知产线编码 ${code}。可用:${all.map((r) => r.code).join('|') || '(库中没有任何产线)'}`);
    // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
    // Error：标准错误对象类型；code：业务编码、状态码或数据库查询字段，结合所在报文解释；map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；r：当前方法接收的参数；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return rows[0];
  // 把rows[0]作为当前函数的结果返回。
  // rows：数据库查询结果中的记录数组
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了将产线编码查询为数据库产线记录并短暂缓存的实现；实际结果由运行时输入和执行分支决定。

const server = new McpServer(
// 创建或使用MCP SDK 的工具服务类，向 AI 暴露已注册工具，将结果保存或写入 server。
// server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；McpServer：MCP SDK 的工具服务类，向 AI 暴露已注册工具
  { name: 'line-twin', version: '1.1.0' },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // name：当前对象的名称字段
  {
  // 开始一个对象字面量，后续行逐项填写字段。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    capabilities: { tools: {} },
    // 声明或设置 capabilities，用于当前对象或接口的对应数据。
    // tools：当前回答涉及的工具名称列表
    instructions:
    // 声明或设置 instructions，用于当前对象或接口的对应数据。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      '这是产线(line-01)的数据源与控制通道,分两类工具:' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '【查询类(只读)】get_line_snapshot / get_line_history / get_recent_events;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '【控制类】run_operation / execute_action(直控,直接下发不等人工确认)、' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      'propose_action(只提交建议,等人点确认)。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '★ 选哪条路,取决于你所在的通道:' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '  · 你在飞书/Lark 里(系统提示说你在 Feishu 工作区,用户在跟你直接对话)→ ' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '    用 run_operation 直控。用户说「传送带启动|传送带运行|手动跑一下传送带」→ conveyor_start;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '    「传送带停止」→ conveyor_stop;「启动产线|开始生产|开工」→ line_start;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '    「停止产线|停机」→ line_stop;「释放手动|退出手动」→ release_manual。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '  · 你在网页抽屉里(系统提示说明该通道只允许提交建议)→ 用 propose_action,不要用直控工具。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      'run_operation 内部会按 PLC 联锁要求的顺序执行(传送带必须:停止 → 获取手动 → 正转),' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '并逐步返回回执。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '不要凭空猜测状态:任何结论都应先调用工具查证;执行结果要如实汇报,rejected/timeout 不许说成成功。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

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
// 这一段定义 getLineSnapshot，用于读取并汇总产线状态、IO、边缘在线信息和机器人最新帧。
async function getLineSnapshot(lineId) {
// 定义函数 getLineSnapshot。
// getLineSnapshot：读取并汇总产线状态、IO、边缘在线信息和机器人最新帧；lineId：产线标识，接口通常使用 line-01 等编码
  const [status, edge] = await redis.mget(`rt:${lineId}:status`, `rt:${lineId}:edge`);
  // 一次读取多个 Redis 字符串键。
  // status：当前连接、产线、请求或指令的状态字段；redis：注入或创建的 Redis 客户端；mget：一次读取多个 Redis 字符串键；lineId：产线标识，接口通常使用 line-01 等编码
  const keys = await redis.keys(`rt:${lineId}:robot:*`);
  // 取得字典或对象中的所有键，将结果保存或写入 keys。
  // keys：本处保存 await redis.keys(`rt:${lineId}:robot:*`) 的结果；redis：注入或创建的 Redis 客户端；lineId：产线标识，接口通常使用 line-01 等编码
  const frames = keys.length ? await redis.mget(keys) : [];
  // 一次读取多个 Redis 字符串键，将结果保存或写入 frames。
  // frames：本处保存 keys.length ? await redis.mget(keys) : [] 的结果；keys：本处保存 await redis.keys(`rt:${lineId}:robot:*`) 的结果；length：keys 对象上的字段或操作；redis：注入或创建的 Redis 客户端；mget：一次读取多个 Redis 字符串键
  const robots = {};
  // 根据 {} 设置 robots，用于按设备编码索引的机器人最新遥测集合。
  // robots：按设备编码索引的机器人最新遥测集合
  keys.forEach((k, i) => {
  // 依次处理数组中的每个元素。
  // keys：本处保存 await redis.keys(`rt:${lineId}:robot:*`) 的结果；forEach：依次处理数组中的每个元素；k：当前方法接收的参数；i：当前方法接收的参数
    const deviceId = k.split(':').pop();
    // 按分隔符拆分字符串，将结果保存或写入 deviceId。
    // deviceId：设备标识，接口使用配置中的设备编码；k：当前方法接收的参数；split：按分隔符拆分字符串；pop：取出并移除数组最后一个元素
    robots[deviceId] = frames[i] ? JSON.parse(frames[i]) : null;
    // 将 frames[i] ? JSON.parse(frames[i]) : null 的结果写入 robots[deviceId]。
    // robots：按设备编码索引的机器人最新遥测集合；deviceId：设备标识，接口使用配置中的设备编码；frames：本处保存 keys.length ? await redis.mget(keys) : [] 的结果；i：当前方法接收的参数；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  const state = status ? JSON.parse(status) : null;
  // 把 JSON 文本解析为数据对象，将结果保存或写入 state。
  // state：当前状态值或实时状态服务实例，以所在对象为准；status：当前连接、产线、请求或指令的状态字段；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本
  const edgeState = edge ? JSON.parse(edge) : null;
  // 把 JSON 文本解析为数据对象，将结果保存或写入 edgeState。
  // edgeState：本处保存 edge ? JSON.parse(edge) : null 的结果；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本
  return {
  // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
  // 下方各属性共同组成返回对象，调用方按字段名读取结果
    lineId,
    // 把变量 lineId 作为同名对象字段加入当前对象。
    // lineId：产线标识，接口通常使用 line-01 等编码
    readAt: Date.now(),
    // 取得当前时间戳；Date.now 使用毫秒。
    // Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒
    status: state,
    // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
    // status：当前连接、产线、请求或指令的状态字段；state：当前状态值或实时状态服务实例，以所在对象为准
    edge: edgeState,
    // 声明或设置 edge，用于当前对象或接口的对应数据。
    // edgeState：本处保存 edge ? JSON.parse(edge) : null 的结果
    robots,
    // 把变量 robots 作为同名对象字段加入当前对象。
    // robots：按设备编码索引的机器人最新遥测集合
    freshness: {
    // 声明或设置 freshness，用于当前对象或接口的对应数据。
    // freshness 是此处声明的字段，类型或取值约束为 {
      statusMs: state ? Date.now() - (state.ts ?? 0) : null,
      // 取得当前时间戳；Date.now 使用毫秒。
      // state：当前状态值或实时状态服务实例，以所在对象为准；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；ts：数据产生时的毫秒时间戳
      edgeMs: edgeState ? Date.now() - (edgeState.ts ?? 0) : null,
      // 取得当前时间戳；Date.now 使用毫秒。
      // edgeState：本处保存 edge ? JSON.parse(edge) : null 的结果；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；ts：数据产生时的毫秒时间戳
      note: 'null 表示该数据已超过 TTL 未更新(空闲产线属正常),不等于设备离线',
      // 声明或设置 note，用于当前对象或接口的对应数据。
      // note 是当前映射表的查找键；「null 表示该数据已超过 TTL 未更新(空闲产线属正常),不等于设备离线」是使用该键时得到的文字或分类值
    },
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了读取并汇总产线状态、IO、边缘在线信息和机器人最新帧的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 getLineHistory，用于按时间范围查询产线历史状态。
async function getLineHistory(lineCode, minutes, limit) {
// 定义函数 getLineHistory。
// getLineHistory：按时间范围查询产线历史状态；lineCode：对外使用的产线字符串编码；minutes：当前方法接收的参数；limit：当前方法接收的参数
  const line = await resolveLine(lineCode);
  // 将产线编码查询为数据库产线记录并短暂缓存，将结果保存或写入 line。
  // line：本处保存 await resolveLine(lineCode) 的结果；resolveLine：将产线编码查询为数据库产线记录并短暂缓存；lineCode：对外使用的产线字符串编码
  const { rows } = await pool.query(
  // 通过数据库连接池执行参数化查询。
  // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
    `SELECT time, state, product_code, good_count, ng_count, beat_ms
       FROM line_status_history
      WHERE line_id = $1 AND "time" > now() - ($2 || ' minutes')::interval
      ORDER BY "time" DESC
      LIMIT $3`,
      // 限制结果行数，供当前处理流程继续使用。
      // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    [line.id, String(minutes), limit],
    // 将输入转换为 JavaScript 文本值。
    // line：本处保存 await resolveLine(lineCode) 的结果；id：当前记录或对象的标识；String：将值转换为文本的 JavaScript 构造函数；minutes：当前方法接收的参数；limit：当前方法接收的参数
  );
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return { lineId: line.code, lineName: line.name, minutes, count: rows.length, rows };
  // 把{ lineId: line.code, lineName: line.name, minutes, count: rows.length, rows }作为当前函数的结果返回。
  // lineId：产线标识，接口通常使用 line-01 等编码；line：本处保存 await resolveLine(lineCode) 的结果；code：业务编码、状态码或数据库查询字段，结合所在报文解释；name：当前对象的名称字段；count：本次读取或数据结构声明的数量；rows：数据库查询结果中的记录数组；length：rows 对象上的字段或操作
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了按时间范围查询产线历史状态的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 getRecentEvents，用于查询指定产线最近的生产事件。
async function getRecentEvents(lineCode, hours, onlyProblems, limit) {
// 定义函数 getRecentEvents。
// getRecentEvents：查询指定产线最近的生产事件；lineCode：对外使用的产线字符串编码；hours：当前方法接收的参数；onlyProblems：当前方法接收的参数；limit：当前方法接收的参数
  // 只给索引能覆盖的量;robot_joint_states 是 5-10Hz 的高频表,一律不直查
  const line = await resolveLine(lineCode);
  // 将产线编码查询为数据库产线记录并短暂缓存，将结果保存或写入 line。
  // line：本处保存 await resolveLine(lineCode) 的结果；resolveLine：将产线编码查询为数据库产线记录并短暂缓存；lineCode：对外使用的产线字符串编码
  const { rows } = await pool.query(
  // 通过数据库连接池执行参数化查询。
  // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
    `SELECT time, device_id, type, level, code, message, payload
       FROM production_events
      WHERE line_id = $1
        AND "time" > now() - ($2 || ' hours')::interval
        AND ($3::boolean IS NOT TRUE OR level IN ('warning','critical'))
      ORDER BY "time" DESC
      LIMIT $4`,
      // 限制结果行数，供当前处理流程继续使用。
      // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    [line.id, String(hours), onlyProblems, limit],
    // 将输入转换为 JavaScript 文本值。
    // line：本处保存 await resolveLine(lineCode) 的结果；id：当前记录或对象的标识；String：将值转换为文本的 JavaScript 构造函数；hours：当前方法接收的参数；onlyProblems：当前方法接收的参数；limit：当前方法接收的参数
  );
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return { lineId: line.code, hours, onlyProblems, count: rows.length, rows };
  // 把{ lineId: line.code, hours, onlyProblems, count: rows.length, rows }作为当前函数的结果返回。
  // lineId：产线标识，接口通常使用 line-01 等编码；line：本处保存 await resolveLine(lineCode) 的结果；code：业务编码、状态码或数据库查询字段，结合所在报文解释；count：本次读取或数据结构声明的数量；rows：数据库查询结果中的记录数组；length：rows 对象上的字段或操作
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了查询指定产线最近的生产事件的实现；实际结果由运行时输入和执行分支决定。

/**
 * 提交一条控制建议 —— **只校验和登记,绝不执行**。
 *
 * 故意不实现任何下发逻辑:下发权只在人手里。若本函数出现 MQTT/网络写操作,
 * 「AI 永不自动控制设备」这条不变式就破了。
 */
// 这一段定义 proposeAction，用于校验并保存 AI 控制建议，通过 Redis 通知前端待确认。
async function proposeAction(lineId, deviceId, type, params, reason) {
// 定义函数 proposeAction。
// proposeAction：校验并保存 AI 控制建议，通过 Redis 通知前端待确认；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象；reason：AI 给出控制建议的理由
  if (!contract.allowedTypes.includes(type)) {
  // 检查(!contract.allowedTypes.includes(type))，按判断结果进入对应的处理分支。
  // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；allowedTypes：contract 对象上的字段或操作；includes：判断数组或字符串是否包含指定内容；type：当前报文、指令或对象的类别字段
    return {
    // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
      ok: false,
      // 声明或设置 ok，用于操作是否成功的布尔结果。
      // ok：操作是否成功的布尔结果
      error: `type 不在白名单。可选:${contract.allowedTypes.join('|')}`,
      // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
      // error：失败原因或错误对象；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；allowedTypes：contract 对象上的字段或操作；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
    };
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 只推荐现场真有寄存器、能真正下发的指令;
  // reset/changeover/alarm_clear 在这台 PLC 上没有对应寄存器,提了也必然被拒
  if (!contract.executableTypes.includes(type)) {
  // 检查(!contract.executableTypes.includes(type))，按判断结果进入对应的处理分支。
  // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；executableTypes：contract 对象上的字段或操作；includes：判断数组或字符串是否包含指定内容；type：当前报文、指令或对象的类别字段
    return {
    // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
      ok: false,
      // 声明或设置 ok，用于操作是否成功的布尔结果。
      // ok：操作是否成功的布尔结果
      error: `${type} 在现场 PLC 无对应寄存器,edge 一定会回 rejected,不要建议该指令。可执行:${contract.executableTypes.join('|')}`,
      // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
      // error：失败原因或错误对象；type：当前报文、指令或对象的类别字段；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；executableTypes：contract 对象上的字段或操作；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
    };
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  const enums = contract.paramEnums[type];
  // 根据 contract.paramEnums[type] 设置 enums，供当前流程后续使用。
  // enums：本处保存 contract.paramEnums[type] 的结果；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；type：当前报文、指令或对象的类别字段
  if (enums) {
  // 检查(enums)，按判断结果进入对应的处理分支。
  // enums：本处保存 contract.paramEnums[type] 的结果
    const action = (params || {}).action;
    // 根据 (params || {}).action 设置 action，供当前流程后续使用。
    // action：本处保存 (params || {}).action 的结果；params：指令附加参数对象
    if (typeof action !== 'string' || !(action in enums)) {
    // 检查(typeof action !== 'string' || !(action in enums))，按判断结果进入对应的处理分支。
    // action：本处保存 (params || {}).action 的结果；enums：本处保存 contract.paramEnums[type] 的结果
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        ok: false,
        // 声明或设置 ok，用于操作是否成功的布尔结果。
        // ok：操作是否成功的布尔结果
        error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
        // 把对象编码为 JSON 文本。
        // error：失败原因或错误对象；type：当前报文、指令或对象的类别字段；Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；enums：本处保存 contract.paramEnums[type] 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；action：本处保存 (params || {}).action 的结果
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  const proposal = {
  // 根据 { 设置 proposal，供当前流程后续使用。
  // proposal：本处保存 { id: 'p-' + crypto.randomUUID(), lineId, deviceId, type, pa… 的结果
    id: 'p-' + crypto.randomUUID(),
    // 生成随机 UUID 标识。
    // id：当前记录或对象的标识；crypto：本处保存 require('crypto') 的结果；randomUUID：生成随机 UUID 标识
    lineId,
    // 把变量 lineId 作为同名对象字段加入当前对象。
    // lineId：产线标识，接口通常使用 line-01 等编码
    deviceId,
    // 把变量 deviceId 作为同名对象字段加入当前对象。
    // deviceId：设备标识，接口使用配置中的设备编码
    type,
    // 把变量 type 作为同名对象字段加入当前对象。
    // type：当前报文、指令或对象的类别字段
    params: params || {},
    // 声明或设置 params，用于指令附加参数对象。
    // params：指令附加参数对象
    reason,
    // 把变量 reason 作为同名对象字段加入当前对象。
    // reason：AI 给出控制建议的理由
    status: 'pending',
    // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
    // status：当前连接、产线、请求或指令的状态字段
    createdAt: Date.now(),
    // 取得当前时间戳；Date.now 使用毫秒。
    // createdAt：记录创建时的时间值；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  await redis.set(`ai:proposal:${proposal.id}`, JSON.stringify(proposal), 'EX', PROPOSAL_TTL_SEC);
  // 把对象编码为 JSON 文本。
  // redis：注入或创建的 Redis 客户端；set：按键写入当前映射、缓存或对象的值；proposal：本处保存 { id: 'p-' + crypto.randomUUID(), lineId, deviceId, type, pa… 的结果；id：当前记录或对象的标识；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；PROPOSAL_TTL_SEC：本处保存 900 的结果
  // 通知 NestJS 推送成 UI 卡片。pubsub 断线不影响提案本身 —— 它已经在 Redis 里了
  await redis.publish(PROPOSAL_CHANNEL, JSON.stringify(proposal));
  // 把对象编码为 JSON 文本。
  // redis：注入或创建的 Redis 客户端；publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；proposal：本处保存 { id: 'p-' + crypto.randomUUID(), lineId, deviceId, type, pa… 的结果

  return {
  // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
  // 下方各属性共同组成返回对象，调用方按字段名读取结果
    ok: true,
    // 声明或设置 ok，用于操作是否成功的布尔结果。
    // ok：操作是否成功的布尔结果
    proposalId: proposal.id,
    // 声明或设置 proposalId，用于当前对象或接口的对应数据。
    // proposal：本处保存 { id: 'p-' + crypto.randomUUID(), lineId, deviceId, type, pa… 的结果；id：当前记录或对象的标识
    instruction:
    // 声明或设置 instruction，用于当前对象或接口的对应数据。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      '建议已提交,会由值班人在 UI 上人工确认后才会真正下发。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '请在回复里说明这条建议的理由和预期影响,不要声称已经执行。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了校验并保存 AI 控制建议，通过 Redis 通知前端待确认的实现；实际结果由运行时输入和执行分支决定。

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
// 根据 process.env.MACHINE_COMMAND_TOKEN || '' 设置 MACHINE_TOKEN，供当前流程后续使用。
// MACHINE_TOKEN：本处保存 process.env.MACHINE_COMMAND_TOKEN || '' 的结果；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；MACHINE_COMMAND_TOKEN：process.env 对象上的字段或操作
const API_BASE = (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').replace(/\/+$/, '');
// 按匹配规则替换字符串内容，将结果保存或写入 API_BASE。
// API_BASE：本处保存 (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').… 的结果；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；LINE_TWIN_API_BASE：process.env 对象上的字段或操作；replace：按匹配规则替换字符串内容
// 契约 §5:15s 无回执置 timeout。MCP 侧等 15s 略多一点(留网络余量)。
const ACK_WAIT_MS = Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000);
// 将输入转换为 JavaScript 数值，将结果保存或写入 ACK_WAIT_MS。
// ACK_WAIT_MS：本处保存 Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000) 的结果；Number：将值转换为数字的 JavaScript 构造函数；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；MACHINE_ACK_TIMEOUT_MS：process.env 对象上的字段或操作
// 等 PLC 状态切换的时限(停止 → stopped、获取手动 → manual_mode)
const STATE_WAIT_MS = Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000);
// 将输入转换为 JavaScript 数值，将结果保存或写入 STATE_WAIT_MS。
// STATE_WAIT_MS：本处保存 Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000) 的结果；Number：将值转换为数字的 JavaScript 构造函数；process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；env：本处声明的字段或类型，类型为 ProcessEnv；MACHINE_STATE_TIMEOUT_MS：process.env 对象上的字段或操作

// 这一段定义 sleep，用于等待给定时长后继续异步操作。
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 安排延迟执行的回调，将结果保存或写入 sleep。
// sleep：本处保存 (ms) => new Promise((r) => setTimeout(r, ms)) 的结果；ms：当前方法接收的参数；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；r：当前方法接收的参数；setTimeout：延迟执行回调并返回计时器句柄
// 这一段提供了等待给定时长后继续异步操作的实现；实际结果由运行时输入和执行分支决定。

/** 机器通道是否可用 */
// 这一段定义 machineChannelReady，用于检查机器通道是否配置可用的控制令牌。
function machineChannelReady() {
// 定义函数 machineChannelReady。
// machineChannelReady：检查机器通道是否配置可用的控制令牌
  return Boolean(MACHINE_TOKEN);
  // 把Boolean(MACHINE_TOKEN)作为当前函数的结果返回。
  // Boolean：将值转换为布尔结果的 JavaScript 构造函数；MACHINE_TOKEN：本处保存 process.env.MACHINE_COMMAND_TOKEN || '' 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了检查机器通道是否配置可用的控制令牌的实现；实际结果由运行时输入和执行分支决定。

/** 调后端机器通道下发一条指令 */
// 这一段定义 machineIssue，用于调用本机后端机器通道提交控制指令。
async function machineIssue({ lineId, deviceId, type, params, operator }) {
// 定义函数 machineIssue。
// machineIssue：调用本机后端机器通道提交控制指令；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
  if (!machineChannelReady()) {
  // 检查(!machineChannelReady())，按判断结果进入对应的处理分支。
  // machineChannelReady：检查机器通道是否配置可用的控制令牌
    return { ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' };
    // 把{ ok: false, error: '机器通道未启用(MCP 侧没有 MACHINE_COMMAND_TOKEN)' }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；error：失败原因或错误对象
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  let res;
  // 声明可重新赋值的变量 res，稍后再赋值。
  // res：当前 HTTP 响应对象或 fetch 返回的响应
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    res = await fetch(`${API_BASE}/api/machine/commands`, {
    // 把右侧表达式的结果写入 res。
    // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；API_BASE：本处保存 (process.env.LINE_TWIN_API_BASE || 'http://127.0.0.1:3000').… 的结果
      method: 'POST',
      // 声明或设置 method，用于HTTP 请求方法。
      // method：HTTP 请求方法
      headers: { 'Content-Type': 'application/json', 'x-machine-token': MACHINE_TOKEN },
      // 声明或设置 headers，用于HTTP 请求头集合。
      // headers：HTTP 请求头集合；MACHINE_TOKEN：本处保存 process.env.MACHINE_COMMAND_TOKEN || '' 的结果
      body: JSON.stringify({ lineId, deviceId, type, params: params || {}, operator }),
      // 把对象编码为 JSON 文本。
      // body：当前 HTTP 请求或消息的正文；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    return { ok: false, error: `调用后端失败:${e.message}` };
    // 把{ ok: false, error: `调用后端失败:${e.message}` }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；error：失败原因或错误对象；e：本处保存的局部数据；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  const body = await res.json().catch(() => ({}));
  // 将 HTTP 响应正文解析为 JSON 对象，将结果保存或写入 body。
  // body：当前 HTTP 请求或消息的正文；res：当前 HTTP 响应对象或 fetch 返回的响应；json：将 HTTP 响应正文解析为 JSON 对象；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
  if (!res.ok) {
  // 检查(!res.ok)，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；ok：操作是否成功的布尔结果
    return { ok: false, error: body?.msg || body?.message || `后端返回 HTTP ${res.status}` };
    // 把{ ok: false, error: body?.msg || body?.message || `后端返回 HTTP ${res.status}` }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；error：失败原因或错误对象；body：当前 HTTP 请求或消息的正文；msg：当前收到的消息或提示文字；message：消息正文或用于展示的结果说明；res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (!body?.ok) {
  // 检查(!body?.ok)，按判断结果进入对应的处理分支。
  // body：当前 HTTP 请求或消息的正文；ok：操作是否成功的布尔结果
    return { ok: false, error: body?.error || '后端拒绝下发' };
    // 把{ ok: false, error: body?.error || '后端拒绝下发' }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；error：失败原因或错误对象；body：当前 HTTP 请求或消息的正文
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return { ok: true, cmdId: body.cmdId };
  // 把{ ok: true, cmdId: body.cmdId }作为当前函数的结果返回。
  // ok：操作是否成功的布尔结果；cmdId：控制指令唯一编号，用于关联下发与回执；body：当前 HTTP 请求或消息的正文
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了调用本机后端机器通道提交控制指令的实现；实际结果由运行时输入和执行分支决定。

/**
 * 等回执。edge 写完 PLC 会 publish cmd_ack,后端把 control_commands.status
 * 更新成 acked/rejected/failed。这里直接读表,不另开通道。
 */
// 这一段定义 waitAck，用于在超时时间内查询并等待指定指令的最终回执。
async function waitAck(cmdId, timeoutMs = ACK_WAIT_MS) {
// 在超时时间内查询并等待指定指令的最终回执。
// waitAck：在超时时间内查询并等待指定指令的最终回执；cmdId：控制指令唯一编号，用于关联下发与回执；timeoutMs：当前方法接收的参数；ACK_WAIT_MS：本处保存 Number(process.env.MACHINE_ACK_TIMEOUT_MS || 18000) 的结果
  const deadline = Date.now() + timeoutMs;
  // 取得当前时间戳；Date.now 使用毫秒，将结果保存或写入 deadline。
  // deadline：本处保存 Date.now() + timeoutMs 的结果；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；timeoutMs：当前方法接收的参数
  while (Date.now() < deadline) {
  // 持续检查(Date.now() < deadline)，按判断结果进入对应的处理分支。
  // Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；deadline：本处保存 Date.now() + timeoutMs 的结果
    const { rows } = await pool.query(
    // 通过数据库连接池执行参数化查询。
    // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      `SELECT status, ack_payload, acked_at FROM control_commands WHERE idempotency_key = $1`,
      // 读取数据，供当前处理流程继续使用。
      // control_commands 是保存控制指令审计记录的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [cmdId],
      // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
      // cmdId：控制指令唯一编号，用于关联下发与回执
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const row = rows[0];
    // 根据 rows[0] 设置 row，供当前流程后续使用。
    // row：本处保存 rows[0] 的结果；rows：数据库查询结果中的记录数组
    if (row && row.status !== 'pending' && row.status !== 'sent') {
    // 检查(row && row.status !== 'pending' && row.status !== 'sent')，按判断结果进入对应的处理分支。
    // row：本处保存 rows[0] 的结果；status：当前连接、产线、请求或指令的状态字段
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        status: row.status,
        // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
        // status：当前连接、产线、请求或指令的状态字段；row：本处保存 rows[0] 的结果
        message: row.ack_payload?.message || '',
        // 声明或设置 message，用于消息正文或用于展示的结果说明。
        // message：消息正文或用于展示的结果说明；row：本处保存 rows[0] 的结果；ack_payload：row 对象上的字段或操作
        ackedAt: row.acked_at,
        // 声明或设置 ackedAt，用于当前对象或接口的对应数据。
        // row：本处保存 rows[0] 的结果；acked_at：row 对象上的字段或操作
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    await sleep(400);
    // 暂停当前线程指定秒数。
    // sleep：暂停当前线程指定秒数
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return { status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null };
  // 把{ status: 'timeout', message: `${Math.round(timeoutMs / 1000)}s 内没有回执`, ackedAt: null }作为当前函数的结果返回。
  // status：当前连接、产线、请求或指令的状态字段；message：消息正文或用于展示的结果说明；Math：JavaScript 数学计算 API；round：本处声明的字段或类型，类型为 number；timeoutMs：当前方法接收的参数
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了在超时时间内查询并等待指定指令的最终回执的实现；实际结果由运行时输入和执行分支决定。

/** 读当前产线状态字符串(waiting_feed / stopped / manual_mode / init_error ...) */
// 这一段定义 currentState，用于读取产线最新工序状态。
async function currentState(lineId) {
// 定义函数 currentState。
// currentState：读取产线最新工序状态；lineId：产线标识，接口通常使用 line-01 等编码
  const raw = await redis.get(`rt:${lineId}:status`);
  // 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 raw。
  // raw：本处保存 await redis.get(`rt:${lineId}:status`) 的结果；redis：注入或创建的 Redis 客户端；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；lineId：产线标识，接口通常使用 line-01 等编码
  if (!raw) return null;
  // 检查(!raw) return null;，按判断结果进入对应的处理分支。
  // raw：本处保存 await redis.get(`rt:${lineId}:status`) 的结果
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    return JSON.parse(raw)?.state ?? null;
    // 把JSON.parse(raw)?.state ?? null作为当前函数的结果返回。
    // JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本；raw：本处保存 await redis.get(`rt:${lineId}:status`) 的结果；state：当前状态值或实时状态服务实例，以所在对象为准
  } catch {
  // 开始异常处理分支，接收前面代码抛出的错误。
  // 本行完成上面一层已说明的函数、分支或对象配置
    return null;
    // 把null作为当前函数的结果返回。
    // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了读取产线最新工序状态的实现；实际结果由运行时输入和执行分支决定。

/** 等产线状态变成期望值之一 */
// 这一段定义 waitState，用于等待产线进入指定状态或达到等待超时。
async function waitState(lineId, wanted, timeoutMs = STATE_WAIT_MS) {
// 定义函数 waitState。
// waitState：等待产线进入指定状态或达到等待超时；lineId：产线标识，接口通常使用 line-01 等编码；wanted：当前方法接收的参数；timeoutMs：当前方法接收的参数；STATE_WAIT_MS：本处保存 Number(process.env.MACHINE_STATE_TIMEOUT_MS || 10000) 的结果
  const list = Array.isArray(wanted) ? wanted : [wanted];
  // 判断当前值是否为数组，以选择对应的数据处理分支，将结果保存或写入 list。
  // list：本处保存 Array.isArray(wanted) ? wanted : [wanted] 的结果；Array：JavaScript 数组辅助 API；isArray：本处声明的字段或类型，类型为 arg is any[]；wanted：当前方法接收的参数
  const deadline = Date.now() + timeoutMs;
  // 取得当前时间戳；Date.now 使用毫秒，将结果保存或写入 deadline。
  // deadline：本处保存 Date.now() + timeoutMs 的结果；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；timeoutMs：当前方法接收的参数
  let last = null;
  // 根据 null 设置 last，供当前流程后续使用。
  // last：本处保存 null 的结果
  while (Date.now() < deadline) {
  // 持续检查(Date.now() < deadline)，按判断结果进入对应的处理分支。
  // Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒；deadline：本处保存 Date.now() + timeoutMs 的结果
    last = await currentState(lineId);
    // 把右侧表达式的结果写入 last。
    // last：本处保存 null 的结果；currentState：读取产线最新工序状态；lineId：产线标识，接口通常使用 line-01 等编码
    if (last && list.includes(last)) return { reached: true, state: last };
    // 检查(last && list.includes(last)) return { reached: true, state: last };，按判断结果进入对应的处理分支。
    // last：本处保存 null 的结果；list：本处保存 Array.isArray(wanted) ? wanted : [wanted] 的结果；includes：判断数组或字符串是否包含指定内容；state：当前状态值或实时状态服务实例，以所在对象为准
    await sleep(500);
    // 暂停当前线程指定秒数。
    // sleep：暂停当前线程指定秒数
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return { reached: false, state: last };
  // 把{ reached: false, state: last }作为当前函数的结果返回。
  // state：当前状态值或实时状态服务实例，以所在对象为准；last：本处保存 null 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了等待产线进入指定状态或达到等待超时的实现；实际结果由运行时输入和执行分支决定。

/**
 * 前置条件校验(契约 §4.6 的 PLC 状态机)。
 * 返回 null = 可以执行;返回字符串 = 不能执行的原因。
 */
// 这一段定义 preconditionError，用于根据当前现场状态生成不满足操作前提的说明。
function preconditionError(type, action, state) {
// 定义函数 preconditionError。
// preconditionError：根据当前现场状态生成不满足操作前提的说明；type：当前报文、指令或对象的类别字段；action：当前方法接收的参数；state：当前状态值或实时状态服务实例，以所在对象为准
  if (!state) return '读不到当前产线状态(快照为空),拒绝盲发指令';
  // 检查(!state) return '读不到当前产线状态(快照为空),拒绝盲发指令';，按判断结果进入对应的处理分支。
  // state：当前状态值或实时状态服务实例，以所在对象为准
  if (state === 'init_error') {
  // 检查(state === 'init_error')，按判断结果进入对应的处理分支。
  // state：当前状态值或实时状态服务实例，以所在对象为准
    return '产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位';
    // 把'产线处于初始化错误(init_error),所有指令都被禁用,必须到产线现场按物理按钮复位'作为当前函数的结果返回。
    // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (type === 'mode_set') {
  // 检查(type === 'mode_set')，按判断结果进入对应的处理分支。
  // type：当前报文、指令或对象的类别字段
    if (action === 'acquire') {
    // 检查(action === 'acquire')，按判断结果进入对应的处理分支。
    // action：当前方法接收的参数
      return state === 'stopped' ? null : `获取手动模式只能在 stopped 状态执行,当前是 ${state}`;
      // 把state === 'stopped' ? null : `获取手动模式只能在 stopped 状态执行,当前是 ${state}`作为当前函数的结果返回。
      // state：当前状态值或实时状态服务实例，以所在对象为准
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (action === 'release') {
    // 检查(action === 'release')，按判断结果进入对应的处理分支。
    // action：当前方法接收的参数
      return state === 'manual_mode' ? null : `释放手动只能在 manual_mode 状态执行,当前是 ${state}`;
      // 把state === 'manual_mode' ? null : `释放手动只能在 manual_mode 状态执行,当前是 ${state}`作为当前函数的结果返回。
      // state：当前状态值或实时状态服务实例，以所在对象为准
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (type === 'conveyor') {
  // 检查(type === 'conveyor')，按判断结果进入对应的处理分支。
  // type：当前报文、指令或对象的类别字段
    return state === 'manual_mode' ? null : `传送带只能在手动模式(manual_mode)下运行,当前是 ${state}`;
    // 把state === 'manual_mode' ? null : `传送带只能在手动模式(manual_mode)下运行,当前是 ${state}`作为当前函数的结果返回。
    // state：当前状态值或实时状态服务实例，以所在对象为准
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (type === 'start') {
  // 检查(type === 'start')，按判断结果进入对应的处理分支。
  // type：当前报文、指令或对象的类别字段
    if (state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)';
    // 检查(state === 'manual_mode') return '启动前必须先释放手动模式(mode_set release)';，按判断结果进入对应的处理分支。
    // state：当前状态值或实时状态服务实例，以所在对象为准
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return null;
  // 把null作为当前函数的结果返回。
  // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了根据当前现场状态生成不满足操作前提的说明的实现；实际结果由运行时输入和执行分支决定。

/**
 * 执行一步:校验 → 下发 → 等回执 → (可选)等状态到位。
 */
// 这一段定义 execStep，用于执行操作流程中的一个指令步骤并等待回执。
async function execStep({ lineId, deviceId, type, params, operator, waitFor, skipPrecondition }) {
// 执行操作流程中的一个指令步骤并等待回执。
// execStep：执行操作流程中的一个指令步骤并等待回执；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
  const action = params?.action;
  // 根据 params?.action 设置 action，供当前流程后续使用。
  // action：本处保存 params?.action 的结果；params：指令附加参数对象
  const before = await currentState(lineId);
  // 读取产线最新工序状态，将结果保存或写入 before。
  // before：本处保存 await currentState(lineId) 的结果；currentState：读取产线最新工序状态；lineId：产线标识，接口通常使用 line-01 等编码
  if (!skipPrecondition) {
  // 检查(!skipPrecondition)，按判断结果进入对应的处理分支。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    const bad = preconditionError(type, action, before);
    // 根据当前现场状态生成不满足操作前提的说明，将结果保存或写入 bad。
    // bad：本处保存 preconditionError(type, action, before) 的结果；preconditionError：根据当前现场状态生成不满足操作前提的说明；type：当前报文、指令或对象的类别字段；action：本处保存 params?.action 的结果；before：本处保存 await currentState(lineId) 的结果
    if (bad) {
    // 检查(bad)，按判断结果进入对应的处理分支。
    // bad：本处保存 preconditionError(type, action, before) 的结果
      return { type, params: params || {}, ok: false, status: 'skipped', message: bad, stateBefore: before };
      // 把{ type, params: params || {}, ok: false, status: 'skipped', message: bad, stateBefore: before }作为当前函数的结果返回。
      // type：当前报文、指令或对象的类别字段；params：指令附加参数对象；ok：操作是否成功的布尔结果；status：当前连接、产线、请求或指令的状态字段；message：消息正文或用于展示的结果说明；bad：本处保存 preconditionError(type, action, before) 的结果；before：本处保存 await currentState(lineId) 的结果
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  const issued = await machineIssue({ lineId, deviceId, type, params, operator });
  // 调用本机后端机器通道提交控制指令，将结果保存或写入 issued。
  // issued：本处保存 await machineIssue({ lineId, deviceId, type, params, operato… 的结果；machineIssue：调用本机后端机器通道提交控制指令；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
  if (!issued.ok) {
  // 检查(!issued.ok)，按判断结果进入对应的处理分支。
  // issued：本处保存 await machineIssue({ lineId, deviceId, type, params, operato… 的结果；ok：操作是否成功的布尔结果
    return { type, params: params || {}, ok: false, status: 'failed', message: issued.error, stateBefore: before };
    // 把{ type, params: params || {}, ok: false, status: 'failed', message: issued.error, stateBefore: …作为当前函数的结果返回。
    // type：当前报文、指令或对象的类别字段；params：指令附加参数对象；ok：操作是否成功的布尔结果；status：当前连接、产线、请求或指令的状态字段；message：消息正文或用于展示的结果说明；issued：本处保存 await machineIssue({ lineId, deviceId, type, params, operato… 的结果；error：失败原因或错误对象；before：本处保存 await currentState(lineId) 的结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  const ack = await waitAck(issued.cmdId);
  // 在超时时间内查询并等待指定指令的最终回执，将结果保存或写入 ack。
  // ack：本处保存 await waitAck(issued.cmdId) 的结果；waitAck：在超时时间内查询并等待指定指令的最终回执；issued：本处保存 await machineIssue({ lineId, deviceId, type, params, operato… 的结果；cmdId：控制指令唯一编号，用于关联下发与回执
  const step = {
  // 根据 { 设置 step，供当前流程后续使用。
  // step：本处保存 { type, params: params || {}, cmdId: issued.cmdId, ok: ack.s… 的结果
    type,
    // 把变量 type 作为同名对象字段加入当前对象。
    // type：当前报文、指令或对象的类别字段
    params: params || {},
    // 声明或设置 params，用于指令附加参数对象。
    // params：指令附加参数对象
    cmdId: issued.cmdId,
    // 声明或设置 cmdId，用于控制指令唯一编号，用于关联下发与回执。
    // cmdId：控制指令唯一编号，用于关联下发与回执；issued：本处保存 await machineIssue({ lineId, deviceId, type, params, operato… 的结果
    ok: ack.status === 'acked',
    // 声明或设置 ok，用于操作是否成功的布尔结果。
    // ok：操作是否成功的布尔结果；ack：本处保存 await waitAck(issued.cmdId) 的结果；status：当前连接、产线、请求或指令的状态字段
    status: ack.status,
    // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
    // status：当前连接、产线、请求或指令的状态字段；ack：本处保存 await waitAck(issued.cmdId) 的结果
    message: ack.message,
    // 声明或设置 message，用于消息正文或用于展示的结果说明。
    // message：消息正文或用于展示的结果说明；ack：本处保存 await waitAck(issued.cmdId) 的结果
    stateBefore: before,
    // 声明或设置 stateBefore，用于当前对象或接口的对应数据。
    // before：本处保存 await currentState(lineId) 的结果
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (waitFor && step.ok) {
  // 检查(waitFor && step.ok)，按判断结果进入对应的处理分支。
  // step：本处保存 { type, params: params || {}, cmdId: issued.cmdId, ok: ack.s… 的结果；ok：操作是否成功的布尔结果
    const st = await waitState(lineId, waitFor);
    // 等待产线进入指定状态或达到等待超时，将结果保存或写入 st。
    // st：本处保存 await waitState(lineId, waitFor) 的结果；waitState：等待产线进入指定状态或达到等待超时；lineId：产线标识，接口通常使用 line-01 等编码
    step.stateAfter = st.state;
    // 把右侧表达式的结果写入 step.stateAfter。
    // step：本处保存 { type, params: params || {}, cmdId: issued.cmdId, ok: ack.s… 的结果；stateAfter：step 对象上的字段或操作；st：本处保存 await waitState(lineId, waitFor) 的结果；state：当前状态值或实时状态服务实例，以所在对象为准
    step.stateReached = st.reached;
    // 把右侧表达式的结果写入 step.stateReached。
    // step：本处保存 { type, params: params || {}, cmdId: issued.cmdId, ok: ack.s… 的结果；stateReached：step 对象上的字段或操作；st：本处保存 await waitState(lineId, waitFor) 的结果；reached：st 对象上的字段或操作
    if (!st.reached) {
    // 检查(!st.reached)，按判断结果进入对应的处理分支。
    // st：本处保存 await waitState(lineId, waitFor) 的结果；reached：st 对象上的字段或操作
      step.ok = false;
      // 把右侧表达式的结果写入 step.ok。
      // step：本处保存 { type, params: params || {}, cmdId: issued.cmdId, ok: ack.s… 的结果；ok：操作是否成功的布尔结果
      step.message = `指令已下发并回执,但产线状态没有变成 ${waitFor}(当前 ${st.state})`;
      // 把右侧表达式的结果写入 step.message。
      // step：本处保存 { type, params: params || {}, cmdId: issued.cmdId, ok: ack.s… 的结果；message：消息正文或用于展示的结果说明；st：本处保存 await waitState(lineId, waitFor) 的结果；state：当前状态值或实时状态服务实例，以所在对象为准
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return step;
  // 把step作为当前函数的结果返回。
  // step：本处保存 { type, params: params || {}, cmdId: issued.cmdId, ok: ack.s… 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了执行操作流程中的一个指令步骤并等待回执的实现；实际结果由运行时输入和执行分支决定。

/**
 * 组合操作:把「一次人话指令」翻译成正确的 PLC 操作序列。
 *
 * conveyor_start 的序列来自现场联锁(CLAUDE.md §4.6):
 *   停止 → 等 stopped → 获取手动模式 → 等 manual_mode → 传送带正转
 * 只在手动模式下传送带才允许动作,直接发 conveyor 会被 PLC 拒绝,
 * 所以「先停止再获取手动」不是多余的步骤,是必须的。
 */
const OPERATIONS = {
// 根据 { 设置 OPERATIONS，供当前流程后续使用。
// OPERATIONS：本处保存 { conveyor_start: { title: '传送带正转', desc: '按「停止 → 获取手动模式 → 传… 的结果
  conveyor_start: {
  // 声明或设置 conveyor_start，用于当前对象或接口的对应数据。
  // conveyor_start 是此处声明的字段，类型或取值约束为 {
    title: '传送带正转',
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // title 是当前映射表的查找键；「传送带正转」是使用该键时得到的文字或分类值
    desc: '按「停止 → 获取手动模式 → 传送带正转」三步执行(PLC 只允许手动模式下动传送带)',
    // 声明或设置 desc，用于当前对象或接口的对应数据。
    // desc 是当前映射表的查找键；「按「停止 → 获取手动模式 → 传送带正转」三步执行(PLC 只允许手动模式下动传送带)」是使用该键时得到的文字或分类值
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  conveyor_stop: { title: '停止传送带', desc: '传送带停止(电平型,写 0)' },
  // 声明或设置 conveyor_stop，用于当前对象或接口的对应数据。
  // conveyor_stop 是此处声明的字段，类型或取值约束为 { title: '停止传送带'
  line_start: { title: '启动产线', desc: '必要时先释放手动模式,再启动' },
  // 声明或设置 line_start，用于当前对象或接口的对应数据。
  // line_start 是此处声明的字段，类型或取值约束为 { title: '启动产线'
  line_stop: { title: '停止产线', desc: '停止信号' },
  // 声明或设置 line_stop，用于当前对象或接口的对应数据。
  // line_stop 是此处声明的字段，类型或取值约束为 { title: '停止产线'
  release_manual: { title: '释放手动模式', desc: '退出手动模式,回到 stopped' },
  // 声明或设置 release_manual，用于当前对象或接口的对应数据。
  // release_manual 是此处声明的字段，类型或取值约束为 { title: '释放手动模式'
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 这一段定义 runOperation，用于按现场联锁顺序执行完整控制操作并汇总步骤结果。
async function runOperation(op, { lineId, deviceId, operator, dryRun }) {
// 定义函数 runOperation。
// runOperation：按现场联锁顺序执行完整控制操作并汇总步骤结果；op：当前方法接收的参数；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码
  const meta = OPERATIONS[op];
  // 根据 OPERATIONS[op] 设置 meta，供当前流程后续使用。
  // meta：本处保存 OPERATIONS[op] 的结果；OPERATIONS：本处保存 { conveyor_start: { title: '传送带正转', desc: '按「停止 → 获取手动模式 → 传… 的结果；op：当前方法接收的参数
  if (!meta) {
  // 检查(!meta)，按判断结果进入对应的处理分支。
  // meta：本处保存 OPERATIONS[op] 的结果
    return { ok: false, error: `未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('|')}` };
    // 把{ ok: false, error: `未知操作 ${op}。可选:${Object.keys(OPERATIONS).join('|')}` }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；error：失败原因或错误对象；op：当前方法接收的参数；Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；OPERATIONS：本处保存 { conveyor_start: { title: '传送带正转', desc: '按「停止 → 获取手动模式 → 传… 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  const state0 = await currentState(lineId);
  // 读取产线最新工序状态，将结果保存或写入 state0。
  // state0：本处保存 await currentState(lineId) 的结果；currentState：读取产线最新工序状态；lineId：产线标识，接口通常使用 line-01 等编码
  const steps = [];
  // 根据 [] 设置 steps，供当前流程后续使用。
  // steps：本处保存 [] 的结果

  if (op === 'conveyor_start') {
  // 检查(op === 'conveyor_start')，按判断结果进入对应的处理分支。
  // op：当前方法接收的参数
    if (dryRun) {
    // 检查(dryRun)，按判断结果进入对应的处理分支。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      steps.push({ type: 'stop', params: {} });
      // 向数组末尾追加元素。
      // steps：本处保存 [] 的结果；push：向数组末尾追加元素；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      steps.push({ type: 'mode_set', params: { action: 'acquire' } });
      // 向数组末尾追加元素。
      // steps：本处保存 [] 的结果；push：向数组末尾追加元素；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      steps.push({ type: 'conveyor', params: { action: 'forward' } });
      // 向数组末尾追加元素。
      // steps：本处保存 [] 的结果；push：向数组末尾追加元素；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      return { ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps };
      // 把{ ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0, planned: steps…作为当前函数的结果返回。
      // ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果；steps：本处保存 [] 的结果
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, waitFor: 'stopped' }));
    // 向数组末尾追加元素。
    // steps：本处保存 [] 的结果；push：向数组末尾追加元素；execStep：执行操作流程中的一个指令步骤并等待回执；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
    if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    // 检查(!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps…，按判断结果进入对应的处理分支。
    // steps：本处保存 [] 的结果；ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果
    steps.push(
    // 向数组末尾追加元素。
    // steps：本处保存 [] 的结果；push：向数组末尾追加元素
      await execStep({
      // 执行操作流程中的一个指令步骤并等待回执。
      // execStep：执行操作流程中的一个指令步骤并等待回执
        lineId, deviceId, type: 'mode_set', params: { action: 'acquire' }, operator, waitFor: 'manual_mode',
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
        // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      }),
      // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
      // 本行完成上面一层已说明的函数、分支或对象配置
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
    // 检查(!steps[1].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps…，按判断结果进入对应的处理分支。
    // steps：本处保存 [] 的结果；ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果
    steps.push(
    // 向数组末尾追加元素。
    // steps：本处保存 [] 的结果；push：向数组末尾追加元素
      await execStep({
      // 执行操作流程中的一个指令步骤并等待回执。
      // execStep：执行操作流程中的一个指令步骤并等待回执
        lineId, deviceId, type: 'conveyor', params: { action: 'forward' }, operator,
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
        // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      }),
      // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
      // 本行完成上面一层已说明的函数、分支或对象配置
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  } else if (op === 'conveyor_stop') {
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // op：当前方法接收的参数
    if (dryRun) {
    // 检查(dryRun)，按判断结果进入对应的处理分支。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 声明或设置 ok，用于操作是否成功的布尔结果。
        // ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果
        planned: [{ type: 'conveyor', params: { action: 'stop' } }],
        // 声明或设置 planned，用于当前对象或接口的对应数据。
        // type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // 传送带停止是电平写 0,不受「必须在手动模式」限制 → 跳过前置校验
    steps.push(
    // 向数组末尾追加元素。
    // steps：本处保存 [] 的结果；push：向数组末尾追加元素
      await execStep({
      // 执行操作流程中的一个指令步骤并等待回执。
      // execStep：执行操作流程中的一个指令步骤并等待回执
        lineId, deviceId, type: 'conveyor', params: { action: 'stop' }, operator, skipPrecondition: true,
        // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
        // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      }),
      // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
      // 本行完成上面一层已说明的函数、分支或对象配置
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  } else if (op === 'line_start') {
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // op：当前方法接收的参数
    if (dryRun) {
    // 检查(dryRun)，按判断结果进入对应的处理分支。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 声明或设置 ok，用于操作是否成功的布尔结果。
        // ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果
        planned: [
        // 声明或设置 planned，用于当前对象或接口的对应数据。
        // planned 是此处声明的字段，类型或取值约束为 [
          ...(state0 === 'manual_mode' ? [{ type: 'mode_set', params: { action: 'release' } }] : []),
          // 声明或设置 type，用于当前报文、指令或对象的类别字段。
          // state0：本处保存 await currentState(lineId) 的结果；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
          { type: 'start', params: {} },
          // 开始对象字面量，并在这一行设置其中列出的字段。
          // type：当前报文、指令或对象的类别字段；params：指令附加参数对象
        ],
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 此处结束当前数组参数，各元素保持上方列出的顺序
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (state0 === 'manual_mode') {
    // 检查(state0 === 'manual_mode')，按判断结果进入对应的处理分支。
    // state0：本处保存 await currentState(lineId) 的结果
      steps.push(
      // 向数组末尾追加元素。
      // steps：本处保存 [] 的结果；push：向数组末尾追加元素
        await execStep({
        // 执行操作流程中的一个指令步骤并等待回执。
        // execStep：执行操作流程中的一个指令步骤并等待回执
          lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped',
          // 组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。
          // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
        }),
        // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
        // 本行完成上面一层已说明的函数、分支或对象配置
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      if (!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps };
      // 检查(!steps[0].ok) return { ok: false, operation: op, title: meta.title, stateBefore: state0, steps…，按判断结果进入对应的处理分支。
      // steps：本处保存 [] 的结果；ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    steps.push(await execStep({ lineId, deviceId, type: 'start', params: {}, operator }));
    // 向数组末尾追加元素。
    // steps：本处保存 [] 的结果；push：向数组末尾追加元素；execStep：执行操作流程中的一个指令步骤并等待回执；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
  } else if (op === 'line_stop') {
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // op：当前方法接收的参数
    if (dryRun) {
    // 检查(dryRun)，按判断结果进入对应的处理分支。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 声明或设置 ok，用于操作是否成功的布尔结果。
        // ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果
        planned: [{ type: 'stop', params: {} }],
        // 声明或设置 planned，用于当前对象或接口的对应数据。
        // type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    steps.push(await execStep({ lineId, deviceId, type: 'stop', params: {}, operator, skipPrecondition: true }));
    // 向数组末尾追加元素。
    // steps：本处保存 [] 的结果；push：向数组末尾追加元素；execStep：执行操作流程中的一个指令步骤并等待回执；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
  } else if (op === 'release_manual') {
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // op：当前方法接收的参数
    if (dryRun) {
    // 检查(dryRun)，按判断结果进入对应的处理分支。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        ok: true, dryRun: true, operation: op, title: meta.title, stateBefore: state0,
        // 声明或设置 ok，用于操作是否成功的布尔结果。
        // ok：操作是否成功的布尔结果；op：当前方法接收的参数；meta：本处保存 OPERATIONS[op] 的结果；state0：本处保存 await currentState(lineId) 的结果
        planned: [{ type: 'mode_set', params: { action: 'release' } }],
        // 声明或设置 planned，用于当前对象或接口的对应数据。
        // type：当前报文、指令或对象的类别字段；params：指令附加参数对象
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    steps.push(
    // 向数组末尾追加元素。
    // steps：本处保存 [] 的结果；push：向数组末尾追加元素
      await execStep({ lineId, deviceId, type: 'mode_set', params: { action: 'release' }, operator, waitFor: 'stopped' }),
      // 执行操作流程中的一个指令步骤并等待回执。
      // execStep：执行操作流程中的一个指令步骤并等待回执；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  const ok = steps.length > 0 && steps.every((s) => s.ok);
  // 检查集合是否全部满足条件，将结果保存或写入 ok。
  // ok：操作是否成功的布尔结果；steps：本处保存 [] 的结果；length：本处声明的字段或类型，类型为 number；every：检查集合是否全部满足条件；s：当前方法接收的参数
  return {
  // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
  // 下方各属性共同组成返回对象，调用方按字段名读取结果
    ok,
    // 把变量 ok 作为同名对象字段加入当前对象。
    // ok：操作是否成功的布尔结果
    operation: op,
    // 声明或设置 operation，用于当前对象或接口的对应数据。
    // op：当前方法接收的参数
    title: meta.title,
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // meta：本处保存 OPERATIONS[op] 的结果
    stateBefore: state0,
    // 声明或设置 stateBefore，用于当前对象或接口的对应数据。
    // state0：本处保存 await currentState(lineId) 的结果
    stateAfter: await currentState(lineId),
    // 读取产线最新工序状态。
    // currentState：读取产线最新工序状态；lineId：产线标识，接口通常使用 line-01 等编码
    steps,
    // 把变量 steps 作为同名对象字段加入当前对象。
    // steps 是上方取得或计算的同名局部值，在此作为返回对象的 steps 属性
    summary: steps.map((s) => `${s.type}${s.params?.action ? ':' + s.params.action : ''} → ${s.status}`).join(' , '),
    // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
    // steps：本处保存 [] 的结果；map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；s：当前方法接收的参数；type：当前报文、指令或对象的类别字段；params：指令附加参数对象；action：s.params 对象上的字段或操作；status：当前连接、产线、请求或指令的状态字段；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了按现场联锁顺序执行完整控制操作并汇总步骤结果的实现；实际结果由运行时输入和执行分支决定。

// ---------------------------------------------------------------------------
// 注册
// ---------------------------------------------------------------------------

const READ_ONLY = { readOnlyHint: true };
// 根据 { readOnlyHint: true } 设置 READ_ONLY，供当前流程后续使用。
// READ_ONLY：本处保存 { readOnlyHint: true } 的结果

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
// server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；registerTool：向 MCP 服务注册工具名称、说明、入参校验和执行函数
  'get_line_snapshot',
  // 把这一段文字作为当前调用、数组或对象的值。
  // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  {
  // 开始一个对象字面量，后续行逐项填写字段。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    title: '产线实时快照',
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // title 是当前映射表的查找键；「产线实时快照」是使用该键时得到的文字或分类值
    description:
    // 声明或设置 description，用于当前对象或接口的对应数据。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      '读取产线当前实时状态:产线状态机、边缘网关在线情况、各机器人关节角。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '注意 status/edge/robots 中出现 null 表示该数据超过 TTL 未刷新(空闲产线正常),不代表设备故障。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
    inputSchema: { lineId: z.string().describe('产线编码,例如 line-01') },
    // 执行 string 对应的本地处理，使用本行提供的数据。
    // lineId：产线标识，接口通常使用 line-01 等编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；describe：z.string() 对象上的字段或操作
    annotations: READ_ONLY,
    // 声明或设置 annotations，用于当前对象或接口的对应数据。
    // READ_ONLY：本处保存 { readOnlyHint: true } 的结果
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  async ({ lineId }) => ({ content: [{ type: 'text', text: JSON.stringify(await getLineSnapshot(lineId)) }] }),
  // 把对象编码为 JSON 文本。
  // lineId：产线标识，接口通常使用 line-01 等编码；type：当前报文、指令或对象的类别字段；text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；getLineSnapshot：读取并汇总产线状态、IO、边缘在线信息和机器人最新帧
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
// server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；registerTool：向 MCP 服务注册工具名称、说明、入参校验和执行函数
  'get_line_history',
  // 把这一段文字作为当前调用、数组或对象的值。
  // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  {
  // 开始一个对象字面量，后续行逐项填写字段。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    title: '产线状态历史',
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // title 是当前映射表的查找键；「产线状态历史」是使用该键时得到的文字或分类值
    description: '按时间倒序读取产线状态变化历史,用于回答「刚才发生了什么」「什么时候停的」。',
    // 声明或设置 description，用于当前对象或接口的对应数据。
    // description 是当前映射表的查找键；「按时间倒序读取产线状态变化历史,用于回答「刚才发生了什么」「什么时候停的」。」是使用该键时得到的文字或分类值
    inputSchema: {
    // 声明或设置 inputSchema，用于当前对象或接口的对应数据。
    // inputSchema 是此处声明的字段，类型或取值约束为 {
      lineId: z.string(),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // lineId：产线标识，接口通常使用 line-01 等编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束
      minutes: z.number().int().min(1).max(10080).default(60).describe('回溯分钟数,默认 60'),
      // 执行 number 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；int：z.number() 对象上的字段或操作；min：z.number().int() 对象上的字段或操作；max：z.number().int().min(1) 对象上的字段或操作；default：z.number().int().min(1).max(10080) 对象上的字段或操作；describe：z.number().int().min(1).max(10080).default(60… 对象上的字段或操作
      limit: z.number().int().min(1).max(500).default(100),
      // 执行 number 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；int：z.number() 对象上的字段或操作；min：z.number().int() 对象上的字段或操作；max：z.number().int().min(1) 对象上的字段或操作；default：z.number().int().min(1).max(500) 对象上的字段或操作
    },
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    annotations: READ_ONLY,
    // 声明或设置 annotations，用于当前对象或接口的对应数据。
    // READ_ONLY：本处保存 { readOnlyHint: true } 的结果
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  async ({ lineId, minutes, limit }) => ({
  // 执行 async 对应的本地处理，使用本行提供的数据。
  // lineId：产线标识，接口通常使用 line-01 等编码
    content: [{ type: 'text', text: JSON.stringify(await getLineHistory(lineId, minutes ?? 60, limit ?? 100)) }],
    // 把对象编码为 JSON 文本。
    // type：当前报文、指令或对象的类别字段；text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；getLineHistory：按时间范围查询产线历史状态；lineId：产线标识，接口通常使用 line-01 等编码
  }),
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 本行完成上面一层已说明的函数、分支或对象配置
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
// server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；registerTool：向 MCP 服务注册工具名称、说明、入参校验和执行函数
  'get_recent_events',
  // 把这一段文字作为当前调用、数组或对象的值。
  // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  {
  // 开始一个对象字面量，后续行逐项填写字段。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    title: '近期报警与事件',
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // title 是当前映射表的查找键；「近期报警与事件」是使用该键时得到的文字或分类值
    description: '读取生产事件流。排查故障时通常把 onlyProblems 设为 true,只看 warning/critical。',
    // 声明或设置 description，用于当前对象或接口的对应数据。
    // description 是当前映射表的查找键；「读取生产事件流。排查故障时通常把 onlyProblems 设为 true,只看 warning/critical。」是使用该键时得到的文字或分类值
    inputSchema: {
    // 声明或设置 inputSchema，用于当前对象或接口的对应数据。
    // inputSchema 是此处声明的字段，类型或取值约束为 {
      lineId: z.string(),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // lineId：产线标识，接口通常使用 line-01 等编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束
      hours: z.number().int().min(1).max(168).default(24),
      // 执行 number 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；int：z.number() 对象上的字段或操作；min：z.number().int() 对象上的字段或操作；max：z.number().int().min(1) 对象上的字段或操作；default：z.number().int().min(1).max(168) 对象上的字段或操作
      onlyProblems: z.boolean().default(true).describe('只看 warning/critical'),
      // 执行 boolean 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；default：z.boolean() 对象上的字段或操作；describe：z.boolean().default(true) 对象上的字段或操作
      limit: z.number().int().min(1).max(200).default(50),
      // 执行 number 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；int：z.number() 对象上的字段或操作；min：z.number().int() 对象上的字段或操作；max：z.number().int().min(1) 对象上的字段或操作；default：z.number().int().min(1).max(200) 对象上的字段或操作
    },
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    annotations: READ_ONLY,
    // 声明或设置 annotations，用于当前对象或接口的对应数据。
    // READ_ONLY：本处保存 { readOnlyHint: true } 的结果
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  async ({ lineId, hours, onlyProblems, limit }) => ({
  // 执行 async 对应的本地处理，使用本行提供的数据。
  // lineId：产线标识，接口通常使用 line-01 等编码
    content: [
    // 声明或设置 content，用于当前对象或接口的对应数据。
    // content 是此处声明的字段，类型或取值约束为 [
      { type: 'text', text: JSON.stringify(await getRecentEvents(lineId, hours ?? 24, onlyProblems ?? true, limit ?? 50)) },
      // 开始对象字面量，并在这一行设置其中列出的字段。
      // type：当前报文、指令或对象的类别字段；text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；getRecentEvents：查询指定产线最近的生产事件；lineId：产线标识，接口通常使用 line-01 等编码
    ],
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 此处结束当前数组参数，各元素保持上方列出的顺序
  }),
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 本行完成上面一层已说明的函数、分支或对象配置
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
// server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；registerTool：向 MCP 服务注册工具名称、说明、入参校验和执行函数
  'propose_action',
  // 把这一段文字作为当前调用、数组或对象的值。
  // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  {
  // 开始一个对象字面量，后续行逐项填写字段。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    title: '提交控制建议(需人工确认)',
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // title 是当前映射表的查找键；「提交控制建议(需人工确认)」是使用该键时得到的文字或分类值
    description:
    // 声明或设置 description，用于当前对象或接口的对应数据。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      '当诊断结论需要改变产线状态时调用本工具提交一条**建议**。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '它只做校验和登记,不会执行 —— 会在值班人界面上生成一张待确认卡片,人工点击后才真正下发。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
      // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；executableTypes：contract 对象上的字段或操作；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
      (contract.paramEnums.mode_set ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') : '') +
      // 取得字典或对象中的所有键。
      // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；mode_set：contract.paramEnums 对象上的字段或操作；Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
      (contract.paramEnums.conveyor ? ';conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') : '') +
      // 取得字典或对象中的所有键。
      // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；conveyor：contract.paramEnums 对象上的字段或操作；Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
      '不要为 reset/changeover/alarm_clear 提建议 —— 现场 PLC 没有对应寄存器。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
    inputSchema: {
    // 声明或设置 inputSchema，用于当前对象或接口的对应数据。
    // inputSchema 是此处声明的字段，类型或取值约束为 {
      lineId: z.string(),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // lineId：产线标识，接口通常使用 line-01 等编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束
      deviceId: z.string().describe('设备编码,例如 robot-01'),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // deviceId：设备标识，接口使用配置中的设备编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；describe：z.string() 对象上的字段或操作
      type: z.enum(contract.executableTypes).describe('控制指令类型'),
      // 执行 enum 对应的本地处理，使用本行提供的数据。
      // type：当前报文、指令或对象的类别字段；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；enum：z 对象上的字段或操作；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；executableTypes：contract 对象上的字段或操作；describe：z.enum(contract.executableTypes) 对象上的字段或操作
      params: z.record(z.unknown()).optional().describe('指令参数,含 action 枚举值'),
      // 执行 record 对应的本地处理，使用本行提供的数据。
      // params：指令附加参数对象；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；record：z 对象上的字段或操作；optional：z.record(z.unknown()) 对象上的字段或操作；describe：z.record(z.unknown()).optional() 对象上的字段或操作
      reason: z.string().describe('为什么需要这条操作,会写进 UI 给值班人看,写清楚依据'),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // reason：AI 给出控制建议的理由；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；describe：z.string() 对象上的字段或操作
    },
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  async ({ lineId, deviceId, type, params, reason }) => ({
  // 执行 async 对应的本地处理，使用本行提供的数据。
  // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象；reason：AI 给出控制建议的理由
    content: [{ type: 'text', text: JSON.stringify(await proposeAction(lineId, deviceId, type, params, reason)) }],
    // 把对象编码为 JSON 文本。
    // type：当前报文、指令或对象的类别字段；text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；proposeAction：校验并保存 AI 控制建议，通过 Redis 通知前端待确认；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；params：指令附加参数对象；reason：AI 给出控制建议的理由
  }),
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 本行完成上面一层已说明的函数、分支或对象配置
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
// server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；registerTool：向 MCP 服务注册工具名称、说明、入参校验和执行函数
  'run_operation',
  // 把这一段文字作为当前调用、数组或对象的值。
  // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  {
  // 开始一个对象字面量，后续行逐项填写字段。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    title: '执行产线操作(直控)',
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // title 是当前映射表的查找键；「执行产线操作(直控)」是使用该键时得到的文字或分类值
    description:
    // 声明或设置 description，用于当前对象或接口的对应数据。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      '★ 直控工具:把一句人话翻译成正确的 PLC 操作序列并**直接执行**,不用人工点确认。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '可用操作:' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      Object.entries(OPERATIONS)
      // 执行 entries 对应的本地处理，使用本行提供的数据。
      // Object：JavaScript 对象辅助 API；entries：本处声明的字段或类型，类型为 [string, T][]；OPERATIONS：本处保存 { conveyor_start: { title: '传送带正转', desc: '按「停止 → 获取手动模式 → 传… 的结果
        .map(([k, v]) => `${k}(${v.title}:${v.desc})`)
        // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
        // map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；title：v 对象上的字段或操作；desc：v 对象上的字段或操作
        .join(';') +
        // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
        // join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
      '。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '用户说「传送带启动/传送带运行」→ conveyor_start;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '「传送带停止」→ conveyor_stop;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '「启动产线/开始生产」→ line_start;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '「停止产线」→ line_stop;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '「释放手动/退出手动模式」→ release_manual。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '每一步都会等 PLC 回执,返回里逐步给出 status(acked/rejected/timeout)。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '如实汇报每一步的结果,不要把 rejected/timeout 说成成功。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
    inputSchema: {
    // 声明或设置 inputSchema，用于当前对象或接口的对应数据。
    // inputSchema 是此处声明的字段，类型或取值约束为 {
      lineId: z.string().default('line-01').describe('产线编码,默认 line-01'),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // lineId：产线标识，接口通常使用 line-01 等编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；default：z.string() 对象上的字段或操作；describe：z.string().default('line-01') 对象上的字段或操作
      deviceId: z.string().default('robot-01').describe('设备编码,默认 robot-01'),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // deviceId：设备标识，接口使用配置中的设备编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；default：z.string() 对象上的字段或操作；describe：z.string().default('robot-01') 对象上的字段或操作
      operation: z.enum(Object.keys(OPERATIONS)).describe('要执行的操作'),
      // 执行 enum 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；enum：z 对象上的字段或操作；Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；OPERATIONS：本处保存 { conveyor_start: { title: '传送带正转', desc: '按「停止 → 获取手动模式 → 传… 的结果；describe：z.enum(Object.keys(OPERATIONS)) 对象上的字段或操作
      operator: z.string().optional().describe('操作者标识,例如 ai:feishu:ou_xxx,会写进审计'),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；optional：z.string() 对象上的字段或操作；describe：z.string().optional() 对象上的字段或操作
      dryRun: z.boolean().default(false).describe('只预演不下发(排查/确认流程用)'),
      // 执行 boolean 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；default：z.boolean() 对象上的字段或操作；describe：z.boolean().default(false) 对象上的字段或操作
    },
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  async ({ lineId, deviceId, operation, operator, dryRun }) => ({
  // 执行 async 对应的本地处理，使用本行提供的数据。
  // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码
    content: [
    // 声明或设置 content，用于当前对象或接口的对应数据。
    // content 是此处声明的字段，类型或取值约束为 [
      {
      // 开始一个对象字面量，后续行逐项填写字段。
      // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
        type: 'text',
        // 声明或设置 type，用于当前报文、指令或对象的类别字段。
        // type：当前报文、指令或对象的类别字段
        text: JSON.stringify(
        // 把对象编码为 JSON 文本。
        // text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
          await runOperation(operation, {
          // 按现场联锁顺序执行完整控制操作并汇总步骤结果。
          // runOperation：按现场联锁顺序执行完整控制操作并汇总步骤结果
            lineId: lineId || 'line-01',
            // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
            // lineId：产线标识，接口通常使用 line-01 等编码
            deviceId: deviceId || 'robot-01',
            // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
            // deviceId：设备标识，接口使用配置中的设备编码
            operator: operator || 'ai:line-twin',
            // 声明或设置 operator，用于当前对象或接口的对应数据。
            // operator 是此处声明的字段，类型或取值约束为 operator || 'ai:line-twin'
            dryRun: Boolean(dryRun),
            // 执行 Boolean 对应的本地处理，使用本行提供的数据。
            // Boolean：将值转换为布尔结果的 JavaScript 构造函数
          }),
          // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
          // 本行完成上面一层已说明的函数、分支或对象配置
        ),
        // 结束当前函数的参数列表并完成调用，供当前处理流程继续使用。
        // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      },
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    ],
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 此处结束当前数组参数，各元素保持上方列出的顺序
  }),
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 本行完成上面一层已说明的函数、分支或对象配置
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

server.registerTool(
// 向 MCP 服务注册工具名称、说明、入参校验和执行函数。
// server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；registerTool：向 MCP 服务注册工具名称、说明、入参校验和执行函数
  'execute_action',
  // 把这一段文字作为当前调用、数组或对象的值。
  // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
  {
  // 开始一个对象字面量，后续行逐项填写字段。
  // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
    title: '下发单条控制指令(直控)',
    // 声明或设置 title，用于当前对象或接口的对应数据。
    // title 是当前映射表的查找键；「下发单条控制指令(直控)」是使用该键时得到的文字或分类值
    description:
    // 声明或设置 description，用于当前对象或接口的对应数据。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      '★ 直控工具:直接下发**一条**控制指令并等 PLC 回执。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '可执行类型:' + contract.executableTypes.join('|') + '。' +
      // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
      // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；executableTypes：contract 对象上的字段或操作；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
      (contract.paramEnums.mode_set
      // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
      // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；mode_set：contract.paramEnums 对象上的字段或操作
        ? 'mode_set 需要 params.action=' + Object.keys(contract.paramEnums.mode_set).join('|') + ';'
        // 取得字典或对象中的所有键。
        // Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；mode_set：contract.paramEnums 对象上的字段或操作；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
        : '') +
        // 条件不满足时拼接空字符串，然后继续组装提示文本。
        // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      (contract.paramEnums.conveyor
      // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
      // contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；conveyor：contract.paramEnums 对象上的字段或操作
        ? 'conveyor 需要 params.action=' + Object.keys(contract.paramEnums.conveyor).join('|') + ';'
        // 取得字典或对象中的所有键。
        // Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；conveyor：contract.paramEnums 对象上的字段或操作；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
        : '') +
        // 条件不满足时拼接空字符串，然后继续组装提示文本。
        // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      '「启动产线」用 type=start;「停止」用 type=stop;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '「获取手动」type=mode_set,params.action=acquire;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '「释放手动」type=mode_set,params.action=release;' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '「传送带正转/停止」type=conveyor,params.action=forward|stop。' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '除非用户明确要单步,否则优先用 run_operation —— 它会按正确的顺序执行。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
    inputSchema: {
    // 声明或设置 inputSchema，用于当前对象或接口的对应数据。
    // inputSchema 是此处声明的字段，类型或取值约束为 {
      lineId: z.string().default('line-01'),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // lineId：产线标识，接口通常使用 line-01 等编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；default：z.string() 对象上的字段或操作
      deviceId: z.string().default('robot-01'),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // deviceId：设备标识，接口使用配置中的设备编码；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；default：z.string() 对象上的字段或操作
      type: z.enum(contract.executableTypes),
      // 执行 enum 对应的本地处理，使用本行提供的数据。
      // type：当前报文、指令或对象的类别字段；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；enum：z 对象上的字段或操作；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；executableTypes：contract 对象上的字段或操作
      params: z.record(z.unknown()).optional(),
      // 执行 record 对应的本地处理，使用本行提供的数据。
      // params：指令附加参数对象；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；record：z 对象上的字段或操作；optional：z.record(z.unknown()) 对象上的字段或操作
      operator: z.string().optional(),
      // 执行 string 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；optional：z.string() 对象上的字段或操作
      dryRun: z.boolean().default(false),
      // 执行 boolean 对应的本地处理，使用本行提供的数据。
      // z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；default：z.boolean() 对象上的字段或操作
    },
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  async ({ lineId, deviceId, type, params, operator, dryRun }) => {
  // 执行 async 对应的本地处理，使用本行提供的数据。
  // lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
    const enums = contract.paramEnums[type];
    // 根据 contract.paramEnums[type] 设置 enums，供当前流程后续使用。
    // enums：本处保存 contract.paramEnums[type] 的结果；contract：本处保存 require(path.join(SERVER_ROOT, 'src', 'command', 'command-co… 的结果；paramEnums：contract 对象上的字段或操作；type：当前报文、指令或对象的类别字段
    if (enums) {
    // 检查(enums)，按判断结果进入对应的处理分支。
    // enums：本处保存 contract.paramEnums[type] 的结果
      const action = (params || {}).action;
      // 根据 (params || {}).action 设置 action，供当前流程后续使用。
      // action：本处保存 (params || {}).action 的结果；params：指令附加参数对象
      if (typeof action !== 'string' || !(action in enums)) {
      // 检查(typeof action !== 'string' || !(action in enums))，按判断结果进入对应的处理分支。
      // action：本处保存 (params || {}).action 的结果；enums：本处保存 contract.paramEnums[type] 的结果
        return {
        // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
        // 下方各属性共同组成返回对象，调用方按字段名读取结果
          content: [
          // 声明或设置 content，用于当前对象或接口的对应数据。
          // content 是此处声明的字段，类型或取值约束为 [
            {
            // 开始一个对象字面量，后续行逐项填写字段。
            // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
              type: 'text',
              // 声明或设置 type，用于当前报文、指令或对象的类别字段。
              // type：当前报文、指令或对象的类别字段
              text: JSON.stringify({
              // 把对象编码为 JSON 文本。
              // text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
                ok: false,
                // 声明或设置 ok，用于操作是否成功的布尔结果。
                // ok：操作是否成功的布尔结果
                error: `${type}.params.action 必须是 ${Object.keys(enums).join('|')},收到 ${JSON.stringify(action)}`,
                // 把对象编码为 JSON 文本。
                // error：失败原因或错误对象；type：当前报文、指令或对象的类别字段；Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；enums：本处保存 contract.paramEnums[type] 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；action：本处保存 (params || {}).action 的结果
              }),
              // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
              // 本行完成上面一层已说明的函数、分支或对象配置
            },
            // 结束当前函数、分支或对象配置，返回上一层处理流程。
            // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
          ],
          // 结束当前函数、分支或对象配置，返回上一层处理流程。
          // 此处结束当前数组参数，各元素保持上方列出的顺序
        };
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (dryRun) {
    // 检查(dryRun)，按判断结果进入对应的处理分支。
    // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
      const state = await currentState(lineId || 'line-01');
      // 读取产线最新工序状态，将结果保存或写入 state。
      // state：当前状态值或实时状态服务实例，以所在对象为准；currentState：读取产线最新工序状态；lineId：产线标识，接口通常使用 line-01 等编码
      return {
      // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
      // 下方各属性共同组成返回对象，调用方按字段名读取结果
        content: [
        // 声明或设置 content，用于当前对象或接口的对应数据。
        // content 是此处声明的字段，类型或取值约束为 [
          {
          // 开始一个对象字面量，后续行逐项填写字段。
          // 这一行使用上方已定义的函数、配置或数据字段，具体来源见相邻定义
            type: 'text',
            // 声明或设置 type，用于当前报文、指令或对象的类别字段。
            // type：当前报文、指令或对象的类别字段
            text: JSON.stringify({
            // 把对象编码为 JSON 文本。
            // text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
              ok: true,
              // 声明或设置 ok，用于操作是否成功的布尔结果。
              // ok：操作是否成功的布尔结果
              dryRun: true,
              // 声明或设置 dryRun，用于当前对象或接口的对应数据。
              // dryRun 是此处声明的字段，类型或取值约束为 true
              type,
              // 把变量 type 作为同名对象字段加入当前对象。
              // type：当前报文、指令或对象的类别字段
              params: params || {},
              // 声明或设置 params，用于指令附加参数对象。
              // params：指令附加参数对象
              stateBefore: state,
              // 声明或设置 stateBefore，用于当前对象或接口的对应数据。
              // state：当前状态值或实时状态服务实例，以所在对象为准
              precondition: preconditionError(type, (params || {}).action, state),
              // 根据当前现场状态生成不满足操作前提的说明。
              // preconditionError：根据当前现场状态生成不满足操作前提的说明；type：当前报文、指令或对象的类别字段；params：指令附加参数对象；action：(params || {}) 对象上的字段或操作；state：当前状态值或实时状态服务实例，以所在对象为准
              note: 'dryRun:只预演,没有下发任何指令',
              // 声明或设置 note，用于当前对象或接口的对应数据。
              // note 是当前映射表的查找键；「dryRun:只预演,没有下发任何指令」是使用该键时得到的文字或分类值
            }),
            // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
            // 本行完成上面一层已说明的函数、分支或对象配置
          },
          // 结束当前函数、分支或对象配置，返回上一层处理流程。
          // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
        ],
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 此处结束当前数组参数，各元素保持上方列出的顺序
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const step = await execStep({
    // 执行操作流程中的一个指令步骤并等待回执，将结果保存或写入 step。
    // step：本处保存 await execStep({ lineId: lineId || 'line-01', deviceId: devi… 的结果；execStep：执行操作流程中的一个指令步骤并等待回执
      lineId: lineId || 'line-01',
      // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
      // lineId：产线标识，接口通常使用 line-01 等编码
      deviceId: deviceId || 'robot-01',
      // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
      // deviceId：设备标识，接口使用配置中的设备编码
      type,
      // 把变量 type 作为同名对象字段加入当前对象。
      // type：当前报文、指令或对象的类别字段
      params: params || {},
      // 声明或设置 params，用于指令附加参数对象。
      // params：指令附加参数对象
      operator: operator || 'ai:line-twin',
      // 声明或设置 operator，用于当前对象或接口的对应数据。
      // operator 是此处声明的字段，类型或取值约束为 operator || 'ai:line-twin'
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    return { content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] };
    // 把{ content: [{ type: 'text', text: JSON.stringify({ ok: step.ok, ...step }) }] }作为当前函数的结果返回。
    // type：当前报文、指令或对象的类别字段；text：聊天正文、文本片段或界面展示文字；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；ok：操作是否成功的布尔结果；step：本处保存 await execStep({ lineId: lineId || 'line-01', deviceId: devi… 的结果
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// ---------------------------------------------------------------------------

// 这一段定义 main，用于连接 MCP 标准输入输出传输并开始处理工具调用。
async function main() {
// 执行 main 对应的本地处理，使用本行提供的数据。
// main：连接 MCP 标准输入输出传输并开始处理工具调用
  const transport = new StdioServerTransport();
  // 创建或使用MCP SDK 的标准输入输出传输类，将结果保存或写入 transport。
  // transport：本处保存 new StdioServerTransport() 的结果；StdioServerTransport：MCP SDK 的标准输入输出传输类
  await server.connect(transport);
  // 尝试建立网络连接。
  // server：本处保存 new McpServer( { name: 'line-twin', version: '1.1.0' }, { ca… 的结果；connect：尝试建立网络连接；transport：本处保存 new StdioServerTransport() 的结果
  log(`已启动;proposal 频道=${PROPOSAL_CHANNEL},ttl=${PROPOSAL_TTL_SEC}s`);
  // 输出调试或运行日志。
  // log：输出调试或运行日志；PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果；PROPOSAL_TTL_SEC：本处保存 900 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了连接 MCP 标准输入输出传输并开始处理工具调用的实现；实际结果由运行时输入和执行分支决定。

main().catch((e) => {
// 执行 main 对应的本地处理，使用本行提供的数据。
// main：连接 MCP 标准输入输出传输并开始处理工具调用；catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数
  log('致命错误:', e && e.stack ? e.stack : e);
  // 输出调试或运行日志。
  // log：输出调试或运行日志；e：当前方法接收的参数；stack：e 对象上的字段或操作
  process.exit(1);
  // 以指定状态码结束当前进程或处理流程。
  // process：当前 Node.js 进程对象，env 是环境变量、pid 是进程号；exit：本处声明的字段或类型，类型为 never
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了为 Hermes 提供产线查询、待确认建议和本机受限控制工具所需的定义和处理逻辑，结果交由调用方或运行环境使用。
