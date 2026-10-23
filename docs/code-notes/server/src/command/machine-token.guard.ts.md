# server/src/command/machine-token.guard.ts 逐行说明

[打开源码](../../../../../server/src/command/machine-token.guard.ts) · 68 行 · 41 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 21 | <code>import {</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 22 | <code>CanActivate,</code> | 续写当前表达式、对象、类型或调用。 |
| 23 | <code>ExecutionContext,</code> | 续写当前表达式、对象、类型或调用。 |
| 24 | <code>ForbiddenException,</code> | 续写当前表达式、对象、类型或调用。 |
| 25 | <code>Injectable,</code> | 续写当前表达式、对象、类型或调用。 |
| 26 | <code>Logger,</code> | 续写当前表达式、对象、类型或调用。 |
| 27 | <code>ServiceUnavailableException,</code> | 续写当前表达式、对象、类型或调用。 |
| 28 | <code>UnauthorizedException,</code> | 续写当前表达式、对象、类型或调用。 |
| 29 | <code>} from '@nestjs/common';</code> | 续写当前表达式、对象、类型或调用。 关键字：`from`＝指定导入来源。 |
| 30 | <code>import { createHash, timingSafeEqual } from 'crypto';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 31 | <code>import type { Request } from 'express';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 32 | <code>import { config } from '../config/configuration';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 34 | <code>@Injectable()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 35 | <code>export class MachineTokenGuard implements CanActivate {</code> | 声明 `MachineTokenGuard` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。 |
| 36 | <code>private readonly logger = new Logger(MachineTokenGuard.name);</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 38 | <code>canActivate(context: ExecutionContext): boolean {</code> | 定义或调用 `canActivate`，参数由括号给出。 |
| 39 | <code>const token = config.machine.commandToken;</code> | 声明变量 `token` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 42 | <code>if (!token) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 43 | <code>throw new ServiceUnavailableException({</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 44 | <code>code: 503,</code> | 设置字段 `code`。 |
| 45 | <code>msg: '机器通道未启用(后端未配置 MACHINE_COMMAND_TOKEN)',</code> | 设置字段 `msg`。 |
| 46 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 47 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 49 | <code>const req = context.switchToHttp().getRequest&lt;Request&gt;();</code> | 声明变量 `req` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 50 | <code>const remote = req.socket.remoteAddress;</code> | 声明变量 `remote` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 51 | <code>if (remote !== '127.0.0.1' &amp;&amp; remote !== '::1' &amp;&amp; remote !== '::ffff:127.0.0.1') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 52 | <code>throw new ForbiddenException({ code: 403, msg: '机器通道仅允许本机调用' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 53 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 54 | <code>const provided = String(req.headers['x-machine-token'] ?? '');</code> | 声明变量 `provided` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 55 | <code>if (!provided) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 56 | <code>throw new UnauthorizedException({ code: 401, msg: '缺少 x-machine-token' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 57 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 60 | <code>const a = createHash('sha256').update(provided).digest();</code> | 声明变量 `a` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 61 | <code>const b = createHash('sha256').update(token).digest();</code> | 声明变量 `b` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 62 | <code>if (!timingSafeEqual(a, b)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 63 | <code>this.logger.warn(`机器通道凭据校验失败,来源 IP=${req.ip ?? 'unknown'}`);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 64 | <code>throw new UnauthorizedException({ code: 401, msg: '机器凭据无效' });</code> | 抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。 |
| 65 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 66 | <code>return true;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 67 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 68 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
