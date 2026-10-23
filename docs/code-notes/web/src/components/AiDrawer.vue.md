# web/src/components/AiDrawer.vue 逐行说明

[打开源码](../../../../../web/src/components/AiDrawer.vue) · 297 行 · 172 行待说明代码

只列出 `<script>` 与 `<style>` 中的源码；`<template>` 按要求排除。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 103 | <code>&lt;script setup lang="ts"&gt;</code> | 开始 Vue 组件的 TypeScript 逻辑区域。 |
| 104 | <code>import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 105 | <code>import { Search } from '@element-plus/icons-vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 106 | <code>import { ElMessage } from 'element-plus';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 107 | <code>import { useAuthStore } from '../stores/auth';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 108 | <code>import { useLineData } from '../composables/useLineData';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 109 | <code>import { stateText, stateTagType as tagOf } from '../services/lineState';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 110 | <code>import { apiAiChat, apiAiStatus, apiConfirmAiProposal, onAiProposal } from '../services/ai';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 111 | <code>import type { AiMessage, AiProposal } from '../services/types';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 113 | <code>const props = defineProps&lt;{ modelValue: boolean }&gt;();</code> | 声明变量 `props` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 114 | <code>const emit = defineEmits&lt;{ 'update:modelValue': [boolean] }&gt;();</code> | 声明变量 `emit` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 115 | <code>const visible = ref(props.modelValue);</code> | 声明变量 `visible` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 116 | <code>watch(</code> | 调用函数、设置值或更新状态。 |
| 117 | <code>() =&gt; props.modelValue,</code> | 续写当前表达式、对象、类型或调用。 |
| 118 | <code>(v) =&gt; (visible.value = v),</code> | 续写当前表达式、对象、类型或调用。 |
| 119 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 120 | <code>watch(visible, (v) =&gt; emit('update:modelValue', v));</code> | 定义或调用 `watch`，参数由括号给出。 |
| 122 | <code>const LINE_ID = 'line-01';</code> | 声明变量 `LINE_ID` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 123 | <code>const auth = useAuthStore();</code> | 声明变量 `auth` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 124 | <code>const { status } = useLineData(LINE_ID);</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 126 | <code>const enabled = ref(false);</code> | 声明变量 `enabled` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。 |
| 127 | <code>const draft = ref('');</code> | 声明变量 `draft` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 128 | <code>const streaming = ref(false);</code> | 声明变量 `streaming` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。 |
| 129 | <code>const messages = ref&lt;AiMessage[]&gt;([]);</code> | 声明变量 `messages` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 130 | <code>const scrollBox = ref&lt;HTMLElement &#124; null&gt;(null);</code> | 声明变量 `scrollBox` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`null`＝空值。 |
| 131 | <code>const busy = ref(false);</code> | 声明变量 `busy` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。 |
| 134 | <code>interface ProposalCard extends AiProposal {</code> | 声明 `ProposalCard` 的结构。 关键字：`interface`＝定义类型接口；`extends`＝继承父类。 |
| 135 | <code>result?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 136 | <code>resultOk?: boolean;</code> | 续写当前表达式、对象、类型或调用。 |
| 137 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 138 | <code>const proposals = ref&lt;ProposalCard[]&gt;([]);</code> | 声明变量 `proposals` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 140 | <code>const statusText = ref('—');</code> | 声明变量 `statusText` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 141 | <code>const stateTagType = ref&lt;'success' &#124; 'info' &#124; 'danger' &#124; 'warning'&gt;('info');</code> | 声明变量 `stateTagType` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 142 | <code>watch(</code> | 调用函数、设置值或更新状态。 |
| 143 | <code>status,</code> | 续写当前表达式、对象、类型或调用。 |
| 144 | <code>(s) =&gt; {</code> | 续写当前表达式、对象、类型或调用。 |
| 145 | <code>statusText.value = stateText(s?.state);</code> | 调用函数、设置值或更新状态。 |
| 146 | <code>stateTagType.value = tagOf(s?.state);</code> | 调用函数、设置值或更新状态。 |
| 147 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 148 | <code>{ immediate: true },</code> | 续写当前表达式、对象、类型或调用。 关键字：`true`＝布尔真值。 |
| 149 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 151 | <code>const TYPE_TEXT: Record&lt;string, string&gt; = {</code> | 声明变量 `TYPE_TEXT` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 152 | <code>start: '启动产线',</code> | 设置字段 `start`。 |
| 153 | <code>stop: '停止产线',</code> | 设置字段 `stop`。 |
| 154 | <code>mode_set: '切换手动模式',</code> | 设置字段 `mode_set`。 |
| 155 | <code>conveyor: '传送带控制',</code> | 设置字段 `conveyor`。 |
| 156 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 157 | <code>function typeText(t: string) {</code> | 定义函数 `typeText`。 关键字：`function`＝定义函数。 |
| 158 | <code>return TYPE_TEXT[t] ?? t;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 159 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 161 | <code>let offProposal: (() =&gt; void) &#124; null = null;</code> | 声明变量 `offProposal` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。 |
| 162 | <code>let abort: AbortController &#124; null = null;</code> | 声明变量 `abort` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。 |
| 164 | <code>onMounted(async () =&gt; {</code> | 定义或调用 `onMounted`，参数由括号给出。 关键字：`async`＝声明异步函数。 |
| 165 | <code>offProposal = onAiProposal((p) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 167 | <code>if (proposals.value.some((x) =&gt; x.id === p.id)) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 168 | <code>proposals.value.unshift(p);</code> | 调用函数、设置值或更新状态。 |
| 169 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 170 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 171 | <code>const s = await apiAiStatus();</code> | 声明变量 `s` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 172 | <code>enabled.value = s.enabled;</code> | 调用函数、设置值或更新状态。 |
| 173 | <code>} catch {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 174 | <code>enabled.value = false;</code> | 调用函数、设置值或更新状态。 关键字：`false`＝布尔假值。 |
| 175 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 176 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 178 | <code>onBeforeUnmount(() =&gt; {</code> | 定义或调用 `onBeforeUnmount`，参数由括号给出。 |
| 179 | <code>offProposal?.();</code> | 调用函数、设置值或更新状态。 |
| 180 | <code>abort?.abort();</code> | 调用函数、设置值或更新状态。 |
| 181 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 183 | <code>function scrollDown() {</code> | 定义函数 `scrollDown`。 关键字：`function`＝定义函数。 |
| 184 | <code>nextTick(() =&gt; {</code> | 定义或调用 `nextTick`，参数由括号给出。 |
| 185 | <code>if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 186 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 187 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 189 | <code>async function send() {</code> | 定义函数 `send`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 190 | <code>const text = draft.value.trim();</code> | 声明变量 `text` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 191 | <code>if (!text &#124;&#124; streaming.value) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 192 | <code>draft.value = '';</code> | 调用函数、设置值或更新状态。 |
| 193 | <code>messages.value.push({ role: 'user', text });</code> | 调用函数、设置值或更新状态。 |
| 194 | <code>const reply: AiMessage = { role: 'assistant', text: '', tools: [] };</code> | 声明变量 `reply` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 195 | <code>messages.value.push(reply);</code> | 调用函数、设置值或更新状态。 |
| 196 | <code>streaming.value = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 197 | <code>abort = new AbortController();</code> | 调用函数、设置值或更新状态。 关键字：`new`＝创建对象实例。 |
| 198 | <code>scrollDown();</code> | 定义或调用 `scrollDown`，参数由括号给出。 |
| 200 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 201 | <code>await apiAiChat(LINE_ID, text, (e) =&gt; {</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 202 | <code>if (e.type === 'delta' &amp;&amp; e.text) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 203 | <code>reply.text += e.text;</code> | 调用函数、设置值或更新状态。 |
| 204 | <code>scrollDown();</code> | 定义或调用 `scrollDown`，参数由括号给出。 |
| 205 | <code>} else if (e.type === 'tool' &amp;&amp; e.name) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 206 | <code>if (!reply.tools?.includes(e.name)) reply.tools?.push(e.name);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 207 | <code>} else if (e.type === 'error') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 208 | <code>reply.error = e.message &#124;&#124; 'AI 调用失败';</code> | 调用函数、设置值或更新状态。 |
| 209 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 210 | <code>}, abort.signal);</code> | 续写当前表达式、对象、类型或调用。 |
| 211 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 213 | <code>if (!/abort/i.test((e as Error).message)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 214 | <code>reply.error = (e as Error).message;</code> | 调用函数、设置值或更新状态。 |
| 215 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 216 | <code>} finally {</code> | 续写当前表达式、对象、类型或调用。 关键字：`finally`＝执行收尾逻辑。 |
| 217 | <code>streaming.value = false;</code> | 调用函数、设置值或更新状态。 关键字：`false`＝布尔假值。 |
| 218 | <code>abort = null;</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 219 | <code>if (!reply.text &amp;&amp; !reply.error) reply.text = '(没有返回内容)';</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 220 | <code>scrollDown();</code> | 定义或调用 `scrollDown`，参数由括号给出。 |
| 221 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 222 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 224 | <code>async function confirm(p: ProposalCard) {</code> | 定义函数 `confirm`。 关键字：`async`＝声明异步函数；`function`＝定义函数。 |
| 225 | <code>busy.value = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 226 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 227 | <code>const r = await apiConfirmAiProposal(p.id);</code> | 声明变量 `r` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 228 | <code>p.result = r.ok ? `已下发,指令号 ${r.cmdId}` : r.error &#124;&#124; '下发失败';</code> | 调用函数、设置值或更新状态。 |
| 229 | <code>p.resultOk = r.ok;</code> | 调用函数、设置值或更新状态。 |
| 230 | <code>if (r.ok) ElMessage.success('指令已下发');</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 231 | <code>else ElMessage.error(p.result);</code> | 控制分支、循环或异常处理流程。 关键字：`else`＝进入另一条件分支。 |
| 232 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 233 | <code>p.result = (e as Error).message;</code> | 调用函数、设置值或更新状态。 |
| 234 | <code>p.resultOk = false;</code> | 调用函数、设置值或更新状态。 关键字：`false`＝布尔假值。 |
| 235 | <code>ElMessage.error(p.result);</code> | 调用函数、设置值或更新状态。 |
| 236 | <code>} finally {</code> | 续写当前表达式、对象、类型或调用。 关键字：`finally`＝执行收尾逻辑。 |
| 237 | <code>busy.value = false;</code> | 调用函数、设置值或更新状态。 关键字：`false`＝布尔假值。 |
| 238 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 239 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 243 | <code>function dismiss(p: ProposalCard) {</code> | 定义函数 `dismiss`。 关键字：`function`＝定义函数。 |
| 244 | <code>proposals.value = proposals.value.filter((x) =&gt; x.id !== p.id);</code> | 调用函数、设置值或更新状态。 |
| 245 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 246 | <code>&lt;/script&gt;</code> | 结束 Vue 组件的逻辑区域。 |
| 248 | <code>&lt;style scoped&gt;</code> | 开始 Vue 组件的局部样式区域。 |
| 249 | <code>.drawer-head {</code> | 开始一个选择器或媒体规则的样式块。 |
| 250 | <code>display: flex; align-items: center; justify-content: space-between;</code> | 设置样式属性 `display`。 |
| 251 | <code>width: 100%; padding-right: 32px;</code> | 设置样式属性 `width`。 |
| 252 | <code>}</code> | 结束样式块或续写样式声明。 |
| 253 | <code>.head-tags { display: flex; gap: 6px; }</code> | 为选择器 `.head-tags` 设置同一行列出的样式属性。 |
| 255 | <code>.proposals {</code> | 开始一个选择器或媒体规则的样式块。 |
| 256 | <code>margin-bottom: 10px; padding-bottom: 10px;</code> | 设置样式属性 `margin-bottom`。 |
| 257 | <code>border-bottom: 1px dashed var(--panel-border);</code> | 设置样式属性 `border-bottom`。 |
| 258 | <code>}</code> | 结束样式块或续写样式声明。 |
| 259 | <code>.section-title { font-size: 11px; color: var(--text-dim); margin-bottom: 6px; }</code> | 为选择器 `.section-title` 设置同一行列出的样式属性。 |
| 260 | <code>.proposal {</code> | 开始一个选择器或媒体规则的样式块。 |
| 261 | <code>padding: 8px 10px; margin-bottom: 6px;</code> | 设置样式属性 `padding`。 |
| 262 | <code>background: rgba(245, 158, 11, 0.10);</code> | 设置样式属性 `background`。 |
| 263 | <code>border: 1px solid rgba(245, 158, 11, 0.35);</code> | 设置样式属性 `border`。 |
| 264 | <code>border-radius: 6px;</code> | 设置样式属性 `border-radius`。 |
| 265 | <code>}</code> | 结束样式块或续写样式声明。 |
| 266 | <code>.p-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }</code> | 为选择器 `.p-head` 设置同一行列出的样式属性。 |
| 267 | <code>.p-target { font-size: 11px; color: var(--text-dim); font-variant-numeric: tabular-nums; }</code> | 为选择器 `.p-target` 设置同一行列出的样式属性。 |
| 268 | <code>.p-reason { font-size: 12px; color: var(--text); margin-bottom: 8px; white-space: pre-wrap; }</code> | 为选择器 `.p-reason` 设置同一行列出的样式属性。 |
| 269 | <code>.p-actions { display: flex; gap: 8px; }</code> | 为选择器 `.p-actions` 设置同一行列出的样式属性。 |
| 270 | <code>.p-result { font-size: 11px; }</code> | 为选择器 `.p-result` 设置同一行列出的样式属性。 |
| 271 | <code>.p-result:not(.bad) { color: var(--ok); }</code> | 为选择器 `.p-result:not(.bad)` 设置同一行列出的样式属性。 |
| 272 | <code>.p-result.bad { color: var(--ng); }</code> | 为选择器 `.p-result.bad` 设置同一行列出的样式属性。 |
| 274 | <code>.messages { flex: 1; overflow-y: auto; padding-right: 4px; }</code> | 为选择器 `.messages` 设置同一行列出的样式属性。 |
| 275 | <code>.msg { margin-bottom: 12px; display: flex; flex-direction: column; }</code> | 为选择器 `.msg` 设置同一行列出的样式属性。 |
| 276 | <code>.msg.user { align-items: flex-end; }</code> | 为选择器 `.msg.user` 设置同一行列出的样式属性。 |
| 277 | <code>.bubble {</code> | 开始一个选择器或媒体规则的样式块。 |
| 278 | <code>max-width: 88%;</code> | 设置样式属性 `max-width`。 |
| 279 | <code>padding: 8px 10px;</code> | 设置样式属性 `padding`。 |
| 280 | <code>font-size: 13px;</code> | 设置样式属性 `font-size`。 |
| 281 | <code>line-height: 1.6;</code> | 设置样式属性 `line-height`。 |
| 282 | <code>white-space: pre-wrap;</code> | 设置样式属性 `white-space`。 |
| 283 | <code>word-break: break-word;</code> | 设置样式属性 `word-break`。 |
| 284 | <code>border-radius: 8px;</code> | 设置样式属性 `border-radius`。 |
| 285 | <code>background: rgba(255, 255, 255, 0.05);</code> | 设置样式属性 `background`。 |
| 286 | <code>}</code> | 结束样式块或续写样式声明。 |
| 287 | <code>.msg.user .bubble { background: var(--accent); color: #0b1220; }</code> | 为选择器 `.msg.user .bubble` 设置同一行列出的样式属性。 |
| 288 | <code>.bubble.err { border: 1px solid rgba(239, 68, 68, 0.4); }</code> | 为选择器 `.bubble.err` 设置同一行列出的样式属性。 |
| 289 | <code>.tools {</code> | 开始一个选择器或媒体规则的样式块。 |
| 290 | <code>display: flex; align-items: center; gap: 4px;</code> | 设置样式属性 `display`。 |
| 291 | <code>margin-top: 4px; font-size: 10px; color: var(--text-dim);</code> | 设置样式属性 `margin-top`。 |
| 292 | <code>}</code> | 结束样式块或续写样式声明。 |
| 293 | <code>.err-line { margin-top: 4px; font-size: 11px; color: var(--ng); }</code> | 为选择器 `.err-line` 设置同一行列出的样式属性。 |
| 295 | <code>.composer { display: flex; gap: 8px; align-items: flex-end; }</code> | 为选择器 `.composer` 设置同一行列出的样式属性。 |
| 296 | <code>.disclaimer { margin-top: 6px; font-size: 10px; color: var(--text-dim); }</code> | 为选择器 `.disclaimer` 设置同一行列出的样式属性。 |
| 297 | <code>&lt;/style&gt;</code> | 结束 Vue 组件的样式区域。 |
