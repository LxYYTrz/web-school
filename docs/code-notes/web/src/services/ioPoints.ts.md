# web/src/services/ioPoints.ts 逐行注释

[打开源码](../../../../../web/src/services/ioPoints.ts) · 83 行 · 60 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 7 行**

```text
export type IoField =
// 注释：声明 `IoField` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名。
```

**源码第 8 行**

```text
  | 'sensorIn'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 9 行**

```text
  | 'sensorArrive'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 10 行**

```text
  | 'sensorRetreat'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 11 行**

```text
  | 'lightColor'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 12 行**

```text
  | 'trayUp'
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 13 行**

```text
  | 'blockUp';
// 注释：给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
```

**源码第 15 行**

```text
export interface BoolPoint {
// 注释：声明 `BoolPoint` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 16 行**

```text
  kind: 'bool';
// 注释：设置字段 `kind`。
```

**源码第 18 行**

```text
  onLabel: string;
// 注释：设置字段 `onLabel`。
```

**源码第 19 行**

```text
  offLabel: string;
// 注释：设置字段 `offLabel`。
```

**源码第 21 行**

```text
  onTone: 'ok' | 'act';
// 注释：设置字段 `onTone`。
```

**源码第 22 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 24 行**

```text
export interface EnumPoint {
// 注释：声明 `EnumPoint` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 25 行**

```text
  kind: 'enum';
// 注释：设置字段 `kind`。
```

**源码第 26 行**

```text
  values: Record<number, string>;
// 注释：设置字段 `values`。
```

**源码第 28 行**

```text
  colors: Record<number, 'ok' | 'warn' | 'ng' | 'off'>;
// 注释：设置字段 `colors`。
```

**源码第 29 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 31 行**

```text
export type IoPointSpec = BoolPoint | EnumPoint;
// 注释：声明 `IoPointSpec` 的结构。 关键字：`export`＝向其他模块开放符号；`type`＝定义类型别名。
```

**源码第 33 行**

```text
export interface IoPoint {
// 注释：声明 `IoPoint` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 35 行**

```text
  index: number;
// 注释：设置字段 `index`。
```

**源码第 37 行**

```text
  word: number;
// 注释：设置字段 `word`。
```

**源码第 38 行**

```text
  field: IoField;
// 注释：设置字段 `field`。
```

**源码第 39 行**

```text
  label: string;
// 注释：设置字段 `label`。
```

**源码第 40 行**

```text
  spec: IoPointSpec;
// 注释：设置字段 `spec`。
```

**源码第 41 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 43 行**

```text
export const IO_POINTS: IoPoint[] = [
// 注释：导出这一行声明的符号，供项目其他模块使用。 关键字：`export`＝向其他模块开放符号；`const`＝声明不可重新绑定的变量。
```

**源码第 44 行**

```text
  { index: 12, word: 11, field: 'sensorIn', label: '入料传感器',
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 45 行**

```text
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
// 注释：设置字段 `spec`。
```

**源码第 46 行**

```text
  { index: 13, word: 12, field: 'sensorArrive', label: '到料传感器',
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 47 行**

```text
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
// 注释：设置字段 `spec`。
```

**源码第 48 行**

```text
  { index: 14, word: 13, field: 'sensorRetreat', label: '退料传感器',
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 49 行**

```text
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
// 注释：设置字段 `spec`。
```

**源码第 50 行**

```text
  { index: 15, word: 14, field: 'lightColor', label: '产线灯光颜色',
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 51 行**

```text
    spec: { kind: 'enum',
// 注释：设置字段 `spec`。
```

**源码第 52 行**

```text
            values: { 0: '绿灯', 1: '黄灯', 2: '红灯' },
// 注释：设置字段 `values`。
```

**源码第 53 行**

```text
            colors: { 0: 'ok', 1: 'warn', 2: 'ng' } } },
// 注释：设置字段 `colors`。
```

**源码第 54 行**

```text
  { index: 16, word: 15, field: 'trayUp', label: '托料盘上升',
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 55 行**

```text
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
// 注释：设置字段 `spec`。
```

**源码第 56 行**

```text
  { index: 17, word: 16, field: 'blockUp', label: '阻挡干上升',
// 注释：开始对象字面量，并在这一行设置其中列出的字段。
```

**源码第 57 行**

```text
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
// 注释：设置字段 `spec`。
```

**源码第 58 行**

```text
];
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 60 行**

```text
export function ioPointByField(field: IoField): IoPoint {
// 注释：定义函数 `ioPointByField`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数。
```

**源码第 61 行**

```text
  const p = IO_POINTS.find((x) => x.field === field);
// 注释：声明 p，初始值由 IO_POINTS.find((x) => x.field === field) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 62 行**

```text
  if (!p) throw new Error(`未知 IO 点位: ${field}`);
// 注释：判断 if (!p) throw new Error(`未知 IO 点位: ${field}`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`throw`＝抛出错误；`new`＝创建对象实例。
```

**源码第 63 行**

```text
  return p;
// 注释：返回 p 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 64 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 67 行**

```text
export function ioValueText(p: IoPoint, v: number | null | undefined): string {
// 注释：定义函数 `ioValueText`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。
```

**源码第 68 行**

```text
  if (v === null || v === undefined) return '—';
// 注释：判断 if (v === null || v === undefined) return '—'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`null`＝空值；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。
```

**源码第 69 行**

```text
  if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v);
// 注释：判断 if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 70 行**

```text
  return v > 0 ? p.spec.onLabel : p.spec.offLabel;
// 注释：返回 v > 0 ? p.spec.onLabel : p.spec.offLabel 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 71 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 74 行**

```text
export function ioTone(p: IoPoint, v: number | null | undefined): string {
// 注释：定义函数 `ioTone`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。
```

**源码第 75 行**

```text
  if (v === null || v === undefined) return 'idle';
// 注释：判断 if (v === null || v === undefined) return 'idle'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`null`＝空值；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。
```

**源码第 76 行**

```text
  if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off';
// 注释：判断 if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off'; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 77 行**

```text
  return v > 0 ? p.spec.onTone : 'idle';
// 注释：返回 v > 0 ? p.spec.onTone : 'idle' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 78 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 81 行**

```text
export function ioOn(v: number | null | undefined): boolean {
// 注释：定义函数 `ioOn`。 关键字：`export`＝向其他模块开放符号；`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。
```

**源码第 82 行**

```text
  return v !== null && v !== undefined && v > 0;
// 注释：返回 v !== null && v !== undefined && v > 0 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值；`undefined`＝未定义值。
```

**源码第 83 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
