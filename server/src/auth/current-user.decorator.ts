// 这一段负责配置和实现 server/src/auth/current-user.decorator.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// createParamDecorator：NestJS 创建自定义控制器参数装饰器的函数；ExecutionContext：NestJS 当前请求上下文类型，用于获取 HTTP 请求或消息连接
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。
// Request：从 express 导入的对象，用于本文件的调用或类型约束
import type { SessionUser } from './session-user';
// 从 ./session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别

// @CurrentUser() 注入当前登录用户;AuthGuard 已保证 session 存在
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): SessionUser => {
// 导出这一行声明的符号，供项目其他模块使用。
// CurrentUser：本处保存 createParamDecorator((_data: unknown, ctx: ExecutionContext)… 的结果；createParamDecorator：NestJS 创建自定义控制器参数装饰器的函数；_data：当前方法接收的参数，类型为 unknown；ctx：当前框架调用上下文；ExecutionContext：NestJS 当前请求上下文类型，用于获取 HTTP 请求或消息连接；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
  const req = ctx.switchToHttp().getRequest<Request>();
  // 切换到 HTTP 接口继续获取实时数据，将结果保存或写入 req。
  // req：当前 HTTP 请求对象；ctx：当前框架调用上下文；switchToHttp：本处声明的字段或类型，类型为 HttpArgumentsHost；getRequest：本处声明的字段或类型，类型为 T；Request：从 express 导入的对象，用于本文件的调用或类型约束
  return {
  // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
  // 下方各属性共同组成返回对象，调用方按字段名读取结果
    username: req.session!.username as string,
    // 声明或设置 username，用于账号用户名。
    // username：账号用户名；req：当前 HTTP 请求对象；session：HTTP 登录会话对象
    level: req.session!.level as number,
    // 声明或设置 level，用于用户操作级别或事件严重级别，依据当前接口结构区分。
    // level：用户操作级别或事件严重级别，依据当前接口结构区分；req：当前 HTTP 请求对象；session：HTTP 登录会话对象
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/auth/current-user.decorator.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
