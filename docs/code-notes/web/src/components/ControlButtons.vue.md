# web/src/components/ControlButtons.vue 逐行说明

[打开源码](../../../../../web/src/components/ControlButtons.vue) · 283 行 · 177 行待说明代码

只列出 `<script>` 与 `<style>` 中的源码；`<template>` 按要求排除。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 60 | <code>&lt;script setup lang="ts"&gt;</code> | 开始 Vue 组件的 TypeScript 逻辑区域。 |
| 61 | <code>import { computed, onBeforeUnmount, onMounted, ref } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 62 | <code>import { ElMessage, ElMessageBox } from 'element-plus';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 63 | <code>import { ArrowDown } from '@element-plus/icons-vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 64 | <code>import { apiSendCommand, onCommandAck } from '../services/control';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 65 | <code>import { useLineData } from '../composables/useLineData';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 66 | <code>import type { CommandAck } from '../services/types';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`type`＝定义类型别名；`from`＝指定导入来源。 |
| 68 | <code>const { robot, status } = useLineData();</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 69 | <code>const deviceId = computed(() =&gt; robot.value?.deviceId ?? 'robot-01');</code> | 声明变量 `deviceId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 70 | <code>const lineId = 'line-01';</code> | 声明变量 `lineId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 72 | <code>type CmdType = 'start' &#124; 'stop' &#124; 'mode_set' &#124; 'conveyor';</code> | 声明 `CmdType` 的结构。 关键字：`type`＝定义类型别名。 |
| 73 | <code>type State = 'idle' &#124; 'sending' &#124; 'sent' &#124; 'acked' &#124; 'rejected' &#124; 'failed' &#124; 'timeout';</code> | 声明 `State` 的结构。 关键字：`type`＝定义类型别名。 |
| 75 | <code>const state = ref&lt;State&gt;('idle');</code> | 声明变量 `state` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 76 | <code>const stateMsg = ref('');</code> | 声明变量 `stateMsg` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 77 | <code>const currentCmdId = ref('');</code> | 声明变量 `currentCmdId` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 78 | <code>const lastSentAt = ref(0);</code> | 声明变量 `lastSentAt` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 80 | <code>const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true';</code> | 声明变量 `MOCK_ONLY` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号。 |
| 84 | <code>const conveyorOn = ref(false);</code> | 声明变量 `conveyorOn` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。 |
| 100 | <code>const S_INIT_ERROR = 'init_error';</code> | 声明变量 `S_INIT_ERROR` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 101 | <code>const S_STOPPED = 'stopped';</code> | 声明变量 `S_STOPPED` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 102 | <code>const S_MANUAL = 'manual_mode';</code> | 声明变量 `S_MANUAL` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 104 | <code>const lineState = computed(() =&gt; status.value?.state);</code> | 声明变量 `lineState` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 105 | <code>const initError = computed(() =&gt; lineState.value === S_INIT_ERROR);</code> | 声明变量 `initError` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 108 | <code>function can(type: CmdType, action?: string): boolean {</code> | 定义函数 `can`。 关键字：`function`＝定义函数。 |
| 109 | <code>if (initError.value) return false;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 110 | <code>switch (type) {</code> | 控制分支、循环或异常处理流程。 关键字：`switch`＝按值分派分支。 |
| 111 | <code>case 'stop':</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。 |
| 112 | <code>return true;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。 |
| 113 | <code>case 'start':</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。 |
| 115 | <code>return lineState.value !== S_MANUAL;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 116 | <code>case 'mode_set':</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。 |
| 117 | <code>return action === 'release' ? lineState.value === S_MANUAL</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 118 | <code>: lineState.value === S_STOPPED;</code> | 续写当前表达式、对象、类型或调用。 |
| 119 | <code>case 'conveyor':</code> | 控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。 |
| 120 | <code>return lineState.value === S_MANUAL;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 121 | <code>default:</code> | 设置字段 `default`。 关键字：`default`＝指定默认导出或默认分支。 |
| 122 | <code>return false;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。 |
| 123 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 124 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 127 | <code>const gateHint = computed(() =&gt; {</code> | 声明变量 `gateHint` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 128 | <code>if (initError.value) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 129 | <code>return '产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 130 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 131 | <code>if (lineState.value === S_MANUAL) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 132 | <code>return '手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 133 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 134 | <code>if (lineState.value === S_STOPPED) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 135 | <code>return '停止状态:可「获取手动模式」或「启动」。';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 136 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 137 | <code>if (lineState.value === undefined) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`undefined`＝未定义值。 |
| 138 | <code>return '尚未收到产线状态,指令暂不可用。';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 139 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 140 | <code>return '';</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 141 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 144 | <code>const CONFIRM_PROMPT: Record&lt;CmdType, string&gt; = {</code> | 声明变量 `CONFIRM_PROMPT` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 145 | <code>start:    '确认向产线发送「启动」指令?\n这会让 PLC 真正动作,产线状态跳转到「等待入料」。',</code> | 设置字段 `start`。 |
| 146 | <code>stop:     '确认向产线发送「停止」指令?\n这会中断当前作业并切换到停止状态。',</code> | 设置字段 `stop`。 |
| 147 | <code>mode_set: '确认切换手动模式?\nPLC 侧:写 1 = 获取手动,写 2 = 释放手动;PLC 切换完成后自行清零该位。',</code> | 设置字段 `mode_set`。 |
| 148 | <code>conveyor: '确认操作传送带?\nPLC 侧:写 1 = 正转,写 0 = 停止(电平型,持续有效)。',</code> | 设置字段 `conveyor`。 |
| 149 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 151 | <code>let offAck: (() =&gt; void) &#124; null = null;</code> | 声明变量 `offAck` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。 |
| 153 | <code>onMounted(() =&gt; {</code> | 定义或调用 `onMounted`，参数由括号给出。 |
| 154 | <code>offAck = onCommandAck((ack: CommandAck) =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 155 | <code>if (ack.cmdId !== currentCmdId.value) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 156 | <code>if (ack.status === 'acked') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 157 | <code>state.value = 'acked'; stateMsg.value = '已执行 ✓';</code> | 调用函数、设置值或更新状态。 |
| 159 | <code>if (pendingType.value === 'conveyor') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 160 | <code>conveyorOn.value = pendingAction.value === 'forward';</code> | 调用函数、设置值或更新状态。 |
| 161 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 162 | <code>} else if (ack.status === 'timeout') {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 163 | <code>state.value = 'timeout'; stateMsg.value = '超时(15s 无回执)';</code> | 调用函数、设置值或更新状态。 |
| 164 | <code>} else {</code> | 续写当前表达式、对象、类型或调用。 关键字：`else`＝进入另一条件分支。 |
| 165 | <code>state.value = 'rejected';</code> | 调用函数、设置值或更新状态。 |
| 166 | <code>stateMsg.value = `被拒:${ack.message &#124;&#124; ack.status}`;</code> | 调用函数、设置值或更新状态。 |
| 167 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 168 | <code>scheduleReset();</code> | 定义或调用 `scheduleReset`，参数由括号给出。 |
| 169 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 170 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 173 | <code>const pendingType = ref&lt;string&gt;('');</code> | 声明变量 `pendingType` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 174 | <code>const pendingAction = ref&lt;string&gt;('');</code> | 声明变量 `pendingAction` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 176 | <code>onBeforeUnmount(() =&gt; { offAck?.(); });</code> | 定义或调用 `onBeforeUnmount`，参数由括号给出。 |
| 179 | <code>let resetTimer: ReturnType&lt;typeof setTimeout&gt; &#124; null = null;</code> | 声明变量 `resetTimer` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`typeof`＝读取值的运行时类型；`null`＝空值。 |
| 180 | <code>function scheduleReset() {</code> | 定义函数 `scheduleReset`。 关键字：`function`＝定义函数。 |
| 181 | <code>if (resetTimer) clearTimeout(resetTimer);</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 182 | <code>resetTimer = setTimeout(() =&gt; {</code> | 调用函数、设置值或更新状态。 |
| 183 | <code>state.value = 'idle'; stateMsg.value = ''; currentCmdId.value = '';</code> | 调用函数、设置值或更新状态。 |
| 184 | <code>}, 2500);</code> | 续写当前表达式、对象、类型或调用。 |
| 185 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 187 | <code>async function confirm(type: CmdType, params?: Record&lt;string, unknown&gt;) {</code> | 定义函数 `confirm`。 关键字：`async`＝声明异步函数；`function`＝定义函数；`unknown`＝需检查后才能使用的类型。 |
| 188 | <code>if (state.value !== 'idle') return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 191 | <code>const action = (params ?? {}).action as string &#124; undefined;</code> | 声明变量 `action` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`undefined`＝未定义值。 |
| 192 | <code>if (!can(type, action)) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 193 | <code>ElMessage.warning(`当前产线状态不允许该指令。${gateHint.value}`);</code> | 调用函数、设置值或更新状态。 |
| 194 | <code>return;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 195 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 196 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 197 | <code>await ElMessageBox.confirm(CONFIRM_PROMPT[type], '下发控制指令', {</code> | 调用函数、设置值或更新状态。 关键字：`await`＝等待异步操作完成。 |
| 198 | <code>confirmButtonText: '确认下发', cancelButtonText: '取消', type: 'warning',</code> | 设置字段 `confirmButtonText`。 |
| 199 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 200 | <code>} catch { return; /* 用户取消 */ }</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常；`return`＝返回结果并结束当前函数。 |
| 202 | <code>pendingType.value = type;</code> | 调用函数、设置值或更新状态。 |
| 203 | <code>pendingAction.value = String((params ?? {}).action ?? '');</code> | 调用函数、设置值或更新状态。 |
| 204 | <code>state.value = 'sending';</code> | 调用函数、设置值或更新状态。 |
| 205 | <code>stateMsg.value = '下发中…';</code> | 调用函数、设置值或更新状态。 |
| 206 | <code>try {</code> | 控制分支、循环或异常处理流程。 关键字：`try`＝进入异常处理块。 |
| 207 | <code>const r = await apiSendCommand(lineId, { deviceId: deviceId.value, type, params });</code> | 声明变量 `r` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。 |
| 208 | <code>if (!r.ok &#124;&#124; !r.cmdId) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 209 | <code>state.value = 'failed';</code> | 调用函数、设置值或更新状态。 |
| 210 | <code>stateMsg.value = `服务端拒绝:${r.error &#124;&#124; '未知错误'}`;</code> | 调用函数、设置值或更新状态。 |
| 211 | <code>scheduleReset();</code> | 定义或调用 `scheduleReset`，参数由括号给出。 |
| 212 | <code>return;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 213 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 214 | <code>currentCmdId.value = r.cmdId;</code> | 调用函数、设置值或更新状态。 |
| 215 | <code>lastSentAt.value = Date.now();</code> | 调用函数、设置值或更新状态。 |
| 216 | <code>state.value = 'sent';</code> | 调用函数、设置值或更新状态。 |
| 217 | <code>stateMsg.value = `已发送(${r.cmdId.slice(0, 8)}…)`;</code> | 调用函数、设置值或更新状态。 |
| 219 | <code>if (MOCK_ONLY) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 220 | <code>setTimeout(() =&gt; {</code> | 定义或调用 `setTimeout`，参数由括号给出。 |
| 221 | <code>if (currentCmdId.value === r.cmdId) {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 222 | <code>state.value = 'acked';</code> | 调用函数、设置值或更新状态。 |
| 223 | <code>stateMsg.value = 'mock:已执行 ✓';</code> | 调用函数、设置值或更新状态。 |
| 224 | <code>scheduleReset();</code> | 定义或调用 `scheduleReset`，参数由括号给出。 |
| 225 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 226 | <code>}, 300);</code> | 续写当前表达式、对象、类型或调用。 |
| 227 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 229 | <code>setTimeout(() =&gt; {</code> | 定义或调用 `setTimeout`，参数由括号给出。 |
| 230 | <code>if (currentCmdId.value === r.cmdId &amp;&amp; state.value === 'sent') {</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 231 | <code>state.value = 'timeout';</code> | 调用函数、设置值或更新状态。 |
| 232 | <code>stateMsg.value = '超时(15s 无回执)';</code> | 调用函数、设置值或更新状态。 |
| 233 | <code>scheduleReset();</code> | 定义或调用 `scheduleReset`，参数由括号给出。 |
| 234 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 235 | <code>}, 15000);</code> | 续写当前表达式、对象、类型或调用。 |
| 236 | <code>} catch (e) {</code> | 续写当前表达式、对象、类型或调用。 关键字：`catch`＝捕获异常。 |
| 237 | <code>state.value = 'failed';</code> | 调用函数、设置值或更新状态。 |
| 238 | <code>stateMsg.value = (e as Error).message &#124;&#124; '下发失败';</code> | 调用函数、设置值或更新状态。 |
| 239 | <code>scheduleReset();</code> | 定义或调用 `scheduleReset`，参数由括号给出。 |
| 240 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 241 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 242 | <code>&lt;/script&gt;</code> | 结束 Vue 组件的逻辑区域。 |
| 244 | <code>&lt;style scoped&gt;</code> | 开始 Vue 组件的局部样式区域。 |
| 245 | <code>.ctrl-btns { display: flex; flex-direction: column; gap: 6px; }</code> | 为选择器 `.ctrl-btns` 设置同一行列出的样式属性。 |
| 246 | <code>.ctrl-title {</code> | 开始一个选择器或媒体规则的样式块。 |
| 247 | <code>font-size: 11px; color: var(--text-dim);</code> | 设置样式属性 `font-size`。 |
| 248 | <code>text-transform: uppercase; letter-spacing: 0.5px;</code> | 设置样式属性 `text-transform`。 |
| 249 | <code>margin-bottom: 2px;</code> | 设置样式属性 `margin-bottom`。 |
| 250 | <code>}</code> | 结束样式块或续写样式声明。 |
| 251 | <code>.ctrl-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }</code> | 为选择器 `.ctrl-row` 设置同一行列出的样式属性。 |
| 252 | <code>.ctrl-note { font-size: 10px; color: var(--text-dim); opacity: 0.75; }</code> | 为选择器 `.ctrl-note` 设置同一行列出的样式属性。 |
| 254 | <code>.ctrl-reason {</code> | 开始一个选择器或媒体规则的样式块。 |
| 255 | <code>font-size: 11px; color: var(--text-dim); line-height: 1.5;</code> | 设置样式属性 `font-size`。 |
| 256 | <code>padding: 4px 6px; border-radius: 4px;</code> | 设置样式属性 `padding`。 |
| 257 | <code>background: rgba(255,255,255,0.02);</code> | 设置样式属性 `background`。 |
| 258 | <code>}</code> | 结束样式块或续写样式声明。 |
| 259 | <code>.ctrl-reason:empty { display: none; }</code> | 为选择器 `.ctrl-reason:empty` 设置同一行列出的样式属性。 |
| 261 | <code>.ctrl-state {</code> | 开始一个选择器或媒体规则的样式块。 |
| 262 | <code>margin-top: 6px; padding: 4px 6px;</code> | 设置样式属性 `margin-top`。 |
| 263 | <code>border-radius: 4px;</code> | 设置样式属性 `border-radius`。 |
| 264 | <code>display: flex; align-items: center; gap: 6px;</code> | 设置样式属性 `display`。 |
| 265 | <code>font-size: 11px;</code> | 设置样式属性 `font-size`。 |
| 266 | <code>}</code> | 结束样式块或续写样式声明。 |
| 267 | <code>.ctrl-state .dot {</code> | 开始一个选择器或媒体规则的样式块。 |
| 268 | <code>width: 6px; height: 6px; border-radius: 50%;</code> | 设置样式属性 `width`。 |
| 269 | <code>}</code> | 结束样式块或续写样式声明。 |
| 270 | <code>.ctrl-state.sending { background: rgba(59,130,246,0.15); color: #93c5fd; }</code> | 为选择器 `.ctrl-state.sending` 设置同一行列出的样式属性。 |
| 271 | <code>.ctrl-state.sending .dot { background: #3b82f6; }</code> | 为选择器 `.ctrl-state.sending .dot` 设置同一行列出的样式属性。 |
| 272 | <code>.ctrl-state.sent { background: rgba(245,158,11,0.12); color: #fcd34d; }</code> | 为选择器 `.ctrl-state.sent` 设置同一行列出的样式属性。 |
| 273 | <code>.ctrl-state.sent .dot { background: #f59e0b; }</code> | 为选择器 `.ctrl-state.sent .dot` 设置同一行列出的样式属性。 |
| 274 | <code>.ctrl-state.acked { background: rgba(34,197,94,0.12); color: #86efac; }</code> | 为选择器 `.ctrl-state.acked` 设置同一行列出的样式属性。 |
| 275 | <code>.ctrl-state.acked .dot { background: #22c55e; }</code> | 为选择器 `.ctrl-state.acked .dot` 设置同一行列出的样式属性。 |
| 276 | <code>.ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout {</code> | 开始一个选择器或媒体规则的样式块。 |
| 277 | <code>background: rgba(239,68,68,0.12); color: #fca5a5;</code> | 设置样式属性 `background`。 |
| 278 | <code>}</code> | 结束样式块或续写样式声明。 |
| 279 | <code>.ctrl-state.rejected .dot,</code> | 结束样式块或续写样式声明。 |
| 280 | <code>.ctrl-state.failed .dot,</code> | 结束样式块或续写样式声明。 |
| 281 | <code>.ctrl-state.timeout .dot { background: #ef4444; }</code> | 为选择器 `.ctrl-state.timeout .dot` 设置同一行列出的样式属性。 |
| 282 | <code>.ctrl-state .msg { font-variant-numeric: tabular-nums; }</code> | 为选择器 `.ctrl-state .msg` 设置同一行列出的样式属性。 |
| 283 | <code>&lt;/style&gt;</code> | 结束 Vue 组件的样式区域。 |
