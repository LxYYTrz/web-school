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
// 【入口 createLineData：部分 / 作用】
// 部分 | 作用
// lineId | 产线业务编码，例如 line-01；供接口、消息主题或快照 key 使用。
function createLineData(lineId: string) {
  // 取得（并懒创建）全局唯一的 socket 连接
  const socket = getSocket();

  // ---- 响应式状态变量（ref）----
  // WebSocket 是否已连接（对应顶栏"服务 已连接/断开"）
  const connected = ref(false);
  // 边缘采集器是否在线。null = 未知（还没收到任何消息）
  const edgeOnline = ref<boolean | null>(null);
  // 机器人最新一帧（收到新帧后覆盖）

  // robot、status、io 分别保存机器人角度帧、工序状态和 IO 帧，供不同界面读取。
  // ref 的值变化会通知依赖它的页面与 watch；同一对象的实时事件更新它自己的分支，不把关节角依次转换成工序和 IO。
  // 初始 null 表示没有对应现场帧；收到过帧后，这份浏览器内存与后端 Redis 的有效期分别管理。

  const robot = ref<RobotState | null>(null);
  // 1. ref 从 Vue 导入，创建响应式容器；脚本用 robot.value 读写其中内容。
  // 2. RobotState 是项目定义的数据类型，null 表示这份浏览器状态还没有有效帧。
  // 3. preload 和 robot_state 回调是后面两个赋值入口；TwinView 等组件共享这个容器。
  // 4. 赋新帧会通知依赖它的界面和 watch，不会由 ref 自动请求 PLC 或写数据库。
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
      // 1. snap 来自刚完成的 HTTP 快照请求，robots 是“设备编码 → 整帧”的对象。
      // 2. Object.values() 是 JavaScript 方法，把这个对象的值取成数组；[0] 只选其中首台机器人。
      // 3. ?? {} 在 robots 缺失时提供空对象，此时 first 为 undefined。
      // 4. 当前界面按单台机器人使用，没有在这里根据 deviceId 同时驱动多个模型。
      if (first && !liveSeen.robot) robot.value = first;
      // 1. first 有帧并且实时分支还没见过机器人消息时，才用快照填充首屏。
      // 2. liveSeen.robot 初始为 false，robot_state 回调收到帧后将它设为 true。
      // 3. 例如先收到新实时帧，再收到较早快照：这里跳过快照，避免覆盖新帧。
      // 4. 这只是两条前端到达路径之间的保护，没有逐帧比较 ts，也不负责 Redis 的 60 秒过期。
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
    // 【调用各部分：部分 / 作用】
    // 部分 | 作用
    // socket | getSocket 返回的共享 Socket.IO 客户端。
    // 'subscribe' | 项目约定的事件名，后端 handleSubscribe 接收。
    // lineId | 本次希望订阅的产线编码。
    // emit() | 在已有连接发送业务事件，不是 MQTT 的 SUBSCRIBE。
    socket.emit('subscribe', { lineId });
    // 1. emit 是 Socket.IO 客户端方法；subscribe 是本项目约定的业务事件名。
    // 2. 对象带上当前产线编码，后端网关接收后调用 join() 加入对应产线房间。
    // 3. 它不是 MQTT SUBSCRIBE：浏览器与后端之间使用 Socket.IO，采集器与 Broker 才使用 MQTT。
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
  // 1. on 注册回调，定义时不会立刻执行回调体；以后收到 robot_state 事件才进入。
  // 2. msg 是后端广播的整帧，RobotState 只为 TypeScript 提供类型描述。
  // 3. 先把 liveSeen.robot 标成 true，再将 msg 覆盖给共享 robot.value。
  // 4. 顶栏、模型页和其他使用同一数据层的组件因此能读取本轮结果；这里不会累积关节历史。
  // 【调用各部分：部分 / 作用】
  // 部分 | 作用
  // socket.on() | 注册接收回调，消息真正到达后才执行回调体。
  // 'robot_state' | 与后端广播约定一致的事件名。
  // msg | 本次收到的机器人整帧。
  // liveSeen.robot | 标记已收到实时帧，防止晚到快照覆盖。
  // robot.value | Vue ref 保存的共享当前帧，更新后供页面和 watch 使用。
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

// shared 保存在模块作用域，多个组件调用 useLineData() 时取得同一个已有实例。
// App、TwinView 和 IO 页面因此共享状态与订阅，而不是每处各自保留一套现场数据。
// lineId 的默认值是 line-01；实例首次创建后后续调用复用它，不会因传入另一个编码自动切成多产线状态。

let shared: ReturnType<typeof createLineData> | null = null;

// 1. 组件通过这个项目函数取得共享数据，不是每调用一次就另开一条采集链。
// 2. shared 在模块作用域；第一次创建 createLineData(lineId)，后续返回相同实例。
// 3. 传入第二个产线编码不会自动重建或切换实例；当前实现按首个实例服务。
// 4. 这里没有引用计数或 dispose，不能把其他三维组件的卸载清理当成此数据层也已经清理。
// 【入口 useLineData：部分 / 作用】
// 部分 | 作用
// lineId | 产线业务编码，例如 line-01；供接口、消息主题或快照 key 使用。
export function useLineData(lineId = 'line-01') {
  // 还没有实例 → 创建
  if (!shared) shared = createLineData(lineId);
  // 返回单例
  return shared;
}
