/**
 * 后端 Socket.IO 网关，承接浏览器 subscribe/unsubscribe，以及其他服务发起的广播。
 * 先看连接加入 line:编码 房间，再看不同 broadcast 方法使用的事件名；房间订阅不同于 MQTT 主题订阅。
 * Socket.IO 的 Server/Socket 提供 join、leave、to、emit；本文件按产线选择接收连接，不读取 PLC。
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

  // 浏览器在已有 Socket.IO 连接上发 subscribe，提供要接收的产线编码。
  // client.join 是 Socket.IO 的房间 API；加入 line:编码 后，后续对应广播才选择这些连接。
  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
    // 参数校验：没有 lineId 直接拒绝（返回对象会作为 ack 回给客户端）
    if (!body?.lineId) return { ok: false, error: 'lineId required' };
    // 把这个 socket 加入产线房间。之后该产线的所有广播都会推给它。
    void client.join(`line:${body.lineId}`);
    // 1. client 是本次发送 subscribe 的 Socket.IO 连接，不是 MQTT 采集器。
    // 2. join() 来自 Socket.IO；body.lineId 例如 line-01 时加入 line:line-01 房间。
    // 3. 房间名用于后续广播筛选接收者，不会新建数据库产线或启动 PLC 读取。
    return { ok: true, lineId: body.lineId };
  }

  // 浏览器退出该产线订阅时离开对应房间；连接本身可继续存在。
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
    if (body?.lineId) void client.leave(`line:${body.lineId}`);
    return { ok: true };
  }

  // MQTT 接入层把机器人整帧交给这里，以 robot_state 事件发送给相应产线房间。
  // server.to().emit() 来自 Socket.IO；不会在这里写 Redis 或等待历史落库。
  broadcastRobot(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('robot_state', msg);
    // 1. server 是 NestJS 网关注入的 Socket.IO 服务端实例。
    // 2. to() 选择这条产线房间，emit() 将整帧作为 robot_state 事件正文交给连接。
    // 3. 网页在 useLineData 注册同名回调，所以收到后更新共享 robot；不是函数名自动完成存储与显示。
  }

  // 按产线房间广播 line_status，网页共享状态接收后更新工序显示。
  broadcastLineStatus(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('line_status', msg);
    // 选择要广播消息的 Socket.IO 房间。
  }

  // 按产线房间广播 io_state；网页的 IO 文案、色调和停滞判断在前端分别计算。
  broadcastIo(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('io_state', msg);
    // 选择要广播消息的 Socket.IO 房间。
  }

  // 按产线房间广播 event；数据库事件写入由 HistoryWriter 的独立路径完成。
  broadcastEvent(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('event', msg);
    // 选择要广播消息的 Socket.IO 房间。
  }

  // 按产线房间广播 edge_status，内容来自采集器上报或遗嘱通知。
  broadcastEdge(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('edge_status', msg);
    // 选择要广播消息的 Socket.IO 房间。
  }

  // 把采集器业务回执转换为网页 command_ack 事件，保留原 cmdId 供页面匹配。
  // 它与 MQTT 的 cmd_ack 主题及数据库更新分别处理；数据库未匹配行不等于此广播自动停止。
  broadcastCommandAck(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('command_ack', msg);
    // 选择要广播消息的 Socket.IO 房间。
  }

  // ProposalService 在建议校验保存后广播 ai_proposal，让网页显示等待人工确认的内容。
  broadcastAiProposal(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('ai_proposal', msg);
    // 选择要广播消息的 Socket.IO 房间。
  }
}
