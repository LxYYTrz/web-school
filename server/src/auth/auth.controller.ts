/**
 * 网页登录接口入口，前端 services/auth.ts 调用本文件的 login、me、logout。
 * login 先调用 AuthService 校验，再写 req.session 并返回用户；me 通过 AuthGuard 读取当前会话，logout 删除会话字段。
 * Cookie 的签名与发送由 main.ts 安装的 cookie-session 中间件处理，控制器不自行实现加密或 Redis 会话存储。
 */
import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { SessionUser } from './session-user';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
// AuthController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  constructor(private readonly auth: AuthService) {}

  // POST 登录请求从这里进入：先验证输入，成功后保存验证结果和登录时间到 req.session。
  // dto 是请求正文，auth 是注入的项目 AuthService；会话签名与 Cookie 响应头由 main.ts 的中间件处理。
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.verifyCredentials(dto.username, dto.password);
    // 先把本次登录请求的用户名和密码交给账号服务校验，校验通过后才继续写入会话。
    // dto 来自请求正文；auth 是 NestJS 注入的项目 AuthService；verifyCredentials 是项目方法，内部查询数据库并调用 bcrypt.compare；失败会抛出登录异常。

    // user 来自密码校验的返回结果，所以这里记录的是已验证身份，而不是请求正文任意提交的 level。
    // cookie-session 会把该对象放入客户端签名 Cookie；签名检查篡改，内容本身并未因此加密。

    req.session = { username: user.username, level: user.level, loginAt: Date.now() };
    // 把已验证的用户名、级别和登录时间写入本次请求的会话，交给 cookie-session 生成签名 Cookie。
    // user 来自上一步校验结果；req.session 由 cookie-session 中间件提供；loginAt 使用毫秒时间戳；这里没有把账号密码写入会话。
    return { success: true, username: user.username, level: user.level };
    // 向网页返回登录成功及已验证的用户名、级别，让网页继续更新显示或跳转。
    // 这是接口响应正文；签名 Cookie 由中间件通过响应头处理，返回这个对象本身不等于创建 Cookie。
  }

  // 退出删除当前会话的用户名、级别和登录时间；后续受保护请求再由守卫检查。
  // 这里只清理网页账号会话，不停止设备或清理现场历史。
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

  // 刷新页面时通过此接口读取已有会话用户；AuthGuard 先确认会话满足登录条件。
  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: SessionUser) {
    return { username: user.username, level: user.level };
  }
}
