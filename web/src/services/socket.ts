/**
 * 浏览器与后端的 Socket.IO 连接及一次性快照 HTTP 请求封装。
 * getSocket 懒创建并复用 socket.io-client 实例，配置仅 WebSocket 传输与重连；业务订阅由 useLineData 发出。
 * fetchSnapshot 经后端 GET 快照接口取得 JSON，浏览器不直连 Redis 或 MQTT Broker。
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

// 首次需要实时通信时创建 socket.io-client 实例，之后调用复用它。
// BASE 来自前端 API 基址配置，未设置时连当前网站入口；创建连接不等于已经订阅产线房间。
export function getSocket(): Socket {
  // 还没创建过 → 创建
  if (!socket) {
    // 【调用各部分：部分 / 作用】
    // 部分 | 作用
    // io() | socket.io-client 提供的客户端创建方法。
    // BASE | 后端入口配置，未另设时使用当前网站入口。
    // transports | 本项目只选择 websocket 传输。
    // reconnectionAttempts | 重连尝试次数配置。
    // reconnectionDelay / Max | 重连间隔及其上限，单位毫秒。
    // socket | 模块级共享连接对象，业务订阅仍由后面的代码发出。
    socket = io(BASE ?? '/', {
    // 1. io 从 socket.io-client 导入，在浏览器创建一个实时通信客户端。
    // 2. BASE 有配置时使用指定入口；否则使用当前网站根路径，由部署中的 Nginx 转发。
    // 3. transports 只选择 websocket；下方三个重连参数控制重试次数与间隔，不控制 PLC 采样周期。
    // 4. 这里仅建立连接；订阅 line:line-01 房间还要由 useLineData 发 subscribe 事件。
    // 5. 模块变量 socket 保存这个对象，其他页面和回执监听复用同一客户端。
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  // 返回 socket 实例
  return socket;
}

// 为指定产线发起一次 HTTP 快照请求，成功后将响应正文解析为 JSON。
// fetch 是浏览器内置 API，接口返回由后端 Redis 汇总得到的已有状态；后续实时帧另走 Socket.IO。
// 【入口 fetchSnapshot：部分 / 作用】
// 部分 | 作用
// lineId | 产线业务编码，例如 line-01；供接口、消息主题或快照 key 使用。
export async function fetchSnapshot(lineId: string) {
  // BASE 为空时用空字符串，拼出的路径是 /api/lines/...（同源相对路径）
  const base = BASE ?? '';
  // 发 GET 请求
  const res = await fetch(`${base}/api/lines/${lineId}/snapshot`);
  // 1. fetch 是浏览器内置 HTTP 请求方法，这里未指定 method，所以发 GET。
  // 2. lineId 例如 line-01，组成后端的产线快照接口地址。
  // 3. res 是 HTTP 响应对象，下面先判断状态，再调用 res.json() 解析正文。
  // 4. 接口由后端读取 Redis 组装；浏览器没有直接连接 Redis，也没有在此订阅 MQTT。
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  // 解析 JSON 并返回
  return res.json();
}
