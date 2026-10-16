import { Module } from '@nestjs/common';
import { InfraModule } from './infra/infra.module';
import { StateModule } from './state/state.module';
import { HistoryModule } from './history/history.module';
import { RealtimeModule } from './realtime/realtime.module';
import { IngestModule } from './ingest/ingest.module';
import { CommandModule } from './command/command.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';
import { VisionModule } from './vision/vision.module';

@Module({
  imports: [
    InfraModule,
    StateModule,
    HistoryModule,
    RealtimeModule,
    IngestModule,
    CommandModule,
    AuthModule,
    UsersModule,
    AiModule,
    VisionModule,
  ],
})
export class AppModule {}
