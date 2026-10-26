/**
 // 这一段负责配置和实现 server/src/ingest/ingest.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { StateModule } from '../state/state.module';
// 从 ../state/state.module 导入这一行列出的符号，供本文件调用。
// StateModule：从 ../state/state.module 导入的对象，用于本文件的调用或类型约束
import { HistoryModule } from '../history/history.module';
// 从 ../history/history.module 导入这一行列出的符号，供本文件调用。
// HistoryModule：从 ../history/history.module 导入的对象，用于本文件的调用或类型约束
import { RealtimeModule } from '../realtime/realtime.module';
// 从 ../realtime/realtime.module 导入这一行列出的符号，供本文件调用。
// RealtimeModule：从 ../realtime/realtime.module 导入的对象，用于本文件的调用或类型约束
import { MqttIngestService } from './mqtt-ingest.service';
// 从 ./mqtt-ingest.service 导入这一行列出的符号，供本文件调用。
// MqttIngestService：后端 MQTT 接入服务，订阅上行消息并发布控制指令

// 入口模块：MQTT 订阅 + 三路分发
// 这一段声明 IngestModule，用于IngestModule 的相关数据和行为。
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
  // 引入三个下游模块，才能注入它们导出的服务
  imports: [StateModule, HistoryModule, RealtimeModule],
  // 声明或设置 imports，用于当前对象或接口的对应数据。
  // StateModule：从 ../state/state.module 导入的对象，用于本文件的调用或类型约束；HistoryModule：从 ../history/history.module 导入的对象，用于本文件的调用或类型约束；RealtimeModule：从 ../realtime/realtime.module 导入的对象，用于本文件的调用或类型约束
  // 本模块提供的服务：MQTT 消费者
  providers: [MqttIngestService],
  // 声明或设置 providers，用于当前对象或接口的对应数据。
  // MqttIngestService：后端 MQTT 接入服务，订阅上行消息并发布控制指令
  // 开放给 CommandModule（控制指令要通过它 publish 到 MQTT）
  exports: [MqttIngestService],
  // 声明或设置 exports，用于当前对象或接口的对应数据。
  // MqttIngestService：后端 MQTT 接入服务，订阅上行消息并发布控制指令
})
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 本行完成上面一层已说明的函数、分支或对象配置
export class IngestModule {}
// 定义 IngestModule，约束或实现本模块涉及的数据和行为。
// IngestModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/ingest/ingest.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 IngestModule 的字段或服务能力，供项目其他模块使用。
