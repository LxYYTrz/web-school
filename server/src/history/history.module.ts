/**
 * ============================================================================
 * 文件作用：历史模块（HistoryModule）—— 装配 HistoryWriterService
 * 所属模块：server/src/history/
 * ============================================================================
 *
 * 【宏观定位】单一职责模块：只负责「把数据写进 TimescaleDB」。
 *
 * 【谁在用它】
 *   - ingest/mqtt-ingest.service.ts：MQTT 报文进来后调用 bufferRobotFrame /
 *     insertLineStatus / insertEvent / ackCommand
 *   写入的表在 db/init/001_init.sql 中定义（三张 hypertable + 一张普通表）。
 */
import { Module } from '@nestjs/common';
import { HistoryWriterService } from './history-writer.service';

@Module({ providers: [HistoryWriterService], exports: [HistoryWriterService] })
export class HistoryModule {}
