import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBody, CommandService } from './command.service';
import { AuthGuard } from '../auth/auth.guard';
import { CommandGuard } from './command.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/session-user';

@Controller('api/lines')
export class CommandController {
  constructor(private readonly commands: CommandService) {}

  // 鉴权链:
  //   AuthGuard 先保证 session 有 username + level,
  //   CommandGuard 再校验 level >= 2。
  // operator 取自 session(契约 §5 第 2 条),前端不得在 body 传 username。
  @Post(':lineId/commands')
  @UseGuards(AuthGuard, CommandGuard)
  send(
    @Param('lineId') lineId: string,
    @Body() body: CommandBody,
    @CurrentUser() user: SessionUser,
  ) {
    return this.commands.issue(lineId, body, user);
  }
}