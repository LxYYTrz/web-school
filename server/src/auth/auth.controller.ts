import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthService } from './auth.service';
// 从 ./auth.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthGuard } from './auth.guard';
// 从 ./auth.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CurrentUser } from './current-user.decorator';
// 从 ./current-user.decorator 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from './session-user';
// 从 ./session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { LoginDto } from './dto/login.dto';
// 从 ./dto/login.dto 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

@Controller('api/auth')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
export class AuthController {
// 声明 AuthController 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  constructor(private readonly auth: AuthService) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  // 登录:成功后把 username/level 写入 cookie-session
  @Post('login')
  // 装饰器 Post：把方法绑定到 POST 路由。
  @HttpCode(200)
  // 装饰器 HttpCode：给后面的类、方法或参数附加元数据。
  async login(@Body() dto: LoginDto, @Req() req: Request) {
  // 定义方法 login；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    const user = await this.auth.verifyCredentials(dto.username, dto.password);
    // 声明 user，初始值由 await this.auth.verifyCredentials(dto.username, dto.password) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
    req.session = { username: user.username, level: user.level, loginAt: Date.now() };
    // 把右侧表达式的结果写入 req.session。
    return { success: true, username: user.username, level: user.level };
    // 返回 { success: true, username: user.username, level: user.level } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。

  // 登出:清空 session 字段;AuthGuard 下次因 username 缺失拒绝访问
  @Post('logout')
  // 装饰器 Post：把方法绑定到 POST 路由。
  @HttpCode(200)
  // 装饰器 HttpCode：给后面的类、方法或参数附加元数据。
  async logout(@Req() req: Request) {
  // 定义方法 logout；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    if (req.session) {
    // 判断 if (req.session) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      delete req.session.username;
      // 继续当前表达式；这一行的值由外层代码块或调用使用。
      delete req.session.level;
      // 继续当前表达式；这一行的值由外层代码块或调用使用。
      delete req.session.loginAt;
      // 继续当前表达式；这一行的值由外层代码块或调用使用。
    }
    // 结束当前对象、函数或条件代码块。
    return { success: true };
    // 返回 { success: true } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。

  // 当前用户:前端启动时调一次,401 即未登录
  @Get('me')
  // 装饰器 Get：把方法绑定到 GET 路由。
  @UseGuards(AuthGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  me(@CurrentUser() user: SessionUser) {
  // 定义方法 me；括号中声明参数，花括号内实现逻辑。
    return { username: user.username, level: user.level };
    // 返回 { username: user.username, level: user.level } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
