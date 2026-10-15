import { getSocket } from './socket';
import type { CommandAck } from './types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

// 401 全局跳登录(对齐 services/auth.ts 的 setUnauthorizedHandler)
let onUnauthorized: (() => void) | null = null;
export function setControlUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

export interface SendCommandParams {
  deviceId: string;
  type: 'start' | 'stop' | 'reset' | 'changeover' | 'mode_set' | 'alarm_clear' | string;
  params?: Record<string, unknown>;
}

export interface SendCommandResult {
  ok: boolean;
  cmdId?: string;
  error?: string;
}

// POST /api/lines/{lineId}/commands
// 后端:AuthGuard + CommandGuard(level>=2) + 契约 v1.1 白名单
export async function apiSendCommand(
  lineId: string,
  cmd: SendCommandParams,
): Promise<SendCommandResult> {
  const res = await fetch(`${BASE}/api/lines/${lineId}/commands`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('未登录或会话已过期');
  }
  if (!res.ok) {
    let msg = `POST commands → ${res.status}`;
    try {
      const j = await res.json();
      if (j?.msg) msg += `: ${j.msg}`;
      else if (j?.error) msg += `: ${j.error}`;
    } catch { /* 不是 JSON */ }
    throw new Error(msg);
  }
  return res.json() as Promise<SendCommandResult>;
}

// 订阅 socket 'command_ack'(由后端 telemetry.gateway.broadcastCommandAck 转发)
// 返回取消订阅函数
export function onCommandAck(cb: (ack: CommandAck) => void): () => void {
  const socket = getSocket();
  const handler = (msg: CommandAck) => cb(msg);
  socket.on('command_ack', handler);
  return () => { socket.off('command_ack', handler); };
}