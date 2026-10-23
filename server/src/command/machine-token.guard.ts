/**
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

  canActivate(context: ExecutionContext): boolean {
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
