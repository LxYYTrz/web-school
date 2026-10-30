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
  // 1. 控制入口先通过登录守卫，再在这里检查 req.session.level。
  // 2. level 不是数字或低于 2 就返回权限不足；达到门槛只允许继续进入命令业务检查。
  // 3. 例如 level=2 通过此层，仍可能因为设备不存在、类型不允许或参数错误被后续拒绝。
  // 【入口 CommandGuard.canActivate：部分 / 作用】
  // 部分 | 作用
  // context | NestJS 提供的当前请求执行上下文。
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
  }
}
