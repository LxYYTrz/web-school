# web/src/services/lineState.ts 逐行说明

[打开源码](../../../../../web/src/services/lineState.ts) · 153 行 · 93 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 14 | <code>export const STATE_TEXT: Record&lt;string, string&gt; = {</code> | 声明变量 `STATE_TEXT` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 16 | <code>running: '运行中',</code> | 设置字段 `running`。 |
| 17 | <code>idle: '待机',</code> | 设置字段 `idle`。 |
| 18 | <code>alarm: '报警',</code> | 设置字段 `alarm`。 |
| 19 | <code>offline: '离线',</code> | 设置字段 `offline`。 |
| 21 | <code>waiting_feed: '等待入料',      //   0</code> | 设置字段 `waiting_feed`。 |
| 22 | <code>feeding: '入料中',             //   1</code> | 设置字段 `feeding`。 |
| 23 | <code>assembling: '装配中',          //   2</code> | 设置字段 `assembling`。 |
| 24 | <code>waiting_robot: '等待机器人完成',//   3  ★ 现场口径(旧口径 unloading 保留给历史数据)</code> | 设置字段 `waiting_robot`。 |
| 25 | <code>unload_done: '下料完成',       //   4</code> | 设置字段 `unload_done`。 |
| 26 | <code>waiting_next: '等待后站入料',  //   5</code> | 设置字段 `waiting_next`。 |
| 27 | <code>init_error: '初始化错误',      // 100</code> | 设置字段 `init_error`。 |
| 28 | <code>stopped: '停止',               // 101</code> | 设置字段 `stopped`。 |
| 29 | <code>manual_mode: '手动模式',       // 102</code> | 设置字段 `manual_mode`。 |
| 31 | <code>unloading: '下料中',</code> | 设置字段 `unloading`。 |
| 32 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 35 | <code>export type StateTone = 'run' &#124; 'wait' &#124; 'stop' &#124; 'error' &#124; 'off';</code> | 声明 `StateTone` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名。 |
| 37 | <code>export const STATE_TONE: Record&lt;string, StateTone&gt; = {</code> | 声明变量 `STATE_TONE` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 38 | <code>running: 'run',</code> | 设置字段 `running`。 |
| 39 | <code>feeding: 'run',</code> | 设置字段 `feeding`。 |
| 40 | <code>assembling: 'run',</code> | 设置字段 `assembling`。 |
| 41 | <code>waiting_robot: 'run',</code> | 设置字段 `waiting_robot`。 |
| 42 | <code>unload_done: 'run',</code> | 设置字段 `unload_done`。 |
| 43 | <code>unloading: 'run',</code> | 设置字段 `unloading`。 |
| 45 | <code>idle: 'wait',</code> | 设置字段 `idle`。 |
| 46 | <code>waiting_feed: 'wait',</code> | 设置字段 `waiting_feed`。 |
| 47 | <code>waiting_next: 'wait',</code> | 设置字段 `waiting_next`。 |
| 49 | <code>stopped: 'stop',</code> | 设置字段 `stopped`。 |
| 50 | <code>manual_mode: 'stop',</code> | 设置字段 `manual_mode`。 |
| 52 | <code>alarm: 'error',</code> | 设置字段 `alarm`。 |
| 53 | <code>init_error: 'error',</code> | 设置字段 `init_error`。 |
| 55 | <code>offline: 'off',</code> | 设置字段 `offline`。 |
| 56 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 59 | <code>export const KNOWN_STATES = new Set(Object.keys(STATE_TEXT));</code> | 声明变量 `KNOWN_STATES` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 67 | <code>export const PLC_STATE_BY_INT: Record&lt;number, string&gt; = {</code> | 声明变量 `PLC_STATE_BY_INT` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 68 | <code>0: 'waiting_feed',</code> | 续写当前表达式、对象、类型或调用。 |
| 69 | <code>1: 'feeding',</code> | 续写当前表达式、对象、类型或调用。 |
| 70 | <code>2: 'assembling',</code> | 续写当前表达式、对象、类型或调用。 |
| 71 | <code>3: 'waiting_robot',</code> | 续写当前表达式、对象、类型或调用。 |
| 72 | <code>4: 'unload_done',</code> | 续写当前表达式、对象、类型或调用。 |
| 73 | <code>5: 'waiting_next',</code> | 续写当前表达式、对象、类型或调用。 |
| 74 | <code>100: 'init_error',</code> | 续写当前表达式、对象、类型或调用。 |
| 75 | <code>101: 'stopped',</code> | 续写当前表达式、对象、类型或调用。 |
| 76 | <code>102: 'manual_mode',</code> | 续写当前表达式、对象、类型或调用。 |
| 77 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 87 | <code>export const STATE_ALIAS: Record&lt;string, string&gt; = {</code> | 声明变量 `STATE_ALIAS` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 89 | <code>'waiting_robot_done': 'waiting_robot',</code> | 续写当前表达式、对象、类型或调用。 |
| 90 | <code>'robot_waiting_done': 'waiting_robot',</code> | 续写当前表达式、对象、类型或调用。 |
| 91 | <code>'等待机器人完成': 'waiting_robot',</code> | 续写当前表达式、对象、类型或调用。 |
| 92 | <code>'等待机器人': 'waiting_robot',</code> | 续写当前表达式、对象、类型或调用。 |
| 94 | <code>'unloading_process': 'unloading',</code> | 续写当前表达式、对象、类型或调用。 |
| 95 | <code>'下料中': 'unloading',</code> | 续写当前表达式、对象、类型或调用。 |
| 97 | <code>'unload_finished': 'unload_done',</code> | 续写当前表达式、对象、类型或调用。 |
| 98 | <code>'unload_complete': 'unload_done',</code> | 续写当前表达式、对象、类型或调用。 |
| 99 | <code>'下料完成': 'unload_done',</code> | 续写当前表达式、对象、类型或调用。 |
| 100 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 108 | <code>export function normalizeState(state: string &#124; number &#124; undefined &#124; null): string {</code> | 定义函数 `normalizeState`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。 |
| 109 | <code>if (state === undefined &#124;&#124; state === null) return '';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`null`＝空值；`return`＝返回结果并结束当前函数。 |
| 110 | <code>const s = String(state).trim();</code> | 声明变量 `s` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 111 | <code>if (PLC_STATE_BY_INT[Number(s)] !== undefined) return PLC_STATE_BY_INT[Number(s)];</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。 |
| 112 | <code>if (STATE_ALIAS[s] !== undefined) return STATE_ALIAS[s];</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。 |
| 113 | <code>return s;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 114 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 117 | <code>export function stateText(state: string &#124; number &#124; undefined &#124; null): string {</code> | 定义函数 `stateText`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。 |
| 118 | <code>if (!state) return '—';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 119 | <code>const s = normalizeState(state);</code> | 声明变量 `s` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 120 | <code>return STATE_TEXT[s] ?? s;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 121 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 124 | <code>export function stateClass(state: string &#124; number &#124; undefined &#124; null): string {</code> | 定义函数 `stateClass`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。 |
| 125 | <code>if (!state) return '';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 126 | <code>const s = normalizeState(state);</code> | 声明变量 `s` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 127 | <code>if (!KNOWN_STATES.has(s)) return '';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 128 | <code>return `st-${s}`;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 129 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 132 | <code>export function stateTagType(</code> | 定义函数 `stateTagType`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。 |
| 133 | <code>state: string &#124; number &#124; undefined &#124; null,</code> | 设置字段 `state`。 关键字：`undefined`＝未定义值；`null`＝空值。 |
| 134 | <code>): 'success' &#124; 'info' &#124; 'danger' &#124; 'warning' {</code> | 续写当前表达式、对象、类型或调用。 |
| 135 | <code>switch (stateTone(state)) {</code> | 控制分支、循环或异常处理流程。 关键字：`switch`＝按值分派分支。 |
| 136 | <code>case 'run': return 'success';</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支；`return`＝返回结果并结束当前函数。 |
| 137 | <code>case 'error': return 'danger';</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支；`return`＝返回结果并结束当前函数。 |
| 138 | <code>case 'wait':</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。 |
| 139 | <code>case 'stop': return 'info';</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支；`return`＝返回结果并结束当前函数。 |
| 140 | <code>default: return 'warning';</code> | 设置字段 `default`。 关键字：`default`＝指定默认导出或默认分支；`return`＝返回结果并结束当前函数。 |
| 141 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 142 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 144 | <code>function stateTone(state: string &#124; number &#124; undefined &#124; null): StateTone {</code> | 定义函数 `stateTone`。 关键字：`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。 |
| 145 | <code>if (!state) return 'off';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 146 | <code>const s = normalizeState(state);</code> | 声明变量 `s` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 147 | <code>return STATE_TONE[s] ?? 'off';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 148 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 151 | <code>export function isRunning(state: string &#124; number &#124; undefined &#124; null): boolean {</code> | 定义函数 `isRunning`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。 |
| 152 | <code>return stateTone(state) === 'run';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 153 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
