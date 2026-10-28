/**
 * 提供 @CurrentUser 参数装饰器，从当前 HTTP 请求的 session 提取 SessionUser。
 * 由使用它的控制器接收用户；需要先由相应守卫检查会话，装饰器本身不验证密码或授予权限。
 */
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
