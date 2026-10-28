/**
 * NestJS 的 网页及机器通道控制装配模块 CommandModule，由 AppModule 引入。
 * 两个控制器、CommandService 及两种控制守卫；导入 IngestModule 以发布 MQTT，导出命令服务供 AI 确认复用。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { CommandController } from './command.controller';
import { MachineCommandController } from './machine-command.controller';
import { CommandService } from './command.service';
import { CommandGuard } from './command.guard';
import { MachineTokenGuard } from './machine-token.guard';

// 控制模块：指令下发
@Module({
  // 引入入口模块，获得 MQTT 发布能力
  imports: [IngestModule],
  // 对外暴露 HTTP 接口
  //   CommandController        —— 浏览器(session + level>=2)
  //   MachineCommandController —— 机器(x-machine-token),演示阶段给飞书 AI 直控用
  controllers: [CommandController, MachineCommandController],
  providers: [CommandService, CommandGuard, MachineTokenGuard],
  // AI 侧「人确认 AI 建议」要复用 issue() 的全套保护(白名单/枚举/审计/MQTT),
  // 所以把 Service 导出给 AiModule;Guard 不导出,确认端点按类引用即可。
  exports: [CommandService],
})
export class CommandModule {}
// CommandModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
