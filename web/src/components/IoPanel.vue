<!--
  孪生页面的只读产线与机器人状态面板，显示工序、模式、边缘在线、报警和六轴数值。
  组件复用 useLineData 的工序、机器人与事件状态，用 lineState 的规则生成工序文案和色调。
  六路传感器/灯色点位页面在 views/IoView.vue；本面板不直接读取 PLC，也不下发控制写点。
-->
<template>
  <div class="panel overlay right">
  <!-- 渲染容器，应用 panel overlay right 样式类。 -->
    <div class="panel-title">
    <!-- 渲染容器，应用 panel-title 样式类。 -->
      <span>产线 LINE-01</span>
      <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
      <!-- 渲染状态标签，条件成立时显示（status）。 -->
        {{ statusText }}
      </el-tag>
    </div>

    <!-- 报警灯:alarmCode > 0,或产线处于 alarm / init_error 时红色脉冲 -->
    <div v-if="alarmOn" class="alarm-row">
    <!-- 渲染容器，应用 alarm-row 样式类，条件成立时显示（alarmOn）。 -->
      <span class="alarm-light" :class="{ pulse: true }" />
      <!-- 渲染行内文字，应用 alarm-light 样式类。 -->
      <span class="alarm-text">{{ alarmText || `产线异常(${statusText})` }}</span>
      <!-- 渲染行内文字，应用 alarm-text 样式类，其中显示 alarmText || 产线异常(${statusText}) 的计算结果。 -->
    </div>

    <!-- I/O 信号灯矩阵:现场 17 word 表提供产线状态、6 轴关节与 6 路 IO -->
    <div v-if="status || robot" class="io-grid">
    <!-- 渲染容器，应用 io-grid 样式类，条件成立时显示（status || robot）。 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="modeDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <span class="io-label">模式</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ robot?.mode ?? '—' }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 robot?.mode ?? '—' 的计算结果。 -->
      </div>
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="runDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <span class="io-label">状态</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ runText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 runText 的计算结果。 -->
      </div>
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="edgeDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <span class="io-label">边缘</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ edgeText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 edgeText 的计算结果。 -->
      </div>
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="alarmDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <span class="io-label">报警</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ alarmCodeText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 alarmCodeText 的计算结果。 -->
      </div>
    </div>

    <!-- 六轴关节角(现场 PLC 唯一上送的机器人数据) -->
    <div v-if="joints.length" class="joints">
    <!-- 渲染容器，应用 joints 样式类，条件成立时显示（joints.length）。 -->
      <div class="stat" v-for="(j, i) in joints" :key="i">
      <!-- 渲染容器，应用 stat 样式类，按集合重复生成（(j, i) in joints）。 -->
        <div class="val">{{ j === null ? '—' : j.toFixed(1) }}</div>
        <!-- 渲染容器，应用 val 样式类，其中显示 j === null ? '—' : j.toFixed(1) 的计算结果。 -->
        <div class="lbl">J{{ i + 1 }}</div>
        <!-- 渲染容器，应用 lbl 样式类，其中显示 i + 1 的计算结果。 -->
      </div>
    </div>

    <!--
      注:契约里的 goodCount / ngCount / beatMs / speedPct 仍保留(只增不改),
      但现场 PLC 点位表未提供这些实测值,edge 输出默认值 0 —— 展示出来只会
      误导成"真实计数为 0",故已从面板移除(2026-10-23)。
    -->

    <div class="meta">
    <!-- 渲染容器，应用 meta 样式类。 -->
      <span>程序 {{ robot?.program || '—' }}</span>
      <!-- 渲染行内文字，其中显示 robot?.program || '—' 的计算结果。 -->
      <span>产品 {{ status?.productCode || '—' }}</span>
      <!-- 渲染行内文字，其中显示 status?.productCode || '—' 的计算结果。 -->
    </div>

    <el-empty v-if="!status && !robot" description="切换实时数据…" :image-size="50" />
    <!-- 渲染el-empty 元素或组件，条件成立时显示（!status && !robot）。 -->

    <!-- 控制按钮区(level >= 2 才渲染;由父级传 isAdminOrL2 控制) -->
    <div v-if="canCommand" class="ctrl-slot">
    <!-- 渲染容器，应用 ctrl-slot 样式类，条件成立时显示（canCommand）。 -->
      <slot name="controls" />
    </div>
  </div>
</template>

<!-- 这一段实现组件状态与事件处理，服务于展示六个现场只读 IO 点位与设备示意。 -->
<script setup lang="ts">
import { computed } from 'vue';
import { useLineData } from '../composables/useLineData';
import { stateText, stateTagType as tagTypeOf, isRunning } from '../services/lineState';

defineProps<{ canCommand: boolean }>();
const { robot, status, edgeText, alarmText, edgeOnline } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。

const statusText = computed(() =>
  status.value ? stateText(status.value.state) : '等待中');
  // 把产线状态转换为中文展示文字。

const stateTagType = computed(() => tagTypeOf(status.value?.state));

// 现场 PLC 17 word 表上送 joints[0..5]、产线状态和 6 路 IO,没有 alarmCode;
// 该字段保留在契约里(只增不改),edge 无数据时输出 0。
const alarmOn = computed(() =>
  (robot.value?.alarmCode !== undefined && robot.value.alarmCode !== 0) ||
  // 该字段保留在契约里(只增不改),edge 无数据时输出 0。
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

<!-- 这一段实现当前页面或组件的外观样式，服务于展示六个现场只读 IO 点位与设备示意。 -->
<style scoped>
/* 这一段为 .panel.overlay.right 对应的界面元素定义尺寸、布局或视觉样式。 */
.panel.overlay.right {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 260px;
  z-index: 5;
}
/* 这一段为 .panel-title 对应的界面元素定义尺寸、布局或视觉样式。 */
.panel-title {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; color: var(--text); margin-bottom: 8px;
}

/* 报警行(脉冲红点) */
/* 这一段为 .alarm-row 对应的界面元素定义尺寸、布局或视觉样式。 */
.alarm-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; margin-bottom: 8px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.4);
  border-radius: 6px;
}
/* 这一段为 .alarm-light 对应的界面元素定义尺寸、布局或视觉样式。 */
.alarm-light {
  width: 10px; height: 10px; border-radius: 50%;
  background: #ef4444; box-shadow: 0 0 8px #ef4444;
}
.alarm-light.pulse { animation: pulse 1s infinite; }
.alarm-text { font-size: 12px; color: #fca5a5; }
/* 这一段为 @keyframes pulse 对应的界面元素定义尺寸、布局或视觉样式。 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

/* I/O 灯矩阵 */
/* 这一段为 .io-grid 对应的界面元素定义尺寸、布局或视觉样式。 */
.io-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  padding: 6px 0; margin-bottom: 6px;
}
/* 这一段为 .io-cell 对应的界面元素定义尺寸、布局或视觉样式。 */
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

/* 数值字段样式已随 良品/不良/节拍/倍率 一同移除 */

/* 这一段为 .meta 对应的界面元素定义尺寸、布局或视觉样式。 */
.meta {
  margin-top: 8px; padding-top: 6px;
  border-top: 1px dashed var(--panel-border);
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--text-dim);
}

/* 这一段为 .ctrl-slot 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-slot {
  margin-top: 10px; padding-top: 10px;
  border-top: 1px dashed var(--panel-border);
}
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
