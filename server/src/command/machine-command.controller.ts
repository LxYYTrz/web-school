/**
 * ============================================================================
 * 文件作用：机器通道控制接口（AI / 脚本直控）
 * 所属模块：server/src/command/
 * ============================================================================
 *
 * 【接口定义】
 *   方法：POST
 *   路径：/api/machine/commands
 *   头部：x-machine-token: <MACHINE_COMMAND_TOKEN>
 *   Body：{ "lineId":"line-01", "deviceId":"plc-01", "type":"conveyor",
 *           "params":{"action":"forward"}, "operator":"ai:feishu:ou_xxx" }
 *   返回：{ "ok":true, "cmdId":"uuid" } 或 { "ok":false, "error":"..." }
 *
 * 【和网页那条路的关系】
 *   网页：  POST /api/lines/:lineId/commands  (AuthGuard → CommandGuard → issue())
 *   机器：  POST /api/machine/commands        (MachineTokenGuard → issue())
 *   ★ 两条路最终都走 CommandService.issue() —— 白名单、params 枚举校验、
 *     control_commands 落库、audit_logs 审计、MQTT 下发,一个字都没少。
 *     机器通道**只是换了一种「谁在操作」的认证方式**,不是另一套下发逻辑。
 *     所以不存在「AI 走了一条绕过校验的野路子」这种可能。
 *
 * 【operator 字段】
 *   记录「这次操作是谁干的」,方便审计追溯:
 *     ai:feishu:ou_xxx   ← 飞书里的某个用户触发的
 *     ai:line-twin       ← 本机脚本
 *   会做长度与字符白名单清洗 —— 它最终进 audit_logs.detail(jsonb),
 *   不是 SQL 拼接,但仍然不接收任意长/奇怪字符。
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
function sanitizeOperator(raw: unknown): string {
  const s = String(raw ?? '').trim();
  const cleaned = s.replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 64);
  return cleaned || 'machine';
}

@Controller('api/machine')
export class MachineCommandController {
  constructor(private readonly commands: CommandService) {}

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
    return this.commands.issue(lineCode, body, user);
  }
}
