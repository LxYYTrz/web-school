/**
 * 前端工序状态的标准化、中文文案、色调与动作状态判定，供顶栏、控制按钮等使用。
 * 先看 STATE_TEXT/STATE_TONE 与整数/别名映射，再看 normalizeState 和各展示/条件函数。
 * 这些是网页解释规则，不写 PLC，也不能单凭 run 色调证明现场动作已完成。
 */
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

// 这里完成工序状态的网页显示翻译：输入是采集端已经约定好的契约字符串，输出是中文工序文案。
// 例如 waiting_robot 对应“等待机器人完成”，现场整数 3 到 waiting_robot 的转换已在采集器 STATE_MAP 完成。
// 下面的状态色调映射再决定 run、wait 等显示类别；它们用于界面表达，不是向 PLC 写入的控制值。

export const STATE_TEXT: Record<string, string> = {
// 把已约定的工序状态字符串映射为页面中文，例如 waiting_robot 显示“等待机器人完成”。
// STATE_TEXT 是前端显示词典；现场整数到契约字符串的翻译已由采集器 STATE_MAP 完成，色调使用后面的状态规则。
  // 原 4 态
  running: '运行中',
  // 把状态编码 running 映射到前端显示文字或样式分类「运行中」。
  idle: '待机',
  // 把状态编码 idle 映射到前端显示文字或样式分类「待机」。
  alarm: '报警',
  // 把状态编码 alarm 映射到前端显示文字或样式分类「报警」。
  offline: '离线',
  // 把状态编码 offline 映射到前端显示文字或样式分类「离线」。
  // PLC 工序状态(契约 v1.1)
  waiting_feed: '等待入料',      //   0
  // 把状态编码 waiting_feed 映射到前端显示文字或样式分类「等待入料」。
  feeding: '入料中',             //   1
  // 把状态编码 feeding 映射到前端显示文字或样式分类「入料中」。
  assembling: '装配中',          //   2
  // 把状态编码 assembling 映射到前端显示文字或样式分类「装配中」。
  waiting_robot: '等待机器人完成',//   3  ★ 现场口径(旧口径 unloading 保留给历史数据)
  // 把状态编码 waiting_robot 映射到前端显示文字或样式分类「等待机器人完成」。
  unload_done: '下料完成',       //   4
  // 把状态编码 unload_done 映射到前端显示文字或样式分类「下料完成」。
  waiting_next: '等待后站入料',  //   5
  // 把状态编码 waiting_next 映射到前端显示文字或样式分类「等待后站入料」。
  init_error: '初始化错误',      // 100
  // 把状态编码 init_error 映射到前端显示文字或样式分类「初始化错误」。
  stopped: '停止',               // 101
  // 把状态编码 stopped 映射到前端显示文字或样式分类「停止」。
  manual_mode: '手动模式',       // 102
  // 把状态编码 manual_mode 映射到前端显示文字或样式分类「手动模式」。
  // 旧口径(2026-10-23 之前把状态 3 叫成「下料中」,历史数据里还有 2.8 万行)
  unloading: '下料中',
  // 把状态编码 unloading 映射到前端显示文字或样式分类「下料中」。
};

/** 语义色分组:CSS class 前缀 st- */
export type StateTone = 'run' | 'wait' | 'stop' | 'error' | 'off';

export const STATE_TONE: Record<string, StateTone> = {
  running: 'run',
  // 把状态编码 running 映射到前端显示文字或样式分类「run」。
  feeding: 'run',
  // 把状态编码 feeding 映射到前端显示文字或样式分类「run」。
  assembling: 'run',
  // 把状态编码 assembling 映射到前端显示文字或样式分类「run」。
  waiting_robot: 'run',
  // 把状态编码 waiting_robot 映射到前端显示文字或样式分类「run」。
  unload_done: 'run',
  // 把状态编码 unload_done 映射到前端显示文字或样式分类「run」。
  unloading: 'run',
  // 把状态编码 unloading 映射到前端显示文字或样式分类「run」。

  idle: 'wait',
  // 把状态编码 idle 映射到前端显示文字或样式分类「wait」。
  waiting_feed: 'wait',
  // 把状态编码 waiting_feed 映射到前端显示文字或样式分类「wait」。
  waiting_next: 'wait',
  // 把状态编码 waiting_next 映射到前端显示文字或样式分类「wait」。

  stopped: 'stop',
  // 把状态编码 stopped 映射到前端显示文字或样式分类「stop」。
  manual_mode: 'stop',
  // 把状态编码 manual_mode 映射到前端显示文字或样式分类「stop」。

  alarm: 'error',
  // 把状态编码 alarm 映射到前端显示文字或样式分类「error」。
  init_error: 'error',
  // 把状态编码 init_error 映射到前端显示文字或样式分类「error」。

  offline: 'off',
  // 把状态编码 offline 映射到前端显示文字或样式分类「off」。
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
  // 把 PLC 状态值 0 转换为产线契约状态 waiting_feed。
  // 0 是 PLC 原始工序编号；waiting_feed 是对外使用的状态编码
  1: 'feeding',
  // 把 PLC 状态值 1 转换为产线契约状态 feeding。
  // 1 是 PLC 原始工序编号；feeding 是对外使用的状态编码
  2: 'assembling',
  // 把 PLC 状态值 2 转换为产线契约状态 assembling。
  // 2 是 PLC 原始工序编号；assembling 是对外使用的状态编码
  3: 'waiting_robot',
  // 把 PLC 状态值 3 转换为产线契约状态 waiting_robot。
  // 3 是 PLC 原始工序编号；waiting_robot 是对外使用的状态编码
  4: 'unload_done',
  // 把 PLC 状态值 4 转换为产线契约状态 unload_done。
  // 4 是 PLC 原始工序编号；unload_done 是对外使用的状态编码
  5: 'waiting_next',
  // 把 PLC 状态值 5 转换为产线契约状态 waiting_next。
  // 5 是 PLC 原始工序编号；waiting_next 是对外使用的状态编码
  100: 'init_error',
  // 把 PLC 状态值 100 转换为产线契约状态 init_error。
  // 100 是 PLC 原始工序编号；init_error 是对外使用的状态编码
  101: 'stopped',
  // 把 PLC 状态值 101 转换为产线契约状态 stopped。
  // 101 是 PLC 原始工序编号；stopped 是对外使用的状态编码
  102: 'manual_mode',
  // 把 PLC 状态值 102 转换为产线契约状态 manual_mode。
  // 102 是 PLC 原始工序编号；manual_mode 是对外使用的状态编码
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

// 将可识别的整数、字符串整数和已配置别名统一成工序契约字符串。
// 优先查 PLC_STATE_BY_INT，再查 STATE_ALIAS，未知值保留；没有发送或改变现场状态。
export function normalizeState(state: string | number | undefined | null): string {
  if (state === undefined || state === null) return '';
  const s = String(state).trim();
  if (PLC_STATE_BY_INT[Number(s)] !== undefined) return PLC_STATE_BY_INT[Number(s)];
  if (STATE_ALIAS[s] !== undefined) return STATE_ALIAS[s];
  return s;
}

// 用统一后的工序值查中文文案，未知值按当前回退显示原字符串。
// 这是展示入口；开头的空值判断仍按实际 JavaScript 真值规则执行，不能凭类型声明假定所有输入都已标准化。
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
  // element-plus el-tag 的 type。
): 'success' | 'info' | 'danger' | 'warning' {
// success、info、danger、warning 是当前方法承诺返回的四种界面提示样式
  switch (stateTone(state)) {
  // 根据括号中的指令或状态值选择下面匹配的处理分支。
    case 'run': return 'success';
    // 当待判断的值等于 'run': return 'success'; 时执行下面的对应分支。
    // 'run': return 'success'; 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
    case 'error': return 'danger';
    // 当待判断的值等于 'error': return 'danger'; 时执行下面的对应分支。
    // 'error': return 'danger'; 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
    case 'wait':
    // 当待判断的值等于 'wait' 时执行下面的对应分支。
    // 'wait' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
    case 'stop': return 'info';
    // 当待判断的值等于 'stop': return 'info'; 时执行下面的对应分支。
    // 'stop': return 'info'; 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
    default: return 'warning';
    // 前面的 case 均不匹配时执行默认分支
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
