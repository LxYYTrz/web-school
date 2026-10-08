import { Module } from '@nestjs/common';
import { StateModule } from '../state/state.module';
import { HistoryModule } from '../history/history.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MqttIngestService } from './mqtt-ingest.service';

@Module({
  imports: [StateModule, HistoryModule, RealtimeModule],
  providers: [MqttIngestService],
  exports: [MqttIngestService],
})
export class IngestModule {}
