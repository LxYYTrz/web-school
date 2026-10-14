import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

// 路由守卫:已登录(username + level 都在 session 上)放行;否则 401
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const session = req.session;
    if (!session || !session.username || typeof session.level !== 'number') {
      throw new UnauthorizedException({ code: 401, msg: '未登录' });
    }
    return true;
  }
}
