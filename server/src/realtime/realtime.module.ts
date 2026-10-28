/**
 * NestJS 的 首屏快照与实时事件装配模块 RealtimeModule，由 AppModule 引入。
 * 注册 SnapshotController 和 TelemetryGateway，并导出网关供业务服务广播。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { StateModule } from '../state/state.module';
import { TelemetryGateway } from './telemetry.gateway';
import { SnapshotController } from './snapshot.controller';

// 实时模块：WebSocket 推送 + REST 快照
@Module({
  // 引入状态模块以获得 LineStateService 的注入能力
  imports: [StateModule],
  providers: [TelemetryGateway],
  controllers: [SnapshotController],
  exports: [TelemetryGateway],
})
export class RealtimeModule {}
// RealtimeModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
