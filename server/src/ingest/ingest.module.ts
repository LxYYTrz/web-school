/**
 * NestJS 的 MQTT 接入和指令发布装配模块 IngestModule，由 AppModule 引入。
 * 导入 State、History、Realtime 模块，注册并导出 MqttIngestService。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { StateModule } from '../state/state.module';
import { HistoryModule } from '../history/history.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MqttIngestService } from './mqtt-ingest.service';

// 入口模块：MQTT 订阅 + 三路分发
@Module({
  // 引入三个下游模块，才能注入它们导出的服务
  imports: [StateModule, HistoryModule, RealtimeModule],
  // 本模块提供的服务：MQTT 消费者
  providers: [MqttIngestService],
  // 开放给 CommandModule（控制指令要通过它 publish 到 MQTT）
  exports: [MqttIngestService],
})
export class IngestModule {}
// IngestModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
