// 产线 IO 点位元数据 —— 契约 v1.3 §3.8 / edge/register-mapping.csv 的 io.* 行。
// 单点定义,跟 services/lineState.ts 同样的约定:文案与配色只在这里写一份,
// IoView / IoPanel 共用,避免各组件各写一份映射。
//
// 现场改点位(CSV 改 address / 加减点)时,改 CSV → 同步改这里 → 同步改 plc_collector。

export type IoField =
  | 'sensorIn'
  | 'sensorArrive'
  | 'sensorRetreat'
  | 'lightColor'
  | 'trayUp'
  | 'blockUp';

export interface BoolPoint {
  kind: 'bool';
  /** 值 > 0 视为有信号 */
  onLabel: string;
  offLabel: string;
  /** 有信号时灯的颜色语义:ok=正常检出 / act=执行中(绿) / warn=需留意 */
  onTone: 'ok' | 'act';
}

export interface EnumPoint {
  kind: 'enum';
  values: Record<number, string>;
  /** 值的展示色:灯色 / 标签色 */
  colors: Record<number, 'ok' | 'warn' | 'ng' | 'off'>;
}

export type IoPointSpec = BoolPoint | EnumPoint;

export interface IoPoint {
  /** DB3 序号(#),word 11 对应 #12 */
  index: number;
  /** Modbus 字地址 */
  word: number;
  field: IoField;
  label: string;
  spec: IoPointSpec;
}

export const IO_POINTS: IoPoint[] = [
  { index: 12, word: 11, field: 'sensorIn', label: '入料传感器',
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
  { index: 13, word: 12, field: 'sensorArrive', label: '到料传感器',
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
  { index: 14, word: 13, field: 'sensorRetreat', label: '退料传感器',
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
  { index: 15, word: 14, field: 'lightColor', label: '产线灯光颜色',
    spec: { kind: 'enum',
            values: { 0: '绿灯', 1: '黄灯', 2: '红灯' },
            colors: { 0: 'ok', 1: 'warn', 2: 'ng' } } },
  { index: 16, word: 15, field: 'trayUp', label: '托料盘上升',
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
  { index: 17, word: 16, field: 'blockUp', label: '阻挡干上升',
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
];

export function ioPointByField(field: IoField): IoPoint {
  const p = IO_POINTS.find((x) => x.field === field);
  if (!p) throw new Error(`未知 IO 点位: ${field}`);
  return p;
}

/** 展示文案。null → '—'(没读到);未知枚举值原样显示数字,不报错 */
export function ioValueText(p: IoPoint, v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v);
  return v > 0 ? p.spec.onLabel : p.spec.offLabel;
}

/** 语义色 class 后缀 ok/act/warn/ng/off/idle,用于灯点与标签 */
export function ioTone(p: IoPoint, v: number | null | undefined): string {
  if (v === null || v === undefined) return 'idle';
  if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off';
  return v > 0 ? p.spec.onTone : 'idle';
}

/** 该点位是否有信号(bool 专用) */
export function ioOn(v: number | null | undefined): boolean {
  return v !== null && v !== undefined && v > 0;
}
