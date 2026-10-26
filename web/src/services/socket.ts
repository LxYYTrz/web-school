/**
 // 这一段负责配置和实现 web/src/services/socket.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 socket.io-client 导入这一行列出的符号，供本文件调用。
// io：从 socket.io-client 导入的对象，用于本文件的浏览器 Socket.IO 客户端；Socket：从 socket.io-client 导入的对象，用于本文件的浏览器 Socket.IO 客户端

// 连接管理:
// - 开发:走 Vite 代理(import.meta.env.VITE_API_BASE 为空时连接同源)
// - 生产:构建后用 Nginx 同源反代,无需跨域
// 后端基地址。VITE_API_BASE 未定义时为 undefined → 走同源。
// `as string | undefined` 是类型断言：告诉 TS 这个值可能是 undefined
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || undefined;
// 根据 (import.meta.env.VITE_API_BASE as string | undefined) || undefined 设置 BASE，供当前流程后续使用。
// BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || und… 的结果；env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_API_BASE：本处声明的字段或类型，类型为 any

/**
 * 模块级 socket 单例。
 * 为什么不在函数里 new？因为 socket.io 自带自动重连，
 * 断线重连时如果重新 new 一个连接，会丢失"已订阅的房间"状态，
 * 还可能造成重复连接。模块级单例保证整个 SPA 只有一条连接。
 */
let socket: Socket | null = null;
// 还可能造成重复连接。模块级单例保证整个 SPA 只有一条连接。
// socket：Socket.IO 实时连接实例；Socket：从 socket.io-client 导入的对象，用于本文件的浏览器 Socket.IO 客户端

// 这一段定义 getSocket，用于取得并复用浏览器端 Socket.IO 单例连接。
export function getSocket(): Socket {
// 定义函数 getSocket。
// getSocket：取得并复用浏览器端 Socket.IO 单例连接；Socket：从 socket.io-client 导入的对象，用于本文件的浏览器 Socket.IO 客户端
  // 还没创建过 → 创建
  if (!socket) {
  // 检查(!socket)，按判断结果进入对应的处理分支。
  // socket：Socket.IO 实时连接实例
    socket = io(BASE ?? '/', {
    // 把右侧表达式的结果写入 socket。
    // socket：Socket.IO 实时连接实例；io：从 socket.io-client 导入的对象，用于本文件的浏览器 Socket.IO 客户端；BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || und… 的结果
      transports: ['websocket'],
      // 声明或设置 transports，用于当前对象或接口的对应数据。
      // transports 是此处声明的字段，类型或取值约束为 ['websocket']
      reconnectionAttempts: Infinity,
      // 声明或设置 reconnectionAttempts，用于当前对象或接口的对应数据。
      // Infinity：本处保存的局部数据，类型为 number
      reconnectionDelay: 1000,
      // 声明或设置 reconnectionDelay，用于当前对象或接口的对应数据。
      // reconnectionDelay 是此处声明的字段，类型或取值约束为 1000
      reconnectionDelayMax: 5000,
      // 声明或设置 reconnectionDelayMax，用于当前对象或接口的对应数据。
      // reconnectionDelayMax 是此处声明的字段，类型或取值约束为 5000
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 返回 socket 实例
  return socket;
  // 把socket作为当前函数的结果返回。
  // socket：Socket.IO 实时连接实例
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了取得并复用浏览器端 Socket.IO 单例连接的实现；实际结果由运行时输入和执行分支决定。

/**
 * 拉取产线快照（首屏用）。
 *
 * @param lineId 产线编码，如 'line-01'
 * @returns 快照对象，结构见 types.ts 的 LineSnapshot
 */
// 这一段定义 fetchSnapshot，用于通过 HTTP 获取指定产线的当前快照。
export async function fetchSnapshot(lineId: string) {
// 定义函数 fetchSnapshot。
// fetchSnapshot：通过 HTTP 获取指定产线的当前快照；lineId：产线标识，接口通常使用 line-01 等编码
  // BASE 为空时用空字符串，拼出的路径是 /api/lines/...（同源相对路径）
  const base = BASE ?? '';
  // 根据 BASE ?? '' 设置 base，供当前流程后续使用。
  // base：本处保存 BASE ?? '' 的结果；BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || und… 的结果
  // 发 GET 请求
  const res = await fetch(`${base}/api/lines/${lineId}/snapshot`);
  // 向指定 HTTP 接口发送请求，将结果保存或写入 res。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；base：本处保存 BASE ?? '' 的结果；lineId：产线标识，接口通常使用 line-01 等编码
  // 非 2xx 就抛错，调用方（useLineData.preload）会 catch 并静默降级
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  // 条件 (!res.ok) throw new Error(`snapshot ${res.status}`); 成立时按本行给出的错误终止处理。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；ok：操作是否成功的布尔结果；Error：标准错误对象类型；status：当前连接、产线、请求或指令的状态字段
  // 解析 JSON 并返回
  return res.json();
  // 把res.json()作为当前函数的结果返回。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；json：将 HTTP 响应正文解析为 JSON 对象
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/services/socket.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了通过 HTTP 获取指定产线的当前快照的实现；实际结果由运行时输入和执行分支决定。
