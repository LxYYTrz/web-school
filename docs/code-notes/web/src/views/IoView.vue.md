# web/src/views/IoView.vue 逐行说明

[打开源码](../../../../../web/src/views/IoView.vue) · 142 行 · 60 行待说明代码

只列出 `<script>` 与 `<style>` 中的源码；`<template>` 按要求排除。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 68 | <code>&lt;script setup lang="ts"&gt;</code> | 开始 Vue 组件的 TypeScript 逻辑区域。 |
| 69 | <code>import { computed, onUnmounted, ref } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 70 | <code>import { useLineData } from '../composables/useLineData';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 71 | <code>import {</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 72 | <code>IO_POINTS, ioPointByField, ioValueText, ioTone,</code> | 续写当前表达式、对象、类型或调用。 |
| 73 | <code>type IoField, type IoPoint,</code> | 声明 `IoField` 的结构。 |
| 74 | <code>} from '../services/ioPoints';</code> | 续写当前表达式、对象、类型或调用。 关键字：`from`＝指定导入来源。 |
| 76 | <code>const { io, edgeOnline, edgeText } = useLineData();</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 79 | <code>const STALE_MS = 5_000;</code> | 声明变量 `STALE_MS` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 80 | <code>const now = ref(Date.now());</code> | 声明变量 `now` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 81 | <code>const timer = setInterval(() =&gt; { now.value = Date.now(); }, 500);</code> | 声明变量 `timer` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 82 | <code>onUnmounted(() =&gt; clearInterval(timer));</code> | 定义或调用 `onUnmounted`，参数由括号给出。 |
| 84 | <code>const stale = computed(() =&gt; !io.value &#124;&#124; now.value - io.value.ts &gt; STALE_MS);</code> | 声明变量 `stale` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 86 | <code>function val(p: IoPoint): number &#124; null &#124; undefined {</code> | 定义函数 `val`。 关键字：`function`＝定义函数；`null`＝空值；`undefined`＝未定义值。 |
| 87 | <code>return (io.value?.io as Record&lt;IoField, number &#124; null&gt; &#124; undefined)?.[p.field];</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`null`＝空值；`undefined`＝未定义值。 |
| 88 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 90 | <code>const sensorCards = computed(() =&gt;</code> | 声明变量 `sensorCards` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 91 | <code>(['sensorIn', 'sensorArrive', 'sensorRetreat'] as IoField[]).map(ioPointByField),</code> | 续写当前表达式、对象、类型或调用。 |
| 92 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 93 | <code>const lightPoint = ioPointByField('lightColor');</code> | 声明变量 `lightPoint` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 95 | <code>const updatedText = computed(() =&gt;</code> | 声明变量 `updatedText` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 96 | <code>io.value ? new Date(io.value.ts).toLocaleTimeString('zh-CN', { hour12: false }) : '—',</code> | 续写当前表达式、对象、类型或调用。 关键字：`new`＝创建对象实例；`false`＝布尔假值。 |
| 97 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 98 | <code>&lt;/script&gt;</code> | 结束 Vue 组件的逻辑区域。 |
| 100 | <code>&lt;style scoped&gt;</code> | 开始 Vue 组件的局部样式区域。 |
| 101 | <code>.io-page { display: flex; flex-direction: column; gap: 14px; }</code> | 为选择器 `.io-page` 设置同一行列出的样式属性。 |
| 103 | <code>.cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }</code> | 为选择器 `.cards` 设置同一行列出的样式属性。 |
| 104 | <code>.card { text-align: center; padding: 18px 10px; }</code> | 为选择器 `.card` 设置同一行列出的样式属性。 |
| 105 | <code>.card-value { font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 7px; }</code> | 为选择器 `.card-value` 设置同一行列出的样式属性。 |
| 106 | <code>.card-value.small { display: inline-flex; }</code> | 为选择器 `.card-value.small` 设置同一行列出的样式属性。 |
| 107 | <code>.card-value.stale { color: #f59e0b; }</code> | 为选择器 `.card-value.stale` 设置同一行列出的样式属性。 |
| 108 | <code>.card-label { font-size: 12px; color: var(--text-dim); margin-top: 6px; }</code> | 为选择器 `.card-label` 设置同一行列出的样式属性。 |
| 111 | <code>.io-dot {</code> | 开始一个选择器或媒体规则的样式块。 |
| 112 | <code>width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0;</code> | 设置样式属性 `width`。 |
| 113 | <code>}</code> | 结束样式块或续写样式声明。 |
| 114 | <code>.io-dot.ok   { background: #22c55e; box-shadow: 0 0 6px #22c55e; }</code> | 为选择器 `.io-dot.ok` 设置同一行列出的样式属性。 |
| 115 | <code>.io-dot.act  { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }</code> | 为选择器 `.io-dot.act` 设置同一行列出的样式属性。 |
| 116 | <code>.io-dot.warn { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }</code> | 为选择器 `.io-dot.warn` 设置同一行列出的样式属性。 |
| 117 | <code>.io-dot.ng   { background: #ef4444; box-shadow: 0 0 6px #ef4444; }</code> | 为选择器 `.io-dot.ng` 设置同一行列出的样式属性。 |
| 118 | <code>.io-dot.off, .io-dot.idle { background: #475569; }</code> | 为选择器 `.io-dot.off, .io-dot.idle` 设置同一行列出的样式属性。 |
| 120 | <code>.table { padding-bottom: 6px; }</code> | 为选择器 `.table` 设置同一行列出的样式属性。 |
| 121 | <code>.hint { font-size: 11px; color: var(--text-dim); }</code> | 为选择器 `.hint` 设置同一行列出的样式属性。 |
| 122 | <code>.empty { text-align: center; color: var(--text-dim); padding: 40px 0; }</code> | 为选择器 `.empty` 设置同一行列出的样式属性。 |
| 124 | <code>.head, .row {</code> | 开始一个选择器或媒体规则的样式块。 |
| 125 | <code>display: grid;</code> | 设置样式属性 `display`。 |
| 126 | <code>grid-template-columns: 48px 88px 150px 1fr 240px;</code> | 设置样式属性 `grid-template-columns`。 |
| 127 | <code>align-items: center;</code> | 设置样式属性 `align-items`。 |
| 128 | <code>gap: 10px;</code> | 设置样式属性 `gap`。 |
| 129 | <code>padding: 8px;</code> | 设置样式属性 `padding`。 |
| 130 | <code>font-size: 13px;</code> | 设置样式属性 `font-size`。 |
| 131 | <code>}</code> | 结束样式块或续写样式声明。 |
| 132 | <code>.head { font-size: 12px; color: var(--text-dim); border-bottom: 1px solid var(--panel-border); }</code> | 为选择器 `.head` 设置同一行列出的样式属性。 |
| 133 | <code>.row:nth-child(odd) { background: rgba(255, 255, 255, 0.02); }</code> | 为选择器 `.row:nth-child(odd)` 设置同一行列出的样式属性。 |
| 135 | <code>.col-idx, .col-word { color: var(--text-dim); font-variant-numeric: tabular-nums; }</code> | 为选择器 `.col-idx, .col-word` 设置同一行列出的样式属性。 |
| 136 | <code>.col-field { font-family: ui-monospace, Consolas, monospace; }</code> | 为选择器 `.col-field` 设置同一行列出的样式属性。 |
| 137 | <code>.col-value { display: inline-flex; align-items: center; gap: 8px; }</code> | 为选择器 `.col-value` 设置同一行列出的样式属性。 |
| 138 | <code>.col-value .text { min-width: 56px; }</code> | 为选择器 `.col-value .text` 设置同一行列出的样式属性。 |
| 139 | <code>.raw { color: var(--text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }</code> | 为选择器 `.raw` 设置同一行列出的样式属性。 |
| 141 | <code>.foot { margin: 0; font-size: 12px; color: var(--text-dim); }</code> | 为选择器 `.foot` 设置同一行列出的样式属性。 |
| 142 | <code>&lt;/style&gt;</code> | 结束 Vue 组件的样式区域。 |
