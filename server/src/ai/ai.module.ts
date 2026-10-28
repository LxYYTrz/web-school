/**
 * NestJS 的 网页 AI 聊天和待确认建议装配模块 AiModule，由 AppModule 引入。
 * AiController、AiService、ProposalService；通过 CommandModule 与 RealtimeModule 接回命令和实时通知。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { CommandModule } from '../command/command.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ProposalService } from './proposal.service';

/**
 * PG_POOL / REDIS / CatalogService 由全局 InfraModule 提供,这里无需再 import。
 * RealtimeModule 提供 TelemetryGateway(推 ai_proposal);
 * CommandModule 提供 CommandService(确认建议时复用 issue())。
 */
@Module({
  imports: [RealtimeModule, CommandModule],
  controllers: [AiController],
  providers: [AiService, ProposalService],
})
export class AiModule {}
// AiModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
