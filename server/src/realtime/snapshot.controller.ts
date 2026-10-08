import { Controller, Get, Param } from '@nestjs/common';
import { LineStateService } from '../state/line-state.service';

// 产线快照:前端首屏/断线重连时一次性拉取当前状态(数据来自 Redis)
@Controller('api/lines')
export class SnapshotController {
  constructor(private readonly state: LineStateService) {}

  @Get(':lineId/snapshot')
  snapshot(@Param('lineId') lineId: string) {
    return this.state.getLineSnapshot(lineId);
  }
}
