# web/src/composables/useLineData.ts 逐行说明

[打开源码](../../../../../web/src/composables/useLineData.ts) · 259 行 · 136 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 47 | <code>import { computed, ref } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 48 | <code>import { getSocket, fetchSnapshot } from '../services/socket';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 49 | <code>import type {</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名。 |
| 50 | <code>IoState,</code> | 续写当前表达式、对象、类型或调用。 |
| 51 | <code>LineSnapshot,</code> | 续写当前表达式、对象、类型或调用。 |
| 52 | <code>LineStatus,</code> | 续写当前表达式、对象、类型或调用。 |
| 53 | <code>ProductionEvent,</code> | 续写当前表达式、对象、类型或调用。 |
| 54 | <code>RobotState,</code> | 续写当前表达式、对象、类型或调用。 |
| 55 | <code>} from '../services/types';</code> | 续写当前表达式、对象、类型或调用。 关键字：`from`＝指定导入来源。 |
| 58 | <code>const MAX_FEED = 60;</code> | 声明变量 `MAX_FEED` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 64 | <code>const MOCK_NOW = () =&gt; Date.now();</code> | 声明变量 `MOCK_NOW` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 65 | <code>const MOCK_EARLIER = (secAgo: number) =&gt; Date.now() - secAgo * 1000;</code> | 声明变量 `MOCK_EARLIER` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 66 | <code>const MOCK_ENABLED = import.meta.env.VITE_MOCK_ONLY === 'true';</code> | 声明变量 `MOCK_ENABLED` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号。 |
| 67 | <code>const MOCK_ROBOT: RobotState = {</code> | 声明变量 `MOCK_ROBOT` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 68 | <code>ts: MOCK_NOW(),</code> | 设置字段 `ts`。 |
| 69 | <code>deviceId: 'robot-01',</code> | 设置字段 `deviceId`。 |
| 70 | <code>joints: [10.2, -35.0, 42.1, 0.5, 88.0, 12.3],</code> | 设置字段 `joints`。 |
| 71 | <code>tcp: [512.3, -120.5, 388.0, 179.9, 0.2, 45.0],</code> | 设置字段 `tcp`。 |
| 72 | <code>speedPct: 80,</code> | 设置字段 `speedPct`。 |
| 73 | <code>mode: 'auto',</code> | 设置字段 `mode`。 |
| 74 | <code>program: 'PICK_A',</code> | 设置字段 `program`。 |
| 75 | <code>alarmCode: 0,</code> | 设置字段 `alarmCode`。 |
| 76 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 77 | <code>const MOCK_STATUS: LineStatus = {</code> | 声明变量 `MOCK_STATUS` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 78 | <code>ts: MOCK_NOW(),</code> | 设置字段 `ts`。 |
| 79 | <code>lineId: 'line-01',</code> | 设置字段 `lineId`。 |
| 80 | <code>state: 'running',</code> | 设置字段 `state`。 |
| 81 | <code>productCode: 'P-1001',</code> | 设置字段 `productCode`。 |
| 82 | <code>goodCount: 1024,</code> | 设置字段 `goodCount`。 |
| 83 | <code>ngCount: 3,</code> | 设置字段 `ngCount`。 |
| 84 | <code>beatMs: 8500,</code> | 设置字段 `beatMs`。 |
| 85 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 86 | <code>const MOCK_EVENTS: ProductionEvent[] = [</code> | 声明变量 `MOCK_EVENTS` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 87 | <code>{ ts: MOCK_EARLIER(2),  lineId: 'line-01', deviceId: 'plc-01', type: 'start',      level: 'info',    message: '产线启动(mock)' },</code> | 续写当前表达式、对象、类型或调用。 |
| 88 | <code>{ ts: MOCK_EARLIER(8),  lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000001 完成' },</code> | 续写当前表达式、对象、类型或调用。 |
| 89 | <code>{ ts: MOCK_EARLIER(15), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000002 完成' },</code> | 续写当前表达式、对象、类型或调用。 |
| 90 | <code>{ ts: MOCK_EARLIER(23), lineId: 'line-01', deviceId: 'plc-01',   type: 'alarm',      level: 'warning', code: 'W201', message: '气源压力偏低(mock)' },</code> | 续写当前表达式、对象、类型或调用。 |
| 91 | <code>{ ts: MOCK_EARLIER(30), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000003 完成' },</code> | 续写当前表达式、对象、类型或调用。 |
| 92 | <code>];</code> | 续写当前表达式、对象、类型或调用。 |
| 94 | <code>const MOCK_IO: IoState = {</code> | 声明变量 `MOCK_IO` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 95 | <code>ts: MOCK_NOW(), lineId: 'line-01',</code> | 设置字段 `ts`。 |
| 96 | <code>io: {</code> | 设置字段 `io`。 |
| 97 | <code>sensorIn: 1, sensorArrive: 0, sensorRetreat: null,</code> | 设置字段 `sensorIn`。 关键字：`null`＝空值。 |
| 98 | <code>lightColor: 1, trayUp: 1, blockUp: 0,</code> | 设置字段 `lightColor`。 |
| 99 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 100 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 112 | <code>function createLineData(lineId: string) {</code> | 定义函数 `createLineData`。 关键字：`function`＝定义函数。 |
| 114 | <code>const socket = getSocket();</code> | 声明变量 `socket` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 118 | <code>const connected = ref(false);</code> | 声明变量 `connected` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。 |
| 120 | <code>const edgeOnline = ref&lt;boolean &#124; null&gt;(null);</code> | 声明变量 `edgeOnline` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 122 | <code>const robot = ref&lt;RobotState &#124; null&gt;(null);</code> | 声明变量 `robot` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 124 | <code>const status = ref&lt;LineStatus &#124; null&gt;(null);</code> | 声明变量 `status` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 125 | <code>const io = ref&lt;IoState &#124; null&gt;(null);</code> | 声明变量 `io` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 127 | <code>const events = ref&lt;ProductionEvent[]&gt;([]);</code> | 声明变量 `events` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 128 | <code>const lastEventAt = ref(0);</code> | 声明变量 `lastEventAt` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 130 | <code>const liveSeen = { robot: false, status: false, io: false, edge: false, event: false };</code> | 声明变量 `liveSeen` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。 |
| 137 | <code>async function preload() {</code> | 定义函数 `preload`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 138 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 140 | <code>const snap = (await fetchSnapshot(lineId)) as LineSnapshot;</code> | 声明变量 `snap` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 142 | <code>if (snap.status &amp;&amp; !liveSeen.status) status.value = snap.status;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 144 | <code>if (snap.edge &amp;&amp; !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 145 | <code>if (snap.io &amp;&amp; !liveSeen.io) io.value = snap.io;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 149 | <code>const first = Object.values(snap.robots ?? {})[0];</code> | 声明变量 `first` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 150 | <code>if (first &amp;&amp; !liveSeen.robot) robot.value = first;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 151 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 153 | <code>console.warn('[lineData] snapshot 预载失败', e);</code> | 调用函数、设置值或更新状态。 |
| 155 | <code>if (MOCK_ENABLED) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 156 | <code>if (!liveSeen.robot) robot.value = MOCK_ROBOT;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 157 | <code>if (!liveSeen.status) status.value = MOCK_STATUS;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 158 | <code>if (!liveSeen.event) events.value = MOCK_EVENTS;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 159 | <code>if (!liveSeen.edge) edgeOnline.value = true;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`true`＝布尔真值。 |
| 160 | <code>if (!liveSeen.io) io.value = MOCK_IO;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 161 | <code>if (!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 162 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 163 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 164 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 170 | <code>function subscribe() {</code> | 定义函数 `subscribe`。 关键字：`function`＝定义函数。 |
| 171 | <code>socket.emit('subscribe', { lineId });</code> | 调用函数、设置值或更新状态。 |
| 172 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 175 | <code>socket.on('connect', () =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 176 | <code>connected.value = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 177 | <code>subscribe();</code> | 定义或调用 `subscribe`，参数由括号给出。 |
| 178 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 180 | <code>socket.on('disconnect', () =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 181 | <code>connected.value = false;</code> | 调用函数、设置值或更新状态。 关键字：`false`＝布尔假值。 |
| 182 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 184 | <code>socket.on('robot_state', (msg: RobotState) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 185 | <code>liveSeen.robot = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 186 | <code>robot.value = msg;</code> | 调用函数、设置值或更新状态。 |
| 187 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 189 | <code>socket.on('line_status', (msg: LineStatus) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 190 | <code>liveSeen.status = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 191 | <code>status.value = msg;</code> | 调用函数、设置值或更新状态。 |
| 192 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 193 | <code>socket.on('io_state', (msg: IoState) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 194 | <code>liveSeen.io = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 195 | <code>io.value = msg;</code> | 调用函数、设置值或更新状态。 |
| 196 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 198 | <code>socket.on('event', (msg: ProductionEvent) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 199 | <code>liveSeen.event = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 200 | <code>events.value.unshift(msg);</code> | 调用函数、设置值或更新状态。 |
| 202 | <code>if (events.value.length &gt; MAX_FEED) events.value.length = MAX_FEED;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 203 | <code>lastEventAt.value = msg.ts;</code> | 调用函数、设置值或更新状态。 |
| 204 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 206 | <code>socket.on('edge_status', (msg: { status: 'online' &#124; 'offline' }) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 207 | <code>liveSeen.edge = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 208 | <code>edgeOnline.value = msg.status === 'online';</code> | 调用函数、设置值或更新状态。 |
| 209 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 212 | <code>void preload();</code> | 续写当前表达式、对象、类型或调用。 关键字：`void`＝表示没有返回值。 |
| 214 | <code>if (socket.connected) subscribe();</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 221 | <code>const alarmText = computed(() =&gt; {</code> | 声明变量 `alarmText` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 223 | <code>if (robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 225 | <code>const latestAlarm = events.value.find((e) =&gt; e.type === 'alarm');</code> | 声明变量 `latestAlarm` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 226 | <code>return latestAlarm?.message ?? null;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。 |
| 227 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 232 | <code>const edgeText = computed(() =&gt; {</code> | 声明变量 `edgeText` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 233 | <code>if (edgeOnline.value === null) return '未知';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`null`＝空值；`return`＝返回结果并结束当前函数。 |
| 234 | <code>return edgeOnline.value ? '在线' : '离线';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 235 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 238 | <code>return {</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 239 | <code>connected,</code> | 续写当前表达式、对象、类型或调用。 |
| 240 | <code>edgeOnline,</code> | 续写当前表达式、对象、类型或调用。 |
| 241 | <code>edgeText,</code> | 续写当前表达式、对象、类型或调用。 |
| 242 | <code>robot,</code> | 续写当前表达式、对象、类型或调用。 |
| 243 | <code>status,</code> | 续写当前表达式、对象、类型或调用。 |
| 244 | <code>io,</code> | 续写当前表达式、对象、类型或调用。 |
| 245 | <code>events,</code> | 续写当前表达式、对象、类型或调用。 |
| 246 | <code>alarmText,</code> | 续写当前表达式、对象、类型或调用。 |
| 247 | <code>lastEventAt,</code> | 续写当前表达式、对象、类型或调用。 |
| 248 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 249 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 252 | <code>let shared: ReturnType&lt;typeof createLineData&gt; &#124; null = null;</code> | 声明变量 `shared` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`typeof`＝读取值的运行时类型；`null`＝空值。 |
| 254 | <code>export function useLineData(lineId = 'line-01') {</code> | 定义函数 `useLineData`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。 |
| 256 | <code>if (!shared) shared = createLineData(lineId);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 258 | <code>return shared;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 259 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
