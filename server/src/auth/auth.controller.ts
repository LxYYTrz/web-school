// 这一段负责配置和实现 server/src/auth/auth.controller.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Body：NestJS 从请求体提取参数的装饰器；Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器；Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器；HttpCode：NestJS 设置 HTTP 响应状态码的装饰器；Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器；Req：NestJS 注入当前 HTTP 请求对象的装饰器；UseGuards：NestJS 在处理请求前应用权限守卫的装饰器
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。
// Request：从 express 导入的对象，用于本文件的调用或类型约束
import { AuthService } from './auth.service';
// 从 ./auth.service 导入这一行列出的符号，供本文件调用。
// AuthService：后端登录认证服务，查询用户并比对口令摘要
import { AuthGuard } from './auth.guard';
// 从 ./auth.guard 导入这一行列出的符号，供本文件调用。
// AuthGuard：后端登录守卫，检查会话中是否存在用户
import { CurrentUser } from './current-user.decorator';
// 从 ./current-user.decorator 导入这一行列出的符号，供本文件调用。
// CurrentUser：从 ./current-user.decorator 导入的对象，用于本文件的调用或类型约束
import type { SessionUser } from './session-user';
// 从 ./session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别
import { LoginDto } from './dto/login.dto';
// 从 ./dto/login.dto 导入这一行列出的符号，供本文件调用。
// LoginDto：从 ./dto/login.dto 导入的对象，用于本文件的调用或类型约束

// 这一段声明 AuthController，用于AuthController 的相关数据和行为。
@Controller('api/auth')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
// Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器
export class AuthController {
// 定义 AuthController，约束或实现本模块涉及的数据和行为。
// AuthController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  // 这一段定义 constructor，用于初始化 auth.controller 使用的实例状态和依赖。
  constructor(private readonly auth: AuthService) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // auth：Pinia 登录状态仓库实例；AuthService：后端登录认证服务，查询用户并比对口令摘要
  // 这一段提供了初始化 auth.controller 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 登录:成功后把 username/level 写入 cookie-session
  // 这一段定义 login，用于校验登录请求并将认证结果写入当前 Cookie 会话。

  // 这是 POST /api/auth/login 的后端入口，LoginDto 提供请求体中的用户名与密码。
  // 调用注入的 AuthService.verifyCredentials() 查询并验证账号，验证失败抛错，不进入下面的会话写入。
  // 验证通过才把 username、level、loginAt 放入 req.session，由 cookie-session 在响应中保存带签名的 Cookie。
  // req 是 Express 当前 HTTP 请求，dto 是 NestJS 从请求体解析的 LoginDto；这里的 auth 是后端 AuthService 实例。
  // 会话中的用户和级别取自验证结果，loginAt 是当前登录时间。后续 Guard 检查会话，而不是每次重新比对密码。

  @Post('login')
  // 装饰器 Post：把方法绑定到 POST 路由。
  // Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器
  @HttpCode(200)
  // 装饰器 HttpCode：给后面的类、方法或参数附加元数据。
  // HttpCode：NestJS 设置 HTTP 响应状态码的装饰器
  async login(@Body() dto: LoginDto, @Req() req: Request) {
  // 定义方法 login；括号中声明参数，花括号内实现逻辑。
  // login：校验登录请求并将认证结果写入当前 Cookie 会话；Body：NestJS 从请求体提取参数的装饰器；dto：当前方法接收的参数，类型为 LoginDto；LoginDto：从 ./dto/login.dto 导入的对象，用于本文件的调用或类型约束；Req：NestJS 注入当前 HTTP 请求对象的装饰器；req：当前 HTTP 请求对象；Request：从 express 导入的对象，用于本文件的调用或类型约束
    const user = await this.auth.verifyCredentials(dto.username, dto.password);
    // 先把本次登录请求的用户名和密码交给账号服务校验，校验通过后才继续写入会话。
    // dto 来自请求正文；auth 是 NestJS 注入的项目 AuthService；verifyCredentials 是项目方法，内部查询数据库并调用 bcrypt.compare；失败会抛出登录异常。

    // user 来自密码校验的返回结果，所以这里记录的是已验证身份，而不是请求正文任意提交的 level。
    // cookie-session 会把该对象放入客户端签名 Cookie；签名检查篡改，内容本身并未因此加密。

    req.session = { username: user.username, level: user.level, loginAt: Date.now() };
    // 把已验证的用户名、级别和登录时间写入本次请求的会话，交给 cookie-session 生成签名 Cookie。
    // user 来自上一步校验结果；req.session 由 cookie-session 中间件提供；loginAt 使用毫秒时间戳；这里没有把账号密码写入会话。
    return { success: true, username: user.username, level: user.level };
    // 向网页返回登录成功及已验证的用户名、级别，让网页继续更新显示或跳转。
    // 这是接口响应正文；签名 Cookie 由中间件通过响应头处理，返回这个对象本身不等于创建 Cookie。
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了校验登录请求并将认证结果写入当前 Cookie 会话的实现；实际结果由运行时输入和执行分支决定。

  // 登出:清空 session 字段;AuthGuard 下次因 username 缺失拒绝访问
  // 这一段定义 logout，用于清除当前请求的登录会话。

  // 退出接口删除当前会话中的 username、level、loginAt，后续请求就无法再满足 AuthGuard 的登录条件。
  // 这一步处理浏览器账号会话，不会向设备发停止动作，也不清理现场历史数据。

  @Post('logout')
  // 装饰器 Post：把方法绑定到 POST 路由。
  // Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器
  @HttpCode(200)
  // 装饰器 HttpCode：给后面的类、方法或参数附加元数据。
  // HttpCode：NestJS 设置 HTTP 响应状态码的装饰器
  async logout(@Req() req: Request) {
  // 定义方法 logout；括号中声明参数，花括号内实现逻辑。
  // logout：清除当前请求的登录会话；Req：NestJS 注入当前 HTTP 请求对象的装饰器；req：当前 HTTP 请求对象；Request：从 express 导入的对象，用于本文件的调用或类型约束
    if (req.session) {
    // 检查(req.session)，按判断结果进入对应的处理分支。
    // req：当前 HTTP 请求对象；session：HTTP 登录会话对象
      delete req.session.username;
      // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
      // req：当前 HTTP 请求对象；session：HTTP 登录会话对象；username：账号用户名
      delete req.session.level;
      // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
      // req：当前 HTTP 请求对象；session：HTTP 登录会话对象；level：用户操作级别或事件严重级别，依据当前接口结构区分
      delete req.session.loginAt;
      // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
      // req：当前 HTTP 请求对象；session：HTTP 登录会话对象；loginAt：req.session 对象上的字段或操作
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    return { success: true };
    // 把{ success: true }作为当前函数的结果返回。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了清除当前请求的登录会话的实现；实际结果由运行时输入和执行分支决定。

  // 当前用户:前端启动时调一次,401 即未登录
  // 这一段定义 me，用于返回当前会话中的登录用户信息。

  // 网页刷新或首次进入时请求 /api/auth/me，用它恢复当前登录用户与级别。
  // AuthGuard 先验证会话条件，CurrentUser 再取出会话信息返回；它不是通过 Redis 会话编号再次查询用户的实现。

  @Get('me')
  // 装饰器 Get：把方法绑定到 GET 路由。
  // Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器
  @UseGuards(AuthGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  // UseGuards：NestJS 在处理请求前应用权限守卫的装饰器；AuthGuard：后端登录守卫，检查会话中是否存在用户
  me(@CurrentUser() user: SessionUser) {
  // 定义方法 me；括号中声明参数，花括号内实现逻辑。
  // me：返回当前会话中的登录用户信息；CurrentUser：从 ./current-user.decorator 导入的对象，用于本文件的调用或类型约束；user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    return { username: user.username, level: user.level };
    // 把{ username: user.username, level: user.level }作为当前函数的结果返回。
    // username：账号用户名；user：当前会话或调用方的用户信息；level：用户操作级别或事件严重级别，依据当前接口结构区分
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了返回当前会话中的登录用户信息的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/auth/auth.controller.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 AuthController 的字段或服务能力，供项目其他模块使用。
