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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { IngestModule } from '../ingest/ingest.module';
// 从 ../ingest/ingest.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandController } from './command.controller';
// 从 ./command.controller 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { MachineCommandController } from './machine-command.controller';
// 从 ./machine-command.controller 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandService } from './command.service';
// 从 ./command.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandGuard } from './command.guard';
// 从 ./command.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { MachineTokenGuard } from './machine-token.guard';
// 从 ./machine-token.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 控制模块：指令下发
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
  // 引入入口模块，获得 MQTT 发布能力
  imports: [IngestModule],
  // 设置字段 imports。
  // 对外暴露 HTTP 接口
  //   CommandController        —— 浏览器(session + level>=2)
  //   MachineCommandController —— 机器(x-machine-token),演示阶段给飞书 AI 直控用
  controllers: [CommandController, MachineCommandController],
  // 设置字段 controllers。
  providers: [CommandService, CommandGuard, MachineTokenGuard],
  // 设置字段 providers。
  // AI 侧「人确认 AI 建议」要复用 issue() 的全套保护(白名单/枚举/审计/MQTT),
  // 所以把 Service 导出给 AiModule;Guard 不导出,确认端点按类引用即可。
  exports: [CommandService],
  // 设置字段 exports。
})
// 继续当前表达式；这一行的值由外层代码块或调用使用。
export class CommandModule {}
// 声明 CommandModule 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
