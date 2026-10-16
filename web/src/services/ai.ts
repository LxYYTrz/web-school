import type { AiProposal, AiStreamEvent } from './types';
import { getSocket } from './socket';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

let onUnauthorized: (() => void) | null = null;
export function setAiUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function throwFor(res: Response, method: string, path: string): Promise<never> {
  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('未登录或会话已过期');
  }
  let msg = `${method} ${path} → ${res.status}`;
  try {
    const j = await res.json();
    if (j?.msg) msg += `: ${j.msg}`;
    else if (j?.error) msg += `: ${j.error}`;
  } catch {
    /* 不是 JSON */
  }
  throw new Error(msg);
}

export async function apiAiStatus(): Promise<{ enabled: boolean; model: string }> {
  const res = await fetch(`${BASE}/api/ai/status`, { credentials: 'include' });
  if (!res.ok) await throwFor(res, 'GET', '/api/ai/status');
  return res.json();
}

/**
 * 发送一条消息,逐块回调 AI 的输出。
 *
 * 用 fetch + ReadableStream 而不是 EventSource:本项目是 cookie 会话
 * (sameSite=lax),原生 EventSource 没有 withCredentials,跨源(dev 5173 → 3000)
 * 会丢会话、拿回 401。fetch 能带 credentials:'include',所以自己解 SSE。
 *
 * onEvent 抛错会中断本次流(用于组件卸载/切换会话时取消)。
 */
export async function apiAiChat(
  lineId: string,
  message: string,
  onEvent: (e: AiStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lineId, message }),
    signal,
  });
  if (!res.ok) await throwFor(res, 'POST', '/api/ai/chat');
  if (!res.body) throw new Error('浏览器不支持流式响应');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // SSE 以空行分帧;半帧留在 buf 等下一块
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split('\n')) {
          if (!line.startsWith('data:')) continue;      // event:/id:/注释行忽略
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            onEvent(JSON.parse(payload) as AiStreamEvent);
          } catch {
            /* 非 JSON 帧跳过 —— 一条脏帧不该掐断整段回答 */
          }
        }
      }
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
}

/**
 * 确认一条 AI 建议 → 真正下发到 PLC。
 *
 * ⚠️ 这是 AI 链路里唯一会碰到真设备的方法,而且 level>=2 由后端 CommandGuard 把关,
 * 前端也再挡一道 —— 按钮的可用性只是体验,后端才是授权点。
 */
export async function apiConfirmAiProposal(
  id: string,
): Promise<{ ok: boolean; cmdId?: string; error?: string }> {
  const res = await fetch(`${BASE}/api/ai/proposals/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    credentials: 'include',
  });
  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('未登录或会话已过期');
  }
  const body = (await res.json().catch(() => ({}))) as {
    ok: boolean;
    cmdId?: string;
    error?: string;
  };
  if (res.status === 403) {
    throw new Error(body.error || '需 level >= 2 才能下发控制指令');
  }
  if (!res.ok) throw new Error(body.error || `确认失败:${res.status}`);
  return body;
}

/** 订阅 AI 建议推送。约定同 onCommandAck:返回退订闭包,组件 onBeforeUnmount 里调。 */
export function onAiProposal(cb: (p: AiProposal) => void): () => void {
  const socket = getSocket();
  socket.on('ai_proposal', cb);
  return () => {
    socket.off('ai_proposal', cb);
  };
}
