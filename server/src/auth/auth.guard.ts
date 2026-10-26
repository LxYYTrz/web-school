import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 路由守卫:已登录(username + level 都在 session 上)放行;否则 401
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class AuthGuard implements CanActivate {
// 声明 AuthGuard 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  canActivate(context: ExecutionContext): boolean {
  // 定义方法 canActivate；括号中声明参数，花括号内实现逻辑。
    const req = context.switchToHttp().getRequest<Request>();
    // 声明 req，初始值由 context.switchToHttp().getRequest<Request>() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    const session = req.session;
    // 声明 session，初始值由 req.session 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (!session || !session.username || typeof session.level !== 'number') {
    // 判断 if (!session || !session.username || typeof session.level !== 'number') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型。
      throw new UnauthorizedException({ code: 401, msg: '未登录' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    return true;
    // 返回 true 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
