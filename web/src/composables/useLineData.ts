/**
 * ============================================================================
 * 文件作用：产线数据层（前端的核心：快照预载 + 实时订阅 + 派生状态）
 * 所属模块：web/src/composables/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件回答"前端数据是怎么流动的" ★
 * ============================================================================
 *
 * 【前端数据流全景】
 *
 *   ┌──────────── 后端 ────────────┐        ┌──────── 浏览器 ────────┐
 *   │ Redis（快照）                 │        │                        │
 *   │      │                        │        │                        │
 *   │      │ ① REST /snapshot        │───────▶│ ② preload() 填初始值  │
 *   │      │                        │        │         ↓              │
 *   │ MQTT→ingest→gateway          │        │ ③ socket.on(...) 订阅   │
 *   │      │                        │◀───────│         ↓              │
 *   │      │ ④ WS 实时推送 10Hz/1Hz  │        │ ④ 写入 ref 响应式变量   │
 *   └───────────────────────────────┘        │         ↓              │
 *                                            │ ⑤ computed 派生状态    │
 *                                            │         ↓              │
 *                                            │ ⑥ 模板自动重渲染       │
 *                                            └────────────────────────┘
 *
 * 【为什么是"模块级单例"】
 *   createLineData() 创建一个内部闭包，保存了 socket 事件监听 + 所有 ref。
 *   它的实例被存在模块级变量 shared 里，useLineData() 每次都返回同一个实例。
 *   好处：
 *     ① App.vue 顶栏和 TwinView/IoView 页面用的是同一份数据 → 天然同步
 *     ② 路由切换时组件卸载/重建，但数据层不重建 → WebSocket 连接不断、状态不丢
 *     ③ 只注册一份 socket 监听器 → 不会重复消费同一条消息
 *
 * 【设计约束：只保留"最新一帧"，不累积高频数据】
 *   机器人帧是 10Hz。如果把每一帧都存进数组，一小时就是 36000 个对象，
 *   浏览器内存和 Vue 的响应式开销都会爆。
 *   所以：
 *     - robot   → 单个 ref（覆盖写，只留最新一帧）
 *     - status  → 单个 ref
 *     - events  → 滚动列表，最多 MAX_FEED(60) 条，超出丢弃最旧的
 *
 * 【降级策略】
 *   preload() 失败（后端没起 / 网络不通）→ 只打 console.warn，不抛错，
 *   页面继续靠 WebSocket 的实时数据填充。
 */
import { computed, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { getSocket, fetchSnapshot } from '../services/socket';
// 从 ../services/socket 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type {
// 导入或导出模块符号。 关键字：import＝导入模块或符号。
  IoState,
  // 把变量 IoState 作为同名对象字段加入当前对象。
  LineSnapshot,
  // 把变量 LineSnapshot 作为同名对象字段加入当前对象。
  LineStatus,
  // 把变量 LineStatus 作为同名对象字段加入当前对象。
  ProductionEvent,
  // 把变量 ProductionEvent 作为同名对象字段加入当前对象。
  RobotState,
  // 把变量 RobotState 作为同名对象字段加入当前对象。
} from '../services/types';
// 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：from＝指定导入来源。

/** 事件流最多保留条数（防止高频事件把内存和 DOM 撑爆） */
const MAX_FEED = 60;
// 声明 MAX_FEED，初始值由 60 计算得到。 关键字：const＝声明不可重新绑定的变量。

// ===== dev 演示 mock 数据(仅 VITE_MOCK_ONLY=true 时使用) =====
// 没后端时让视图(twin/io)有数据可见,纯看页面用。
// 开启方式:build 时设 VITE_MOCK_ONLY=true (例:VITE_MOCK_ONLY=true npm run build)。
// 不设 → prod 走真实链路,mock 不生效。
const MOCK_NOW = () => Date.now();
// 声明 MOCK_NOW，初始值由 () => Date.now() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const MOCK_EARLIER = (secAgo: number) => Date.now() - secAgo * 1000;
// 声明 MOCK_EARLIER，初始值由 (secAgo: number) => Date.now() - secAgo * 1000 计算得到。 关键字：const＝声明不可重新绑定的变量。
const MOCK_ENABLED = import.meta.env.VITE_MOCK_ONLY === 'true';
// 声明 MOCK_ENABLED，初始值由 import.meta.env.VITE_MOCK_ONLY === 'true' 计算得到。 关键字：const＝声明不可重新绑定的变量；import＝导入模块或符号。
const MOCK_ROBOT: RobotState = {
// 声明 MOCK_ROBOT，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  ts: MOCK_NOW(),
  // 设置字段 ts。
  deviceId: 'robot-01',
  // 设置字段 deviceId。
  joints: [10.2, -35.0, 42.1, 0.5, 88.0, 12.3],
  // 设置字段 joints。
  tcp: [512.3, -120.5, 388.0, 179.9, 0.2, 45.0],
  // 设置字段 tcp。
  speedPct: 80,
  // 设置字段 speedPct。
  mode: 'auto',
  // 设置字段 mode。
  program: 'PICK_A',
  // 设置字段 program。
  alarmCode: 0,
  // 设置字段 alarmCode。
};
// 结束当前对象或代码块，并完成这条语句。
const MOCK_STATUS: LineStatus = {
// 声明 MOCK_STATUS，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  ts: MOCK_NOW(),
  // 设置字段 ts。
  lineId: 'line-01',
  // 设置字段 lineId。
  state: 'running',
  // 设置字段 state。
  productCode: 'P-1001',
  // 设置字段 productCode。
  goodCount: 1024,
  // 设置字段 goodCount。
  ngCount: 3,
  // 设置字段 ngCount。
  beatMs: 8500,
  // 设置字段 beatMs。
};
// 结束当前对象或代码块，并完成这条语句。
const MOCK_EVENTS: ProductionEvent[] = [
// 声明 MOCK_EVENTS，初始值由 [ 计算得到。 关键字：const＝声明不可重新绑定的变量。
  { ts: MOCK_EARLIER(2),  lineId: 'line-01', deviceId: 'plc-01', type: 'start',      level: 'info',    message: '产线启动(mock)' },
  // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
  { ts: MOCK_EARLIER(8),  lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000001 完成' },
  // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
  { ts: MOCK_EARLIER(15), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000002 完成' },
  // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
  { ts: MOCK_EARLIER(23), lineId: 'line-01', deviceId: 'plc-01',   type: 'alarm',      level: 'warning', code: 'W201', message: '气源压力偏低(mock)' },
  // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
  { ts: MOCK_EARLIER(30), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000003 完成' },
  // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：type＝定义类型别名。
];
// 继续当前表达式；这一行的值由外层代码块或调用使用。
// demo 模式下 6 个 IO 点各给一个不同的值,便于在页面上区分每个点位
const MOCK_IO: IoState = {
// 声明 MOCK_IO，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  ts: MOCK_NOW(), lineId: 'line-01',
  // 设置字段 ts。
  io: {
  // 设置字段 io。
    sensorIn: 1, sensorArrive: 0, sensorRetreat: null,
    // 设置字段 sensorIn。 关键字：null＝空值。
    lightColor: 1, trayUp: 1, blockUp: 0,
    // 设置字段 lightColor。
  },
  // 结束当前对象或代码块，并完成这条语句。
};
// 结束当前对象或代码块，并完成这条语句。

// 产线数据(模块级单例):快照预载 + socket.io 实时订阅。
// 约定:只持有"最新一帧"与"滚动列表",不累积高频数据,避免内存与渲染压力。
// App 与各页面共享同一实例;SPA 生命周期内常驻,不做组件级注销。
/**
 * 产线数据(模块级单例):快照预载 + socket.io 实时订阅。
 * 约定:只持有"最新一帧"与"滚动列表",不累积高频数据,避免内存与渲染压力。
 * App 与各页面共享同一实例;SPA 生命周期内常驻,不做组件级注销。
 *
 * @param lineId 要订阅的产线编码
 */
function createLineData(lineId: string) {
// 定义函数 createLineData。 关键字：function＝定义函数。
  // 取得（并懒创建）全局唯一的 socket 连接
  const socket = getSocket();
  // 声明 socket，初始值由 getSocket() 计算得到。 关键字：const＝声明不可重新绑定的变量。

  // ---- 响应式状态变量（ref）----
  // WebSocket 是否已连接（对应顶栏"服务 已连接/断开"）
  const connected = ref(false);
  // 声明 connected，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
  // 边缘采集器是否在线。null = 未知（还没收到任何消息）
  const edgeOnline = ref<boolean | null>(null);
  // 声明 edgeOnline，初始值由 ref<boolean | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  // 机器人最新一帧（10Hz 覆盖写）
  const robot = ref<RobotState | null>(null);
  // 声明 robot，初始值由 ref<RobotState | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  // 产线当前状态（1Hz 覆盖写）
  const status = ref<LineStatus | null>(null);
  // 声明 status，初始值由 ref<LineStatus | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  const io = ref<IoState | null>(null);
  // 声明 io，初始值由 ref<IoState | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  // 事件滚动列表（最新在前，因为用 unshift）
  const events = ref<ProductionEvent[]>([]);
  // 声明 events，初始值由 ref<ProductionEvent[]>([]) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const lastEventAt = ref(0);
  // 声明 lastEventAt，初始值由 ref(0) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  // 快照和实时推送并行到达时，不能用较早的快照覆盖已收到的新帧。
  const liveSeen = { robot: false, status: false, io: false, edge: false, event: false };
  // 声明 liveSeen，初始值由 { robot: false, status: false, io: false, edge: false, event: false } 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。

  // ---------- 快照预载(首屏立即有数据,不等下一帧) ----------
  /**
   * 拉取一次 REST 快照并填充初始值。
   * 与 WebSocket 并行执行：谁先到谁先渲染，最终状态一致。
   */
  async function preload() {
  // 定义函数 preload。 关键字：async＝声明异步函数；function＝定义函数。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      // 调用 REST 快照接口
      const snap = (await fetchSnapshot(lineId)) as LineSnapshot;
      // 声明 snap，初始值由 (await fetchSnapshot(lineId)) as LineSnapshot 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      // 有产线状态就填上
      if (snap.status && !liveSeen.status) status.value = snap.status;
      // 判断 if (snap.status && !liveSeen.status) status.value = snap.status; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      // 有边缘状态就换算成布尔：只有 'online' 才算在线
      if (snap.edge && !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online';
      // 判断 if (snap.edge && !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      if (snap.io && !liveSeen.io) io.value = snap.io;
      // 判断 if (snap.io && !liveSeen.io) io.value = snap.io; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      // robots 是 { deviceId: RobotState } 字典。
      // 当前前端只驱动一台机器人，所以取第一个（Object.values[0]）用即可。
      // 当前只驱动一台机器人；支持多机器人时需要按 deviceId 分发到多个视图。
      const first = Object.values(snap.robots ?? {})[0];
      // 声明 first，初始值由 Object.values(snap.robots ?? {})[0] 计算得到。 关键字：const＝声明不可重新绑定的变量。
      if (first && !liveSeen.robot) robot.value = first;
      // 判断 if (first && !liveSeen.robot) robot.value = first; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    } catch (e) {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      // 后端没起或网络异常:静默,等待 socket 实时数据
      console.warn('[lineData] snapshot 预载失败', e);
      // 调用 console.warn，把括号中的值作为参数传入。
      // dev 演示 fallback:无后端时填 mock,让视图有数据可见
      if (MOCK_ENABLED) {
      // 判断 if (MOCK_ENABLED) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        if (!liveSeen.robot) robot.value = MOCK_ROBOT;
        // 判断 if (!liveSeen.robot) robot.value = MOCK_ROBOT; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        if (!liveSeen.status) status.value = MOCK_STATUS;
        // 判断 if (!liveSeen.status) status.value = MOCK_STATUS; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        if (!liveSeen.event) events.value = MOCK_EVENTS;
        // 判断 if (!liveSeen.event) events.value = MOCK_EVENTS; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        if (!liveSeen.edge) edgeOnline.value = true;
        // 判断 if (!liveSeen.edge) edgeOnline.value = true; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；true＝布尔真值。
        if (!liveSeen.io) io.value = MOCK_IO;
        // 判断 if (!liveSeen.io) io.value = MOCK_IO; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        if (!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts;
        // 判断 if (!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      }
      // 结束当前对象、函数或条件代码块。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 订阅产线房间。
   * 后端收到后会把本 socket 加入 room `line:{lineId}`，之后只推这条产线的数据。
   */
  function subscribe() {
  // 定义函数 subscribe。 关键字：function＝定义函数。
    socket.emit('subscribe', { lineId });
    // 调用 socket.emit，把括号中的值作为参数传入。
  }
  // 结束当前对象、函数或条件代码块。

  // 连接建立
  socket.on('connect', () => {
  // 调用 socket.on，把括号中的值作为参数传入。
    connected.value = true;
    // 把右侧表达式的结果写入 connected.value。 关键字：true＝布尔真值。
    subscribe();
    // 调用 subscribe；括号中的表达式是传入的参数。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  // 连接断开（顶栏灯变红；socket.io 会自动重连）
  socket.on('disconnect', () => {
  // 调用 socket.on，把括号中的值作为参数传入。
    connected.value = false;
    // 把右侧表达式的结果写入 connected.value。 关键字：false＝布尔假值。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  // 机器人六轴帧（10Hz）—— 覆盖写，只保留最新一帧
  socket.on('robot_state', (msg: RobotState) => {
  // 调用 socket.on，把括号中的值作为参数传入。
    liveSeen.robot = true;
    // 把右侧表达式的结果写入 liveSeen.robot。 关键字：true＝布尔真值。
    robot.value = msg;
    // 把右侧表达式的结果写入 robot.value。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  // 产线状态（1Hz）
  socket.on('line_status', (msg: LineStatus) => {
  // 调用 socket.on，把括号中的值作为参数传入。
    liveSeen.status = true;
    // 把右侧表达式的结果写入 liveSeen.status。 关键字：true＝布尔真值。
    status.value = msg;
    // 把右侧表达式的结果写入 status.value。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  socket.on('io_state', (msg: IoState) => {
  // 调用 socket.on，把括号中的值作为参数传入。
    liveSeen.io = true;
    // 把右侧表达式的结果写入 liveSeen.io。 关键字：true＝布尔真值。
    io.value = msg;
    // 把右侧表达式的结果写入 io.value。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  // 生产事件 —— unshift 插到最前面（最新的在上面）
  socket.on('event', (msg: ProductionEvent) => {
  // 调用 socket.on，把括号中的值作为参数传入。
    liveSeen.event = true;
    // 把右侧表达式的结果写入 liveSeen.event。 关键字：true＝布尔真值。
    events.value.unshift(msg);
    // 调用 events.value.unshift，把括号中的值作为参数传入。
    // 超过上限就截断（直接改 length 是 Vue3 响应式数组支持的做法）
    if (events.value.length > MAX_FEED) events.value.length = MAX_FEED;
    // 判断 if (events.value.length > MAX_FEED) events.value.length = MAX_FEED; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    lastEventAt.value = msg.ts;
    // 把右侧表达式的结果写入 lastEventAt.value。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  // 边缘在线状态（低频，仅连接/断开时）
  socket.on('edge_status', (msg: { status: 'online' | 'offline' }) => {
  // 调用 socket.on，把括号中的值作为参数传入。
    liveSeen.edge = true;
    // 把右侧表达式的结果写入 liveSeen.edge。 关键字：true＝布尔真值。
    edgeOnline.value = msg.status === 'online';
    // 把右侧表达式的结果写入 edgeOnline.value。
  });
  // 结束当前回调或对象，并完成外层函数调用。

  // 立即发起快照预载（不 await：并行执行，谁先到谁先渲染）
  void preload();
  // 调用 preload；括号中的表达式是传入的参数。 关键字：void＝表示没有返回值。
  // 如果 socket 已经连上了（比如 preload 期间连上的），这里补一次订阅
  if (socket.connected) subscribe();
  // 判断 if (socket.connected) subscribe(); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。

  // ---------- 派生状态 ----------
  /**
   * 报警文案：优先用机器人自身的 alarmCode（最直接），
   * 没有的话找最近一条 alarm 事件的消息文本。
   */
  const alarmText = computed(() => {
  // 声明 alarmText，初始值由 computed(() => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // 机器人报了警 → 显示 "机器人报警 #123"
    if (robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`;
    // 判断 if (robot.value?.alarmCode) return 机器人报警 #${robot.value.alarmCode}; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    // 否则在事件列表里找第一条 alarm 类型的事件（events 是最新的在前）
    const latestAlarm = events.value.find((e) => e.type === 'alarm');
    // 声明 latestAlarm，初始值由 events.value.find((e) => e.type === 'alarm') 计算得到。 关键字：const＝声明不可重新绑定的变量。
    return latestAlarm?.message ?? null;
    // 返回 latestAlarm?.message ?? null 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值。
  });
  // 结束当前回调或对象，并完成外层函数调用。

  /**
   * 边缘状态文案：null=未知，true=在线，false=离线。
   */
  const edgeText = computed(() => {
  // 声明 edgeText，初始值由 computed(() => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (edgeOnline.value === null) return '未知';
    // 判断 if (edgeOnline.value === null) return '未知'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；null＝空值；return＝返回结果并结束当前函数。
    return edgeOnline.value ? '在线' : '离线';
    // 返回 edgeOnline.value ? '在线' : '离线' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  });
  // 结束当前回调或对象，并完成外层函数调用。

  // 返回所有状态与方法，供组件解构使用
  return {
  // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    connected,
    // 把变量 connected 作为同名对象字段加入当前对象。
    edgeOnline,
    // 把变量 edgeOnline 作为同名对象字段加入当前对象。
    edgeText,
    // 把变量 edgeText 作为同名对象字段加入当前对象。
    robot,
    // 把变量 robot 作为同名对象字段加入当前对象。
    status,
    // 把变量 status 作为同名对象字段加入当前对象。
    io,
    // 把变量 io 作为同名对象字段加入当前对象。
    events,
    // 把变量 events 作为同名对象字段加入当前对象。
    alarmText,
    // 把变量 alarmText 作为同名对象字段加入当前对象。
    lastEventAt,
    // 把变量 lastEventAt 作为同名对象字段加入当前对象。
  };
  // 结束当前对象或代码块，并完成这条语句。
}
// 结束当前对象、函数或条件代码块。

/** 模块级单例变量：保存唯一的数据层实例 */
let shared: ReturnType<typeof createLineData> | null = null;
// 声明 shared，初始值由 null 计算得到。 关键字：let＝声明可重新赋值的变量；typeof＝读取值的运行时类型；null＝空值。

export function useLineData(lineId = 'line-01') {
// 定义函数 useLineData。 关键字：export＝向其他模块开放符号；function＝定义函数。
  // 还没有实例 → 创建
  if (!shared) shared = createLineData(lineId);
  // 判断 if (!shared) shared = createLineData(lineId); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
  // 返回单例
  return shared;
  // 返回 shared 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。
