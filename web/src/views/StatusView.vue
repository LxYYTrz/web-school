<!--
  @deprecated 2026-10-16 暂停使用
  暂停原因:当前阶段不展示。文件保留不删,后续如需恢复:
    1. web/src/router/index.ts 取消 /status 路由注释
    2. web/src/App.vue 取消 <el-menu-item>"产线状态" 注释
    3. router 重新 import StatusView
  代码内容保持原样,未做改动。
-->
<template>
  <div class="status-page">
    <!-- 统计卡片 -->
    <div class="cards">
      <!-- ① 产线状态 -->
      <!-- ② 良品累计 -->
      <!-- ③ 不良累计 -->
      <!-- ④ 当前节拍（毫秒转秒） -->
      <!-- ⑤ 产品型号 -->
      <!-- ⑥ 边缘网关在线状态 -->
      <div class="panel card">
        <div class="card-value" :class="stateClass">{{ statusText }}</div>
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
        <!-- 右上角：条数统计 + 声音开关 -->
        <span class="feed-ops">
          <span class="feed-hint">{{ events.length }} 条</span>
          <el-switch v-model="soundOn" inline-prompt active-text="声" inactive-text="静" />
        </span>
      </div>
      <!-- 可滚动区域，固定高度填满剩余空间 -->
      <el-scrollbar height="calc(100% - 40px)">
        <!-- 空状态 -->
        <div v-if="events.length === 0" class="empty">暂无事件</div>
        <!-- 事件列表：最新的在最上面 -->
        <div
          v-for="(e, i) in events"
          :key="e.ts + '-' + i"
          class="feed-row"
          :class="{ alarm: e.type === 'alarm' }"
        >
          <span class="feed-time">{{ fmtTime(e.ts) }}</span>
          <!-- 级别指示灯 -->
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
import { stateText as stateTextOf, stateClass as stateClassOf } from '../services/lineState';

// 取数据（与顶栏、孪生页同一实例）
const { status, events, edgeOnline, edgeText } = useLineData();

// 产线状态映射单点定义见 services/lineState.ts(契约 v1.1:原 4 态 + PLC 10 态工序)
const statusText = computed(() => stateTextOf(status.value?.state));
const stateClass = computed(() => stateClassOf(status.value?.state));

/**
 * 时间戳 → 本地时间字符串（24 小时制中文格式）。
 */
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
// 浏览器未授权音频时静默
// （例如自动播放策略拦截，或浏览器不支持 WebAudio）
}

/**
 * 事件类型 → 中文文案。
 */
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
/** 声音开关（受页面上的 el-switch 控制） */
const soundOn = ref(true);
/** AudioContext 实例：懒创建，全局复用一个 */
let audioCtx: AudioContext | null = null;

function beep() {
  // 开关关着就不响
  if (!soundOn.value) return;
  try {
    // 懒创建 AudioContext（??= 表示"没就创建"）
    audioCtx ??= new AudioContext();
    // 振荡器：产生 880Hz 的方波
    const osc = audioCtx.createOscillator();
    // 增益节点：控制音量包络
    const gain = audioCtx.createGain();
    // 设置频率
    osc.frequency.value = 880;
    // 音量从 0.08 开始，0.4 秒内指数衰减到几乎听不见
    // （指数衰减听起来更像"嘟"的一声，而不是"啪"地切断）
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    // 连接链路：振荡器 → 增益 → 扬声器
    osc.connect(gain).connect(audioCtx.destination);
    // 立刻开始发声
    osc.start();
    // 0.4 秒后停止
    osc.stop(audioCtx.currentTime + 0.4);
  } catch {
    // 浏览器未授权音频时静默
  }
}

// 新报警事件到达 → 蜂鸣
/**
 * 侦听"最新一条事件的 ts"。
 * 技巧：events 是 unshift 的（新的在前），所以 events.value[0]?.ts 变化
 * 就说明有**新事件**到达。watch 回调里再判断它是不是 alarm 类型。
 */
watch(
  () => events.value[0]?.ts,
  () => {
    const latest = events.value[0];
    // 只有报警类型才蜂鸣
    if (latest && latest.type === 'alarm') beep();
  },
);
</script>

<style scoped>
/* scoped：样式仅作用于本组件 */
.status-page { display: flex; flex-direction: column; gap: 14px; height: 100%; }

/* 6 列卡片网格 */
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

/* 事件流面板：占据剩余高度 */
.feed { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.feed-ops { display: inline-flex; align-items: center; gap: 10px; }
.feed-hint { font-size: 11px; color: var(--text-dim); }
.empty { text-align: center; color: var(--text-dim); padding: 40px 0; }

/* 单条事件 */
.feed-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 8px; border-radius: 6px;
  font-size: 13px;
}
/* 斑马纹 */
.feed-row:nth-child(odd) { background: rgba(255, 255, 255, 0.02); }
/* 报警行高亮 */
.feed-row.alarm { background: rgba(255, 92, 92, 0.10); }
.feed-time { color: var(--text-dim); font-variant-numeric: tabular-nums; width: 74px; }
.feed-type { min-width: 64px; text-align: center; }
.feed-device { color: var(--text-dim); width: 90px; }
.feed-msg { flex: 1; }
</style>
