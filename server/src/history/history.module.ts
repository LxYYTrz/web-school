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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { HistoryWriterService } from './history-writer.service';
// 从 ./history-writer.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

@Module({ providers: [HistoryWriterService], exports: [HistoryWriterService] })
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
export class HistoryModule {}
// 声明 HistoryModule 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
