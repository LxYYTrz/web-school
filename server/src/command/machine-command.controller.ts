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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CommandBody, CommandService } from './command.service';
// 从 ./command.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { MachineTokenGuard } from './machine-token.guard';
// 从 ./machine-token.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

export interface MachineCommandBody extends CommandBody {
// 声明 MachineCommandBody 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口；extends＝继承父类。
  lineId?: string;
  // 声明 可选字段 lineId，类型为 string。
  operator?: string;
  // 声明 可选字段 operator，类型为 string。
}
// 结束当前对象、函数或条件代码块。

/** operator 清洗:只保留字母数字和 -_:.,长度截断,防止审计里塞进奇怪内容 */
function sanitizeOperator(raw: unknown): string {
// 定义函数 sanitizeOperator。 关键字：function＝定义函数；unknown＝需检查后才能使用的类型。
  const s = String(raw ?? '').trim();
  // 声明 s，初始值由 String(raw ?? '').trim() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const cleaned = s.replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 64);
  // 声明 cleaned，初始值由 s.replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 64) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  return cleaned || 'machine';
  // 返回 cleaned || 'machine' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

@Controller('api/machine')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
export class MachineCommandController {
// 声明 MachineCommandController 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  constructor(private readonly commands: CommandService) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  @Post('commands')
  // 装饰器 Post：把方法绑定到 POST 路由。
  @UseGuards(MachineTokenGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  send(@Body() body: MachineCommandBody) {
  // 定义方法 send；括号中声明参数，花括号内实现逻辑。
    const lineCode = String(body?.lineId ?? '').trim();
    // 声明 lineCode，初始值由 String(body?.lineId ?? '').trim() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (!lineCode) {
    // 判断 if (!lineCode) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      return { ok: false, error: 'lineId 不能为空' };
      // 返回 { ok: false, error: 'lineId 不能为空' } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
    }
    // 结束当前对象、函数或条件代码块。
    const operator = sanitizeOperator(body.operator);
    // 声明 operator，初始值由 sanitizeOperator(body.operator) 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // SessionUser 这里只用于承载 operator —— issue() 只读 user.username。
    // level 固定 3:机器通道的权限由密钥本身决定,不走三级 RBAC。
    const user: SessionUser = { username: operator, level: 3 };
    // 声明 user，初始值由 { username: operator, level: 3 } 计算得到。 关键字：const＝声明不可重新绑定的变量。
    return this.commands.issue(lineCode, body, user);
    // 返回 this.commands.issue(lineCode, body, user) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
