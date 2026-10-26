# web/src/views/IoView.vue 逐行注释

[打开源码](../../../../../web/src/views/IoView.vue) · 142 行 · 122 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
<template>
<!-- 注释：开始 Vue 模板，定义组件渲染的内容。 -->
```

**源码第 2 行**

```text
  <div class="io-page">
<!-- 注释：渲染容器，应用 io-page 样式类。 -->
```

**源码第 4 行**

```text
    <div class="cards">
<!-- 注释：渲染容器，应用 cards 样式类。 -->
```

**源码第 5 行**

```text
      <div v-for="p in sensorCards" :key="p.field" class="panel card">
<!-- 注释：渲染容器，应用 panel card 样式类，按集合重复生成（p in sensorCards）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
```

**源码第 6 行**

```text
        <div class="card-value small">
<!-- 注释：渲染容器，应用 card-value small 样式类。 -->
```

**源码第 7 行**

```text
          <i class="io-dot" :class="ioTone(p, val(p))" /> {{ ioValueText(p, val(p)) }}
<!-- 注释：渲染图标或状态点，应用 io-dot 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 关键字：{{＝插入表达式计算后的文本；:＝属性动态绑定的简写。 -->
```

**源码第 8 行**

```text
        </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 9 行**

```text
        <div class="card-label">{{ p.label }}</div>
<!-- 注释：渲染容器，应用 card-label 样式类，其中显示 p.label 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 10 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 11 行**

```text
      <div class="panel card">
<!-- 注释：渲染容器，应用 panel card 样式类。 -->
```

**源码第 12 行**

```text
        <div class="card-value small">
<!-- 注释：渲染容器，应用 card-value small 样式类。 -->
```

**源码第 13 行**

```text
          <i class="io-dot" :class="ioTone(lightPoint, val(lightPoint))" />
<!-- 注释：渲染图标或状态点，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 14 行**

```text
          {{ ioValueText(lightPoint, val(lightPoint)) }}
<!-- 注释：显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 15 行**

```text
        </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 16 行**

```text
        <div class="card-label">{{ lightPoint.label }}</div>
<!-- 注释：渲染容器，应用 card-label 样式类，其中显示 lightPoint.label 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 17 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 18 行**

```text
      <div class="panel card">
<!-- 注释：渲染容器，应用 panel card 样式类。 -->
```

**源码第 19 行**

```text
        <div class="card-value small" :class="stale ? 'stale' : ''">
<!-- 注释：渲染容器，应用 card-value small 样式类。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 20 行**

```text
          <i class="io-dot" :class="stale ? 'warn' : 'ok'" />
<!-- 注释：渲染图标或状态点，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 21 行**

```text
          {{ stale ? '数据停滞' : '刷新中' }}
<!-- 注释：显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 22 行**

```text
        </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 23 行**

```text
        <div class="card-label">更新 {{ updatedText }}</div>
<!-- 注释：渲染容器，应用 card-label 样式类，其中显示 updatedText 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 24 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 25 行**

```text
      <div class="panel card">
<!-- 注释：渲染容器，应用 panel card 样式类。 -->
```

**源码第 26 行**

```text
        <div class="card-value small">
<!-- 注释：渲染容器，应用 card-value small 样式类。 -->
```

**源码第 27 行**

```text
          <i class="io-dot" :class="edgeOnline ? 'ok' : 'ng'" /> {{ edgeText }}
<!-- 注释：渲染图标或状态点，应用 io-dot 样式类，其中显示 edgeText 的计算结果。 关键字：{{＝插入表达式计算后的文本；:＝属性动态绑定的简写。 -->
```

**源码第 28 行**

```text
        </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 29 行**

```text
        <div class="card-label">边缘网关</div>
<!-- 注释：渲染容器，应用 card-label 样式类。 -->
```

**源码第 30 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 31 行**

```text
    </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 34 行**

```text
    <div class="panel table">
<!-- 注释：渲染容器，应用 panel table 样式类。 -->
```

**源码第 35 行**

```text
      <div class="panel-title">
<!-- 注释：渲染容器，应用 panel-title 样式类。 -->
```

**源码第 36 行**

```text
        <span>IO 点位明细(只读)</span>
<!-- 注释：渲染行内文字。 -->
```

**源码第 37 行**

```text
        <span class="hint">DB3 · word 11~16 · {{ IO_POINTS.length }} 点</span>
<!-- 注释：渲染行内文字，应用 hint 样式类，其中显示 IO_POINTS.length 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 38 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 39 行**

```text
      <div class="head">
<!-- 注释：渲染容器，应用 head 样式类。 -->
```

**源码第 40 行**

```text
        <span class="col-idx">#</span>
<!-- 注释：渲染行内文字，应用 col-idx 样式类。 -->
```

**源码第 41 行**

```text
        <span class="col-word">字地址</span>
<!-- 注释：渲染行内文字，应用 col-word 样式类。 -->
```

**源码第 42 行**

```text
        <span class="col-field">字段</span>
<!-- 注释：渲染行内文字，应用 col-field 样式类。 -->
```

**源码第 43 行**

```text
        <span class="col-label">信号含义</span>
<!-- 注释：渲染行内文字，应用 col-label 样式类。 -->
```

**源码第 44 行**

```text
        <span class="col-value">当前值</span>
<!-- 注释：渲染行内文字，应用 col-value 样式类。 -->
```

**源码第 45 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 46 行**

```text
      <div v-if="!io" class="empty">
<!-- 注释：渲染容器，应用 empty 样式类，条件成立时显示（!io）。 关键字：v-if＝条件为真时才渲染。 -->
```

**源码第 47 行**

```text
        {{ stale ? '未收到 IO 数据 —— 请检查边缘采集器与 MQTT 链路' : '等待 IO 数据…' }}
<!-- 注释：显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 48 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 49 行**

```text
      <div v-for="p in IO_POINTS" :key="p.field" class="row">
<!-- 注释：渲染容器，应用 row 样式类，按集合重复生成（p in IO_POINTS）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
```

**源码第 50 行**

```text
        <span class="col-idx">{{ p.index }}</span>
<!-- 注释：渲染行内文字，应用 col-idx 样式类，其中显示 p.index 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 51 行**

```text
        <span class="col-word">{{ p.word }}</span>
<!-- 注释：渲染行内文字，应用 col-word 样式类，其中显示 p.word 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 52 行**

```text
        <span class="col-field">{{ p.field }}</span>
<!-- 注释：渲染行内文字，应用 col-field 样式类，其中显示 p.field 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 53 行**

```text
        <span class="col-label">{{ p.label }}</span>
<!-- 注释：渲染行内文字，应用 col-label 样式类，其中显示 p.label 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 54 行**

```text
        <span class="col-value">
<!-- 注释：渲染行内文字，应用 col-value 样式类。 -->
```

**源码第 55 行**

```text
          <i class="io-dot" :class="ioTone(p, val(p))" />
<!-- 注释：渲染图标或状态点，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 56 行**

```text
          <span class="text">{{ ioValueText(p, val(p)) }}</span>
<!-- 注释：渲染行内文字，应用 text 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 57 行**

```text
          <span class="raw">{{ val(p) ?? '—' }}</span>
<!-- 注释：渲染行内文字，应用 raw 样式类，其中显示 val(p) ?? '—' 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 58 行**

```text
        </span>
<!-- 注释：结束 span 元素及其中的内容。 -->
```

**源码第 59 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 60 行**

```text
    </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 62 行**

```text
    <p class="foot">
<!-- 注释：渲染段落，应用 foot 样式类。 -->
```

**源码第 63 行**

```text
      本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。
<!-- 注释：显示该行文本内容或结束当前元素。 -->
```

**源码第 64 行**

```text
    </p>
<!-- 注释：结束 p 元素及其中的内容。 -->
```

**源码第 65 行**

```text
  </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 66 行**

```text
</template>
<!-- 注释：结束当前模板或插槽内容。 -->
```

**源码第 68 行**

```text
<script setup lang="ts">
// 注释：开始 Vue 组件的 TypeScript 逻辑区域。
```

**源码第 69 行**

```text
import { computed, onUnmounted, ref } from 'vue';
// 注释：从 vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 70 行**

```text
import { useLineData } from '../composables/useLineData';
// 注释：从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 71 行**

```text
import {
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 72 行**

```text
  IO_POINTS, ioPointByField, ioValueText, ioTone,
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 73 行**

```text
  type IoField, type IoPoint,
// 注释：声明 `IoField` 的结构。 关键字：type＝定义类型别名。
```

**源码第 74 行**

```text
} from '../services/ioPoints';
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`from`＝指定导入来源。
```

**源码第 76 行**

```text
const { io, edgeOnline, edgeText } = useLineData();
// 注释：从右侧结果中取出 io, edgeOnline, edgeText，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 79 行**

```text
const STALE_MS = 5_000;
// 注释：声明 STALE_MS，初始值由 5_000 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 80 行**

```text
const now = ref(Date.now());
// 注释：声明 now，初始值由 ref(Date.now()) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 81 行**

```text
const timer = setInterval(() => { now.value = Date.now(); }, 500);
// 注释：声明 timer，初始值由 setInterval(() => { now.value = Date.now(); }, 500) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 82 行**

```text
onUnmounted(() => clearInterval(timer));
// 注释：调用 onUnmounted；括号中的表达式是传入的参数。
```

**源码第 84 行**

```text
const stale = computed(() => !io.value || now.value - io.value.ts > STALE_MS);
// 注释：声明 stale，初始值由 computed(() => !io.value || now.value - io.value.ts > STALE_MS) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 86 行**

```text
function val(p: IoPoint): number | null | undefined {
// 注释：定义函数 `val`。 关键字：`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。
```

**源码第 87 行**

```text
  return (io.value?.io as Record<IoField, number | null> | undefined)?.[p.field];
// 注释：返回 (io.value?.io as Record<IoField, number | null> | undefined)?.[p.field] 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值；`undefined`＝未定义值。
```

**源码第 88 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 90 行**

```text
const sensorCards = computed(() =>
// 注释：声明 sensorCards，初始值由 computed(() => 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 91 行**

```text
  (['sensorIn', 'sensorArrive', 'sensorRetreat'] as IoField[]).map(ioPointByField),
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 92 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 93 行**

```text
const lightPoint = ioPointByField('lightColor');
// 注释：声明 lightPoint，初始值由 ioPointByField('lightColor') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 95 行**

```text
const updatedText = computed(() =>
// 注释：声明 updatedText，初始值由 computed(() => 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 96 行**

```text
  io.value ? new Date(io.value.ts).toLocaleTimeString('zh-CN', { hour12: false }) : '—',
// 注释：调用 Date；括号中的表达式是传入的参数。 关键字：`new`＝创建对象实例；`false`＝布尔假值。
```

**源码第 97 行**

```text
);
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 98 行**

```text
</script>
// 注释：结束 Vue 组件的逻辑区域。
```

**源码第 100 行**

```text
<style scoped>
/* 注释：开始 Vue 组件的局部样式区域。 */
```

**源码第 101 行**

```text
.io-page { display: flex; flex-direction: column; gap: 14px; }
/* 注释：display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=14px：设置子元素间距。 */
```

**源码第 103 行**

```text
.cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
/* 注释：display=grid：决定元素如何布局或显示；grid-template-columns=repeat(6, 1fr)：定义网格列布局；gap=12px：设置子元素间距。 */
```

**源码第 104 行**

```text
.card { text-align: center; padding: 18px 10px; }
/* 注释：text-align=center：设置该样式属性；padding=18px 10px：设置内边距。 */
```

**源码第 105 行**

```text
.card-value { font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 7px; }
/* 注释：font-size=15px：设置字号；font-weight=600：设置字重；display=inline-flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=7px：设置子元素间距。 */
```

**源码第 106 行**

```text
.card-value.small { display: inline-flex; }
/* 注释：display=inline-flex：决定元素如何布局或显示。 */
```

**源码第 107 行**

```text
.card-value.stale { color: #f59e0b; }
/* 注释：color=#f59e0b：设置文字颜色。 */
```

**源码第 108 行**

```text
.card-label { font-size: 12px; color: var(--text-dim); margin-top: 6px; }
/* 注释：font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色；margin-top=6px：设置该样式属性。 */
```

**源码第 111 行**

```text
.io-dot {
/* 注释：对选择器 .io-dot 匹配的元素应用后续声明。 */
```

**源码第 112 行**

```text
  width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0;
/* 注释：width=9px：设置宽度；height=9px：设置高度；border-radius=50%：设置圆角；display=inline-block：决定元素如何布局或显示；flex-shrink=0：设置该样式属性。 */
```

**源码第 113 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 114 行**

```text
.io-dot.ok   { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
/* 注释：background=#22c55e：设置背景；box-shadow=0 0 6px #22c55e：设置阴影。 */
```

**源码第 115 行**

```text
.io-dot.act  { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }
/* 注释：background=#2ecc71：设置背景；box-shadow=0 0 6px #2ecc71：设置阴影。 */
```

**源码第 116 行**

```text
.io-dot.warn { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
/* 注释：background=#f59e0b：设置背景；box-shadow=0 0 6px #f59e0b：设置阴影。 */
```

**源码第 117 行**

```text
.io-dot.ng   { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
/* 注释：background=#ef4444：设置背景；box-shadow=0 0 6px #ef4444：设置阴影。 */
```

**源码第 118 行**

```text
.io-dot.off, .io-dot.idle { background: #475569; }
/* 注释：background=#475569：设置背景。 */
```

**源码第 120 行**

```text
.table { padding-bottom: 6px; }
/* 注释：padding-bottom=6px：设置该样式属性。 */
```

**源码第 121 行**

```text
.hint { font-size: 11px; color: var(--text-dim); }
/* 注释：font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
```

**源码第 122 行**

```text
.empty { text-align: center; color: var(--text-dim); padding: 40px 0; }
/* 注释：text-align=center：设置该样式属性；color=var(--text-dim)：设置文字颜色；padding=40px 0：设置内边距。 */
```

**源码第 124 行**

```text
.head, .row {
/* 注释：对选择器 .head, .row 匹配的元素应用后续声明。 */
```

**源码第 125 行**

```text
  display: grid;
/* 注释：display=grid：决定元素如何布局或显示。 */
```

**源码第 126 行**

```text
  grid-template-columns: 48px 88px 150px 1fr 240px;
/* 注释：grid-template-columns=48px 88px 150px 1fr 240px：定义网格列布局。 */
```

**源码第 127 行**

```text
  align-items: center;
/* 注释：align-items=center：控制交叉轴上的对齐方式。 */
```

**源码第 128 行**

```text
  gap: 10px;
/* 注释：gap=10px：设置子元素间距。 */
```

**源码第 129 行**

```text
  padding: 8px;
/* 注释：padding=8px：设置内边距。 */
```

**源码第 130 行**

```text
  font-size: 13px;
/* 注释：font-size=13px：设置字号。 */
```

**源码第 131 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 132 行**

```text
.head { font-size: 12px; color: var(--text-dim); border-bottom: 1px solid var(--panel-border); }
/* 注释：font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色；border-bottom=1px solid var(--panel-border)：设置该样式属性。 */
```

**源码第 133 行**

```text
.row:nth-child(odd) { background: rgba(255, 255, 255, 0.02); }
/* 注释：row=nth-child(odd) { background: rgba(255, 255, 255, 0.02)：设置该样式属性。 */
```

**源码第 135 行**

```text
.col-idx, .col-word { color: var(--text-dim); font-variant-numeric: tabular-nums; }
/* 注释：color=var(--text-dim)：设置文字颜色；font-variant-numeric=tabular-nums：设置该样式属性。 */
```

**源码第 136 行**

```text
.col-field { font-family: ui-monospace, Consolas, monospace; }
/* 注释：font-family=ui-monospace, Consolas, monospace：设置该样式属性。 */
```

**源码第 137 行**

```text
.col-value { display: inline-flex; align-items: center; gap: 8px; }
/* 注释：display=inline-flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距。 */
```

**源码第 138 行**

```text
.col-value .text { min-width: 56px; }
/* 注释：min-width=56px：设置最小宽度。 */
```

**源码第 139 行**

```text
.raw { color: var(--text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }
/* 注释：color=var(--text-dim)：设置文字颜色；font-size=11px：设置字号；font-variant-numeric=tabular-nums：设置该样式属性。 */
```

**源码第 141 行**

```text
.foot { margin: 0; font-size: 12px; color: var(--text-dim); }
/* 注释：margin=0：设置外边距；font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
```

**源码第 142 行**

```text
</style>
/* 注释：结束 Vue 组件的样式区域。 */
```
