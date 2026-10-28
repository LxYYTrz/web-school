/**
 * 浏览器侧共享现场数据入口，供 App、TwinView、IoView 等界面读取。
 * createLineData 先建响应式状态，再并行准备 preload 快照与 Socket.IO 回调；消息到来才更新相应字段。
 * liveSeen 防止迟到旧快照覆盖先到实时帧；connect 事件后发 subscribe 加入产线房间，回调随共享实例存在。
 * useLineData 当前复用一个模块级 shared 实例，不按传入编码自动维护任意多产线实例；模拟回退需看开关。
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
  // 生成演示数据使用的当前时间戳。
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
  // 生成演示数据使用的当前时间戳。
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
// 此处结束上方数组的元素列表，并完成赋值或返回语句
// demo 模式下 6 个 IO 点各给一个不同的值,便于在页面上区分每个点位
const MOCK_IO: IoState = {
  ts: MOCK_NOW(), lineId: 'line-01',
  // 生成演示数据使用的当前时间戳。
  io: {
    sensorIn: 1, sensorArrive: 0, sensorRetreat: null,
    lightColor: 1, trayUp: 1, blockUp: 0,
  },
};

// 创建一条产线的响应式数据、快照预加载与实时回调集合，返回界面可复用的数据读取能力。
// 先看状态变量，再看 preload、subscribe 及 connect/disconnect 与消息回调；各处理不是按定义顺序立即全部执行。
function createLineData(lineId: string) {
  // 取得（并懒创建）全局唯一的 socket 连接
  const socket = getSocket();

  // ---- 响应式状态变量（ref）----
  // WebSocket 是否已连接（对应顶栏"服务 已连接/断开"）
  const connected = ref(false);
  // 边缘采集器是否在线。null = 未知（还没收到任何消息）
  const edgeOnline = ref<boolean | null>(null);
  // 机器人最新一帧（10Hz 覆盖写）

  // robot、status、io 分别保存机器人角度帧、工序状态和 IO 帧，供不同界面读取。
  // ref 的值变化会通知依赖它的页面与 watch；同一对象的实时事件更新它自己的分支，不把关节角依次转换成工序和 IO。
  // 初始 null 表示没有对应现场帧；收到过帧后，这份浏览器内存与后端 Redis 的有效期分别管理。

  const robot = ref<RobotState | null>(null);
  // 为机器人这一分支保存当前帧，初始 null 表示还没有收到对应数据。
  // robot 是 Vue 的响应式 ref，类型为 RobotState 或 null；快照和 robot_state 回调写入它，TwinView 的 watch 读取它。
  // 产线当前状态（1Hz 覆盖写）
  const status = ref<LineStatus | null>(null);
  const io = ref<IoState | null>(null);
  // 事件滚动列表（最新在前，因为用 unshift）
  const events = ref<ProductionEvent[]>([]);
  const lastEventAt = ref(0);
  // 快照和实时推送并行到达时，不能用较早的快照覆盖已收到的新帧。
  const liveSeen = { robot: false, status: false, io: false, edge: false, event: false };

  // 首次加载或相应连接流程读取已有 HTTP 快照，仅在相应类别尚未见实时事件时采用它。
  // liveSeen 分机器人、工序、IO 等类别标记，避免较晚返回的旧快照覆盖已经收到的新帧。
  async function preload() {
    try {
      // 调用 REST 快照接口
      const snap = (await fetchSnapshot(lineId)) as LineSnapshot;
      // 有产线状态就填上
      if (snap.status && !liveSeen.status) status.value = snap.status;
      // 有边缘状态就换算成布尔：只有 'online' 才算在线
      if (snap.edge && !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online';
      if (snap.io && !liveSeen.io) io.value = snap.io;
      // robots 是 { deviceId: RobotState } 字典。
      // 当前前端只驱动一台机器人，所以取第一个（Object.values[0]）用即可。
      // 当前只驱动一台机器人；支持多机器人时需要按 deviceId 分发到多个视图。
      const first = Object.values(snap.robots ?? {})[0];
      // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
      if (first && !liveSeen.robot) robot.value = first;
      // 仅在快照有机器人帧且尚未收到实时机器人数据时，用快照补充首屏。
      // first 是本次快照中的首台机器人帧；liveSeen.robot 防止较晚返回的旧快照覆盖已经收到的新帧；robot.value 是网页保存的响应式机器人状态。
    } catch (e) {
      // 后端没起或网络异常:静默,等待 socket 实时数据
      console.warn('[lineData] snapshot 预载失败', e);
      // dev 演示 fallback:无后端时填 mock,让视图有数据可见
      if (MOCK_ENABLED) {
        if (!liveSeen.robot) robot.value = MOCK_ROBOT;
        if (!liveSeen.status) status.value = MOCK_STATUS;
        if (!liveSeen.event) events.value = MOCK_EVENTS;
        if (!liveSeen.edge) edgeOnline.value = true;
        if (!liveSeen.io) io.value = MOCK_IO;
        if (!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts;
      }
    }
  }

  /**
   * 订阅产线房间。
   * 后端收到后会把本 socket 加入 room `line:{lineId}`，之后只推这条产线的数据。
   */
  function subscribe() {
    socket.emit('subscribe', { lineId });
    // 向订阅方发送指定实时事件。
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
    liveSeen.robot = true;
    robot.value = msg;
  });
  // 产线状态（1Hz）
  socket.on('line_status', (msg: LineStatus) => {
    liveSeen.status = true;
    status.value = msg;
  });
  socket.on('io_state', (msg: IoState) => {
    liveSeen.io = true;
    io.value = msg;
  });
  // 生产事件 —— unshift 插到最前面（最新的在上面）
  socket.on('event', (msg: ProductionEvent) => {
    liveSeen.event = true;
    events.value.unshift(msg);
    // 把当前元素放到数组开头。
    // 超过上限就截断（直接改 length 是 Vue3 响应式数组支持的做法）
    if (events.value.length > MAX_FEED) events.value.length = MAX_FEED;
    lastEventAt.value = msg.ts;
  });
  // 边缘在线状态（低频，仅连接/断开时）
  socket.on('edge_status', (msg: { status: 'online' | 'offline' }) => {
    liveSeen.edge = true;
    edgeOnline.value = msg.status === 'online';
  });

  // 立即发起快照预载（不 await：并行执行，谁先到谁先渲染）
  void preload();
  // 加载产线快照，填充首次进入页面时的状态。
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
    // edgeOnline 是上方取得或计算的同名局部值，在此作为返回对象的 edgeOnline 属性
    edgeText,
    // edgeText 是上方取得或计算的同名局部值，在此作为返回对象的 edgeText 属性
    robot,
    // robot 是上方取得或计算的同名局部值，在此作为返回对象的 robot 属性
    status,
    io,
    events,
    // events 是上方取得或计算的同名局部值，在此作为返回对象的 events 属性
    alarmText,
    // alarmText 是上方取得或计算的同名局部值，在此作为返回对象的 alarmText 属性
    lastEventAt,
    // lastEventAt 是上方取得或计算的同名局部值，在此作为返回对象的 lastEventAt 属性
  };
}

/** 模块级单例变量：保存唯一的数据层实例 */

// shared 保存在模块作用域，多个组件调用 useLineData() 时取得同一个已有实例。
// App、TwinView 和 IO 页面因此共享状态与订阅，而不是每处各自保留一套现场数据。
// lineId 的默认值是 line-01；实例首次创建后后续调用复用它，不会因传入另一个编码自动切成多产线状态。

let shared: ReturnType<typeof createLineData> | null = null;

// 页面和公共外框调用这里取得共享实例；首次调用才创建，后续复用模块级 shared。
// 当前实现不是按不同 lineId 自动建立多份实例，本方法也没有组件卸载时的引用计数或 dispose。
export function useLineData(lineId = 'line-01') {
  // 还没有实例 → 创建
  if (!shared) shared = createLineData(lineId);
  // 返回单例
  return shared;
}
