// 这一段负责配置和实现 web/src/services/control.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { getSocket } from './socket';
// 从 ./socket 导入这一行列出的符号，供本文件调用。
// getSocket：从 ./socket 导入的对象，用于本文件的调用或类型约束
import type { CommandAck } from './types';
// 从 ./types 导入这一行列出的符号，供本文件调用。
// CommandAck：项目数据契约中的指令回执结构，通过 cmdId 关联下发指令

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 根据 (import.meta.env.VITE_API_BASE as string | undefined) || '' 设置 BASE，供当前流程后续使用。
// BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果；env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_API_BASE：本处声明的字段或类型，类型为 any

// 401 全局跳登录(对齐 services/auth.ts 的 setUnauthorizedHandler)
let onUnauthorized: (() => void) | null = null;
// 声明 onUnauthorized，初始值由 > void) | null = null 计算得到，供当前处理流程继续使用。
// onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null
// 这一段定义 setControlUnauthorizedHandler，用于注册控制接口遇到登录失效时的统一处理函数。
export function setControlUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }
// 定义函数 setControlUnauthorizedHandler。
// setControlUnauthorizedHandler：注册控制接口遇到登录失效时的统一处理函数；fn：当前方法接收的参数，类型为 () => void；onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null
// 这一段提供了注册控制接口遇到登录失效时的统一处理函数的实现；实际结果由运行时输入和执行分支决定。

// 这一段声明 SendCommandParams，用于前端定义的指令请求结构，包含目标设备、指令类型和参数。
export interface SendCommandParams {
// 定义 SendCommandParams，约束或实现本模块涉及的数据和行为。
// SendCommandParams：前端定义的指令请求结构，包含目标设备、指令类型和参数
  deviceId: string;
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  type: 'start' | 'stop' | 'reset' | 'changeover' | 'mode_set' | 'alarm_clear' | string;
  // 声明或设置 type，用于当前报文、指令或对象的类别字段。
  // type：当前报文、指令或对象的类别字段
  params?: Record<string, unknown>;
  // 声明或设置 params，用于指令附加参数对象。
  // params：指令附加参数对象；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 SendCommandParams 的字段或服务能力，供项目其他模块使用。

// 这一段声明 SendCommandResult，用于前端定义的指令提交结果结构，包含成功标记、指令号或错误。
export interface SendCommandResult {
// 定义 SendCommandResult，约束或实现本模块涉及的数据和行为。
// SendCommandResult：前端定义的指令提交结果结构，包含成功标记、指令号或错误
  ok: boolean;
  // 声明或设置 ok，用于操作是否成功的布尔结果。
  // ok：操作是否成功的布尔结果
  cmdId?: string;
  // 声明或设置 cmdId，用于控制指令唯一编号，用于关联下发与回执。
  // cmdId：控制指令唯一编号，用于关联下发与回执
  error?: string;
  // 声明或设置 error，用于失败原因或错误对象。
  // error：失败原因或错误对象
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 SendCommandResult 的字段或服务能力，供项目其他模块使用。

// POST /api/lines/{lineId}/commands
// 后端:AuthGuard + CommandGuard(level>=2) + 契约 v1.1 白名单
// 这一段定义 apiSendCommand，用于通过 HTTP 向后端提交设备控制指令并处理失败响应。
export async function apiSendCommand(
// 定义函数 apiSendCommand。
// apiSendCommand：通过 HTTP 向后端提交设备控制指令并处理失败响应
  lineId: string,
  // 后端:AuthGuard + CommandGuard(level>=2) + 契约 v1.1 白名单。
  // lineId：产线标识，接口通常使用 line-01 等编码
  cmd: SendCommandParams,
  // 设置字段 cmd，供当前处理流程继续使用。
  // cmd：当前方法接收的参数，类型为 SendCommandParams；SendCommandParams：前端定义的指令请求结构，包含目标设备、指令类型和参数
): Promise<SendCommandResult> {
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// Promise：JavaScript 异步结果类型，表示操作将来完成或失败；SendCommandResult：前端定义的指令提交结果结构，包含成功标记、指令号或错误
  const res = await fetch(`${BASE}/api/lines/${lineId}/commands`, {
  // 向指定 HTTP 接口发送请求，将结果保存或写入 res。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果；lineId：产线标识，接口通常使用 line-01 等编码
    method: 'POST',
    // 声明或设置 method，用于HTTP 请求方法。
    // method：HTTP 请求方法
    credentials: 'include',
    // 声明或设置 credentials，用于浏览器请求是否携带登录 Cookie 的配置。
    // credentials：浏览器请求是否携带登录 Cookie 的配置
    headers: { 'Content-Type': 'application/json' },
    // 声明或设置 headers，用于HTTP 请求头集合。
    // headers：HTTP 请求头集合
    body: JSON.stringify(cmd),
    // 把对象编码为 JSON 文本。
    // body：当前 HTTP 请求或消息的正文；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；cmd：当前方法接收的参数，类型为 SendCommandParams
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
  if (!res.ok) {
  // 检查(!res.ok)，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；ok：操作是否成功的布尔结果
    let msg = `POST commands → ${res.status}`;
    // 根据 `POST commands → ${res.status}` 设置 msg，用于当前收到的消息或提示文字。
    // msg：当前收到的消息或提示文字；res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段
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
    } catch { /* 不是 JSON */ }
    // 开始异常处理分支，接收前面代码抛出的错误。
    // 本行完成上面一层已说明的函数、分支或对象配置
    throw new Error(msg);
    // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
    // Error：标准错误对象类型；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return res.json() as Promise<SendCommandResult>;
  // 把res.json() as Promise<SendCommandResult>作为当前函数的结果返回。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；json：将 HTTP 响应正文解析为 JSON 对象；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；SendCommandResult：前端定义的指令提交结果结构，包含成功标记、指令号或错误
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了通过 HTTP 向后端提交设备控制指令并处理失败响应的实现；实际结果由运行时输入和执行分支决定。

// 订阅 socket 'command_ack'(由后端 telemetry.gateway.broadcastCommandAck 转发)
// 返回取消订阅函数
// 这一段定义 onCommandAck，用于订阅控制指令回执并返回取消订阅函数。
export function onCommandAck(cb: (ack: CommandAck) => void): () => void {
// 定义函数 onCommandAck。
// onCommandAck：订阅控制指令回执并返回取消订阅函数；cb：当前方法接收的参数，类型为 (ack: CommandAck) => void；ack：当前方法接收的参数，类型为 CommandAck；CommandAck：项目数据契约中的指令回执结构，通过 cmdId 关联下发指令
  const socket = getSocket();
  // 取得并复用浏览器端 Socket.IO 单例连接，将结果保存或写入 socket。
  // socket：Socket.IO 实时连接实例；getSocket：从 ./socket 导入的对象，用于本文件的调用或类型约束
  // 这一段定义 handler，用于把收到的指令回执转交调用方注册的回调。
  const handler = (msg: CommandAck) => cb(msg);
  // 执行 cb 对应的本地处理，使用本行提供的数据，将结果保存或写入 handler。
  // handler：本处保存 (msg: CommandAck) => cb(msg) 的结果；msg：当前收到的消息或提示文字；CommandAck：项目数据契约中的指令回执结构，通过 cmdId 关联下发指令；cb：当前方法接收的参数，类型为 (ack: CommandAck) => void
  // 这一段提供了把收到的指令回执转交调用方注册的回调的实现；实际结果由运行时输入和执行分支决定。
  socket.on('command_ack', handler);
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数；handler：本处保存 (msg: CommandAck) => cb(msg) 的结果
  return () => { socket.off('command_ack', handler); };
  // 把() => { socket.off('command_ack', handler); }作为当前函数的结果返回。
  // socket：Socket.IO 实时连接实例；off：移除指定事件的回调函数；handler：本处保存 (msg: CommandAck) => cb(msg) 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/services/control.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了订阅控制指令回执并返回取消订阅函数的实现；实际结果由运行时输入和执行分支决定。