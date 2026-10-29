/**
 * 网页 AI 请求封装，供 AiDrawer 检查可用配置、发送聊天并确认建议。
 * 聊天使用 fetch 保持 HTTP 响应流，逐段解析 SSE，再回调文字、工具、错误与结束事件。
 * 它与机器人数据的 Socket.IO 连接分别工作；AbortSignal 用来取消本次聊天读取。
 */
import type { AiProposal, AiStreamEvent } from './types';
import { getSocket } from './socket';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

let onUnauthorized: (() => void) | null = null;
export function setAiUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function throwFor(res: Response, method: string, path: string): Promise<never> {
// 从失败的 HTTP 响应中提取错误说明并抛出异常。
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

// 发送本次聊天输入并持续读取后端 SSE 响应，将解析出的事件交给 onEvent。
// signal 来自组件的 AbortController；reader 的网络分块先拼入缓冲，再按事件边界处理，不把一块字节直接当成完整回答。
export async function apiAiChat(
// 向后端提交当前对话，并持续解析 SSE 返回事件，供网页 AI 抽屉更新显示。
// lineId、message 描述本次请求；onEvent 接收 delta、tool、error、done 等事件；取消或组件卸载时可中断这次响应读取。
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
      // 读取下一块流数据或当前资源内容。
      if (done) break;
      // done 是上方读取器给出的结束标记；为真时跳出当前读取循环
      buf += decoder.decode(value, { stream: true });
      // 1. value 是后端 HTTP 响应的一段字节，TextDecoder 持续将它解成 UTF-8 文本。
      // 2. stream: true 允许一个汉字的字节跨块到达；buf 同时保留未拼完的 SSE 事件。
      // 3. 下面按空行截帧，再解析 data: JSON，最后用 onEvent 交给 AiDrawer 更新正文或工具提示。
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
    // 取消当前等待中的请求或任务。
  }
}

// 用户点击确认后，用建议 id 请求后端领取、校验并安排下发。
// 成功返回 cmdId 仍是下发阶段的结果；原建议编号和最终控制命令编号承担不同关联作用。
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

// 在共用 Socket.IO 连接上接收 ai_proposal，返回供组件卸载时调用的退订函数。
export function onAiProposal(cb: (p: AiProposal) => void): () => void {
  const socket = getSocket();
  socket.on('ai_proposal', cb);
  // 1. getSocket() 取得全局共用 Socket.IO 客户端，这里直接注册建议事件。
  // 2. cb 由 AiDrawer 传入，收到建议后加入待确认卡片；它不是聊天 SSE 的 delta。
  // 3. 返回的取消函数只移除此 cb，不关闭共享连接；人工确认另发 HTTP 请求。
  return () => {
  // 箭头函数是返回给调用方的清理回调，稍后执行其中的释放逻辑
    socket.off('ai_proposal', cb);
    // 移除指定事件的回调函数。
  };
}
