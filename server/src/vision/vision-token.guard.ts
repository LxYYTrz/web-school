import {
  CanActivate, ExecutionContext, Injectable, Logger, ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { config } from '../config/configuration';

/**
 * 视觉机上传接口的守卫:校验 Header `X-Vision-Token`。
 *
 * 为什么不用登录 session:视觉机是无人值守的采集端,不该持有人的账号密码。
 * 为什么必须用 token 而不是"局域网内网就放行":云端 nginx 把 `/api/` 全量反代
 * 到公网 8081(见 deploy/nginx/cloud.conf),裸接口等于对全世界开放。
 *
 * **fail closed**:VISION_TOKEN 没配时直接 503 拒绝服务,绝不"没配就放开" ——
 * 恰恰是"忘了配"这个默认状态下最危险,必须是关闭而不是打开。
 */
@Injectable()
export class VisionTokenGuard implements CanActivate {
  private readonly logger = new Logger(VisionTokenGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const expected = config.vision.token;
    if (!expected) {
      this.logger.error('VISION_TOKEN 未配置,上传接口已禁用(拒绝所有请求)');
      throw new ServiceUnavailableException({
        code: 503, msg: '上传接口未启用:服务端未配置 VISION_TOKEN',
      });
    }

    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-vision-token') ?? '';
    if (!provided || !this.timingSafeEqualStr(provided, expected)) {
      this.logger.warn(`上传被拒:来源 ${req.ip},X-Vision-Token 不匹配`);
      throw new UnauthorizedException({ code: 401, msg: 'X-Vision-Token 无效' });
    }
    return true;
  }

  /** 定长比较,避免按字节提前返回泄露前缀信息 */
  private timingSafeEqualStr(a: string, b: string): boolean {
    const ab = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}
