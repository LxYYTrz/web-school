# server/src/ingest/mqtt-ingest.service.ts 逐行说明

[打开源码](../../../../../server/src/ingest/mqtt-ingest.service.ts) · 250 行 · 99 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 77 | <code>import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 78 | <code>import { connect, MqttClient } from 'mqtt';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 79 | <code>import { config } from '../config/configuration';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 80 | <code>import { LineStateService } from '../state/line-state.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 81 | <code>import { HistoryWriterService } from '../history/history-writer.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 82 | <code>import { TelemetryGateway } from '../realtime/telemetry.gateway';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 89 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 90 | <code>export class MqttIngestService implements OnModuleInit, OnModuleDestroy {</code> | 声明 `MqttIngestService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。 |
| 91 | <code>private readonly logger = new Logger(MqttIngestService.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 93 | <code>private client: MqttClient;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问。 |
| 100 | <code>constructor(</code> | 调用函数、设置值或更新状态。 |
| 101 | <code>private readonly state: LineStateService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 102 | <code>private readonly history: HistoryWriterService,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 103 | <code>private readonly gateway: TelemetryGateway,</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 104 | <code>) {}</code> | 续写当前表达式、对象、类型或调用。 |
| 106 | <code>onModuleInit() {</code> | 定义或调用 `onModuleInit`，参数由括号给出。 |
| 108 | <code>const p = config.topicPrefix;</code> | 声明变量 `p` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 111 | <code>this.client = connect(config.mqtt.url, {</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 112 | <code>clientId: config.mqtt.clientId,</code> | 设置字段 `clientId`。 |
| 113 | <code>username: config.mqtt.username,</code> | 设置字段 `username`。 |
| 114 | <code>password: config.mqtt.password,</code> | 设置字段 `password`。 |
| 115 | <code>keepalive: 30,</code> | 设置字段 `keepalive`。 |
| 116 | <code>reconnectPeriod: 2000,</code> | 设置字段 `reconnectPeriod`。 |
| 117 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 119 | <code>this.client.on('connect', () =&gt; {</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 120 | <code>this.logger.log(`MQTT 已连接: ${config.mqtt.url}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 125 | <code>this.client.subscribe(</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 126 | <code>[</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 127 | <code>`${p}/+/telemetry/robot/+`,</code> | 续写当前表达式、对象、类型或调用。 |
| 128 | <code>`${p}/+/telemetry/io`,</code> | 续写当前表达式、对象、类型或调用。 |
| 129 | <code>`${p}/+/telemetry/status`,</code> | 续写当前表达式、对象、类型或调用。 |
| 130 | <code>`${p}/+/event`,</code> | 续写当前表达式、对象、类型或调用。 |
| 131 | <code>`${p}/+/edge/status`,</code> | 续写当前表达式、对象、类型或调用。 |
| 132 | <code>`${p}/+/cmd_ack`,</code> | 续写当前表达式、对象、类型或调用。 |
| 133 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 134 | <code>{ qos: 1 },</code> | 续写当前表达式、对象、类型或调用。 |
| 135 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 136 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 138 | <code>this.client.on('reconnect', () =&gt; this.logger.warn('MQTT 重连中...'));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 140 | <code>this.client.on('error', (e) =&gt; this.logger.error(`MQTT 错误: ${e.message}`));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 143 | <code>this.client.on('message', (topic, payload) =&gt; this.dispatch(topic, payload));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 144 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 151 | <code>onModuleDestroy() {</code> | 定义或调用 `onModuleDestroy`，参数由括号给出。 |
| 152 | <code>this.client?.end();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 153 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 170 | <code>publishCommand(lineId: string, deviceId: string, cmd: Record&lt;string, unknown&gt;) {</code> | 定义或调用 `publishCommand`，参数由括号给出。 关键字：`unknown`＝需检查后才能使用的类型。 |
| 171 | <code>this.client.publish(</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 172 | <code>`${config.topicPrefix}/${lineId}/cmd/${deviceId}`,</code> | 续写当前表达式、对象、类型或调用。 |
| 173 | <code>JSON.stringify(cmd),</code> | 调用函数、设置值或更新状态。 |
| 174 | <code>{ qos: 1 },</code> | 续写当前表达式、对象、类型或调用。 |
| 175 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 176 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 178 | <code>private dispatch(topic: string, payload: Buffer) {</code> | 定义或调用 `dispatch`，参数由括号给出。 关键字：`private`＝限定类内部访问。 |
| 183 | <code>const seg = topic.split('/');</code> | 声明变量 `seg` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 185 | <code>const lineId = seg[2];</code> | 声明变量 `lineId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 187 | <code>const kind = seg.slice(3).join('/');</code> | 声明变量 `kind` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 190 | <code>let msg: any;</code> | 声明变量 `msg` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`any`＝跳过静态类型检查。 |
| 192 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 194 | <code>msg = JSON.parse(payload.toString('utf8'));</code> | 调用函数、设置值或更新状态。 |
| 195 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 197 | <code>this.logger.warn(`非 JSON 报文已忽略: ${topic}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 198 | <code>return;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 199 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 201 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 203 | <code>if (kind.startsWith('telemetry/robot/')) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 205 | <code>const deviceId = seg[5];</code> | 声明变量 `deviceId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 208 | <code>if (!Array.isArray(msg.joints) &#124;&#124; msg.joints.length !== 6) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 209 | <code>this.logger.warn(`robot_state 缺少合法 joints[6],已忽略: ${topic}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 210 | <code>return;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 211 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 213 | <code>this.state.setRobotFrame(lineId, deviceId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 215 | <code>this.history.bufferRobotFrame(deviceId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 217 | <code>this.gateway.broadcastRobot(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 218 | <code>} else if (kind === 'telemetry/io') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 221 | <code>if (!msg.io &#124;&#124; typeof msg.io !== 'object' &#124;&#124; Array.isArray(msg.io)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型。 |
| 222 | <code>this.logger.warn(`io_state 缺少合法 io 对象,已忽略: ${topic}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 223 | <code>return;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 224 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 225 | <code>this.state.setIoFrame(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 226 | <code>this.gateway.broadcastIo(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 228 | <code>} else if (kind === 'telemetry/status') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 229 | <code>this.state.setLineStatus(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 230 | <code>this.history.insertLineStatus(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 231 | <code>this.gateway.broadcastLineStatus(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 233 | <code>} else if (kind === 'event') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 234 | <code>this.history.insertEvent(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 235 | <code>this.gateway.broadcastEvent(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 237 | <code>} else if (kind === 'edge/status') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 238 | <code>this.state.setEdgeStatus(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 239 | <code>this.gateway.broadcastEdge(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 241 | <code>} else if (kind === 'cmd_ack') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 242 | <code>this.history.ackCommand(msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 243 | <code>this.gateway.broadcastCommandAck(lineId, msg);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 244 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 245 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 247 | <code>this.logger.error(`报文处理失败 ${topic}: ${(e as Error).message}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 248 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 249 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 250 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
