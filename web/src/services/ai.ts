// 这一段负责配置和实现 web/src/services/ai.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import type { AiProposal, AiStreamEvent } from './types';
// 从 ./types 导入这一行列出的符号，供本文件调用。
// AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令；AiStreamEvent：项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束
import { getSocket } from './socket';
// 从 ./socket 导入这一行列出的符号，供本文件调用。
// getSocket：从 ./socket 导入的对象，用于本文件的调用或类型约束

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 根据 (import.meta.env.VITE_API_BASE as string | undefined) || '' 设置 BASE，供当前流程后续使用。
// BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果；env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_API_BASE：本处声明的字段或类型，类型为 any

let onUnauthorized: (() => void) | null = null;
// 声明 onUnauthorized，初始值由 > void) | null = null 计算得到，供当前处理流程继续使用。
// onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null
// 这一段定义 setAiUnauthorizedHandler，用于注册 AI 接口遇到 HTTP 401 时的统一处理函数。
export function setAiUnauthorizedHandler(fn: () => void) {
// 定义函数 setAiUnauthorizedHandler。
// setAiUnauthorizedHandler：注册 AI 接口遇到 HTTP 401 时的统一处理函数；fn：当前方法接收的参数，类型为 () => void
  onUnauthorized = fn;
  // 把右侧表达式的结果写入 onUnauthorized。
  // onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null；fn：当前方法接收的参数，类型为 () => void
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了注册 AI 接口遇到 HTTP 401 时的统一处理函数的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 throwFor，用于从失败的 HTTP 响应中提取错误说明并抛出异常。
async function throwFor(res: Response, method: string, path: string): Promise<never> {
// 从失败的 HTTP 响应中提取错误说明并抛出异常。
// throwFor：从失败的 HTTP 响应中提取错误说明并抛出异常；res：当前 HTTP 响应对象或 fetch 返回的响应；Response：本处保存的局部数据，类型为 { prototype: Response; new(body?: BodyInit | null,…；method：HTTP 请求方法；path：当前方法接收的参数，类型为 string；Promise：JavaScript 异步结果类型，表示操作将来完成或失败
  if (res.status === 401) {
  // 检查(res.status === 401)，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段
    onUnauthorized?.();
    // 调用 .，把括号中的值作为参数传入，供当前处理流程继续使用。
    // onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null
    throw new Error('未登录或会话已过期');
    // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
    // Error：标准错误对象类型
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  let msg = `${method} ${path} → ${res.status}`;
  // 根据 `${method} ${path} → ${res.status}` 设置 msg，用于当前收到的消息或提示文字。
  // msg：当前收到的消息或提示文字；method：HTTP 请求方法；path：当前方法接收的参数，类型为 string；res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    const j = await res.json();
    // 将 HTTP 响应正文解析为 JSON 对象，将结果保存或写入 j。
    // j：本处保存 await res.json() 的结果；res：当前 HTTP 响应对象或 fetch 返回的响应；json：将 HTTP 响应正文解析为 JSON 对象
    if (j?.msg) msg += `: ${j.msg}`;
    // 检查(j?.msg) msg += `: ${j.msg}`;，按判断结果进入对应的处理分支。
    // j：本处保存 await res.json() 的结果；msg：当前收到的消息或提示文字
    else if (j?.error) msg += `: ${j.error}`;
    // 前一条件不成立时，改为执行这一分支。
    // j：本处保存 await res.json() 的结果；error：失败原因或错误对象；msg：当前收到的消息或提示文字
  } catch {
  // 开始异常处理分支，接收前面代码抛出的错误。
  // 本行完成上面一层已说明的函数、分支或对象配置
    /* 不是 JSON */
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  throw new Error(msg);
  // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
  // Error：标准错误对象类型；msg：当前收到的消息或提示文字
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了从失败的 HTTP 响应中提取错误说明并抛出异常的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 apiAiStatus，用于查询后端 AI 服务是否可用。
export async function apiAiStatus(): Promise<{ enabled: boolean; model: string }> {
// 定义函数 apiAiStatus。
// apiAiStatus：查询后端 AI 服务是否可用；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；enabled：本处声明的字段或类型，类型为 boolean；model：发送给 Hermes 的模型标识
  const res = await fetch(`${BASE}/api/ai/status`, { credentials: 'include' });
  // 向指定 HTTP 接口发送请求，将结果保存或写入 res。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果；credentials：浏览器请求是否携带登录 Cookie 的配置
  if (!res.ok) await throwFor(res, 'GET', '/api/ai/status');
  // 检查(!res.ok) await throwFor(res, 'GET', '/api/ai/status');，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；ok：操作是否成功的布尔结果；throwFor：从失败的 HTTP 响应中提取错误说明并抛出异常
  return res.json();
  // 把res.json()作为当前函数的结果返回。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；json：将 HTTP 响应正文解析为 JSON 对象
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了查询后端 AI 服务是否可用的实现；实际结果由运行时输入和执行分支决定。

/**
 * 发送一条消息,逐块回调 AI 的输出。
 *
 * 用 fetch + ReadableStream 而不是 EventSource:本项目是 cookie 会话
 * (sameSite=lax),原生 EventSource 没有 withCredentials,跨源(dev 5173 → 3000)
 * 会丢会话、拿回 401。fetch 能带 credentials:'include',所以自己解 SSE。
 *
 * onEvent 抛错会中断本次流(用于组件卸载/切换会话时取消)。
 */
// 这一段定义 apiAiChat，用于发送 AI 对话请求并逐条消费 SSE 返回事件。
export async function apiAiChat(
// 定义函数 apiAiChat。
// apiAiChat：发送 AI 对话请求并逐条消费 SSE 返回事件
  lineId: string,
  // 设置字段 lineId，供当前处理流程继续使用。
  // lineId：产线标识，接口通常使用 line-01 等编码
  message: string,
  // 设置字段 message，供当前处理流程继续使用。
  // message：消息正文或用于展示的结果说明
  onEvent: (e: AiStreamEvent) => void,
  // 设置字段 onEvent，供当前处理流程继续使用。
  // onEvent：当前方法接收的参数，类型为 (e: AiStreamEvent) => void；e：当前方法接收的参数，类型为 AiStreamEvent；AiStreamEvent：项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束
  signal?: AbortSignal,
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // signal：用于取消异步请求的 AbortSignal 或当前点位配置，以本处定义为准；AbortSignal：本处保存的局部数据，类型为 { prototype: AbortSignal; new(): AbortSignal; /** …
): Promise<void> {
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// Promise：JavaScript 异步结果类型，表示操作将来完成或失败
  const res = await fetch(`${BASE}/api/ai/chat`, {
  // 向指定 HTTP 接口发送请求，将结果保存或写入 res。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果
    method: 'POST',
    // 声明或设置 method，用于HTTP 请求方法。
    // method：HTTP 请求方法
    credentials: 'include',
    // 声明或设置 credentials，用于浏览器请求是否携带登录 Cookie 的配置。
    // credentials：浏览器请求是否携带登录 Cookie 的配置
    headers: { 'Content-Type': 'application/json' },
    // 声明或设置 headers，用于HTTP 请求头集合。
    // headers：HTTP 请求头集合
    body: JSON.stringify({ lineId, message }),
    // 把对象编码为 JSON 文本。
    // body：当前 HTTP 请求或消息的正文；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；lineId：产线标识，接口通常使用 line-01 等编码；message：消息正文或用于展示的结果说明
    signal,
    // 把变量 signal 作为同名对象字段加入当前对象。
    // signal：用于取消异步请求的 AbortSignal 或当前点位配置，以本处定义为准
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (!res.ok) await throwFor(res, 'POST', '/api/ai/chat');
  // 检查(!res.ok) await throwFor(res, 'POST', '/api/ai/chat');，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；ok：操作是否成功的布尔结果；throwFor：从失败的 HTTP 响应中提取错误说明并抛出异常
  if (!res.body) throw new Error('浏览器不支持流式响应');
  // 条件 (!res.body) throw new Error('浏览器不支持流式响应'); 成立时按本行给出的错误终止处理。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；body：当前 HTTP 请求或消息的正文；Error：标准错误对象类型

  const reader = res.body.getReader();
  // 从响应流取得按块读取数据的读取器，将结果保存或写入 reader。
  // reader：本处保存 res.body.getReader() 的结果；res：当前 HTTP 响应对象或 fetch 返回的响应；body：当前 HTTP 请求或消息的正文；getReader：从响应流取得按块读取数据的读取器
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
      // value：当前字段或点位的实际取值；reader：本处保存 res.body.getReader() 的结果；read：读取下一块流数据或当前资源内容
      if (done) break;
      // 检查(done) break;，按判断结果进入对应的处理分支。
      // done 是上方读取器给出的结束标记；为真时跳出当前读取循环
      buf += decoder.decode(value, { stream: true });
      // 把字节序列解码成字符串，将结果保存或写入 buf。
      // buf：本处保存 '' 的结果；decoder：本处保存 new TextDecoder() 的结果；decode：把字节序列解码成字符串；value：当前字段或点位的实际取值；stream：调用 Hermes 并向前端持续输出归一化的 AI 回答事件
      // SSE 以空行分帧;半帧留在 buf 等下一块
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
          if (!line.startsWith('data:')) continue;      // event:/id:/注释行忽略
          // 检查(!line.startsWith('data:')) continue; // event:/id:/注释行忽略，按判断结果进入对应的处理分支。
          // line：本处保存的局部数据；startsWith：检查字符串是否以指定内容开头
          const payload = line.slice(5).trim();
          // 截取数组或字符串的一部分，将结果保存或写入 payload。
          // payload：消息或事件携带的数据内容；line：本处保存的局部数据；slice：截取数组或字符串的一部分；trim：移除字符串两端空白
          if (!payload) continue;
          // 检查(!payload) continue;，按判断结果进入对应的处理分支。
          // payload：消息或事件携带的数据内容
          try {
          // 开始执行可能失败的操作，错误由后续异常分支处理。
          // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
            onEvent(JSON.parse(payload) as AiStreamEvent);
            // 把 JSON 文本解析为数据对象。
            // onEvent：当前方法接收的参数，类型为 (e: AiStreamEvent) => void；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本；payload：消息或事件携带的数据内容；AiStreamEvent：项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束
          } catch {
          // 开始异常处理分支，接收前面代码抛出的错误。
          // 本行完成上面一层已说明的函数、分支或对象配置
            /* 非 JSON 帧跳过 —— 一条脏帧不该掐断整段回答 */
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
    // reader：本处保存 res.body.getReader() 的结果；cancel：本处声明的字段或类型，类型为 Promise<void>；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了发送 AI 对话请求并逐条消费 SSE 返回事件的实现；实际结果由运行时输入和执行分支决定。

/**
 * 确认一条 AI 建议 → 真正下发到 PLC。
 *
 * ⚠️ 这是 AI 链路里唯一会碰到真设备的方法,而且 level>=2 由后端 CommandGuard 把关,
 * 前端也再挡一道 —— 按钮的可用性只是体验,后端才是授权点。
 */
// 这一段定义 apiConfirmAiProposal，用于提交 AI 建议确认请求，由后端完成指令校验与下发。
export async function apiConfirmAiProposal(
// 定义函数 apiConfirmAiProposal。
// apiConfirmAiProposal：提交 AI 建议确认请求，由后端完成指令校验与下发
  id: string,
  // 设置字段 id，供当前处理流程继续使用。
  // id：当前记录或对象的标识
): Promise<{ ok: boolean; cmdId?: string; error?: string }> {
// 声明或设置 ok，用于操作是否成功的布尔结果。
// Promise：JavaScript 异步结果类型，表示操作将来完成或失败；ok：操作是否成功的布尔结果；cmdId：控制指令唯一编号，用于关联下发与回执；error：失败原因或错误对象
  const res = await fetch(`${BASE}/api/ai/proposals/${encodeURIComponent(id)}/confirm`, {
  // 向指定 HTTP 接口发送请求，将结果保存或写入 res。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果；encodeURIComponent：提供 encodeURIComponent 的本地处理逻辑；id：当前记录或对象的标识
    method: 'POST',
    // 声明或设置 method，用于HTTP 请求方法。
    // method：HTTP 请求方法
    credentials: 'include',
    // 声明或设置 credentials，用于浏览器请求是否携带登录 Cookie 的配置。
    // credentials：浏览器请求是否携带登录 Cookie 的配置
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (res.status === 401) {
  // 检查(res.status === 401)，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段
    onUnauthorized?.();
    // 调用 .，把括号中的值作为参数传入，供当前处理流程继续使用。
    // onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null
    throw new Error('未登录或会话已过期');
    // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
    // Error：标准错误对象类型
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  const body = (await res.json().catch(() => ({}))) as {
  // 将 HTTP 响应正文解析为 JSON 对象，将结果保存或写入 body。
  // body：当前 HTTP 请求或消息的正文；res：当前 HTTP 响应对象或 fetch 返回的响应；json：将 HTTP 响应正文解析为 JSON 对象；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
    ok: boolean;
    // 声明或设置 ok，用于操作是否成功的布尔结果。
    // ok：操作是否成功的布尔结果
    cmdId?: string;
    // 声明或设置 cmdId，用于控制指令唯一编号，用于关联下发与回执。
    // cmdId：控制指令唯一编号，用于关联下发与回执
    error?: string;
    // 声明或设置 error，用于失败原因或错误对象。
    // error：失败原因或错误对象
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (res.status === 403) {
  // 检查(res.status === 403)，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段
    throw new Error(body.error || '需 level >= 2 才能下发控制指令');
    // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
    // Error：标准错误对象类型；body：当前 HTTP 请求或消息的正文；error：失败原因或错误对象
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (!res.ok) throw new Error(body.error || `确认失败:${res.status}`);
  // 条件 (!res.ok) throw new Error(body.error || `确认失败:${res.status}`); 成立时按本行给出的错误终止处理。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；ok：操作是否成功的布尔结果；Error：标准错误对象类型；body：当前 HTTP 请求或消息的正文；error：失败原因或错误对象；status：当前连接、产线、请求或指令的状态字段
  return body;
  // 把body作为当前函数的结果返回。
  // body：当前 HTTP 请求或消息的正文
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了提交 AI 建议确认请求，由后端完成指令校验与下发的实现；实际结果由运行时输入和执行分支决定。

/** 订阅 AI 建议推送。约定同 onCommandAck:返回退订闭包,组件 onBeforeUnmount 里调。 */
// 这一段定义 onAiProposal，用于订阅 AI 新建议事件并返回取消订阅函数。
export function onAiProposal(cb: (p: AiProposal) => void): () => void {
// 定义函数 onAiProposal。
// onAiProposal：订阅 AI 新建议事件并返回取消订阅函数；cb：当前方法接收的参数，类型为 (p: AiProposal) => void；p：当前方法接收的参数，类型为 AiProposal；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
  const socket = getSocket();
  // 取得并复用浏览器端 Socket.IO 单例连接，将结果保存或写入 socket。
  // socket：Socket.IO 实时连接实例；getSocket：从 ./socket 导入的对象，用于本文件的调用或类型约束
  socket.on('ai_proposal', cb);
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数；cb：当前方法接收的参数，类型为 (p: AiProposal) => void
  return () => {
  // 把() => {作为当前函数的结果返回。
  // 箭头函数是返回给调用方的清理回调，稍后执行其中的释放逻辑
    socket.off('ai_proposal', cb);
    // 移除指定事件的回调函数。
    // socket：Socket.IO 实时连接实例；off：移除指定事件的回调函数；cb：当前方法接收的参数，类型为 (p: AiProposal) => void
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/services/ai.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了订阅 AI 新建议事件并返回取消订阅函数的实现；实际结果由运行时输入和执行分支决定。
