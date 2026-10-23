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

  /** 未配置 key 时明确拒绝,而不是让前端对着一个连不上的地址干等 */
  assertConfigured() {
    if (!config.ai.apiKey) {
      throw new ServiceUnavailableException({
        code: 503,
        msg: 'AI 未配置(缺 AI_API_KEY),请先启动 hermes gateway 并填写 API_SERVER_KEY',
      });
    }
  }

  /**
   * hermes session 按用户隔离:同一用户复用同一 session,
   * 才能保住 hermes 的 memory / skills;不同用户之间不共享上下文。
   */
  private sessionId(user: SessionUser) {
    return `${config.ai.sessionPrefix}-${user.username}`;
  }

  stream(body: ChatBody, user: SessionUser): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => {
      const ac = new AbortController();
      let cancelled = false;
      // 每次流独立的去重集合。AiService 是单例,放实例字段上会跨请求累积,
      // 导致第二次提问时第一个工具不再上报。
      const seenTools = new Set<string>();

      const push = (e: AiStreamEvent) => {
        if (!cancelled) subscriber.next({ data: e } as MessageEvent);
      };

      (async () => {
        try {
          const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
            method: 'POST',
            signal: ac.signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.ai.apiKey}`,
              'X-Hermes-Session-Id': this.sessionId(user),
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
          }
          push({ type: 'done' });
          subscriber.complete();
        } catch (e) {
          if (!cancelled) {
            const msg = (e as Error).message;
            // 浏览器直接关掉抽屉属于正常结束,不是故障
            if (!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`);
            push({ type: 'error', message: msg });
          }
          subscriber.complete();
        }
      })();

      return () => {
        cancelled = true;
        ac.abort();
      };
    });
  }

  /**
   * 逐条解析 SSE。刻意写得宽松:hermes 偶尔会插入 keepalive 注释行或
   * 非标准字段,遇到不认识的**跳过**而不是抛错 —— 一条脏帧不该掐断整段回答。
   */
  private async *parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<any, void, void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // SSE 以空行分帧;残留半帧留在 buf 里等下一块
        let idx: number;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const frame = buf.slice(0, idx);
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
    }
  }

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
    if (typeof text === 'string' && text) {
      push({ type: 'delta', text });
    }
  }

  /**
   * 工具名转成人话。
   * hermes 把 MCP 工具名成 mcp__<server>__<tool> 前缀(这里是 mcp__line_twin__),
   * 直接显示既长又难看;另外 tool_describe 是 hermes 内部的工具元信息读取,
   * 和业务无关,不该出现在「查了什么」里。
   */
  private friendlyTool(raw: string): string | null {
    if (raw === 'tool_describe' || raw.startsWith('hermes_')) return null;
    return raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '');
  }

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
    return [
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
