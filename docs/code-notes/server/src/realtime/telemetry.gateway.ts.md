# server/src/realtime/telemetry.gateway.ts 逐行说明

[打开源码](../../../../../server/src/realtime/telemetry.gateway.ts) · 119 行 · 41 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 47 | <code>import {</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 48 | <code>ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,</code> | 续写当前表达式、对象、类型或调用。 |
| 49 | <code>} from '@nestjs/websockets';</code> | 续写当前表达式、对象、类型或调用。 关键字：`from`＝指定导入来源。 |
| 50 | <code>import { Server, Socket } from 'socket.io';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 51 | <code>import { config } from '../config/configuration';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 55 | <code>@WebSocketGateway({ cors: { origin: config.http.corsOrigin } })</code> | 使用装饰器声明框架元数据或参数注入。 |
| 56 | <code>export class TelemetryGateway {</code> | 声明 `TelemetryGateway` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
| 58 | <code>@WebSocketServer() server: Server;</code> | 使用装饰器声明框架元数据或参数注入。 |
| 64 | <code>@SubscribeMessage('subscribe')</code> | 使用装饰器声明框架元数据或参数注入。 |
| 65 | <code>handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {</code> | 定义或调用 `handleSubscribe`，参数由括号给出。 |
| 67 | <code>if (!body?.lineId) return { ok: false, error: 'lineId required' };</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 70 | <code>void client.join(`line:${body.lineId}`);</code> | 续写当前表达式、对象、类型或调用。 关键字：`void`＝表示没有返回值。 |
| 72 | <code>return { ok: true, lineId: body.lineId };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 73 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 78 | <code>@SubscribeMessage('unsubscribe')</code> | 使用装饰器声明框架元数据或参数注入。 |
| 79 | <code>handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {</code> | 定义或调用 `handleUnsubscribe`，参数由括号给出。 |
| 80 | <code>if (body?.lineId) void client.leave(`line:${body.lineId}`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`void`＝表示没有返回值。 |
| 81 | <code>return { ok: true };</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 82 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 84 | <code>broadcastRobot(lineId: string, msg: unknown) {</code> | 定义或调用 `broadcastRobot`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 85 | <code>this.server?.to(`line:${lineId}`).emit('robot_state', msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 86 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 88 | <code>broadcastLineStatus(lineId: string, msg: unknown) {</code> | 定义或调用 `broadcastLineStatus`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 89 | <code>this.server?.to(`line:${lineId}`).emit('line_status', msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 90 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 93 | <code>broadcastIo(lineId: string, msg: unknown) {</code> | 定义或调用 `broadcastIo`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 94 | <code>this.server?.to(`line:${lineId}`).emit('io_state', msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 95 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 100 | <code>broadcastEvent(lineId: string, msg: unknown) {</code> | 定义或调用 `broadcastEvent`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 101 | <code>this.server?.to(`line:${lineId}`).emit('event', msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 102 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 104 | <code>broadcastEdge(lineId: string, msg: unknown) {</code> | 定义或调用 `broadcastEdge`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 105 | <code>this.server?.to(`line:${lineId}`).emit('edge_status', msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 106 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 109 | <code>broadcastCommandAck(lineId: string, msg: unknown) {</code> | 定义或调用 `broadcastCommandAck`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 110 | <code>this.server?.to(`line:${lineId}`).emit('command_ack', msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 111 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 116 | <code>broadcastAiProposal(lineId: string, msg: unknown) {</code> | 定义或调用 `broadcastAiProposal`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 117 | <code>this.server?.to(`line:${lineId}`).emit('ai_proposal', msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 118 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 119 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
