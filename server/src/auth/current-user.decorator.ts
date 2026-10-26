import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from './session-user';
// 从 ./session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// @CurrentUser() 注入当前登录用户;AuthGuard 已保证 session 存在
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser => {
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量；unknown＝需检查后才能使用的类型。
  const req = ctx.switchToHttp().getRequest<Request>();
  // 声明 req，初始值由 ctx.switchToHttp().getRequest<Request>() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  return {
  // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    username: req.session!.username as string,
    // 设置字段 username。
    level: req.session!.level as number,
    // 设置字段 level。
  };
  // 结束当前对象或代码块，并完成这条语句。
});
// 结束当前回调或对象，并完成外层函数调用。
