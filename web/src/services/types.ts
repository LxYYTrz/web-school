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

// 快照 REST 接口的返回(见 server/src/state/line-state.service.ts)
export interface LineSnapshot {
  lineId: string;
  ts: number;
  status: LineStatus | null;
  edge: { status: 'online' | 'offline' } | null;
  robots: Record<string, RobotState>;
}

// 控制指令回执(契约 §3.7);前端订阅 socket 'command_ack' 收到
export interface CommandAck {
  cmdId: string;
  ts: number;
  status: 'acked' | 'rejected' | 'failed' | 'timeout';
  message?: string | null;
}
