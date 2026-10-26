// 这一段负责后端 AI 建议服务，读取、校验并原子领取待确认建议，为后续代码提供当前文件的处理入口。
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Inject：NestJS 按指定令牌注入依赖的装饰器；Injectable：NestJS 把类注册为可注入服务的装饰器；Logger：NestJS 按模块名称记录日志的工具类；OnModuleDestroy：NestJS 模块销毁清理回调接口；OnModuleInit：NestJS 模块初始化回调接口
import Redis from 'ioredis';
// 从 ioredis 导入这一行列出的符号，供本文件调用。
// Redis：ioredis 提供的 Redis 客户端类
import { REDIS } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。
// REDIS：infra/tokens 定义的 Redis 客户端注入令牌
import { TelemetryGateway } from '../realtime/telemetry.gateway';
// 从 ../realtime/telemetry.gateway 导入这一行列出的符号，供本文件调用。
// TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据
import { ALLOWED_TYPES, EXECUTABLE_TYPES, validateParams } from '../command/command-contract';
// 从 ../command/command-contract 导入这一行列出的符号，供本文件调用。
// ALLOWED_TYPES：从控制契约加载的合法指令类型集合；EXECUTABLE_TYPES：控制契约中已有现场写点支持的指令类型集合；validateParams：从 ../command/command-contract 导入的对象，用于本文件的调用或类型约束

/**
 * AI 建议的中转站。
 *
 * 写入方是 mcp/line-twin-mcp.js 里的 propose_action 工具 —— 它只校验 + 落 Redis +
 * publish,没有任何下发能力。本服务订阅频道后做**二次校验**再推给 UI:
 * agent 是概率模型,MCP 侧放行过一次不代表这里就该放行,
 * 控制链路上的每一层都应该假设上一层可能被绕过。
 */

// 这一段声明 AiProposal，用于项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令。
export interface AiProposal {
// 定义 AiProposal，约束或实现本模块涉及的数据和行为。
// AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
  id: string;
  // 声明或设置 id，用于当前记录或对象的标识。
  // id：当前记录或对象的标识
  lineId: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  deviceId: string;
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  type: string;
  // 声明或设置 type，用于当前报文、指令或对象的类别字段。
  // type：当前报文、指令或对象的类别字段
  params: Record<string, unknown>;
  // 声明或设置 params，用于指令附加参数对象。
  // params：指令附加参数对象；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
  reason: string;
  // 声明或设置 reason，用于AI 给出控制建议的理由。
  // reason：AI 给出控制建议的理由
  status: 'pending';
  // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
  // status：当前连接、产线、请求或指令的状态字段
  createdAt: number;
  // 声明或设置 createdAt，用于记录创建时的时间值。
  // createdAt：记录创建时的时间值
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 AiProposal 的字段或服务能力，供项目其他模块使用。

const PROPOSAL_CHANNEL = 'ai:proposal';
// 根据 'ai:proposal' 设置 PROPOSAL_CHANNEL，供当前流程后续使用。
// PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果
// 这一段定义 keyOf，用于根据建议编号生成 Redis 建议缓存键。
const keyOf = (id: string) => `ai:proposal:${id}`;
// 根据 (id: string) => `ai:proposal:${id}` 设置 keyOf，供当前流程后续使用。
// keyOf：根据建议编号生成 Redis 建议缓存键；id：当前记录或对象的标识
// 这一段提供了根据建议编号生成 Redis 建议缓存键的实现；实际结果由运行时输入和执行分支决定。

// 取出即删除,保证同一条建议只能被确认一次。
// 用 Lua 而不是 GETDEL —— Memurai 的 GETDEL 支持随版本而异,eval 是通用能力。
const CLAIM_LUA = `
local v = redis.call('GET', KEYS[1])
if v == false then return nil end
redis.call('DEL', KEYS[1])
return v
`;
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定

// 这一段声明 ProposalService，用于后端 AI 建议服务，读取、校验并原子领取待确认建议。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class ProposalService implements OnModuleInit, OnModuleDestroy {
// 定义 ProposalService，约束或实现本模块涉及的数据和行为。
// ProposalService：后端 AI 建议服务，读取、校验并原子领取待确认建议；OnModuleInit：NestJS 模块初始化回调接口；OnModuleDestroy：NestJS 模块销毁清理回调接口
  private readonly logger = new Logger(ProposalService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；ProposalService：后端 AI 建议服务，读取、校验并原子领取待确认建议；name：当前对象的名称字段
  // ioredis 的订阅连接不能同时跑普通命令,必须单独开一条
  private sub?: Redis;
  // 声明或设置 sub，用于当前对象或接口的对应数据。
  // sub：本处声明的字段或类型，类型为 Redis；Redis：ioredis 提供的 Redis 客户端类

  // 这一段定义 constructor，用于初始化 proposal.service 使用的实例状态和依赖。
  constructor(
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // constructor 是类实例创建时执行的初始化方法；括号内声明构造参数
    @Inject(REDIS) private readonly redis: Redis,
    // 装饰器 Inject：按令牌注入指定依赖。
    // Inject：NestJS 按指定令牌注入依赖的装饰器；REDIS：infra/tokens 定义的 Redis 客户端注入令牌；redis：注入或创建的 Redis 客户端；Redis：ioredis 提供的 Redis 客户端类
    private readonly gateway: TelemetryGateway,
    // 声明类属性或构造参数 gateway，类型为 TelemetryGateway。
    // gateway：当前方法接收的参数，类型为 TelemetryGateway；TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
  // 构造函数只保存参数属性或注入依赖，没有额外的初始化语句
  // 这一段提供了初始化 proposal.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onModuleInit，用于在模块启动时初始化 proposal.service 所需的连接、订阅或周期任务。
  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
  // onModuleInit：在模块启动时初始化 proposal.service 所需的连接、订阅或周期任务
    this.sub = this.redis.duplicate();
    // 把右侧表达式的结果写入 this.sub。
    // sub：本处声明的字段或类型，类型为 Redis；redis：注入或创建的 Redis 客户端；duplicate：创建使用相同配置的独立 Redis 连接
    this.sub.on('error', (e) => this.logger.error(`pubsub 连接错误: ${e.message}`));
    // 注册指定消息事件的回调。
    // sub：本处声明的字段或类型，类型为 Redis；on：注册指定事件的回调函数；e：当前方法接收的参数；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
    this.sub.subscribe(PROPOSAL_CHANNEL, (err) => {
    // 订阅消息主题、频道或事件流。
    // sub：本处声明的字段或类型，类型为 Redis；subscribe：订阅消息主题、频道或事件流；PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果；err：当前方法接收的参数
      if (err) return this.logger.error(`订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}`);
      // 检查(err) return this.logger.error(`订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}`);，按判断结果进入对应的处理分支。
      // err：当前方法接收的参数；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果；message：消息正文或用于展示的结果说明
      this.logger.log(`已订阅 ${PROPOSAL_CHANNEL}`);
      // 输出调试或运行日志。
      // logger：当前模块的日志记录器；log：输出调试或运行日志；PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    this.sub.on('message', (channel, raw) => {
    // 注册指定消息事件的回调。
    // sub：本处声明的字段或类型，类型为 Redis；on：注册指定事件的回调函数；channel：当前方法接收的参数；raw：当前方法接收的参数
      if (channel !== PROPOSAL_CHANNEL) return;
      // 检查(channel !== PROPOSAL_CHANNEL) return;，按判断结果进入对应的处理分支。
      // channel：当前方法接收的参数；PROPOSAL_CHANNEL：本处保存 'ai:proposal' 的结果
      void this.onProposalMessage(raw);
      // 把 Redis 建议频道消息解析后推送到对应产线界面。
      // onProposalMessage：把 Redis 建议频道消息解析后推送到对应产线界面；raw：当前方法接收的参数
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块启动时初始化 proposal.service 所需的连接、订阅或周期任务的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onModuleDestroy，用于在模块关闭时清理 proposal.service 持有的连接、订阅或计时器。
  async onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
  // onModuleDestroy：在模块关闭时清理 proposal.service 持有的连接、订阅或计时器
    if (this.sub) await this.sub.quit().catch(() => undefined);
    // 检查(this.sub) await this.sub.quit().catch(() => undefined);，按判断结果进入对应的处理分支。
    // sub：本处声明的字段或类型，类型为 Redis；quit：请求 Redis 客户端正常断开连接；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块关闭时清理 proposal.service 持有的连接、订阅或计时器的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onProposalMessage，用于把 Redis 建议频道消息解析后推送到对应产线界面。
  private async onProposalMessage(raw: string) {
  // 定义方法 onProposalMessage；括号中声明参数，花括号内实现逻辑。
  // onProposalMessage：把 Redis 建议频道消息解析后推送到对应产线界面；raw：当前方法接收的参数，类型为 string
    let p: AiProposal;
    // 声明变量 p，类型为 AiProposal；其值稍后赋入。
    // p：本处保存的局部数据，类型为 AiProposal；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      p = JSON.parse(raw) as AiProposal;
      // 把 JSON 文本解析为数据对象，将结果保存或写入 p。
      // p：本处保存的局部数据，类型为 AiProposal；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本；raw：当前方法接收的参数，类型为 string；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
    } catch (e) {
    // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
    // e：本处保存的局部数据
      return this.logger.warn(`丢弃非法提案 JSON: ${(e as Error).message}`);
      // 把this.logger.warn(`丢弃非法提案 JSON: ${(e as Error).message}`)作为当前函数的结果返回。
      // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    const bad = this.revalidate(p);
    // 确认前重新检查建议的状态、时效、类型和参数，将结果保存或写入 bad。
    // bad：本处保存 this.revalidate(p) 的结果；revalidate：确认前重新检查建议的状态、时效、类型和参数；p：本处保存的局部数据，类型为 AiProposal
    if (bad) {
    // 检查(bad)，按判断结果进入对应的处理分支。
    // bad：本处保存 this.revalidate(p) 的结果
      // 这是安全事件:MCP 侧本不该放出这种东西。记日志但不推 UI。
      return this.logger.warn(`拒绝二次校验未通过的提案 ${p?.id}: ${bad}`);
      // 把this.logger.warn(`拒绝二次校验未通过的提案 ${p?.id}: ${bad}`)作为当前函数的结果返回。
      // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；p：本处保存的局部数据，类型为 AiProposal；id：当前记录或对象的标识；bad：本处保存 this.revalidate(p) 的结果
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    // MCP 侧已写过;这里补写一次,让 NestJS 重启后仍能确认历史建议
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 900);
    // 把对象编码为 JSON 文本。
    // redis：注入或创建的 Redis 客户端；set：按键写入当前映射、缓存或对象的值；keyOf：根据建议编号生成 Redis 建议缓存键；p：本处保存的局部数据，类型为 AiProposal；id：当前记录或对象的标识；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
    this.gateway.broadcastAiProposal(p.lineId, p);
    // 向产线房间广播 AI 待确认建议。
    // gateway：当前方法接收的参数，类型为 TelemetryGateway；broadcastAiProposal：向产线房间广播 AI 待确认建议；p：本处保存的局部数据，类型为 AiProposal；lineId：产线标识，接口通常使用 line-01 等编码
    this.logger.log(`建议 ${p.id}(${p.type} @ ${p.lineId}/${p.deviceId}) 已推送 UI,等待人工确认`);
    // 输出调试或运行日志。
    // logger：当前模块的日志记录器；log：输出调试或运行日志；p：本处保存的局部数据，类型为 AiProposal；id：当前记录或对象的标识；type：当前报文、指令或对象的类别字段；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把 Redis 建议频道消息解析后推送到对应产线界面的实现；实际结果由运行时输入和执行分支决定。

  /** 二次校验:白名单 + 可执行性 + params 值域。返回错误串表示拒绝。 */
  // 这一段定义 revalidate，用于确认前重新检查建议的状态、时效、类型和参数。
  revalidate(p: AiProposal): string | null {
  // 定义方法 revalidate；括号中声明参数，花括号内实现逻辑。
  // revalidate：确认前重新检查建议的状态、时效、类型和参数；p：当前方法接收的参数，类型为 AiProposal；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
    if (!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失';
    // 检查(!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失';，按判断结果进入对应的处理分支。
    // p：当前方法接收的参数，类型为 AiProposal；id：当前记录或对象的标识；lineId：产线标识，接口通常使用 line-01 等编码
    if (!ALLOWED_TYPES.has(p.type)) return `type 不在白名单:${p.type}`;
    // 检查(!ALLOWED_TYPES.has(p.type)) return `type 不在白名单:${p.type}`;，按判断结果进入对应的处理分支。
    // ALLOWED_TYPES：从控制契约加载的合法指令类型集合；has：检查集合是否包含指定元素或映射是否存在指定键；p：当前方法接收的参数，类型为 AiProposal；type：当前报文、指令或对象的类别字段
    if (!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`;
    // 检查(!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`;，按判断结果进入对应的处理分支。
    // EXECUTABLE_TYPES：控制契约中已有现场写点支持的指令类型集合；has：检查集合是否包含指定元素或映射是否存在指定键；p：当前方法接收的参数，类型为 AiProposal；type：当前报文、指令或对象的类别字段
    const pv = validateParams(p.type, p.params);
    // 按控制契约校验指令附加参数，将结果保存或写入 pv。
    // pv：本处保存 validateParams(p.type, p.params) 的结果；validateParams：从 ../command/command-contract 导入的对象，用于本文件的调用或类型约束；p：当前方法接收的参数，类型为 AiProposal；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
    if (!pv.ok) return pv.error;
    // 检查(!pv.ok) return pv.error;，按判断结果进入对应的处理分支。
    // pv：本处保存 validateParams(p.type, p.params) 的结果；ok：操作是否成功的布尔结果；error：失败原因或错误对象
    return null;
    // 把null作为当前函数的结果返回。
    // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了确认前重新检查建议的状态、时效、类型和参数的实现；实际结果由运行时输入和执行分支决定。

  /** 原子取出并删除 —— 取出即消费,防止同一条建议被重复确认。 */
  // 这一段定义 claim，用于原子领取并删除待确认建议，防止重复执行。
  async claim(id: string): Promise<AiProposal | null> {
  // 定义方法 claim；括号中声明参数，花括号内实现逻辑。
  // claim：原子领取并删除待确认建议，防止重复执行；id：当前记录或对象的标识；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
    const raw = (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string | null;
    // 执行 eval 对应的本地处理，使用本行提供的数据，将结果保存或写入 raw。
    // raw：本处保存 (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string |… 的结果；redis：注入或创建的 Redis 客户端；eval：本处声明的字段或类型，类型为 Result<unknown, Context>；CLAIM_LUA：本处保存 ` local v = redis.call('GET', KEYS[1]) if v == false then re… 的结果；keyOf：根据建议编号生成 Redis 建议缓存键；id：当前记录或对象的标识
    if (!raw) return null;
    // 检查(!raw) return null;，按判断结果进入对应的处理分支。
    // raw：本处保存 (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string |… 的结果
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      return JSON.parse(raw) as AiProposal;
      // 把JSON.parse(raw) as AiProposal作为当前函数的结果返回。
      // JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本；raw：本处保存 (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string |… 的结果；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
    } catch {
    // 开始异常处理分支，接收前面代码抛出的错误。
    // 本行完成上面一层已说明的函数、分支或对象配置
      return null;
      // 把null作为当前函数的结果返回。
      // null 表示当前查询或转换未得到可用结果，调用方需要处理缺失情况
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了原子领取并删除待确认建议，防止重复执行的实现；实际结果由运行时输入和执行分支决定。

  /** 找回已消费的建议,用于失败时还回给用户一个明确原因。 */
  // 这一段定义 restore，用于将未能完成提交的建议恢复到 Redis 并保留剩余时效。
  async restore(p: AiProposal) {
  // 定义方法 restore；括号中声明参数，花括号内实现逻辑。
  // restore：将未能完成提交的建议恢复到 Redis 并保留剩余时效；p：当前方法接收的参数，类型为 AiProposal；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 120);
    // 把对象编码为 JSON 文本。
    // redis：注入或创建的 Redis 客户端；set：按键写入当前映射、缓存或对象的值；keyOf：根据建议编号生成 Redis 建议缓存键；p：当前方法接收的参数，类型为 AiProposal；id：当前记录或对象的标识；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了将未能完成提交的建议恢复到 Redis 并保留剩余时效的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 ttlSec，用于读取建议缓存剩余有效秒数。
  get ttlSec() {
  // 读取建议缓存剩余有效秒数。
  // ttlSec：读取建议缓存剩余有效秒数
    return 900;
    // 把900作为当前函数的结果返回。
    // 本行数值是当前计算或配置的结果，由调用方按照所在函数的单位使用
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了读取建议缓存剩余有效秒数的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端 AI 建议服务，读取、校验并原子领取待确认建议所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 ProposalService 的字段或服务能力，供项目其他模块使用。
