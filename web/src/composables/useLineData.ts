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
 *     ① App.vue 顶栏和 TwinView/StatusView 页面用的是同一份数据 → 天然同步
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
import { getSocket, fetchSnapshot } from '../services/socket';
import type {
  IoState,
  LineSnapshot,
  LineStatus,
  ProductionEvent,
  RobotState,
} from '../services/types';

/** 事件流最多保留条数（防止高频事件把内存和 DOM 撑爆） */
const MAX_FEED = 60;

// ===== dev 演示 mock 数据(仅 VITE_MOCK_ONLY=true 时使用) =====
// 没后端时让视图(twin/io)有数据可见,纯看页面用。
// 开启方式:build 时设 VITE_MOCK_ONLY=true (例:VITE_MOCK_ONLY=true npm run build)。
// 不设 → prod 走真实链路,mock 不生效。
const MOCK_NOW = () => Date.now();
const MOCK_EARLIER = (secAgo: number) => Date.now() - secAgo * 1000;
const MOCK_ENABLED = import.meta.env.VITE_MOCK_ONLY === 'true';
const MOCK_ROBOT: RobotState = {
  ts: MOCK_NOW(),
  deviceId: 'robot-01',
  joints: [10.2, -35.0, 42.1, 0.5, 88.0, 12.3],
  tcp: [512.3, -120.5, 388.0, 179.9, 0.2, 45.0],
  speedPct: 80,
  mode: 'auto',
  program: 'PICK_A',
  alarmCode: 0,
};
const MOCK_STATUS: LineStatus = {
  ts: MOCK_NOW(),
  lineId: 'line-01',
  state: 'running',
  productCode: 'P-1001',
  goodCount: 1024,
  ngCount: 3,
  beatMs: 8500,
};
const MOCK_EVENTS: ProductionEvent[] = [
  { ts: MOCK_EARLIER(2),  lineId: 'line-01', deviceId: 'plc-01', type: 'start',      level: 'info',    message: '产线启动(mock)' },
  { ts: MOCK_EARLIER(8),  lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000001 完成' },
  { ts: MOCK_EARLIER(15), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000002 完成' },
  { ts: MOCK_EARLIER(23), lineId: 'line-01', deviceId: 'plc-01',   type: 'alarm',      level: 'warning', code: 'W201', message: '气源压力偏低(mock)' },
  { ts: MOCK_EARLIER(30), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000003 完成' },
];
// demo 模式下 6 个 IO 点各给一个不同的值,便于在页面上区分每个点位
const MOCK_IO: IoState = {
  ts: MOCK_NOW(), lineId: 'line-01',
  io: {
    sensorIn: 1, sensorArrive: 0, sensorRetreat: null,
    lightColor: 1, trayUp: 1, blockUp: 0,
  },
};

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
  // 取得（并懒创建）全局唯一的 socket 连接
  const socket = getSocket();

  // ---- 响应式状态变量（ref）----
  // WebSocket 是否已连接（对应顶栏"服务 已连接/断开"）
  const connected = ref(false);
  // 边缘采集器是否在线。null = 未知（还没收到任何消息）
  const edgeOnline = ref<boolean | null>(null);
  // 机器人最新一帧（10Hz 覆盖写）
  const robot = ref<RobotState | null>(null);
  // 产线当前状态（1Hz 覆盖写）
  const status = ref<LineStatus | null>(null);
  const io = ref<IoState | null>(null);
  // 事件滚动列表（最新在前，因为用 unshift）
  const events = ref<ProductionEvent[]>([]);
  const lastEventAt = ref(0);

  // ---------- 快照预载(首屏立即有数据,不等下一帧) ----------
  /**
   * 拉取一次 REST 快照并填充初始值。
   * 与 WebSocket 并行执行：谁先到谁先渲染，最终状态一致。
   */
  async function preload() {
    try {
      // 调用 REST 快照接口
      const snap = (await fetchSnapshot(lineId)) as LineSnapshot;
      // 有产线状态就填上
      if (snap.status) status.value = snap.status;
      // 有边缘状态就换算成布尔：只有 'online' 才算在线
      if (snap.edge) edgeOnline.value = snap.edge.status === 'online';
      if (snap.io) io.value = snap.io;
      // robots 是 { deviceId: RobotState } 字典。
      // 当前前端只驱动一台机器人，所以取第一个（Object.values[0]）用即可。
      // 多机器人支持见 web/README.md 的 TODO。
      const first = Object.values(snap.robots ?? {})[0];
      if (first) robot.value = first;
    } catch (e) {
      // 后端没起或网络异常:静默,等待 socket 实时数据
      console.warn('[lineData] snapshot 预载失败', e);
      // dev 演示 fallback:无后端时填 mock,让视图有数据可见
      if (MOCK_ENABLED) {
        robot.value = MOCK_ROBOT;
        status.value = MOCK_STATUS;
        events.value = MOCK_EVENTS;
        edgeOnline.value = true;
        io.value = MOCK_IO;
        lastEventAt.value = MOCK_EVENTS[0].ts;
      }
    }
  }

  /**
   * 订阅产线房间。
   * 后端收到后会把本 socket 加入 room `line:{lineId}`，之后只推这条产线的数据。
   */
  function subscribe() {
    socket.emit('subscribe', { lineId });
  }

  // 连接建立
  socket.on('connect', () => {
    connected.value = true;
    subscribe();
  });
  // 连接断开（顶栏灯变红；socket.io 会自动重连）
  socket.on('disconnect', () => {
    connected.value = false;
  });
  // 机器人六轴帧（10Hz）—— 覆盖写，只保留最新一帧
  socket.on('robot_state', (msg: RobotState) => {
    robot.value = msg;
  });
  // 产线状态（1Hz）
  socket.on('line_status', (msg: LineStatus) => {
    status.value = msg;
  });
  socket.on('io_state', (msg: IoState) => {
    io.value = msg;
  });
  // 生产事件 —— unshift 插到最前面（最新的在上面）
  socket.on('event', (msg: ProductionEvent) => {
    events.value.unshift(msg);
    // 超过上限就截断（直接改 length 是 Vue3 响应式数组支持的做法）
    if (events.value.length > MAX_FEED) events.value.length = MAX_FEED;
    lastEventAt.value = msg.ts;
  });
  // 边缘在线状态（低频，仅连接/断开时）
  socket.on('edge_status', (msg: { status: 'online' | 'offline' }) => {
    edgeOnline.value = msg.status === 'online';
  });

  // 立即发起快照预载（不 await：并行执行，谁先到谁先渲染）
  void preload();
  // 如果 socket 已经连上了（比如 preload 期间连上的），这里补一次订阅
  if (socket.connected) subscribe();

  // ---------- 派生状态 ----------
  /**
   * 报警文案：优先用机器人自身的 alarmCode（最直接），
   * 没有的话找最近一条 alarm 事件的消息文本。
   */
  const alarmText = computed(() => {
    // 机器人报了警 → 显示 "机器人报警 #123"
    if (robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`;
    // 否则在事件列表里找第一条 alarm 类型的事件（events 是最新的在前）
    const latestAlarm = events.value.find((e) => e.type === 'alarm');
    return latestAlarm?.message ?? null;
  });

  /**
   * 边缘状态文案：null=未知，true=在线，false=离线。
   */
  const edgeText = computed(() => {
    if (edgeOnline.value === null) return '未知';
    return edgeOnline.value ? '在线' : '离线';
  });

  // 返回所有状态与方法，供组件解构使用
  return {
    connected,
    edgeOnline,
    edgeText,
    robot,
    status,
    io,
    events,
    alarmText,
    lastEventAt,
  };
}

/** 模块级单例变量：保存唯一的数据层实例 */
let shared: ReturnType<typeof createLineData> | null = null;

export function useLineData(lineId = 'line-01') {
  // 还没有实例 → 创建
  if (!shared) shared = createLineData(lineId);
  // 返回单例
  return shared;
}
