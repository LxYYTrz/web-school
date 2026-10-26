# web/src/services/ai.ts 逐行注释

[打开源码](../../../../../web/src/services/ai.ts) · 124 行 · 97 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import type { AiProposal, AiStreamEvent } from './types';
// 注释：从 ./types 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import { getSocket } from './socket';
// 注释：从 ./socket 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 注释：声明 BASE，初始值由 (import.meta.env.VITE_API_BASE as string | undefined) || '' 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号；`undefined`＝未定义值。
```

**源码第 6 行**

```text
let onUnauthorized: (() => void) | null = null;
// 注释：声明 onUnauthorized，初始值由 > void) | null = null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。
```

**源码第 7 行**

```text
export function setAiUnauthorizedHandler(fn: () => void) {
// 注释：定义函数 `setAiUnauthorizedHandler`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。
```

**源码第 8 行**

```text
  onUnauthorized = fn;
// 注释：把右侧表达式的结果写入 onUnauthorized。
```

**源码第 9 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 11 行**

```text
async function throwFor(res: Response, method: string, path: string): Promise<never> {
// 注释：定义函数 `throwFor`。 关键字：`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 12 行**

```text
  if (res.status === 401) {
// 注释：判断 if (res.status === 401) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 13 行**

```text
    onUnauthorized?.();
// 注释：调用 .，把括号中的值作为参数传入。
```

**源码第 14 行**

```text
    throw new Error('未登录或会话已过期');
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 15 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 16 行**

```text
  let msg = `${method} ${path} → ${res.status}`;
// 注释：声明 msg，初始值由 `${method} ${path} → ${res.status}` 计算得到。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 17 行**

```text
  try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 18 行**

```text
    const j = await res.json();
// 注释：声明 j，初始值由 await res.json() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 19 行**

```text
    if (j?.msg) msg += `: ${j.msg}`;
// 注释：判断 if (j?.msg) msg += `: ${j.msg}`; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 20 行**

```text
    else if (j?.error) msg += `: ${j.error}`;
// 注释：前一条件不成立时，改为执行这一分支。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。
```

**源码第 21 行**

```text
  } catch {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 23 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 24 行**

```text
  throw new Error(msg);
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 25 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 27 行**

```text
export async function apiAiStatus(): Promise<{ enabled: boolean; model: string }> {
// 注释：定义函数 `apiAiStatus`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 28 行**

```text
  const res = await fetch(`${BASE}/api/ai/status`, { credentials: 'include' });
// 注释：声明 res，初始值由 await fetch(`${BASE}/api/ai/status`, { credentials: 'include' }) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 29 行**

```text
  if (!res.ok) await throwFor(res, 'GET', '/api/ai/status');
// 注释：判断 if (!res.ok) await throwFor(res, 'GET', '/api/ai/status'); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`await`＝等待异步操作完成。
```

**源码第 30 行**

```text
  return res.json();
// 注释：返回 res.json() 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 31 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 42 行**

```text
export async function apiAiChat(
// 注释：定义函数 `apiAiChat`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 43 行**

```text
  lineId: string,
// 注释：设置字段 `lineId`。
```

**源码第 44 行**

```text
  message: string,
// 注释：设置字段 `message`。
```

**源码第 45 行**

```text
  onEvent: (e: AiStreamEvent) => void,
// 注释：设置字段 `onEvent`。 关键字：`void`＝表示没有返回值。
```

**源码第 46 行**

```text
  signal?: AbortSignal,
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 47 行**

```text
): Promise<void> {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`void`＝表示没有返回值。
```

**源码第 48 行**

```text
  const res = await fetch(`${BASE}/api/ai/chat`, {
// 注释：声明 res，初始值由 await fetch(`${BASE}/api/ai/chat`, { 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 49 行**

```text
    method: 'POST',
// 注释：设置字段 `method`。
```

**源码第 50 行**

```text
    credentials: 'include',
// 注释：设置字段 `credentials`。
```

**源码第 51 行**

```text
    headers: { 'Content-Type': 'application/json' },
// 注释：设置字段 `headers`。
```

**源码第 52 行**

```text
    body: JSON.stringify({ lineId, message }),
// 注释：设置字段 `body`。
```

**源码第 53 行**

```text
    signal,
// 注释：把变量 signal 作为同名对象字段加入当前对象。
```

**源码第 54 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 55 行**

```text
  if (!res.ok) await throwFor(res, 'POST', '/api/ai/chat');
// 注释：判断 if (!res.ok) await throwFor(res, 'POST', '/api/ai/chat'); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`await`＝等待异步操作完成。
```

**源码第 56 行**

```text
  if (!res.body) throw new Error('浏览器不支持流式响应');
// 注释：判断 if (!res.body) throw new Error('浏览器不支持流式响应'); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 58 行**

```text
  const reader = res.body.getReader();
// 注释：声明 reader，初始值由 res.body.getReader() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 59 行**

```text
  const decoder = new TextDecoder();
// 注释：声明 decoder，初始值由 new TextDecoder() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 60 行**

```text
  let buf = '';
// 注释：声明 buf，初始值由 '' 计算得到。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 61 行**

```text
  try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 62 行**

```text
    for (;;) {
// 注释：按这一行指定的集合或范围逐个执行循环体。 关键字：`for`＝遍历集合或区间。
```

**源码第 63 行**

```text
      const { done, value } = await reader.read();
// 注释：从右侧结果中取出 done, value，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 64 行**

```text
      if (done) break;
// 注释：判断 if (done) break; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`break`＝结束当前循环或分支。
```

**源码第 65 行**

```text
      buf += decoder.decode(value, { stream: true });
// 注释：调用 decoder.decode，把括号中的值作为参数传入。 关键字：`true`＝布尔真值。
```

**源码第 67 行**

```text
      let idx: number;
// 注释：声明变量 idx，类型为 number；其值稍后赋入。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 68 行**

```text
      while ((idx = buf.indexOf('\n\n')) >= 0) {
// 注释：控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。
```

**源码第 69 行**

```text
        const frame = buf.slice(0, idx);
// 注释：声明 frame，初始值由 buf.slice(0, idx) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 70 行**

```text
        buf = buf.slice(idx + 2);
// 注释：把右侧表达式的结果写入 buf。
```

**源码第 71 行**

```text
        for (const line of frame.split('\n')) {
// 注释：按这一行指定的集合或范围逐个执行循环体。 关键字：`for`＝遍历集合或区间；`const`＝声明不可重新绑定的变量；`of`＝遍历可迭代值。
```

**源码第 72 行**

```text
          if (!line.startsWith('data:')) continue;      // event:/id:/注释行忽略
// 注释：判断 if (!line.startsWith('data:')) continue;      // event:/id:/注释行忽略 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。
```

**源码第 73 行**

```text
          const payload = line.slice(5).trim();
// 注释：声明 payload，初始值由 line.slice(5).trim() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 74 行**

```text
          if (!payload) continue;
// 注释：判断 if (!payload) continue; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。
```

**源码第 75 行**

```text
          try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 76 行**

```text
            onEvent(JSON.parse(payload) as AiStreamEvent);
// 注释：调用 onEvent；括号中的表达式是传入的参数。
```

**源码第 77 行**

```text
          } catch {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 79 行**

```text
          }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 80 行**

```text
        }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 81 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 82 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 83 行**

```text
  } finally {
// 注释：开始收尾分支，无论前面的操作成功或失败都执行。 关键字：`finally`＝执行收尾逻辑。
```

**源码第 84 行**

```text
    reader.cancel().catch(() => undefined);
// 注释：调用 reader.cancel，把括号中的值作为参数传入。 关键字：`catch`＝捕获异常；`undefined`＝未定义值。
```

**源码第 85 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 86 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 94 行**

```text
export async function apiConfirmAiProposal(
// 注释：定义函数 `apiConfirmAiProposal`。 关键字：`export`＝向其他模块开放符号；`async`＝声明异步函数；`function`＝定义函数。
```

**源码第 95 行**

```text
  id: string,
// 注释：设置字段 `id`。
```

**源码第 96 行**

```text
): Promise<{ ok: boolean; cmdId?: string; error?: string }> {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 97 行**

```text
  const res = await fetch(`${BASE}/api/ai/proposals/${encodeURIComponent(id)}/confirm`, {
// 注释：声明 res，初始值由 await fetch(`${BASE}/api/ai/proposals/${encodeURIComponent(id)}/confirm`, { 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 98 行**

```text
    method: 'POST',
// 注释：设置字段 `method`。
```

**源码第 99 行**

```text
    credentials: 'include',
// 注释：设置字段 `credentials`。
```

**源码第 100 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 101 行**

```text
  if (res.status === 401) {
// 注释：判断 if (res.status === 401) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 102 行**

```text
    onUnauthorized?.();
// 注释：调用 .，把括号中的值作为参数传入。
```

**源码第 103 行**

```text
    throw new Error('未登录或会话已过期');
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 104 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 105 行**

```text
  const body = (await res.json().catch(() => ({}))) as {
// 注释：声明 body，初始值由 (await res.json().catch(() => ({}))) as { 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`catch`＝捕获异常。
```

**源码第 106 行**

```text
    ok: boolean;
// 注释：设置字段 `ok`。
```

**源码第 107 行**

```text
    cmdId?: string;
// 注释：声明 可选字段 cmdId，类型为 string。
```

**源码第 108 行**

```text
    error?: string;
// 注释：声明 可选字段 error，类型为 string。
```

**源码第 109 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 110 行**

```text
  if (res.status === 403) {
// 注释：判断 if (res.status === 403) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 111 行**

```text
    throw new Error(body.error || '需 level >= 2 才能下发控制指令');
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 112 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 113 行**

```text
  if (!res.ok) throw new Error(body.error || `确认失败:${res.status}`);
// 注释：判断 if (!res.ok) throw new Error(body.error || `确认失败:${res.status}`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 114 行**

```text
  return body;
// 注释：返回 body 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 115 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 118 行**

```text
export function onAiProposal(cb: (p: AiProposal) => void): () => void {
// 注释：定义函数 `onAiProposal`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。
```

**源码第 119 行**

```text
  const socket = getSocket();
// 注释：声明 socket，初始值由 getSocket() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 120 行**

```text
  socket.on('ai_proposal', cb);
// 注释：调用 socket.on，把括号中的值作为参数传入。
```

**源码第 121 行**

```text
  return () => {
// 注释：返回 () => { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 122 行**

```text
    socket.off('ai_proposal', cb);
// 注释：调用 socket.off，把括号中的值作为参数传入。
```

**源码第 123 行**

```text
  };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 124 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
