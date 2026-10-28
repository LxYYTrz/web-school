/**
 * 受保护 HTTP 接口的会话检查入口，由 NestJS 在业务方法之前调用 canActivate。
 * 会话由 cookie-session 处理；这里检查 username 和数字 level，不重新查询账号密码。
 * 失败返回 401；控制操作的最低级别由 command/command.guard.ts 继续检查。
 */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

// 路由守卫:已登录(username + level 都在 session 上)放行;否则 401
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // AuthGuard 从当前 HTTP 请求读取已经由 cookie-session 处理的会话。
    // 要求会话存在、用户名非空且 level 为 number；不满足时抛 401，满足后才允许进入后续守卫或接口。
    // 这里检查会话条件，不重新查询账号密码；控制操作需要的 level 门槛由 CommandGuard 继续检查。

    const session = req.session;
    if (!session || !session.username || typeof session.level !== 'number') {
      throw new UnauthorizedException({ code: 401, msg: '未登录' });
    }
    return true;
    // 布尔结果由当前函数的调用方用于决定是否允许继续执行
  }
}
