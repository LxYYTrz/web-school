/**
 * ============================================================================
 * 文件作用：控制指令 REST 接口（HTTP 层）
 * 所属模块：server/src/command/
 * ============================================================================
 *
 * 【接口定义】
 *   方法：POST
 *   路径：/api/lines/{lineId}/commands
 *   完整：POST http://<后端>:3000/api/lines/line-01/commands
 *   Body：{ "deviceId":"plc-01", "type":"stop", "params":{} }
 *   返回：{ "ok":true, "cmdId":"uuid" } 或 { "ok":false, "error":"..." }
 *
 * 【控制器 vs 服务的职责划分（NestJS 通用套路）】
 *   Controller（控制器）只做三件事：
 *     ① 接收 HTTP 请求，提取路径参数 / 查询参数 / 请求体
 *     ② 调用 Service
 *     ③ 把 Service 的返回值交给 NestJS 序列化成 JSON
 *   所有业务逻辑（校验、落库、下发）都在 Service 里。
 *   好处：Service 可以被 WebSocket、定时任务、消息队列等其他入口复用。
 *
 * 【生产环境下的完整访问路径】
 *   浏览器 → 云服务器 Nginx（location /api/）
 *          → SSH 反向隧道 127.0.0.1:3300
 *          → 工控机 NestJS（本控制器）
 *          → 写本机 PG + publish MQTT（工控机本机）
 */
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandBody, CommandService } from './command.service';
// 从 ./command.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthGuard } from '../auth/auth.guard';
// 从 ../auth/auth.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandGuard } from './command.guard';
// 从 ./command.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CurrentUser } from '../auth/current-user.decorator';
// 从 ../auth/current-user.decorator 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * 控制指令控制器。
 */
@Controller('api/lines')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
export class CommandController {
// 声明 CommandController 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  constructor(private readonly commands: CommandService) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

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
  @Post(':lineId/commands')
  // 装饰器 Post：把方法绑定到 POST 路由。
  @UseGuards(AuthGuard, CommandGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  send(
  // 调用 send，把括号中的值作为参数传入。
    @Param('lineId') lineId: string,
    // 装饰器 Param：读取 URL 路径参数。
    @Body() body: CommandBody,
    // 装饰器 Body：读取请求体。
    @CurrentUser() user: SessionUser,
    // 装饰器 CurrentUser：给后面的类、方法或参数附加元数据。
  ) {
  // 继续当前表达式；这一行的值由外层代码块或调用使用。
    return this.commands.issue(lineId, body, user);
    // 返回 this.commands.issue(lineId, body, user) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
