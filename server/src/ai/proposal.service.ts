import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import Redis from 'ioredis';
// 从 ioredis 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { REDIS } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { TelemetryGateway } from '../realtime/telemetry.gateway';
// 从 ../realtime/telemetry.gateway 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ALLOWED_TYPES, EXECUTABLE_TYPES, validateParams } from '../command/command-contract';
// 从 ../command/command-contract 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * AI 建议的中转站。
 *
 * 写入方是 mcp/line-twin-mcp.js 里的 propose_action 工具 —— 它只校验 + 落 Redis +
 * publish,没有任何下发能力。本服务订阅频道后做**二次校验**再推给 UI:
 * agent 是概率模型,MCP 侧放行过一次不代表这里就该放行,
 * 控制链路上的每一层都应该假设上一层可能被绕过。
 */

export interface AiProposal {
// 声明 AiProposal 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  id: string;
  // 设置字段 id。
  lineId: string;
  // 设置字段 lineId。
  deviceId: string;
  // 设置字段 deviceId。
  type: string;
  // 设置字段 type。 关键字：type＝定义类型别名。
  params: Record<string, unknown>;
  // 设置字段 params。 关键字：unknown＝需检查后才能使用的类型。
  reason: string;
  // 设置字段 reason。
  status: 'pending';
  // 设置字段 status。
  createdAt: number;
  // 设置字段 createdAt。
}
// 结束当前对象、函数或条件代码块。

const PROPOSAL_CHANNEL = 'ai:proposal';
// 声明 PROPOSAL_CHANNEL，初始值由 'ai:proposal' 计算得到。 关键字：const＝声明不可重新绑定的变量。
const keyOf = (id: string) => `ai:proposal:${id}`;
// 声明 keyOf，初始值由 (id: string) => ai:proposal:${id} 计算得到。 关键字：const＝声明不可重新绑定的变量。

// 取出即删除,保证同一条建议只能被确认一次。
// 用 Lua 而不是 GETDEL —— Memurai 的 GETDEL 支持随版本而异,eval 是通用能力。
const CLAIM_LUA = `
// 声明 CLAIM_LUA，初始值由  计算得到。 关键字：const＝声明不可重新绑定的变量。
local v = redis.call('GET', KEYS[1])
// 调用 redis.call；括号中的表达式是传入的参数。
if v == false then return nil end
// 判断 if v == false then return nil end 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；false＝布尔假值；return＝返回结果并结束当前函数。
redis.call('DEL', KEYS[1])
// 调用 redis.call，把括号中的值作为参数传入。
return v
// 返回 v 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
`;
// 继续当前表达式；这一行的值由外层代码块或调用使用。

@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class ProposalService implements OnModuleInit, OnModuleDestroy {
// 声明 ProposalService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  private readonly logger = new Logger(ProposalService.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。
  // ioredis 的订阅连接不能同时跑普通命令,必须单独开一条
  private sub?: Redis;
  // 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：private＝限定类内部访问。

  constructor(
  // 调用 constructor，把括号中的值作为参数传入。
    @Inject(REDIS) private readonly redis: Redis,
    // 装饰器 Inject：按令牌注入指定依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly gateway: TelemetryGateway,
    // 声明类属性或构造参数 gateway，类型为 TelemetryGateway。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。

  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
    this.sub = this.redis.duplicate();
    // 把右侧表达式的结果写入 this.sub。 关键字：this＝当前对象实例。
    this.sub.on('error', (e) => this.logger.error(`pubsub 连接错误: ${e.message}`));
    // 调用 this.sub.on，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    this.sub.subscribe(PROPOSAL_CHANNEL, (err) => {
    // 调用 this.sub.subscribe，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      if (err) return this.logger.error(`订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}`);
      // 判断 if (err) return this.logger.error(订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；this＝当前对象实例。
      this.logger.log(`已订阅 ${PROPOSAL_CHANNEL}`);
      // 调用 this.logger.log，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    });
    // 结束当前回调或对象，并完成外层函数调用。
    this.sub.on('message', (channel, raw) => {
    // 调用 this.sub.on，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      if (channel !== PROPOSAL_CHANNEL) return;
      // 判断 if (channel !== PROPOSAL_CHANNEL) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
      void this.onProposalMessage(raw);
      // 调用 this.onProposalMessage；括号中的表达式是传入的参数。 关键字：void＝表示没有返回值；this＝当前对象实例。
    });
    // 结束当前回调或对象，并完成外层函数调用。
  }
  // 结束当前对象、函数或条件代码块。

  async onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    if (this.sub) await this.sub.quit().catch(() => undefined);
    // 判断 if (this.sub) await this.sub.quit().catch(() => undefined); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；this＝当前对象实例；await＝等待异步操作完成；catch＝捕获异常；undefined＝未定义值。
  }
  // 结束当前对象、函数或条件代码块。

  private async onProposalMessage(raw: string) {
  // 定义方法 onProposalMessage；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问；async＝声明异步函数。
    let p: AiProposal;
    // 声明变量 p，类型为 AiProposal；其值稍后赋入。 关键字：let＝声明可重新赋值的变量。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      p = JSON.parse(raw) as AiProposal;
      // 把右侧表达式的结果写入 p。
    } catch (e) {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      return this.logger.warn(`丢弃非法提案 JSON: ${(e as Error).message}`);
      // 返回 this.logger.warn(丢弃非法提案 JSON: ${(e as Error).message}) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
    }
    // 结束当前对象、函数或条件代码块。

    const bad = this.revalidate(p);
    // 声明 bad，初始值由 this.revalidate(p) 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    if (bad) {
    // 判断 if (bad) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      // 这是安全事件:MCP 侧本不该放出这种东西。记日志但不推 UI。
      return this.logger.warn(`拒绝二次校验未通过的提案 ${p?.id}: ${bad}`);
      // 返回 this.logger.warn(拒绝二次校验未通过的提案 ${p?.id}: ${bad}) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
    }
    // 结束当前对象、函数或条件代码块。

    // MCP 侧已写过;这里补写一次,让 NestJS 重启后仍能确认历史建议
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 900);
    // 调用 this.redis.set，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成；this＝当前对象实例。
    this.gateway.broadcastAiProposal(p.lineId, p);
    // 调用 this.gateway.broadcastAiProposal，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    this.logger.log(`建议 ${p.id}(${p.type} @ ${p.lineId}/${p.deviceId}) 已推送 UI,等待人工确认`);
    // 调用 this.logger.log，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /** 二次校验:白名单 + 可执行性 + params 值域。返回错误串表示拒绝。 */
  revalidate(p: AiProposal): string | null {
  // 定义方法 revalidate；括号中声明参数，花括号内实现逻辑。 关键字：null＝空值。
    if (!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失';
    // 判断 if (!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型；return＝返回结果并结束当前函数。
    if (!ALLOWED_TYPES.has(p.type)) return `type 不在白名单:${p.type}`;
    // 声明 不在白名单 的结构。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    if (!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`;
    // 判断 if (!EXECUTABLE_TYPES.has(p.type)) return ${p.type} 现场无对应寄存器,不可执行; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    const pv = validateParams(p.type, p.params);
    // 声明 pv，初始值由 validateParams(p.type, p.params) 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (!pv.ok) return pv.error;
    // 判断 if (!pv.ok) return pv.error; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    return null;
    // 返回 null 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
  }
  // 结束当前对象、函数或条件代码块。

  /** 原子取出并删除 —— 取出即消费,防止同一条建议被重复确认。 */
  async claim(id: string): Promise<AiProposal | null> {
  // 定义方法 claim；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数；null＝空值。
    const raw = (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string | null;
    // 声明 raw，初始值由 (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string | null 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例；null＝空值。
    if (!raw) return null;
    // 判断 if (!raw) return null; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；null＝空值。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      return JSON.parse(raw) as AiProposal;
      // 返回 JSON.parse(raw) as AiProposal 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    } catch {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      return null;
      // 返回 null 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  /** 找回已消费的建议,用于失败时还回给用户一个明确原因。 */
  async restore(p: AiProposal) {
  // 定义方法 restore；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 120);
    // 调用 this.redis.set，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  get ttlSec() {
  // 调用 ttlSec；括号中的表达式是传入的参数。
    return 900;
    // 返回 900 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
