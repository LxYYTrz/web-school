import { Module } from '@nestjs/common';
import { LineStateService } from './line-state.service';

@Module({ providers: [LineStateService], exports: [LineStateService] })
export class StateModule {}
