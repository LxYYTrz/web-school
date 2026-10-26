# web/src/services/types.ts 逐行注释

[打开源码](../../../../../web/src/services/types.ts) · 120 行 · 86 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 3 行**

```text
export interface RobotState {
// 注释：声明 `RobotState` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 4 行**

```text
  ts: number;
// 注释：设置字段 `ts`。
```

**源码第 5 行**

```text
  deviceId: string;
// 注释：设置字段 `deviceId`。
```

**源码第 6 行**

```text
  joints: [number, number, number, number, number, number];
// 注释：设置字段 `joints`。
```

**源码第 7 行**

```text
  tcp: number[] | null;
// 注释：设置字段 `tcp`。 关键字：`null`＝空值。
```

**源码第 8 行**

```text
  speedPct: number;
// 注释：设置字段 `speedPct`。
```

**源码第 9 行**

```text
  mode: 'manual' | 'auto' | 'remote' | 'error' | string;
// 注释：设置字段 `mode`。
```

**源码第 10 行**

```text
  program: string;
// 注释：设置字段 `program`。
```

**源码第 11 行**

```text
  alarmCode: number;
// 注释：设置字段 `alarmCode`。
```

**源码第 12 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 15 行**

```text
export interface LineStatus {
// 注释：声明 `LineStatus` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 16 行**

```text
  ts: number;
// 注释：设置字段 `ts`。
```

**源码第 17 行**

```text
  lineId: string;
// 注释：设置字段 `lineId`。
```

**源码第 20 行**

```text
  state:
// 注释：设置字段 `state`。
```

**源码第 21 行**

```text
    | 'running' | 'idle' | 'alarm' | 'offline'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 22 行**

```text
    | 'waiting_feed' | 'feeding' | 'assembling' | 'waiting_robot'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 23 行**

```text
    | 'unload_done' | 'waiting_next'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 24 行**

```text
    | 'init_error' | 'stopped' | 'manual_mode'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 26 行**

```text
    | 'unloading'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 27 行**

```text
    | string;
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 28 行**

```text
  productCode: string;
// 注释：设置字段 `productCode`。
```

**源码第 29 行**

```text
  goodCount: number;
// 注释：设置字段 `goodCount`。
```

**源码第 30 行**

```text
  ngCount: number;
// 注释：设置字段 `ngCount`。
```

**源码第 31 行**

```text
  beatMs: number;
// 注释：设置字段 `beatMs`。
```

**源码第 32 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 35 行**

```text
export interface ProductionEvent {
// 注释：声明 `ProductionEvent` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 36 行**

```text
  ts: number;
// 注释：设置字段 `ts`。
```

**源码第 37 行**

```text
  lineId: string;
// 注释：设置字段 `lineId`。
```

**源码第 38 行**

```text
  deviceId: string;
// 注释：设置字段 `deviceId`。
```

**源码第 39 行**

```text
  type: 'start' | 'stop' | 'alarm' | 'piece_done' | 'changeover' | 'custom' | string;
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 40 行**

```text
  level: 'info' | 'warning' | 'critical';
// 注释：设置字段 `level`。
```

**源码第 41 行**

```text
  code?: string | null;
// 注释：声明 可选字段 code，类型为 string | null。 关键字：`null`＝空值。
```

**源码第 42 行**

```text
  message?: string | null;
// 注释：声明 可选字段 message，类型为 string | null。 关键字：`null`＝空值。
```

**源码第 43 行**

```text
  payload?: Record<string, unknown>;
// 注释：声明 可选字段 payload，类型为 Record<string, unknown>。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 44 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 49 行**

```text
export type IoValue = number | null;
// 注释：声明 `IoValue` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名；`null`＝空值。
```

**源码第 51 行**

```text
export interface IoSignals {
// 注释：声明 `IoSignals` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 52 行**

```text
  sensorIn: IoValue;      // word 11 入料传感器  1=有料 0=无料
// 注释：设置字段 `sensorIn`。
```

**源码第 53 行**

```text
  sensorArrive: IoValue;  // word 12 到料传感器  1=有料 0=无料
// 注释：设置字段 `sensorArrive`。
```

**源码第 54 行**

```text
  sensorRetreat: IoValue; // word 13 退料传感器  1=有料 0=无料
// 注释：设置字段 `sensorRetreat`。
```

**源码第 55 行**

```text
  lightColor: IoValue;    // word 14 产线灯光颜色 0=绿灯 1=黄灯 2=红灯
// 注释：设置字段 `lightColor`。
```

**源码第 56 行**

```text
  trayUp: IoValue;        // word 15 托料盘上升  1=上升 0=下降
// 注释：设置字段 `trayUp`。
```

**源码第 57 行**

```text
  blockUp: IoValue;       // word 16 阻挡干上升  1=上升 0=下降
// 注释：设置字段 `blockUp`。
```

**源码第 58 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 60 行**

```text
export interface IoState {
// 注释：声明 `IoState` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 61 行**

```text
  ts: number;
// 注释：设置字段 `ts`。
```

**源码第 62 行**

```text
  lineId: string;
// 注释：设置字段 `lineId`。
```

**源码第 63 行**

```text
  io: IoSignals;
// 注释：设置字段 `io`。
```

**源码第 64 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 67 行**

```text
export interface LineSnapshot {
// 注释：声明 `LineSnapshot` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 68 行**

```text
  lineId: string;
// 注释：设置字段 `lineId`。
```

**源码第 69 行**

```text
  ts: number;
// 注释：设置字段 `ts`。
```

**源码第 70 行**

```text
  status: LineStatus | null;
// 注释：设置字段 `status`。 关键字：`null`＝空值。
```

**源码第 71 行**

```text
  edge: { status: 'online' | 'offline' } | null;
// 注释：设置字段 `edge`。 关键字：`null`＝空值。
```

**源码第 72 行**

```text
  io: IoState | null;
// 注释：设置字段 `io`。 关键字：`null`＝空值。
```

**源码第 73 行**

```text
  robots: Record<string, RobotState>;
// 注释：设置字段 `robots`。
```

**源码第 74 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 77 行**

```text
export interface CommandAck {
// 注释：声明 `CommandAck` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 78 行**

```text
  cmdId: string;
// 注释：设置字段 `cmdId`。
```

**源码第 79 行**

```text
  ts: number;
// 注释：设置字段 `ts`。
```

**源码第 80 行**

```text
  status: 'acked' | 'rejected' | 'failed' | 'timeout';
// 注释：设置字段 `status`。
```

**源码第 81 行**

```text
  message?: string | null;
// 注释：声明 可选字段 message，类型为 string | null。 关键字：`null`＝空值。
```

**源码第 82 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 93 行**

```text
export interface AiProposal {
// 注释：声明 `AiProposal` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 94 行**

```text
  id: string;
// 注释：设置字段 `id`。
```

**源码第 95 行**

```text
  lineId: string;
// 注释：设置字段 `lineId`。
```

**源码第 96 行**

```text
  deviceId: string;
// 注释：设置字段 `deviceId`。
```

**源码第 97 行**

```text
  type: string;
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 98 行**

```text
  params: Record<string, unknown>;
// 注释：设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 99 行**

```text
  reason: string;
// 注释：设置字段 `reason`。
```

**源码第 100 行**

```text
  status: 'pending';
// 注释：设置字段 `status`。
```

**源码第 101 行**

```text
  createdAt: number;
// 注释：设置字段 `createdAt`。
```

**源码第 102 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 105 行**

```text
export interface AiStreamEvent {
// 注释：声明 `AiStreamEvent` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 106 行**

```text
  type: 'delta' | 'tool' | 'error' | 'done';
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 107 行**

```text
  text?: string;
// 注释：声明 可选字段 text，类型为 string。
```

**源码第 108 行**

```text
  name?: string;
// 注释：声明 可选字段 name，类型为 string。
```

**源码第 109 行**

```text
  message?: string;
// 注释：声明 可选字段 message，类型为 string。
```

**源码第 110 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 113 行**

```text
export interface AiMessage {
// 注释：声明 `AiMessage` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 114 行**

```text
  role: 'user' | 'assistant';
// 注释：设置字段 `role`。
```

**源码第 115 行**

```text
  text: string;
// 注释：设置字段 `text`。
```

**源码第 117 行**

```text
  tools?: string[];
// 注释：声明 可选字段 tools，类型为 string[]。
```

**源码第 118 行**

```text
  error?: string;
// 注释：声明 可选字段 error，类型为 string。
```

**源码第 119 行**

```text
  proposal?: AiProposal;
// 注释：声明 可选字段 proposal，类型为 AiProposal。
```

**源码第 120 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
