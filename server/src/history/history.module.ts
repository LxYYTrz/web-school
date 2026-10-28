/**
 * NestJS 的 历史与回执写入装配模块 HistoryModule，由 AppModule 引入。
 * 注册并导出 HistoryWriterService，供 MQTT 接入层分别调用入队、状态、事件和回执方法。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { HistoryWriterService } from './history-writer.service';

@Module({ providers: [HistoryWriterService], exports: [HistoryWriterService] })
export class HistoryModule {}
// HistoryModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
