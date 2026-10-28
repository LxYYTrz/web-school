/**
 * 浏览器控制接口封装，由 ControlButtons 等组件提交设备、指令类型和参数。
 * apiSendCommand 将 lineId 放入 URL、cmd 编码成 JSON，并按规则携带 Cookie；后端会话提供操作者。
 * HTTP 返回 ok/cmdId 后仍需等待 command_ack；接口成功返回不等于设备物理动作完成。
 */
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

// 组件确认操作后将 cmd 编码成 JSON，发送到当前 lineId 的 commands 接口。
// 设备、type、params 在正文；适用 Cookie 随请求发送，操作者由后端会话取得；返回 cmdId 后再等待业务回执。
export async function apiSendCommand(
// 将网页确认后的业务指令提交到当前产线的控制接口，返回后端受理结果。
// lineId 进入 URL，cmd 提供 deviceId、type、params；返回 cmdId 后页面继续等待 command_ack，HTTP 返回不等于物理动作完成。
  lineId: string,
  // 后端:AuthGuard + CommandGuard(level>=2) + 契约 v1.1 白名单。
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

// 给共用 Socket.IO 连接注册 command_ack 回调，返回移除同一回调的闭包。
// 组件卸载应调用这个闭包；移除界面监听不会撤销已发给 PLC 的命令。
export function onCommandAck(cb: (ack: CommandAck) => void): () => void {
  const socket = getSocket();
  const handler = (msg: CommandAck) => cb(msg);
  socket.on('command_ack', handler);
  return () => { socket.off('command_ack', handler); };
}
