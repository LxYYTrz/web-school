import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

// 控制指令权限守卫:level >= 2 才能下发(对齐用户决策 2026-10-15)
// 依赖 AuthGuard:AuthGuard 先保证 session.username + level 存在,本守卫只校验级别。
@Injectable()
export class CommandGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const level = req.session?.level;
    if (typeof level !== 'number' || level < 2) {
      throw new ForbiddenException({ code: 403, msg: '需 level >= 2 才能下发控制指令' });
    }
    return true;
  }
}