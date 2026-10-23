# server/src/ai/proposal.service.ts 逐行说明

[打开源码](../../../../../server/src/ai/proposal.service.ts) · 116 行 · 85 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 2 | <code>import Redis from 'ioredis';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 3 | <code>import { REDIS } from '../infra/tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 4 | <code>import { TelemetryGateway } from '../realtime/telemetry.gateway';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 5 | <code>import { ALLOWED_TYPES, EXECUTABLE_TYPES, validateParams } from '../command/command-contract';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 16 | <code>export interface AiProposal {</code> | 声明 `AiProposal` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 17 | <code>id: string;</code> | 设置字段 `id`。 |
| 18 | <code>lineId: string;</code> | 设置字段 `lineId`。 |
| 19 | <code>deviceId: string;</code> | 设置字段 `deviceId`。 |
| 20 | <code>type: string;</code> | 设置字段 `type`。 |
| 21 | <code>params: Record&lt;string, unknown&gt;;</code> | 设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 22 | <code>reason: string;</code> | 设置字段 `reason`。 |
| 23 | <code>status: 'pending';</code> | 设置字段 `status`。 |
| 24 | <code>createdAt: number;</code> | 设置字段 `createdAt`。 |
| 25 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 27 | <code>const PROPOSAL_CHANNEL = 'ai:proposal';</code> | 声明变量 `PROPOSAL_CHANNEL` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 28 | <code>const keyOf = (id: string) =&gt; `ai:proposal:${id}`;</code> | 声明变量 `keyOf` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 32 | <code>const CLAIM_LUA = `</code> | 声明变量 `CLAIM_LUA` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 33 | <code>local v = redis.call('GET', KEYS[1])</code> | 续写当前表达式、对象、类型或调用。 |
| 34 | <code>if v == false then return nil end</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`false`＝布尔假值；`return`＝返回结果并结束当前函数。 |
| 35 | <code>redis.call('DEL', KEYS[1])</code> | 调用函数、设置值或更新状态。 |
| 36 | <code>return v</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 37 | <code>`;</code> | 续写当前表达式、对象、类型或调用。 |
| 39 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 40 | <code>export class ProposalService implements OnModuleInit, OnModuleDestroy {</code> | 声明 `ProposalService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。 |
| 41 | <code>private readonly logger = new Logger(ProposalService.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 43 | <code>private sub?: Redis;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问。 |
| 45 | <code>constructor(</code> | 调用函数、设置值或更新状态。 |
| 46 | <code>@Inject(REDIS) private readonly redis: Redis,</code> | 使用装饰器声明框架元数据或参数注入。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 47 | <code>private readonly gateway: TelemetryGateway,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 48 | <code>) {}</code> | 续写当前表达式、对象、类型或调用。 |
| 50 | <code>onModuleInit() {</code> | 定义或调用 `onModuleInit`，参数由括号给出。 |
| 51 | <code>this.sub = this.redis.duplicate();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 52 | <code>this.sub.on('error', (e) =&gt; this.logger.error(`pubsub 连接错误: ${e.message}`));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 53 | <code>this.sub.subscribe(PROPOSAL_CHANNEL, (err) =&gt; {</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 54 | <code>if (err) return this.logger.error(`订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`this`＝当前对象实例。 |
| 55 | <code>this.logger.log(`已订阅 ${PROPOSAL_CHANNEL}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 56 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 57 | <code>this.sub.on('message', (channel, raw) =&gt; {</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 58 | <code>if (channel !== PROPOSAL_CHANNEL) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 59 | <code>void this.onProposalMessage(raw);</code> | 续写当前表达式、对象、类型或调用。 关键字：`void`＝表示没有返回值；`this`＝当前对象实例。 |
| 60 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 61 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 63 | <code>async onModuleDestroy() {</code> | 定义或调用 `onModuleDestroy`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 64 | <code>if (this.sub) await this.sub.quit().catch(() =&gt; undefined);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例；`await`＝等待异步操作完成；`catch`＝捕获异常；`undefined`＝未定义值。 |
| 65 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 67 | <code>private async onProposalMessage(raw: string) {</code> | 定义或调用 `onProposalMessage`，参数由括号给出。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数。 |
| 68 | <code>let p: AiProposal;</code> | 声明变量 `p` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量。 |
| 69 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 70 | <code>p = JSON.parse(raw) as AiProposal;</code> | 调用函数、设置值或更新状态。 |
| 71 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 72 | <code>return this.logger.warn(`丢弃非法提案 JSON: ${(e as Error).message}`);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。 |
| 73 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 75 | <code>const bad = this.revalidate(p);</code> | 声明变量 `bad` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 76 | <code>if (bad) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 78 | <code>return this.logger.warn(`拒绝二次校验未通过的提案 ${p?.id}: ${bad}`);</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。 |
| 79 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 82 | <code>await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 900);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 83 | <code>this.gateway.broadcastAiProposal(p.lineId, p);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 84 | <code>this.logger.log(`建议 ${p.id}(${p.type} @ ${p.lineId}/${p.deviceId}) 已推送 UI,等待人工确认`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 85 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 88 | <code>revalidate(p: AiProposal): string &#124; null {</code> | 定义或调用 `revalidate`，参数由括号给出。 关键字：`null`＝空值。 |
| 89 | <code>if (!p &#124;&#124; typeof p.id !== 'string' &#124;&#124; typeof p.lineId !== 'string') return '字段缺失';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型；`return`＝返回结果并结束当前函数。 |
| 90 | <code>if (!ALLOWED_TYPES.has(p.type)) return `type 不在白名单:${p.type}`;</code> | 声明 `不在白名单` 的结构。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 91 | <code>if (!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 92 | <code>const pv = validateParams(p.type, p.params);</code> | 声明变量 `pv` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 93 | <code>if (!pv.ok) return pv.error;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 94 | <code>return null;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 95 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 98 | <code>async claim(id: string): Promise&lt;AiProposal &#124; null&gt; {</code> | 定义或调用 `claim`，参数由括号给出。 关键字：`async`＝声明异步函数；`null`＝空值。 |
| 99 | <code>const raw = (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string &#124; null;</code> | 声明变量 `raw` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例；`null`＝空值。 |
| 100 | <code>if (!raw) return null;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 101 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 102 | <code>return JSON.parse(raw) as AiProposal;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 103 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 104 | <code>return null;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 105 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 106 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 109 | <code>async restore(p: AiProposal) {</code> | 定义或调用 `restore`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 110 | <code>await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 120);</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 111 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 113 | <code>get ttlSec() {</code> | 续写当前表达式、对象、类型或调用。 |
| 114 | <code>return 900;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 115 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 116 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
