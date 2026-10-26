/**
 // 这一段负责配置和实现 server/src/command/machine-command.controller.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Body：NestJS 从请求体提取参数的装饰器；Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器；Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器；UseGuards：NestJS 在处理请求前应用权限守卫的装饰器
import { CommandBody, CommandService } from './command.service';
// 从 ./command.service 导入这一行列出的符号，供本文件调用。
// CommandBody：后端控制接口的请求体结构，包含设备编码、指令类型和参数；CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
import { MachineTokenGuard } from './machine-token.guard';
// 从 ./machine-token.guard 导入这一行列出的符号，供本文件调用。
// MachineTokenGuard：后端机器通道令牌守卫
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别

// 这一段声明 MachineCommandBody，用于MachineCommandBody 的相关数据和行为。
export interface MachineCommandBody extends CommandBody {
// 定义 MachineCommandBody，约束或实现本模块涉及的数据和行为。
// CommandBody：后端控制接口的请求体结构，包含设备编码、指令类型和参数
  lineId?: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  operator?: string;
  // 声明或设置 operator，用于当前对象或接口的对应数据。
  // operator：本处声明的字段或类型，类型为 string
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 MachineCommandBody 的字段或服务能力，供项目其他模块使用。

/** operator 清洗:只保留字母数字和 -_:.,长度截断,防止审计里塞进奇怪内容 */
// 这一段定义 sanitizeOperator，用于限制机器通道操作人名称的长度与可用字符。
function sanitizeOperator(raw: unknown): string {
// 定义函数 sanitizeOperator。
// sanitizeOperator：限制机器通道操作人名称的长度与可用字符；raw：当前方法接收的参数，类型为 unknown
  const s = String(raw ?? '').trim();
  // 将输入转换为 JavaScript 文本值，将结果保存或写入 s。
  // s：本处保存 String(raw ?? '').trim() 的结果；String：将值转换为文本的 JavaScript 构造函数；raw：当前方法接收的参数，类型为 unknown；trim：移除字符串两端空白
  const cleaned = s.replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 64);
  // 按匹配规则替换字符串内容，将结果保存或写入 cleaned。
  // cleaned：本处保存 s.replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 64) 的结果；s：本处保存 String(raw ?? '').trim() 的结果；replace：按匹配规则替换字符串内容；slice：截取数组或字符串的一部分
  return cleaned || 'machine';
  // 把cleaned || 'machine'作为当前函数的结果返回。
  // cleaned：本处保存 s.replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 64) 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了限制机器通道操作人名称的长度与可用字符的实现；实际结果由运行时输入和执行分支决定。

// 这一段声明 MachineCommandController，用于MachineCommandController 的相关数据和行为。
@Controller('api/machine')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
// Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器
export class MachineCommandController {
// 定义 MachineCommandController，约束或实现本模块涉及的数据和行为。
// MachineCommandController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  // 这一段定义 constructor，用于初始化 machine-command.controller 使用的实例状态和依赖。
  constructor(private readonly commands: CommandService) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // commands：当前方法接收的参数，类型为 CommandService；CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
  // 这一段提供了初始化 machine-command.controller 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 send，用于把已通过令牌校验的机器请求转换为指令服务输入。
  @Post('commands')
  // 装饰器 Post：把方法绑定到 POST 路由。
  // Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器
  @UseGuards(MachineTokenGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  // UseGuards：NestJS 在处理请求前应用权限守卫的装饰器；MachineTokenGuard：后端机器通道令牌守卫
  send(@Body() body: MachineCommandBody) {
  // 定义方法 send；括号中声明参数，花括号内实现逻辑。
  // send：把已通过令牌校验的机器请求转换为指令服务输入；Body：NestJS 从请求体提取参数的装饰器；body：当前 HTTP 请求或消息的正文
    const lineCode = String(body?.lineId ?? '').trim();
    // 将输入转换为 JavaScript 文本值，将结果保存或写入 lineCode。
    // lineCode：对外使用的产线字符串编码；String：将值转换为文本的 JavaScript 构造函数；body：当前 HTTP 请求或消息的正文；lineId：产线标识，接口通常使用 line-01 等编码；trim：移除字符串两端空白
    if (!lineCode) {
    // 检查(!lineCode)，按判断结果进入对应的处理分支。
    // lineCode：对外使用的产线字符串编码
      return { ok: false, error: 'lineId 不能为空' };
      // 把{ ok: false, error: 'lineId 不能为空' }作为当前函数的结果返回。
      // ok：操作是否成功的布尔结果；error：失败原因或错误对象
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const operator = sanitizeOperator(body.operator);
    // 限制机器通道操作人名称的长度与可用字符，将结果保存或写入 operator。
    // operator：本处保存 sanitizeOperator(body.operator) 的结果；sanitizeOperator：限制机器通道操作人名称的长度与可用字符；body：当前 HTTP 请求或消息的正文
    // SessionUser 这里只用于承载 operator —— issue() 只读 user.username。
    // level 固定 3:机器通道的权限由密钥本身决定,不走三级 RBAC。
    const user: SessionUser = { username: operator, level: 3 };
    // SessionUser 这里只用于承载 operator —— issue() 只读 user.username。
    // user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；username：账号用户名；operator：本处保存 sanitizeOperator(body.operator) 的结果；level：用户操作级别或事件严重级别，依据当前接口结构区分
    return this.commands.issue(lineCode, body, user);
    // 把this.commands.issue(lineCode, body, user)作为当前函数的结果返回。
    // commands：当前方法接收的参数，类型为 CommandService；issue：校验指令和目标设备，写入审计记录并经 MQTT 下发；lineCode：对外使用的产线字符串编码；body：当前 HTTP 请求或消息的正文；user：当前会话或调用方的用户信息
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把已通过令牌校验的机器请求转换为指令服务输入的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/command/machine-command.controller.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 MachineCommandController 的字段或服务能力，供项目其他模块使用。
