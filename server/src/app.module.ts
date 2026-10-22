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
// 1) 基础设施模块：PG 连接池、Redis、编码映射（全局模块）
import { InfraModule } from './infra/infra.module';
// 2) 状态模块：Redis 实时快照
import { StateModule } from './state/state.module';
// 3) 历史模块：TimescaleDB 落库
import { HistoryModule } from './history/history.module';
// 4) 实时模块：WebSocket 网关 + 快照 REST 接口
import { RealtimeModule } from './realtime/realtime.module';
// 5) 入口模块：MQTT 订阅与三路分发
import { IngestModule } from './ingest/ingest.module';
// 6) 控制模块：指令下发（白名单 + 审计）
import { CommandModule } from './command/command.module';

/**
 * 根模块。
 * NestJS 启动时先加载本模块，再递归加载 imports 的子模块，
 * 逐个实例化 providers，最后触发 onModuleInit 生命周期钩子。
 */
@Module({
  // 把六个业务模块全部挂载进来 —— 这就是"本系统有哪些能力"的唯一声明处
  imports: [InfraModule, StateModule, HistoryModule, RealtimeModule, IngestModule, CommandModule],
})
export class AppModule {}
