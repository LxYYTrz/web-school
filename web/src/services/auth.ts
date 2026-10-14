import type { AuthUser, Level } from '../stores/auth';

// HTTP 基址:同源(开发走 Vite 代理 / 生产走 Nginx 同源反代)
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';

// 401 时全局跳登录页(避免每个调用方重复处理)
// 由 router 注入:router/index.ts 里 router.push('/login')
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',  // cookie-session 必须
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

// ===== 鉴权 API =====

export function apiLogin(username: string, password: string): Promise<AuthUser> {
  return http<AuthUser>('POST', '/api/auth/login', { username, password });
}

export function apiLogout(): Promise<{ success: true }> {
  return http<{ success: true }>('POST', '/api/auth/logout');
}

// /api/auth/me 拉当前 session 用户;401 表示未登录
export function apiMe(): Promise<AuthUser> {
  return http<AuthUser>('GET', '/api/auth/me');
}

// ===== 用户管理(仅 admin) =====

export interface UserRow { username: string; level: Level; created_at: string }

export function apiListUsers(): Promise<{ users: UserRow[] }> {
  return http<{ users: UserRow[] }>('GET', '/api/users');
}

export function apiCreateUser(username: string, password: string, level: Level): Promise<{ success: true; username: string }> {
  return http<{ success: true; username: string }>('POST', '/api/users', { username, password, level });
}

export function apiUpdateUser(username: string, body: { new_password?: string; new_level?: Level }): Promise<{ success: true }> {
  return http<{ success: true }>('PUT', `/api/users/${encodeURIComponent(username)}`, body);
}

export function apiDeleteUser(username: string): Promise<{ success: true }> {
  return http<{ success: true }>('DELETE', `/api/users/${encodeURIComponent(username)}`);
}
