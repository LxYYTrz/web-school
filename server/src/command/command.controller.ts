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
 *   Body：{ "deviceId":"plc-01", "type":"reset", "params":{}, "operator":"admin" }
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
 *          → 写 PG（经 SSH 正向隧道连云数据库）+ publish MQTT（工控机本机）
 */

import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBody, CommandService } from './command.service';

/**
 * 控制指令控制器。
 */
@Controller('api/lines') // 路由前缀：/api/lines
export class CommandController {
  /**
   * 构造函数：注入指令服务（由同模块的 providers 提供）
   */
  constructor(private readonly commands: CommandService) {}

  // TODO(安全):当前无鉴权,仅供联调!第 4 步必须接入:JWT 登录态 +
  // 角色权限(api:command:execute)+ user_line_scope 产线数据权限
  /**
   * POST /api/lines/:lineId/commands —— 下发一条控制指令。
   *
   * @Param('lineId') 取路径参数，例：/api/lines/line-01/commands → 'line-01'
   * @Body()        取请求体 JSON，自动反序列化成 CommandBody 对象
   *
   * 直接 return 服务的结果，NestJS 自动转 JSON。
   */
  @Post(':lineId/commands')
  send(@Param('lineId') lineId: string, @Body() body: CommandBody) {
    return this.commands.issue(lineId, body);
  }
}
