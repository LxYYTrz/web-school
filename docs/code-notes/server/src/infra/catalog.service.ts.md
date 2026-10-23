# server/src/infra/catalog.service.ts 逐行说明

[打开源码](../../../../../server/src/infra/catalog.service.ts) · 112 行 · 38 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 30 | <code>import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 31 | <code>import { Pool } from 'pg';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 32 | <code>import { PG_POOL } from './tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 41 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 42 | <code>export class CatalogService implements OnModuleInit, OnModuleDestroy {</code> | 声明 `CatalogService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。 |
| 44 | <code>private readonly logger = new Logger(CatalogService.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 46 | <code>private lines = new Map&lt;string, number&gt;();</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`new`＝创建对象实例。 |
| 48 | <code>private devices = new Map&lt;string, number&gt;();</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`new`＝创建对象实例。 |
| 51 | <code>private timer?: NodeJS.Timeout;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问。 |
| 57 | <code>constructor(@Inject(PG_POOL) private readonly pool: Pool) {}</code> | 定义或调用 `constructor`，参数由括号给出。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 59 | <code>async onModuleInit() {</code> | 定义或调用 `onModuleInit`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 61 | <code>await this.reload();</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 65 | <code>this.timer = setInterval(() =&gt; {</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 66 | <code>this.reload().catch((e: Error) =&gt; this.logger.error(`映射刷新失败: ${e.message}`));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`catch`＝捕获异常。 |
| 67 | <code>}, 60_000);</code> | 续写当前表达式、对象、类型或调用。 |
| 70 | <code>this.timer.unref();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 71 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 76 | <code>onModuleDestroy() {</code> | 定义或调用 `onModuleDestroy`，参数由括号给出。 |
| 77 | <code>if (this.timer) clearInterval(this.timer);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例。 |
| 78 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 80 | <code>async reload() {</code> | 定义或调用 `reload`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 82 | <code>const lines = await this.pool.query('SELECT id, code FROM production_lines');</code> | 声明变量 `lines` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 84 | <code>const devices = await this.pool.query('SELECT id, code FROM devices');</code> | 声明变量 `devices` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。 |
| 87 | <code>this.lines = new Map(lines.rows.map((r) =&gt; [String(r.code), Number(r.id)]));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。 |
| 88 | <code>this.devices = new Map(devices.rows.map((r) =&gt; [String(r.code), Number(r.id)]));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。 |
| 90 | <code>this.logger.log(`编码映射已加载:${this.lines.size} 条产线 / ${this.devices.size} 台设备`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 91 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 97 | <code>lineId(code: string): number &#124; undefined {</code> | 定义或调用 `lineId`，参数由括号给出。 关键字：`undefined`＝未定义值。 |
| 98 | <code>const id = this.lines.get(code);</code> | 声明变量 `id` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 100 | <code>if (id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`this`＝当前对象实例。 |
| 101 | <code>return id;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 102 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 107 | <code>deviceId(code: string): number &#124; undefined {</code> | 定义或调用 `deviceId`，参数由括号给出。 关键字：`undefined`＝未定义值。 |
| 108 | <code>const id = this.devices.get(code);</code> | 声明变量 `id` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 109 | <code>if (id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`this`＝当前对象实例。 |
| 110 | <code>return id;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 111 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 112 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
