# server/src/ai/ai.service.ts 逐行注释

[打开源码](../../../../../server/src/ai/ai.service.ts) · 202 行 · 139 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { Injectable, Logger, MessageEvent, ServiceUnavailableException } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import { Observable, Subscriber } from 'rxjs';
// 注释：从 rxjs 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 3 行**

```text
import { config } from '../config/configuration';
// 注释：从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
import type { SessionUser } from '../auth/session-user';
// 注释：从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 17 行**

```text
export interface AiStreamEvent {
// 注释：声明 `AiStreamEvent` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 18 行**

```text
  type: 'delta' | 'tool' | 'error' | 'done';
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 19 行**

```text
  text?: string;
// 注释：声明 可选字段 text，类型为 string。
```

**源码第 20 行**

```text
  name?: string;
// 注释：声明 可选字段 name，类型为 string。
```

**源码第 21 行**

```text
  message?: string;
// 注释：声明 可选字段 message，类型为 string。
```

**源码第 22 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 24 行**

```text
export interface ChatBody {
// 注释：声明 `ChatBody` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 25 行**

```text
  lineId?: string;
// 注释：声明 可选字段 lineId，类型为 string。
```

**源码第 26 行**

```text
  message?: string;
// 注释：声明 可选字段 message，类型为 string。
```

**源码第 27 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 29 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 30 行**

```text
export class AiService {
// 注释：声明 `AiService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```

**源码第 31 行**

```text
  private readonly logger = new Logger(AiService.name);
// 注释：调用 Logger；括号中的表达式是传入的参数。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。
```

**源码第 33 行**

```text
  constructor() {}
// 注释：定义类的构造函数；创建实例时接收参数并初始化依赖。
```

**源码第 36 行**

```text
  assertConfigured() {
// 注释：定义方法 assertConfigured；括号中声明参数，花括号内实现逻辑。
```

**源码第 37 行**

```text
    if (!config.ai.apiKey) {
// 注释：判断 if (!config.ai.apiKey) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 38 行**

```text
      throw new ServiceUnavailableException({
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 39 行**

```text
        code: 503,
// 注释：设置字段 `code`。
```

**源码第 40 行**

```text
        msg: 'AI 未配置(缺 AI_API_KEY),请先启动 hermes gateway 并填写 API_SERVER_KEY',
// 注释：设置字段 `msg`。
```

**源码第 41 行**

```text
      });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 42 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 43 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 49 行**

```text
  private sessionId(user: SessionUser) {
// 注释：定义方法 sessionId；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问。
```

**源码第 50 行**

```text
    return `${config.ai.sessionPrefix}-${user.username}`;
// 注释：返回 `${config.ai.sessionPrefix}-${user.username}` 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 51 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 53 行**

```text
  stream(body: ChatBody, user: SessionUser): Observable<MessageEvent> {
// 注释：定义方法 stream；括号中声明参数，花括号内实现逻辑。
```

**源码第 54 行**

```text
    return new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => {
// 注释：返回 new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`new`＝创建对象实例。
```

**源码第 55 行**

```text
      const ac = new AbortController();
// 注释：声明 ac，初始值由 new AbortController() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 56 行**

```text
      let cancelled = false;
// 注释：声明 cancelled，初始值由 false 计算得到。 关键字：`let`＝声明可重新赋值的变量；`false`＝布尔假值。
```

**源码第 59 行**

```text
      const seenTools = new Set<string>();
// 注释：声明 seenTools，初始值由 new Set<string>() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 61 行**

```text
      const push = (e: AiStreamEvent) => {
// 注释：声明 push，初始值由 (e: AiStreamEvent) => { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 62 行**

```text
        if (!cancelled) subscriber.next({ data: e } as MessageEvent);
// 注释：判断 if (!cancelled) subscriber.next({ data: e } as MessageEvent); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 63 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 65 行**

```text
      (async () => {
// 注释：开始当前表达式的分组或数组内容。 关键字：`async`＝声明异步函数。
```

**源码第 66 行**

```text
        try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 67 行**

```text
          const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
// 注释：声明 res，初始值由 await fetch(`${config.ai.baseUrl}/chat/completions`, { 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 68 行**

```text
            method: 'POST',
// 注释：设置字段 `method`。
```

**源码第 69 行**

```text
            signal: ac.signal,
// 注释：设置字段 `signal`。
```

**源码第 70 行**

```text
            headers: {
// 注释：设置字段 `headers`。
```

**源码第 71 行**

```text
              'Content-Type': 'application/json',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 72 行**

```text
              Authorization: `Bearer ${config.ai.apiKey}`,
// 注释：设置字段 `Authorization`。
```

**源码第 73 行**

```text
              'X-Hermes-Session-Id': this.sessionId(user),
// 注释：设置字段 X-Hermes-Session-Id，值为 this.sessionId(user)。 关键字：`this`＝当前对象实例。
```

**源码第 74 行**

```text
            },
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 75 行**

```text
            body: JSON.stringify({
// 注释：设置字段 `body`。
```

**源码第 76 行**

```text
              model: config.ai.model,
// 注释：设置字段 `model`。
```

**源码第 77 行**

```text
              stream: true,
// 注释：设置字段 `stream`。 关键字：`true`＝布尔真值。
```

**源码第 78 行**

```text
              messages: [
// 注释：设置字段 `messages`。
```

**源码第 79 行**

```text
                { role: 'system', content: this.systemPrompt(body.lineId ?? 'line-01') },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：`this`＝当前对象实例。
```

**源码第 80 行**

```text
                { role: 'user', content: body.message ?? '' },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 81 行**

```text
              ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 82 行**

```text
            }),
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 83 行**

```text
          });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 85 行**

```text
          if (!res.ok || !res.body) {
// 注释：判断 if (!res.ok || !res.body) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 86 行**

```text
            const detail = await res.text().catch(() => '');
// 注释：声明 detail，初始值由 await res.text().catch(() => '') 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`catch`＝捕获异常。
```

**源码第 87 行**

```text
            throw new Error(`hermes ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 88 行**

```text
          }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 90 行**

```text
          for await (const evt of this.parseSse(res.body)) {
// 注释：按这一行指定的集合或范围逐个执行循环体。 关键字：`for`＝遍历集合或区间；`await`＝等待异步操作完成；`const`＝声明不可重新绑定的变量；`of`＝遍历可迭代值；`this`＝当前对象实例。
```

**源码第 91 行**

```text
            if (cancelled) break;
// 注释：判断 if (cancelled) break; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`break`＝结束当前循环或分支。
```

**源码第 92 行**

```text
            this.handleChunk(evt, push, seenTools);
// 注释：调用 this.handleChunk，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 93 行**

```text
          }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 94 行**

```text
          push({ type: 'done' });
// 注释：调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
```

**源码第 95 行**

```text
          subscriber.complete();
// 注释：调用 subscriber.complete，把括号中的值作为参数传入。
```

**源码第 96 行**

```text
        } catch (e) {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 97 行**

```text
          if (!cancelled) {
// 注释：判断 if (!cancelled) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 98 行**

```text
            const msg = (e as Error).message;
// 注释：声明 msg，初始值由 (e as Error).message 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 100 行**

```text
            if (!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`);
// 注释：判断 if (!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例。
```

**源码第 101 行**

```text
            push({ type: 'error', message: msg });
// 注释：调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
```

**源码第 102 行**

```text
          }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 103 行**

```text
          subscriber.complete();
// 注释：调用 subscriber.complete，把括号中的值作为参数传入。
```

**源码第 104 行**

```text
        }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 105 行**

```text
      })();
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 107 行**

```text
      return () => {
// 注释：返回 () => { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 108 行**

```text
        cancelled = true;
// 注释：把右侧表达式的结果写入 cancelled。 关键字：`true`＝布尔真值。
```

**源码第 109 行**

```text
        ac.abort();
// 注释：调用 ac.abort，把括号中的值作为参数传入。
```

**源码第 110 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 111 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 112 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 118 行**

```text
  private async *parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<any, void, void> {
// 注释：调用 parseSse；括号中的表达式是传入的参数。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数；`any`＝跳过静态类型检查；`void`＝表示没有返回值。
```

**源码第 119 行**

```text
    const reader = body.getReader();
// 注释：声明 reader，初始值由 body.getReader() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 120 行**

```text
    const decoder = new TextDecoder();
// 注释：声明 decoder，初始值由 new TextDecoder() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 121 行**

```text
    let buf = '';
// 注释：声明 buf，初始值由 '' 计算得到。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 122 行**

```text
    try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 123 行**

```text
      for (;;) {
// 注释：按这一行指定的集合或范围逐个执行循环体。 关键字：`for`＝遍历集合或区间。
```

**源码第 124 行**

```text
        const { done, value } = await reader.read();
// 注释：从右侧结果中取出 done, value，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 125 行**

```text
        if (done) break;
// 注释：判断 if (done) break; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`break`＝结束当前循环或分支。
```

**源码第 126 行**

```text
        buf += decoder.decode(value, { stream: true });
// 注释：调用 decoder.decode，把括号中的值作为参数传入。 关键字：`true`＝布尔真值。
```

**源码第 128 行**

```text
        let idx: number;
// 注释：声明变量 idx，类型为 number；其值稍后赋入。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 129 行**

```text
        while ((idx = buf.indexOf('\n\n')) >= 0) {
// 注释：控制分支、循环或异常处理流程。 关键字：`while`＝按条件重复执行。
```

**源码第 130 行**

```text
          const frame = buf.slice(0, idx);
// 注释：声明 frame，初始值由 buf.slice(0, idx) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 131 行**

```text
          buf = buf.slice(idx + 2);
// 注释：把右侧表达式的结果写入 buf。
```

**源码第 132 行**

```text
          for (const line of frame.split('\n')) {
// 注释：按这一行指定的集合或范围逐个执行循环体。 关键字：`for`＝遍历集合或区间；`const`＝声明不可重新绑定的变量；`of`＝遍历可迭代值。
```

**源码第 133 行**

```text
            if (!line.startsWith('data:')) continue;         // event:/id:/注释行一律忽略
// 注释：判断 if (!line.startsWith('data:')) continue;         // event:/id:/注释行一律忽略 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。
```

**源码第 134 行**

```text
            const data = line.slice(5).trim();
// 注释：声明 data，初始值由 line.slice(5).trim() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 135 行**

```text
            if (!data || data === '[DONE]') continue;
// 注释：判断 if (!data || data === '[DONE]') continue; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`continue`＝跳过本轮继续循环。
```

**源码第 136 行**

```text
            try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 137 行**

```text
              yield JSON.parse(data);
// 注释：调用 JSON.parse；括号中的表达式是传入的参数。
```

**源码第 138 行**

```text
            } catch {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 140 行**

```text
            }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 141 行**

```text
          }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 142 行**

```text
        }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 143 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 144 行**

```text
    } finally {
// 注释：开始收尾分支，无论前面的操作成功或失败都执行。 关键字：`finally`＝执行收尾逻辑。
```

**源码第 145 行**

```text
      reader.cancel().catch(() => undefined);
// 注释：调用 reader.cancel，把括号中的值作为参数传入。 关键字：`catch`＝捕获异常；`undefined`＝未定义值。
```

**源码第 146 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 147 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 149 行**

```text
  private handleChunk(c: any, push: (e: AiStreamEvent) => void, seenTools: Set<string>) {
// 注释：定义方法 handleChunk；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问；`any`＝跳过静态类型检查；`void`＝表示没有返回值。
```

**源码第 153 行**

```text
    if (typeof c?.tool === 'string') {
// 注释：判断 if (typeof c?.tool === 'string') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型。
```

**源码第 154 行**

```text
      const name = this.friendlyTool(c.tool);
// 注释：声明 name，初始值由 this.friendlyTool(c.tool) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 155 行**

```text
      if (name && !seenTools.has(name)) {
// 注释：判断 if (name && !seenTools.has(name)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 156 行**

```text
        seenTools.add(name);   // 同一工具 running/completed 会各来一帧,只报一次
// 注释：调用 seenTools.add，把括号中的值作为参数传入。
```

**源码第 157 行**

```text
        push({ type: 'tool', name });
// 注释：调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
```

**源码第 158 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 159 行**

```text
      return;
// 注释：立即结束当前函数，不返回具体值。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 160 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 165 行**

```text
    const text = c?.choices?.[0]?.delta?.content;
// 注释：声明 text，初始值由 c?.choices?.[0]?.delta?.content 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 166 行**

```text
    if (typeof text === 'string' && text) {
// 注释：判断 if (typeof text === 'string' && text) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型。
```

**源码第 167 行**

```text
      push({ type: 'delta', text });
// 注释：调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
```

**源码第 168 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 169 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 177 行**

```text
  private friendlyTool(raw: string): string | null {
// 注释：定义方法 friendlyTool；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问；`null`＝空值。
```

**源码第 178 行**

```text
    if (raw === 'tool_describe' || raw.startsWith('hermes_')) return null;
// 注释：判断 if (raw === 'tool_describe' || raw.startsWith('hermes_')) return null; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 179 行**

```text
    return raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '');
// 注释：返回 raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '') 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 180 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 191 行**

```text
  private systemPrompt(lineId: string) {
// 注释：定义方法 systemPrompt；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问。
```

**源码第 192 行**

```text
    return [
// 注释：返回 [ 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 193 行**

```text
      `你是产线数字孪生平台的运维助手,当前产线 ${lineId}。`,
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 194 行**

```text
      '用中文回答,结论要有工具查证支撑,不要凭空推断。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 195 行**

```text
      '需要改变产线状态时调用 propose_action 提交建议,由值班人人工确认后才执行。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 196 行**

```text
      '本通道(网页助手)禁止直接下发控制指令:不要调用 run_operation / execute_action,',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 197 行**

```text
      '一律用 propose_action 走人工确认流程。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 198 行**

```text
      'IMPORTANT: 建议提交后并未执行。在人工确认之前,严禁使用「已停机」「已启动」' +
// 注释：把这一段文字与下一段拼接。
```

**源码第 199 行**

```text
        '「已执行」这类过去完成式的表述,一律用「建议」「待确认」等措辞。',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 200 行**

```text
    ].join('\n');
// 注释：调用 .join；括号中的表达式是传入的参数。
```

**源码第 201 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 202 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
