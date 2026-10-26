// 这一段负责配置和实现 server/src/ai/ai.controller.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import {
// 开始列出本文件从其他模块导入的类型或运行时对象。
// 大括号内逐项列出从后续模块路径导入的类型或运行时对象
  BadRequestException, Body, Controller, Get, Inject, Logger, Param, Post, Sse, UseGuards,
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // BadRequestException：NestJS 表示请求参数错误的 HTTP 400 异常；Body：NestJS 从请求体提取参数的装饰器；Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器；Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器；Inject：NestJS 按指定令牌注入依赖的装饰器；Logger：NestJS 按模块名称记录日志的工具类；Param：NestJS 从 URL 路径提取参数的装饰器；Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器；Sse：NestJS 把方法返回的事件流暴露为 SSE 接口的装饰器；UseGuards：NestJS 在处理请求前应用权限守卫的装饰器
} from '@nestjs/common';
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 本行完成上面一层已说明的函数、分支或对象配置
import { MessageEvent } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// MessageEvent：NestJS SSE 消息结构类型，data 保存推送的事件内容
import { Observable } from 'rxjs';
// 从 rxjs 导入这一行列出的符号，供本文件调用。
// Observable：RxJS 可观察事件流类，供 NestJS SSE 接口持续输出事件
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。
// Pool：pg 驱动提供的 PostgreSQL 连接池类
import { AuthGuard } from '../auth/auth.guard';
// 从 ../auth/auth.guard 导入这一行列出的符号，供本文件调用。
// AuthGuard：后端登录守卫，检查会话中是否存在用户
import { CurrentUser } from '../auth/current-user.decorator';
// 从 ../auth/current-user.decorator 导入这一行列出的符号，供本文件调用。
// CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别
import { CommandGuard } from '../command/command.guard';
// 从 ../command/command.guard 导入这一行列出的符号，供本文件调用。
// CommandGuard：后端控制权限守卫，限制可下发指令的操作级别
import { CommandService } from '../command/command.service';
// 从 ../command/command.service 导入这一行列出的符号，供本文件调用。
// CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值
import { AiService, ChatBody } from './ai.service';
// 从 ./ai.service 导入这一行列出的符号，供本文件调用。
// AiService：后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件；ChatBody：后端 AI 对话接口的请求体结构，包含产线编码与用户消息
import { ProposalService } from './proposal.service';
// 从 ./proposal.service 导入这一行列出的符号，供本文件调用。
// ProposalService：后端 AI 建议服务，读取、校验并原子领取待确认建议

/**
 * AI 助手端点。
 *
 * 权限模型:
 *   chat    —— 任何登录用户(AI 能看只读数据)
 *   confirm —— level >= 2,与手动按控制按钮的门槛完全一致,
 *              复用同一对 AuthGuard + CommandGuard,语义不分叉。
 */
// 这一段声明 AiController，用于AiController 的相关数据和行为。
@Controller('api/ai')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
// Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器
export class AiController {
// 定义 AiController，约束或实现本模块涉及的数据和行为。
// AiController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  private readonly logger = new Logger(AiController.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；name：当前对象的名称字段

  // 这一段定义 constructor，用于初始化 ai.controller 使用的实例状态和依赖。
  constructor(
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // constructor 是类实例创建时执行的初始化方法；括号内声明构造参数
    private readonly ai: AiService,
    // 声明类属性或构造参数 ai，类型为 AiService。
    // ai：当前方法接收的参数，类型为 AiService；AiService：后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件
    private readonly proposals: ProposalService,
    // 声明类属性或构造参数 proposals，类型为 ProposalService。
    // proposals：当前方法接收的参数，类型为 ProposalService；ProposalService：后端 AI 建议服务，读取、校验并原子领取待确认建议
    private readonly commands: CommandService,
    // 声明类属性或构造参数 commands，类型为 CommandService。
    // commands：当前方法接收的参数，类型为 CommandService；CommandService：后端指令服务，执行白名单校验、审计落库和 MQTT 下发
    @Inject(PG_POOL) private readonly pool: Pool,
    // 装饰器 Inject：按令牌注入指定依赖。
    // Inject：NestJS 按指定令牌注入依赖的装饰器；PG_POOL：infra/tokens 定义的数据库连接池注入令牌；pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
  // 构造函数只保存参数属性或注入依赖，没有额外的初始化语句
  // 这一段提供了初始化 ai.controller 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  /** AI 是否可用。给抽屉做灰态用,不额外探测 hermes 以免每次开抽屉都打一次端口。 */
  // 这一段定义 status，用于返回当前 AI 配置是否可用的状态。
  @Get('status')
  // 装饰器 Get：把方法绑定到 GET 路由。
  // Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器
  @UseGuards(AuthGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  // UseGuards：NestJS 在处理请求前应用权限守卫的装饰器；AuthGuard：后端登录守卫，检查会话中是否存在用户
  status() {
  // 定义方法 status；括号中声明参数，花括号内实现逻辑。
  // status：当前连接、产线、请求或指令的状态字段
    return {
    // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
      enabled: Boolean(config.ai.apiKey),
      // 执行 Boolean 对应的本地处理，使用本行提供的数据。
      // Boolean：将值转换为布尔结果的 JavaScript 构造函数；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；ai：config 对象上的字段或操作；apiKey：后端调用 Hermes 所用的 API 密钥
      model: config.ai.model,
      // 声明或设置 model，用于发送给 Hermes 的模型标识。
      // model：发送给 Hermes 的模型标识；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；ai：config 对象上的字段或操作
    };
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了返回当前 AI 配置是否可用的状态的实现；实际结果由运行时输入和执行分支决定。

  // 注意顺序:controller 里的 SSE 必须由 HTTP 方法装饰器先声明路径和方法,
  // @Sse() 只负责标记「这个响应是事件流」。少了 @Post 路由根本不会注册(404)。
  // 这一段定义 chat，用于校验用户输入并转发 AI 流式对话。
  @Post('chat')
  // 装饰器 Post：把方法绑定到 POST 路由。
  // Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器
  @Sse('chat')
  // 装饰器 Sse：给后面的类、方法或参数附加元数据。
  // Sse：NestJS 把方法返回的事件流暴露为 SSE 接口的装饰器
  @UseGuards(AuthGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  // UseGuards：NestJS 在处理请求前应用权限守卫的装饰器；AuthGuard：后端登录守卫，检查会话中是否存在用户
  chat(@Body() body: ChatBody, @CurrentUser() user: SessionUser): Observable<MessageEvent> {
  // 定义方法 chat；括号中声明参数，花括号内实现逻辑。
  // chat：校验用户输入并转发 AI 流式对话；Body：NestJS 从请求体提取参数的装饰器；body：当前 HTTP 请求或消息的正文；ChatBody：后端 AI 对话接口的请求体结构，包含产线编码与用户消息；CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束；user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；Observable：RxJS 可观察事件流类，供 NestJS SSE 接口持续输出事件；MessageEvent：NestJS SSE 消息结构类型，data 保存推送的事件内容
    this.ai.assertConfigured();
    // 检查 AI 密钥等必要配置，缺失时拒绝提供 AI 服务。
    // ai：当前方法接收的参数，类型为 AiService；assertConfigured：检查 AI 密钥等必要配置，缺失时拒绝提供 AI 服务
    if (!body?.message?.trim()) {
    // 检查(!body?.message?.trim())，按判断结果进入对应的处理分支。
    // body：当前 HTTP 请求或消息的正文；message：消息正文或用于展示的结果说明；trim：移除字符串两端空白
      throw new BadRequestException({ code: 400, msg: 'message 不能为空' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // BadRequestException：NestJS 表示请求参数错误的 HTTP 400 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    return this.ai.stream(body, user);
    // 把this.ai.stream(body, user)作为当前函数的结果返回。
    // ai：当前方法接收的参数，类型为 AiService；stream：调用 Hermes 并向前端持续输出归一化的 AI 回答事件；body：当前 HTTP 请求或消息的正文；user：当前会话或调用方的用户信息
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了校验用户输入并转发 AI 流式对话的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 人工确认 AI 建议 → 真正下发。
   *
   * 复用 CommandService.issue():类型白名单、params 值域、catalog 编码解析、
   * control_commands 落库、MQTT 发布全部沿用现成实现,这里不做第二套。
   * 额外补一条 audit_logs(action='command:execute:ai-confirmed'),
   * 让审计能区分「人自己按的」和「AI 建议后人按的」。
   *
   * operator 只取自 session —— 提案体里就算塞了 username 也一律忽略(契约 §5 第 2 条)。
   */
  // 这一段定义 confirm，用于领取并重新校验 AI 建议，调用控制服务提交真实指令。
  @Post('proposals/:id/confirm')
  // 装饰器 Post：把方法绑定到 POST 路由。
  // Post：NestJS 将方法绑定到 HTTP POST 路由的装饰器
  @UseGuards(AuthGuard, CommandGuard)
  // 装饰器 UseGuards：执行路由前先应用权限守卫。
  // UseGuards：NestJS 在处理请求前应用权限守卫的装饰器；AuthGuard：后端登录守卫，检查会话中是否存在用户；CommandGuard：后端控制权限守卫，限制可下发指令的操作级别
  async confirm(@Param('id') id: string, @CurrentUser() user: SessionUser) {
  // 定义方法 confirm；括号中声明参数，花括号内实现逻辑。
  // confirm：领取并重新校验 AI 建议，调用控制服务提交真实指令；Param：NestJS 从 URL 路径提取参数的装饰器；id：当前记录或对象的标识；CurrentUser：从 ../auth/current-user.decorator 导入的对象，用于本文件的调用或类型约束；user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    const p = await this.proposals.claim(id);
    // 原子领取并删除待确认建议，防止重复执行，将结果保存或写入 p。
    // p：本处保存 await this.proposals.claim(id) 的结果；proposals：当前方法接收的参数，类型为 ProposalService；claim：原子领取并删除待确认建议，防止重复执行；id：当前记录或对象的标识
    if (!p) return { ok: false, error: '建议不存在、已确认过或已过期' };
    // 检查(!p) return { ok: false, error: '建议不存在、已确认过或已过期' };，按判断结果进入对应的处理分支。
    // p：本处保存 await this.proposals.claim(id) 的结果；ok：操作是否成功的布尔结果；error：失败原因或错误对象

    // 第三层校验:MCP 侧放过、Redis 二次校验放过,下发前再确认一次
    const bad = this.proposals.revalidate(p);
    // 确认前重新检查建议的状态、时效、类型和参数，将结果保存或写入 bad。
    // bad：本处保存 this.proposals.revalidate(p) 的结果；proposals：当前方法接收的参数，类型为 ProposalService；revalidate：确认前重新检查建议的状态、时效、类型和参数；p：本处保存 await this.proposals.claim(id) 的结果
    if (bad) return { ok: false, error: `建议未通过下发前校验:${bad}` };
    // 检查(bad) return { ok: false, error: `建议未通过下发前校验:${bad}` };，按判断结果进入对应的处理分支。
    // bad：本处保存 this.proposals.revalidate(p) 的结果；ok：操作是否成功的布尔结果；error：失败原因或错误对象

    const r = await this.commands.issue(p.lineId, {
    // 校验指令和目标设备，写入审计记录并经 MQTT 下发，将结果保存或写入 r。
    // r：本处保存 await this.commands.issue(p.lineId, { deviceId: p.deviceId, … 的结果；commands：当前方法接收的参数，类型为 CommandService；issue：校验指令和目标设备，写入审计记录并经 MQTT 下发；p：本处保存 await this.proposals.claim(id) 的结果；lineId：产线标识，接口通常使用 line-01 等编码
      deviceId: p.deviceId,
      // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
      // deviceId：设备标识，接口使用配置中的设备编码；p：本处保存 await this.proposals.claim(id) 的结果
      type: p.type,
      // 声明或设置 type，用于当前报文、指令或对象的类别字段。
      // type：当前报文、指令或对象的类别字段；p：本处保存 await this.proposals.claim(id) 的结果
      params: p.params,
      // 声明或设置 params，用于指令附加参数对象。
      // params：指令附加参数对象；p：本处保存 await this.proposals.claim(id) 的结果
    }, user);
    // 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
    // user：当前会话或调用方的用户信息

    if (!r.ok) {
    // 检查(!r.ok)，按判断结果进入对应的处理分支。
    // r：本处保存 await this.commands.issue(p.lineId, { deviceId: p.deviceId, … 的结果；ok：操作是否成功的布尔结果
      // 短暂失败(比如 DB 抖了一下)不该让人白提一次建议,还回去并缩短 TTL
      await this.proposals.restore(p);
      // 将未能完成提交的建议恢复到 Redis 并保留剩余时效。
      // proposals：当前方法接收的参数，类型为 ProposalService；restore：将未能完成提交的建议恢复到 Redis 并保留剩余时效；p：本处保存 await this.proposals.claim(id) 的结果
      return r;
      // 把r作为当前函数的结果返回。
      // r：本处保存 await this.commands.issue(p.lineId, { deviceId: p.deviceId, … 的结果
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    this.pool
    // 读取 this.pool，作为下一行链式方法调用的接收对象。
    // pool：注入或创建的 PostgreSQL 连接池
      .query(
      // 通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果。
      // query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        `INSERT INTO audit_logs (user_id, action, target, detail)
         SELECT id, 'command:execute:ai-confirmed', $2, $3::jsonb
           FROM users WHERE username = $1`,
           // 指定读取来源表，供当前处理流程继续使用。
           // users 是保存早期用户数据的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
        [
        // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
        // 方括号内依次列出传给当前调用的数组参数或待保存的数据项
          user.username,
          // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
          // user：当前会话或调用方的用户信息；username：账号用户名
          `${p.type} @ ${p.lineId}/${p.deviceId}`,
          // 构造模板字符串，把 ${...} 中的值插入目标路径或文本。
          // p：本处保存 await this.proposals.claim(id) 的结果；type：当前报文、指令或对象的类别字段；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码
          JSON.stringify({
          // 把对象编码为 JSON 文本。
          // JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
            cmdId: r.cmdId,
            // 声明或设置 cmdId，用于控制指令唯一编号，用于关联下发与回执。
            // cmdId：控制指令唯一编号，用于关联下发与回执；r：本处保存 await this.commands.issue(p.lineId, { deviceId: p.deviceId, … 的结果
            proposalId: p.id,
            // 声明或设置 proposalId，用于当前对象或接口的对应数据。
            // p：本处保存 await this.proposals.claim(id) 的结果；id：当前记录或对象的标识
            aiReason: p.reason,
            // 声明或设置 aiReason，用于当前对象或接口的对应数据。
            // p：本处保存 await this.proposals.claim(id) 的结果；reason：AI 给出控制建议的理由
            params: p.params,
            // 声明或设置 params，用于指令附加参数对象。
            // params：指令附加参数对象；p：本处保存 await this.proposals.claim(id) 的结果
          }),
          // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
          // 本行完成上面一层已说明的函数、分支或对象配置
        ],
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 此处结束当前数组参数，各元素保持上方列出的顺序
      )
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 此处结束当前调用的参数列表，随后使用该调用的返回结果
      .catch((e) => this.logger.error(`写 AI 确认审计失败: ${e.message}`));
      // 为前面的异步操作添加失败处理；出错时由回调记录原因或更新状态。
      // catch：本处声明的字段或类型，类型为 Promise<T | TResult>；e：当前方法接收的参数；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明

    return { ok: true, cmdId: r.cmdId, proposalId: p.id };
    // 把{ ok: true, cmdId: r.cmdId, proposalId: p.id }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；cmdId：控制指令唯一编号，用于关联下发与回执；r：本处保存 await this.commands.issue(p.lineId, { deviceId: p.deviceId, … 的结果；p：本处保存 await this.proposals.claim(id) 的结果；id：当前记录或对象的标识
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了领取并重新校验 AI 建议，调用控制服务提交真实指令的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/ai/ai.controller.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 AiController 的字段或服务能力，供项目其他模块使用。
