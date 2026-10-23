# server/src/history/history-writer.service.ts 逐行说明

[打开源码](../../../../../server/src/history/history-writer.service.ts) · 266 行 · 135 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 37 | <code>import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 38 | <code>import { Pool } from 'pg';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 39 | <code>import { PG_POOL } from '../infra/tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 40 | <code>import { CatalogService } from '../infra/catalog.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 46 | <code>interface RobotRow {</code> | 声明 `RobotRow` 的结构。 关键字：`interface`＝定义类型接口。 |
| 47 | <code>time: Date;</code> | 设置字段 `time`。 |
| 48 | <code>deviceId: number;</code> | 设置字段 `deviceId`。 |
| 49 | <code>joints: number[];</code> | 设置字段 `joints`。 |
| 50 | <code>tcp: number[] &#124; null;</code> | 设置字段 `tcp`。 关键字：`null`＝空值。 |
| 51 | <code>speedPct: number &#124; null;</code> | 设置字段 `speedPct`。 关键字：`null`＝空值。 |
| 52 | <code>mode: string &#124; null;</code> | 设置字段 `mode`。 关键字：`null`＝空值。 |
| 53 | <code>program: string &#124; null;</code> | 设置字段 `program`。 关键字：`null`＝空值。 |
| 54 | <code>alarmCode: number;</code> | 设置字段 `alarmCode`。 |
| 55 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 62 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 63 | <code>export class HistoryWriterService implements OnModuleInit, OnModuleDestroy {</code> | 声明 `HistoryWriterService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。 |
| 64 | <code>private readonly logger = new Logger(HistoryWriterService.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 66 | <code>private robotBuffer: RobotRow[] = [];</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问。 |
| 68 | <code>private timer?: NodeJS.Timeout;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问。 |
| 73 | <code>constructor(</code> | 调用函数、设置值或更新状态。 |
| 74 | <code>@Inject(PG_POOL) private readonly pool: Pool,</code> | 使用装饰器声明框架元数据或参数注入。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 75 | <code>private readonly catalog: CatalogService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 76 | <code>) {}</code> | 续写当前表达式、对象、类型或调用。 |
| 78 | <code>onModuleInit() {</code> | 定义或调用 `onModuleInit`，参数由括号给出。 |
| 80 | <code>this.timer = setInterval(() =&gt; this.flushRobots(), 1000);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 82 | <code>this.timer.unref();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 83 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 90 | <code>onModuleDestroy() {</code> | 定义或调用 `onModuleDestroy`，参数由括号给出。 |
| 91 | <code>if (this.timer) clearInterval(this.timer);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例。 |
| 92 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 94 | <code>bufferRobotFrame(deviceCode: string, msg: any) {</code> | 定义或调用 `bufferRobotFrame`，参数由括号给出。 关键字：`any`＝跳过静态类型检查。 |
| 96 | <code>const deviceId = this.catalog.deviceId(deviceCode);</code> | 声明变量 `deviceId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 97 | <code>if (deviceId === undefined) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。 |
| 102 | <code>if (this.robotBuffer.length &gt;= 10000) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例。 |
| 104 | <code>this.robotBuffer.shift();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 105 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 107 | <code>this.robotBuffer.push({</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 108 | <code>time: toTime(msg),</code> | 设置字段 `time`。 |
| 109 | <code>deviceId,</code> | 续写当前表达式、对象、类型或调用。 |
| 110 | <code>joints: msg.joints,</code> | 设置字段 `joints`。 |
| 111 | <code>tcp: Array.isArray(msg.tcp) ? msg.tcp : null,</code> | 设置字段 `tcp`。 关键字：`null`＝空值。 |
| 112 | <code>speedPct: msg.speedPct ?? null,</code> | 设置字段 `speedPct`。 关键字：`null`＝空值。 |
| 113 | <code>mode: msg.mode ?? null,</code> | 设置字段 `mode`。 关键字：`null`＝空值。 |
| 114 | <code>program: msg.program ?? null,</code> | 设置字段 `program`。 关键字：`null`＝空值。 |
| 115 | <code>alarmCode: typeof msg.alarmCode === 'number' ? msg.alarmCode : 0,</code> | 设置字段 `alarmCode`。 关键字：`typeof`＝读取值的运行时类型。 |
| 116 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 117 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 123 | <code>private flushRobots() {</code> | 定义或调用 `flushRobots`，参数由括号给出。 关键字：`private`＝限定类内部访问。 |
| 127 | <code>const rows = this.robotBuffer.splice(0, this.robotBuffer.length);</code> | 声明变量 `rows` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 129 | <code>if (rows.length === 0) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 131 | <code>const values: any[] = [];</code> | 声明变量 `values` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`any`＝跳过静态类型检查。 |
| 133 | <code>const tuple = rows</code> | 声明变量 `tuple` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 134 | <code>.map((r, i) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 135 | <code>const o = i * 8;</code> | 声明变量 `o` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 137 | <code>values.push(r.time, r.deviceId, r.joints, r.tcp, r.speedPct, r.mode, r.program, r.alarmCode);</code> | 调用函数、设置值或更新状态。 |
| 139 | <code>return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 140 | <code>})</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 141 | <code>.join(',');</code> | 调用函数、设置值或更新状态。 |
| 146 | <code>this.pool</code> | 续写当前表达式、对象、类型或调用。 关键字：`this`＝当前对象实例。 |
| 147 | <code>.query(</code> | 调用函数、设置值或更新状态。 |
| 148 | <code>`INSERT INTO robot_joint_states</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 149 | <code>("time", device_id, joints, tcp_pose, speed_pct, mode, program, alarm_code)</code> | 续写当前表达式、对象、类型或调用。 |
| 150 | <code>VALUES ${tuple}`,</code> | 列出待写入的值。 关键字：`VALUES`＝给出插入值。 |
| 151 | <code>values,</code> | 续写当前表达式、对象、类型或调用。 |
| 152 | <code>)</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 155 | <code>.catch((e: Error) =&gt;</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常。 |
| 156 | <code>this.logger.error(`批量写 robot_joint_states 失败,${rows.length} 行丢弃: ${e.message}`),</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 157 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 158 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 165 | <code>insertLineStatus(lineCode: string, msg: any) {</code> | 定义或调用 `insertLineStatus`，参数由括号给出。 关键字：`any`＝跳过静态类型检查。 |
| 167 | <code>const lineId = this.catalog.lineId(lineCode);</code> | 声明变量 `lineId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 168 | <code>if (lineId === undefined) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。 |
| 170 | <code>const t = toTime(msg);</code> | 声明变量 `t` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 174 | <code>const args = [</code> | 声明变量 `args` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 175 | <code>lineId, msg.state ?? 'idle', msg.productCode ?? null,</code> | 续写当前表达式、对象、类型或调用。 关键字：`null`＝空值。 |
| 176 | <code>num(msg.goodCount), num(msg.ngCount), msg.beatMs ?? null, t,</code> | 定义或调用 `num`，参数由括号给出。 关键字：`null`＝空值。 |
| 177 | <code>];</code> | 续写当前表达式、对象、类型或调用。 |
| 181 | <code>const upsert = this.pool.query(</code> | 声明变量 `upsert` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 182 | <code>`INSERT INTO line_current_status (line_id, state, product_code, good_count, ng_count, beat_ms, updated_at)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 183 | <code>VALUES ($1,$2,$3,$4,$5,$6,$7)</code> | 列出待写入的值。 关键字：`VALUES`＝给出插入值。 |
| 184 | <code>ON CONFLICT (line_id) DO UPDATE SET</code> | 设置连接或冲突条件。 关键字：`ON`＝指定连接或冲突条件；`DO`＝执行匿名 SQL 代码块；`UPDATE`＝修改已有行；`SET`＝指定更新字段或配置值。 |
| 185 | <code>state = EXCLUDED.state, product_code = EXCLUDED.product_code,</code> | 调用函数、设置值或更新状态。 |
| 186 | <code>good_count = EXCLUDED.good_count, ng_count = EXCLUDED.ng_count,</code> | 调用函数、设置值或更新状态。 |
| 187 | <code>beat_ms = EXCLUDED.beat_ms, updated_at = EXCLUDED.updated_at`,</code> | 调用函数、设置值或更新状态。 |
| 188 | <code>args,</code> | 续写当前表达式、对象、类型或调用。 |
| 189 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 194 | <code>const history = this.pool.query(</code> | 声明变量 `history` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 195 | <code>`INSERT INTO line_status_history ("time", line_id, state, product_code, good_count, ng_count, beat_ms)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 196 | <code>VALUES ($7,$1,$2,$3,$4,$5,$6)`,</code> | 列出待写入的值。 关键字：`VALUES`＝给出插入值。 |
| 197 | <code>args,</code> | 续写当前表达式、对象、类型或调用。 |
| 198 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 200 | <code>Promise.all([upsert, history]).catch((e: Error) =&gt;</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常。 |
| 201 | <code>this.logger.error(`写产线状态失败: ${e.message}`),</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 202 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 203 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 210 | <code>insertEvent(lineCode: string, msg: any) {</code> | 定义或调用 `insertEvent`，参数由括号给出。 关键字：`any`＝跳过静态类型检查。 |
| 211 | <code>const lineId = this.catalog.lineId(lineCode);</code> | 声明变量 `lineId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 212 | <code>if (lineId === undefined) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。 |
| 214 | <code>const deviceId = msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined;</code> | 声明变量 `deviceId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例；`undefined`＝未定义值。 |
| 215 | <code>this.pool</code> | 续写当前表达式、对象、类型或调用。 关键字：`this`＝当前对象实例。 |
| 216 | <code>.query(</code> | 调用函数、设置值或更新状态。 |
| 217 | <code>`INSERT INTO production_events ("time", line_id, device_id, type, level, code, message, payload)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 218 | <code>VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,</code> | 列出待写入的值。 关键字：`VALUES`＝给出插入值。 |
| 219 | <code>[</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 220 | <code>toTime(msg), lineId, deviceId ?? null, msg.type ?? 'custom', msg.level ?? 'info',</code> | 定义或调用 `toTime`，参数由括号给出。 关键字：`null`＝空值。 |
| 221 | <code>msg.code ?? null, msg.message ?? null, JSON.stringify(msg.payload ?? {}),</code> | 续写当前表达式、对象、类型或调用。 关键字：`null`＝空值。 |
| 222 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 223 | <code>)</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 224 | <code>.catch((e: Error) =&gt; this.logger.error(`写事件失败: ${e.message}`));</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常；`this`＝当前对象实例。 |
| 225 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 231 | <code>ackCommand(msg: any) {</code> | 定义或调用 `ackCommand`，参数由括号给出。 关键字：`any`＝跳过静态类型检查。 |
| 233 | <code>if (!msg.cmdId) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 235 | <code>if (!['acked', 'rejected', 'failed'].includes(msg.status)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 236 | <code>this.logger.warn(`忽略非法指令回执状态: ${String(msg.status)}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 237 | <code>return;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 238 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 239 | <code>this.pool</code> | 续写当前表达式、对象、类型或调用。 关键字：`this`＝当前对象实例。 |
| 240 | <code>.query(</code> | 调用函数、设置值或更新状态。 |
| 241 | <code>`UPDATE control_commands</code> | 修改数据。 关键字：`UPDATE`＝修改已有行。 |
| 242 | <code>SET status = $2, ack_payload = $3, acked_at = now()</code> | 续写当前表达式、对象、类型或调用。 |
| 243 | <code>WHERE idempotency_key = $1 AND status IN ('pending','sent')`,</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。 |
| 244 | <code>[String(msg.cmdId), msg.status, JSON.stringify(msg)],</code> | 续写当前表达式、对象、类型或调用。 |
| 245 | <code>)</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 246 | <code>.then((r) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 248 | <code>if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例。 |
| 249 | <code>})</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 250 | <code>.catch((e: Error) =&gt; this.logger.error(`更新指令回执失败: ${e.message}`));</code> | 调用函数、设置值或更新状态。 关键字：`catch`＝捕获异常；`this`＝当前对象实例。 |
| 251 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 252 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 260 | <code>function toTime(msg: any): Date {</code> | 定义函数 `toTime`。 关键字：`function`＝定义函数；`any`＝跳过静态类型检查。 |
| 261 | <code>return typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date();</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`typeof`＝读取值的运行时类型；`new`＝创建对象实例。 |
| 262 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 264 | <code>function num(v: any): number {</code> | 定义函数 `num`。 关键字：`function`＝定义函数；`any`＝跳过静态类型检查。 |
| 265 | <code>return typeof v === 'number' &amp;&amp; Number.isFinite(v) ? v : 0;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`typeof`＝读取值的运行时类型。 |
| 266 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
