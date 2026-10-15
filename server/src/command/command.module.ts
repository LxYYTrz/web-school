import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { CommandGuard } from './command.guard';

@Module({
  imports: [IngestModule],
  controllers: [CommandController],
  providers: [CommandService, CommandGuard],
})
export class CommandModule {}