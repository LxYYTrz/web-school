/**
 // 这一段负责后端机器通道令牌守卫，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：机器通道守卫（x-machine-token）
 * 所属模块：server/src/command/
 * ============================================================================
 *
 * 【为什么需要它】
 *   网页控制走的是「session + level>=2」这套（AuthGuard + CommandGuard）。
 *   但演示阶段要让**飞书里的 AI**直接下发指令 —— AI 不是浏览器,没有 session。
 *   所以另开一条「机器对机器」的通道:带一个共享密钥(x-machine-token)即可,
 *   下发逻辑仍然复用同一个 CommandService.issue()，
 *   白名单 / params 枚举 / 审计 / MQTT 一条都不少。
 *
 * 【安全边界】
 *   - 密钥来自环境变量 MACHINE_COMMAND_TOKEN,**没配就是关闭**(直接 503)。
 *     不做「默认密钥」,也不做「配了就全放开」以外的任何隐式行为。
 *   - 用 sha256 + timingSafeEqual 比较,避免比较耗时泄露信息。
 *   - 这条通道**不接公网**:只允许从本机(127.0.0.1)调用,密钥不进仓库。
 *     真正的投产收紧见 CLAUDE.md §4.7。
 */
import {
// 开始列出本文件从其他模块导入的类型或运行时对象。
// 大括号内逐项列出从后续模块路径导入的类型或运行时对象
  CanActivate,
  // 把变量 CanActivate 作为同名对象字段加入当前对象。
  // CanActivate：NestJS 权限守卫接口
  ExecutionContext,
  // 把变量 ExecutionContext 作为同名对象字段加入当前对象。
  // ExecutionContext：NestJS 当前请求上下文类型，用于获取 HTTP 请求或消息连接
  ForbiddenException,
  // 把变量 ForbiddenException 作为同名对象字段加入当前对象。
  // ForbiddenException：NestJS 表示操作权限不足的 HTTP 403 异常
  Injectable,
  // 把变量 Injectable 作为同名对象字段加入当前对象。
  // Injectable：NestJS 把类注册为可注入服务的装饰器
  Logger,
  // 把变量 Logger 作为同名对象字段加入当前对象。
  // Logger：NestJS 按模块名称记录日志的工具类
  ServiceUnavailableException,
  // 把变量 ServiceUnavailableException 作为同名对象字段加入当前对象。
  // ServiceUnavailableException：NestJS 表示服务暂不可用的 HTTP 503 异常
  UnauthorizedException,
  // 把变量 UnauthorizedException 作为同名对象字段加入当前对象。
  // UnauthorizedException：NestJS 表示未登录或凭据错误的 HTTP 401 异常
} from '@nestjs/common';
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 本行完成上面一层已说明的函数、分支或对象配置
import { createHash, timingSafeEqual } from 'crypto';
// 从 crypto 导入这一行列出的符号，供本文件调用。
// createHash：从 crypto 导入的对象，用于本文件的调用或类型约束；timingSafeEqual：从 crypto 导入的对象，用于本文件的调用或类型约束
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。
// Request：从 express 导入的对象，用于本文件的调用或类型约束
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值

// 这一段声明 MachineTokenGuard，用于后端机器通道令牌守卫。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class MachineTokenGuard implements CanActivate {
// 定义 MachineTokenGuard，约束或实现本模块涉及的数据和行为。
// MachineTokenGuard：后端机器通道令牌守卫；CanActivate：NestJS 权限守卫接口
  private readonly logger = new Logger(MachineTokenGuard.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；MachineTokenGuard：后端机器通道令牌守卫；name：当前对象的名称字段

  // 这一段定义 canActivate，用于检查当前请求是否满足本守卫的登录、级别或令牌要求。

  // 机器控制入口在这里检查通道是否配置启用、来源是否满足回环限制以及请求令牌是否匹配。
  // token 来自后端配置，调用方在 x-machine-token 请求头提供；没有配置表示通道关闭，和“令牌提供错误”是不同情况。
  // 这层校验不读取网页 Cookie，也不单独实现飞书与网页 MCP 工具的身份隔离；通过后仍进入命令业务检查。

  canActivate(context: ExecutionContext): boolean {
  // 检查机器命令入口是否启用、请求来源是否满足本机限制以及机器令牌是否匹配。
  // context 提供当前 HTTP 请求；配置 commandToken 为空表示通道关闭；x-machine-token 是调用方的机器凭据，和网页会话 Cookie 分别校验。
    const token = config.machine.commandToken;
    // 根据 config.machine.commandToken 设置 token，供当前流程后续使用。
    // token：本处保存 config.machine.commandToken 的结果；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；machine：config 对象上的字段或操作；commandToken：本机机器控制通道的共享令牌，为空时关闭通道
    // 通道没配置 = 关闭。不是 403,是 503 —— 语义是「这个功能没开」,
    // 调用方能区分「凭据错了」和「压根没启用」。
    if (!token) {
    // 检查(!token)，按判断结果进入对应的处理分支。
    // token：本处保存 config.machine.commandToken 的结果
      throw new ServiceUnavailableException({
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // ServiceUnavailableException：NestJS 表示服务暂不可用的 HTTP 503 异常
        code: 503,
        // 声明或设置 code，用于业务编码、状态码或数据库查询字段，结合所在报文解释。
        // code：业务编码、状态码或数据库查询字段，结合所在报文解释
        msg: '机器通道未启用(后端未配置 MACHINE_COMMAND_TOKEN)',
        // 声明或设置 msg，用于当前收到的消息或提示文字。
        // msg：当前收到的消息或提示文字
      });
      // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    const req = context.switchToHttp().getRequest<Request>();
    // 切换到 HTTP 接口继续获取实时数据，将结果保存或写入 req。
    // req：当前 HTTP 请求对象；context：当前方法接收的参数，类型为 ExecutionContext；switchToHttp：本处声明的字段或类型，类型为 HttpArgumentsHost；getRequest：本处声明的字段或类型，类型为 T；Request：从 express 导入的对象，用于本文件的调用或类型约束
    const remote = req.socket.remoteAddress;
    // 根据 req.socket.remoteAddress 设置 remote，供当前流程后续使用。
    // remote：本处保存 req.socket.remoteAddress 的结果；req：当前 HTTP 请求对象；socket：Socket.IO 实时连接实例；remoteAddress：本处声明的字段或类型，类型为 string | undefined
    if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
    // 检查(remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1')，按判断结果进入对应的处理分支。
    // remote：本处保存 req.socket.remoteAddress 的结果
      throw new ForbiddenException({ code: 403, msg: '机器通道仅允许本机调用' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // ForbiddenException：NestJS 表示操作权限不足的 HTTP 403 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const provided = String(req.headers['x-machine-token'] ?? '');
    // 将输入转换为 JavaScript 文本值，将结果保存或写入 provided。
    // provided：本处保存 String(req.headers['x-machine-token'] ?? '') 的结果；String：将值转换为文本的 JavaScript 构造函数；req：当前 HTTP 请求对象；headers：HTTP 请求头集合
    if (!provided) {
    // 检查(!provided)，按判断结果进入对应的处理分支。
    // provided：本处保存 String(req.headers['x-machine-token'] ?? '') 的结果
      throw new UnauthorizedException({ code: 401, msg: '缺少 x-machine-token' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // UnauthorizedException：NestJS 表示未登录或凭据错误的 HTTP 401 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    // 先 sha256 再比:保证两个摘要等长,timingSafeEqual 才不会因长度不同抛异常
    const a = createHash('sha256').update(provided).digest();
    // 创建摘要计算器以生成稳定的哈希值，将结果保存或写入 a。
    // a：本处保存 createHash('sha256').update(provided).digest() 的结果；createHash：从 crypto 导入的对象，用于本文件的调用或类型约束；update：提供 update 的本地处理逻辑；provided：本处保存 String(req.headers['x-machine-token'] ?? '') 的结果；digest：提供 digest 的本地处理逻辑
    const b = createHash('sha256').update(token).digest();
    // 创建摘要计算器以生成稳定的哈希值，将结果保存或写入 b。
    // b：本处保存 createHash('sha256').update(token).digest() 的结果；createHash：从 crypto 导入的对象，用于本文件的调用或类型约束；update：提供 update 的本地处理逻辑；token：本处保存 config.machine.commandToken 的结果；digest：提供 digest 的本地处理逻辑
    if (!timingSafeEqual(a, b)) {
    // 检查(!timingSafeEqual(a, b))，按判断结果进入对应的处理分支。
    // timingSafeEqual：从 crypto 导入的对象，用于本文件的调用或类型约束；a：本处保存 createHash('sha256').update(provided).digest() 的结果；b：本处保存 createHash('sha256').update(token).digest() 的结果
      this.logger.warn(`机器通道凭据校验失败,来源 IP=${req.ip ?? 'unknown'}`);
      // 记录警告日志或显示警告提示，以接收对象为准。
      // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；req：当前 HTTP 请求对象；ip：本处声明的字段或类型，类型为 string | undefined
      throw new UnauthorizedException({ code: 401, msg: '机器凭据无效' });
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
// 这一段提供了后端机器通道令牌守卫所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 MachineTokenGuard 的字段或服务能力，供项目其他模块使用。
