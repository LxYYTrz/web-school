/**
 * ============================================================================
 * 文件作用：入口模块（IngestModule）—— 装配 MQTT 消费服务
 * 所属模块：server/src/ingest/
 * ============================================================================
 *
 * 【宏观定位】上行数据流的入口模块。它自己不实现任何解析逻辑，
 *   只负责把 MqttIngestService 和它需要的三个下游模块"接上线"。
 *
 * 【依赖方向图（单向，无环）】
 *   IngestModule
 *     ├─ imports StateModule    → 得到 LineStateService（写 Redis 快照）
 *     ├─ imports HistoryModule  → 得到 HistoryWriterService（写 TimescaleDB）
 *     └─ imports RealtimeModule → 得到 TelemetryGateway（WebSocket 广播）
 *
 *   下游模块都不反向 import 本模块，所以没有循环依赖。
 *   注意 RealtimeModule 自身又 imports 了 StateModule（快照控制器需要读快照），
 *   这依然是单向的：Realtime → State。
 *
 * 【谁在用本模块】
 *   - CommandModule：需要 MqttIngestService.publishCommand() 下发控制指令
 */
import { Module } from '@nestjs/common';
import { StateModule } from '../state/state.module';
import { HistoryModule } from '../history/history.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MqttIngestService } from './mqtt-ingest.service';

// 入口模块：MQTT 订阅 + 三路分发
@Module({
  // 引入三个下游模块，才能注入它们导出的服务
  imports: [StateModule, HistoryModule, RealtimeModule],
  // 本模块提供的服务：MQTT 消费者
  providers: [MqttIngestService],
  // 开放给 CommandModule（控制指令要通过它 publish 到 MQTT）
  exports: [MqttIngestService],
})
export class IngestModule {}
