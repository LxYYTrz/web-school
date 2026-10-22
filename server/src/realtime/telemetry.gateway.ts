import {
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { config } from '../config/configuration';

// WebSocket 推送(socket.io)。前端先 emit('subscribe', {lineId}) 加入对应产线房间。
// TODO(第 4 步):接入 JWT 鉴权 + user_line_scope 校验,防止越权订阅其他产线
@WebSocketGateway({ cors: { origin: config.http.corsOrigin } })
export class TelemetryGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
    if (!body?.lineId) return { ok: false, error: 'lineId required' };
    void client.join(`line:${body.lineId}`);
    return { ok: true, lineId: body.lineId };
  }

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
