/**
 // 这一段负责配置和实现 server/src/state/state.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { LineStateService } from './line-state.service';
// 从 ./line-state.service 导入这一行列出的符号，供本文件调用。
// LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis

// 这一段声明 StateModule，用于StateModule 的相关数据和行为。
@Module({ providers: [LineStateService], exports: [LineStateService] })
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器；LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis
export class StateModule {}
// 定义 StateModule，约束或实现本模块涉及的数据和行为。
// StateModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/state/state.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 StateModule 的字段或服务能力，供项目其他模块使用。
