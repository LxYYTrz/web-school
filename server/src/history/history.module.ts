/**
 // 这一段负责配置和实现 server/src/history/history.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { HistoryWriterService } from './history-writer.service';
// 从 ./history-writer.service 导入这一行列出的符号，供本文件调用。
// HistoryWriterService：后端历史写入服务，将遥测、状态、事件和回执保存到数据库

// 这一段声明 HistoryModule，用于HistoryModule 的相关数据和行为。
@Module({ providers: [HistoryWriterService], exports: [HistoryWriterService] })
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器；HistoryWriterService：后端历史写入服务，将遥测、状态、事件和回执保存到数据库
export class HistoryModule {}
// 定义 HistoryModule，约束或实现本模块涉及的数据和行为。
// HistoryModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/history/history.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 HistoryModule 的字段或服务能力，供项目其他模块使用。
