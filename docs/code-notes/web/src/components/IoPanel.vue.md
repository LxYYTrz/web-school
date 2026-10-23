# web/src/components/IoPanel.vue 逐行说明

[打开源码](../../../../../web/src/components/IoPanel.vue) · 195 行 · 105 行待说明代码

只列出 `<script>` 与 `<style>` 中的源码；`<template>` 按要求排除。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 68 | <code>&lt;script setup lang="ts"&gt;</code> | 开始 Vue 组件的 TypeScript 逻辑区域。 |
| 69 | <code>import { computed } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 70 | <code>import { useLineData } from '../composables/useLineData';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 71 | <code>import { stateText, stateTagType as tagTypeOf, isRunning } from '../services/lineState';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 73 | <code>defineProps&lt;{ canCommand: boolean }&gt;();</code> | 续写当前表达式、对象、类型或调用。 |
| 74 | <code>const { robot, status, edgeText, alarmText, edgeOnline } = useLineData();</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 76 | <code>const statusText = computed(() =&gt;</code> | 声明变量 `statusText` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 77 | <code>status.value ? stateText(status.value.state) : '等待中');</code> | 续写当前表达式、对象、类型或调用。 |
| 79 | <code>const stateTagType = computed(() =&gt; tagTypeOf(status.value?.state));</code> | 声明变量 `stateTagType` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 83 | <code>const alarmOn = computed(() =&gt;</code> | 声明变量 `alarmOn` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 84 | <code>(robot.value?.alarmCode !== undefined &amp;&amp; robot.value.alarmCode !== 0) &#124;&#124;</code> | 续写当前表达式、对象、类型或调用。 关键字：`undefined`＝未定义值。 |
| 85 | <code>status.value?.state === 'alarm' &#124;&#124;</code> | 调用函数、设置值或更新状态。 |
| 86 | <code>status.value?.state === 'init_error',</code> | 调用函数、设置值或更新状态。 |
| 87 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 89 | <code>const runText = computed(() =&gt; status.value ? statusText.value : '—');</code> | 声明变量 `runText` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 90 | <code>const runDot = computed(() =&gt; {</code> | 声明变量 `runDot` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 91 | <code>const s = status.value?.state;</code> | 声明变量 `s` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 92 | <code>if (isRunning(s)) return 'ok';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 93 | <code>if (s === 'alarm' &#124;&#124; s === 'init_error') return 'ng';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 94 | <code>if (s === 'offline') return 'warn';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 95 | <code>return 'idle';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 96 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 98 | <code>const modeDot = computed(() =&gt; {</code> | 声明变量 `modeDot` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 99 | <code>const m = robot.value?.mode;</code> | 声明变量 `m` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 100 | <code>if (m === 'auto') return 'ok';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 101 | <code>if (m === 'manual') return 'warn';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 102 | <code>if (m === 'error') return 'ng';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 103 | <code>return 'idle';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 104 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 106 | <code>const alarmDot = computed(() =&gt; alarmOn.value ? 'ng' : 'ok');</code> | 声明变量 `alarmDot` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 107 | <code>const alarmCodeText = computed(() =&gt;</code> | 声明变量 `alarmCodeText` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 108 | <code>robot.value?.alarmCode ? `#${robot.value.alarmCode}` : '无',</code> | 续写当前表达式、对象、类型或调用。 |
| 109 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 111 | <code>const edgeDot = computed(() =&gt; {</code> | 声明变量 `edgeDot` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 112 | <code>if (edgeOnline.value === null) return 'idle';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`null`＝空值；`return`＝返回结果并结束当前函数。 |
| 113 | <code>return edgeOnline.value ? 'ok' : 'ng';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 114 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 117 | <code>const joints = computed&lt;(number &#124; null)[]&gt;(() =&gt; {</code> | 声明变量 `joints` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 118 | <code>const j = robot.value?.joints;</code> | 声明变量 `j` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 119 | <code>return Array.isArray(j) ? j.slice(0, 6) : [];</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 120 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 121 | <code>&lt;/script&gt;</code> | 结束 Vue 组件的逻辑区域。 |
| 123 | <code>&lt;style scoped&gt;</code> | 开始 Vue 组件的局部样式区域。 |
| 124 | <code>.panel.overlay.right {</code> | 开始一个选择器或媒体规则的样式块。 |
| 125 | <code>position: absolute;</code> | 设置样式属性 `position`。 |
| 126 | <code>top: 14px;</code> | 设置样式属性 `top`。 |
| 127 | <code>right: 14px;</code> | 设置样式属性 `right`。 |
| 128 | <code>width: 260px;</code> | 设置样式属性 `width`。 |
| 129 | <code>z-index: 5;</code> | 设置样式属性 `z-index`。 |
| 130 | <code>}</code> | 结束样式块或续写样式声明。 |
| 131 | <code>.panel-title {</code> | 开始一个选择器或媒体规则的样式块。 |
| 132 | <code>display: flex; align-items: center; justify-content: space-between;</code> | 设置样式属性 `display`。 |
| 133 | <code>font-size: 13px; color: var(--text); margin-bottom: 8px;</code> | 设置样式属性 `font-size`。 |
| 134 | <code>}</code> | 结束样式块或续写样式声明。 |
| 137 | <code>.alarm-row {</code> | 开始一个选择器或媒体规则的样式块。 |
| 138 | <code>display: flex; align-items: center; gap: 8px;</code> | 设置样式属性 `display`。 |
| 139 | <code>padding: 6px 8px; margin-bottom: 8px;</code> | 设置样式属性 `padding`。 |
| 140 | <code>background: rgba(220, 38, 38, 0.12);</code> | 设置样式属性 `background`。 |
| 141 | <code>border: 1px solid rgba(220, 38, 38, 0.4);</code> | 设置样式属性 `border`。 |
| 142 | <code>border-radius: 6px;</code> | 设置样式属性 `border-radius`。 |
| 143 | <code>}</code> | 结束样式块或续写样式声明。 |
| 144 | <code>.alarm-light {</code> | 开始一个选择器或媒体规则的样式块。 |
| 145 | <code>width: 10px; height: 10px; border-radius: 50%;</code> | 设置样式属性 `width`。 |
| 146 | <code>background: #ef4444; box-shadow: 0 0 8px #ef4444;</code> | 设置样式属性 `background`。 |
| 147 | <code>}</code> | 结束样式块或续写样式声明。 |
| 148 | <code>.alarm-light.pulse { animation: pulse 1s infinite; }</code> | 为选择器 `.alarm-light.pulse` 设置同一行列出的样式属性。 |
| 149 | <code>.alarm-text { font-size: 12px; color: #fca5a5; }</code> | 为选择器 `.alarm-text` 设置同一行列出的样式属性。 |
| 150 | <code>@keyframes pulse {</code> | 开始一个选择器或媒体规则的样式块。 |
| 151 | <code>0%, 100% { opacity: 1; }</code> | 为选择器 `0%, 100%` 设置同一行列出的样式属性。 |
| 152 | <code>50% { opacity: 0.35; }</code> | 为选择器 `50%` 设置同一行列出的样式属性。 |
| 153 | <code>}</code> | 结束样式块或续写样式声明。 |
| 156 | <code>.io-grid {</code> | 开始一个选择器或媒体规则的样式块。 |
| 157 | <code>display: grid; grid-template-columns: 1fr 1fr; gap: 6px;</code> | 设置样式属性 `display`。 |
| 158 | <code>padding: 6px 0; margin-bottom: 6px;</code> | 设置样式属性 `padding`。 |
| 159 | <code>}</code> | 结束样式块或续写样式声明。 |
| 160 | <code>.io-cell {</code> | 开始一个选择器或媒体规则的样式块。 |
| 161 | <code>display: flex; align-items: center; gap: 6px;</code> | 设置样式属性 `display`。 |
| 162 | <code>font-size: 11px;</code> | 设置样式属性 `font-size`。 |
| 163 | <code>padding: 4px 6px;</code> | 设置样式属性 `padding`。 |
| 164 | <code>background: rgba(255,255,255,0.02);</code> | 设置样式属性 `background`。 |
| 165 | <code>border-radius: 4px;</code> | 设置样式属性 `border-radius`。 |
| 166 | <code>}</code> | 结束样式块或续写样式声明。 |
| 167 | <code>.io-dot {</code> | 开始一个选择器或媒体规则的样式块。 |
| 168 | <code>width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;</code> | 设置样式属性 `width`。 |
| 169 | <code>}</code> | 结束样式块或续写样式声明。 |
| 170 | <code>.io-dot.ok   { background: #22c55e; box-shadow: 0 0 4px #22c55e; }</code> | 为选择器 `.io-dot.ok` 设置同一行列出的样式属性。 |
| 171 | <code>.io-dot.ng   { background: #ef4444; box-shadow: 0 0 4px #ef4444; }</code> | 为选择器 `.io-dot.ng` 设置同一行列出的样式属性。 |
| 172 | <code>.io-dot.warn { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; }</code> | 为选择器 `.io-dot.warn` 设置同一行列出的样式属性。 |
| 173 | <code>.io-dot.idle { background: #475569; }</code> | 为选择器 `.io-dot.idle` 设置同一行列出的样式属性。 |
| 174 | <code>.io-label { color: var(--text-dim); width: 28px; }</code> | 为选择器 `.io-label` 设置同一行列出的样式属性。 |
| 175 | <code>.io-val { color: var(--text); font-weight: 500; }</code> | 为选择器 `.io-val` 设置同一行列出的样式属性。 |
| 178 | <code>.joints { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; text-align: center; padding: 6px 0; }</code> | 为选择器 `.joints` 设置同一行列出的样式属性。 |
| 179 | <code>.joints .val { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--accent); }</code> | 为选择器 `.joints .val` 设置同一行列出的样式属性。 |
| 180 | <code>.joints .lbl { font-size: 9px; color: var(--text-dim); margin-top: 1px; }</code> | 为选择器 `.joints .lbl` 设置同一行列出的样式属性。 |
| 184 | <code>.meta {</code> | 开始一个选择器或媒体规则的样式块。 |
| 185 | <code>margin-top: 8px; padding-top: 6px;</code> | 设置样式属性 `margin-top`。 |
| 186 | <code>border-top: 1px dashed var(--panel-border);</code> | 设置样式属性 `border-top`。 |
| 187 | <code>display: flex; justify-content: space-between;</code> | 设置样式属性 `display`。 |
| 188 | <code>font-size: 11px; color: var(--text-dim);</code> | 设置样式属性 `font-size`。 |
| 189 | <code>}</code> | 结束样式块或续写样式声明。 |
| 191 | <code>.ctrl-slot {</code> | 开始一个选择器或媒体规则的样式块。 |
| 192 | <code>margin-top: 10px; padding-top: 10px;</code> | 设置样式属性 `margin-top`。 |
| 193 | <code>border-top: 1px dashed var(--panel-border);</code> | 设置样式属性 `border-top`。 |
| 194 | <code>}</code> | 结束样式块或续写样式声明。 |
| 195 | <code>&lt;/style&gt;</code> | 结束 Vue 组件的样式区域。 |
