// 这一段负责配置和实现 server/src/users/users.controller.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Body：NestJS 从请求体提取参数的装饰器；Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器；Delete：NestJS 将方法绑定到 HTTP DELETE 路由的装饰器；Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器；Param：NestJS 从 URL 路径提取参数的装饰器；Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器；Put：从 @nestjs/common 导入的对象，用于本文件的NestJS 的依赖注入、HTTP 异常和生命周期支持；UseGuards：NestJS 在处理请求前应用权限守卫的装饰器
import { AuthGuard } from '../auth/auth.guard';
// 从 ../auth/auth.guard 导入这一行列出的符号，供本文件调用。
// AuthGuard：后端登录守卫，检查会话中是否存在用户
import { CurrentUser } from '../auth/current-user.decorator';
// 从 ../auth/current-user.decorator 导入这一行列出的符号，供本文件调用。
// CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别
import { CreateUserDto } from './dto/create-user.dto';
// 从 ./dto/create-user.dto 导入这一行列出的符号，供本文件调用。
// CreateUserDto：从 ./dto/create-user.dto 导入的对象，用于本文件的调用或类型约束
import { UpdateUserDto } from './dto/update-user.dto';
// 从 ./dto/update-user.dto 导入这一行列出的符号，供本文件调用。
// UpdateUserDto：从 ./dto/update-user.dto 导入的对象，用于本文件的调用或类型约束
import { UsersService } from './users.service';
// 从 ./users.service 导入这一行列出的符号，供本文件调用。
// UsersService：后端用户管理服务，执行账号权限校验与增删改查

// 这一段声明 UsersController，用于UsersController 的相关数据和行为。
@Controller('api/users')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
// Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器
@UseGuards(AuthGuard)
// 装饰器 UseGuards：执行路由前先应用权限守卫。
// UseGuards：NestJS 在处理请求前应用权限守卫的装饰器；AuthGuard：后端登录守卫，检查会话中是否存在用户
export class UsersController {
// 定义 UsersController，约束或实现本模块涉及的数据和行为。
// UsersController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  // 这一段定义 constructor，用于初始化 users.controller 使用的实例状态和依赖。
  constructor(private readonly users: UsersService) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // users：当前方法接收的参数，类型为 UsersService；UsersService：后端用户管理服务，执行账号权限校验与增删改查
  // 这一段提供了初始化 users.controller 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 list，用于转交查询账号列表请求并传入当前会话用户。
  @Get()
  // 装饰器 Get：把方法绑定到 GET 路由。
  // Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器
  list(@CurrentUser() me: SessionUser) {
  // 定义方法 list；括号中声明参数，花括号内实现逻辑。
  // list：转交查询账号列表请求并传入当前会话用户；CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    return this.users.list(me);
    // 把this.users.list(me)作为当前函数的结果返回。
    // users：当前方法接收的参数，类型为 UsersService；list：转交查询账号列表请求并传入当前会话用户；me：当前方法接收的参数，类型为 SessionUser
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了转交查询账号列表请求并传入当前会话用户的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 create，用于转交创建账号请求并传入当前会话用户。
  @Post()
  // 装饰器 Post：把方法绑定到 POST 路由。
  // Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器
  create(@CurrentUser() me: SessionUser, @Body() dto: CreateUserDto) {
  // 定义方法 create；括号中声明参数，花括号内实现逻辑。
  // create：转交创建账号请求并传入当前会话用户；CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；Body：NestJS 从请求体提取参数的装饰器；dto：当前方法接收的参数，类型为 CreateUserDto；CreateUserDto：从 ./dto/create-user.dto 导入的对象，用于本文件的调用或类型约束
    return this.users.create(me, dto);
    // 把this.users.create(me, dto)作为当前函数的结果返回。
    // users：当前方法接收的参数，类型为 UsersService；create：转交创建账号请求并传入当前会话用户；me：当前方法接收的参数，类型为 SessionUser；dto：当前方法接收的参数，类型为 CreateUserDto
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了转交创建账号请求并传入当前会话用户的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 update，用于转交指定账号的更新请求并传入当前会话用户。
  @Put(':username')
  // 装饰器 Put：给后面的类、方法或参数附加元数据。
  // Put：从 @nestjs/common 导入的对象，用于本文件的NestJS 的依赖注入、HTTP 异常和生命周期支持
  update(
  // 按本行数据更新当前状态或对象字段。
  // update：转交指定账号的更新请求并传入当前会话用户
    @CurrentUser() me: SessionUser,
    // 装饰器 CurrentUser：给后面的类、方法或参数附加元数据。
    // CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    @Param('username') username: string,
    // 装饰器 Param：读取 URL 路径参数。
    // Param：NestJS 从 URL 路径提取参数的装饰器；username：账号用户名
    @Body() dto: UpdateUserDto,
    // 装饰器 Body：读取请求体。
    // Body：NestJS 从请求体提取参数的装饰器；dto：当前方法接收的参数，类型为 UpdateUserDto；UpdateUserDto：从 ./dto/update-user.dto 导入的对象，用于本文件的调用或类型约束
  ) {
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // 上方参数列表在此结束，下面开始方法的具体处理逻辑
    return this.users.update(me, username, dto);
    // 把this.users.update(me, username, dto)作为当前函数的结果返回。
    // users：当前方法接收的参数，类型为 UsersService；update：转交指定账号的更新请求并传入当前会话用户；me：当前方法接收的参数，类型为 SessionUser；username：账号用户名；dto：当前方法接收的参数，类型为 UpdateUserDto
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了转交指定账号的更新请求并传入当前会话用户的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 remove，用于转交指定账号的删除请求并传入当前会话用户。
  @Delete(':username')
  // 装饰器 Delete：把方法绑定到 DELETE 路由。
  // Delete：NestJS 将方法绑定到 HTTP DELETE 路由的装饰器
  remove(@CurrentUser() me: SessionUser, @Param('username') username: string) {
  // 定义方法 remove；括号中声明参数，花括号内实现逻辑。
  // remove：转交指定账号的删除请求并传入当前会话用户；CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；Param：NestJS 从 URL 路径提取参数的装饰器；username：账号用户名
    return this.users.remove(me, username);
    // 把this.users.remove(me, username)作为当前函数的结果返回。
    // users：当前方法接收的参数，类型为 UsersService；remove：转交指定账号的删除请求并传入当前会话用户；me：当前方法接收的参数，类型为 SessionUser；username：账号用户名
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了转交指定账号的删除请求并传入当前会话用户的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/users/users.controller.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 UsersController 的字段或服务能力，供项目其他模块使用。
