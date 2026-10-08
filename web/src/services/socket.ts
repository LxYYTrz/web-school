import { io, type Socket } from 'socket.io-client';

// 连接管理:
// - 开发:走 Vite 代理(import.meta.env.VITE_API_BASE 为空时连接同源)
// - 生产:构建后用 Nginx 同源反代,无需跨域
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || undefined;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE ?? '/', {
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export async function fetchSnapshot(lineId: string) {
  const base = BASE ?? '';
  const res = await fetch(`${base}/api/lines/${lineId}/snapshot`);
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  return res.json();
}
