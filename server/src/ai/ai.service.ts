/**
 * 将网页登录用户的消息代理到 Hermes，再转换为网页可消费的 SSE 事件。
 * 按配置检查 → sessionId → stream 请求 → parseSse 分帧 → handleChunk 区分文字/工具 → 取消清理阅读。
 * fetch、ReadableStream、AbortController 处理 HTTP 流；RxJS Observable 把事件交给 NestJS SSE 响应。
 * systemPrompt 提供网页先建议、人工确认的模型规则；提示词不是 MCP 工具执行身份的严格隔离。
 */
import { Injectable, Logger, MessageEvent, ServiceUnavailableException } from '@nestjs/common';
import { Observable, Subscriber } from 'rxjs';
import { config } from '../config/configuration';
import type { SessionUser } from '../auth/session-user';

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
  type: 'delta' | 'tool' | 'error' | 'done';
  text?: string;
  name?: string;
  message?: string;
}

export interface ChatBody {
  lineId?: string;
  message?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor() {}

  // AI 聊天入口调用前检查后端凭据是否配置；缺失时明确返回不可用。
  // 这里只检查配置存在，不发探测请求证明 Hermes 或底层模型运行正常。
  assertConfigured() {
    if (!config.ai.apiKey) {
      throw new ServiceUnavailableException({
        code: 503,
        msg: 'AI 未配置(缺 AI_API_KEY),请先启动 hermes gateway 并填写 API_SERVER_KEY',
      });
    }
  }

  // 用配置前缀和当前登录用户名组成 Hermes 会话标识，交给后续 HTTP 请求头。
  private sessionId(user: SessionUser) {
    return `${config.ai.sessionPrefix}-${user.username}`;
  }

  // 为这次网页聊天创建 Observable，异步请求 Hermes 并把事件通过 subscriber 交给 SSE 响应。
  // AbortController 控制本次 fetch；返回的清理回调在取消订阅时停止读取，不会撤销工具已经完成的现场操作。
  stream(body: ChatBody, user: SessionUser): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => {
      const ac = new AbortController();
      // 1. AbortController 是运行时提供的取消控制器，为这一轮聊天独立创建。
      // 2. 下方 fetch 使用 ac.signal；Observable 被取消订阅时，清理回调调用 ac.abort()。
      // 3. 中断的是此 HTTP 流读取，不会撤回已经由工具下发的控制命令。
      let cancelled = false;
      // 每次流独立的去重集合。AiService 是单例,放实例字段上会跨请求累积,
      // 导致第二次提问时第一个工具不再上报。
      const seenTools = new Set<string>();

      const push = (e: AiStreamEvent) => {
        if (!cancelled) subscriber.next({ data: e } as MessageEvent);
      };

      (async () => {
      // 这里创建并立即执行一个异步回调，内部步骤按 await 顺序完成
        try {

          // 网页聊天由 AiService 代理到 Hermes 的 /chat/completions；凭据与目标地址来自后端配置。
          // X-Hermes-Session-Id 按用户生成会话标识，messages 包含当前产线的系统提示和用户输入，stream=true 请求流式响应。
          // 后端继续解析并转发事件给网页；配置中的 hermes-agent 是 API 模型标识，不能单凭它确定底层实际使用哪一个模型。

          const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
          // 1. fetch 从后端向配置中的 Hermes HTTP 服务提交本次聊天。
          // 2. Authorization 使用后端配置凭据；X-Hermes-Session-Id 按登录用户名组成会话标识。
          // 3. body 中 model 是 API 模型标识，messages 带当前产线提示与用户输入。
          // 4. stream: true 请求分段返回；拿到 res 后还要通过 parseSse 拆出完整事件。
          // 5. 这里调用的是 Hermes 接口，具体工具执行继续经过其 MCP 连接，不在此直接写 PLC。
            method: 'POST',
            signal: ac.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.ai.apiKey}`,
              'X-Hermes-Session-Id': this.sessionId(user),
              // 根据用户生成隔离的 Hermes 会话标识。
            },
            body: JSON.stringify({
              model: config.ai.model,
              stream: true,
              messages: [
                { role: 'system', content: this.systemPrompt(body.lineId ?? 'line-01') },
                { role: 'user', content: body.message ?? '' },
              ],
            }),
          });

          if (!res.ok || !res.body) {
            const detail = await res.text().catch(() => '');
            throw new Error(`hermes ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
          }

          for await (const evt of this.parseSse(res.body)) {
            if (cancelled) break;
            this.handleChunk(evt, push, seenTools);
            // 解析一条 AI 返回数据，提取正文增量或工具调用信息。
          }
          push({ type: 'done' });
          subscriber.complete();
          // 结束 RxJS 事件流。
        } catch (e) {
          if (!cancelled) {
            const msg = (e as Error).message;
            // 浏览器直接关掉抽屉属于正常结束,不是故障
            if (!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`);
            push({ type: 'error', message: msg });
          }
          subscriber.complete();
          // 结束 RxJS 事件流。
        }
      })();

      return () => {
      // 箭头函数是返回给调用方的清理回调，稍后执行其中的释放逻辑
        cancelled = true;
        ac.abort();
        // 取消关联的异步请求。
      };
    });
  }

  // 持续从 HTTP 响应流读取字节，用 TextDecoder 和缓冲区拼接跨网络分片的数据。
  // 以空行切帧，取 data: 行解析 JSON；单次 reader.read 不等于完整业务事件，无法解析的帧按当前分支跳过。
  private async *parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<any, void, void> {
  // 逐块读取上游 SSE 文本，拆分并解析完整事件。
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        // 读取下一块流数据或当前资源内容。
        if (done) break;
        // done 是上方读取器给出的结束标记；为真时跳出当前读取循环
        buf += decoder.decode(value, { stream: true });
        // 1. value 是 reader.read() 返回的字节块，一块网络数据不一定恰好是一条事件。
        // 2. TextDecoder 把 UTF-8 字节转成文本；stream: true 允许跨字节块补齐字符。
        // 3. buf 保存未消费文本，随后按空行找完整 SSE 帧；半帧留到下一次读取再拼。
        let idx: number;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const frame = buf.slice(0, idx);
          // 1. idx 是前面找到的两个换行符位置，slice(0, idx) 取出分隔符前的一整帧文本。
          // 2. 下一行 slice(idx + 2) 保留尚未处理的尾部，所以同一个网络块可拆出多帧。
          // 3. 帧内再找 data: 行解析 JSON；不是简单把每次 read 的内容直接显示。
          buf = buf.slice(idx + 2);
          for (const line of frame.split('\n')) {
            if (!line.startsWith('data:')) continue;         // event:/id:/注释行一律忽略
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              yield JSON.parse(data);
            } catch {
              /* 非 JSON 帧:跳过 */
            }
          }
        }
      }
    } finally {
      reader.cancel().catch(() => undefined);
      // 取消当前等待中的请求或任务。
    }
  }

  // 把 Hermes 事件分别转换为工具提示或文字增量，由 stream 的 push 交给网页。
  // seenTools 只去重本次展示的工具名称，不是 PLC 命令去重记录。
  private handleChunk(c: any, push: (e: AiStreamEvent) => void, seenTools: Set<string>) {
    // 工具事件在**顶层**,且 tool 直接是字符串(实测 2026-10-16):
    //   {"tool":"mcp__line_twin__get_line_snapshot","status":"running","emoji":"⚡"}
    // 不是对象,也没有嵌在 choices 里。
    if (typeof c?.tool === 'string') {
      const name = this.friendlyTool(c.tool);
      if (name && !seenTools.has(name)) {
        seenTools.add(name);   // 同一工具 running/completed 会各来一帧,只报一次
        push({ type: 'tool', name });
      }
      return;
    }

    // 正文:OpenAI 兼容形状 choices[].delta.content
    // 注意 delta.reasoning_content 是模型的思考过程,故意不转发 ——
    // 那是内部推理链,混进回答里会让人以为 AI 在自言自语。
    const text = c?.choices?.[0]?.delta?.content;
    // 1. c 是 parseSse 产出的对象，可选链在某层缺失时得到 undefined。
    // 2. choices[0].delta.content 是正文增量位置，不一定是完整的一次回答。
    // 3. 下面只在 text 是非空字符串时推送 delta；工具提示走前面的 tool 分支。
    if (typeof text === 'string' && text) {
      push({ type: 'delta', text });
    }
  }

  // 从工具名称中剥离展示不需要的前缀，隐藏内部描述类工具。
  // 这一步只影响界面工具提示，不决定哪个 MCP 执行函数有控制权限。
  private friendlyTool(raw: string): string | null {
    if (raw === 'tool_describe' || raw.startsWith('hermes_')) return null;
    return raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '');
  }

  // 为当前产线组织网页助手提示，要求事实查工具、控制先建议并等待确认。
  // 这些字符串发送给模型作为对话上下文，不为 MCP 函数新增网页或飞书身份检查。
  private systemPrompt(lineId: string) {
    return [
    // 方括号中的条目组成返回数组，调用方按顺序使用其中的数据
      `你是产线数字孪生平台的运维助手,当前产线 ${lineId}。`,
      '用中文回答,结论要有工具查证支撑,不要凭空推断。',
      '需要改变产线状态时调用 propose_action 提交建议,由值班人人工确认后才执行。',
      '本通道(网页助手)禁止直接下发控制指令:不要调用 run_operation / execute_action,',
      '一律用 propose_action 走人工确认流程。',
      'IMPORTANT: 建议提交后并未执行。在人工确认之前,严禁使用「已停机」「已启动」' +
        '「已执行」这类过去完成式的表述,一律用「建议」「待确认」等措辞。',
    ].join('\n');
  }
}
