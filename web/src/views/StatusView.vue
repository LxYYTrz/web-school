<template>
  <div class="status-page">
    <!-- 统计卡片 -->
    <div class="cards">
      <div class="panel card">
        <div class="card-value" :class="status?.state">{{ statusText }}</div>
        <div class="card-label">产线状态</div>
      </div>
      <div class="panel card">
        <div class="card-value ok">{{ status?.goodCount ?? '—' }}</div>
        <div class="card-label">良品 / 累计</div>
      </div>
      <div class="panel card">
        <div class="card-value ng">{{ status?.ngCount ?? '—' }}</div>
        <div class="card-label">不良 / 累计</div>
      </div>
      <div class="panel card">
        <div class="card-value">{{ status ? (status.beatMs / 1000).toFixed(1) + 's' : '—' }}</div>
        <div class="card-label">当前节拍</div>
      </div>
      <div class="panel card">
        <div class="card-value small">{{ status?.productCode ?? '—' }}</div>
        <div class="card-label">产品型号</div>
      </div>
      <div class="panel card">
        <div class="card-value small">
          <i class="dot" :class="edgeOnline ? 'ok' : 'off'" /> {{ edgeText }}
        </div>
        <div class="card-label">边缘网关</div>
      </div>
    </div>

    <!-- 事件流 -->
    <div class="panel feed">
      <div class="panel-title">
        <span>事件流</span>
        <span class="feed-ops">
          <span class="feed-hint">{{ events.length }} 条</span>
          <el-switch v-model="soundOn" inline-prompt active-text="声" inactive-text="静" />
        </span>
      </div>
      <el-scrollbar height="calc(100% - 40px)">
        <div v-if="events.length === 0" class="empty">暂无事件</div>
        <div
          v-for="(e, i) in events"
          :key="e.ts + '-' + i"
          class="feed-row"
          :class="{ alarm: e.type === 'alarm' }"
        >
          <span class="feed-time">{{ fmtTime(e.ts) }}</span>
          <i class="dot" :class="levelClass(e.level)" />
          <el-tag size="small" effect="plain" class="feed-type">{{ typeText(e.type) }}</el-tag>
          <span class="feed-device">{{ e.deviceId }}</span>
          <span class="feed-msg">{{ e.message ?? e.code ?? '—' }}</span>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLineData } from '../composables/useLineData';

const { status, events, edgeOnline, edgeText } = useLineData();

const statusText = computed(() => {
  const map: Record<string, string> = {
    running: '运行中', idle: '待机', alarm: '报警', offline: '离线',
  };
  return status.value ? map[status.value.state] ?? status.value.state : '—';
});

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
}

function typeText(t: string) {
  const map: Record<string, string> = {
    start: '启动', stop: '停止', alarm: '报警',
    piece_done: '单件完成', changeover: '换型', custom: '自定义',
  };
  return map[t] ?? t;
}

function levelClass(level: string) {
  return level === 'critical' || level === 'warning' ? 'off' : 'ok';
}

// ---- 报警声音提示(WebAudio 蜂鸣,无需音频文件) ----
const soundOn = ref(true);
let audioCtx: AudioContext | null = null;

function beep() {
  if (!soundOn.value) return;
  try {
    audioCtx ??= new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch {
    // 浏览器未授权音频时静默
  }
}

// 新报警事件到达 → 蜂鸣
watch(
  () => events.value[0]?.ts,
  () => {
    const latest = events.value[0];
    if (latest && latest.type === 'alarm') beep();
  },
);
</script>

<style scoped>
.status-page { display: flex; flex-direction: column; gap: 14px; height: 100%; }

.cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.card { text-align: center; padding: 18px 10px; }
.card-value { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
.card-value.small { font-size: 16px; display: inline-flex; align-items: center; gap: 6px; }
.card-value.ok { color: var(--ok); }
.card-value.ng { color: var(--ng); }
.card-value.running { color: var(--ok); }
.card-value.alarm { color: var(--ng); }
.card-value.offline { color: var(--warn); }
.card-value.idle { color: var(--text-dim); }
.card-label { font-size: 12px; color: var(--text-dim); margin-top: 6px; }

.feed { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.feed-ops { display: inline-flex; align-items: center; gap: 10px; }
.feed-hint { font-size: 11px; color: var(--text-dim); }
.empty { text-align: center; color: var(--text-dim); padding: 40px 0; }

.feed-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 8px; border-radius: 6px;
  font-size: 13px;
}
.feed-row:nth-child(odd) { background: rgba(255, 255, 255, 0.02); }
.feed-row.alarm { background: rgba(255, 92, 92, 0.10); }
.feed-time { color: var(--text-dim); font-variant-numeric: tabular-nums; width: 74px; }
.feed-type { min-width: 64px; text-align: center; }
.feed-device { color: var(--text-dim); width: 90px; }
.feed-msg { flex: 1; }
</style>
