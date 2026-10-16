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
