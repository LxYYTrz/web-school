/**
 * 后端根模块，由 main.ts 交给 NestFactory 装配。
 * imports 汇集基础连接、快照、历史、实时、MQTT、命令、登录、用户与 AI 模块；具体业务在各模块的 Controller/Service 中。
 * 模块声明描述依赖关系；收到 HTTP、MQTT 或实时事件后才进入各自处理入口。
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
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';

/**
 * 根模块。
 * NestJS 启动时先加载本模块，再递归加载 imports 的子模块，
 * 逐个实例化 providers，最后触发 onModuleInit 生命周期钩子。
 */
@Module({

  // AppModule 的 imports 告诉 NestJS 要装配哪些功能模块，根模块本身不逐帧解析遥测或直接写 PLC。
  // Auth、Users 提供身份与账号，Ingest 接 MQTT，State、History 处理快照与历史，Realtime 推送，Command 处理指令，Ai 接网页助手。
  // 功能模块中的 Controller 接收入口请求，Service 完成具体业务；模块依赖与注入配置让它们取得需要的服务实例。

  imports: [
  // 1. imports 是 NestJS 模块元数据，列出根模块需要装配的功能模块。
  // 2. InfraModule 提供连接与目录；State/History/Realtime/Ingest 分别承接快照、历史、推送和 MQTT。
  // 3. Command、Auth、Users、Ai 提供控制、登录、账号管理与聊天入口。
  // 4. 这份列表描述依赖装配，不是一次请求顺序经过所有模块的流水线。
    InfraModule,
    StateModule,
    HistoryModule,
    RealtimeModule,
    IngestModule,
    CommandModule,
    AuthModule,
    UsersModule,
    AiModule,
  ],
})
export class AppModule {}
// AppModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
