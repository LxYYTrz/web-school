import { Body, Controller, Param, Post } from '@nestjs/common';
import { CommandBody, CommandService } from './command.service';

@Controller('api/lines')
export class CommandController {
  constructor(private readonly commands: CommandService) {}

  // TODO(安全):当前无鉴权,仅供联调!第 4 步必须接入:JWT 登录态 +
  // 角色权限(api:command:execute)+ user_line_scope 产线数据权限
  @Post(':lineId/commands')
  send(@Param('lineId') lineId: string, @Body() body: CommandBody) {
    return this.commands.issue(lineId, body);
  }
}
