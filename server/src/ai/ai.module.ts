// 这一段负责配置和实现 server/src/ai/ai.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { CommandModule } from '../command/command.module';
// 从 ../command/command.module 导入这一行列出的符号，供本文件调用。
// CommandModule：从 ../command/command.module 导入的对象，用于本文件的调用或类型约束
import { RealtimeModule } from '../realtime/realtime.module';
// 从 ../realtime/realtime.module 导入这一行列出的符号，供本文件调用。
// RealtimeModule：从 ../realtime/realtime.module 导入的对象，用于本文件的调用或类型约束
import { AiController } from './ai.controller';
// 从 ./ai.controller 导入这一行列出的符号，供本文件调用。
// AiController：从 ./ai.controller 导入的对象，用于本文件的调用或类型约束
import { AiService } from './ai.service';
// 从 ./ai.service 导入这一行列出的符号，供本文件调用。
// AiService：后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件
import { ProposalService } from './proposal.service';
// 从 ./proposal.service 导入这一行列出的符号，供本文件调用。
// ProposalService：后端 AI 建议服务，读取、校验并原子领取待确认建议

/**
 * PG_POOL / REDIS / CatalogService 由全局 InfraModule 提供,这里无需再 import。
 * RealtimeModule 提供 TelemetryGateway(推 ai_proposal);
 * CommandModule 提供 CommandService(确认建议时复用 issue())。
 */
// 这一段声明 AiModule，用于AiModule 的相关数据和行为。
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
  imports: [RealtimeModule, CommandModule],
  // 声明或设置 imports，用于当前对象或接口的对应数据。
  // RealtimeModule：从 ../realtime/realtime.module 导入的对象，用于本文件的调用或类型约束；CommandModule：从 ../command/command.module 导入的对象，用于本文件的调用或类型约束
  controllers: [AiController],
  // 声明或设置 controllers，用于当前对象或接口的对应数据。
  // AiController：从 ./ai.controller 导入的对象，用于本文件的调用或类型约束
  providers: [AiService, ProposalService],
  // 声明或设置 providers，用于当前对象或接口的对应数据。
  // AiService：后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件；ProposalService：后端 AI 建议服务，读取、校验并原子领取待确认建议
})
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 本行完成上面一层已说明的函数、分支或对象配置
export class AiModule {}
// 定义 AiModule，约束或实现本模块涉及的数据和行为。
// AiModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/ai/ai.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 AiModule 的字段或服务能力，供项目其他模块使用。
