/**
 * NestJS 的 Redis 最新快照装配模块 StateModule，由 AppModule 引入。
 * 注册并导出 LineStateService，供接入层写入、快照接口读取。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { LineStateService } from './line-state.service';

@Module({ providers: [LineStateService], exports: [LineStateService] })
export class StateModule {}
// StateModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
