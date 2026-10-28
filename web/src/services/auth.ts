// 这一段负责配置和实现 web/src/services/auth.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import type { AuthUser, Level } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。
// AuthUser：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束；Level：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束

// HTTP 基址:同源(开发走 Vite 代理 / 生产走 Nginx 同源反代)
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 根据 (import.meta.env.VITE_API_BASE as string | undefined) || '' 设置 BASE，供当前流程后续使用。
// BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果；env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_API_BASE：本处声明的字段或类型，类型为 any

// 401 时全局跳登录页(避免每个调用方重复处理)
// 由 router 注入:router/index.ts 里 router.push('/login')
let onUnauthorized: (() => void) | null = null;
// 401 时全局跳登录页(避免每个调用方重复处理)。
// onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null
// 这一段定义 setUnauthorizedHandler，用于注册认证和用户接口遇到 HTTP 401 时的统一处理函数。
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }
// 定义函数 setUnauthorizedHandler。
// setUnauthorizedHandler：注册认证和用户接口遇到 HTTP 401 时的统一处理函数；fn：当前方法接收的参数，类型为 () => void；onUnauthorized：本处保存 null 的结果，类型为 (() => void) | null
// 这一段提供了注册认证和用户接口遇到 HTTP 401 时的统一处理函数的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 http，用于发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误。
async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
// 定义函数 http，供当前处理流程继续使用。
// http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；method：HTTP 请求方法；path：当前方法接收的参数，类型为 string；body：当前 HTTP 请求或消息的正文；Promise：JavaScript 异步结果类型，表示操作将来完成或失败
  const res = await fetch(BASE + path, {
  // 向指定 HTTP 接口发送请求，将结果保存或写入 res。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；fetch：发起 HTTP 请求并返回 Response 的标准函数；BASE：本处保存 (import.meta.env.VITE_API_BASE as string | undefined) || '' 的结果；path：当前方法接收的参数，类型为 string
    method,
    // 把变量 method 作为同名对象字段加入当前对象。
    // method：HTTP 请求方法

    // credentials: include 让浏览器按 Cookie 规则发送适用的登录凭据，也接收适用的 Set-Cookie 响应。
    // 后端 cookie-session 才能从后续请求读取签名会话。这个选项不会自行创建登录身份，也不会替代浏览器的 Cookie 与跨域规则。

    credentials: 'include',  // cookie-session 必须
    // 让这个请求按浏览器规则携带适用的登录 Cookie，使后端能关联之前的登录会话。
    // credentials 是浏览器 fetch 的选项，include 表示包含凭据；它不绕过 Cookie、跨域或 SameSite 规则，也不自行生成登录身份。
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    // 声明或设置 headers，用于HTTP 请求头集合。
    // headers：HTTP 请求头集合；body：当前 HTTP 请求或消息的正文
    body: body ? JSON.stringify(body) : undefined,
    // 把对象编码为 JSON 文本。
    // body：当前 HTTP 请求或消息的正文；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本
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
    } catch { /* 不是 JSON */ }
    // 开始异常处理分支，接收前面代码抛出的错误。
    // 本行完成上面一层已说明的函数、分支或对象配置
    throw new Error(msg);
    // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
    // Error：标准错误对象类型；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 204 等无 body
  if (res.status === 204) return undefined as unknown as T;
  // 检查(res.status === 204) return undefined as unknown as T;，按判断结果进入对应的处理分支。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；status：当前连接、产线、请求或指令的状态字段
  return res.json() as Promise<T>;
  // 把res.json() as Promise<T>作为当前函数的结果返回。
  // res：当前 HTTP 响应对象或 fetch 返回的响应；json：将 HTTP 响应正文解析为 JSON 对象；Promise：JavaScript 异步结果类型，表示操作将来完成或失败
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误的实现；实际结果由运行时输入和执行分支决定。

// ===== 鉴权 API =====

// 这一段定义 apiLogin，用于调用后端登录接口建立用户会话。

// 登录页面把输入的用户名和密码交给 apiLogin()，由统一 http() 函数 POST 到后端 /api/auth/login。
// 成功响应返回 username、level 等用户信息，后端同时通过 Cookie 建立会话；密码验证和摘要比对发生在 AuthService。

export function apiLogin(username: string, password: string): Promise<AuthUser> {
// 通过统一 HTTP 请求函数向后端提交用户名和密码，取得验证后的用户信息。
// username、password 来自登录表单；http() 处理 JSON 与适用 Cookie；AuthUser 描述成功返回的 username 和 level。
  return http<AuthUser>('POST', '/api/auth/login', { username, password });
  // 把用户输入的用户名和密码提交给后端登录接口，并返回后端响应的用户信息。
  // apiLogin 调用项目自己的 http 封装；http 内部使用浏览器 fetch，接口为 POST /api/auth/login；AuthUser 是前端返回值的类型约束。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了调用后端登录接口建立用户会话的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 apiLogout，用于调用后端登出接口清除用户会话。
export function apiLogout(): Promise<{ success: true }> {
// 定义函数 apiLogout。
// apiLogout：调用后端登出接口清除用户会话；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；success：本处声明的字段或类型，类型为 true
  return http<{ success: true }>('POST', '/api/auth/logout');
  // 把http<{ success: true }>('POST', '/api/auth/logout')作为当前函数的结果返回。
  // http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；success：本处声明的字段或类型，类型为 true
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了调用后端登出接口清除用户会话的实现；实际结果由运行时输入和执行分支决定。

// /api/auth/me 拉当前 session 用户;401 表示未登录
// 这一段定义 apiMe，用于查询后端当前登录用户。
export function apiMe(): Promise<AuthUser> {
// 定义 apiMe，用于查询后端当前登录用户。
// apiMe：查询后端当前登录用户；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；AuthUser：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束
  return http<AuthUser>('GET', '/api/auth/me');
  // 把http<AuthUser>('GET', '/api/auth/me')作为当前函数的结果返回。
  // http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；AuthUser：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了查询后端当前登录用户的实现；实际结果由运行时输入和执行分支决定。

// ===== 用户管理(仅 admin) =====

// 这一段声明 UserRow，用于UserRow 的相关数据和行为。
export interface UserRow { username: string; level: Level; created_at: string }
// 定义 UserRow，约束或实现本模块涉及的数据和行为。
// username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分；Level：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束；created_at：本处声明的字段或类型，类型为 string
// 这一段定义了 UserRow 的字段或服务能力，供项目其他模块使用。

// 这一段定义 apiListUsers，用于获取当前用户有权查看的账号列表。
export function apiListUsers(): Promise<{ users: UserRow[] }> {
// 定义函数 apiListUsers。
// apiListUsers：获取当前用户有权查看的账号列表；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；users：本处声明的字段或类型，类型为 UserRow[]
  return http<{ users: UserRow[] }>('GET', '/api/users');
  // 把http<{ users: UserRow[] }>('GET', '/api/users')作为当前函数的结果返回。
  // http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；users：本处声明的字段或类型，类型为 UserRow[]
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了获取当前用户有权查看的账号列表的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 apiCreateUser，用于向后端提交新账号信息。
export function apiCreateUser(username: string, password: string, level: Level): Promise<{ success: true; username: string }> {
// 定义函数 apiCreateUser。
// apiCreateUser：向后端提交新账号信息；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象；level：用户操作级别或事件严重级别，依据当前接口结构区分；Level：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；success：本处声明的字段或类型，类型为 true
  return http<{ success: true; username: string }>('POST', '/api/users', { username, password, level });
  // 把http<{ success: true; username: string }>('POST', '/api/users', { username, password, level })作为当前函数的结果返回。
  // http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；success：本处声明的字段或类型，类型为 true；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象；level：用户操作级别或事件严重级别，依据当前接口结构区分
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了向后端提交新账号信息的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 apiUpdateUser，用于向后端提交账号级别或密码变更。
export function apiUpdateUser(username: string, body: { new_password?: string; new_level?: Level }): Promise<{ success: true }> {
// 定义函数 apiUpdateUser。
// apiUpdateUser：向后端提交账号级别或密码变更；username：账号用户名；body：当前 HTTP 请求或消息的正文；new_password：本处声明的字段或类型，类型为 string；new_level：本处声明的字段或类型，类型为 Level；Level：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；success：本处声明的字段或类型，类型为 true
  return http<{ success: true }>('PUT', `/api/users/${encodeURIComponent(username)}`, body);
  // 把http<{ success: true }>('PUT', `/api/users/${encodeURIComponent(username)}`, body)作为当前函数的结果返回。
  // http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；success：本处声明的字段或类型，类型为 true；encodeURIComponent：提供 encodeURIComponent 的本地处理逻辑；username：账号用户名；body：当前 HTTP 请求或消息的正文
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了向后端提交账号级别或密码变更的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 apiDeleteUser，用于向后端提交账号删除请求。
export function apiDeleteUser(username: string): Promise<{ success: true }> {
// 定义函数 apiDeleteUser。
// apiDeleteUser：向后端提交账号删除请求；username：账号用户名；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；success：本处声明的字段或类型，类型为 true
  return http<{ success: true }>('DELETE', `/api/users/${encodeURIComponent(username)}`);
  // 把http<{ success: true }>('DELETE', `/api/users/${encodeURIComponent(username)}`)作为当前函数的结果返回。
  // http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；success：本处声明的字段或类型，类型为 true；encodeURIComponent：提供 encodeURIComponent 的本地处理逻辑；username：账号用户名
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/services/auth.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了向后端提交账号删除请求的实现；实际结果由运行时输入和执行分支决定。
