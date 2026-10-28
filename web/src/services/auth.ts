/**
 * 浏览器账号与用户管理的 HTTP 请求封装，由 auth store、UsersView 等调用。
 * 先看共用 http 如何发送 JSON、包含适用 Cookie 并处理错误，再看各 api 方法提供的路径、方法和正文。
 * fetch 是浏览器 API；这里不核对数据库密码，也不自行生成后端会话签名。
 */
import type { AuthUser, Level } from '../stores/auth';

// HTTP 基址:同源(开发走 Vite 代理 / 生产走 Nginx 同源反代)
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

// 401 时全局跳登录页(避免每个调用方重复处理)
// 由 router 注入:router/index.ts 里 router.push('/login')
let onUnauthorized: (() => void) | null = null;
// 401 时全局跳登录页(避免每个调用方重复处理)。
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

// 账号相关 api 方法共用的请求流程：发送可选 JSON 正文、带适用 Cookie、检查 HTTP 状态并解析响应。
// method/path/body 由下方业务方法提供；遇到 401 通知注册的未授权处理器，其他错误尽量提取后端文字。
async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,

    // credentials: include 让浏览器按 Cookie 规则发送适用的登录凭据，也接收适用的 Set-Cookie 响应。
    // 后端 cookie-session 才能从后续请求读取签名会话。这个选项不会自行创建登录身份，也不会替代浏览器的 Cookie 与跨域规则。

    credentials: 'include',  // cookie-session 必须
    // 让这个请求按浏览器规则携带适用的登录 Cookie，使后端能关联之前的登录会话。
    // credentials 是浏览器 fetch 的选项，include 表示包含凭据；它不绕过 Cookie、跨域或 SameSite 规则，也不自行生成登录身份。
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('未登录或会话已过期');
  }
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`;
    try {
      const j = await res.json();
      if (j?.msg) msg += `: ${j.msg}`;
    } catch { /* 不是 JSON */ }
    throw new Error(msg);
  }
  // 204 等无 body
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// 登录页面经 auth store 调用，把用户名和密码提交到后端认证入口。
// 返回 AuthUser 是前端类型约定，实际验证与会话建立由 server/src/auth/ 完成。
export function apiLogin(username: string, password: string): Promise<AuthUser> {
  return http<AuthUser>('POST', '/api/auth/login', { username, password });
  // 把用户输入的用户名和密码提交给后端登录接口，并返回后端响应的用户信息。
  // apiLogin 调用项目自己的 http 封装；http 内部使用浏览器 fetch，接口为 POST /api/auth/login；AuthUser 是前端返回值的类型约束。
}

export function apiLogout(): Promise<{ success: true }> {
  return http<{ success: true }>('POST', '/api/auth/logout');
}

// 页面刷新时读取当前后端会话用户，不重新发送原始密码。
export function apiMe(): Promise<AuthUser> {
// 定义 apiMe，用于查询后端当前登录用户。
  return http<AuthUser>('GET', '/api/auth/me');
}

// ===== 用户管理(仅 admin) =====

export interface UserRow { username: string; level: Level; created_at: string }

// 用户管理页面请求可见账号列表；可见范围由后端 UsersService 按会话用户过滤。
export function apiListUsers(): Promise<{ users: UserRow[] }> {
  return http<{ users: UserRow[] }>('GET', '/api/users');
}

// 将创建表单中的账号、密码和级别提交后端，页面随后按结果刷新列表。
export function apiCreateUser(username: string, password: string, level: Level): Promise<{ success: true; username: string }> {
  return http<{ success: true; username: string }>('POST', '/api/users', { username, password, level });
}

export function apiUpdateUser(username: string, body: { new_password?: string; new_level?: Level }): Promise<{ success: true }> {
  return http<{ success: true }>('PUT', `/api/users/${encodeURIComponent(username)}`, body);
}

export function apiDeleteUser(username: string): Promise<{ success: true }> {
  return http<{ success: true }>('DELETE', `/api/users/${encodeURIComponent(username)}`);
}
