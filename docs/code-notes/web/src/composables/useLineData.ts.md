# web/src/composables/useLineData.ts 逐行注释

[打开源码](../../../../../web/src/composables/useLineData.ts) · 259 行 · 136 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 47 行**

```text
import { computed, ref } from 'vue';
// 注释：从 vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 48 行**

```text
import { getSocket, fetchSnapshot } from '../services/socket';
// 注释：从 ../services/socket 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 49 行**

```text
import type {
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 50 行**

```text
  IoState,
// 注释：把变量 IoState 作为同名对象字段加入当前对象。
```

**源码第 51 行**

```text
  LineSnapshot,
// 注释：把变量 LineSnapshot 作为同名对象字段加入当前对象。
```

**源码第 52 行**

```text
  LineStatus,
// 注释：把变量 LineStatus 作为同名对象字段加入当前对象。
```

**源码第 53 行**

```text
  ProductionEvent,
// 注释：把变量 ProductionEvent 作为同名对象字段加入当前对象。
```

**源码第 54 行**

```text
  RobotState,
// 注释：把变量 RobotState 作为同名对象字段加入当前对象。
```

**源码第 55 行**

```text
} from '../services/types';
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`from`＝指定导入来源。
```

**源码第 58 行**

```text
const MAX_FEED = 60;
// 注释：声明 MAX_FEED，初始值由 60 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 64 行**

```text
const MOCK_NOW = () => Date.now();
// 注释：声明 MOCK_NOW，初始值由 () => Date.now() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 65 行**

```text
const MOCK_EARLIER = (secAgo: number) => Date.now() - secAgo * 1000;
// 注释：声明 MOCK_EARLIER，初始值由 (secAgo: number) => Date.now() - secAgo * 1000 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 66 行**

```text
const MOCK_ENABLED = import.meta.env.VITE_MOCK_ONLY === 'true';
// 注释：声明 MOCK_ENABLED，初始值由 import.meta.env.VITE_MOCK_ONLY === 'true' 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号。
```

**源码第 67 行**

```text
const MOCK_ROBOT: RobotState = {
// 注释：声明 MOCK_ROBOT，初始值由 { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 68 行**

```text
  ts: MOCK_NOW(),
// 注释：设置字段 `ts`。
```

**源码第 69 行**

```text
  deviceId: 'robot-01',
// 注释：设置字段 `deviceId`。
```

**源码第 70 行**

```text
  joints: [10.2, -35.0, 42.1, 0.5, 88.0, 12.3],
// 注释：设置字段 `joints`。
```

**源码第 71 行**

```text
  tcp: [512.3, -120.5, 388.0, 179.9, 0.2, 45.0],
// 注释：设置字段 `tcp`。
```

**源码第 72 行**

```text
  speedPct: 80,
// 注释：设置字段 `speedPct`。
```

**源码第 73 行**

```text
  mode: 'auto',
// 注释：设置字段 `mode`。
```

**源码第 74 行**

```text
  program: 'PICK_A',
// 注释：设置字段 `program`。
```

**源码第 75 行**

```text
  alarmCode: 0,
// 注释：设置字段 `alarmCode`。
```

**源码第 76 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 77 行**

```text
const MOCK_STATUS: LineStatus = {
// 注释：声明 MOCK_STATUS，初始值由 { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 78 行**

```text
  ts: MOCK_NOW(),
// 注释：设置字段 `ts`。
```

**源码第 79 行**

```text
  lineId: 'line-01',
// 注释：设置字段 `lineId`。
```

**源码第 80 行**

```text
  state: 'running',
// 注释：设置字段 `state`。
```

**源码第 81 行**

```text
  productCode: 'P-1001',
// 注释：设置字段 `productCode`。
```

**源码第 82 行**

```text
  goodCount: 1024,
// 注释：设置字段 `goodCount`。
```

**源码第 83 行**

```text
  ngCount: 3,
// 注释：设置字段 `ngCount`。
```

**源码第 84 行**

```text
  beatMs: 8500,
// 注释：设置字段 `beatMs`。
```

**源码第 85 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 86 行**

```text
const MOCK_EVENTS: ProductionEvent[] = [
// 注释：声明 MOCK_EVENTS，初始值由 [ 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 87 行**

```text
  { ts: MOCK_EARLIER(2),  lineId: 'line-01', deviceId: 'plc-01', type: 'start',      level: 'info',    message: '产线启动(mock)' },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
```

**源码第 88 行**

```text
  { ts: MOCK_EARLIER(8),  lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000001 完成' },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
```

**源码第 89 行**

```text
  { ts: MOCK_EARLIER(15), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000002 完成' },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
```

**源码第 90 行**

```text
  { ts: MOCK_EARLIER(23), lineId: 'line-01', deviceId: 'plc-01',   type: 'alarm',      level: 'warning', code: 'W201', message: '气源压力偏低(mock)' },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
```

**源码第 91 行**

```text
  { ts: MOCK_EARLIER(30), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000003 完成' },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
```

**源码第 92 行**

```text
];
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 94 行**

```text
const MOCK_IO: IoState = {
// 注释：声明 MOCK_IO，初始值由 { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 95 行**

```text
  ts: MOCK_NOW(), lineId: 'line-01',
// 注释：设置字段 `ts`。
```

**源码第 96 行**

```text
  io: {
// 注释：设置字段 `io`。
```

**源码第 97 行**

```text
    sensorIn: 1, sensorArrive: 0, sensorRetreat: null,
// 注释：设置字段 `sensorIn`。 关键字：`null`＝空值。
```

**源码第 98 行**

```text
    lightColor: 1, trayUp: 1, blockUp: 0,
// 注释：设置字段 `lightColor`。
```

**源码第 99 行**

```text
  },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 100 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 112 行**

```text
function createLineData(lineId: string) {
// 注释：定义函数 `createLineData`。 关键字：`function`＝定义函数。
```

**源码第 114 行**

```text
  const socket = getSocket();
// 注释：声明 socket，初始值由 getSocket() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 118 行**

```text
  const connected = ref(false);
// 注释：声明 connected，初始值由 ref(false) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。
```

**源码第 120 行**

```text
  const edgeOnline = ref<boolean | null>(null);
// 注释：声明 edgeOnline，初始值由 ref<boolean | null>(null) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。
```

**源码第 122 行**

```text
  const robot = ref<RobotState | null>(null);
// 注释：声明 robot，初始值由 ref<RobotState | null>(null) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。
```

**源码第 124 行**

```text
  const status = ref<LineStatus | null>(null);
// 注释：声明 status，初始值由 ref<LineStatus | null>(null) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。
```

**源码第 125 行**

```text
  const io = ref<IoState | null>(null);
// 注释：声明 io，初始值由 ref<IoState | null>(null) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。
```

**源码第 127 行**

```text
  const events = ref<ProductionEvent[]>([]);
// 注释：声明 events，初始值由 ref<ProductionEvent[]>([]) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 128 行**

```text
  const lastEventAt = ref(0);
// 注释：声明 lastEventAt，初始值由 ref(0) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 130 行**

```text
  const liveSeen = { robot: false, status: false, io: false, edge: false, event: false };
// 注释：声明 liveSeen，初始值由 { robot: false, status: false, io: false, edge: false, event: false } 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。
```

**源码第 137 行**

```text
  async function preload() {
// 注释：定义函数 `preload`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 138 行**

```text
    try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 140 行**

```text
      const snap = (await fetchSnapshot(lineId)) as LineSnapshot;
// 注释：声明 snap，初始值由 (await fetchSnapshot(lineId)) as LineSnapshot 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 142 行**

```text
      if (snap.status && !liveSeen.status) status.value = snap.status;
// 注释：判断 if (snap.status && !liveSeen.status) status.value = snap.status; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 144 行**

```text
      if (snap.edge && !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online';
// 注释：判断 if (snap.edge && !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 145 行**

```text
      if (snap.io && !liveSeen.io) io.value = snap.io;
// 注释：判断 if (snap.io && !liveSeen.io) io.value = snap.io; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 149 行**

```text
      const first = Object.values(snap.robots ?? {})[0];
// 注释：声明 first，初始值由 Object.values(snap.robots ?? {})[0] 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 150 行**

```text
      if (first && !liveSeen.robot) robot.value = first;
// 注释：判断 if (first && !liveSeen.robot) robot.value = first; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 151 行**

```text
    } catch (e) {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 153 行**

```text
      console.warn('[lineData] snapshot 预载失败', e);
// 注释：调用 console.warn，把括号中的值作为参数传入。
```

**源码第 155 行**

```text
      if (MOCK_ENABLED) {
// 注释：判断 if (MOCK_ENABLED) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 156 行**

```text
        if (!liveSeen.robot) robot.value = MOCK_ROBOT;
// 注释：判断 if (!liveSeen.robot) robot.value = MOCK_ROBOT; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 157 行**

```text
        if (!liveSeen.status) status.value = MOCK_STATUS;
// 注释：判断 if (!liveSeen.status) status.value = MOCK_STATUS; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 158 行**

```text
        if (!liveSeen.event) events.value = MOCK_EVENTS;
// 注释：判断 if (!liveSeen.event) events.value = MOCK_EVENTS; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 159 行**

```text
        if (!liveSeen.edge) edgeOnline.value = true;
// 注释：判断 if (!liveSeen.edge) edgeOnline.value = true; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`true`＝布尔真值。
```

**源码第 160 行**

```text
        if (!liveSeen.io) io.value = MOCK_IO;
// 注释：判断 if (!liveSeen.io) io.value = MOCK_IO; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 161 行**

```text
        if (!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts;
// 注释：判断 if (!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 162 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 163 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 164 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 170 行**

```text
  function subscribe() {
// 注释：定义函数 `subscribe`。 关键字：`function`＝定义函数。
```

**源码第 171 行**

```text
    socket.emit('subscribe', { lineId });
// 注释：调用 socket.emit，把括号中的值作为参数传入。
```

**源码第 172 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 175 行**

```text
  socket.on('connect', () => {
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 176 行**

```text
    connected.value = true;
// 注释：把右侧表达式的结果写入 connected.value。 关键字：`true`＝布尔真值。
```

**源码第 177 行**

```text
    subscribe();
// 注释：调用 subscribe；括号中的表达式是传入的参数。
```

**源码第 178 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 180 行**

```text
  socket.on('disconnect', () => {
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 181 行**

```text
    connected.value = false;
// 注释：把右侧表达式的结果写入 connected.value。 关键字：`false`＝布尔假值。
```

**源码第 182 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 184 行**

```text
  socket.on('robot_state', (msg: RobotState) => {
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 185 行**

```text
    liveSeen.robot = true;
// 注释：把右侧表达式的结果写入 liveSeen.robot。 关键字：`true`＝布尔真值。
```

**源码第 186 行**

```text
    robot.value = msg;
// 注释：把右侧表达式的结果写入 robot.value。
```

**源码第 187 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 189 行**

```text
  socket.on('line_status', (msg: LineStatus) => {
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 190 行**

```text
    liveSeen.status = true;
// 注释：把右侧表达式的结果写入 liveSeen.status。 关键字：`true`＝布尔真值。
```

**源码第 191 行**

```text
    status.value = msg;
// 注释：把右侧表达式的结果写入 status.value。
```

**源码第 192 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 193 行**

```text
  socket.on('io_state', (msg: IoState) => {
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 194 行**

```text
    liveSeen.io = true;
// 注释：把右侧表达式的结果写入 liveSeen.io。 关键字：`true`＝布尔真值。
```

**源码第 195 行**

```text
    io.value = msg;
// 注释：把右侧表达式的结果写入 io.value。
```

**源码第 196 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 198 行**

```text
  socket.on('event', (msg: ProductionEvent) => {
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 199 行**

```text
    liveSeen.event = true;
// 注释：把右侧表达式的结果写入 liveSeen.event。 关键字：`true`＝布尔真值。
```

**源码第 200 行**

```text
    events.value.unshift(msg);
// 注释：调用 events.value.unshift，把括号中的值作为参数传入。
```

**源码第 202 行**

```text
    if (events.value.length > MAX_FEED) events.value.length = MAX_FEED;
// 注释：判断 if (events.value.length > MAX_FEED) events.value.length = MAX_FEED; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 203 行**

```text
    lastEventAt.value = msg.ts;
// 注释：把右侧表达式的结果写入 lastEventAt.value。
```

**源码第 204 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 206 行**

```text
  socket.on('edge_status', (msg: { status: 'online' | 'offline' }) => {
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 207 行**

```text
    liveSeen.edge = true;
// 注释：把右侧表达式的结果写入 liveSeen.edge。 关键字：`true`＝布尔真值。
```

**源码第 208 行**

```text
    edgeOnline.value = msg.status === 'online';
// 注释：把右侧表达式的结果写入 edgeOnline.value。
```

**源码第 209 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 212 行**

```text
  void preload();
// 注释：调用 preload；括号中的表达式是传入的参数。 关键字：`void`＝表示没有返回值。
```

**源码第 214 行**

```text
  if (socket.connected) subscribe();
// 注释：判断 if (socket.connected) subscribe(); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 221 行**

```text
  const alarmText = computed(() => {
// 注释：声明 alarmText，初始值由 computed(() => { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 223 行**

```text
    if (robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`;
// 注释：判断 if (robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 225 行**

```text
    const latestAlarm = events.value.find((e) => e.type === 'alarm');
// 注释：声明 latestAlarm，初始值由 events.value.find((e) => e.type === 'alarm') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 226 行**

```text
    return latestAlarm?.message ?? null;
// 注释：返回 latestAlarm?.message ?? null 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 227 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 232 行**

```text
  const edgeText = computed(() => {
// 注释：声明 edgeText，初始值由 computed(() => { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 233 行**

```text
    if (edgeOnline.value === null) return '未知';
// 注释：判断 if (edgeOnline.value === null) return '未知'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`null`＝空值；`return`＝返回结果并结束当前函数。
```

**源码第 234 行**

```text
    return edgeOnline.value ? '在线' : '离线';
// 注释：返回 edgeOnline.value ? '在线' : '离线' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 235 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 238 行**

```text
  return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 239 行**

```text
    connected,
// 注释：把变量 connected 作为同名对象字段加入当前对象。
```

**源码第 240 行**

```text
    edgeOnline,
// 注释：把变量 edgeOnline 作为同名对象字段加入当前对象。
```

**源码第 241 行**

```text
    edgeText,
// 注释：把变量 edgeText 作为同名对象字段加入当前对象。
```

**源码第 242 行**

```text
    robot,
// 注释：把变量 robot 作为同名对象字段加入当前对象。
```

**源码第 243 行**

```text
    status,
// 注释：把变量 status 作为同名对象字段加入当前对象。
```

**源码第 244 行**

```text
    io,
// 注释：把变量 io 作为同名对象字段加入当前对象。
```

**源码第 245 行**

```text
    events,
// 注释：把变量 events 作为同名对象字段加入当前对象。
```

**源码第 246 行**

```text
    alarmText,
// 注释：把变量 alarmText 作为同名对象字段加入当前对象。
```

**源码第 247 行**

```text
    lastEventAt,
// 注释：把变量 lastEventAt 作为同名对象字段加入当前对象。
```

**源码第 248 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 249 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 252 行**

```text
let shared: ReturnType<typeof createLineData> | null = null;
// 注释：声明 shared，初始值由 null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`typeof`＝读取值的运行时类型；`null`＝空值。
```

**源码第 254 行**

```text
export function useLineData(lineId = 'line-01') {
// 注释：定义函数 `useLineData`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。
```

**源码第 256 行**

```text
  if (!shared) shared = createLineData(lineId);
// 注释：判断 if (!shared) shared = createLineData(lineId); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 258 行**

```text
  return shared;
// 注释：返回 shared 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 259 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
