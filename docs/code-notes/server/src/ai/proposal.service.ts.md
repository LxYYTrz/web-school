# server/src/ai/proposal.service.ts 逐行注释

[打开源码](../../../../../server/src/ai/proposal.service.ts) · 116 行 · 85 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 2 行**

```text
import Redis from 'ioredis';
// 注释：从 ioredis 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 3 行**

```text
import { REDIS } from '../infra/tokens';
// 注释：从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
import { TelemetryGateway } from '../realtime/telemetry.gateway';
// 注释：从 ../realtime/telemetry.gateway 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 5 行**

```text
import { ALLOWED_TYPES, EXECUTABLE_TYPES, validateParams } from '../command/command-contract';
// 注释：从 ../command/command-contract 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 16 行**

```text
export interface AiProposal {
// 注释：声明 `AiProposal` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 17 行**

```text
  id: string;
// 注释：设置字段 `id`。
```

**源码第 18 行**

```text
  lineId: string;
// 注释：设置字段 `lineId`。
```

**源码第 19 行**

```text
  deviceId: string;
// 注释：设置字段 `deviceId`。
```

**源码第 20 行**

```text
  type: string;
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 21 行**

```text
  params: Record<string, unknown>;
// 注释：设置字段 `params`。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 22 行**

```text
  reason: string;
// 注释：设置字段 `reason`。
```

**源码第 23 行**

```text
  status: 'pending';
// 注释：设置字段 `status`。
```

**源码第 24 行**

```text
  createdAt: number;
// 注释：设置字段 `createdAt`。
```

**源码第 25 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 27 行**

```text
const PROPOSAL_CHANNEL = 'ai:proposal';
// 注释：声明 PROPOSAL_CHANNEL，初始值由 'ai:proposal' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 28 行**

```text
const keyOf = (id: string) => `ai:proposal:${id}`;
// 注释：声明 keyOf，初始值由 (id: string) => `ai:proposal:${id}` 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 32 行**

```text
const CLAIM_LUA = `
// 注释：声明 CLAIM_LUA，初始值由 ` 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 33 行**

```text
local v = redis.call('GET', KEYS[1])
// 注释：调用 redis.call；括号中的表达式是传入的参数。
```

**源码第 34 行**

```text
if v == false then return nil end
// 注释：判断 if v == false then return nil end 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`false`＝布尔假值；`return`＝返回结果并结束当前函数。
```

**源码第 35 行**

```text
redis.call('DEL', KEYS[1])
// 注释：调用 redis.call，把括号中的值作为参数传入。
```

**源码第 36 行**

```text
return v
// 注释：返回 v 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 37 行**

```text
`;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 39 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 40 行**

```text
export class ProposalService implements OnModuleInit, OnModuleDestroy {
// 注释：声明 `ProposalService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。
```

**源码第 41 行**

```text
  private readonly logger = new Logger(ProposalService.name);
// 注释：调用 Logger；括号中的表达式是传入的参数。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。
```

**源码第 43 行**

```text
  private sub?: Redis;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问。
```

**源码第 45 行**

```text
  constructor(
// 注释：调用 constructor，把括号中的值作为参数传入。
```

**源码第 46 行**

```text
    @Inject(REDIS) private readonly redis: Redis,
// 注释：装饰器 Inject：按令牌注入指定依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 47 行**

```text
    private readonly gateway: TelemetryGateway,
// 注释：声明类属性或构造参数 gateway，类型为 TelemetryGateway。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 48 行**

```text
  ) {}
// 注释：结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
```

**源码第 50 行**

```text
  onModuleInit() {
// 注释：定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
```

**源码第 51 行**

```text
    this.sub = this.redis.duplicate();
// 注释：把右侧表达式的结果写入 this.sub。 关键字：`this`＝当前对象实例。
```

**源码第 52 行**

```text
    this.sub.on('error', (e) => this.logger.error(`pubsub 连接错误: ${e.message}`));
// 注释：调用 this.sub.on，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 53 行**

```text
    this.sub.subscribe(PROPOSAL_CHANNEL, (err) => {
// 注释：调用 this.sub.subscribe，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 54 行**

```text
      if (err) return this.logger.error(`订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}`);
// 注释：判断 if (err) return this.logger.error(`订阅 ${PROPOSAL_CHANNEL} 失败: ${err.message}`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 55 行**

```text
      this.logger.log(`已订阅 ${PROPOSAL_CHANNEL}`);
// 注释：调用 this.logger.log，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 56 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 57 行**

```text
    this.sub.on('message', (channel, raw) => {
// 注释：调用 this.sub.on，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 58 行**

```text
      if (channel !== PROPOSAL_CHANNEL) return;
// 注释：判断 if (channel !== PROPOSAL_CHANNEL) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 59 行**

```text
      void this.onProposalMessage(raw);
// 注释：调用 this.onProposalMessage；括号中的表达式是传入的参数。 关键字：`void`＝表示没有返回值；`this`＝当前对象实例。
```

**源码第 60 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 61 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 63 行**

```text
  async onModuleDestroy() {
// 注释：定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 64 行**

```text
    if (this.sub) await this.sub.quit().catch(() => undefined);
// 注释：判断 if (this.sub) await this.sub.quit().catch(() => undefined); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例；`await`＝等待异步操作完成；`catch`＝捕获异常；`undefined`＝未定义值。
```

**源码第 65 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 67 行**

```text
  private async onProposalMessage(raw: string) {
// 注释：定义方法 onProposalMessage；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数。
```

**源码第 68 行**

```text
    let p: AiProposal;
// 注释：声明变量 p，类型为 AiProposal；其值稍后赋入。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 69 行**

```text
    try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 70 行**

```text
      p = JSON.parse(raw) as AiProposal;
// 注释：把右侧表达式的结果写入 p。
```

**源码第 71 行**

```text
    } catch (e) {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 72 行**

```text
      return this.logger.warn(`丢弃非法提案 JSON: ${(e as Error).message}`);
// 注释：返回 this.logger.warn(`丢弃非法提案 JSON: ${(e as Error).message}`) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 73 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 75 行**

```text
    const bad = this.revalidate(p);
// 注释：声明 bad，初始值由 this.revalidate(p) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 76 行**

```text
    if (bad) {
// 注释：判断 if (bad) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 78 行**

```text
      return this.logger.warn(`拒绝二次校验未通过的提案 ${p?.id}: ${bad}`);
// 注释：返回 this.logger.warn(`拒绝二次校验未通过的提案 ${p?.id}: ${bad}`) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`this`＝当前对象实例。
```

**源码第 79 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 82 行**

```text
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 900);
// 注释：调用 this.redis.set，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 83 行**

```text
    this.gateway.broadcastAiProposal(p.lineId, p);
// 注释：调用 this.gateway.broadcastAiProposal，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 84 行**

```text
    this.logger.log(`建议 ${p.id}(${p.type} @ ${p.lineId}/${p.deviceId}) 已推送 UI,等待人工确认`);
// 注释：调用 this.logger.log，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 85 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 88 行**

```text
  revalidate(p: AiProposal): string | null {
// 注释：定义方法 revalidate；括号中声明参数，花括号内实现逻辑。 关键字：`null`＝空值。
```

**源码第 89 行**

```text
    if (!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失';
// 注释：判断 if (!p || typeof p.id !== 'string' || typeof p.lineId !== 'string') return '字段缺失'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型；`return`＝返回结果并结束当前函数。
```

**源码第 90 行**

```text
    if (!ALLOWED_TYPES.has(p.type)) return `type 不在白名单:${p.type}`;
// 注释：声明 `不在白名单` 的结构。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 91 行**

```text
    if (!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`;
// 注释：判断 if (!EXECUTABLE_TYPES.has(p.type)) return `${p.type} 现场无对应寄存器,不可执行`; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 92 行**

```text
    const pv = validateParams(p.type, p.params);
// 注释：声明 pv，初始值由 validateParams(p.type, p.params) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 93 行**

```text
    if (!pv.ok) return pv.error;
// 注释：判断 if (!pv.ok) return pv.error; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 94 行**

```text
    return null;
// 注释：返回 null 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 95 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 98 行**

```text
  async claim(id: string): Promise<AiProposal | null> {
// 注释：定义方法 claim；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数；`null`＝空值。
```

**源码第 99 行**

```text
    const raw = (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string | null;
// 注释：声明 raw，初始值由 (await this.redis.eval(CLAIM_LUA, 1, keyOf(id))) as string | null 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例；`null`＝空值。
```

**源码第 100 行**

```text
    if (!raw) return null;
// 注释：判断 if (!raw) return null; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 101 行**

```text
    try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 102 行**

```text
      return JSON.parse(raw) as AiProposal;
// 注释：返回 JSON.parse(raw) as AiProposal 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 103 行**

```text
    } catch {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 104 行**

```text
      return null;
// 注释：返回 null 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值。
```

**源码第 105 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 106 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 109 行**

```text
  async restore(p: AiProposal) {
// 注释：定义方法 restore；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 110 行**

```text
    await this.redis.set(keyOf(p.id), JSON.stringify(p), 'EX', 120);
// 注释：调用 this.redis.set，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 111 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 113 行**

```text
  get ttlSec() {
// 注释：调用 ttlSec；括号中的表达式是传入的参数。
```

**源码第 114 行**

```text
    return 900;
// 注释：返回 900 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 115 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 116 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
