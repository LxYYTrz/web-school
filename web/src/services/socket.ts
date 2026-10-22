/**
 * ============================================================================
 * 文件作用：前端通信层（socket.io 连接管理 + 快照 REST 请求）
 * 所属模块：web/src/services/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件回答"前端是怎么跟后端通信的" ★
 * ============================================================================
 *
 * 【两条通信通道，各司其职】
 *
 *   通道 ①：REST —— 拉一次性的当前状态
 *     前端 → GET {BASE}/api/lines/{lineId}/snapshot → 后端 Redis
 *     用途：首屏渲染、断线重连后的状态恢复
 *
 *   通道 ②：WebSocket（socket.io）—— 订阅实时推送
 *     前端 ← 长连接 ← 后端 broker 推送
 *     用途：10Hz 关节数据、1Hz 状态、事件流
 *
 * 【BASE 的取值逻辑 —— 开发 vs 生产】
 *   变量：VITE_API_BASE（定义在 web/.env，由 Vite 在构建时内联进 JS）
 *     - 开发期：.env 里写 VITE_API_BASE=http://localhost:3000
 *       → 直连后端，跨域 → 后端 CORS 放行
 *     - 生产期：.env 里留空 / 不设 → BASE = undefined
 *       → BASE ?? '/' 变成 '/' → 连**同源**（当前域名）
 *       → 请求变成 https://云服务器IP/api/... 和 https://云服务器IP/socket.io/
 *       → 由云端 Nginx 反向代理到工控机后端，浏览器完全无感
 *     这就是"生产环境同源、生产零跨域"的设计。
 *
 * 【socket.io 连接参数详解】
 *   transports: ['websocket']
 *     只用 WebSocket 传输，不做 HTTP long-polling 回退。
 *     原因：生产路径是 Nginx → SSH 隧道 → 工控机，polling 回退要多次往返，
 *     在高延迟链路上很慢；且轮询回退对 10Hz 推送不合适。
 *     （开发期如果遇到代理不支持 WS，可临时改成 ['polling','websocket']）
 *   reconnectionAttempts: Infinity
 *     无限重连 —— 隧道断了、网断了都要自己恢复，不需要刷新页面。
 *   reconnectionDelay: 1000 / reconnectionDelayMax: 5000
 *     重连间隔从 1 秒开始，逐步退避到最多 5 秒，避免疯狂重连打爆服务器。
 */
import { io, type Socket } from 'socket.io-client';

// 连接管理:
// - 开发:走 Vite 代理(import.meta.env.VITE_API_BASE 为空时连接同源)
// - 生产:构建后用 Nginx 同源反代,无需跨域
// 后端基地址。VITE_API_BASE 未定义时为 undefined → 走同源。
// `as string | undefined` 是类型断言：告诉 TS 这个值可能是 undefined
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || undefined;

/**
 * 模块级 socket 单例。
 * 为什么不在函数里 new？因为 socket.io 自带自动重连，
 * 断线重连时如果重新 new 一个连接，会丢失"已订阅的房间"状态，
 * 还可能造成重复连接。模块级单例保证整个 SPA 只有一条连接。
 */
let socket: Socket | null = null;

export function getSocket(): Socket {
  // 还没创建过 → 创建
  if (!socket) {
    socket = io(BASE ?? '/', {
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  // 返回 socket 实例
  return socket;
}

/**
 * 拉取产线快照（首屏用）。
 *
 * @param lineId 产线编码，如 'line-01'
 * @returns 快照对象，结构见 types.ts 的 LineSnapshot
 */
export async function fetchSnapshot(lineId: string) {
  // BASE 为空时用空字符串，拼出的路径是 /api/lines/...（同源相对路径）
  const base = BASE ?? '';
  // 发 GET 请求
  const res = await fetch(`${base}/api/lines/${lineId}/snapshot`);
  // 非 2xx 就抛错，调用方（useLineData.preload）会 catch 并静默降级
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  // 解析 JSON 并返回
  return res.json();
}
