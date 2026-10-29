<!--
  浏览器的六路只读 IO 页面，复用 useLineData 的 IO 帧。
  模板逐点显示名称、地址、值与色调；脚本按帧 ts 定期计算停滞，并由消息刷新界面。
  每 500ms 检查一次，超过 5 秒或没有数据显示停滞；这与 Redis key 的 60 秒过期分别处理。
-->
<template>
  <div class="io-page">
  <!-- 渲染容器，应用 io-page 样式类。 -->
    <!-- 概览:三个传感器灯 + 灯色 + 数据新鲜度 -->
    <div class="cards">
    <!-- 渲染容器，应用 cards 样式类。 -->
      <div v-for="p in sensorCards" :key="p.field" class="panel card">
      <!-- 渲染容器，应用 panel card 样式类，按集合重复生成（p in sensorCards）。 -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
          <i class="io-dot" :class="ioTone(p, val(p))" /> {{ ioValueText(p, val(p)) }}
          <!-- 渲染图标或状态点，应用 io-dot 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 -->
        </div>
        <div class="card-label">{{ p.label }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 p.label 的计算结果。 -->
      </div>
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
          <i class="io-dot" :class="ioTone(lightPoint, val(lightPoint))" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 -->
          {{ ioValueText(lightPoint, val(lightPoint)) }}
        </div>
        <div class="card-label">{{ lightPoint.label }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 lightPoint.label 的计算结果。 -->
      </div>
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
        <div class="card-value small" :class="stale ? 'stale' : ''">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
          <i class="io-dot" :class="stale ? 'warn' : 'ok'" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 -->
          {{ stale ? '数据停滞' : '刷新中' }}
        </div>
        <div class="card-label">更新 {{ updatedText }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 updatedText 的计算结果。 -->
      </div>
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
          <i class="io-dot" :class="edgeOnline ? 'ok' : 'ng'" /> {{ edgeText }}
          <!-- 渲染图标或状态点，应用 io-dot 样式类，其中显示 edgeText 的计算结果。 -->
        </div>
        <div class="card-label">边缘网关</div>
        <!-- 渲染容器，应用 card-label 样式类。 -->
      </div>
    </div>

    <!-- 点位明细:与 DB3 MB_SERVER HOLD 区 word 11~16 一一对应 -->
    <div class="panel table">
    <!-- 渲染容器，应用 panel table 样式类。 -->
      <div class="panel-title">
      <!-- 渲染容器，应用 panel-title 样式类。 -->
        <span>IO 点位明细(只读)</span>
        <span class="hint">DB3 · word 11~16 · {{ IO_POINTS.length }} 点</span>
        <!-- 渲染行内文字，应用 hint 样式类，其中显示 IO_POINTS.length 的计算结果。 -->
      </div>
      <div class="head">
      <!-- 渲染容器，应用 head 样式类。 -->
        <span class="col-idx">#</span>
        <!-- 渲染行内文字，应用 col-idx 样式类。 -->
        <span class="col-word">字地址</span>
        <!-- 渲染行内文字，应用 col-word 样式类。 -->
        <span class="col-field">字段</span>
        <!-- 渲染行内文字，应用 col-field 样式类。 -->
        <span class="col-label">信号含义</span>
        <!-- 渲染行内文字，应用 col-label 样式类。 -->
        <span class="col-value">当前值</span>
        <!-- 渲染行内文字，应用 col-value 样式类。 -->
      </div>
      <div v-if="!io" class="empty">
      <!-- 渲染容器，应用 empty 样式类，条件成立时显示（!io）。 -->
        {{ stale ? '未收到 IO 数据 —— 请检查边缘采集器与 MQTT 链路' : '等待 IO 数据…' }}
      </div>
      <div v-for="p in IO_POINTS" :key="p.field" class="row">
      <!-- 渲染容器，应用 row 样式类，按集合重复生成（p in IO_POINTS）。 -->
        <span class="col-idx">{{ p.index }}</span>
        <!-- 渲染行内文字，应用 col-idx 样式类，其中显示 p.index 的计算结果。 -->
        <span class="col-word">{{ p.word }}</span>
        <!-- 渲染行内文字，应用 col-word 样式类，其中显示 p.word 的计算结果。 -->
        <span class="col-field">{{ p.field }}</span>
        <!-- 渲染行内文字，应用 col-field 样式类，其中显示 p.field 的计算结果。 -->
        <span class="col-label">{{ p.label }}</span>
        <!-- 渲染行内文字，应用 col-label 样式类，其中显示 p.label 的计算结果。 -->
        <span class="col-value">
        <!-- 渲染行内文字，应用 col-value 样式类。 -->
          <i class="io-dot" :class="ioTone(p, val(p))" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 -->
          <span class="text">{{ ioValueText(p, val(p)) }}</span>
          <!-- 渲染行内文字，应用 text 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 -->
          <span class="raw">{{ val(p) ?? '—' }}</span>
          <!-- 渲染行内文字，应用 raw 样式类，其中显示 val(p) ?? '—' 的计算结果。 -->
        </span>
      </div>
    </div>

    <p class="foot">
    <!-- 渲染段落，应用 foot 样式类。 -->
      本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。
      <!-- 在当前页面元素中直接显示文字「本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。」。 -->
      <!-- 本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。 是直接显示在当前界面元素中的文字内容 -->
    </p>
  </div>
</template>

<!-- 这一段实现组件状态与事件处理，服务于汇总展示产线 IO 信号与点位说明。 -->
<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useLineData } from '../composables/useLineData';
import {
  IO_POINTS, ioPointByField, ioValueText, ioTone,
  type IoField, type IoPoint,
} from '../services/ioPoints';

const { io, edgeOnline, edgeText } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。

// Redis 快照 TTL 60s,这里用 5s:edge 跟随 200ms 轮询,5s 还没新帧就是真出问题了
const STALE_MS = 5_000;

// 这里为 IO 页面维护一个每 500 毫秒更新的浏览器时钟，促使 stale 的计算定期重新执行。
// 这是网页对 IO 数据新鲜度的判断，不会删除 Redis 快照，也不保证自动清空浏览器保留的上次点位值。
// 两端时间参与比较，现场数据时钟与浏览器时钟存在偏差时也会影响这个判断。

const now = ref(Date.now());
// 保存浏览器当前时间，下面定时更新它，以便 stale 计算能持续判断帧是否停滞。
// now 是 ref；io.ts 是上报帧时间；STALE_MS 为 5000 毫秒，定时器每 500 毫秒更新时间，和 Redis 60 秒有效期是不同判断。
const timer = setInterval(() => { now.value = Date.now(); }, 500);
onUnmounted(() => clearInterval(timer));

const stale = computed(() => !io.value || now.value - io.value.ts > STALE_MS);
// 1. computed 来自 Vue，依赖当前帧与每 500ms 更新一次的 now。
// 2. 没有 IO 帧，或当前浏览器时间减帧 ts 超过 5000ms，就判为停滞。
// 3. 这个判断改变页面状态提示，没有在此删除旧 IO 数值。
// 4. 它与 Redis 的 EX 60 不同：前者检查页面数据时间，后者决定后端 key 还能否读到。

function val(p: IoPoint): number | null | undefined {
  return (io.value?.io as Record<IoField, number | null> | undefined)?.[p.field];
}

const sensorCards = computed(() =>
  (['sensorIn', 'sensorArrive', 'sensorRetreat'] as IoField[]).map(ioPointByField),
  // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
);
const lightPoint = ioPointByField('lightColor');

const updatedText = computed(() =>
  io.value ? new Date(io.value.ts).toLocaleTimeString('zh-CN', { hour12: false }) : '—',
);
</script>

<!-- 这一段实现当前页面或组件的外观样式，服务于汇总展示产线 IO 信号与点位说明。 -->
<style scoped>
.io-page { display: flex; flex-direction: column; gap: 14px; }

.cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.card { text-align: center; padding: 18px 10px; }
.card-value { font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 7px; }
.card-value.small { display: inline-flex; }
.card-value.stale { color: #f59e0b; }
.card-label { font-size: 12px; color: var(--text-dim); margin-top: 6px; }

/* 灯点语义色。与 IoPanel 的 io-dot 一致;idle = 无信号(不是故障) */
.io-dot {
  width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0;
}
.io-dot.ok   { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
.io-dot.act  { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }
.io-dot.warn { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
.io-dot.ng   { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
.io-dot.off, .io-dot.idle { background: #475569; }

.table { padding-bottom: 6px; }
.hint { font-size: 11px; color: var(--text-dim); }
.empty { text-align: center; color: var(--text-dim); padding: 40px 0; }

/* 这一段为 .head, .row 对应的界面元素定义尺寸、布局或视觉样式。 */
.head, .row {
  display: grid;
  grid-template-columns: 48px 88px 150px 1fr 240px;
  align-items: center;
  gap: 10px;
  padding: 8px;
  font-size: 13px;
}
.head { font-size: 12px; color: var(--text-dim); border-bottom: 1px solid var(--panel-border); }
.row:nth-child(odd) { background: rgba(255, 255, 255, 0.02); }

.col-idx, .col-word { color: var(--text-dim); font-variant-numeric: tabular-nums; }
.col-field { font-family: ui-monospace, Consolas, monospace; }
.col-value { display: inline-flex; align-items: center; gap: 8px; }
.col-value .text { min-width: 56px; }
.raw { color: var(--text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }

.foot { margin: 0; font-size: 12px; color: var(--text-dim); }
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
