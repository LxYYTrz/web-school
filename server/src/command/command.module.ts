import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';

@Module({
  imports: [IngestModule],
  controllers: [CommandController],
  providers: [CommandService],
})
export class CommandModule {}
