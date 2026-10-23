# web/src/services/types.ts 逐行说明

[打开源码](../../../../../web/src/services/types.ts) · 120 行 · 86 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 3 | <code>export interface RobotState {</code> | 声明 `RobotState` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 4 | <code>ts: number;</code> | 设置字段 `ts`。 |
| 5 | <code>deviceId: string;</code> | 设置字段 `deviceId`。 |
| 6 | <code>joints: [number, number, number, number, number, number];</code> | 设置字段 `joints`。 |
| 7 | <code>tcp: number[] &#124; null;</code> | 设置字段 `tcp`。 关键字：`null`＝空值。 |
| 8 | <code>speedPct: number;</code> | 设置字段 `speedPct`。 |
| 9 | <code>mode: 'manual' &#124; 'auto' &#124; 'remote' &#124; 'error' &#124; string;</code> | 设置字段 `mode`。 |
| 10 | <code>program: string;</code> | 设置字段 `program`。 |
| 11 | <code>alarmCode: number;</code> | 设置字段 `alarmCode`。 |
| 12 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 15 | <code>export interface LineStatus {</code> | 声明 `LineStatus` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 16 | <code>ts: number;</code> | 设置字段 `ts`。 |
| 17 | <code>lineId: string;</code> | 设置字段 `lineId`。 |
| 20 | <code>state:</code> | 设置字段 `state`。 |
| 21 | <code>&#124; 'running' &#124; 'idle' &#124; 'alarm' &#124; 'offline'</code> | 续写当前表达式、对象、类型或调用。 |
| 22 | <code>&#124; 'waiting_feed' &#124; 'feeding' &#124; 'assembling' &#124; 'waiting_robot'</code> | 续写当前表达式、对象、类型或调用。 |
| 23 | <code>&#124; 'unload_done' &#124; 'waiting_next'</code> | 续写当前表达式、对象、类型或调用。 |
| 24 | <code>&#124; 'init_error' &#124; 'stopped' &#124; 'manual_mode'</code> | 续写当前表达式、对象、类型或调用。 |
| 26 | <code>&#124; 'unloading'</code> | 续写当前表达式、对象、类型或调用。 |
| 27 | <code>&#124; string;</code> | 续写当前表达式、对象、类型或调用。 |
| 28 | <code>productCode: string;</code> | 设置字段 `productCode`。 |
| 29 | <code>goodCount: number;</code> | 设置字段 `goodCount`。 |
| 30 | <code>ngCount: number;</code> | 设置字段 `ngCount`。 |
| 31 | <code>beatMs: number;</code> | 设置字段 `beatMs`。 |
| 32 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 35 | <code>export interface ProductionEvent {</code> | 声明 `ProductionEvent` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 36 | <code>ts: number;</code> | 设置字段 `ts`。 |
| 37 | <code>lineId: string;</code> | 设置字段 `lineId`。 |
| 38 | <code>deviceId: string;</code> | 设置字段 `deviceId`。 |
| 39 | <code>type: 'start' &#124; 'stop' &#124; 'alarm' &#124; 'piece_done' &#124; 'changeover' &#124; 'custom' &#124; string;</code> | 设置字段 `type`。 |
| 40 | <code>level: 'info' &#124; 'warning' &#124; 'critical';</code> | 设置字段 `level`。 |
| 41 | <code>code?: string &#124; null;</code> | 续写当前表达式、对象、类型或调用。 关键字：`null`＝空值。 |
| 42 | <code>message?: string &#124; null;</code> | 续写当前表达式、对象、类型或调用。 关键字：`null`＝空值。 |
| 43 | <code>payload?: Record&lt;string, unknown&gt;;</code> | 续写当前表达式、对象、类型或调用。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 44 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 49 | <code>export type IoValue = number &#124; null;</code> | 声明 `IoValue` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名；`null`＝空值。 |
| 51 | <code>export interface IoSignals {</code> | 声明 `IoSignals` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 52 | <code>sensorIn: IoValue;      // word 11 入料传感器  1=有料 0=无料</code> | 设置字段 `sensorIn`。 |
| 53 | <code>sensorArrive: IoValue;  // word 12 到料传感器  1=有料 0=无料</code> | 设置字段 `sensorArrive`。 |
| 54 | <code>sensorRetreat: IoValue; // word 13 退料传感器  1=有料 0=无料</code> | 设置字段 `sensorRetreat`。 |
| 55 | <code>lightColor: IoValue;    // word 14 产线灯光颜色 0=绿灯 1=黄灯 2=红灯</code> | 设置字段 `lightColor`。 |
| 56 | <code>trayUp: IoValue;        // word 15 托料盘上升  1=上升 0=下降</code> | 设置字段 `trayUp`。 |
| 57 | <code>blockUp: IoValue;       // word 16 阻挡干上升  1=上升 0=下降</code> | 设置字段 `blockUp`。 |
| 58 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 60 | <code>export interface IoState {</code> | 声明 `IoState` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 61 | <code>ts: number;</code> | 设置字段 `ts`。 |
| 62 | <code>lineId: string;</code> | 设置字段 `lineId`。 |
| 63 | <code>io: IoSignals;</code> | 设置字段 `io`。 |
| 64 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 67 | <code>export interface LineSnapshot {</code> | 声明 `LineSnapshot` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 68 | <code>lineId: string;</code> | 设置字段 `lineId`。 |
| 69 | <code>ts: number;</code> | 设置字段 `ts`。 |
| 70 | <code>status: LineStatus &#124; null;</code> | 设置字段 `status`。 关键字：`null`＝空值。 |
| 71 | <code>edge: { status: 'online' &#124; 'offline' } &#124; null;</code> | 设置字段 `edge`。 关键字：`null`＝空值。 |
| 72 | <code>io: IoState &#124; null;</code> | 设置字段 `io`。 关键字：`null`＝空值。 |
| 73 | <code>robots: Record&lt;string, RobotState&gt;;</code> | 设置字段 `robots`。 |
| 74 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 77 | <code>export interface CommandAck {</code> | 声明 `CommandAck` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 78 | <code>cmdId: string;</code> | 设置字段 `cmdId`。 |
| 79 | <code>ts: number;</code> | 设置字段 `ts`。 |
| 80 | <code>status: 'acked' &#124; 'rejected' &#124; 'failed' &#124; 'timeout';</code> | 设置字段 `status`。 |
| 81 | <code>message?: string &#124; null;</code> | 续写当前表达式、对象、类型或调用。 关键字：`null`＝空值。 |
| 82 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 93 | <code>export interface AiProposal {</code> | 声明 `AiProposal` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 94 | <code>id: string;</code> | 设置字段 `id`。 |
| 95 | <code>lineId: string;</code> | 设置字段 `lineId`。 |
| 96 | <code>deviceId: string;</code> | 设置字段 `deviceId`。 |
| 97 | <code>type: string;</code> | 设置字段 `type`。 |
| 98 | <code>params: Record&lt;string, unknown&gt;;</code> | 设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 99 | <code>reason: string;</code> | 设置字段 `reason`。 |
| 100 | <code>status: 'pending';</code> | 设置字段 `status`。 |
| 101 | <code>createdAt: number;</code> | 设置字段 `createdAt`。 |
| 102 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 105 | <code>export interface AiStreamEvent {</code> | 声明 `AiStreamEvent` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 106 | <code>type: 'delta' &#124; 'tool' &#124; 'error' &#124; 'done';</code> | 设置字段 `type`。 |
| 107 | <code>text?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 108 | <code>name?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 109 | <code>message?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 110 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 113 | <code>export interface AiMessage {</code> | 声明 `AiMessage` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 114 | <code>role: 'user' &#124; 'assistant';</code> | 设置字段 `role`。 |
| 115 | <code>text: string;</code> | 设置字段 `text`。 |
| 117 | <code>tools?: string[];</code> | 续写当前表达式、对象、类型或调用。 |
| 118 | <code>error?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 119 | <code>proposal?: AiProposal;</code> | 续写当前表达式、对象、类型或调用。 |
| 120 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
