/**
 // 这一段负责配置和实现 server/src/command/command.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { IngestModule } from '../ingest/ingest.module';
// 从 ../ingest/ingest.module 导入这一行列出的符号，供本文件调用。
// IngestModule：从 ../ingest/ingest.module 导入的对象，用于本文件的调用或类型约束
import { CommandController } from './command.controller';
// 从 ./command.controller 导入这一行列出的符号，供本文件调用。
// CommandController：从 ./command.controller 导入的对象，用于本文件的调用或类型约束
import { MachineCommandController } from './machine-command.controller';
// 从 ./machine-command.controller 导入这一行列出的符号，供本文件调用。
// MachineCommandController：从 ./machine-command.controller 导入的对象，用于本文件的调用或类型约束
import { CommandService } from './command.service';
// 从 ./command.service 导入这一行列出的符号，供本文件调用。
// CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
import { CommandGuard } from './command.guard';
// 从 ./command.guard 导入这一行列出的符号，供本文件调用。
// CommandGuard：后端控制权限守卫，限制可下发指令的操作级别
import { MachineTokenGuard } from './machine-token.guard';
// 从 ./machine-token.guard 导入这一行列出的符号，供本文件调用。
// MachineTokenGuard：后端机器通道令牌守卫

// 控制模块：指令下发
// 这一段声明 CommandModule，用于CommandModule 的相关数据和行为。
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
  // 引入入口模块，获得 MQTT 发布能力
  imports: [IngestModule],
  // 声明或设置 imports，用于当前对象或接口的对应数据。
  // IngestModule：从 ../ingest/ingest.module 导入的对象，用于本文件的调用或类型约束
  // 对外暴露 HTTP 接口
  //   CommandController        —— 浏览器(session + level>=2)
  //   MachineCommandController —— 机器(x-machine-token),演示阶段给飞书 AI 直控用
  controllers: [CommandController, MachineCommandController],
  // 声明或设置 controllers，用于当前对象或接口的对应数据。
  // CommandController：从 ./command.controller 导入的对象，用于本文件的调用或类型约束；MachineCommandController：从 ./machine-command.controller 导入的对象，用于本文件的调用或类型约束
  providers: [CommandService, CommandGuard, MachineTokenGuard],
  // 声明或设置 providers，用于当前对象或接口的对应数据。
  // CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发；CommandGuard：后端控制权限守卫，限制可下发指令的操作级别；MachineTokenGuard：后端机器通道令牌守卫
  // AI 侧「人确认 AI 建议」要复用 issue() 的全套保护(白名单/枚举/审计/MQTT),
  // 所以把 Service 导出给 AiModule;Guard 不导出,确认端点按类引用即可。
  exports: [CommandService],
  // 声明或设置 exports，用于当前对象或接口的对应数据。
  // CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
})
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 本行完成上面一层已说明的函数、分支或对象配置
export class CommandModule {}
// 定义 CommandModule，约束或实现本模块涉及的数据和行为。
// CommandModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/command/command.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 CommandModule 的字段或服务能力，供项目其他模块使用。
