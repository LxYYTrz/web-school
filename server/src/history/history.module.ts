import { Module } from '@nestjs/common';
import { HistoryWriterService } from './history-writer.service';

@Module({ providers: [HistoryWriterService], exports: [HistoryWriterService] })
export class HistoryModule {}
