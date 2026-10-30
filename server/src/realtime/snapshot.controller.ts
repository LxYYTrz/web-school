/**
 * HTTP 快照入口：GET /api/lines/:lineId/snapshot。
 * 路径中的 lineId 交给 LineStateService.getLineSnapshot，从 Redis 汇总已有状态后返回 JSON。
 * 该接口处理一次请求；后续新帧由 telemetry.gateway.ts 通过 Socket.IO 发送。
 */
import { Controller, Get, Param } from '@nestjs/common';
import { LineStateService } from '../state/line-state.service';

// 产线快照:前端首屏/断线重连时一次性拉取当前状态(数据来自 Redis)
/**
 * 快照控制器：对外暴露产线快照查询接口。
 */
@Controller('api/lines')
export class SnapshotController {
// SnapshotController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  constructor(private readonly state: LineStateService) {}


  // 浏览器通过 GET /api/lines/:lineId/snapshot 请求首屏已有状态，lineId 由 URL 提取。
  // 控制器交给 LineStateService.getLineSnapshot() 从 Redis 汇总数据并返回 JSON；浏览器不直接连接 Redis。
  // 后续实时新帧走 Socket.IO，快照接口本身不是持续推送连接。

  // 【入口 SnapshotController.snapshot：部分 / 作用】
  // 部分 | 作用
  // lineId | 产线业务编码，例如 line-01；供接口、消息主题或快照 key 使用。
  @Get(':lineId/snapshot')
  snapshot(@Param('lineId') lineId: string) {
    return this.state.getLineSnapshot(lineId);
  }
}
