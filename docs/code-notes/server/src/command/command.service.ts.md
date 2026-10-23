# server/src/command/command.service.ts 逐行说明

[打开源码](../../../../../server/src/command/command.service.ts) · 180 行 · 94 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 47 | <code>import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 48 | <code>import { Pool } from 'pg';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 49 | <code>import { PG_POOL } from '../infra/tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 50 | <code>import { CatalogService } from '../infra/catalog.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 51 | <code>import { MqttIngestService } from '../ingest/mqtt-ingest.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 52 | <code>import type { SessionUser } from '../auth/session-user';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 53 | <code>import { ALLOWED_TYPES, validateParams } from './command-contract';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 59 | <code>const CMD_TIMEOUT_SEC = 15;</code> | 声明变量 `CMD_TIMEOUT_SEC` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 64 | <code>export interface CommandBody {</code> | 声明 `CommandBody` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 65 | <code>deviceId?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 66 | <code>type?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 67 | <code>params?: Record&lt;string, unknown&gt;;</code> | 续写当前表达式、对象、类型或调用。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 68 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 70 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 71 | <code>export class CommandService implements OnModuleInit, OnModuleDestroy {</code> | 声明 `CommandService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。 |
| 72 | <code>private readonly logger = new Logger(CommandService.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 73 | <code>private timer?: NodeJS.Timeout;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问。 |
| 75 | <code>constructor(</code> | 调用函数、设置值或更新状态。 |
| 76 | <code>@Inject(PG_POOL) private readonly pool: Pool,</code> | 使用装饰器声明框架元数据或参数注入。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 77 | <code>private readonly catalog: CatalogService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 78 | <code>private readonly mqtt: MqttIngestService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 79 | <code>) {}</code> | 续写当前表达式、对象、类型或调用。 |
| 81 | <code>onModuleInit() {</code> | 定义或调用 `onModuleInit`，参数由括号给出。 |
| 82 | <code>this.timer = setInterval(() =&gt; this.sweepTimeout(), 1000);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 83 | <code>this.timer.unref();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 84 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 86 | <code>onModuleDestroy() {</code> | 定义或调用 `onModuleDestroy`，参数由括号给出。 |
| 87 | <code>if (this.timer) clearInterval(this.timer);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例。 |
| 88 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 91 | <code>private async sweepTimeout() {</code> | 定义或调用 `sweepTimeout`，参数由括号给出。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数。 |
| 92 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 96 | <code>const r = await this.pool.query(</code> | 声明变量 `r` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 97 | <code>`UPDATE control_commands</code> | 修改数据。 关键字：`UPDATE`＝修改已有行。 |
| 98 | <code>SET status = 'timeout'</code> | 续写当前表达式、对象、类型或调用。 |
| 99 | <code>WHERE status = 'sent'</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行。 |
| 100 | <code>AND issued_at &lt; now() - ($1 &#124;&#124; ' seconds')::interval</code> | 叠加筛选条件。 关键字：`AND`＝逻辑与。 |
| 101 | <code>RETURNING id`,</code> | 返回变更结果。 关键字：`RETURNING`＝返回变更后的字段。 |
| 102 | <code>[String(CMD_TIMEOUT_SEC)],</code> | 续写当前表达式、对象、类型或调用。 |
| 103 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 104 | <code>if (r.rowCount) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 105 | <code>this.logger.warn(`超时 ${r.rowCount} 条 sent 命令 → timeout`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 106 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 107 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 108 | <code>this.logger.error(`sweepTimeout 失败: ${(e as Error).message}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 109 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 110 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 112 | <code>async issue(lineCode: string, body: CommandBody, user: SessionUser) {</code> | 定义或调用 `issue`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 115 | <code>if (!body?.deviceId &#124;&#124; !body?.type &#124;&#124; !ALLOWED_TYPES.has(body.type)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 116 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 117 | <code>ok: false,</code> | 设置字段 `ok`。 关键字：`false`＝布尔假值。 |
| 118 | <code>error: `deviceId/type 非法;type 白名单: ${[...ALLOWED_TYPES].join('&#124;')}`,</code> | 设置字段 `error`。 |
| 119 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 120 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 123 | <code>const lineId = this.catalog.lineId(lineCode);</code> | 声明变量 `lineId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 124 | <code>const deviceId = this.catalog.deviceId(body.deviceId);</code> | 声明变量 `deviceId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 125 | <code>if (lineId === undefined &#124;&#124; deviceId === undefined) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值。 |
| 126 | <code>return { ok: false, error: '未知产线或设备编码' };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 127 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 130 | <code>const pv = validateParams(body.type, body.params);</code> | 声明变量 `pv` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 131 | <code>if (!pv.ok) return { ok: false, error: pv.error };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 134 | <code>const operator = user?.username &#124;&#124; 'unknown';</code> | 声明变量 `operator` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 135 | <code>const userId = await this.resolveUserId(operator);</code> | 声明变量 `userId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 137 | <code>const r = await this.pool.query(</code> | 声明变量 `r` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 138 | <code>`INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 139 | <code>VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,</code> | 列出待写入的值。 关键字：`VALUES`＝给出插入值；`RETURNING`＝返回变更后的字段。 |
| 140 | <code>[lineId, deviceId, userId, body.type, JSON.stringify(body.params ?? {})],</code> | 续写当前表达式、对象、类型或调用。 |
| 141 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 143 | <code>const cmdId = String(r.rows[0].idempotency_key);</code> | 声明变量 `cmdId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 148 | <code>this.pool</code> | 续写当前表达式、对象、类型或调用。 关键字：`this`＝当前对象实例。 |
| 149 | <code>.query(</code> | 调用函数、设置值或更新状态。 |
| 150 | <code>`INSERT INTO audit_logs (user_id, action, target, detail)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 151 | <code>VALUES ($1, 'command:execute', $2, $3::jsonb)`,</code> | 列出待写入的值。 关键字：`VALUES`＝给出插入值。 |
| 152 | <code>[userId, `${body.type} @ ${lineCode}/${body.deviceId}`,</code> | 续写当前表达式、对象、类型或调用。 |
| 153 | <code>JSON.stringify({ cmdId, params: body.params ?? {}, operator })],</code> | 调用函数、设置值或更新状态。 |
| 154 | <code>)</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 155 | <code>.catch((e) =&gt; this.logger.error(`写 audit_logs 失败: ${e.message}`));</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常；`this`＝当前对象实例。 |
| 158 | <code>this.mqtt.publishCommand(lineCode, body.deviceId, {</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 159 | <code>cmdId,</code> | 续写当前表达式、对象、类型或调用。 |
| 160 | <code>ts: Date.now(),</code> | 设置字段 `ts`。 |
| 161 | <code>lineId: lineCode,</code> | 设置字段 `lineId`。 |
| 162 | <code>deviceId: body.deviceId,</code> | 设置字段 `deviceId`。 |
| 163 | <code>type: body.type,</code> | 设置字段 `type`。 |
| 164 | <code>params: body.params ?? {},</code> | 设置字段 `params`。 |
| 165 | <code>operator,</code> | 续写当前表达式、对象、类型或调用。 |
| 166 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 169 | <code>return { ok: true, cmdId };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 170 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 172 | <code>private async resolveUserId(username: string): Promise&lt;number&gt; {</code> | 定义或调用 `resolveUserId`，参数由括号给出。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数。 |
| 173 | <code>const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);</code> | 声明变量 `r` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 175 | <code>if (r.rows[0]) return Number(r.rows[0].id);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 177 | <code>const a = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);</code> | 声明变量 `a` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 178 | <code>return Number(a.rows[0].id);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 179 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 180 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
