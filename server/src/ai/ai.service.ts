import { Injectable, Logger, MessageEvent, ServiceUnavailableException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Observable, Subscriber } from 'rxjs';
// 从 rxjs 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * Hermes 代理。Node 20 自带 fetch,能直接读 ReadableStream ——
 * 所以转发 SSE 不需要引入 axios / openai SDK 这类依赖。
 *
 * 对外把 hermes 的 OpenAI 兼容流归一化成几种事件:
 *   delta  正文增量
 *   tool   工具调用痕迹(尽力而为,hermes 的形状不保证稳定)
 *   error  出错
 *   done   结束
 */

export interface AiStreamEvent {
// 声明 AiStreamEvent 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  type: 'delta' | 'tool' | 'error' | 'done';
  // 设置字段 type。 关键字：type＝定义类型别名。
  text?: string;
  // 声明 可选字段 text，类型为 string。
  name?: string;
  // 声明 可选字段 name，类型为 string。
  message?: string;
  // 声明 可选字段 message，类型为 string。
}
// 结束当前对象、函数或条件代码块。

export interface ChatBody {
// 声明 ChatBody 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  lineId?: string;
  // 声明 可选字段 lineId，类型为 string。
  message?: string;
  // 声明 可选字段 message，类型为 string。
}
// 结束当前对象、函数或条件代码块。

@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class AiService {
// 声明 AiService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  private readonly logger = new Logger(AiService.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。

  constructor() {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。

  /** 未配置 key 时明确拒绝,而不是让前端对着一个连不上的地址干等 */
  assertConfigured() {
  // 定义方法 assertConfigured；括号中声明参数，花括号内实现逻辑。
    if (!config.ai.apiKey) {
    // 判断 if (!config.ai.apiKey) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new ServiceUnavailableException({
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
        code: 503,
        // 设置字段 code。
        msg: 'AI 未配置(缺 AI_API_KEY),请先启动 hermes gateway 并填写 API_SERVER_KEY',
        // 设置字段 msg。
      });
      // 结束当前回调或对象，并完成外层函数调用。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * hermes session 按用户隔离:同一用户复用同一 session,
   * 才能保住 hermes 的 memory / skills;不同用户之间不共享上下文。
   */
  private sessionId(user: SessionUser) {
  // 定义方法 sessionId；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问。
    return `${config.ai.sessionPrefix}-${user.username}`;
    // 返回 ${config.ai.sessionPrefix}-${user.username} 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。

  stream(body: ChatBody, user: SessionUser): Observable<MessageEvent> {
  // 定义方法 stream；括号中声明参数，花括号内实现逻辑。
    return new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => {
    // 返回 new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；new＝创建对象实例。
      const ac = new AbortController();
      // 声明 ac，初始值由 new AbortController() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
      let cancelled = false;
      // 声明 cancelled，初始值由 false 计算得到。 关键字：let＝声明可重新赋值的变量；false＝布尔假值。
      // 每次流独立的去重集合。AiService 是单例,放实例字段上会跨请求累积,
      // 导致第二次提问时第一个工具不再上报。
      const seenTools = new Set<string>();
      // 声明 seenTools，初始值由 new Set<string>() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。

      const push = (e: AiStreamEvent) => {
      // 声明 push，初始值由 (e: AiStreamEvent) => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
        if (!cancelled) subscriber.next({ data: e } as MessageEvent);
        // 判断 if (!cancelled) subscriber.next({ data: e } as MessageEvent); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      };
      // 结束当前对象或代码块，并完成这条语句。

      (async () => {
      // 开始当前表达式的分组或数组内容。 关键字：async＝声明异步函数。
        try {
        // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
          const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
          // 声明 res，初始值由 await fetch(${config.ai.baseUrl}/chat/completions, { 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
            method: 'POST',
            // 设置字段 method。
            signal: ac.signal,
            // 设置字段 signal。
            headers: {
            // 设置字段 headers。
              'Content-Type': 'application/json',
              // 把这一段文字作为当前调用、数组或对象的值。
              Authorization: `Bearer ${config.ai.apiKey}`,
              // 设置字段 Authorization。
              'X-Hermes-Session-Id': this.sessionId(user),
              // 设置字段 X-Hermes-Session-Id，值为 this.sessionId(user)。 关键字：this＝当前对象实例。
            },
            // 结束当前对象或代码块，并完成这条语句。
            body: JSON.stringify({
            // 设置字段 body。
              model: config.ai.model,
              // 设置字段 model。
              stream: true,
              // 设置字段 stream。 关键字：true＝布尔真值。
              messages: [
              // 设置字段 messages。
                { role: 'system', content: this.systemPrompt(body.lineId ?? 'line-01') },
                // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：this＝当前对象实例。
                { role: 'user', content: body.message ?? '' },
                // 开始对象字面量，并在这一行设置其中列出的字段。
              ],
              // 结束当前数组，继续外层表达式。
            }),
            // 结束当前回调或对象，并完成外层函数调用。
          });
          // 结束当前回调或对象，并完成外层函数调用。

          if (!res.ok || !res.body) {
          // 判断 if (!res.ok || !res.body) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
            const detail = await res.text().catch(() => '');
            // 声明 detail，初始值由 await res.text().catch(() => '') 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；catch＝捕获异常。
            throw new Error(`hermes ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
            // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
          }
          // 结束当前对象、函数或条件代码块。

          for await (const evt of this.parseSse(res.body)) {
          // 按这一行指定的集合或范围逐个执行循环体。 关键字：for＝遍历集合或区间；await＝等待异步操作完成；const＝声明不可重新绑定的变量；of＝遍历可迭代值；this＝当前对象实例。
            if (cancelled) break;
            // 判断 if (cancelled) break; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；break＝结束当前循环或分支。
            this.handleChunk(evt, push, seenTools);
            // 调用 this.handleChunk，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
          }
          // 结束当前对象、函数或条件代码块。
          push({ type: 'done' });
          // 调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
          subscriber.complete();
          // 调用 subscriber.complete，把括号中的值作为参数传入。
        } catch (e) {
        // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
          if (!cancelled) {
          // 判断 if (!cancelled) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
            const msg = (e as Error).message;
            // 声明 msg，初始值由 (e as Error).message 计算得到。 关键字：const＝声明不可重新绑定的变量。
            // 浏览器直接关掉抽屉属于正常结束,不是故障
            if (!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`);
            // 判断 if (!/abort/i.test(msg)) this.logger.error(hermes 流失败: ${msg}); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；this＝当前对象实例。
            push({ type: 'error', message: msg });
            // 调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
          }
          // 结束当前对象、函数或条件代码块。
          subscriber.complete();
          // 调用 subscriber.complete，把括号中的值作为参数传入。
        }
        // 结束当前对象、函数或条件代码块。
      })();
      // 继续当前表达式；这一行的值由外层代码块或调用使用。

      return () => {
      // 返回 () => { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
        cancelled = true;
        // 把右侧表达式的结果写入 cancelled。 关键字：true＝布尔真值。
        ac.abort();
        // 调用 ac.abort，把括号中的值作为参数传入。
      };
      // 结束当前对象或代码块，并完成这条语句。
    });
    // 结束当前回调或对象，并完成外层函数调用。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 逐条解析 SSE。刻意写得宽松:hermes 偶尔会插入 keepalive 注释行或
   * 非标准字段,遇到不认识的**跳过**而不是抛错 —— 一条脏帧不该掐断整段回答。
   */
  private async *parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<any, void, void> {
  // 调用 parseSse；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；async＝声明异步函数；any＝跳过静态类型检查；void＝表示没有返回值。
    const reader = body.getReader();
    // 声明 reader，初始值由 body.getReader() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    const decoder = new TextDecoder();
    // 声明 decoder，初始值由 new TextDecoder() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    let buf = '';
    // 声明 buf，初始值由 '' 计算得到。 关键字：let＝声明可重新赋值的变量。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      for (;;) {
      // 按这一行指定的集合或范围逐个执行循环体。 关键字：for＝遍历集合或区间。
        const { done, value } = await reader.read();
        // 从右侧结果中取出 done, value，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
        if (done) break;
        // 判断 if (done) break; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；break＝结束当前循环或分支。
        buf += decoder.decode(value, { stream: true });
        // 调用 decoder.decode，把括号中的值作为参数传入。 关键字：true＝布尔真值。
        // SSE 以空行分帧;残留半帧留在 buf 里等下一块
        let idx: number;
        // 声明变量 idx，类型为 number；其值稍后赋入。 关键字：let＝声明可重新赋值的变量。
        while ((idx = buf.indexOf('\n\n')) >= 0) {
        // 控制分支、循环或异常处理流程。 关键字：while＝按条件重复执行。
          const frame = buf.slice(0, idx);
          // 声明 frame，初始值由 buf.slice(0, idx) 计算得到。 关键字：const＝声明不可重新绑定的变量。
          buf = buf.slice(idx + 2);
          // 把右侧表达式的结果写入 buf。
          for (const line of frame.split('\n')) {
          // 按这一行指定的集合或范围逐个执行循环体。 关键字：for＝遍历集合或区间；const＝声明不可重新绑定的变量；of＝遍历可迭代值。
            if (!line.startsWith('data:')) continue;         // event:/id:/注释行一律忽略
            // 判断 if (!line.startsWith('data:')) continue;         // event:/id:/注释行一律忽略 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；continue＝跳过本轮继续循环。
            const data = line.slice(5).trim();
            // 声明 data，初始值由 line.slice(5).trim() 计算得到。 关键字：const＝声明不可重新绑定的变量。
            if (!data || data === '[DONE]') continue;
            // 判断 if (!data || data === '[DONE]') continue; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；continue＝跳过本轮继续循环。
            try {
            // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
              yield JSON.parse(data);
              // 调用 JSON.parse；括号中的表达式是传入的参数。
            } catch {
            // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
              /* 非 JSON 帧:跳过 */
            }
            // 结束当前对象、函数或条件代码块。
          }
          // 结束当前对象、函数或条件代码块。
        }
        // 结束当前对象、函数或条件代码块。
      }
      // 结束当前对象、函数或条件代码块。
    } finally {
    // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
      reader.cancel().catch(() => undefined);
      // 调用 reader.cancel，把括号中的值作为参数传入。 关键字：catch＝捕获异常；undefined＝未定义值。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  private handleChunk(c: any, push: (e: AiStreamEvent) => void, seenTools: Set<string>) {
  // 定义方法 handleChunk；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问；any＝跳过静态类型检查；void＝表示没有返回值。
    // 工具事件在**顶层**,且 tool 直接是字符串(实测 2026-10-16):
    //   {"tool":"mcp__line_twin__get_line_snapshot","status":"running","emoji":"⚡"}
    // 不是对象,也没有嵌在 choices 里。
    if (typeof c?.tool === 'string') {
    // 判断 if (typeof c?.tool === 'string') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型。
      const name = this.friendlyTool(c.tool);
      // 声明 name，初始值由 this.friendlyTool(c.tool) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
      if (name && !seenTools.has(name)) {
      // 判断 if (name && !seenTools.has(name)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        seenTools.add(name);   // 同一工具 running/completed 会各来一帧,只报一次
        // 调用 seenTools.add，把括号中的值作为参数传入。
        push({ type: 'tool', name });
        // 调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
      }
      // 结束当前对象、函数或条件代码块。
      return;
      // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。

    // 正文:OpenAI 兼容形状 choices[].delta.content
    // 注意 delta.reasoning_content 是模型的思考过程,故意不转发 ——
    // 那是内部推理链,混进回答里会让人以为 AI 在自言自语。
    const text = c?.choices?.[0]?.delta?.content;
    // 声明 text，初始值由 c?.choices?.[0]?.delta?.content 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (typeof text === 'string' && text) {
    // 判断 if (typeof text === 'string' && text) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型。
      push({ type: 'delta', text });
      // 调用 push；括号中的表达式是传入的参数。 关键字：type＝定义类型别名。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 工具名转成人话。
   * hermes 把 MCP 工具名成 mcp__<server>__<tool> 前缀(这里是 mcp__line_twin__),
   * 直接显示既长又难看;另外 tool_describe 是 hermes 内部的工具元信息读取,
   * 和业务无关,不该出现在「查了什么」里。
   */
  private friendlyTool(raw: string): string | null {
  // 定义方法 friendlyTool；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问；null＝空值。
    if (raw === 'tool_describe' || raw.startsWith('hermes_')) return null;
    // 判断 if (raw === 'tool_describe' || raw.startsWith('hermes_')) return null; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；null＝空值。
    return raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '');
    // 返回 raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '') 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 每轮都带。hermes 侧 MCP 工具描述已经给了产线背景,
   * 这里只补「不许吹牛」的硬约束 —— LLM 很容易在建议还没执行时说成「已经停机」。
   *
   * ⚠️ 通道边界(2026-10-23):飞书通道允许 AI 直控产线,MCP 里为此加了
   *    run_operation / execute_action。**网页抽屉这条路不走直控** ——
   *    网页上所有控制动作都必须由人在卡片里点确认。
   *    所以这里显式禁用直控工具,避免模型在网页端绕过人工确认直接下发。
   */
  private systemPrompt(lineId: string) {
  // 定义方法 systemPrompt；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问。
    return [
    // 返回 [ 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
      `你是产线数字孪生平台的运维助手,当前产线 ${lineId}。`,
      // 继续当前表达式；这一行的值由外层代码块或调用使用。
      '用中文回答,结论要有工具查证支撑,不要凭空推断。',
      // 把这一段文字作为当前调用、数组或对象的值。
      '需要改变产线状态时调用 propose_action 提交建议,由值班人人工确认后才执行。',
      // 把这一段文字作为当前调用、数组或对象的值。
      '本通道(网页助手)禁止直接下发控制指令:不要调用 run_operation / execute_action,',
      // 把这一段文字作为当前调用、数组或对象的值。
      '一律用 propose_action 走人工确认流程。',
      // 把这一段文字作为当前调用、数组或对象的值。
      'IMPORTANT: 建议提交后并未执行。在人工确认之前,严禁使用「已停机」「已启动」' +
      // 把这一段文字与下一段拼接。
        '「已执行」这类过去完成式的表述,一律用「建议」「待确认」等措辞。',
        // 把这一段文字作为当前调用、数组或对象的值。
    ].join('\n');
    // 调用 .join；括号中的表达式是传入的参数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
