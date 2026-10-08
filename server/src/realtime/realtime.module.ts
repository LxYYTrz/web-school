import { Module } from '@nestjs/common';
import { StateModule } from '../state/state.module';
import { TelemetryGateway } from './telemetry.gateway';
import { SnapshotController } from './snapshot.controller';

@Module({
  imports: [StateModule],
  providers: [TelemetryGateway],
  controllers: [SnapshotController],
  exports: [TelemetryGateway],
})
export class RealtimeModule {}
