<template>
  <div class="io-page">
    <!-- 概览:三个传感器灯 + 灯色 + 数据新鲜度 -->
    <div class="cards">
      <div v-for="p in sensorCards" :key="p.field" class="panel card">
        <div class="card-value small">
          <i class="io-dot" :class="ioTone(p, val(p))" /> {{ ioValueText(p, val(p)) }}
        </div>
        <div class="card-label">{{ p.label }}</div>
      </div>
      <div class="panel card">
        <div class="card-value small">
          <i class="io-dot" :class="ioTone(lightPoint, val(lightPoint))" />
          {{ ioValueText(lightPoint, val(lightPoint)) }}
        </div>
        <div class="card-label">{{ lightPoint.label }}</div>
      </div>
      <div class="panel card">
        <div class="card-value small" :class="stale ? 'stale' : ''">
          <i class="io-dot" :class="stale ? 'warn' : 'ok'" />
          {{ stale ? '数据停滞' : '刷新中' }}
        </div>
        <div class="card-label">更新 {{ updatedText }}</div>
      </div>
      <div class="panel card">
        <div class="card-value small">
          <i class="io-dot" :class="edgeOnline ? 'ok' : 'ng'" /> {{ edgeText }}
        </div>
        <div class="card-label">边缘网关</div>
      </div>
    </div>

    <!-- 点位明细:与 DB3 MB_SERVER HOLD 区 word 11~16 一一对应 -->
    <div class="panel table">
      <div class="panel-title">
        <span>IO 点位明细(只读)</span>
        <span class="hint">DB3 · word 11~16 · {{ IO_POINTS.length }} 点</span>
      </div>
      <div class="head">
        <span class="col-idx">#</span>
        <span class="col-word">字地址</span>
        <span class="col-field">字段</span>
        <span class="col-label">信号含义</span>
        <span class="col-value">当前值</span>
      </div>
      <div v-if="!io" class="empty">
        {{ stale ? '未收到 IO 数据 —— 请检查边缘采集器与 MQTT 链路' : '等待 IO 数据…' }}
      </div>
      <div v-for="p in IO_POINTS" :key="p.field" class="row">
        <span class="col-idx">{{ p.index }}</span>
        <span class="col-word">{{ p.word }}</span>
        <span class="col-field">{{ p.field }}</span>
        <span class="col-label">{{ p.label }}</span>
        <span class="col-value">
          <i class="io-dot" :class="ioTone(p, val(p))" />
          <span class="text">{{ ioValueText(p, val(p)) }}</span>
          <span class="raw">{{ val(p) ?? '—' }}</span>
        </span>
      </div>
    </div>

    <p class="foot">
      本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useLineData } from '../composables/useLineData';
import {
  IO_POINTS, ioPointByField, ioValueText, ioTone,
  type IoField, type IoPoint,
} from '../services/ioPoints';

const { io, edgeOnline, edgeText } = useLineData();

// Redis 快照 TTL 60s,这里用 5s:edge 跟随 200ms 轮询,5s 还没新帧就是真出问题了
const STALE_MS = 5_000;
const now = ref(Date.now());
const timer = setInterval(() => { now.value = Date.now(); }, 500);
onUnmounted(() => clearInterval(timer));

const stale = computed(() => !io.value || now.value - io.value.ts > STALE_MS);

function val(p: IoPoint): number | null | undefined {
  return (io.value?.io as Record<IoField, number | null> | undefined)?.[p.field];
}

const sensorCards = computed(() =>
  (['sensorIn', 'sensorArrive', 'sensorRetreat'] as IoField[]).map(ioPointByField),
);
const lightPoint = ioPointByField('lightColor');

const updatedText = computed(() =>
  io.value ? new Date(io.value.ts).toLocaleTimeString('zh-CN', { hour12: false }) : '—',
);
</script>

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
