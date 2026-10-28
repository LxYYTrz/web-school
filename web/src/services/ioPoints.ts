/**
 * 前端六路 IO 的点位和显示规则，供 IoPanel 与 IoView 使用。
 * IO_POINTS 将字段、地址、标签和布尔/枚举规则对应；下方函数统一生成文字、色调与有无信号判断。
 * null/undefined 表示没有取得该值，显示横线；灯色和机构状态按各自规则解释，不把所有 0、1 当成同一种状态。
 */
// 产线 IO 点位元数据 —— 契约 v1.3 §3.8 / edge/register-mapping.csv 的 io.* 行。
// 单点定义,跟 services/lineState.ts 同样的约定:文案与配色只在这里写一份,
// IoView / IoPanel 共用,避免各组件各写一份映射。
//
// 现场改点位(CSV 改 address / 加减点)时,改 CSV → 同步改这里 → 同步改 plc_collector。

export type IoField =
  | 'sensorIn'
  // 这一行允许的取值分别是 sensorIn，由上方字段或类型联合声明使用
  | 'sensorArrive'
  // 这一行允许的取值分别是 sensorArrive，由上方字段或类型联合声明使用
  | 'sensorRetreat'
  // 这一行允许的取值分别是 sensorRetreat，由上方字段或类型联合声明使用
  | 'lightColor'
  // 这一行允许的取值分别是 lightColor，由上方字段或类型联合声明使用
  | 'trayUp'
  // 这一行允许的取值分别是 trayUp，由上方字段或类型联合声明使用
  | 'blockUp';
  // 这一行允许的取值分别是 blockUp，由上方字段或类型联合声明使用

export interface BoolPoint {
// BoolPoint 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  kind: 'bool';
  /** 值 > 0 视为有信号 */
  onLabel: string;
  offLabel: string;
  /** 有信号时灯的颜色语义:ok=正常检出 / act=执行中(绿) / warn=需留意 */
  onTone: 'ok' | 'act';
}

export interface EnumPoint {
// EnumPoint 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  kind: 'enum';
  values: Record<number, string>;
  /** 值的展示色:灯色 / 标签色 */
  colors: Record<number, 'ok' | 'warn' | 'ng' | 'off'>;
}

export type IoPointSpec = BoolPoint | EnumPoint;

export interface IoPoint {
// IoPoint 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  /** DB3 序号(#),word 11 对应 #12 */
  index: number;
  /** Modbus 字地址 */
  word: number;
  field: IoField;
  label: string;
  spec: IoPointSpec;
}

// IO_POINTS 是各 IO 点位的网页显示规则，不是机器人关节角的下一次转换。
// field 对应 IO 报文里的字段，word 对应现场寄存器地址；传感器的 1/0 显示有料/无料，机构的 1/0 显示上升/下降。
// lightColor 用枚举规则把 0/1/2 显示为绿/黄/红；同一个数必须结合点位解释，不能统一套一个布尔文案。
// 格式化函数读取这些规则后生成文字和色调；无数据与合法的 0 分开处理。

export const IO_POINTS: IoPoint[] = [
// 集中定义各 IO 字段的显示规则，让页面按点位生成对应文字和色调。
// IO_POINTS 的 field 对应 IO 报文字段；word 是点表地址；spec 区分布尔标签和灯色枚举，不能把所有 1 都显示成同一种含义。
  { index: 12, word: 11, field: 'sensorIn', label: '入料传感器',
  // index 12 是点位序号；word 11 是 PLC 寄存器号；field sensorIn 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
  { index: 13, word: 12, field: 'sensorArrive', label: '到料传感器',
  // index 13 是点位序号；word 12 是 PLC 寄存器号；field sensorArrive 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
  { index: 14, word: 13, field: 'sensorRetreat', label: '退料传感器',
  // index 14 是点位序号；word 13 是 PLC 寄存器号；field sensorRetreat 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
  { index: 15, word: 14, field: 'lightColor', label: '产线灯光颜色',
  // index 15 是点位序号；word 14 是 PLC 寄存器号；field lightColor 是 IO 报文中的字段名
    spec: { kind: 'enum',
            values: { 0: '绿灯', 1: '黄灯', 2: '红灯' },
            colors: { 0: 'ok', 1: 'warn', 2: 'ng' } } },
  { index: 16, word: 15, field: 'trayUp', label: '托料盘上升',
  // index 16 是点位序号；word 15 是 PLC 寄存器号；field trayUp 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
  { index: 17, word: 16, field: 'blockUp', label: '阻挡干上升',
  // index 17 是点位序号；word 16 是 PLC 寄存器号；field blockUp 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
];
// 此处结束上方数组的元素列表，并完成赋值或返回语句

export function ioPointByField(field: IoField): IoPoint {
  const p = IO_POINTS.find((x) => x.field === field);
  if (!p) throw new Error(`未知 IO 点位: ${field}`);
  return p;
}

// 按当前点位 spec 将原始值转成中文：空值显示横线，枚举查表，布尔点按大于 0 判断。
// p 来自 IO_POINTS，v 来自当前 IO 帧；未知枚举保留原数字，避免编造现场含义。
export function ioValueText(p: IoPoint, v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v);
  return v > 0 ? p.spec.onLabel : p.spec.offLabel;
}

// 按同一份点位规则选择界面语义色，空值使用 idle，未知枚举使用 off。
// 色调用于网页样式，与 PLC 寄存器写值或物理动作完成没有直接等价关系。
export function ioTone(p: IoPoint, v: number | null | undefined): string {
// 定义 ioTone，用于按 IO 点位含义选择界面提示色调。
  if (v === null || v === undefined) return 'idle';
  if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off';
  return v > 0 ? p.spec.onTone : 'idle';
}

/** 该点位是否有信号(bool 专用) */
export function ioOn(v: number | null | undefined): boolean {
// 定义 ioOn，用于判断 IO 信号是否处于启用或动作状态。
  return v !== null && v !== undefined && v > 0;
}
