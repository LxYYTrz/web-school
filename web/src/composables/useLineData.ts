import { computed, ref } from 'vue';
import { getSocket, fetchSnapshot } from '../services/socket';
import type {
  LineSnapshot,
  LineStatus,
  ProductionEvent,
  RobotState,
  VisionResult,
} from '../services/types';

const MAX_FEED = 60;
const MAX_VISION = 30;

// 产线数据(模块级单例):快照预载 + socket.io 实时订阅。
// 约定:只持有"最新一帧"与"滚动列表",不累积高频数据,避免内存与渲染压力。
// App 与各页面共享同一实例;SPA 生命周期内常驻,不做组件级注销。
function createLineData(lineId: string) {
  const socket = getSocket();

  const connected = ref(false);
  const edgeOnline = ref<boolean | null>(null);
  const robot = ref<RobotState | null>(null);
  const status = ref<LineStatus | null>(null);
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
      const first = Object.values(snap.robots ?? {})[0];
      if (first) robot.value = first;
    } catch (e) {
      // 后端没起或网络异常:静默,等待 socket 实时数据
      console.warn('[lineData] snapshot 预载失败', e);
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
