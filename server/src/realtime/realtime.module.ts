/**
 // 这一段负责配置和实现 server/src/realtime/realtime.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：实时模块（RealtimeModule）—— 装配 WebSocket 网关 + 快照接口
 * 所属模块：server/src/realtime/
 * ============================================================================
 *
 * 【宏观定位】本模块是"后端对外的实时出口"，包含两条对外通道：
 *   ① WebSocket（socket.io）：长连接推送实时数据 → TelemetryGateway
 *   ② REST 快照接口：一次性拉当前状态   → SnapshotController
 *
 * 【为什么网关和控制器放同一个模块】
 *   它们服务的都是同一个业务概念："给前端提供产线的实时视图"。
 *   NestJS 官方示例也把 Gateway 和 Controller 放一起（同一个 realtime 模块）。
 *
 * 【模块依赖】
 *   imports StateModule → 为了让 SnapshotController 能注入 LineStateService
 */
import { Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { StateModule } from '../state/state.module';
// 从 ../state/state.module 导入这一行列出的符号，供本文件调用。
// StateModule：从 ../state/state.module 导入的对象，用于本文件的调用或类型约束
import { TelemetryGateway } from './telemetry.gateway';
// 从 ./telemetry.gateway 导入这一行列出的符号，供本文件调用。
// TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据
import { SnapshotController } from './snapshot.controller';
// 从 ./snapshot.controller 导入这一行列出的符号，供本文件调用。
// SnapshotController：从 ./snapshot.controller 导入的对象，用于本文件的调用或类型约束

// 实时模块：WebSocket 推送 + REST 快照
// 这一段声明 RealtimeModule，用于RealtimeModule 的相关数据和行为。
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
  // 引入状态模块以获得 LineStateService 的注入能力
  imports: [StateModule],
  // 声明或设置 imports，用于当前对象或接口的对应数据。
  // StateModule：从 ../state/state.module 导入的对象，用于本文件的调用或类型约束
  // providers：WebSocket 网关（由 @WebSocketGateway 装饰的类）
  providers: [TelemetryGateway],
  // 声明或设置 providers，用于当前对象或接口的对应数据。
  // TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据
  // controllers：REST 控制器
  controllers: [SnapshotController],
  // 声明或设置 controllers，用于当前对象或接口的对应数据。
  // SnapshotController：从 ./snapshot.controller 导入的对象，用于本文件的调用或类型约束
  // exports：网关需要被 IngestModule 使用（广播数据）
  exports: [TelemetryGateway],
  // 声明或设置 exports，用于当前对象或接口的对应数据。
  // TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据
})
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 本行完成上面一层已说明的函数、分支或对象配置
export class RealtimeModule {}
// 定义 RealtimeModule，约束或实现本模块涉及的数据和行为。
// RealtimeModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/realtime/realtime.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 RealtimeModule 的字段或服务能力，供项目其他模块使用。
