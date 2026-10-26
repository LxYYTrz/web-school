/**
 // 这一段负责配置和实现 server/src/app.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：根模块（Root Module）—— 系统的模块装配清单
 * 所属模块：server/src/
 * ============================================================================
 *
 * 【宏观定位】NestJS 的「目录索引」。它本身不含业务逻辑，只做一件事：
 *   声明「本系统由哪些能力模块构成」，并把它们注册进 DI 容器。
 *
 * 【NestJS 模块机制小知识（看懂本文件必需）】
 *   - 一个 Module 是一个「依赖边界」。Module 里可以声明三类东西：
 *       providers  ：本模块内部可用的服务类（Service）
 *       controllers：本模块对外暴露的 HTTP 路由（Controller）
 *       imports    ：引入别的模块，从而「使用」别人的 exports
 *       exports    ：把本模块的 providers 开放给外部使用
 *   - 一个模块要用另一个模块的 Service，必须：(a) 对方 export 了它；
 *     (b) 本方 imports 了对方模块。这就是 NestJS 的依赖注入（DI）机制，
 *     也是本项目能「MQTT 消费 → 三路分发」而不出现循环调用的原因。
 *
 * 【本系统的六个模块（按数据流顺序理解）】
 *
 *   1. InfraModule（基础设施，全局）
 *      └─ PG 连接池 / Redis 客户端 / 编码映射缓存 CatalogService
 *      └─ 标了 @Global()，只需在根模块 import 一次，全项目任意模块都能注入
 *
 *   2. StateModule（实时快照）
 *      └─ LineStateService：把最新一帧写进 Redis，供前端首屏/断线重连读取
 *
 *   3. HistoryModule（历史落库）
 *      └─ HistoryWriterService：机器人帧 1 秒批量写 TimescaleDB；状态/事件即时写
 *
 *   4. RealtimeModule（实时推送 + 快照查询）
 *      └─ TelemetryGateway：socket.io 网关，按产线分房间广播
 *      └─ SnapshotController：REST 快照接口 GET /api/lines/:lineId/snapshot
 *
 *   5. IngestModule（数据入口）
 *      └─ MqttIngestService：订阅 MQTT → 解析 → 往 2/3/4 三路分发
 *      └─ 它是整个上行数据流的「总入口」，是数据流理解的中心
 *
 *   6. CommandModule（下行控制）
 *      └─ CommandController + CommandService：白名单指令 → 落审计 → MQTT 下发
 *
 * 【装配顺序说明】imports 数组的书写顺序不影响运行（NestJS 会自行解析依赖图），
 *   但为了阅读时能顺着数据流走，这里按「基础设施 → 存储 → 推送 → 入口 → 控制」排列。
 */
// 引入 NestJS 的模块装饰器：@Module({...}) 声明一个模块
import { Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
// 1) 基础设施模块：PG 连接池、Redis、编码映射（全局模块）
import { InfraModule } from './infra/infra.module';
// 从 ./infra/infra.module 导入这一行列出的符号，供本文件调用。
// InfraModule：从 ./infra/infra.module 导入的对象，用于本文件的调用或类型约束
// 2) 状态模块：Redis 实时快照
import { StateModule } from './state/state.module';
// 从 ./state/state.module 导入这一行列出的符号，供本文件调用。
// StateModule：从 ./state/state.module 导入的对象，用于本文件的调用或类型约束
// 3) 历史模块：TimescaleDB 落库
import { HistoryModule } from './history/history.module';
// 从 ./history/history.module 导入这一行列出的符号，供本文件调用。
// HistoryModule：从 ./history/history.module 导入的对象，用于本文件的调用或类型约束
// 4) 实时模块：WebSocket 网关 + 快照 REST 接口
import { RealtimeModule } from './realtime/realtime.module';
// 从 ./realtime/realtime.module 导入这一行列出的符号，供本文件调用。
// RealtimeModule：从 ./realtime/realtime.module 导入的对象，用于本文件的调用或类型约束
// 5) 入口模块：MQTT 订阅与三路分发
import { IngestModule } from './ingest/ingest.module';
// 从 ./ingest/ingest.module 导入这一行列出的符号，供本文件调用。
// IngestModule：从 ./ingest/ingest.module 导入的对象，用于本文件的调用或类型约束
// 6) 控制模块：指令下发（白名单 + 审计）
import { CommandModule } from './command/command.module';
// 从 ./command/command.module 导入这一行列出的符号，供本文件调用。
// CommandModule：从 ./command/command.module 导入的对象，用于本文件的调用或类型约束
import { AuthModule } from './auth/auth.module';
// 从 ./auth/auth.module 导入这一行列出的符号，供本文件调用。
// AuthModule：从 ./auth/auth.module 导入的对象，用于本文件的调用或类型约束
import { UsersModule } from './users/users.module';
// 从 ./users/users.module 导入这一行列出的符号，供本文件调用。
// UsersModule：从 ./users/users.module 导入的对象，用于本文件的调用或类型约束
import { AiModule } from './ai/ai.module';
// 从 ./ai/ai.module 导入这一行列出的符号，供本文件调用。
// AiModule：从 ./ai/ai.module 导入的对象，用于本文件的调用或类型约束

/**
 * 根模块。
 * NestJS 启动时先加载本模块，再递归加载 imports 的子模块，
 * 逐个实例化 providers，最后触发 onModuleInit 生命周期钩子。
 */
// 这一段声明 AppModule，用于AppModule 的相关数据和行为。
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
  imports: [
  // 声明或设置 imports，用于当前对象或接口的对应数据。
  // imports 是此处声明的字段，类型或取值约束为 [
    InfraModule,
    // 把变量 InfraModule 作为同名对象字段加入当前对象。
    // InfraModule：从 ./infra/infra.module 导入的对象，用于本文件的调用或类型约束
    StateModule,
    // 把变量 StateModule 作为同名对象字段加入当前对象。
    // StateModule：从 ./state/state.module 导入的对象，用于本文件的调用或类型约束
    HistoryModule,
    // 把变量 HistoryModule 作为同名对象字段加入当前对象。
    // HistoryModule：从 ./history/history.module 导入的对象，用于本文件的调用或类型约束
    RealtimeModule,
    // 把变量 RealtimeModule 作为同名对象字段加入当前对象。
    // RealtimeModule：从 ./realtime/realtime.module 导入的对象，用于本文件的调用或类型约束
    IngestModule,
    // 把变量 IngestModule 作为同名对象字段加入当前对象。
    // IngestModule：从 ./ingest/ingest.module 导入的对象，用于本文件的调用或类型约束
    CommandModule,
    // 把变量 CommandModule 作为同名对象字段加入当前对象。
    // CommandModule：从 ./command/command.module 导入的对象，用于本文件的调用或类型约束
    AuthModule,
    // 把变量 AuthModule 作为同名对象字段加入当前对象。
    // AuthModule：从 ./auth/auth.module 导入的对象，用于本文件的调用或类型约束
    UsersModule,
    // 把变量 UsersModule 作为同名对象字段加入当前对象。
    // UsersModule：从 ./users/users.module 导入的对象，用于本文件的调用或类型约束
    AiModule,
    // 把变量 AiModule 作为同名对象字段加入当前对象。
    // AiModule：从 ./ai/ai.module 导入的对象，用于本文件的调用或类型约束
  ],
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 此处结束当前数组参数，各元素保持上方列出的顺序
})
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 本行完成上面一层已说明的函数、分支或对象配置
export class AppModule {}
// 定义 AppModule，约束或实现本模块涉及的数据和行为。
// AppModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/app.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 AppModule 的字段或服务能力，供项目其他模块使用。
