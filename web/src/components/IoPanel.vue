<template>
  <div class="panel overlay right">
    <div class="panel-title">
      <span>产线 LINE-01</span>
      <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
        {{ statusText }}
      </el-tag>
    </div>

    <!-- 报警灯:alarmCode > 0,或产线处于 alarm / init_error 时红色脉冲 -->
    <div v-if="alarmOn" class="alarm-row">
      <span class="alarm-light" :class="{ pulse: true }" />
      <span class="alarm-text">{{ alarmText || `产线异常(${statusText})` }}</span>
    </div>

    <!-- I/O 信号灯矩阵:现场 11 word 表提供 产线状态 + 6 轴关节 + 边缘在线 -->
    <div v-if="status || robot" class="io-grid">
      <div class="io-cell">
        <span class="io-dot" :class="modeDot" />
        <span class="io-label">模式</span>
        <span class="io-val">{{ robot?.mode ?? '—' }}</span>
      </div>
      <div class="io-cell">
        <span class="io-dot" :class="runDot" />
        <span class="io-label">状态</span>
        <span class="io-val">{{ runText }}</span>
      </div>
      <div class="io-cell">
        <span class="io-dot" :class="edgeDot" />
        <span class="io-label">边缘</span>
        <span class="io-val">{{ edgeText }}</span>
      </div>
      <div class="io-cell">
        <span class="io-dot" :class="alarmDot" />
        <span class="io-label">报警</span>
        <span class="io-val">{{ alarmCodeText }}</span>
      </div>
    </div>

    <!-- 六轴关节角(现场 PLC 唯一上送的机器人数据) -->
    <div v-if="joints.length" class="joints">
      <div class="stat" v-for="(j, i) in joints" :key="i">
        <div class="val">{{ j === null ? '—' : j.toFixed(1) }}</div>
        <div class="lbl">J{{ i + 1 }}</div>
      </div>
    </div>

    <!--
      以下字段在契约里保留(只增不改),但现场 11 word 表未提供,
      edge 输出默认值 0 / 空串,不代表真实测量值。
    -->
    <div v-if="status" class="stats is-default">
      <div class="stat"><div class="val ok">{{ status.goodCount }}</div><div class="lbl">良品</div></div>
      <div class="stat"><div class="val ng">{{ status.ngCount }}</div><div class="lbl">不良</div></div>
      <div class="stat"><div class="val">{{ (status.beatMs / 1000).toFixed(1) }}s</div><div class="lbl">节拍</div></div>
      <div class="stat" v-if="robot"><div class="val">{{ robot.speedPct }}%</div><div class="lbl">倍率</div></div>
    </div>

    <div class="meta">
      <span>程序 {{ robot?.program || '—' }}</span>
      <span>产品 {{ status?.productCode || '—' }}</span>
    </div>

    <el-empty v-if="!status && !robot" description="切换实时数据…" :image-size="50" />

    <!-- 控制按钮区(level >= 2 才渲染;由父级传 isAdminOrL2 控制) -->
    <div v-if="canCommand" class="ctrl-slot">
      <slot name="controls" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLineData } from '../composables/useLineData';
import { stateText, stateTagType as tagTypeOf, isRunning } from '../services/lineState';

defineProps<{ canCommand: boolean }>();
const { robot, status, edgeText, alarmText, edgeOnline } = useLineData();

const statusText = computed(() =>
  status.value ? stateText(status.value.state) : '等待中');

const stateTagType = computed(() => tagTypeOf(status.value?.state));

// 现场 PLC 11 word 表只上送 joints[0..5] + 产线状态,没有 alarmCode;
// 该字段保留在契约里(只增不改),edge 无数据时输出 0。
const alarmOn = computed(() =>
  (robot.value?.alarmCode !== undefined && robot.value.alarmCode !== 0) ||
  status.value?.state === 'alarm' ||
  status.value?.state === 'init_error',
);

const runText = computed(() => status.value ? statusText.value : '—');
const runDot = computed(() => {
  const s = status.value?.state;
  if (isRunning(s)) return 'ok';
  if (s === 'alarm' || s === 'init_error') return 'ng';
  if (s === 'offline') return 'warn';
  return 'idle';
});

const modeDot = computed(() => {
  const m = robot.value?.mode;
  if (m === 'auto') return 'ok';
  if (m === 'manual') return 'warn';
  if (m === 'error') return 'ng';
  return 'idle';
});

const alarmDot = computed(() => alarmOn.value ? 'ng' : 'ok');
const alarmCodeText = computed(() =>
  robot.value?.alarmCode ? `#${robot.value.alarmCode}` : '无',
);

const edgeDot = computed(() => {
  if (edgeOnline.value === null) return 'idle';
  return edgeOnline.value ? 'ok' : 'ng';
});

// 六轴关节角:现场 PLC 唯一上送的机器人数据(word 0..5,÷10 还原)
const joints = computed<(number | null)[]>(() => {
  const j = robot.value?.joints;
  return Array.isArray(j) ? j.slice(0, 6) : [];
});
</script>

<style scoped>
.panel.overlay.right {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 260px;
  z-index: 5;
}
.panel-title {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; color: var(--text); margin-bottom: 8px;
}

/* 报警行(脉冲红点) */
.alarm-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; margin-bottom: 8px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.4);
  border-radius: 6px;
}
.alarm-light {
  width: 10px; height: 10px; border-radius: 50%;
  background: #ef4444; box-shadow: 0 0 8px #ef4444;
}
.alarm-light.pulse { animation: pulse 1s infinite; }
.alarm-text { font-size: 12px; color: #fca5a5; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* I/O 灯矩阵 */
.io-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  padding: 6px 0; margin-bottom: 6px;
}
.io-cell {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px;
  padding: 4px 6px;
  background: rgba(255,255,255,0.02);
  border-radius: 4px;
}
.io-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.io-dot.ok   { background: #22c55e; box-shadow: 0 0 4px #22c55e; }
.io-dot.ng   { background: #ef4444; box-shadow: 0 0 4px #ef4444; }
.io-dot.warn { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; }
.io-dot.idle { background: #475569; }
.io-label { color: var(--text-dim); width: 28px; }
.io-val { color: var(--text); font-weight: 500; }

/* 六轴关节角 */
.joints { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; text-align: center; padding: 6px 0; }
.joints .val { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--accent); }
.joints .lbl { font-size: 9px; color: var(--text-dim); margin-top: 1px; }

/* 数值字段 */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; padding: 4px 0; }
.stats .val { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
.stats .val.ok  { color: var(--ok); }
.stats .val.ng  { color: var(--ng); }
.stats .lbl { font-size: 10px; color: var(--text-dim); margin-top: 2px; }

/* 未接现场点位的字段:整块淡化,提示这不是实测值 */
.stats.is-default { opacity: 0.45; }

.meta {
  margin-top: 8px; padding-top: 6px;
  border-top: 1px dashed var(--panel-border);
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--text-dim);
}

.ctrl-slot {
  margin-top: 10px; padding-top: 10px;
  border-top: 1px dashed var(--panel-border);
}
</style>