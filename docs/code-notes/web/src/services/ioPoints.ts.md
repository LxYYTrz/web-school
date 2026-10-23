# web/src/services/ioPoints.ts 逐行说明

[打开源码](../../../../../web/src/services/ioPoints.ts) · 83 行 · 60 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 7 | <code>export type IoField =</code> | 声明 `IoField` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名。 |
| 8 | <code>&#124; 'sensorIn'</code> | 续写当前表达式、对象、类型或调用。 |
| 9 | <code>&#124; 'sensorArrive'</code> | 续写当前表达式、对象、类型或调用。 |
| 10 | <code>&#124; 'sensorRetreat'</code> | 续写当前表达式、对象、类型或调用。 |
| 11 | <code>&#124; 'lightColor'</code> | 续写当前表达式、对象、类型或调用。 |
| 12 | <code>&#124; 'trayUp'</code> | 续写当前表达式、对象、类型或调用。 |
| 13 | <code>&#124; 'blockUp';</code> | 续写当前表达式、对象、类型或调用。 |
| 15 | <code>export interface BoolPoint {</code> | 声明 `BoolPoint` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 16 | <code>kind: 'bool';</code> | 设置字段 `kind`。 |
| 18 | <code>onLabel: string;</code> | 设置字段 `onLabel`。 |
| 19 | <code>offLabel: string;</code> | 设置字段 `offLabel`。 |
| 21 | <code>onTone: 'ok' &#124; 'act';</code> | 设置字段 `onTone`。 |
| 22 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 24 | <code>export interface EnumPoint {</code> | 声明 `EnumPoint` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 25 | <code>kind: 'enum';</code> | 设置字段 `kind`。 |
| 26 | <code>values: Record&lt;number, string&gt;;</code> | 设置字段 `values`。 |
| 28 | <code>colors: Record&lt;number, 'ok' &#124; 'warn' &#124; 'ng' &#124; 'off'&gt;;</code> | 设置字段 `colors`。 |
| 29 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 31 | <code>export type IoPointSpec = BoolPoint &#124; EnumPoint;</code> | 声明 `IoPointSpec` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名。 |
| 33 | <code>export interface IoPoint {</code> | 声明 `IoPoint` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。 |
| 35 | <code>index: number;</code> | 设置字段 `index`。 |
| 37 | <code>word: number;</code> | 设置字段 `word`。 |
| 38 | <code>field: IoField;</code> | 设置字段 `field`。 |
| 39 | <code>label: string;</code> | 设置字段 `label`。 |
| 40 | <code>spec: IoPointSpec;</code> | 设置字段 `spec`。 |
| 41 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 43 | <code>export const IO_POINTS: IoPoint[] = [</code> | 声明变量 `IO_POINTS` 并设置初始值或类型。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。 |
| 44 | <code>{ index: 12, word: 11, field: 'sensorIn', label: '入料传感器',</code> | 续写当前表达式、对象、类型或调用。 |
| 45 | <code>spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },</code> | 设置字段 `spec`。 |
| 46 | <code>{ index: 13, word: 12, field: 'sensorArrive', label: '到料传感器',</code> | 续写当前表达式、对象、类型或调用。 |
| 47 | <code>spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },</code> | 设置字段 `spec`。 |
| 48 | <code>{ index: 14, word: 13, field: 'sensorRetreat', label: '退料传感器',</code> | 续写当前表达式、对象、类型或调用。 |
| 49 | <code>spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },</code> | 设置字段 `spec`。 |
| 50 | <code>{ index: 15, word: 14, field: 'lightColor', label: '产线灯光颜色',</code> | 续写当前表达式、对象、类型或调用。 |
| 51 | <code>spec: { kind: 'enum',</code> | 设置字段 `spec`。 |
| 52 | <code>values: { 0: '绿灯', 1: '黄灯', 2: '红灯' },</code> | 设置字段 `values`。 |
| 53 | <code>colors: { 0: 'ok', 1: 'warn', 2: 'ng' } } },</code> | 设置字段 `colors`。 |
| 54 | <code>{ index: 16, word: 15, field: 'trayUp', label: '托料盘上升',</code> | 续写当前表达式、对象、类型或调用。 |
| 55 | <code>spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },</code> | 设置字段 `spec`。 |
| 56 | <code>{ index: 17, word: 16, field: 'blockUp', label: '阻挡干上升',</code> | 续写当前表达式、对象、类型或调用。 |
| 57 | <code>spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },</code> | 设置字段 `spec`。 |
| 58 | <code>];</code> | 续写当前表达式、对象、类型或调用。 |
| 60 | <code>export function ioPointByField(field: IoField): IoPoint {</code> | 定义函数 `ioPointByField`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。 |
| 61 | <code>const p = IO_POINTS.find((x) =&gt; x.field === field);</code> | 声明变量 `p` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 62 | <code>if (!p) throw new Error(`未知 IO 点位: ${field}`);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。 |
| 63 | <code>return p;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 64 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 67 | <code>export function ioValueText(p: IoPoint, v: number &#124; null &#124; undefined): string {</code> | 定义函数 `ioValueText`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。 |
| 68 | <code>if (v === null &#124;&#124; v === undefined) return '—';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`null`＝空值；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。 |
| 69 | <code>if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 70 | <code>return v &gt; 0 ? p.spec.onLabel : p.spec.offLabel;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 71 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 74 | <code>export function ioTone(p: IoPoint, v: number &#124; null &#124; undefined): string {</code> | 定义函数 `ioTone`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。 |
| 75 | <code>if (v === null &#124;&#124; v === undefined) return 'idle';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`null`＝空值；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。 |
| 76 | <code>if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 77 | <code>return v &gt; 0 ? p.spec.onTone : 'idle';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 78 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 81 | <code>export function ioOn(v: number &#124; null &#124; undefined): boolean {</code> | 定义函数 `ioOn`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。 |
| 82 | <code>return v !== null &amp;&amp; v !== undefined &amp;&amp; v &gt; 0;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值；`undefined`＝未定义值。 |
| 83 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
