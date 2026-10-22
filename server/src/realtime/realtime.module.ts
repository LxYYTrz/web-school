/**
 * ============================================================================
 * 文件作用：实时模块（RealtimeModule）—— 装配 WebSocket 网关 + 快照接口
 * 所属模块：server/src/realtime/
 * ============================================================================
 *
 * 【宏观定位】本模块是"后端对外的实时出口"，包含两条对外通道：
 *   ① WebSocket（socket.io）：长连接推送实时数据 → TelemetryGateway
 *   ② REST 快照接口：一次性拉当前状态   → SnapshotController
 *
 * 【为什么网关和控制器放同一个模块】
 *   它们服务的都是同一个业务概念："给前端提供产线的实时视图"。
 *   NestJS 官方示例也把 Gateway 和 Controller 放一起（同一个 realtime 模块）。
 *
 * 【模块依赖】
 *   imports StateModule → 为了让 SnapshotController 能注入 LineStateService
 */
import { Module } from '@nestjs/common';
import { StateModule } from '../state/state.module';
import { TelemetryGateway } from './telemetry.gateway';
import { SnapshotController } from './snapshot.controller';

// 实时模块：WebSocket 推送 + REST 快照
@Module({
  // 引入状态模块以获得 LineStateService 的注入能力
  imports: [StateModule],
  // providers：WebSocket 网关（由 @WebSocketGateway 装饰的类）
  providers: [TelemetryGateway],
  // controllers：REST 控制器
  controllers: [SnapshotController],
  // exports：网关需要被 IngestModule 使用（广播数据）
  exports: [TelemetryGateway],
})
export class RealtimeModule {}
