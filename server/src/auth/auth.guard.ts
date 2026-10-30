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
  // 1. NestJS 在受保护接口之前调用这个守卫，context 描述当前请求处理上下文。
  // 2. switchToHttp().getRequest() 取得当前 HTTP 请求，再读取中间件处理后的 session。
  // 3. 检查的是会话里已有的用户名和数字级别，不会在每个请求重新验证密码。
  // 4. 不满足抛 401；满足后交给后续守卫或业务方法，控制门槛还需 CommandGuard。
  // 【入口 AuthGuard.canActivate：部分 / 作用】
  // 部分 | 作用
  // context | NestJS 提供的当前请求执行上下文。
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
  }
}
