import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionUser } from './session-user';

// @CurrentUser() 注入当前登录用户;AuthGuard 已保证 session 存在
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return {
    username: req.session!.username as string,
    level: req.session!.level as number,
  };
});
