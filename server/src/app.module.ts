import { Module } from '@nestjs/common';
import { InfraModule } from './infra/infra.module';
import { StateModule } from './state/state.module';
import { HistoryModule } from './history/history.module';
import { RealtimeModule } from './realtime/realtime.module';
import { IngestModule } from './ingest/ingest.module';
import { CommandModule } from './command/command.module';

@Module({
  imports: [InfraModule, StateModule, HistoryModule, RealtimeModule, IngestModule, CommandModule],
})
export class AppModule {}
