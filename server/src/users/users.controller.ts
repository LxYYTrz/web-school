import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthGuard } from '../auth/auth.guard';
// 从 ../auth/auth.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CurrentUser } from '../auth/current-user.decorator';
// 从 ../auth/current-user.decorator 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CreateUserDto } from './dto/create-user.dto';
// 从 ./dto/create-user.dto 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { UpdateUserDto } from './dto/update-user.dto';
// 从 ./dto/update-user.dto 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { UsersService } from './users.service';
// 从 ./users.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

@Controller('api/users')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
@UseGuards(AuthGuard)
// 装饰器 UseGuards：执行路由前先应用权限守卫。
export class UsersController {
// 声明 UsersController 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  constructor(private readonly users: UsersService) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  @Get()
  // 装饰器 Get：把方法绑定到 GET 路由。
  list(@CurrentUser() me: SessionUser) {
  // 定义方法 list；括号中声明参数，花括号内实现逻辑。
    return this.users.list(me);
    // 返回 this.users.list(me) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  @Post()
  // 装饰器 Post：把方法绑定到 POST 路由。
  create(@CurrentUser() me: SessionUser, @Body() dto: CreateUserDto) {
  // 定义方法 create；括号中声明参数，花括号内实现逻辑。
    return this.users.create(me, dto);
    // 返回 this.users.create(me, dto) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  @Put(':username')
  // 装饰器 Put：给后面的类、方法或参数附加元数据。
  update(
  // 调用 update，把括号中的值作为参数传入。
    @CurrentUser() me: SessionUser,
    // 装饰器 CurrentUser：给后面的类、方法或参数附加元数据。
    @Param('username') username: string,
    // 装饰器 Param：读取 URL 路径参数。
    @Body() dto: UpdateUserDto,
    // 装饰器 Body：读取请求体。
  ) {
  // 继续当前表达式；这一行的值由外层代码块或调用使用。
    return this.users.update(me, username, dto);
    // 返回 this.users.update(me, username, dto) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  @Delete(':username')
  // 装饰器 Delete：把方法绑定到 DELETE 路由。
  remove(@CurrentUser() me: SessionUser, @Param('username') username: string) {
  // 定义方法 remove；括号中声明参数，花括号内实现逻辑。
    return this.users.remove(me, username);
    // 返回 this.users.remove(me, username) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
