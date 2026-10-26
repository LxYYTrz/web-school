// 与数据契约 docs/contract/README.md 对齐的前端类型(字段一致,只增不改)
// 机器人六轴遥测（契约 3.1）
export interface RobotState {
// 声明 RobotState 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  ts: number;
  // 设置字段 ts。
  deviceId: string;
  // 设置字段 deviceId。
  joints: [number, number, number, number, number, number];
  // 设置字段 joints。
  tcp: number[] | null;
  // 设置字段 tcp。 关键字：null＝空值。
  speedPct: number;
  // 设置字段 speedPct。
  mode: 'manual' | 'auto' | 'remote' | 'error' | string;
  // 设置字段 mode。
  program: string;
  // 设置字段 program。
  alarmCode: number;
  // 设置字段 alarmCode。
}
// 结束当前对象、函数或条件代码块。

// 产线状态快照（契约 3.2）
export interface LineStatus {
// 声明 LineStatus 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  ts: number;
  // 设置字段 ts。
  lineId: string;
  // 设置字段 lineId。
  // 契约 v1.1:4 态(兼容 mock/旧数据)+ 10 态(PLC 工序状态)
  // PLC 整数对照见 edge/plc_collector.py STATE_MAP 与 db/init/004_line_state_stages.sql
  state:
  // 设置字段 state。
    | 'running' | 'idle' | 'alarm' | 'offline'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    | 'waiting_feed' | 'feeding' | 'assembling' | 'waiting_robot'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    | 'unload_done' | 'waiting_next'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    | 'init_error' | 'stopped' | 'manual_mode'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    // 旧口径:2026-10-23 之前状态 3 叫 unloading(下料中),历史数据里还有
    | 'unloading'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    | string;
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
  productCode: string;
  // 设置字段 productCode。
  goodCount: number;
  // 设置字段 goodCount。
  ngCount: number;
  // 设置字段 ngCount。
  beatMs: number;
  // 设置字段 beatMs。
}
// 结束当前对象、函数或条件代码块。

// 生产事件 / 报警（契约 3.3）
export interface ProductionEvent {
// 声明 ProductionEvent 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  ts: number;
  // 设置字段 ts。
  lineId: string;
  // 设置字段 lineId。
  deviceId: string;
  // 设置字段 deviceId。
  type: 'start' | 'stop' | 'alarm' | 'piece_done' | 'changeover' | 'custom' | string;
  // 设置字段 type。 关键字：type＝定义类型别名。
  level: 'info' | 'warning' | 'critical';
  // 设置字段 level。
  code?: string | null;
  // 声明 可选字段 code，类型为 string | null。 关键字：null＝空值。
  message?: string | null;
  // 声明 可选字段 message，类型为 string | null。 关键字：null＝空值。
  payload?: Record<string, unknown>;
  // 声明 可选字段 payload，类型为 Record<string, unknown>。 关键字：unknown＝需检查后才能使用的类型。
}
// 结束当前对象、函数或条件代码块。

// 产线 IO 信号(契约 v1.3 §3.8,对应 DB3 MB_SERVER HOLD 区 word 11~16)
// 只读。单个点位读失败时为 null —— "没读到"和"确实是 0"必须区分开,
// 前端把 null 显示成 "—" 而不是 0。
export type IoValue = number | null;
// 声明 IoValue 的结构。 关键字：export＝向其他模块开放符号；type＝定义类型别名；null＝空值。

export interface IoSignals {
// 声明 IoSignals 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  sensorIn: IoValue;      // word 11 入料传感器  1=有料 0=无料
  // 设置字段 sensorIn。
  sensorArrive: IoValue;  // word 12 到料传感器  1=有料 0=无料
  // 设置字段 sensorArrive。
  sensorRetreat: IoValue; // word 13 退料传感器  1=有料 0=无料
  // 设置字段 sensorRetreat。
  lightColor: IoValue;    // word 14 产线灯光颜色 0=绿灯 1=黄灯 2=红灯
  // 设置字段 lightColor。
  trayUp: IoValue;        // word 15 托料盘上升  1=上升 0=下降
  // 设置字段 trayUp。
  blockUp: IoValue;       // word 16 阻挡干上升  1=上升 0=下降
  // 设置字段 blockUp。
}
// 结束当前对象、函数或条件代码块。

export interface IoState {
// 声明 IoState 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  ts: number;
  // 设置字段 ts。
  lineId: string;
  // 设置字段 lineId。
  io: IoSignals;
  // 设置字段 io。
}
// 结束当前对象、函数或条件代码块。

// 快照 REST 接口的返回(见 server/src/state/line-state.service.ts)
export interface LineSnapshot {
// 声明 LineSnapshot 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  lineId: string;
  // 设置字段 lineId。
  ts: number;
  // 设置字段 ts。
  status: LineStatus | null;
  // 设置字段 status。 关键字：null＝空值。
  edge: { status: 'online' | 'offline' } | null;
  // 设置字段 edge。 关键字：null＝空值。
  io: IoState | null;
  // 设置字段 io。 关键字：null＝空值。
  robots: Record<string, RobotState>;
  // 设置字段 robots。
}
// 结束当前对象、函数或条件代码块。

// 控制指令回执(契约 §3.7);前端订阅 socket 'command_ack' 收到
export interface CommandAck {
// 声明 CommandAck 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  cmdId: string;
  // 设置字段 cmdId。
  ts: number;
  // 设置字段 ts。
  status: 'acked' | 'rejected' | 'failed' | 'timeout';
  // 设置字段 status。
  message?: string | null;
  // 声明 可选字段 message，类型为 string | null。 关键字：null＝空值。
}
// 结束当前对象、函数或条件代码块。

// ---------------------------------------------------------------------------
// AI 助手(hermes agent)
// ---------------------------------------------------------------------------

/**
 * AI 提交的控制建议。**它不是一条指令** —— 只是候选。
 * 必须由用户点确认后才会走 POST /api/ai/proposals/:id/confirm → CommandService.issue()。
 * 前端订阅 socket 'ai_proposal' 收到(见 server/src/ai/proposal.service.ts)。
 */
export interface AiProposal {
// 声明 AiProposal 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  id: string;
  // 设置字段 id。
  lineId: string;
  // 设置字段 lineId。
  deviceId: string;
  // 设置字段 deviceId。
  type: string;
  // 设置字段 type。 关键字：type＝定义类型别名。
  params: Record<string, unknown>;
  // 设置字段 params。 关键字：unknown＝需检查后才能使用的类型。
  reason: string;
  // 设置字段 reason。
  status: 'pending';
  // 设置字段 status。
  createdAt: number;
  // 设置字段 createdAt。
}
// 结束当前对象、函数或条件代码块。

/** SSE 事件(后端 ai.service.ts 归一化后的形状,与 OpenAI chunk 无关) */
export interface AiStreamEvent {
// 声明 AiStreamEvent 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  type: 'delta' | 'tool' | 'error' | 'done';
  // 设置字段 type。 关键字：type＝定义类型别名。
  text?: string;
  // 声明 可选字段 text，类型为 string。
  name?: string;
  // 声明 可选字段 name，类型为 string。
  message?: string;
  // 声明 可选字段 message，类型为 string。
}
// 结束当前对象、函数或条件代码块。

/** 抽屉里的一条消息。工具痕迹不单独存气泡,折成 hint 挂在消息上 */
export interface AiMessage {
// 声明 AiMessage 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  role: 'user' | 'assistant';
  // 设置字段 role。
  text: string;
  // 设置字段 text。
  /** 本轮里 agent 用过的工具,用于展示「查了什么」 */
  tools?: string[];
  // 声明 可选字段 tools，类型为 string[]。
  error?: string;
  // 声明 可选字段 error，类型为 string。
  proposal?: AiProposal;
  // 声明 可选字段 proposal，类型为 AiProposal。
}
// 结束当前对象、函数或条件代码块。
