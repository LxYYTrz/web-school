/**
 * 网页控制的级别守卫，通常排在 AuthGuard 后执行。
 * 从 req.session 取得 level，非数字或低于 2 返回 403；通过后还需命令服务检查目标、类型与参数。
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

// 控制指令权限守卫:level >= 2 才能下发(对齐用户决策 2026-10-15)
// 依赖 AuthGuard:AuthGuard 先保证 session.username + level 存在,本守卫只校验级别。
@Injectable()
export class CommandGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // 网页控制在通过登录守卫后，还需通过这里的级别检查。
    // level 取自 req.session；不是 number 或小于 2 时抛 403，通过后仍需 CommandService 检查设备、类型和参数。
    // 因此登录成功、页面按钮可用和一次指令真正通过后端业务检查，是三个需要分开理解的环节。

    const level = req.session?.level;
    if (typeof level !== 'number' || level < 2) {
      throw new ForbiddenException({ code: 403, msg: '需 level >= 2 才能下发控制指令' });
    }
    return true;
    // 布尔结果由当前函数的调用方用于决定是否允许继续执行
  }
}
