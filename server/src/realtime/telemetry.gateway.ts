/**
 * ============================================================================
 * 文件作用：WebSocket 网关（socket.io）—— 把实时数据推给浏览器
 * 所属模块：server/src/realtime/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件回答"前后端是怎么打通的（实时部分）" ★
 * ============================================================================
 *
 * 【一、为什么要 WebSocket，而不是前端轮询？】
 *   轮询：前端每 100ms 发一次 GET /api/lines/.../snapshot
 *     → 浏览器发 10 个请求/秒 → 每个请求都要走"公网 → 云服务器 Nginx
 *       → SSH 隧道 → 工控机后端 → Redis 查询"这一整条链路 → 带宽和 CPU 双浪费。
 *   WebSocket：浏览器和后端建立**一条长连接**，数据一来服务端立即推送。
 *     → 1 条连接，10Hz 推送，浏览器零轮询。
 *
 * 【二、socket.io 的连接过程（也是 TCP 长连接）】
 *   1) 浏览器加载 socket.io-client 后，客户端先发一个 HTTP GET 到
 *      /socket.io/?EIO=4&transport=polling —— 这是"握手探测"，
 *      目的是确认服务端可达并协商协议版本。
 *   2) 服务端回 CONNACK，升级为 WebSocket（Upgrade 头）—— 之后就是纯 TCP 长连接。
 *   3) 客户端 emit('subscribe', { lineId }) 告诉服务端"我要看哪条产线"。
 *   4) 服务端把该 socket 加入房间（room）`line:{lineId}`。
 *   5) 之后每次有数据，调用 server.to('line:line-01').emit('robot_state', msg)，
 *      socket.io 只把消息投递给该房间里的 socket —— 这就是"按产线分房间"。
 *
 *   ★ 生产部署关键点：Nginx 必须代理 /socket.io/ 并带上 Upgrade 头，
 *     否则 WebSocket 升级失败，页面会退化成轮询或直接连不上。
 *     见 deploy/nginx/cloud.conf 的 /socket.io/ 段。
 *
 * 【三、"房间（room）"机制】
 *   socket.io 内置的房间概念：`socket.join('line:line-01')` 之后，
 *   `server.to('line:line-01').emit(...)` 只会发给这个房间的成员。
 *   好处：一条产线的数据不会串到另一条产线的页面上；
 *   而且后端不需要维护"哪个客户端订阅了什么"的映射表。
 *
 * 【四、消息事件名对照表（前后端必须一致）】
 *   服务端 emit 名        │ 前端监听名         │ 含义
 *   ─────────────────────┼───────────────────┼──────────────────────
 *   robot_state           │ robot_state        │ 机器人六轴帧（10Hz）
 *   line_status           │ line_status        │ 产线状态（1Hz）
 *   event                 │ event              │ 生产事件/报警
 *   edge_status           │ edge_status        │ 边缘采集器在线状态
 *   subscribe / unsubscribe│ subscribe          │ 客户端 → 服务端的控制指令
 */
import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { config } from '../config/configuration';

// WebSocket 推送(socket.io)。前端先 emit('subscribe', {lineId}) 加入对应产线房间。
// TODO:接入会话鉴权和产线范围校验,防止未授权订阅其他产线。
@WebSocketGateway({ cors: { origin: config.http.corsOrigin } })
export class TelemetryGateway {
  // @WebSocketServer()：由 Nest 注入 socket.io 的 Server 实例（就是那个 http server）
  @WebSocketServer() server: Server;

  /**
   * 客户端订阅某条产线。
   * 前端 emit('subscribe', { lineId: 'line-01' })
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
    // 参数校验：没有 lineId 直接拒绝（返回对象会作为 ack 回给客户端）
    if (!body?.lineId) return { ok: false, error: 'lineId required' };
    // 把这个 socket 加入产线房间。之后该产线的所有广播都会推给它。
    // void 前缀：join 返回 Promise（Redis 适配器场景下是异步的），这里不关心结果
    void client.join(`line:${body.lineId}`);
    // 返回确认信息（socket.io 的 emit 带回调函数时会收到这个对象）
    return { ok: true, lineId: body.lineId };
  }

  /**
   * 客户端取消订阅（切换产线时用）。
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
    if (body?.lineId) void client.leave(`line:${body.lineId}`);
    return { ok: true };
  }

  broadcastRobot(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('robot_state', msg);
  }

  broadcastLineStatus(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('line_status', msg);
  }

  // 产线 IO(DB3 word 11~16,契约 §3.8)
  broadcastIo(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('io_state', msg);
  }

  /**
   * 广播生产事件 / 报警。
   */
  broadcastEvent(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('event', msg);
  }

  broadcastEdge(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('edge_status', msg);
  }

  // 控制指令回执推前端(cmd_ack → command_ack)
  broadcastCommandAck(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('command_ack', msg);
  }

  // AI 建议推前端(propose_action MCP 工具 → 抽屉里的建议卡片)。
  // 推给整条产线房间而非个人:房间成员都能看到这条建议,
  // 谁点确认由各自的权限决定 —— 建议本身不构成授权。
  broadcastAiProposal(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('ai_proposal', msg);
  }
}
