import type { AuthUser, Level } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// HTTP 基址:同源(开发走 Vite 代理 / 生产走 Nginx 同源反代)
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 声明 BASE，初始值由 (import.meta.env.VITE_API_BASE as string | undefined) || '' 计算得到。 关键字：const＝声明不可重新绑定的变量；import＝导入模块或符号；undefined＝未定义值。

// 401 时全局跳登录页(避免每个调用方重复处理)
// 由 router 注入:router/index.ts 里 router.push('/login')
let onUnauthorized: (() => void) | null = null;
// 声明 onUnauthorized，初始值由 > void) | null = null 计算得到。 关键字：let＝声明可重新赋值的变量；void＝表示没有返回值；null＝空值。
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }
// 定义函数 setUnauthorizedHandler。 关键字：export＝向其他模块开放符号；function＝定义函数；void＝表示没有返回值。

async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
// 定义函数 http。 关键字：async＝声明异步函数；function＝定义函数；unknown＝需检查后才能使用的类型。
  const res = await fetch(BASE + path, {
  // 声明 res，初始值由 await fetch(BASE + path, { 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    method,
    // 把变量 method 作为同名对象字段加入当前对象。
    credentials: 'include',  // cookie-session 必须
    // 设置字段 credentials。
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    // 设置字段 headers。 关键字：undefined＝未定义值。
    body: body ? JSON.stringify(body) : undefined,
    // 设置字段 body。 关键字：undefined＝未定义值。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  if (res.status === 401) {
  // 判断 if (res.status === 401) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    onUnauthorized?.();
    // 调用 .，把括号中的值作为参数传入。
    throw new Error('未登录或会话已过期');
    // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
  }
  // 结束当前对象、函数或条件代码块。
  if (!res.ok) {
  // 判断 if (!res.ok) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    let msg = `${method} ${path} → ${res.status}`;
    // 声明 msg，初始值由 ${method} ${path} → ${res.status} 计算得到。 关键字：let＝声明可重新赋值的变量。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      const j = await res.json();
      // 声明 j，初始值由 await res.json() 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      if (j?.msg) msg += `: ${j.msg}`;
      // 判断 if (j?.msg) msg += : ${j.msg}; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    } catch { /* 不是 JSON */ }
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    throw new Error(msg);
    // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
  }
  // 结束当前对象、函数或条件代码块。
  // 204 等无 body
  if (res.status === 204) return undefined as unknown as T;
  // 判断 if (res.status === 204) return undefined as unknown as T; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；undefined＝未定义值；unknown＝需检查后才能使用的类型。
  return res.json() as Promise<T>;
  // 返回 res.json() as Promise<T> 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

// ===== 鉴权 API =====

export function apiLogin(username: string, password: string): Promise<AuthUser> {
// 定义函数 apiLogin。 关键字：export＝向其他模块开放符号；function＝定义函数。
  return http<AuthUser>('POST', '/api/auth/login', { username, password });
  // 返回 http<AuthUser>('POST', '/api/auth/login', { username, password }) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

export function apiLogout(): Promise<{ success: true }> {
// 定义函数 apiLogout。 关键字：export＝向其他模块开放符号；function＝定义函数；true＝布尔真值。
  return http<{ success: true }>('POST', '/api/auth/logout');
  // 返回 http<{ success: true }>('POST', '/api/auth/logout') 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。

// /api/auth/me 拉当前 session 用户;401 表示未登录
export function apiMe(): Promise<AuthUser> {
// 定义函数 apiMe。 关键字：export＝向其他模块开放符号；function＝定义函数。
  return http<AuthUser>('GET', '/api/auth/me');
  // 返回 http<AuthUser>('GET', '/api/auth/me') 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

// ===== 用户管理(仅 admin) =====

export interface UserRow { username: string; level: Level; created_at: string }
// 声明 UserRow 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。

export function apiListUsers(): Promise<{ users: UserRow[] }> {
// 定义函数 apiListUsers。 关键字：export＝向其他模块开放符号；function＝定义函数。
  return http<{ users: UserRow[] }>('GET', '/api/users');
  // 返回 http<{ users: UserRow[] }>('GET', '/api/users') 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

export function apiCreateUser(username: string, password: string, level: Level): Promise<{ success: true; username: string }> {
// 定义函数 apiCreateUser。 关键字：export＝向其他模块开放符号；function＝定义函数；true＝布尔真值。
  return http<{ success: true; username: string }>('POST', '/api/users', { username, password, level });
  // 返回 http<{ success: true; username: string }>('POST', '/api/users', { username, password, level }) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。

export function apiUpdateUser(username: string, body: { new_password?: string; new_level?: Level }): Promise<{ success: true }> {
// 定义函数 apiUpdateUser。 关键字：export＝向其他模块开放符号；function＝定义函数；true＝布尔真值。
  return http<{ success: true }>('PUT', `/api/users/${encodeURIComponent(username)}`, body);
  // 返回 http<{ success: true }>('PUT', /api/users/${encodeURIComponent(username)}, body) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。

export function apiDeleteUser(username: string): Promise<{ success: true }> {
// 定义函数 apiDeleteUser。 关键字：export＝向其他模块开放符号；function＝定义函数；true＝布尔真值。
  return http<{ success: true }>('DELETE', `/api/users/${encodeURIComponent(username)}`);
  // 返回 http<{ success: true }>('DELETE', /api/users/${encodeURIComponent(username)}) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。
