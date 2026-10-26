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
// 从 socket.io-client 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 连接管理:
// - 开发:走 Vite 代理(import.meta.env.VITE_API_BASE 为空时连接同源)
// - 生产:构建后用 Nginx 同源反代,无需跨域
// 后端基地址。VITE_API_BASE 未定义时为 undefined → 走同源。
// `as string | undefined` 是类型断言：告诉 TS 这个值可能是 undefined
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || undefined;
// 声明 BASE，初始值由 (import.meta.env.VITE_API_BASE as string | undefined) || undefined 计算得到。 关键字：const＝声明不可重新绑定的变量；import＝导入模块或符号；undefined＝未定义值。

/**
 * 模块级 socket 单例。
 * 为什么不在函数里 new？因为 socket.io 自带自动重连，
 * 断线重连时如果重新 new 一个连接，会丢失"已订阅的房间"状态，
 * 还可能造成重复连接。模块级单例保证整个 SPA 只有一条连接。
 */
let socket: Socket | null = null;
// 声明 socket，初始值由 null 计算得到。 关键字：let＝声明可重新赋值的变量；null＝空值。

export function getSocket(): Socket {
// 定义函数 getSocket。 关键字：export＝向其他模块开放符号；function＝定义函数。
  // 还没创建过 → 创建
  if (!socket) {
  // 判断 if (!socket) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    socket = io(BASE ?? '/', {
    // 把右侧表达式的结果写入 socket。
      transports: ['websocket'],
      // 设置字段 transports。
      reconnectionAttempts: Infinity,
      // 设置字段 reconnectionAttempts。
      reconnectionDelay: 1000,
      // 设置字段 reconnectionDelay。
      reconnectionDelayMax: 5000,
      // 设置字段 reconnectionDelayMax。
    });
    // 结束当前回调或对象，并完成外层函数调用。
  }
  // 结束当前对象、函数或条件代码块。
  // 返回 socket 实例
  return socket;
  // 返回 socket 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/**
 * 拉取产线快照（首屏用）。
 *
 * @param lineId 产线编码，如 'line-01'
 * @returns 快照对象，结构见 types.ts 的 LineSnapshot
 */
export async function fetchSnapshot(lineId: string) {
// 定义函数 fetchSnapshot。 关键字：export＝向其他模块开放符号；async＝声明异步函数；function＝定义函数。
  // BASE 为空时用空字符串，拼出的路径是 /api/lines/...（同源相对路径）
  const base = BASE ?? '';
  // 声明 base，初始值由 BASE ?? '' 计算得到。 关键字：const＝声明不可重新绑定的变量。
  // 发 GET 请求
  const res = await fetch(`${base}/api/lines/${lineId}/snapshot`);
  // 声明 res，初始值由 await fetch(${base}/api/lines/${lineId}/snapshot) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  // 非 2xx 就抛错，调用方（useLineData.preload）会 catch 并静默降级
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  // 判断 if (!res.ok) throw new Error(snapshot ${res.status}); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。
  // 解析 JSON 并返回
  return res.json();
  // 返回 res.json() 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。
