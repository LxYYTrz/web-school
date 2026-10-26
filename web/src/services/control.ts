import { getSocket } from './socket';
// 从 ./socket 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { CommandAck } from './types';
// 从 ./types 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 声明 BASE，初始值由 (import.meta.env.VITE_API_BASE as string | undefined) || '' 计算得到。 关键字：const＝声明不可重新绑定的变量；import＝导入模块或符号；undefined＝未定义值。

// 401 全局跳登录(对齐 services/auth.ts 的 setUnauthorizedHandler)
let onUnauthorized: (() => void) | null = null;
// 声明 onUnauthorized，初始值由 > void) | null = null 计算得到。 关键字：let＝声明可重新赋值的变量；void＝表示没有返回值；null＝空值。
export function setControlUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }
// 定义函数 setControlUnauthorizedHandler。 关键字：export＝向其他模块开放符号；function＝定义函数；void＝表示没有返回值。

export interface SendCommandParams {
// 声明 SendCommandParams 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  deviceId: string;
  // 设置字段 deviceId。
  type: 'start' | 'stop' | 'reset' | 'changeover' | 'mode_set' | 'alarm_clear' | string;
  // 设置字段 type。 关键字：type＝定义类型别名。
  params?: Record<string, unknown>;
  // 声明 可选字段 params，类型为 Record<string, unknown>。 关键字：unknown＝需检查后才能使用的类型。
}
// 结束当前对象、函数或条件代码块。

export interface SendCommandResult {
// 声明 SendCommandResult 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  ok: boolean;
  // 设置字段 ok。
  cmdId?: string;
  // 声明 可选字段 cmdId，类型为 string。
  error?: string;
  // 声明 可选字段 error，类型为 string。
}
// 结束当前对象、函数或条件代码块。

// POST /api/lines/{lineId}/commands
// 后端:AuthGuard + CommandGuard(level>=2) + 契约 v1.1 白名单
export async function apiSendCommand(
// 定义函数 apiSendCommand。 关键字：export＝向其他模块开放符号；async＝声明异步函数；function＝定义函数。
  lineId: string,
  // 设置字段 lineId。
  cmd: SendCommandParams,
  // 设置字段 cmd。
): Promise<SendCommandResult> {
// 继续当前表达式；这一行的值由外层代码块或调用使用。
  const res = await fetch(`${BASE}/api/lines/${lineId}/commands`, {
  // 声明 res，初始值由 await fetch(${BASE}/api/lines/${lineId}/commands, { 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    method: 'POST',
    // 设置字段 method。
    credentials: 'include',
    // 设置字段 credentials。
    headers: { 'Content-Type': 'application/json' },
    // 设置字段 headers。
    body: JSON.stringify(cmd),
    // 设置字段 body。
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
    let msg = `POST commands → ${res.status}`;
    // 声明 msg，初始值由 POST commands → ${res.status} 计算得到。 关键字：let＝声明可重新赋值的变量。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      const j = await res.json();
      // 声明 j，初始值由 await res.json() 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      if (j?.msg) msg += `: ${j.msg}`;
      // 判断 if (j?.msg) msg += : ${j.msg}; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      else if (j?.error) msg += `: ${j.error}`;
      // 前一条件不成立时，改为执行这一分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
    } catch { /* 不是 JSON */ }
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    throw new Error(msg);
    // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
  }
  // 结束当前对象、函数或条件代码块。
  return res.json() as Promise<SendCommandResult>;
  // 返回 res.json() as Promise<SendCommandResult> 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

// 订阅 socket 'command_ack'(由后端 telemetry.gateway.broadcastCommandAck 转发)
// 返回取消订阅函数
export function onCommandAck(cb: (ack: CommandAck) => void): () => void {
// 定义函数 onCommandAck。 关键字：export＝向其他模块开放符号；function＝定义函数；void＝表示没有返回值。
  const socket = getSocket();
  // 声明 socket，初始值由 getSocket() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const handler = (msg: CommandAck) => cb(msg);
  // 声明 handler，初始值由 (msg: CommandAck) => cb(msg) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  socket.on('command_ack', handler);
  // 调用 socket.on，把括号中的值作为参数传入。
  return () => { socket.off('command_ack', handler); };
  // 返回 () => { socket.off('command_ack', handler); } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。