// 产线 IO 点位元数据 —— 契约 v1.3 §3.8 / edge/register-mapping.csv 的 io.* 行。
// 单点定义,跟 services/lineState.ts 同样的约定:文案与配色只在这里写一份,
// IoView / IoPanel 共用,避免各组件各写一份映射。
//
// 现场改点位(CSV 改 address / 加减点)时,改 CSV → 同步改这里 → 同步改 plc_collector。

export type IoField =
// 声明 IoField 的结构。 关键字：export＝向其他模块开放符号；type＝定义类型别名。
  | 'sensorIn'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  | 'sensorArrive'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  | 'sensorRetreat'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  | 'lightColor'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  | 'trayUp'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  | 'blockUp';
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。

export interface BoolPoint {
// 声明 BoolPoint 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  kind: 'bool';
  // 设置字段 kind。
  /** 值 > 0 视为有信号 */
  onLabel: string;
  // 设置字段 onLabel。
  offLabel: string;
  // 设置字段 offLabel。
  /** 有信号时灯的颜色语义:ok=正常检出 / act=执行中(绿) / warn=需留意 */
  onTone: 'ok' | 'act';
  // 设置字段 onTone。
}
// 结束当前对象、函数或条件代码块。

export interface EnumPoint {
// 声明 EnumPoint 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  kind: 'enum';
  // 设置字段 kind。
  values: Record<number, string>;
  // 设置字段 values。
  /** 值的展示色:灯色 / 标签色 */
  colors: Record<number, 'ok' | 'warn' | 'ng' | 'off'>;
  // 设置字段 colors。
}
// 结束当前对象、函数或条件代码块。

export type IoPointSpec = BoolPoint | EnumPoint;
// 声明 IoPointSpec 的结构。 关键字：export＝向其他模块开放符号；type＝定义类型别名。

export interface IoPoint {
// 声明 IoPoint 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  /** DB3 序号(#),word 11 对应 #12 */
  index: number;
  // 设置字段 index。
  /** Modbus 字地址 */
  word: number;
  // 设置字段 word。
  field: IoField;
  // 设置字段 field。
  label: string;
  // 设置字段 label。
  spec: IoPointSpec;
  // 设置字段 spec。
}
// 结束当前对象、函数或条件代码块。

export const IO_POINTS: IoPoint[] = [
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
  { index: 12, word: 11, field: 'sensorIn', label: '入料传感器',
  // 开始对象字面量，并在这一行设置其中列出的字段。
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
    // 设置字段 spec。
  { index: 13, word: 12, field: 'sensorArrive', label: '到料传感器',
  // 开始对象字面量，并在这一行设置其中列出的字段。
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
    // 设置字段 spec。
  { index: 14, word: 13, field: 'sensorRetreat', label: '退料传感器',
  // 开始对象字面量，并在这一行设置其中列出的字段。
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
    // 设置字段 spec。
  { index: 15, word: 14, field: 'lightColor', label: '产线灯光颜色',
  // 开始对象字面量，并在这一行设置其中列出的字段。
    spec: { kind: 'enum',
    // 设置字段 spec。
            values: { 0: '绿灯', 1: '黄灯', 2: '红灯' },
            // 设置字段 values。
            colors: { 0: 'ok', 1: 'warn', 2: 'ng' } } },
            // 设置字段 colors。
  { index: 16, word: 15, field: 'trayUp', label: '托料盘上升',
  // 开始对象字面量，并在这一行设置其中列出的字段。
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
    // 设置字段 spec。
  { index: 17, word: 16, field: 'blockUp', label: '阻挡干上升',
  // 开始对象字面量，并在这一行设置其中列出的字段。
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
    // 设置字段 spec。
];
// 继续当前表达式；这一行的值由外层代码块或调用使用。

export function ioPointByField(field: IoField): IoPoint {
// 定义函数 ioPointByField。 关键字：export＝向其他模块开放符号；function＝定义函数。
  const p = IO_POINTS.find((x) => x.field === field);
  // 声明 p，初始值由 IO_POINTS.find((x) => x.field === field) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (!p) throw new Error(`未知 IO 点位: ${field}`);
  // 判断 if (!p) throw new Error(未知 IO 点位: ${field}); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。
  return p;
  // 返回 p 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 展示文案。null → '—'(没读到);未知枚举值原样显示数字,不报错 */
export function ioValueText(p: IoPoint, v: number | null | undefined): string {
// 定义函数 ioValueText。 关键字：export＝向其他模块开放符号；function＝定义函数；null＝空值；undefined＝未定义值。
  if (v === null || v === undefined) return '—';
  // 判断 if (v === null || v === undefined) return '—'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；null＝空值；undefined＝未定义值；return＝返回结果并结束当前函数。
  if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v);
  // 判断 if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  return v > 0 ? p.spec.onLabel : p.spec.offLabel;
  // 返回 v > 0 ? p.spec.onLabel : p.spec.offLabel 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 语义色 class 后缀 ok/act/warn/ng/off/idle,用于灯点与标签 */
export function ioTone(p: IoPoint, v: number | null | undefined): string {
// 定义函数 ioTone。 关键字：export＝向其他模块开放符号；function＝定义函数；null＝空值；undefined＝未定义值。
  if (v === null || v === undefined) return 'idle';
  // 判断 if (v === null || v === undefined) return 'idle'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；null＝空值；undefined＝未定义值；return＝返回结果并结束当前函数。
  if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off';
  // 判断 if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  return v > 0 ? p.spec.onTone : 'idle';
  // 返回 v > 0 ? p.spec.onTone : 'idle' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 该点位是否有信号(bool 专用) */
export function ioOn(v: number | null | undefined): boolean {
// 定义函数 ioOn。 关键字：export＝向其他模块开放符号；function＝定义函数；null＝空值；undefined＝未定义值。
  return v !== null && v !== undefined && v > 0;
  // 返回 v !== null && v !== undefined && v > 0 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值；undefined＝未定义值。
}
// 结束当前对象、函数或条件代码块。
