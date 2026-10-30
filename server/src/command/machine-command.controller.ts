/**
 * 供本机业务工具使用的机器控制入口，与网页登录 Cookie 通道分别检查身份。
 * MachineTokenGuard 通过后组装业务参数，继续调用共用 CommandService.issue，后续仍经 MQTT 和采集器。
 * operator 是机器入口提供的操作人标识，不是这里通过网页密码验证得到的用户。
 */
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CommandBody, CommandService } from './command.service';
import { MachineTokenGuard } from './machine-token.guard';
import type { SessionUser } from '../auth/session-user';

export interface MachineCommandBody extends CommandBody {
  lineId?: string;
  operator?: string;
}

/** operator 清洗:只保留字母数字和 -_:.,长度截断,防止审计里塞进奇怪内容 */
// 【入口 sanitizeOperator：部分 / 作用】
// 部分 | 作用
// raw | 当前入口收到的原始文本或待清理值。
function sanitizeOperator(raw: unknown): string {
  const s = String(raw ?? '').trim();
  const cleaned = s.replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 64);
  return cleaned || 'machine';
}

@Controller('api/machine')
export class MachineCommandController {
// MachineCommandController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  constructor(private readonly commands: CommandService) {}

  // 【入口 MachineCommandController.send：部分 / 作用】
  // 部分 | 作用
  // body | 当前请求正文或流对象；具体字段依函数签名与调用方。
  @Post('commands')
  @UseGuards(MachineTokenGuard)
  send(@Body() body: MachineCommandBody) {
    const lineCode = String(body?.lineId ?? '').trim();
    if (!lineCode) {
      return { ok: false, error: 'lineId 不能为空' };
    }
    const operator = sanitizeOperator(body.operator);
    // SessionUser 这里只用于承载 operator —— issue() 只读 user.username。
    // level 固定 3:机器通道的权限由密钥本身决定,不走三级 RBAC。
    const user: SessionUser = { username: operator, level: 3 };
    // SessionUser 这里只用于承载 operator —— issue() 只读 user.username。
    return this.commands.issue(lineCode, body, user);
  }
}
