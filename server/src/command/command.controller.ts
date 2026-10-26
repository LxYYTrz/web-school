/**
 // 这一段负责配置和实现 server/src/command/command.controller.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Body：NestJS 从请求体提取参数的装饰器；Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器；Param：NestJS 从 URL 路径提取参数的装饰器；Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器；UseGuards：NestJS 在处理请求前应用权限守卫的装饰器
import { CommandBody, CommandService } from './command.service';
// 从 ./command.service 导入这一行列出的符号，供本文件调用。
// CommandBody：后端控制接口的请求体结构，包含设备编码、指令类型和参数；CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
import { AuthGuard } from '../auth/auth.guard';
// 从 ../auth/auth.guard 导入这一行列出的符号，供本文件调用。
// AuthGuard：后端登录守卫，检查会话中是否存在用户
import { CommandGuard } from './command.guard';
// 从 ./command.guard 导入这一行列出的符号，供本文件调用。
// CommandGuard：后端控制权限守卫，限制可下发指令的操作级别
import { CurrentUser } from '../auth/current-user.decorator';
// 从 ../auth/current-user.decorator 导入这一行列出的符号，供本文件调用。
// CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别

/**
 * 控制指令控制器。
 */
// 这一段声明 CommandController，用于CommandController 的相关数据和行为。
@Controller('api/lines')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
// Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器
export class CommandController {
// 定义 CommandController，约束或实现本模块涉及的数据和行为。
// CommandController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  // 这一段定义 constructor，用于初始化 command.controller 使用的实例状态和依赖。
  constructor(private readonly commands: CommandService) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // commands：当前方法接收的参数，类型为 CommandService；CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
  // 这一段提供了初始化 command.controller 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

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
  // 这一段定义 send，用于把浏览器控制请求交给指令服务校验和下发。
  @Post(':lineId/commands')
  // 装饰器 Post：把方法绑定到 POST 路由。
  // Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器
  @UseGuards(AuthGuard, CommandGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  // UseGuards：NestJS 在处理请求前应用权限守卫的装饰器；AuthGuard：后端登录守卫，检查会话中是否存在用户；CommandGuard：后端控制权限守卫，限制可下发指令的操作级别
  send(
  // 向连接对端发送本行构造的数据。
  // send：把浏览器控制请求交给指令服务校验和下发
    @Param('lineId') lineId: string,
    // 装饰器 Param：读取 URL 路径参数。
    // Param：NestJS 从 URL 路径提取参数的装饰器；lineId：产线标识，接口通常使用 line-01 等编码
    @Body() body: CommandBody,
    // 装饰器 Body：读取请求体。
    // Body：NestJS 从请求体提取参数的装饰器；body：当前 HTTP 请求或消息的正文；CommandBody：后端控制接口的请求体结构，包含设备编码、指令类型和参数
    @CurrentUser() user: SessionUser,
    // 装饰器 CurrentUser：给后面的类、方法或参数附加元数据。
    // CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束；user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
  ) {
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // 上方参数列表在此结束，下面开始方法的具体处理逻辑
    return this.commands.issue(lineId, body, user);
    // 把this.commands.issue(lineId, body, user)作为当前函数的结果返回。
    // commands：当前方法接收的参数，类型为 CommandService；issue：校验指令和目标设备，写入审计记录并经 MQTT 下发；lineId：产线标识，接口通常使用 line-01 等编码；body：当前 HTTP 请求或消息的正文；user：当前会话或调用方的用户信息
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把浏览器控制请求交给指令服务校验和下发的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/command/command.controller.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 CommandController 的字段或服务能力，供项目其他模块使用。
