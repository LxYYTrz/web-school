// 产线状态映射(契约 v1.1,见 db/init/004_line_state_stages.sql)
// 单点定义,App / IoPanel / 其它组件都从这里取,避免多处各写一份。
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
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
  // 原 4 态
  running: '运行中',
  // 设置字段 running。
  idle: '待机',
  // 设置字段 idle。
  alarm: '报警',
  // 设置字段 alarm。
  offline: '离线',
  // 设置字段 offline。
  // PLC 工序状态(契约 v1.1)
  waiting_feed: '等待入料',      //   0
  // 设置字段 waiting_feed。
  feeding: '入料中',             //   1
  // 设置字段 feeding。
  assembling: '装配中',          //   2
  // 设置字段 assembling。
  waiting_robot: '等待机器人完成',//   3  ★ 现场口径(旧口径 unloading 保留给历史数据)
  // 设置字段 waiting_robot。
  unload_done: '下料完成',       //   4
  // 设置字段 unload_done。
  waiting_next: '等待后站入料',  //   5
  // 设置字段 waiting_next。
  init_error: '初始化错误',      // 100
  // 设置字段 init_error。
  stopped: '停止',               // 101
  // 设置字段 stopped。
  manual_mode: '手动模式',       // 102
  // 设置字段 manual_mode。
  // 旧口径(2026-10-23 之前把状态 3 叫成「下料中」,历史数据里还有 2.8 万行)
  unloading: '下料中',
  // 设置字段 unloading。
};
// 结束当前对象或代码块，并完成这条语句。

/** 语义色分组:CSS class 前缀 st- */
export type StateTone = 'run' | 'wait' | 'stop' | 'error' | 'off';
// 声明 StateTone 的结构。 关键字：export＝向其他模块开放符号；type＝定义类型别名。

export const STATE_TONE: Record<string, StateTone> = {
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
  running: 'run',
  // 设置字段 running。
  feeding: 'run',
  // 设置字段 feeding。
  assembling: 'run',
  // 设置字段 assembling。
  waiting_robot: 'run',
  // 设置字段 waiting_robot。
  unload_done: 'run',
  // 设置字段 unload_done。
  unloading: 'run',
  // 设置字段 unloading。

  idle: 'wait',
  // 设置字段 idle。
  waiting_feed: 'wait',
  // 设置字段 waiting_feed。
  waiting_next: 'wait',
  // 设置字段 waiting_next。

  stopped: 'stop',
  // 设置字段 stopped。
  manual_mode: 'stop',
  // 设置字段 manual_mode。

  alarm: 'error',
  // 设置字段 alarm。
  init_error: 'error',
  // 设置字段 init_error。

  offline: 'off',
  // 设置字段 offline。
};
// 结束当前对象或代码块，并完成这条语句。

/** 已知状态集合(用于判断是否加 st- class) */
export const KNOWN_STATES = new Set(Object.keys(STATE_TEXT));
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量；new＝创建对象实例。

/**
 * PLC 原始整数 → 契约字符串。
 * 与 edge/plc_collector.py 的 STATE_MAP 一一对应(单一事实来源在边缘端,
 * 这里只是兜底):万一后端/历史数据里直接透传了 PLC 整数(如 3),
 * 前端也能显示成「等待机器人完成」,而不是把裸数字 "3" 丢到界面上。
 */
export const PLC_STATE_BY_INT: Record<number, string> = {
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
  0: 'waiting_feed',
  // 设置字段 0，值为 'waiting_feed'。
  1: 'feeding',
  // 设置字段 1，值为 'feeding'。
  2: 'assembling',
  // 设置字段 2，值为 'assembling'。
  3: 'waiting_robot',
  // 设置字段 3，值为 'waiting_robot'。
  4: 'unload_done',
  // 设置字段 4，值为 'unload_done'。
  5: 'waiting_next',
  // 设置字段 5，值为 'waiting_next'。
  100: 'init_error',
  // 设置字段 100，值为 'init_error'。
  101: 'stopped',
  // 设置字段 101，值为 'stopped'。
  102: 'manual_mode',
  // 设置字段 102，值为 'manual_mode'。
};
// 结束当前对象或代码块，并完成这条语句。

/**
 * 别名 → 契约状态值。
 *
 * 为什么需要:同一个 PLC 工序在现场/不同版本的采集端里可能有不同的叫法,
 * 例如状态 3 有时会被写成 "waiting_robot_done" 或直接写中文"等待机器人完成"。
 * 前端拿到别名时如果不归一化,就会把这种半通不通的字符串原样显示到页面上。
 * 这里统一归一到契约值,页面上永远显示标准中文。
 */
export const STATE_ALIAS: Record<string, string> = {
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
  // ── 状态 3 = 等待机器人完成(waiting_robot) ──
  'waiting_robot_done': 'waiting_robot',
  // 把这一段文字作为当前调用、数组或对象的值。
  'robot_waiting_done': 'waiting_robot',
  // 把这一段文字作为当前调用、数组或对象的值。
  '等待机器人完成': 'waiting_robot',
  // 把这一段文字作为当前调用、数组或对象的值。
  '等待机器人': 'waiting_robot',
  // 把这一段文字作为当前调用、数组或对象的值。
  // ── 状态 3 旧口径(历史数据)──
  'unloading_process': 'unloading',
  // 把这一段文字作为当前调用、数组或对象的值。
  '下料中': 'unloading',
  // 把这一段文字作为当前调用、数组或对象的值。
  // ── 状态 4 = 下料完成(unload_done) ──
  'unload_finished': 'unload_done',
  // 把这一段文字作为当前调用、数组或对象的值。
  'unload_complete': 'unload_done',
  // 把这一段文字作为当前调用、数组或对象的值。
  '下料完成': 'unload_done',
  // 把这一段文字作为当前调用、数组或对象的值。
};
// 结束当前对象或代码块，并完成这条语句。

/**
 * 归一化状态值:
 *   - 数字 / 数字字符串(PLC 原始整数)→ 契约字符串
 *   - 别名(见 STATE_ALIAS)→ 契约字符串
 *   - 其它原样返回(契约字符串)
 */
export function normalizeState(state: string | number | undefined | null): string {
// 定义函数 normalizeState。 关键字：export＝向其他模块开放符号；function＝定义函数；undefined＝未定义值；null＝空值。
  if (state === undefined || state === null) return '';
  // 判断 if (state === undefined || state === null) return ''; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值；null＝空值；return＝返回结果并结束当前函数。
  const s = String(state).trim();
  // 声明 s，初始值由 String(state).trim() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (PLC_STATE_BY_INT[Number(s)] !== undefined) return PLC_STATE_BY_INT[Number(s)];
  // 判断 if (PLC_STATE_BY_INT[Number(s)] !== undefined) return PLC_STATE_BY_INT[Number(s)]; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值；return＝返回结果并结束当前函数。
  if (STATE_ALIAS[s] !== undefined) return STATE_ALIAS[s];
  // 判断 if (STATE_ALIAS[s] !== undefined) return STATE_ALIAS[s]; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值；return＝返回结果并结束当前函数。
  return s;
  // 返回 s 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 中文显示;未知值回退显示原值 */
export function stateText(state: string | number | undefined | null): string {
// 定义函数 stateText。 关键字：export＝向其他模块开放符号；function＝定义函数；undefined＝未定义值；null＝空值。
  if (!state) return '—';
  // 判断 if (!state) return '—'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  const s = normalizeState(state);
  // 声明 s，初始值由 normalizeState(state) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  return STATE_TEXT[s] ?? s;
  // 返回 STATE_TEXT[s] ?? s 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 语义 class(st-*);未知值返回空串,走默认色 */
export function stateClass(state: string | number | undefined | null): string {
// 定义函数 stateClass。 关键字：export＝向其他模块开放符号；function＝定义函数；undefined＝未定义值；null＝空值。
  if (!state) return '';
  // 判断 if (!state) return ''; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  const s = normalizeState(state);
  // 声明 s，初始值由 normalizeState(state) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (!KNOWN_STATES.has(s)) return '';
  // 判断 if (!KNOWN_STATES.has(s)) return ''; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  return `st-${s}`;
  // 返回 st-${s} 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** element-plus el-tag 的 type */
export function stateTagType(
// 定义函数 stateTagType。 关键字：export＝向其他模块开放符号；function＝定义函数。
  state: string | number | undefined | null,
  // 设置字段 state。 关键字：undefined＝未定义值；null＝空值。
): 'success' | 'info' | 'danger' | 'warning' {
// 继续当前表达式；这一行的值由外层代码块或调用使用。
  switch (stateTone(state)) {
  // 控制分支、循环或异常处理流程。 关键字：switch＝按值分派分支。
    case 'run': return 'success';
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支；return＝返回结果并结束当前函数。
    case 'error': return 'danger';
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支；return＝返回结果并结束当前函数。
    case 'wait':
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支。
    case 'stop': return 'info';
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支；return＝返回结果并结束当前函数。
    default: return 'warning';
    // 设置字段 default。 关键字：default＝指定默认导出或默认分支；return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

function stateTone(state: string | number | undefined | null): StateTone {
// 定义函数 stateTone。 关键字：function＝定义函数；undefined＝未定义值；null＝空值。
  if (!state) return 'off';
  // 判断 if (!state) return 'off'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  const s = normalizeState(state);
  // 声明 s，初始值由 normalizeState(state) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  return STATE_TONE[s] ?? 'off';
  // 返回 STATE_TONE[s] ?? 'off' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/** 是否处于"产线在动"的工序状态 */
export function isRunning(state: string | number | undefined | null): boolean {
// 定义函数 isRunning。 关键字：export＝向其他模块开放符号；function＝定义函数；undefined＝未定义值；null＝空值。
  return stateTone(state) === 'run';
  // 返回 stateTone(state) === 'run' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。
