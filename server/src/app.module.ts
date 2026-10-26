/**
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
// 1) 基础设施模块：PG 连接池、Redis、编码映射（全局模块）
import { InfraModule } from './infra/infra.module';
// 从 ./infra/infra.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
// 2) 状态模块：Redis 实时快照
import { StateModule } from './state/state.module';
// 从 ./state/state.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
// 3) 历史模块：TimescaleDB 落库
import { HistoryModule } from './history/history.module';
// 从 ./history/history.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
// 4) 实时模块：WebSocket 网关 + 快照 REST 接口
import { RealtimeModule } from './realtime/realtime.module';
// 从 ./realtime/realtime.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
// 5) 入口模块：MQTT 订阅与三路分发
import { IngestModule } from './ingest/ingest.module';
// 从 ./ingest/ingest.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
// 6) 控制模块：指令下发（白名单 + 审计）
import { CommandModule } from './command/command.module';
// 从 ./command/command.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthModule } from './auth/auth.module';
// 从 ./auth/auth.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { UsersModule } from './users/users.module';
// 从 ./users/users.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AiModule } from './ai/ai.module';
// 从 ./ai/ai.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * 根模块。
 * NestJS 启动时先加载本模块，再递归加载 imports 的子模块，
 * 逐个实例化 providers，最后触发 onModuleInit 生命周期钩子。
 */
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
  imports: [
  // 设置字段 imports。
    InfraModule,
    // 把变量 InfraModule 作为同名对象字段加入当前对象。
    StateModule,
    // 把变量 StateModule 作为同名对象字段加入当前对象。
    HistoryModule,
    // 把变量 HistoryModule 作为同名对象字段加入当前对象。
    RealtimeModule,
    // 把变量 RealtimeModule 作为同名对象字段加入当前对象。
    IngestModule,
    // 把变量 IngestModule 作为同名对象字段加入当前对象。
    CommandModule,
    // 把变量 CommandModule 作为同名对象字段加入当前对象。
    AuthModule,
    // 把变量 AuthModule 作为同名对象字段加入当前对象。
    UsersModule,
    // 把变量 UsersModule 作为同名对象字段加入当前对象。
    AiModule,
    // 把变量 AiModule 作为同名对象字段加入当前对象。
  ],
  // 结束当前数组，继续外层表达式。
})
// 继续当前表达式；这一行的值由外层代码块或调用使用。
export class AppModule {}
// 声明 AppModule 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
