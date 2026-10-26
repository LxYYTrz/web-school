// 这一段负责后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件，为后续代码提供当前文件的处理入口。
import { Injectable, Logger, MessageEvent, ServiceUnavailableException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Injectable：NestJS 把类注册为可注入服务的装饰器；Logger：NestJS 按模块名称记录日志的工具类；MessageEvent：NestJS SSE 消息结构类型，data 保存推送的事件内容；ServiceUnavailableException：NestJS 表示服务暂不可用的 HTTP 503 异常
import { Observable, Subscriber } from 'rxjs';
// 从 rxjs 导入这一行列出的符号，供本文件调用。
// Observable：RxJS 可观察事件流类，供 NestJS SSE 接口持续输出事件；Subscriber：RxJS 流的订阅者对象类型，负责发送、结束或报告错误
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别

/**
 * Hermes 代理。Node 20 自带 fetch,能直接读 ReadableStream ——
 * 所以转发 SSE 不需要引入 axios / openai SDK 这类依赖。
 *
 * 对外把 hermes 的 OpenAI 兼容流归一化成几种事件:
 *   delta  正文增量
 *   tool   工具调用痕迹(尽力而为,hermes 的形状不保证稳定)
 *   error  出错
 *   done   结束
 */

// 这一段声明 AiStreamEvent，用于项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束。
export interface AiStreamEvent {
// 定义 AiStreamEvent，约束或实现本模块涉及的数据和行为。
// AiStreamEvent：项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束
  type: 'delta' | 'tool' | 'error' | 'done';
  // 声明或设置 type，用于当前报文、指令或对象的类别字段。
  // type：当前报文、指令或对象的类别字段
  text?: string;
  // 声明或设置 text，用于聊天正文、文本片段或界面展示文字。
  // text：聊天正文、文本片段或界面展示文字
  name?: string;
  // 声明或设置 name，用于当前对象的名称字段。
  // name：当前对象的名称字段
  message?: string;
  // 声明或设置 message，用于消息正文或用于展示的结果说明。
  // message：消息正文或用于展示的结果说明
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 AiStreamEvent 的字段或服务能力，供项目其他模块使用。

// 这一段声明 ChatBody，用于后端 AI 对话接口的请求体结构，包含产线编码与用户消息。
export interface ChatBody {
// 定义 ChatBody，约束或实现本模块涉及的数据和行为。
// ChatBody：后端 AI 对话接口的请求体结构，包含产线编码与用户消息
  lineId?: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  message?: string;
  // 声明或设置 message，用于消息正文或用于展示的结果说明。
  // message：消息正文或用于展示的结果说明
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 ChatBody 的字段或服务能力，供项目其他模块使用。

// 这一段声明 AiService，用于后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class AiService {
// 定义 AiService，约束或实现本模块涉及的数据和行为。
// AiService：后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件
  private readonly logger = new Logger(AiService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；AiService：后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件；name：当前对象的名称字段

  // 这一段定义 constructor，用于初始化 ai.service 使用的实例状态和依赖。
  constructor() {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // constructor 是类实例创建时执行的初始化方法；括号内声明构造参数
  // 这一段提供了初始化 ai.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  /** 未配置 key 时明确拒绝,而不是让前端对着一个连不上的地址干等 */
  // 这一段定义 assertConfigured，用于检查 AI 密钥等必要配置，缺失时拒绝提供 AI 服务。
  assertConfigured() {
  // 定义方法 assertConfigured；括号中声明参数，花括号内实现逻辑。
  // assertConfigured：检查 AI 密钥等必要配置，缺失时拒绝提供 AI 服务
    if (!config.ai.apiKey) {
    // 检查(!config.ai.apiKey)，按判断结果进入对应的处理分支。
    // config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；ai：config 对象上的字段或操作；apiKey：后端调用 Hermes 所用的 API 密钥
      throw new ServiceUnavailableException({
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // ServiceUnavailableException：NestJS 表示服务暂不可用的 HTTP 503 异常
        code: 503,
        // 声明或设置 code，用于业务编码、状态码或数据库查询字段，结合所在报文解释。
        // code：业务编码、状态码或数据库查询字段，结合所在报文解释
        msg: 'AI 未配置(缺 AI_API_KEY),请先启动 hermes gateway 并填写 API_SERVER_KEY',
        // 声明或设置 msg，用于当前收到的消息或提示文字。
        // msg：当前收到的消息或提示文字
      });
      // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了检查 AI 密钥等必要配置，缺失时拒绝提供 AI 服务的实现；实际结果由运行时输入和执行分支决定。

  /**
   * hermes session 按用户隔离:同一用户复用同一 session,
   * 才能保住 hermes 的 memory / skills;不同用户之间不共享上下文。
   */
  // 这一段定义 sessionId，用于根据用户生成隔离的 Hermes 会话标识。
  private sessionId(user: SessionUser) {
  // 定义方法 sessionId；括号中声明参数，花括号内实现逻辑。
  // sessionId：根据用户生成隔离的 Hermes 会话标识；user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    return `${config.ai.sessionPrefix}-${user.username}`;
    // 把`${config.ai.sessionPrefix}-${user.username}`作为当前函数的结果返回。
    // config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；ai：config 对象上的字段或操作；sessionPrefix：生成按用户隔离的 AI 会话编号的前缀；user：当前会话或调用方的用户信息；username：账号用户名
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了根据用户生成隔离的 Hermes 会话标识的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 stream，用于调用 Hermes 并向前端持续输出归一化的 AI 回答事件。
  stream(body: ChatBody, user: SessionUser): Observable<MessageEvent> {
  // 定义方法 stream；括号中声明参数，花括号内实现逻辑。
  // stream：调用 Hermes 并向前端持续输出归一化的 AI 回答事件；body：当前 HTTP 请求或消息的正文；ChatBody：后端 AI 对话接口的请求体结构，包含产线编码与用户消息；user：当前会话或调用方的用户信息；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；Observable：RxJS 可观察事件流类，供 NestJS SSE 接口持续输出事件；MessageEvent：NestJS SSE 消息结构类型，data 保存推送的事件内容
    return new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => {
    // 把new Observable<MessageEvent>((subscriber: Subscriber<MessageEvent>) => {作为当前函数的结果返回。
    // Observable：RxJS 可观察事件流类，供 NestJS SSE 接口持续输出事件；MessageEvent：NestJS SSE 消息结构类型，data 保存推送的事件内容；subscriber：当前方法接收的参数，类型为 Subscriber<MessageEvent>；Subscriber：RxJS 流的订阅者对象类型，负责发送、结束或报告错误
      const ac = new AbortController();
      // 创建或使用浏览器或 Node.js 提供的异步请求取消控制器，将结果保存或写入 ac。
      // ac：本处保存 new AbortController() 的结果；AbortController：浏览器或 Node.js 提供的异步请求取消控制器
      let cancelled = false;
      // 根据 false 设置 cancelled，用于当前流是否已被取消的标记。
      // cancelled：当前流是否已被取消的标记
      // 每次流独立的去重集合。AiService 是单例,放实例字段上会跨请求累积,
      // 导致第二次提问时第一个工具不再上报。
      const seenTools = new Set<string>();
      // 根据 new Set<string>() 设置 seenTools，用于本次回答已报告过的工具名称集合，用于去重。
      // seenTools：本次回答已报告过的工具名称集合，用于去重；Set：JavaScript 不重复元素集合

      // 这一段定义 push，用于将归一化的 AI 事件发送给尚未取消的当前订阅者。
      const push = (e: AiStreamEvent) => {
      // 根据 (e: AiStreamEvent) => { 设置 push，供当前流程后续使用。
      // push：本处保存 (e: AiStreamEvent) => { if (!cancelled) subscriber.next({ da… 的结果；e：当前方法接收的参数，类型为 AiStreamEvent；AiStreamEvent：项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束
        if (!cancelled) subscriber.next({ data: e } as MessageEvent);
        // 检查(!cancelled) subscriber.next({ data: e } as MessageEvent);，按判断结果进入对应的处理分支。
        // cancelled：当前流是否已被取消的标记；subscriber：当前方法接收的参数，类型为 Subscriber<MessageEvent>；next：向 RxJS 流的订阅者发送下一条事件；data：当前响应、事件或消息的数据内容；e：当前方法接收的参数，类型为 AiStreamEvent；MessageEvent：NestJS SSE 消息结构类型，data 保存推送的事件内容
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      // 这一段提供了将归一化的 AI 事件发送给尚未取消的当前订阅者的实现；实际结果由运行时输入和执行分支决定。

      (async () => {
      // 执行 async 对应的本地处理，使用本行提供的数据。
      // 这里创建并立即执行一个异步回调，内部步骤按 await 顺序完成
        try {
        // 开始执行可能失败的操作，错误由后续异常分支处理。
        // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
          const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
          // 向指定 HTTP 接口发送请求，将结果保存或写入 res。
          // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；ai：config 对象上的字段或操作；baseUrl：Hermes API 的服务根地址
            method: 'POST',
            // 声明或设置 method，用于HTTP 请求方法。
            // method：HTTP 请求方法
            signal: ac.signal,
            // 声明或设置 signal，用于用于取消异步请求的 AbortSignal 或当前点位配置，以本处定义为准。
            // signal：用于取消异步请求的 AbortSignal 或当前点位配置，以本处定义为准；ac：本处保存 new AbortController() 的结果
            headers: {
            // 声明或设置 headers，用于HTTP 请求头集合。
            // headers：HTTP 请求头集合
              'Content-Type': 'application/json',
              // 把这一段文字作为当前调用、数组或对象的值。
              // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
              Authorization: `Bearer ${config.ai.apiKey}`,
              // 声明或设置 Authorization，用于当前对象或接口的对应数据。
              // config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；ai：config 对象上的字段或操作；apiKey：后端调用 Hermes 所用的 API 密钥
              'X-Hermes-Session-Id': this.sessionId(user),
              // 根据用户生成隔离的 Hermes 会话标识。
              // sessionId：根据用户生成隔离的 Hermes 会话标识；user：当前会话或调用方的用户信息
            },
            // 结束当前函数、分支或对象配置，返回上一层处理流程。
            // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
            body: JSON.stringify({
            // 把对象编码为 JSON 文本。
            // body：当前 HTTP 请求或消息的正文；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
              model: config.ai.model,
              // 声明或设置 model，用于发送给 Hermes 的模型标识。
              // model：发送给 Hermes 的模型标识；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；ai：config 对象上的字段或操作
              stream: true,
              // 声明或设置 stream，用于当前对象或接口的对应数据。
              // stream：调用 Hermes 并向前端持续输出归一化的 AI 回答事件
              messages: [
              // 声明或设置 messages，用于当前对象或接口的对应数据。
              // messages 是此处声明的字段，类型或取值约束为 [
                { role: 'system', content: this.systemPrompt(body.lineId ?? 'line-01') },
                // 开始对象字面量，并在这一行设置其中列出的字段。
                // systemPrompt：为指定产线构造 AI 查询和控制建议的约束提示；body：当前 HTTP 请求或消息的正文；lineId：产线标识，接口通常使用 line-01 等编码
                { role: 'user', content: body.message ?? '' },
                // 开始对象字面量，并在这一行设置其中列出的字段。
                // body：当前 HTTP 请求或消息的正文；message：消息正文或用于展示的结果说明
              ],
              // 结束当前函数、分支或对象配置，返回上一层处理流程。
              // 此处结束当前数组参数，各元素保持上方列出的顺序
            }),
            // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
            // 本行完成上面一层已说明的函数、分支或对象配置
          });
          // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
          // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

          if (!res.ok || !res.body) {
          // 检查(!res.ok || !res.body)，按判断结果进入对应的处理分支。
          // res：当前 HTTP 响应对象或 fetch 返回的响应；ok：操作是否成功的布尔结果；body：当前 HTTP 请求或消息的正文
            const detail = await res.text().catch(() => '');
            // 将 HTTP 响应正文读取为字符串，将结果保存或写入 detail。
            // detail：本处保存 await res.text().catch(() => '') 的结果；res：当前 HTTP 响应对象或 fetch 返回的响应；text：将 HTTP 响应正文读取为字符串；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
            throw new Error(`hermes ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
            // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
            // Error：标准错误对象类型；res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段；detail：本处保存 await res.text().catch(() => '') 的结果；slice：截取数组或字符串的一部分
          }
          // 结束当前函数、分支或对象配置，返回上一层处理流程。
          // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

          for await (const evt of this.parseSse(res.body)) {
          // 按这一行指定的集合或范围逐个执行循环体。
          // evt：本处保存的局部数据；parseSse：逐块读取上游 SSE 文本，拆分并解析完整事件；res：当前 HTTP 响应对象或 fetch 返回的响应；body：当前 HTTP 请求或消息的正文
            if (cancelled) break;
            // 检查(cancelled) break;，按判断结果进入对应的处理分支。
            // cancelled：当前流是否已被取消的标记
            this.handleChunk(evt, push, seenTools);
            // 解析一条 AI 返回数据，提取正文增量或工具调用信息。
            // handleChunk：解析一条 AI 返回数据，提取正文增量或工具调用信息；evt：本处保存的局部数据；push：本处保存 (e: AiStreamEvent) => { if (!cancelled) subscriber.next({ da… 的结果；seenTools：本次回答已报告过的工具名称集合，用于去重
          }
          // 结束当前函数、分支或对象配置，返回上一层处理流程。
          // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
          push({ type: 'done' });
          // 向数组末尾追加元素。
          // push：向数组末尾追加元素；type：当前报文、指令或对象的类别字段
          subscriber.complete();
          // 结束 RxJS 事件流。
          // subscriber：当前方法接收的参数，类型为 Subscriber<MessageEvent>；complete：结束 RxJS 事件流
        } catch (e) {
        // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
        // e：本处保存的局部数据
          if (!cancelled) {
          // 检查(!cancelled)，按判断结果进入对应的处理分支。
          // cancelled：当前流是否已被取消的标记
            const msg = (e as Error).message;
            // 根据 (e as Error).message 设置 msg，用于当前收到的消息或提示文字。
            // msg：当前收到的消息或提示文字；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
            // 浏览器直接关掉抽屉属于正常结束,不是故障
            if (!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`);
            // 检查(!/abort/i.test(msg)) this.logger.error(`hermes 流失败: ${msg}`);，按判断结果进入对应的处理分支。
            // test：本处声明的字段或类型，类型为 boolean；msg：当前收到的消息或提示文字；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准
            push({ type: 'error', message: msg });
            // 向数组末尾追加元素。
            // push：向数组末尾追加元素；type：当前报文、指令或对象的类别字段；message：消息正文或用于展示的结果说明；msg：当前收到的消息或提示文字
          }
          // 结束当前函数、分支或对象配置，返回上一层处理流程。
          // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
          subscriber.complete();
          // 结束 RxJS 事件流。
          // subscriber：当前方法接收的参数，类型为 Subscriber<MessageEvent>；complete：结束 RxJS 事件流
        }
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      })();
      // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
      // 本行完成上面一层已说明的函数、分支或对象配置

      return () => {
      // 把() => {作为当前函数的结果返回。
      // 箭头函数是返回给调用方的清理回调，稍后执行其中的释放逻辑
        cancelled = true;
        // 把右侧表达式的结果写入 cancelled。
        // cancelled：当前流是否已被取消的标记
        ac.abort();
        // 取消关联的异步请求。
        // ac：本处保存 new AbortController() 的结果；abort：取消关联的异步请求
      };
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了调用 Hermes 并向前端持续输出归一化的 AI 回答事件的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 逐条解析 SSE。刻意写得宽松:hermes 偶尔会插入 keepalive 注释行或
   * 非标准字段,遇到不认识的**跳过**而不是抛错 —— 一条脏帧不该掐断整段回答。
   */
  // 这一段定义 parseSse，用于逐块读取上游 SSE 文本，拆分并解析完整事件。
  private async *parseSse(body: ReadableStream<Uint8Array>): AsyncGenerator<any, void, void> {
  // 逐块读取上游 SSE 文本，拆分并解析完整事件。
  // parseSse：逐块读取上游 SSE 文本，拆分并解析完整事件；body：当前 HTTP 请求或消息的正文；ReadableStream：本处保存的局部数据，类型为 { prototype: ReadableStream; new(underlyingSource:…；Uint8Array：本处保存的局部数据，类型为 Uint8ArrayConstructor
    const reader = body.getReader();
    // 从响应流取得按块读取数据的读取器，将结果保存或写入 reader。
    // reader：本处保存 body.getReader() 的结果；body：当前 HTTP 请求或消息的正文；getReader：从响应流取得按块读取数据的读取器
    const decoder = new TextDecoder();
    // 创建或使用将网络字节解码成文本的标准解码器，将结果保存或写入 decoder。
    // decoder：本处保存 new TextDecoder() 的结果；TextDecoder：将网络字节解码成文本的标准解码器
    let buf = '';
    // 根据 '' 设置 buf，供当前流程后续使用。
    // buf：本处保存 '' 的结果
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      for (;;) {
      // 按这一行指定的集合或范围逐个执行循环体。
      // 此循环没有固定结束条件，循环体在读完数据或遇到错误时主动 break 或 return
        const { done, value } = await reader.read();
        // 读取下一块流数据或当前资源内容。
        // value：当前字段或点位的实际取值；reader：本处保存 body.getReader() 的结果；read：读取下一块流数据或当前资源内容
        if (done) break;
        // 检查(done) break;，按判断结果进入对应的处理分支。
        // done 是上方读取器给出的结束标记；为真时跳出当前读取循环
        buf += decoder.decode(value, { stream: true });
        // 把字节序列解码成字符串，将结果保存或写入 buf。
        // buf：本处保存 '' 的结果；decoder：本处保存 new TextDecoder() 的结果；decode：把字节序列解码成字符串；value：当前字段或点位的实际取值；stream：调用 Hermes 并向前端持续输出归一化的 AI 回答事件
        // SSE 以空行分帧;残留半帧留在 buf 里等下一块
        let idx: number;
        // 声明变量 idx，类型为 number；其值稍后赋入。
        // idx：本处保存的局部数据，类型为 number
        while ((idx = buf.indexOf('\n\n')) >= 0) {
        // 持续检查((idx = buf.indexOf('\n\n')) >= 0)，按判断结果进入对应的处理分支。
        // idx：本处保存的局部数据，类型为 number；buf：本处保存 '' 的结果；indexOf：本处声明的字段或类型，类型为 number
          const frame = buf.slice(0, idx);
          // 截取数组或字符串的一部分，将结果保存或写入 frame。
          // frame：本处保存 buf.slice(0, idx) 的结果；buf：本处保存 '' 的结果；slice：截取数组或字符串的一部分；idx：本处保存的局部数据，类型为 number
          buf = buf.slice(idx + 2);
          // 把右侧表达式的结果写入 buf。
          // buf：本处保存 '' 的结果；slice：截取数组或字符串的一部分；idx：本处保存的局部数据，类型为 number
          for (const line of frame.split('\n')) {
          // 按这一行指定的集合或范围逐个执行循环体。
          // line：本处保存的局部数据；frame：本处保存 buf.slice(0, idx) 的结果；split：按分隔符拆分字符串
            if (!line.startsWith('data:')) continue;         // event:/id:/注释行一律忽略
            // 检查(!line.startsWith('data:')) continue; // event:/id:/注释行一律忽略，按判断结果进入对应的处理分支。
            // line：本处保存的局部数据；startsWith：检查字符串是否以指定内容开头
            const data = line.slice(5).trim();
            // 截取数组或字符串的一部分，将结果保存或写入 data。
            // data：当前响应、事件或消息的数据内容；line：本处保存的局部数据；slice：截取数组或字符串的一部分；trim：移除字符串两端空白
            if (!data || data === '[DONE]') continue;
            // 检查(!data || data === '[DONE]') continue;，按判断结果进入对应的处理分支。
            // data：当前响应、事件或消息的数据内容
            try {
            // 开始执行可能失败的操作，错误由后续异常分支处理。
            // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
              yield JSON.parse(data);
              // 把 JSON 文本解析为数据对象。
              // JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本；data：当前响应、事件或消息的数据内容
            } catch {
            // 开始异常处理分支，接收前面代码抛出的错误。
            // 本行完成上面一层已说明的函数、分支或对象配置
              /* 非 JSON 帧:跳过 */
            }
            // 结束当前函数、分支或对象配置，返回上一层处理流程。
            // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
          }
          // 结束当前函数、分支或对象配置，返回上一层处理流程。
          // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
        }
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    } finally {
    // 开始收尾分支，无论前面的操作成功或失败都执行。
    // 本行完成上面一层已说明的函数、分支或对象配置
      reader.cancel().catch(() => undefined);
      // 取消当前等待中的请求或任务。
      // reader：本处保存 body.getReader() 的结果；cancel：本处声明的字段或类型，类型为 Promise<void>；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了逐块读取上游 SSE 文本，拆分并解析完整事件的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 handleChunk，用于解析一条 AI 返回数据，提取正文增量或工具调用信息。
  private handleChunk(c: any, push: (e: AiStreamEvent) => void, seenTools: Set<string>) {
  // 定义方法 handleChunk；括号中声明参数，花括号内实现逻辑。
  // handleChunk：解析一条 AI 返回数据，提取正文增量或工具调用信息；c：当前方法接收的参数，类型为 any；push：当前方法接收的参数，类型为 (e: AiStreamEvent) => void；e：当前方法接收的参数，类型为 AiStreamEvent；AiStreamEvent：项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束；seenTools：本次回答已报告过的工具名称集合，用于去重；Set：JavaScript 不重复元素集合
    // 工具事件在**顶层**,且 tool 直接是字符串(实测 2026-10-16):
    //   {"tool":"mcp__line_twin__get_line_snapshot","status":"running","emoji":"⚡"}
    // 不是对象,也没有嵌在 choices 里。
    if (typeof c?.tool === 'string') {
    // 检查(typeof c?.tool === 'string')，按判断结果进入对应的处理分支。
    // c：当前方法接收的参数，类型为 any；tool：c 对象上的字段或操作
      const name = this.friendlyTool(c.tool);
      // 将工具标识转换为适合界面展示的名称，将结果保存或写入 name。
      // name：当前对象的名称字段；friendlyTool：将工具标识转换为适合界面展示的名称；c：当前方法接收的参数，类型为 any；tool：c 对象上的字段或操作
      if (name && !seenTools.has(name)) {
      // 检查(name && !seenTools.has(name))，按判断结果进入对应的处理分支。
      // name：当前对象的名称字段；seenTools：本次回答已报告过的工具名称集合，用于去重；has：检查集合是否包含指定元素或映射是否存在指定键
        seenTools.add(name);   // 同一工具 running/completed 会各来一帧,只报一次
        // 将元素加入集合或将子节点挂到场景对象。
        // seenTools：本次回答已报告过的工具名称集合，用于去重；add：将元素加入集合或将子节点挂到场景对象；name：当前对象的名称字段
        push({ type: 'tool', name });
        // 向数组末尾追加元素。
        // push：向数组末尾追加元素；type：当前报文、指令或对象的类别字段；name：当前对象的名称字段
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      return;
      // 立即结束当前函数，不返回具体值。
      // 当前函数在此处结束，调用方不会从这条路径收到业务数据
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    // 正文:OpenAI 兼容形状 choices[].delta.content
    // 注意 delta.reasoning_content 是模型的思考过程,故意不转发 ——
    // 那是内部推理链,混进回答里会让人以为 AI 在自言自语。
    const text = c?.choices?.[0]?.delta?.content;
    // 根据 c?.choices?.[0]?.delta?.content 设置 text，用于聊天正文、文本片段或界面展示文字。
    // text：聊天正文、文本片段或界面展示文字；c：当前方法接收的参数，类型为 any；choices：c 对象上的字段或操作；delta：c?.choices?.[0] 对象上的字段或操作；content：c?.choices?.[0]?.delta 对象上的字段或操作
    if (typeof text === 'string' && text) {
    // 检查(typeof text === 'string' && text)，按判断结果进入对应的处理分支。
    // text：聊天正文、文本片段或界面展示文字
      push({ type: 'delta', text });
      // 向数组末尾追加元素。
      // push：向数组末尾追加元素；type：当前报文、指令或对象的类别字段；text：聊天正文、文本片段或界面展示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了解析一条 AI 返回数据，提取正文增量或工具调用信息的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 工具名转成人话。
   * hermes 把 MCP 工具名成 mcp__<server>__<tool> 前缀(这里是 mcp__line_twin__),
   * 直接显示既长又难看;另外 tool_describe 是 hermes 内部的工具元信息读取,
   * 和业务无关,不该出现在「查了什么」里。
   */
  // 这一段定义 friendlyTool，用于将工具标识转换为适合界面展示的名称。
  private friendlyTool(raw: string): string | null {
  // 定义方法 friendlyTool；括号中声明参数，花括号内实现逻辑。
  // friendlyTool：将工具标识转换为适合界面展示的名称；raw：当前方法接收的参数，类型为 string
    if (raw === 'tool_describe' || raw.startsWith('hermes_')) return null;
    // 检查(raw === 'tool_describe' || raw.startsWith('hermes_')) return null;，按判断结果进入对应的处理分支。
    // raw：当前方法接收的参数，类型为 string；startsWith：检查字符串是否以指定内容开头
    return raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '');
    // 把raw.replace(/^mcp__[^_]+(?:_[^_]+)*__/, '')作为当前函数的结果返回。
    // raw：当前方法接收的参数，类型为 string；replace：按匹配规则替换字符串内容
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了将工具标识转换为适合界面展示的名称的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 每轮都带。hermes 侧 MCP 工具描述已经给了产线背景,
   * 这里只补「不许吹牛」的硬约束 —— LLM 很容易在建议还没执行时说成「已经停机」。
   *
   * ⚠️ 通道边界(2026-10-23):飞书通道允许 AI 直控产线,MCP 里为此加了
   *    run_operation / execute_action。**网页抽屉这条路不走直控** ——
   *    网页上所有控制动作都必须由人在卡片里点确认。
   *    所以这里显式禁用直控工具,避免模型在网页端绕过人工确认直接下发。
   */
  // 这一段定义 systemPrompt，用于为指定产线构造 AI 查询和控制建议的约束提示。
  private systemPrompt(lineId: string) {
  // 定义方法 systemPrompt；括号中声明参数，花括号内实现逻辑。
  // systemPrompt：为指定产线构造 AI 查询和控制建议的约束提示；lineId：产线标识，接口通常使用 line-01 等编码
    return [
    // 把[作为当前函数的结果返回。
    // 方括号中的条目组成返回数组，调用方按顺序使用其中的数据
      `你是产线数字孪生平台的运维助手,当前产线 ${lineId}。`,
      // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
      // lineId：产线标识，接口通常使用 line-01 等编码
      '用中文回答,结论要有工具查证支撑,不要凭空推断。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '需要改变产线状态时调用 propose_action 提交建议,由值班人人工确认后才执行。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '本通道(网页助手)禁止直接下发控制指令:不要调用 run_operation / execute_action,',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      '一律用 propose_action 走人工确认流程。',
      // 把这一段文字作为当前调用、数组或对象的值。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      'IMPORTANT: 建议提交后并未执行。在人工确认之前,严禁使用「已停机」「已启动」' +
      // 把这一段文字与下一段拼接，供当前处理流程继续使用。
      // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
        '「已执行」这类过去完成式的表述,一律用「建议」「待确认」等措辞。',
        // 把这一段文字作为当前调用、数组或对象的值。
        // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
    ].join('\n');
    // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
    // join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了为指定产线构造 AI 查询和控制建议的约束提示的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端 Hermes 代理服务，把上游回答归一化成前端 SSE 事件所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 AiService 的字段或服务能力，供项目其他模块使用。
