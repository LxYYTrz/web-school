# web/src/services/lineState.ts 逐行注释

[打开源码](../../../../../web/src/services/lineState.ts) · 153 行 · 93 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 14 行**

```text
export const STATE_TEXT: Record<string, string> = {
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。
```

**源码第 16 行**

```text
  running: '运行中',
// 注释：设置字段 `running`。
```

**源码第 17 行**

```text
  idle: '待机',
// 注释：设置字段 `idle`。
```

**源码第 18 行**

```text
  alarm: '报警',
// 注释：设置字段 `alarm`。
```

**源码第 19 行**

```text
  offline: '离线',
// 注释：设置字段 `offline`。
```

**源码第 21 行**

```text
  waiting_feed: '等待入料',      //   0
// 注释：设置字段 `waiting_feed`。
```

**源码第 22 行**

```text
  feeding: '入料中',             //   1
// 注释：设置字段 `feeding`。
```

**源码第 23 行**

```text
  assembling: '装配中',          //   2
// 注释：设置字段 `assembling`。
```

**源码第 24 行**

```text
  waiting_robot: '等待机器人完成',//   3  ★ 现场口径(旧口径 unloading 保留给历史数据)
// 注释：设置字段 `waiting_robot`。
```

**源码第 25 行**

```text
  unload_done: '下料完成',       //   4
// 注释：设置字段 `unload_done`。
```

**源码第 26 行**

```text
  waiting_next: '等待后站入料',  //   5
// 注释：设置字段 `waiting_next`。
```

**源码第 27 行**

```text
  init_error: '初始化错误',      // 100
// 注释：设置字段 `init_error`。
```

**源码第 28 行**

```text
  stopped: '停止',               // 101
// 注释：设置字段 `stopped`。
```

**源码第 29 行**

```text
  manual_mode: '手动模式',       // 102
// 注释：设置字段 `manual_mode`。
```

**源码第 31 行**

```text
  unloading: '下料中',
// 注释：设置字段 `unloading`。
```

**源码第 32 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 35 行**

```text
export type StateTone = 'run' | 'wait' | 'stop' | 'error' | 'off';
// 注释：声明 `StateTone` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名。
```

**源码第 37 行**

```text
export const STATE_TONE: Record<string, StateTone> = {
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。
```

**源码第 38 行**

```text
  running: 'run',
// 注释：设置字段 `running`。
```

**源码第 39 行**

```text
  feeding: 'run',
// 注释：设置字段 `feeding`。
```

**源码第 40 行**

```text
  assembling: 'run',
// 注释：设置字段 `assembling`。
```

**源码第 41 行**

```text
  waiting_robot: 'run',
// 注释：设置字段 `waiting_robot`。
```

**源码第 42 行**

```text
  unload_done: 'run',
// 注释：设置字段 `unload_done`。
```

**源码第 43 行**

```text
  unloading: 'run',
// 注释：设置字段 `unloading`。
```

**源码第 45 行**

```text
  idle: 'wait',
// 注释：设置字段 `idle`。
```

**源码第 46 行**

```text
  waiting_feed: 'wait',
// 注释：设置字段 `waiting_feed`。
```

**源码第 47 行**

```text
  waiting_next: 'wait',
// 注释：设置字段 `waiting_next`。
```

**源码第 49 行**

```text
  stopped: 'stop',
// 注释：设置字段 `stopped`。
```

**源码第 50 行**

```text
  manual_mode: 'stop',
// 注释：设置字段 `manual_mode`。
```

**源码第 52 行**

```text
  alarm: 'error',
// 注释：设置字段 `alarm`。
```

**源码第 53 行**

```text
  init_error: 'error',
// 注释：设置字段 `init_error`。
```

**源码第 55 行**

```text
  offline: 'off',
// 注释：设置字段 `offline`。
```

**源码第 56 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 59 行**

```text
export const KNOWN_STATES = new Set(Object.keys(STATE_TEXT));
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 67 行**

```text
export const PLC_STATE_BY_INT: Record<number, string> = {
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。
```

**源码第 68 行**

```text
  0: 'waiting_feed',
// 注释：设置字段 0，值为 'waiting_feed'。
```

**源码第 69 行**

```text
  1: 'feeding',
// 注释：设置字段 1，值为 'feeding'。
```

**源码第 70 行**

```text
  2: 'assembling',
// 注释：设置字段 2，值为 'assembling'。
```

**源码第 71 行**

```text
  3: 'waiting_robot',
// 注释：设置字段 3，值为 'waiting_robot'。
```

**源码第 72 行**

```text
  4: 'unload_done',
// 注释：设置字段 4，值为 'unload_done'。
```

**源码第 73 行**

```text
  5: 'waiting_next',
// 注释：设置字段 5，值为 'waiting_next'。
```

**源码第 74 行**

```text
  100: 'init_error',
// 注释：设置字段 100，值为 'init_error'。
```

**源码第 75 行**

```text
  101: 'stopped',
// 注释：设置字段 101，值为 'stopped'。
```

**源码第 76 行**

```text
  102: 'manual_mode',
// 注释：设置字段 102，值为 'manual_mode'。
```

**源码第 77 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 87 行**

```text
export const STATE_ALIAS: Record<string, string> = {
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。
```

**源码第 89 行**

```text
  'waiting_robot_done': 'waiting_robot',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 90 行**

```text
  'robot_waiting_done': 'waiting_robot',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 91 行**

```text
  '等待机器人完成': 'waiting_robot',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 92 行**

```text
  '等待机器人': 'waiting_robot',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 94 行**

```text
  'unloading_process': 'unloading',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 95 行**

```text
  '下料中': 'unloading',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 97 行**

```text
  'unload_finished': 'unload_done',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 98 行**

```text
  'unload_complete': 'unload_done',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 99 行**

```text
  '下料完成': 'unload_done',
// 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 100 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 108 行**

```text
export function normalizeState(state: string | number | undefined | null): string {
// 注释：定义函数 `normalizeState`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。
```

**源码第 109 行**

```text
  if (state === undefined || state === null) return '';
// 注释：判断 if (state === undefined || state === null) return ''; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`null`＝空值；`return`＝返回结果并结束当前函数。
```

**源码第 110 行**

```text
  const s = String(state).trim();
// 注释：声明 s，初始值由 String(state).trim() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 111 行**

```text
  if (PLC_STATE_BY_INT[Number(s)] !== undefined) return PLC_STATE_BY_INT[Number(s)];
// 注释：判断 if (PLC_STATE_BY_INT[Number(s)] !== undefined) return PLC_STATE_BY_INT[Number(s)]; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。
```

**源码第 112 行**

```text
  if (STATE_ALIAS[s] !== undefined) return STATE_ALIAS[s];
// 注释：判断 if (STATE_ALIAS[s] !== undefined) return STATE_ALIAS[s]; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。
```

**源码第 113 行**

```text
  return s;
// 注释：返回 s 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 114 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 117 行**

```text
export function stateText(state: string | number | undefined | null): string {
// 注释：定义函数 `stateText`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。
```

**源码第 118 行**

```text
  if (!state) return '—';
// 注释：判断 if (!state) return '—'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 119 行**

```text
  const s = normalizeState(state);
// 注释：声明 s，初始值由 normalizeState(state) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 120 行**

```text
  return STATE_TEXT[s] ?? s;
// 注释：返回 STATE_TEXT[s] ?? s 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 121 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 124 行**

```text
export function stateClass(state: string | number | undefined | null): string {
// 注释：定义函数 `stateClass`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。
```

**源码第 125 行**

```text
  if (!state) return '';
// 注释：判断 if (!state) return ''; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 126 行**

```text
  const s = normalizeState(state);
// 注释：声明 s，初始值由 normalizeState(state) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 127 行**

```text
  if (!KNOWN_STATES.has(s)) return '';
// 注释：判断 if (!KNOWN_STATES.has(s)) return ''; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 128 行**

```text
  return `st-${s}`;
// 注释：返回 `st-${s}` 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 129 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 132 行**

```text
export function stateTagType(
// 注释：定义函数 `stateTagType`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。
```

**源码第 133 行**

```text
  state: string | number | undefined | null,
// 注释：设置字段 `state`。 关键字：`undefined`＝未定义值；`null`＝空值。
```

**源码第 134 行**

```text
): 'success' | 'info' | 'danger' | 'warning' {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 135 行**

```text
  switch (stateTone(state)) {
// 注释：控制分支、循环或异常处理流程。 关键字：`switch`＝按值分派分支。
```

**源码第 136 行**

```text
    case 'run': return 'success';
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支；`return`＝返回结果并结束当前函数。
```

**源码第 137 行**

```text
    case 'error': return 'danger';
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支；`return`＝返回结果并结束当前函数。
```

**源码第 138 行**

```text
    case 'wait':
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。
```

**源码第 139 行**

```text
    case 'stop': return 'info';
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支；`return`＝返回结果并结束当前函数。
```

**源码第 140 行**

```text
    default: return 'warning';
// 注释：设置字段 `default`。 关键字：`default`＝指定默认导出或默认分支；`return`＝返回结果并结束当前函数。
```

**源码第 141 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 142 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 144 行**

```text
function stateTone(state: string | number | undefined | null): StateTone {
// 注释：定义函数 `stateTone`。 关键字：`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。
```

**源码第 145 行**

```text
  if (!state) return 'off';
// 注释：判断 if (!state) return 'off'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 146 行**

```text
  const s = normalizeState(state);
// 注释：声明 s，初始值由 normalizeState(state) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 147 行**

```text
  return STATE_TONE[s] ?? 'off';
// 注释：返回 STATE_TONE[s] ?? 'off' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 148 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 151 行**

```text
export function isRunning(state: string | number | undefined | null): boolean {
// 注释：定义函数 `isRunning`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`undefined`＝未定义值；`null`＝空值。
```

**源码第 152 行**

```text
  return stateTone(state) === 'run';
// 注释：返回 stateTone(state) === 'run' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 153 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
