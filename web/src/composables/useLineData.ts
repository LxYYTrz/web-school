import { computed, ref } from 'vue';
import { getSocket, fetchSnapshot } from '../services/socket';
import type {
  IoState,
  LineSnapshot,
  LineStatus,
  ProductionEvent,
  RobotState,
  VisionResult,
} from '../services/types';

const MAX_FEED = 60;
const MAX_VISION = 30;

// ===== dev 演示 mock 数据(仅 VITE_MOCK_ONLY=true 时使用) =====
// 没后端时让三个视图(twin/status/vision)有数据可见,纯看页面用。
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
const MOCK_VISION: VisionResult[] = [
  { ts: MOCK_EARLIER(8),  lineId: 'line-01', cameraId: 'cam-01', sn: 'SN20261014000001', result: 'ok', defects: [], imageUrl: null, thumbUrl: null },
  { ts: MOCK_EARLIER(15), lineId: 'line-01', cameraId: 'cam-01', sn: 'SN20261014000002', result: 'ng', defects: [{ type: 'scratch', x: 220, y: 180, w: 60, h: 18 }], imageUrl: null, thumbUrl: null },
  { ts: MOCK_EARLIER(30), lineId: 'line-01', cameraId: 'cam-01', sn: 'SN20261014000003', result: 'ok', defects: [], imageUrl: null, thumbUrl: null },
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
function createLineData(lineId: string) {
  const socket = getSocket();

  const connected = ref(false);
  const edgeOnline = ref<boolean | null>(null);
  const robot = ref<RobotState | null>(null);
  const status = ref<LineStatus | null>(null);
  const io = ref<IoState | null>(null);
  const events = ref<ProductionEvent[]>([]);
  const vision = ref<VisionResult[]>([]);
  const lastEventAt = ref(0);
  const lastVisionAt = ref(0);

  // ---------- 快照预载(首屏立即有数据,不等下一帧) ----------
  async function preload() {
    try {
      const snap = (await fetchSnapshot(lineId)) as LineSnapshot;
      if (snap.status) status.value = snap.status;
      if (snap.edge) edgeOnline.value = snap.edge.status === 'online';
      if (snap.io) io.value = snap.io;
      const first = Object.values(snap.robots ?? {})[0];
      if (first) robot.value = first;
    } catch (e) {
      // 后端没起或网络异常:静默,等待 socket 实时数据
      console.warn('[lineData] snapshot 预载失败', e);
      // dev 演示 fallback:无后端时填 mock,让三个视图有数据可见
      if (MOCK_ENABLED) {
        robot.value = MOCK_ROBOT;
        status.value = MOCK_STATUS;
        events.value = MOCK_EVENTS;
        vision.value = MOCK_VISION;
        edgeOnline.value = true;
        io.value = MOCK_IO;
        lastEventAt.value = MOCK_EVENTS[0].ts;
        lastVisionAt.value = MOCK_VISION[0].ts;
      }
    }
  }

  function subscribe() {
    socket.emit('subscribe', { lineId });
  }

  socket.on('connect', () => {
    connected.value = true;
    subscribe();
  });
  socket.on('disconnect', () => {
    connected.value = false;
  });
  socket.on('robot_state', (msg: RobotState) => {
    robot.value = msg;
  });
  socket.on('line_status', (msg: LineStatus) => {
    status.value = msg;
  });
  socket.on('io_state', (msg: IoState) => {
    io.value = msg;
  });
  socket.on('event', (msg: ProductionEvent) => {
    events.value.unshift(msg);
    if (events.value.length > MAX_FEED) events.value.length = MAX_FEED;
    lastEventAt.value = msg.ts;
  });
  socket.on('vision_result', (msg: VisionResult) => {
    vision.value.unshift(msg);
    if (vision.value.length > MAX_VISION) vision.value.length = MAX_VISION;
    lastVisionAt.value = msg.ts;
  });
  socket.on('edge_status', (msg: { status: 'online' | 'offline' }) => {
    edgeOnline.value = msg.status === 'online';
  });

  void preload();
  if (socket.connected) subscribe();

  // ---------- 派生状态 ----------
  const alarmText = computed(() => {
    if (robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`;
    const latestAlarm = events.value.find((e) => e.type === 'alarm');
    return latestAlarm?.message ?? null;
  });

  const edgeText = computed(() => {
    if (edgeOnline.value === null) return '未知';
    return edgeOnline.value ? '在线' : '离线';
  });

  return {
    connected,
    edgeOnline,
    edgeText,
    robot,
    status,
    io,
    events,
    vision,
    alarmText,
    lastEventAt,
    lastVisionAt,
  };
}

let shared: ReturnType<typeof createLineData> | null = null;

export function useLineData(lineId = 'line-01') {
  if (!shared) shared = createLineData(lineId);
  return shared;
}
