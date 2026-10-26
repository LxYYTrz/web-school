import { Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandModule } from '../command/command.module';
// 从 ../command/command.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { RealtimeModule } from '../realtime/realtime.module';
// 从 ../realtime/realtime.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AiController } from './ai.controller';
// 从 ./ai.controller 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AiService } from './ai.service';
// 从 ./ai.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ProposalService } from './proposal.service';
// 从 ./proposal.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * PG_POOL / REDIS / CatalogService 由全局 InfraModule 提供,这里无需再 import。
 * RealtimeModule 提供 TelemetryGateway(推 ai_proposal);
 * CommandModule 提供 CommandService(确认建议时复用 issue())。
 */
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
  imports: [RealtimeModule, CommandModule],
  // 设置字段 imports。
  controllers: [AiController],
  // 设置字段 controllers。
  providers: [AiService, ProposalService],
  // 设置字段 providers。
})
// 继续当前表达式；这一行的值由外层代码块或调用使用。
export class AiModule {}
// 声明 AiModule 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
