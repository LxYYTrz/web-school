import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 控制指令权限守卫:level >= 2 才能下发(对齐用户决策 2026-10-15)
// 依赖 AuthGuard:AuthGuard 先保证 session.username + level 存在,本守卫只校验级别。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class CommandGuard implements CanActivate {
// 声明 CommandGuard 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  canActivate(context: ExecutionContext): boolean {
  // 定义方法 canActivate；括号中声明参数，花括号内实现逻辑。
    const req = context.switchToHttp().getRequest<Request>();
    // 声明 req，初始值由 context.switchToHttp().getRequest<Request>() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    const level = req.session?.level;
    // 声明 level，初始值由 req.session?.level 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (typeof level !== 'number' || level < 2) {
    // 判断 if (typeof level !== 'number' || level < 2) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型。
      throw new ForbiddenException({ code: 403, msg: '需 level >= 2 才能下发控制指令' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    return true;
    // 返回 true 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。