import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { CommandGuard } from './command.guard';

@Module({
  imports: [IngestModule],
  controllers: [CommandController],
  providers: [CommandService, CommandGuard],
  // AI 侧「人确认 AI 建议」要复用 issue() 的全套保护(白名单/枚举/审计/MQTT),
  // 所以把 Service 导出给 AiModule;Guard 不导出,确认端点按类引用即可。
  exports: [CommandService],
})
export class CommandModule {}