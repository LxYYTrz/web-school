// 与数据契约 docs/contract/README.md 对齐的前端类型(字段一致,只增不改)
export interface RobotState {
  ts: number;
  deviceId: string;
  joints: [number, number, number, number, number, number];
  tcp: number[] | null;
  speedPct: number;
  mode: 'manual' | 'auto' | 'remote' | 'error' | string;
  program: string;
  alarmCode: number;
}

export interface LineStatus {
  ts: number;
  lineId: string;
  // 契约 v1.1:4 态(兼容 mock/旧数据)+ 10 态(PLC 工序状态)
  // PLC 整数对照见 edge/plc_collector.py STATE_MAP 与 db/init/004_line_state_stages.sql
  state:
    | 'running' | 'idle' | 'alarm' | 'offline'
    | 'waiting_feed' | 'feeding' | 'assembling' | 'unloading'
    | 'unload_done' | 'waiting_next'
    | 'init_error' | 'stopped' | 'manual_mode'
    | string;
  productCode: string;
  goodCount: number;
  ngCount: number;
  beatMs: number;
}

export interface ProductionEvent {
  ts: number;
  lineId: string;
  deviceId: string;
  type: 'start' | 'stop' | 'alarm' | 'piece_done' | 'changeover' | 'custom' | string;
  level: 'info' | 'warning' | 'critical';
  code?: string | null;
  message?: string | null;
  payload?: Record<string, unknown>;
}

export interface VisionDefect {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VisionResult {
  ts: number;
  lineId: string;
  cameraId: string;
  sn: string;
  result: 'ok' | 'ng';
  defects: VisionDefect[];
  imageUrl: string | null;
  thumbUrl: string | null;
}

// 产线 IO 信号(契约 v1.3 §3.8,对应 DB3 MB_SERVER HOLD 区 word 11~16)
// 只读。单个点位读失败时为 null —— "没读到"和"确实是 0"必须区分开,
// 前端把 null 显示成 "—" 而不是 0。
export type IoValue = number | null;

export interface IoSignals {
  sensorIn: IoValue;      // word 11 入料传感器  1=有料 0=无料
  sensorArrive: IoValue;  // word 12 到料传感器  1=有料 0=无料
  sensorRetreat: IoValue; // word 13 退料传感器  1=有料 0=无料
  lightColor: IoValue;    // word 14 产线灯光颜色 0=绿灯 1=黄灯 2=红灯
  trayUp: IoValue;        // word 15 托料盘上升  1=上升 0=下降
  blockUp: IoValue;       // word 16 阻挡干上升  1=上升 0=下降
}

export interface IoState {
  ts: number;
  lineId: string;
  io: IoSignals;
}

// 快照 REST 接口的返回(见 server/src/state/line-state.service.ts)
export interface LineSnapshot {
  lineId: string;
  ts: number;
  status: LineStatus | null;
  edge: { status: 'online' | 'offline' } | null;
  io: IoState | null;
  robots: Record<string, RobotState>;
}

// 控制指令回执(契约 §3.7);前端订阅 socket 'command_ack' 收到
export interface CommandAck {
  cmdId: string;
  ts: number;
  status: 'acked' | 'rejected' | 'failed' | 'timeout';
  message?: string | null;
}

// ---------------------------------------------------------------------------
// AI 助手(hermes agent)
// ---------------------------------------------------------------------------

/**
 * AI 提交的控制建议。**它不是一条指令** —— 只是候选。
 * 必须由用户点确认后才会走 POST /api/ai/proposals/:id/confirm → CommandService.issue()。
 * 前端订阅 socket 'ai_proposal' 收到(见 server/src/ai/proposal.service.ts)。
 */
export interface AiProposal {
  id: string;
  lineId: string;
  deviceId: string;
  type: string;
  params: Record<string, unknown>;
  reason: string;
  status: 'pending';
  createdAt: number;
}

/** SSE 事件(后端 ai.service.ts 归一化后的形状,与 OpenAI chunk 无关) */
export interface AiStreamEvent {
  type: 'delta' | 'tool' | 'error' | 'done';
  text?: string;
  name?: string;
  message?: string;
}

/** 抽屉里的一条消息。工具痕迹不单独存气泡,折成 hint 挂在消息上 */
export interface AiMessage {
  role: 'user' | 'assistant';
  text: string;
  /** 本轮里 agent 用过的工具,用于展示「查了什么」 */
  tools?: string[];
  error?: string;
  proposal?: AiProposal;
}
