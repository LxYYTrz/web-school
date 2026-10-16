import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { VisionController } from './vision.controller';
import { VisionCleanupService } from './cleanup.service';
import { VisionService } from './vision.service';

// 视觉图片链路(契约 §4):
// 视觉机 --HTTP POST--> VisionController --VisionService--> 本地文件系统 + vision_images
//                                  └--> TelemetryGateway.broadcastVision --> 前端 VisionView
@Module({
  imports: [RealtimeModule],
  controllers: [VisionController],
  providers: [VisionService, VisionCleanupService],
  exports: [VisionService],
})
export class VisionModule {}
