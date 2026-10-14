import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { SessionUser } from './session-user';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 登录:成功后把 username/level 写入 cookie-session
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.verifyCredentials(dto.username, dto.password);
    req.session = { username: user.username, level: user.level, loginAt: Date.now() };
    return { success: true, username: user.username, level: user.level };
  }

  // 登出:清空 session 字段;AuthGuard 下次因 username 缺失拒绝访问
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request) {
    if (req.session) {
      delete req.session.username;
      delete req.session.level;
      delete req.session.loginAt;
    }
    return { success: true };
  }

  // 当前用户:前端启动时调一次,401 即未登录
  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: SessionUser) {
    return { username: user.username, level: user.level };
  }
}
