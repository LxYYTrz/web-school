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

  broadcastEvent(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('event', msg);
  }

  broadcastVision(lineId: string, msg: unknown) {
    this.server?.to(`line:${lineId}`).emit('vision_result', msg);
  }
}
