# web/src/services/auth.ts 逐行注释

[打开源码](../../../../../web/src/services/auth.ts) · 68 行 · 48 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
import type { AuthUser, Level } from '../stores/auth';
// 注释：从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 4 行**

```text
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 注释：声明 BASE，初始值由 (import.meta.env.VITE_API_BASE as string | undefined) || '' 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号；`undefined`＝未定义值。
```

**源码第 8 行**

```text
let onUnauthorized: (() => void) | null = null;
// 注释：声明 onUnauthorized，初始值由 > void) | null = null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。
```

**源码第 9 行**

```text
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }
// 注释：定义函数 `setUnauthorizedHandler`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`void`＝表示没有返回值。
```

**源码第 11 行**

```text
async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
// 注释：定义函数 `http`。 关键字：`async`＝声明异步函数；`function`＝定义函数；`unknown`＝需检查后才能使用的类型。
```

**源码第 12 行**

```text
  const res = await fetch(BASE + path, {
// 注释：声明 res，初始值由 await fetch(BASE + path, { 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 13 行**

```text
    method,
// 注释：把变量 method 作为同名对象字段加入当前对象。
```

**源码第 14 行**

```text
    credentials: 'include',  // cookie-session 必须
// 注释：设置字段 `credentials`。
```

**源码第 15 行**

```text
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
// 注释：设置字段 `headers`。 关键字：`undefined`＝未定义值。
```

**源码第 16 行**

```text
    body: body ? JSON.stringify(body) : undefined,
// 注释：设置字段 `body`。 关键字：`undefined`＝未定义值。
```

**源码第 17 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 18 行**

```text
  if (res.status === 401) {
// 注释：判断 if (res.status === 401) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 19 行**

```text
    onUnauthorized?.();
// 注释：调用 .，把括号中的值作为参数传入。
```

**源码第 20 行**

```text
    throw new Error('未登录或会话已过期');
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 21 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 22 行**

```text
  if (!res.ok) {
// 注释：判断 if (!res.ok) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 23 行**

```text
    let msg = `${method} ${path} → ${res.status}`;
// 注释：声明 msg，初始值由 `${method} ${path} → ${res.status}` 计算得到。 关键字：`let`＝声明可重新赋值的变量。
```

**源码第 24 行**

```text
    try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 25 行**

```text
      const j = await res.json();
// 注释：声明 j，初始值由 await res.json() 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 26 行**

```text
      if (j?.msg) msg += `: ${j.msg}`;
// 注释：判断 if (j?.msg) msg += `: ${j.msg}`; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 27 行**

```text
    } catch { /* 不是 JSON */ }
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 28 行**

```text
    throw new Error(msg);
// 注释：抛出异常供调用方处理。 关键字：`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 29 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 31 行**

```text
  if (res.status === 204) return undefined as unknown as T;
// 注释：判断 if (res.status === 204) return undefined as unknown as T; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`undefined`＝未定义值；`unknown`＝需检查后才能使用的类型。
```

**源码第 32 行**

```text
  return res.json() as Promise<T>;
// 注释：返回 res.json() as Promise<T> 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 33 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 37 行**

```text
export function apiLogin(username: string, password: string): Promise<AuthUser> {
// 注释：定义函数 `apiLogin`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。
```

**源码第 38 行**

```text
  return http<AuthUser>('POST', '/api/auth/login', { username, password });
// 注释：返回 http<AuthUser>('POST', '/api/auth/login', { username, password }) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 39 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 41 行**

```text
export function apiLogout(): Promise<{ success: true }> {
// 注释：定义函数 `apiLogout`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。
```

**源码第 42 行**

```text
  return http<{ success: true }>('POST', '/api/auth/logout');
// 注释：返回 http<{ success: true }>('POST', '/api/auth/logout') 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 43 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 46 行**

```text
export function apiMe(): Promise<AuthUser> {
// 注释：定义函数 `apiMe`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。
```

**源码第 47 行**

```text
  return http<AuthUser>('GET', '/api/auth/me');
// 注释：返回 http<AuthUser>('GET', '/api/auth/me') 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 48 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 52 行**

```text
export interface UserRow { username: string; level: Level; created_at: string }
// 注释：声明 `UserRow` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 54 行**

```text
export function apiListUsers(): Promise<{ users: UserRow[] }> {
// 注释：定义函数 `apiListUsers`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。
```

**源码第 55 行**

```text
  return http<{ users: UserRow[] }>('GET', '/api/users');
// 注释：返回 http<{ users: UserRow[] }>('GET', '/api/users') 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 56 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 58 行**

```text
export function apiCreateUser(username: string, password: string, level: Level): Promise<{ success: true; username: string }> {
// 注释：定义函数 `apiCreateUser`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。
```

**源码第 59 行**

```text
  return http<{ success: true; username: string }>('POST', '/api/users', { username, password, level });
// 注释：返回 http<{ success: true; username: string }>('POST', '/api/users', { username, password, level }) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 60 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 62 行**

```text
export function apiUpdateUser(username: string, body: { new_password?: string; new_level?: Level }): Promise<{ success: true }> {
// 注释：定义函数 `apiUpdateUser`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。
```

**源码第 63 行**

```text
  return http<{ success: true }>('PUT', `/api/users/${encodeURIComponent(username)}`, body);
// 注释：返回 http<{ success: true }>('PUT', `/api/users/${encodeURIComponent(username)}`, body) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 64 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 66 行**

```text
export function apiDeleteUser(username: string): Promise<{ success: true }> {
// 注释：定义函数 `apiDeleteUser`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`true`＝布尔真值。
```

**源码第 67 行**

```text
  return http<{ success: true }>('DELETE', `/api/users/${encodeURIComponent(username)}`);
// 注释：返回 http<{ success: true }>('DELETE', `/api/users/${encodeURIComponent(username)}`) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 68 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
