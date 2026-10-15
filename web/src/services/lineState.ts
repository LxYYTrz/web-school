// 产线状态映射(契约 v1.1,见 db/init/004_line_state_stages.sql)
// 单点定义,StatusView / IoPanel / 其它组件都从这里取,避免三处各写一份。
//
// 来源:DB3-Modbus-映射表.xls「产线状态」枚举 + PLC dataDB[6](Modbus word 6)
// PLC 原始整数 → 契约字符串的转换在 edge/plc_collector.py STATE_MAP 完成,
// 前端只处理已经转成字符串的契约值。

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
  unloading: '下料中',           //   3
  unload_done: '下料完成',       //   4
  waiting_next: '等待后站入料',  //   5
  init_error: '初始化错误',      // 100
  stopped: '停止',               // 101
  manual_mode: '手动模式',       // 102
};

/** 语义色分组:CSS class 前缀 st- */
export type StateTone = 'run' | 'wait' | 'stop' | 'error' | 'off';

export const STATE_TONE: Record<string, StateTone> = {
  running: 'run',
  feeding: 'run',
  assembling: 'run',
  unloading: 'run',
  unload_done: 'run',

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

/** 中文显示;未知值回退显示原值 */
export function stateText(state: string | undefined | null): string {
  if (!state) return '—';
  return STATE_TEXT[state] ?? state;
}

/** 语义 class(st-*);未知值返回空串,走默认色 */
export function stateClass(state: string | undefined | null): string {
  if (!state || !KNOWN_STATES.has(state)) return '';
  return `st-${state}`;
}

/** element-plus el-tag 的 type */
export function stateTagType(
  state: string | undefined | null,
): 'success' | 'info' | 'danger' | 'warning' {
  switch (stateTone(state)) {
    case 'run': return 'success';
    case 'error': return 'danger';
    case 'wait':
    case 'stop': return 'info';
    default: return 'warning';
  }
}

function stateTone(state: string | undefined | null): StateTone {
  if (!state) return 'off';
  return STATE_TONE[state] ?? 'off';
}

/** 是否处于"产线在动"的工序状态 */
export function isRunning(state: string | undefined | null): boolean {
  return stateTone(state) === 'run';
}
