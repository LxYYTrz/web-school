// 这一段负责后端登录守卫，检查会话中是否存在用户，为后续代码提供当前文件的处理入口。
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// CanActivate：NestJS 权限守卫接口；ExecutionContext：NestJS 当前请求上下文类型，用于获取 HTTP 请求或消息连接；Injectable：NestJS 把类注册为可注入服务的装饰器；UnauthorizedException：NestJS 表示未登录或凭据错误的 HTTP 401 异常
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。
// Request：从 express 导入的对象，用于本文件的调用或类型约束

// 路由守卫:已登录(username + level 都在 session 上)放行;否则 401
// 这一段声明 AuthGuard，用于后端登录守卫，检查会话中是否存在用户。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class AuthGuard implements CanActivate {
// 定义 AuthGuard，约束或实现本模块涉及的数据和行为。
// AuthGuard：后端登录守卫，检查会话中是否存在用户；CanActivate：NestJS 权限守卫接口
  // 这一段定义 canActivate，用于检查当前请求是否满足本守卫的登录、级别或令牌要求。
  canActivate(context: ExecutionContext): boolean {
  // 定义方法 canActivate；括号中声明参数，花括号内实现逻辑。
  // canActivate：检查当前请求是否满足本守卫的登录、级别或令牌要求；context：当前方法接收的参数，类型为 ExecutionContext；ExecutionContext：NestJS 当前请求上下文类型，用于获取 HTTP 请求或消息连接
    const req = context.switchToHttp().getRequest<Request>();
    // 切换到 HTTP 接口继续获取实时数据，将结果保存或写入 req。
    // req：当前 HTTP 请求对象；context：当前方法接收的参数，类型为 ExecutionContext；switchToHttp：本处声明的字段或类型，类型为 HttpArgumentsHost；getRequest：本处声明的字段或类型，类型为 T；Request：从 express 导入的对象，用于本文件的调用或类型约束

    // AuthGuard 从当前 HTTP 请求读取已经由 cookie-session 处理的会话。
    // 要求会话存在、用户名非空且 level 为 number；不满足时抛 401，满足后才允许进入后续守卫或接口。
    // 这里检查会话条件，不重新查询账号密码；控制操作需要的 level 门槛由 CommandGuard 继续检查。

    const session = req.session;
    // 根据 req.session 设置 session，用于HTTP 登录会话对象。
    // session：HTTP 登录会话对象；req：当前 HTTP 请求对象
    if (!session || !session.username || typeof session.level !== 'number') {
    // 检查(!session || !session.username || typeof session.level !== 'number')，按判断结果进入对应的处理分支。
    // session：HTTP 登录会话对象；username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分
      throw new UnauthorizedException({ code: 401, msg: '未登录' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // UnauthorizedException：NestJS 表示未登录或凭据错误的 HTTP 401 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    return true;
    // 把true作为当前函数的结果返回。
    // 布尔结果由当前函数的调用方用于决定是否允许继续执行
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了检查当前请求是否满足本守卫的登录、级别或令牌要求的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端登录守卫，检查会话中是否存在用户所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 AuthGuard 的字段或服务能力，供项目其他模块使用。
