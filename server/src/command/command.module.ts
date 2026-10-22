/**
 * ============================================================================
 * 文件作用：控制模块（CommandModule）—— 装配指令接口与服务
 * 所属模块：server/src/command/
 * ============================================================================
 *
 * 【宏观定位】下行控制链路的后端部分。它是唯一能向 MQTT 下行主题发布的模块。
 *
 * 【模块依赖】
 *   imports IngestModule → 注入 MqttIngestService（提供 publishCommand 方法）
 *   注意：这里 import 的是 IngestModule 而不是直接 import mqtt-ingest.service.ts，
 *         这样保持了「模块是依赖边界」的设计，IngestModule 已经 export 了该服务。
 *
 * 【数据流位置】
 *   浏览器 POST → CommandController → CommandService
 *                → PG(control_commands 审计)
 *                → MqttIngestService.publishCommand() → MQTT → 采集器 → PLC
 */
import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { CommandGuard } from './command.guard';

// 控制模块：指令下发
@Module({
  // 引入入口模块，获得 MQTT 发布能力
  imports: [IngestModule],
  // 对外暴露 HTTP 接口
  controllers: [CommandController],
  providers: [CommandService, CommandGuard],
  // AI 侧「人确认 AI 建议」要复用 issue() 的全套保护(白名单/枚举/审计/MQTT),
  // 所以把 Service 导出给 AiModule;Guard 不导出,确认端点按类引用即可。
  exports: [CommandService],
})
export class CommandModule {}
