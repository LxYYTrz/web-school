// 产线状态映射(契约 v1.1,见 db/init/004_line_state_stages.sql)
// 单点定义,StatusView / IoPanel / 其它组件都从这里取,避免三处各写一份。
//
// 来源:DB3-Modbus-映射表1.csv「产线状态」枚举 + PLC dataDB[6](Modbus word 6)
// PLC 原始整数 → 契约字符串的转换在 edge/plc_collector.py STATE_MAP 完成,
// 前端只处理已经转成字符串的契约值。
//
// ★ 状态 3 = 等待机器人完成(2026-10-23 按现场给的映射表原件校正):
//   现场表原文 "3 = 等待机器人"。之前误标成 unloading(下料中),现已改正:
//     - 采集端 3 → 'waiting_robot' → 页面显示「等待机器人完成」
//     - 'unloading'(下料中)是旧口径,只留在历史数据里,DB 约束不删(见 005 迁移)

/** 原 4 态(mock / 旧数据) + PLC 10 态工序 */
export const STATE_TEXT: Record<string, string> = {
  // 原 4 态
  running: '运行中',
  idle: '待机',
  alarm: '报警',
  offline: '离线',
  // PLC 工序状态(契约 v1.1)
  waiting_feed: '等待入料',      //   0
  feeding: '入料中',             //   1
  assembling: '装配中',          //   2
  waiting_robot: '等待机器人完成',//   3  ★ 现场口径(旧口径 unloading 保留给历史数据)
  unload_done: '下料完成',       //   4
  waiting_next: '等待后站入料',  //   5
  init_error: '初始化错误',      // 100
  stopped: '停止',               // 101
  manual_mode: '手动模式',       // 102
  // 旧口径(2026-10-23 之前把状态 3 叫成「下料中」,历史数据里还有 2.8 万行)
  unloading: '下料中',
};

/** 语义色分组:CSS class 前缀 st- */
export type StateTone = 'run' | 'wait' | 'stop' | 'error' | 'off';

export const STATE_TONE: Record<string, StateTone> = {
  running: 'run',
  feeding: 'run',
  assembling: 'run',
  waiting_robot: 'run',
  unload_done: 'run',
  unloading: 'run',

  idle: 'wait',
  waiting_feed: 'wait',
  waiting_next: 'wait',

  stopped: 'stop',
  manual_mode: 'stop',

  alarm: 'error',
  init_error: 'error',

  offline: 'off',
};

/** 已知状态集合(用于判断是否加 st- class) */
export const KNOWN_STATES = new Set(Object.keys(STATE_TEXT));

/**
 * PLC 原始整数 → 契约字符串。
 * 与 edge/plc_collector.py 的 STATE_MAP 一一对应(单一事实来源在边缘端,
 * 这里只是兜底):万一后端/历史数据里直接透传了 PLC 整数(如 3),
 * 前端也能显示成「等待机器人完成」,而不是把裸数字 "3" 丢到界面上。
 */
export const PLC_STATE_BY_INT: Record<number, string> = {
  0: 'waiting_feed',
  1: 'feeding',
  2: 'assembling',
  3: 'waiting_robot',
  4: 'unload_done',
  5: 'waiting_next',
  100: 'init_error',
  101: 'stopped',
  102: 'manual_mode',
};

/**
 * 别名 → 契约状态值。
 *
 * 为什么需要:同一个 PLC 工序在现场/不同版本的采集端里可能有不同的叫法,
 * 例如状态 3 有时会被写成 "waiting_robot_done" 或直接写中文"等待机器人完成"。
 * 前端拿到别名时如果不归一化,就会把这种半通不通的字符串原样显示到页面上。
 * 这里统一归一到契约值,页面上永远显示标准中文。
 */
export const STATE_ALIAS: Record<string, string> = {
  // ── 状态 3 = 等待机器人完成(waiting_robot) ──
  'waiting_robot_done': 'waiting_robot',
  'robot_waiting_done': 'waiting_robot',
  '等待机器人完成': 'waiting_robot',
  '等待机器人': 'waiting_robot',
  // ── 状态 3 旧口径(历史数据)──
  'unloading_process': 'unloading',
  '下料中': 'unloading',
  // ── 状态 4 = 下料完成(unload_done) ──
  'unload_finished': 'unload_done',
  'unload_complete': 'unload_done',
  '下料完成': 'unload_done',
};

/**
 * 归一化状态值:
 *   - 数字 / 数字字符串(PLC 原始整数)→ 契约字符串
 *   - 别名(见 STATE_ALIAS)→ 契约字符串
 *   - 其它原样返回(契约字符串)
 */
export function normalizeState(state: string | number | undefined | null): string {
  if (state === undefined || state === null) return '';
  const s = String(state).trim();
  if (PLC_STATE_BY_INT[Number(s)] !== undefined) return PLC_STATE_BY_INT[Number(s)];
  if (STATE_ALIAS[s] !== undefined) return STATE_ALIAS[s];
  return s;
}

/** 中文显示;未知值回退显示原值 */
export function stateText(state: string | number | undefined | null): string {
  if (!state) return '—';
  const s = normalizeState(state);
  return STATE_TEXT[s] ?? s;
}

/** 语义 class(st-*);未知值返回空串,走默认色 */
export function stateClass(state: string | number | undefined | null): string {
  if (!state) return '';
  const s = normalizeState(state);
  if (!KNOWN_STATES.has(s)) return '';
  return `st-${s}`;
}

/** element-plus el-tag 的 type */
export function stateTagType(
  state: string | number | undefined | null,
): 'success' | 'info' | 'danger' | 'warning' {
  switch (stateTone(state)) {
    case 'run': return 'success';
    case 'error': return 'danger';
    case 'wait':
    case 'stop': return 'info';
    default: return 'warning';
  }
}

function stateTone(state: string | number | undefined | null): StateTone {
  if (!state) return 'off';
  const s = normalizeState(state);
  return STATE_TONE[s] ?? 'off';
}

/** 是否处于"产线在动"的工序状态 */
export function isRunning(state: string | number | undefined | null): boolean {
  return stateTone(state) === 'run';
}
