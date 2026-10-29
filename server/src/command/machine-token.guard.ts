/**
 * 机器控制入口的后端守卫，按启用配置、回环来源、请求头令牌的顺序检查。
 * 令牌缺失表示通道关闭；对请求令牌做 SHA-256 后用 timingSafeEqual 比较，不将令牌写入注释或日志。
 * 该守卫不使用 cookie-session，也不单独区分模型调用来自飞书还是网页。
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { config } from '../config/configuration';

@Injectable()
export class MachineTokenGuard implements CanActivate {
  private readonly logger = new Logger(MachineTokenGuard.name);


  // 机器控制入口在这里检查通道是否配置启用、来源是否满足回环限制以及请求令牌是否匹配。
  // token 来自后端配置，调用方在 x-machine-token 请求头提供；没有配置表示通道关闭，和“令牌提供错误”是不同情况。
  // 这层校验不读取网页 Cookie，也不单独实现飞书与网页 MCP 工具的身份隔离；通过后仍进入命令业务检查。

  canActivate(context: ExecutionContext): boolean {
  // 检查机器命令入口是否启用、请求来源是否满足本机限制以及机器令牌是否匹配。
  // context 提供当前 HTTP 请求；配置 commandToken 为空表示通道关闭；x-machine-token 是调用方的机器凭据，和网页会话 Cookie 分别校验。
    const token = config.machine.commandToken;
    // 通道没配置 = 关闭。不是 403,是 503 —— 语义是「这个功能没开」,
    // 调用方能区分「凭据错了」和「压根没启用」。
    if (!token) {
      throw new ServiceUnavailableException({
        code: 503,
        msg: '机器通道未启用(后端未配置 MACHINE_COMMAND_TOKEN)',
      });
    }

    const req = context.switchToHttp().getRequest<Request>();
    const remote = req.socket.remoteAddress;
    if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
      throw new ForbiddenException({ code: 403, msg: '机器通道仅允许本机调用' });
    }
    const provided = String(req.headers['x-machine-token'] ?? '');
    // 1. 从机器请求头取得调用方提供的凭据，空缺时按空字符串处理。
    // 2. 它与 config.machine.commandToken 比较，不是网页登录密码或 Cookie。
    // 3. 后面的哈希与 timingSafeEqual 用于比较凭据；来源限制读取 socket.remoteAddress，不信任请求正文自报来源。
    // 4. 注释只解释凭据从哪里来，不展示实际密钥内容。
    if (!provided) {
      throw new UnauthorizedException({ code: 401, msg: '缺少 x-machine-token' });
    }

    // 先 sha256 再比:保证两个摘要等长,timingSafeEqual 才不会因长度不同抛异常
    const a = createHash('sha256').update(provided).digest();
    const b = createHash('sha256').update(token).digest();
    if (!timingSafeEqual(a, b)) {
      this.logger.warn(`机器通道凭据校验失败,来源 IP=${req.ip ?? 'unknown'}`);
      throw new UnauthorizedException({ code: 401, msg: '机器凭据无效' });
    }
    return true;
  }
}
