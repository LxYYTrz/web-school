/**
 * ============================================================================
 * 文件作用：状态模块（StateModule）—— 装配 LineStateService
 * 所属模块：server/src/state/
 * ============================================================================
 *
 * 【宏观定位】很薄的一层「包装」，只做一件事：告诉 NestJS
 *   "本模块提供一个叫 LineStateService 的服务"。
 *
 * 【为什么还需要模块？】
 *   NestJS 的原则是「一切皆模块」。即使只有一个服务的目录，也要包成模块，
 *   这样别的模块想用它时，imports: [StateModule] 即可（模块级依赖边界）。
 *   providers 声明「本模块提供什么」，exports 声明「我愿意把这些给别人用」。
 *
 * 【谁在用它】
 *   - ingest/mqtt-ingest.service.ts ：写入快照
 *   - realtime/snapshot.controller.ts：读取快照（REST 首屏）
 *   - realtime/realtime.module.ts    ：imports 本模块以获得注入能力
 */

import { Module } from '@nestjs/common';
import { LineStateService } from './line-state.service';

// 状态模块：提供 Redis 实时快照能力
@Module({
  // providers：本模块内部可用的服务
  providers: [LineStateService],
  // exports：开放给外部（ingest / realtime 消费）
  exports: [LineStateService],
})
export class StateModule {}
