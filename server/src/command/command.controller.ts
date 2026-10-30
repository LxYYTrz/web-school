/**
 * 网页 HTTP 控制入口：POST /api/lines/:lineId/commands。
 * AuthGuard 检查会话，CommandGuard 检查级别；控制器取路径、正文和会话用户后交给 CommandService.issue。
 * 入口接收业务指令而非 Modbus 地址，设备点位由采集器的分发表与 CSV 点表决定。
 */
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBody, CommandService } from './command.service';
import { AuthGuard } from '../auth/auth.guard';
import { CommandGuard } from './command.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session-user';

/**
 * 控制指令控制器。
 */
@Controller('api/lines')
export class CommandController {
// CommandController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  constructor(private readonly commands: CommandService) {}

  // 鉴权链:
  //   AuthGuard 先保证 session 有 username + level,
  //   CommandGuard 再校验 level >= 2。
  // operator 取自 session(契约 §5 第 2 条),前端不得在 body 传 username。
  /**
   * POST /api/lines/:lineId/commands —— 下发一条控制指令。
   *
   * @Param('lineId') 取路径参数，例：/api/lines/line-01/commands → 'line-01'
   * @Body()        取请求体 JSON，自动反序列化成 CommandBody 对象
   *
   * 直接 return 服务的结果，NestJS 自动转 JSON。
   */

  // 前端控制请求进入 POST /api/lines/:lineId/commands，先依次通过 AuthGuard 和 CommandGuard。
  // Param 提取路径中的产线编码，Body 提取设备、类型和参数，CurrentUser 从会话取已登录操作者。
  // 控制器将这些信息交给 CommandService.issue()，自己不直接访问 PLC；权限通过不代表设备立即动作。

  // 【入口 CommandController.send：部分 / 作用】
  // 部分 | 作用
  // lineId | 产线业务编码，例如 line-01；供接口、消息主题或快照 key 使用。
  // body | 当前请求正文或流对象；具体字段依函数签名与调用方。
  // user | 当前入口取得的用户身份载体。
  @Post(':lineId/commands')
  @UseGuards(AuthGuard, CommandGuard)
  send(
  // 向连接对端发送本行构造的数据。
    @Param('lineId') lineId: string,
    @Body() body: CommandBody,
    @CurrentUser() user: SessionUser,
  ) {
  // 上方参数列表在此结束，下面开始方法的具体处理逻辑
    return this.commands.issue(lineId, body, user);
    // 1. commands 是注入的项目 CommandService；issue 是它的业务方法，不是 NestJS 自动写 PLC 的功能。
    // 2. lineId 从路径取得产线编码，body 从 JSON 取得设备/类型/参数，user 从已检查会话取得操作者。
    // 3. 前面两个守卫先检查登录与级别，进入 issue 后仍检查类型、目录编号和参数。
    // 4. 返回值交给 NestJS 生成 HTTP 响应，MQTT 现场处理与后续业务回执继续独立进行。
  }
}
