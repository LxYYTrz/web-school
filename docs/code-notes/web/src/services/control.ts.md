# web/src/services/control.ts 逐行注释

[打开源码](../../../../../web/src/services/control.ts) · 57 行 · 46 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { getSocket } from './socket';
// 注释：从 ./socket 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import type { CommandAck } from './types';
// 注释：从 ./types 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 注释：声明 BASE，初始值由 (import.meta.env.VITE_API_BASE as string | undefined) || '' 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号；`undefined`＝未定义值。
```

**源码第 7 行**

```text
let onUnauthorized: (() => void) | null = null;
// 注释：声明 onUnauthorized，初始值由 > void) | null = null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。
```

**源码第 8 行**

```text
export function setControlUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }
// 注释：定义函数 `setControlUnauthorizedHandler`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。
```

**源码第 10 行**

```text
export interface SendCommandParams {
// 注释：声明 `SendCommandParams` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 11 行**

```text
  deviceId: string;
// 注释：设置字段 `deviceId`。
```

**源码第 12 行**

```text
  type: 'start' | 'stop' | 'reset' | 'changeover' | 'mode_set' | 'alarm_clear' | string;
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 13 行**

```text
  params?: Record<string, unknown>;
// 注释：声明 可选字段 params，类型为 Record<string, unknown>。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 14 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 16 行**

```text
export interface SendCommandResult {
// 注释：声明 `SendCommandResult` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 17 行**

```text
  ok: boolean;
// 注释：设置字段 `ok`。
```

**源码第 18 行**

```text
  cmdId?: string;
// 注释：声明 可选字段 cmdId，类型为 string。
```

**源码第 19 行**

```text
  error?: string;
// 注释：声明 可选字段 error，类型为 string。
```

**源码第 20 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 24 行**

```text
export async function apiSendCommand(
// 注释：定义函数 `apiSendCommand`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 25 行**

```text
  lineId: string,
// 注释：设置字段 `lineId`。
```

**源码第 26 行**

```text
  cmd: SendCommandParams,
// 注释：设置字段 `cmd`。
```

**源码第 27 行**

```text
): Promise<SendCommandResult> {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 28 行**

```text
  const res = await fetch(`${BASE}/api/lines/${lineId}/commands`, {
// 注释：声明 res，初始值由 await fetch(`${BASE}/api/lines/${lineId}/commands`, { 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 29 行**

```text
    method: 'POST',
// 注释：设置字段 `method`。
```

**源码第 30 行**

```text
    credentials: 'include',
// 注释：设置字段 `credentials`。
```

**源码第 31 行**

```text
    headers: { 'Content-Type': 'application/json' },
// 注释：设置字段 `headers`。
```

**源码第 32 行**

```text
    body: JSON.stringify(cmd),
// 注释：设置字段 `body`。
```

**源码第 33 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 34 行**

```text
  if (res.status === 401) {
// 注释：判断 if (res.status === 401) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 35 行**

```text
    onUnauthorized?.();
// 注释：调用 .，把括号中的值作为参数传入。
```

**源码第 36 行**

```text
    throw new Error('未登录或会话已过期');
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 37 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 38 行**

```text
  if (!res.ok) {
// 注释：判断 if (!res.ok) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 39 行**

```text
    let msg = `POST commands → ${res.status}`;
// 注释：声明 msg，初始值由 `POST commands → ${res.status}` 计算得到。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 40 行**

```text
    try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 41 行**

```text
      const j = await res.json();
// 注释：声明 j，初始值由 await res.json() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 42 行**

```text
      if (j?.msg) msg += `: ${j.msg}`;
// 注释：判断 if (j?.msg) msg += `: ${j.msg}`; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 43 行**

```text
      else if (j?.error) msg += `: ${j.error}`;
// 注释：前一条件不成立时，改为执行这一分支。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。
```

**源码第 44 行**

```text
    } catch { /* 不是 JSON */ }
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 45 行**

```text
    throw new Error(msg);
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 46 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 47 行**

```text
  return res.json() as Promise<SendCommandResult>;
// 注释：返回 res.json() as Promise<SendCommandResult> 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 48 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 52 行**

```text
export function onCommandAck(cb: (ack: CommandAck) => void): () => void {
// 注释：定义函数 `onCommandAck`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。
```

**源码第 53 行**

```text
  const socket = getSocket();
// 注释：声明 socket，初始值由 getSocket() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 54 行**

```text
  const handler = (msg: CommandAck) => cb(msg);
// 注释：声明 handler，初始值由 (msg: CommandAck) => cb(msg) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 55 行**

```text
  socket.on('command_ack', handler);
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 56 行**

```text
  return () => { socket.off('command_ack', handler); };
// 注释：返回 () => { socket.off('command_ack', handler); } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 57 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
