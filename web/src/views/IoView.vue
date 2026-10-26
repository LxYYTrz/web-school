<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
  <div class="io-page">
  <!-- 渲染容器，应用 io-page 样式类。 -->
    <!-- 概览:三个传感器灯 + 灯色 + 数据新鲜度 -->
    <div class="cards">
    <!-- 渲染容器，应用 cards 样式类。 -->
      <div v-for="p in sensorCards" :key="p.field" class="panel card">
      <!-- 渲染容器，应用 panel card 样式类，按集合重复生成（p in sensorCards）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
          <i class="io-dot" :class="ioTone(p, val(p))" /> {{ ioValueText(p, val(p)) }}
          <!-- 渲染图标或状态点，应用 io-dot 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 关键字：{{＝插入表达式计算后的文本；:＝属性动态绑定的简写。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <div class="card-label">{{ p.label }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 p.label 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
          <i class="io-dot" :class="ioTone(lightPoint, val(lightPoint))" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
          {{ ioValueText(lightPoint, val(lightPoint)) }}
          <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <div class="card-label">{{ lightPoint.label }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 lightPoint.label 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
        <div class="card-value small" :class="stale ? 'stale' : ''">
        <!-- 渲染容器，应用 card-value small 样式类。 关键字：:＝属性动态绑定的简写。 -->
          <i class="io-dot" :class="stale ? 'warn' : 'ok'" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
          {{ stale ? '数据停滞' : '刷新中' }}
          <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <div class="card-label">更新 {{ updatedText }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 updatedText 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
          <i class="io-dot" :class="edgeOnline ? 'ok' : 'ng'" /> {{ edgeText }}
          <!-- 渲染图标或状态点，应用 io-dot 样式类，其中显示 edgeText 的计算结果。 关键字：{{＝插入表达式计算后的文本；:＝属性动态绑定的简写。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <div class="card-label">边缘网关</div>
        <!-- 渲染容器，应用 card-label 样式类。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <!-- 点位明细:与 DB3 MB_SERVER HOLD 区 word 11~16 一一对应 -->
    <div class="panel table">
    <!-- 渲染容器，应用 panel table 样式类。 -->
      <div class="panel-title">
      <!-- 渲染容器，应用 panel-title 样式类。 -->
        <span>IO 点位明细(只读)</span>
        <!-- 渲染行内文字。 -->
        <span class="hint">DB3 · word 11~16 · {{ IO_POINTS.length }} 点</span>
        <!-- 渲染行内文字，应用 hint 样式类，其中显示 IO_POINTS.length 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
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
      <!-- 结束 div 元素及其中的内容。 -->
      <div v-if="!io" class="empty">
      <!-- 渲染容器，应用 empty 样式类，条件成立时显示（!io）。 关键字：v-if＝条件为真时才渲染。 -->
        {{ stale ? '未收到 IO 数据 —— 请检查边缘采集器与 MQTT 链路' : '等待 IO 数据…' }}
        <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div v-for="p in IO_POINTS" :key="p.field" class="row">
      <!-- 渲染容器，应用 row 样式类，按集合重复生成（p in IO_POINTS）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
        <span class="col-idx">{{ p.index }}</span>
        <!-- 渲染行内文字，应用 col-idx 样式类，其中显示 p.index 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        <span class="col-word">{{ p.word }}</span>
        <!-- 渲染行内文字，应用 col-word 样式类，其中显示 p.word 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        <span class="col-field">{{ p.field }}</span>
        <!-- 渲染行内文字，应用 col-field 样式类，其中显示 p.field 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        <span class="col-label">{{ p.label }}</span>
        <!-- 渲染行内文字，应用 col-label 样式类，其中显示 p.label 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        <span class="col-value">
        <!-- 渲染行内文字，应用 col-value 样式类。 -->
          <i class="io-dot" :class="ioTone(p, val(p))" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
          <span class="text">{{ ioValueText(p, val(p)) }}</span>
          <!-- 渲染行内文字，应用 text 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
          <span class="raw">{{ val(p) ?? '—' }}</span>
          <!-- 渲染行内文字，应用 raw 样式类，其中显示 val(p) ?? '—' 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <p class="foot">
    <!-- 渲染段落，应用 foot 样式类。 -->
      本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。
      <!-- 显示该行文本内容或结束当前元素。 -->
    </p>
    <!-- 结束 p 元素及其中的内容。 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { computed, onUnmounted, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import {
// 导入或导出模块符号。 关键字：import＝导入模块或符号。
  IO_POINTS, ioPointByField, ioValueText, ioTone,
  // 继续当前表达式；这一行的值由外层代码块或调用使用。
  type IoField, type IoPoint,
  // 声明 IoField 的结构。 关键字：type＝定义类型别名。
} from '../services/ioPoints';
// 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：from＝指定导入来源。

const { io, edgeOnline, edgeText } = useLineData();
// 从右侧结果中取出 io, edgeOnline, edgeText，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。

// Redis 快照 TTL 60s,这里用 5s:edge 跟随 200ms 轮询,5s 还没新帧就是真出问题了
const STALE_MS = 5_000;
// 声明 STALE_MS，初始值由 5_000 计算得到。 关键字：const＝声明不可重新绑定的变量。
const now = ref(Date.now());
// 声明 now，初始值由 ref(Date.now()) 计算得到。 关键字：const＝声明不可重新绑定的变量。
const timer = setInterval(() => { now.value = Date.now(); }, 500);
// 声明 timer，初始值由 setInterval(() => { now.value = Date.now(); }, 500) 计算得到。 关键字：const＝声明不可重新绑定的变量。
onUnmounted(() => clearInterval(timer));
// 调用 onUnmounted；括号中的表达式是传入的参数。

const stale = computed(() => !io.value || now.value - io.value.ts > STALE_MS);
// 声明 stale，初始值由 computed(() => !io.value || now.value - io.value.ts > STALE_MS) 计算得到。 关键字：const＝声明不可重新绑定的变量。

function val(p: IoPoint): number | null | undefined {
// 定义函数 val。 关键字：function＝定义函数；null＝空值；undefined＝未定义值。
  return (io.value?.io as Record<IoField, number | null> | undefined)?.[p.field];
  // 返回 (io.value?.io as Record<IoField, number | null> | undefined)?.[p.field] 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；null＝空值；undefined＝未定义值。
}
// 结束当前对象、函数或条件代码块。

const sensorCards = computed(() =>
// 声明 sensorCards，初始值由 computed(() => 计算得到。 关键字：const＝声明不可重新绑定的变量。
  (['sensorIn', 'sensorArrive', 'sensorRetreat'] as IoField[]).map(ioPointByField),
  // 开始当前表达式的分组或数组内容。
);
// 结束当前函数的参数列表并完成调用。
const lightPoint = ioPointByField('lightColor');
// 声明 lightPoint，初始值由 ioPointByField('lightColor') 计算得到。 关键字：const＝声明不可重新绑定的变量。

const updatedText = computed(() =>
// 声明 updatedText，初始值由 computed(() => 计算得到。 关键字：const＝声明不可重新绑定的变量。
  io.value ? new Date(io.value.ts).toLocaleTimeString('zh-CN', { hour12: false }) : '—',
  // 调用 Date；括号中的表达式是传入的参数。 关键字：new＝创建对象实例；false＝布尔假值。
);
// 结束当前函数的参数列表并完成调用。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
.io-page { display: flex; flex-direction: column; gap: 14px; }
/* display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=14px：设置子元素间距。 */

.cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
/* display=grid：决定元素如何布局或显示；grid-template-columns=repeat(6, 1fr)：定义网格列布局；gap=12px：设置子元素间距。 */
.card { text-align: center; padding: 18px 10px; }
/* text-align=center：设置该样式属性；padding=18px 10px：设置内边距。 */
.card-value { font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 7px; }
/* font-size=15px：设置字号；font-weight=600：设置字重；display=inline-flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=7px：设置子元素间距。 */
.card-value.small { display: inline-flex; }
/* display=inline-flex：决定元素如何布局或显示。 */
.card-value.stale { color: #f59e0b; }
/* color=#f59e0b：设置文字颜色。 */
.card-label { font-size: 12px; color: var(--text-dim); margin-top: 6px; }
/* font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色；margin-top=6px：设置该样式属性。 */

/* 灯点语义色。与 IoPanel 的 io-dot 一致;idle = 无信号(不是故障) */
.io-dot {
/* 对选择器 .io-dot 匹配的元素应用后续声明。 */
  width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0;
  /* width=9px：设置宽度；height=9px：设置高度；border-radius=50%：设置圆角；display=inline-block：决定元素如何布局或显示；flex-shrink=0：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.io-dot.ok   { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
/* background=#22c55e：设置背景；box-shadow=0 0 6px #22c55e：设置阴影。 */
.io-dot.act  { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }
/* background=#2ecc71：设置背景；box-shadow=0 0 6px #2ecc71：设置阴影。 */
.io-dot.warn { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
/* background=#f59e0b：设置背景；box-shadow=0 0 6px #f59e0b：设置阴影。 */
.io-dot.ng   { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
/* background=#ef4444：设置背景；box-shadow=0 0 6px #ef4444：设置阴影。 */
.io-dot.off, .io-dot.idle { background: #475569; }
/* background=#475569：设置背景。 */

.table { padding-bottom: 6px; }
/* padding-bottom=6px：设置该样式属性。 */
.hint { font-size: 11px; color: var(--text-dim); }
/* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
.empty { text-align: center; color: var(--text-dim); padding: 40px 0; }
/* text-align=center：设置该样式属性；color=var(--text-dim)：设置文字颜色；padding=40px 0：设置内边距。 */

.head, .row {
/* 对选择器 .head, .row 匹配的元素应用后续声明。 */
  display: grid;
  /* display=grid：决定元素如何布局或显示。 */
  grid-template-columns: 48px 88px 150px 1fr 240px;
  /* grid-template-columns=48px 88px 150px 1fr 240px：定义网格列布局。 */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  gap: 10px;
  /* gap=10px：设置子元素间距。 */
  padding: 8px;
  /* padding=8px：设置内边距。 */
  font-size: 13px;
  /* font-size=13px：设置字号。 */
}
/* 结束样式块或续写样式声明。 */
.head { font-size: 12px; color: var(--text-dim); border-bottom: 1px solid var(--panel-border); }
/* font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色；border-bottom=1px solid var(--panel-border)：设置该样式属性。 */
.row:nth-child(odd) { background: rgba(255, 255, 255, 0.02); }
/* row=nth-child(odd) { background: rgba(255, 255, 255, 0.02)：设置该样式属性。 */

.col-idx, .col-word { color: var(--text-dim); font-variant-numeric: tabular-nums; }
/* color=var(--text-dim)：设置文字颜色；font-variant-numeric=tabular-nums：设置该样式属性。 */
.col-field { font-family: ui-monospace, Consolas, monospace; }
/* font-family=ui-monospace, Consolas, monospace：设置该样式属性。 */
.col-value { display: inline-flex; align-items: center; gap: 8px; }
/* display=inline-flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距。 */
.col-value .text { min-width: 56px; }
/* min-width=56px：设置最小宽度。 */
.raw { color: var(--text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }
/* color=var(--text-dim)：设置文字颜色；font-size=11px：设置字号；font-variant-numeric=tabular-nums：设置该样式属性。 */

.foot { margin: 0; font-size: 12px; color: var(--text-dim); }
/* margin=0：设置外边距；font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
