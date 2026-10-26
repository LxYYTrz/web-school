// 产线 IO 点位元数据 —— 契约 v1.3 §3.8 / edge/register-mapping.csv 的 io.* 行。
// 单点定义,跟 services/lineState.ts 同样的约定:文案与配色只在这里写一份,
// IoView / IoPanel 共用,避免各组件各写一份映射。
//
// 现场改点位(CSV 改 address / 加减点)时,改 CSV → 同步改这里 → 同步改 plc_collector。

// 这一段负责配置和实现 web/src/services/ioPoints.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
export type IoField =
// 定义 IoField，约束或实现本模块涉及的数据和行为。
// IoField：本处声明的字段或类型，类型为 | 'sensorIn' | 'sensorArrive' | 'sensorRetreat' | 'lightColo…
  | 'sensorIn'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  // 这一行允许的取值分别是 sensorIn，由上方字段或类型联合声明使用
  | 'sensorArrive'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  // 这一行允许的取值分别是 sensorArrive，由上方字段或类型联合声明使用
  | 'sensorRetreat'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  // 这一行允许的取值分别是 sensorRetreat，由上方字段或类型联合声明使用
  | 'lightColor'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  // 这一行允许的取值分别是 lightColor，由上方字段或类型联合声明使用
  | 'trayUp'
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  // 这一行允许的取值分别是 trayUp，由上方字段或类型联合声明使用
  | 'blockUp';
  // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  // 这一行允许的取值分别是 blockUp，由上方字段或类型联合声明使用

// 这一段声明 BoolPoint，用于BoolPoint 的相关数据和行为。
export interface BoolPoint {
// 定义 BoolPoint，约束或实现本模块涉及的数据和行为。
// BoolPoint 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  kind: 'bool';
  // 声明或设置 kind，用于当前对象或接口的对应数据。
  // kind：本处声明的字段或类型，类型为 'bool'
  /** 值 > 0 视为有信号 */
  onLabel: string;
  // 声明或设置 onLabel，用于当前对象或接口的对应数据。
  // onLabel：本处声明的字段或类型，类型为 string
  offLabel: string;
  // 声明或设置 offLabel，用于当前对象或接口的对应数据。
  // offLabel：本处声明的字段或类型，类型为 string
  /** 有信号时灯的颜色语义:ok=正常检出 / act=执行中(绿) / warn=需留意 */
  onTone: 'ok' | 'act';
  // 声明或设置 onTone，用于当前对象或接口的对应数据。
  // onTone：本处声明的字段或类型，类型为 'ok' | 'act'
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 BoolPoint 的字段或服务能力，供项目其他模块使用。

// 这一段声明 EnumPoint，用于EnumPoint 的相关数据和行为。
export interface EnumPoint {
// 定义 EnumPoint，约束或实现本模块涉及的数据和行为。
// EnumPoint 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  kind: 'enum';
  // 声明或设置 kind，用于当前对象或接口的对应数据。
  // kind：本处声明的字段或类型，类型为 'enum'
  values: Record<number, string>;
  // 声明或设置 values，用于当前对象或接口的对应数据。
  // values：本处声明的字段或类型，类型为 Record<number, string>；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
  /** 值的展示色:灯色 / 标签色 */
  colors: Record<number, 'ok' | 'warn' | 'ng' | 'off'>;
  // 声明或设置 colors，用于当前对象或接口的对应数据。
  // colors：本处声明的字段或类型，类型为 Record<number, 'ok' | 'warn' | 'ng' | 'off'>；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 EnumPoint 的字段或服务能力，供项目其他模块使用。

export type IoPointSpec = BoolPoint | EnumPoint;
// 定义 IoPointSpec，约束或实现本模块涉及的数据和行为。
// IoPointSpec：本处声明的字段或类型，类型为 BoolPoint | EnumPoint

// 这一段声明 IoPoint，用于IoPoint 的相关数据和行为。
export interface IoPoint {
// 定义 IoPoint，约束或实现本模块涉及的数据和行为。
// IoPoint 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  /** DB3 序号(#),word 11 对应 #12 */
  index: number;
  // 声明或设置 index，用于当前对象或接口的对应数据。
  // index：本处声明的字段或类型，类型为 number
  /** Modbus 字地址 */
  word: number;
  // 声明或设置 word，用于当前对象或接口的对应数据。
  // word：本处声明的字段或类型，类型为 number
  field: IoField;
  // 声明或设置 field，用于当前对象或接口的对应数据。
  // field：本处声明的字段或类型，类型为 IoField；IoField：本处声明的字段或类型，类型为 | 'sensorIn' | 'sensorArrive' | 'sensorRetreat' | 'lightColo…
  label: string;
  // 声明或设置 label，用于当前对象或接口的对应数据。
  // label：本处声明的字段或类型，类型为 string
  spec: IoPointSpec;
  // 声明或设置 spec，用于当前对象或接口的对应数据。
  // spec：本处声明的字段或类型，类型为 IoPointSpec；IoPointSpec：本处声明的字段或类型，类型为 BoolPoint | EnumPoint
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 IoPoint 的字段或服务能力，供项目其他模块使用。

export const IO_POINTS: IoPoint[] = [
// 导出这一行声明的符号，供项目其他模块使用。
// IO_POINTS：本处保存 [ { index: 12, word: 11, field: 'sensorIn', label: '入料传感器', … 的结果，类型为 IoPoint[]
  { index: 12, word: 11, field: 'sensorIn', label: '入料传感器',
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // index 12 是点位序号；word 11 是 PLC 寄存器号；field sensorIn 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
    // 声明或设置 spec，用于当前对象或接口的对应数据。
    // spec 是此处声明的字段，类型或取值约束为 { kind: 'bool'
  { index: 13, word: 12, field: 'sensorArrive', label: '到料传感器',
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // index 13 是点位序号；word 12 是 PLC 寄存器号；field sensorArrive 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
    // 声明或设置 spec，用于当前对象或接口的对应数据。
    // spec 是此处声明的字段，类型或取值约束为 { kind: 'bool'
  { index: 14, word: 13, field: 'sensorRetreat', label: '退料传感器',
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // index 14 是点位序号；word 13 是 PLC 寄存器号；field sensorRetreat 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '有料', offLabel: '无料', onTone: 'ok' } },
    // 声明或设置 spec，用于当前对象或接口的对应数据。
    // spec 是此处声明的字段，类型或取值约束为 { kind: 'bool'
  { index: 15, word: 14, field: 'lightColor', label: '产线灯光颜色',
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // index 15 是点位序号；word 14 是 PLC 寄存器号；field lightColor 是 IO 报文中的字段名
    spec: { kind: 'enum',
    // 声明或设置 spec，用于当前对象或接口的对应数据。
    // spec 是此处声明的字段，类型或取值约束为 { kind: 'enum'
            values: { 0: '绿灯', 1: '黄灯', 2: '红灯' },
            // 声明或设置 values，用于当前对象或接口的对应数据。
            // values 是此处声明的字段，类型或取值约束为 { 0: '绿灯'
            colors: { 0: 'ok', 1: 'warn', 2: 'ng' } } },
            // 声明或设置 colors，用于当前对象或接口的对应数据。
            // colors 是此处声明的字段，类型或取值约束为 { 0: 'ok'
  { index: 16, word: 15, field: 'trayUp', label: '托料盘上升',
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // index 16 是点位序号；word 15 是 PLC 寄存器号；field trayUp 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
    // 声明或设置 spec，用于当前对象或接口的对应数据。
    // spec 是此处声明的字段，类型或取值约束为 { kind: 'bool'
  { index: 17, word: 16, field: 'blockUp', label: '阻挡干上升',
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // index 17 是点位序号；word 16 是 PLC 寄存器号；field blockUp 是 IO 报文中的字段名
    spec: { kind: 'bool', onLabel: '上升', offLabel: '下降', onTone: 'act' } },
    // 声明或设置 spec，用于当前对象或接口的对应数据。
    // spec 是此处声明的字段，类型或取值约束为 { kind: 'bool'
];
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 此处结束上方数组的元素列表，并完成赋值或返回语句

// 这一段定义 ioPointByField，用于按信号字段查找 IO 点位说明。
export function ioPointByField(field: IoField): IoPoint {
// 定义函数 ioPointByField。
// ioPointByField：按信号字段查找 IO 点位说明；field：当前方法接收的参数，类型为 IoField；IoField：本处声明的字段或类型，类型为 | 'sensorIn' | 'sensorArrive' | 'sensorRetreat' | 'lightColo…
  const p = IO_POINTS.find((x) => x.field === field);
  // 查找首个满足条件的集合元素，将结果保存或写入 p。
  // p：本处保存 IO_POINTS.find((x) => x.field === field) 的结果；IO_POINTS：本处保存 [ { index: 12, word: 11, field: 'sensorIn', label: '入料传感器', … 的结果，类型为 IoPoint[]；find：查找首个满足条件的集合元素；x：当前方法接收的参数；field：本处声明的字段或类型，类型为 IoField
  if (!p) throw new Error(`未知 IO 点位: ${field}`);
  // 条件 (!p) throw new Error(`未知 IO 点位: ${field}`); 成立时按本行给出的错误终止处理。
  // p：本处保存 IO_POINTS.find((x) => x.field === field) 的结果；Error：标准错误对象类型；field：当前方法接收的参数，类型为 IoField
  return p;
  // 把p作为当前函数的结果返回。
  // p：本处保存 IO_POINTS.find((x) => x.field === field) 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了按信号字段查找 IO 点位说明的实现；实际结果由运行时输入和执行分支决定。

/** 展示文案。null → '—'(没读到);未知枚举值原样显示数字,不报错 */
// 这一段定义 ioValueText，用于把 IO 数值或空值转换为现场含义文字。
export function ioValueText(p: IoPoint, v: number | null | undefined): string {
// 定义函数 ioValueText。
// ioValueText：把 IO 数值或空值转换为现场含义文字；p：当前方法接收的参数，类型为 IoPoint；v：当前方法接收的参数，类型为 number | null | undefined
  if (v === null || v === undefined) return '—';
  // 检查(v === null || v === undefined) return '—';，按判断结果进入对应的处理分支。
  // v：当前方法接收的参数，类型为 number | null | undefined
  if (p.spec.kind === 'enum') return p.spec.values[v] ?? String(v);
  // 检查(p.spec.kind === 'enum') return p.spec.values[v] ?? String(v);，按判断结果进入对应的处理分支。
  // p：当前方法接收的参数，类型为 IoPoint；spec：本处声明的字段或类型，类型为 IoPointSpec；kind：本处声明的字段或类型，类型为 'bool'；values：本处声明的字段或类型，类型为 Record<number, string>；v：当前方法接收的参数，类型为 number | null | undefined；String：将值转换为文本的 JavaScript 构造函数
  return v > 0 ? p.spec.onLabel : p.spec.offLabel;
  // 把v > 0 ? p.spec.onLabel : p.spec.offLabel作为当前函数的结果返回。
  // v：当前方法接收的参数，类型为 number | null | undefined；p：当前方法接收的参数，类型为 IoPoint；spec：本处声明的字段或类型，类型为 IoPointSpec；onLabel：本处声明的字段或类型，类型为 string；offLabel：本处声明的字段或类型，类型为 string
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了把 IO 数值或空值转换为现场含义文字的实现；实际结果由运行时输入和执行分支决定。

/** 语义色 class 后缀 ok/act/warn/ng/off/idle,用于灯点与标签 */
// 这一段定义 ioTone，用于按 IO 点位含义选择界面提示色调。
export function ioTone(p: IoPoint, v: number | null | undefined): string {
// 定义 ioTone，用于按 IO 点位含义选择界面提示色调。
// ioTone：按 IO 点位含义选择界面提示色调；p：当前方法接收的参数，类型为 IoPoint；v：当前方法接收的参数，类型为 number | null | undefined
  if (v === null || v === undefined) return 'idle';
  // 检查(v === null || v === undefined) return 'idle';，按判断结果进入对应的处理分支。
  // v：当前方法接收的参数，类型为 number | null | undefined
  if (p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off';
  // 检查(p.spec.kind === 'enum') return p.spec.colors[v] ?? 'off';，按判断结果进入对应的处理分支。
  // p：当前方法接收的参数，类型为 IoPoint；spec：本处声明的字段或类型，类型为 IoPointSpec；kind：本处声明的字段或类型，类型为 'bool'；colors：本处声明的字段或类型，类型为 Record<number, 'ok' | 'warn' | 'ng' | 'off'>；v：当前方法接收的参数，类型为 number | null | undefined
  return v > 0 ? p.spec.onTone : 'idle';
  // 把v > 0 ? p.spec.onTone : 'idle'作为当前函数的结果返回。
  // v：当前方法接收的参数，类型为 number | null | undefined；p：当前方法接收的参数，类型为 IoPoint；spec：本处声明的字段或类型，类型为 IoPointSpec；onTone：本处声明的字段或类型，类型为 'ok' | 'act'
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了按 IO 点位含义选择界面提示色调的实现；实际结果由运行时输入和执行分支决定。

/** 该点位是否有信号(bool 专用) */
// 这一段定义 ioOn，用于判断 IO 信号是否处于启用或动作状态。
export function ioOn(v: number | null | undefined): boolean {
// 定义 ioOn，用于判断 IO 信号是否处于启用或动作状态。
// ioOn：判断 IO 信号是否处于启用或动作状态；v：当前方法接收的参数，类型为 number | null | undefined
  return v !== null && v !== undefined && v > 0;
  // 把v !== null && v !== undefined && v > 0作为当前函数的结果返回。
  // v：当前方法接收的参数，类型为 number | null | undefined
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/services/ioPoints.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了判断 IO 信号是否处于启用或动作状态的实现；实际结果由运行时输入和执行分支决定。
