import type { AiProposal, AiStreamEvent } from './types';
// 从 ./types 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { getSocket } from './socket';
// 从 ./socket 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '';
// 声明 BASE，初始值由 (import.meta.env.VITE_API_BASE as string | undefined) || '' 计算得到。 关键字：const＝声明不可重新绑定的变量；import＝导入模块或符号；undefined＝未定义值。

let onUnauthorized: (() => void) | null = null;
// 声明 onUnauthorized，初始值由 > void) | null = null 计算得到。 关键字：let＝声明可重新赋值的变量；void＝表示没有返回值；null＝空值。
export function setAiUnauthorizedHandler(fn: () => void) {
// 定义函数 setAiUnauthorizedHandler。 关键字：export＝向其他模块开放符号；function＝定义函数；void＝表示没有返回值。
  onUnauthorized = fn;
  // 把右侧表达式的结果写入 onUnauthorized。
}
// 结束当前对象、函数或条件代码块。

async function throwFor(res: Response, method: string, path: string): Promise<never> {
// 定义函数 throwFor。 关键字：async＝声明异步函数；function＝定义函数。
  if (res.status === 401) {
  // 判断 if (res.status === 401) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    onUnauthorized?.();
    // 调用 .，把括号中的值作为参数传入。
    throw new Error('未登录或会话已过期');
    // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
  }
  // 结束当前对象、函数或条件代码块。
  let msg = `${method} ${path} → ${res.status}`;
  // 声明 msg，初始值由 ${method} ${path} → ${res.status} 计算得到。 关键字：let＝声明可重新赋值的变量。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    const j = await res.json();
    // 声明 j，初始值由 await res.json() 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    if (j?.msg) msg += `: ${j.msg}`;
    // 判断 if (j?.msg) msg += : ${j.msg}; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    else if (j?.error) msg += `: ${j.error}`;
    // 前一条件不成立时，改为执行这一分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
  } catch {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    /* 不是 JSON */
  }
  // 结束当前对象、函数或条件代码块。
  throw new Error(msg);
  // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
}
// 结束当前对象、函数或条件代码块。

export async function apiAiStatus(): Promise<{ enabled: boolean; model: string }> {
// 定义函数 apiAiStatus。 关键字：export＝向其他模块开放符号；async＝声明异步函数；function＝定义函数。
  const res = await fetch(`${BASE}/api/ai/status`, { credentials: 'include' });
  // 声明 res，初始值由 await fetch(${BASE}/api/ai/status, { credentials: 'include' }) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
  if (!res.ok) await throwFor(res, 'GET', '/api/ai/status');
  // 判断 if (!res.ok) await throwFor(res, 'GET', '/api/ai/status'); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；await＝等待异步操作完成。
  return res.json();
  // 返回 res.json() 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/**
 * 发送一条消息,逐块回调 AI 的输出。
 *
 * 用 fetch + ReadableStream 而不是 EventSource:本项目是 cookie 会话
 * (sameSite=lax),原生 EventSource 没有 withCredentials,跨源(dev 5173 → 3000)
 * 会丢会话、拿回 401。fetch 能带 credentials:'include',所以自己解 SSE。
 *
 * onEvent 抛错会中断本次流(用于组件卸载/切换会话时取消)。
 */
export async function apiAiChat(
// 定义函数 apiAiChat。 关键字：export＝向其他模块开放符号；async＝声明异步函数；function＝定义函数。
  lineId: string,
  // 设置字段 lineId。
  message: string,
  // 设置字段 message。
  onEvent: (e: AiStreamEvent) => void,
  // 设置字段 onEvent。 关键字：void＝表示没有返回值。
  signal?: AbortSignal,
  // 继续当前表达式；这一行的值由外层代码块或调用使用。
): Promise<void> {
// 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：void＝表示没有返回值。
  const res = await fetch(`${BASE}/api/ai/chat`, {
  // 声明 res，初始值由 await fetch(${BASE}/api/ai/chat, { 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    method: 'POST',
    // 设置字段 method。
    credentials: 'include',
    // 设置字段 credentials。
    headers: { 'Content-Type': 'application/json' },
    // 设置字段 headers。
    body: JSON.stringify({ lineId, message }),
    // 设置字段 body。
    signal,
    // 把变量 signal 作为同名对象字段加入当前对象。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  if (!res.ok) await throwFor(res, 'POST', '/api/ai/chat');
  // 判断 if (!res.ok) await throwFor(res, 'POST', '/api/ai/chat'); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；await＝等待异步操作完成。
  if (!res.body) throw new Error('浏览器不支持流式响应');
  // 判断 if (!res.body) throw new Error('浏览器不支持流式响应'); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。

  const reader = res.body.getReader();
  // 声明 reader，初始值由 res.body.getReader() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const decoder = new TextDecoder();
  // 声明 decoder，初始值由 new TextDecoder() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  let buf = '';
  // 声明 buf，初始值由 '' 计算得到。 关键字：let＝声明可重新赋值的变量。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    for (;;) {
    // 按这一行指定的集合或范围逐个执行循环体。 关键字：for＝遍历集合或区间。
      const { done, value } = await reader.read();
      // 从右侧结果中取出 done, value，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      if (done) break;
      // 判断 if (done) break; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；break＝结束当前循环或分支。
      buf += decoder.decode(value, { stream: true });
      // 调用 decoder.decode，把括号中的值作为参数传入。 关键字：true＝布尔真值。
      // SSE 以空行分帧;半帧留在 buf 等下一块
      let idx: number;
      // 声明变量 idx，类型为 number；其值稍后赋入。 关键字：let＝声明可重新赋值的变量。
      while ((idx = buf.indexOf('\n\n')) >= 0) {
      // 控制分支、循环或异常处理流程。 关键字：while＝按条件重复执行。
        const frame = buf.slice(0, idx);
        // 声明 frame，初始值由 buf.slice(0, idx) 计算得到。 关键字：const＝声明不可重新绑定的变量。
        buf = buf.slice(idx + 2);
        // 把右侧表达式的结果写入 buf。
        for (const line of frame.split('\n')) {
        // 按这一行指定的集合或范围逐个执行循环体。 关键字：for＝遍历集合或区间；const＝声明不可重新绑定的变量；of＝遍历可迭代值。
          if (!line.startsWith('data:')) continue;      // event:/id:/注释行忽略
          // 判断 if (!line.startsWith('data:')) continue;      // event:/id:/注释行忽略 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；continue＝跳过本轮继续循环。
          const payload = line.slice(5).trim();
          // 声明 payload，初始值由 line.slice(5).trim() 计算得到。 关键字：const＝声明不可重新绑定的变量。
          if (!payload) continue;
          // 判断 if (!payload) continue; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；continue＝跳过本轮继续循环。
          try {
          // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
            onEvent(JSON.parse(payload) as AiStreamEvent);
            // 调用 onEvent；括号中的表达式是传入的参数。
          } catch {
          // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
            /* 非 JSON 帧跳过 —— 一条脏帧不该掐断整段回答 */
          }
          // 结束当前对象、函数或条件代码块。
        }
        // 结束当前对象、函数或条件代码块。
      }
      // 结束当前对象、函数或条件代码块。
    }
    // 结束当前对象、函数或条件代码块。
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
    reader.cancel().catch(() => undefined);
    // 调用 reader.cancel，把括号中的值作为参数传入。 关键字：catch＝捕获异常；undefined＝未定义值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

/**
 * 确认一条 AI 建议 → 真正下发到 PLC。
 *
 * ⚠️ 这是 AI 链路里唯一会碰到真设备的方法,而且 level>=2 由后端 CommandGuard 把关,
 * 前端也再挡一道 —— 按钮的可用性只是体验,后端才是授权点。
 */
export async function apiConfirmAiProposal(
// 定义函数 apiConfirmAiProposal。 关键字：export＝向其他模块开放符号；async＝声明异步函数；function＝定义函数。
  id: string,
  // 设置字段 id。
): Promise<{ ok: boolean; cmdId?: string; error?: string }> {
// 继续当前表达式；这一行的值由外层代码块或调用使用。
  const res = await fetch(`${BASE}/api/ai/proposals/${encodeURIComponent(id)}/confirm`, {
  // 声明 res，初始值由 await fetch(${BASE}/api/ai/proposals/${encodeURIComponent(id)}/confirm, { 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    method: 'POST',
    // 设置字段 method。
    credentials: 'include',
    // 设置字段 credentials。
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
  const body = (await res.json().catch(() => ({}))) as {
  // 声明 body，初始值由 (await res.json().catch(() => ({}))) as { 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；catch＝捕获异常。
    ok: boolean;
    // 设置字段 ok。
    cmdId?: string;
    // 声明 可选字段 cmdId，类型为 string。
    error?: string;
    // 声明 可选字段 error，类型为 string。
  };
  // 结束当前对象或代码块，并完成这条语句。
  if (res.status === 403) {
  // 判断 if (res.status === 403) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    throw new Error(body.error || '需 level >= 2 才能下发控制指令');
    // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
  }
  // 结束当前对象、函数或条件代码块。
  if (!res.ok) throw new Error(body.error || `确认失败:${res.status}`);
  // 判断 if (!res.ok) throw new Error(body.error || 确认失败:${res.status}); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。
  return body;
  // 返回 body 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 订阅 AI 建议推送。约定同 onCommandAck:返回退订闭包,组件 onBeforeUnmount 里调。 */
export function onAiProposal(cb: (p: AiProposal) => void): () => void {
// 定义函数 onAiProposal。 关键字：export＝向其他模块开放符号；function＝定义函数；void＝表示没有返回值。
  const socket = getSocket();
  // 声明 socket，初始值由 getSocket() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  socket.on('ai_proposal', cb);
  // 调用 socket.on，把括号中的值作为参数传入。
  return () => {
  // 返回 () => { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    socket.off('ai_proposal', cb);
    // 调用 socket.off，把括号中的值作为参数传入。
  };
  // 结束当前对象或代码块，并完成这条语句。
}
// 结束当前对象、函数或条件代码块。
