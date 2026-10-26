# web/src/components/ControlButtons.vue 逐行注释

[打开源码](../../../../../web/src/components/ControlButtons.vue) · 283 行 · 220 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
<template>
<!-- 注释：开始 Vue 模板，定义组件渲染的内容。 -->
```

**源码第 2 行**

```text
  <div class="ctrl-btns">
<!-- 注释：渲染容器，应用 ctrl-btns 样式类。 -->
```

**源码第 3 行**

```text
    <div class="ctrl-title">控制</div>
<!-- 注释：渲染容器，应用 ctrl-title 样式类。 -->
```

**源码第 4 行**

```text
    <div class="ctrl-row">
<!-- 注释：渲染容器，应用 ctrl-row 样式类。 -->
```

**源码第 5 行**

```text
      <el-button size="small" type="success"
<!-- 注释：渲染操作按钮。 -->
```

**源码第 6 行**

```text
                 :loading="state === 'sending'" :disabled="!can('start')"
<!-- 注释：设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 7 行**

```text
                 @click="confirm('start')">启动</el-button>
<!-- 注释：渲染操作按钮。 关键字：@＝事件监听的简写。 -->
```

**源码第 8 行**

```text
      <el-button size="small" type="danger"
<!-- 注释：渲染操作按钮。 -->
```

**源码第 9 行**

```text
                 :loading="state === 'sending'" :disabled="!can('stop')"
<!-- 注释：设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 10 行**

```text
                 @click="confirm('stop')">停止</el-button>
<!-- 注释：渲染操作按钮。 关键字：@＝事件监听的简写。 -->
```

**源码第 11 行**

```text
    </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 12 行**

```text
    <div class="ctrl-row">
<!-- 注释：渲染容器，应用 ctrl-row 样式类。 -->
```

**源码第 15 行**

```text
      <el-dropdown trigger="click"
<!-- 注释：渲染el-dropdown 元素或组件。 -->
```

**源码第 16 行**

```text
                   :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')"
<!-- 注释：设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 17 行**

```text
                   @command="(a: string) => confirm('mode_set', { action: a })">
<!-- 注释：设置 @command=(a: string) => confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
```

**源码第 18 行**

```text
        <el-button size="small" :loading="state === 'sending'"
<!-- 注释：渲染操作按钮。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 19 行**

```text
                   :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')">
<!-- 注释：设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 20 行**

```text
          手动模式 ▾<el-icon class="el-icon--right"><ArrowDown /></el-icon>
<!-- 注释：渲染图标容器，应用 el-icon--right 样式类。 -->
```

**源码第 21 行**

```text
        </el-button>
<!-- 注释：结束 el-button 元素及其中的内容。 -->
```

**源码第 22 行**

```text
        <template #dropdown>
<!-- 注释：渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
```

**源码第 23 行**

```text
          <el-dropdown-menu>
<!-- 注释：渲染el-dropdown-menu 元素或组件。 -->
```

**源码第 24 行**

```text
            <el-dropdown-item command="acquire" :disabled="!can('mode_set', 'acquire')">
<!-- 注释：渲染el-dropdown-item 元素或组件。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 25 行**

```text
              获取手动模式
<!-- 注释：启用当前元素的 获取手动模式 布尔属性。 -->
```

**源码第 26 行**

```text
            </el-dropdown-item>
<!-- 注释：结束 el-dropdown-item 元素及其中的内容。 -->
```

**源码第 27 行**

```text
            <el-dropdown-item command="release" :disabled="!can('mode_set', 'release')">
<!-- 注释：渲染el-dropdown-item 元素或组件。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 28 行**

```text
              释放手动模式
<!-- 注释：启用当前元素的 释放手动模式 布尔属性。 -->
```

**源码第 29 行**

```text
            </el-dropdown-item>
<!-- 注释：结束 el-dropdown-item 元素及其中的内容。 -->
```

**源码第 30 行**

```text
          </el-dropdown-menu>
<!-- 注释：结束 el-dropdown-menu 元素及其中的内容。 -->
```

**源码第 31 行**

```text
        </template>
<!-- 注释：结束当前模板或插槽内容。 -->
```

**源码第 32 行**

```text
      </el-dropdown>
<!-- 注释：结束 el-dropdown 元素及其中的内容。 -->
```

**源码第 34 行**

```text
      <el-button size="small" type="warning" :loading="state === 'sending'"
<!-- 注释：渲染操作按钮。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 35 行**

```text
                 :disabled="!can('conveyor')"
<!-- 注释：设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 36 行**

```text
                 @click="confirm('conveyor', { action: conveyorOn ? 'stop' : 'forward' })">
<!-- 注释：设置 @click=confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
```

**源码第 37 行**

```text
        {{ conveyorOn ? '传送带停止' : '传送带正转' }}
<!-- 注释：显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 38 行**

```text
      </el-button>
<!-- 注释：结束 el-button 元素及其中的内容。 -->
```

**源码第 39 行**

```text
    </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 50 行**

```text
    <div class="ctrl-reason">{{ gateHint }}</div>
<!-- 注释：渲染容器，应用 ctrl-reason 样式类，其中显示 gateHint 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 53 行**

```text
    <div v-if="state !== 'idle'" class="ctrl-state" :class="state">
<!-- 注释：渲染容器，应用 ctrl-state 样式类，条件成立时显示（state !== 'idle'）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->
```

**源码第 54 行**

```text
      <span class="dot" />
<!-- 注释：渲染行内文字，应用 dot 样式类。 -->
```

**源码第 55 行**

```text
      <span class="msg">{{ stateMsg }}</span>
<!-- 注释：渲染行内文字，应用 msg 样式类，其中显示 stateMsg 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 56 行**

```text
    </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 57 行**

```text
  </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 58 行**

```text
</template>
<!-- 注释：结束当前模板或插槽内容。 -->
```

**源码第 60 行**

```text
<script setup lang="ts">
// 注释：开始 Vue 组件的 TypeScript 逻辑区域。
```

**源码第 61 行**

```text
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
// 注释：从 vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 62 行**

```text
import { ElMessage, ElMessageBox } from 'element-plus';
// 注释：从 element-plus 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 63 行**

```text
import { ArrowDown } from '@element-plus/icons-vue';
// 注释：从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 64 行**

```text
import { apiSendCommand, onCommandAck } from '../services/control';
// 注释：从 ../services/control 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 65 行**

```text
import { useLineData } from '../composables/useLineData';
// 注释：从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 66 行**

```text
import type { CommandAck } from '../services/types';
// 注释：从 ../services/types 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 68 行**

```text
const { robot, status } = useLineData();
// 注释：从右侧结果中取出 robot, status，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 69 行**

```text
const deviceId = computed(() => robot.value?.deviceId ?? 'robot-01');
// 注释：声明 deviceId，初始值由 computed(() => robot.value?.deviceId ?? 'robot-01') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 70 行**

```text
const lineId = 'line-01';
// 注释：声明 lineId，初始值由 'line-01' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 72 行**

```text
type CmdType = 'start' | 'stop' | 'mode_set' | 'conveyor';
// 注释：声明 `CmdType` 的结构。 关键字：`type`＝定义类型别名。
```

**源码第 73 行**

```text
type State = 'idle' | 'sending' | 'sent' | 'acked' | 'rejected' | 'failed' | 'timeout';
// 注释：声明 `State` 的结构。 关键字：`type`＝定义类型别名。
```

**源码第 75 行**

```text
const state = ref<State>('idle');
// 注释：声明 state，初始值由 ref<State>('idle') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 76 行**

```text
const stateMsg = ref('');
// 注释：声明 stateMsg，初始值由 ref('') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 77 行**

```text
const currentCmdId = ref('');
// 注释：声明 currentCmdId，初始值由 ref('') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 78 行**

```text
const lastSentAt = ref(0);
// 注释：声明 lastSentAt，初始值由 ref(0) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 80 行**

```text
const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true';
// 注释：声明 MOCK_ONLY，初始值由 import.meta.env.VITE_MOCK_ONLY === 'true' 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`import`＝导入模块或符号。
```

**源码第 84 行**

```text
const conveyorOn = ref(false);
// 注释：声明 conveyorOn，初始值由 ref(false) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`false`＝布尔假值。
```

**源码第 100 行**

```text
const S_INIT_ERROR = 'init_error';
// 注释：声明 S_INIT_ERROR，初始值由 'init_error' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 101 行**

```text
const S_STOPPED = 'stopped';
// 注释：声明 S_STOPPED，初始值由 'stopped' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 102 行**

```text
const S_MANUAL = 'manual_mode';
// 注释：声明 S_MANUAL，初始值由 'manual_mode' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 104 行**

```text
const lineState = computed(() => status.value?.state);
// 注释：声明 lineState，初始值由 computed(() => status.value?.state) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 105 行**

```text
const initError = computed(() => lineState.value === S_INIT_ERROR);
// 注释：声明 initError，初始值由 computed(() => lineState.value === S_INIT_ERROR) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 108 行**

```text
function can(type: CmdType, action?: string): boolean {
// 注释：定义函数 `can`。 关键字：`function`＝定义函数。
```

**源码第 109 行**

```text
  if (initError.value) return false;
// 注释：判断 if (initError.value) return false; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 110 行**

```text
  switch (type) {
// 注释：控制分支、循环或异常处理流程。 关键字：`switch`＝按值分派分支。
```

**源码第 111 行**

```text
    case 'stop':
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。
```

**源码第 112 行**

```text
      return true;
// 注释：返回 true 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 113 行**

```text
    case 'start':
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。
```

**源码第 115 行**

```text
      return lineState.value !== S_MANUAL;
// 注释：返回 lineState.value !== S_MANUAL 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 116 行**

```text
    case 'mode_set':
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。
```

**源码第 117 行**

```text
      return action === 'release' ? lineState.value === S_MANUAL
// 注释：返回 action === 'release' ? lineState.value === S_MANUAL 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 118 行**

```text
                                  : lineState.value === S_STOPPED;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 119 行**

```text
    case 'conveyor':
// 注释：控制分支、循环或异常处理流程。 关键字：`case`＝匹配一个分支。
```

**源码第 120 行**

```text
      return lineState.value === S_MANUAL;
// 注释：返回 lineState.value === S_MANUAL 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 121 行**

```text
    default:
// 注释：设置字段 `default`。 关键字：`default`＝指定默认导出或默认分支。
```

**源码第 122 行**

```text
      return false;
// 注释：返回 false 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 123 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 124 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 127 行**

```text
const gateHint = computed(() => {
// 注释：声明 gateHint，初始值由 computed(() => { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 128 行**

```text
  if (initError.value) {
// 注释：判断 if (initError.value) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 129 行**

```text
    return '产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。';
// 注释：返回 '产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 130 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 131 行**

```text
  if (lineState.value === S_MANUAL) {
// 注释：判断 if (lineState.value === S_MANUAL) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 132 行**

```text
    return '手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。';
// 注释：返回 '手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 133 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 134 行**

```text
  if (lineState.value === S_STOPPED) {
// 注释：判断 if (lineState.value === S_STOPPED) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 135 行**

```text
    return '停止状态:可「获取手动模式」或「启动」。';
// 注释：返回 '停止状态:可「获取手动模式」或「启动」。' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 136 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 137 行**

```text
  if (lineState.value === undefined) {
// 注释：判断 if (lineState.value === undefined) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值。
```

**源码第 138 行**

```text
    return '尚未收到产线状态,指令暂不可用。';
// 注释：返回 '尚未收到产线状态,指令暂不可用。' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 139 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 140 行**

```text
  return '';
// 注释：返回 '' 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 141 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 144 行**

```text
const CONFIRM_PROMPT: Record<CmdType, string> = {
// 注释：声明 CONFIRM_PROMPT，初始值由 { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 145 行**

```text
  start:    '确认向产线发送「启动」指令?\n这会让 PLC 真正动作,产线状态跳转到「等待入料」。',
// 注释：设置字段 `start`。
```

**源码第 146 行**

```text
  stop:     '确认向产线发送「停止」指令?\n这会中断当前作业并切换到停止状态。',
// 注释：设置字段 `stop`。
```

**源码第 147 行**

```text
  mode_set: '确认切换手动模式?\nPLC 侧:写 1 = 获取手动,写 2 = 释放手动;PLC 切换完成后自行清零该位。',
// 注释：设置字段 `mode_set`。
```

**源码第 148 行**

```text
  conveyor: '确认操作传送带?\nPLC 侧:写 1 = 正转,写 0 = 停止(电平型,持续有效)。',
// 注释：设置字段 `conveyor`。
```

**源码第 149 行**

```text
};
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 151 行**

```text
let offAck: (() => void) | null = null;
// 注释：声明 offAck，初始值由 > void) | null = null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`void`＝表示没有返回值；`null`＝空值。
```

**源码第 153 行**

```text
onMounted(() => {
// 注释：调用 onMounted；括号中的表达式是传入的参数。
```

**源码第 154 行**

```text
  offAck = onCommandAck((ack: CommandAck) => {
// 注释：把右侧表达式的结果写入 offAck。
```

**源码第 155 行**

```text
    if (ack.cmdId !== currentCmdId.value) return;
// 注释：判断 if (ack.cmdId !== currentCmdId.value) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 156 行**

```text
    if (ack.status === 'acked') {
// 注释：判断 if (ack.status === 'acked') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 157 行**

```text
      state.value = 'acked'; stateMsg.value = '已执行 ✓';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 159 行**

```text
      if (pendingType.value === 'conveyor') {
// 注释：判断 if (pendingType.value === 'conveyor') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 160 行**

```text
        conveyorOn.value = pendingAction.value === 'forward';
// 注释：把右侧表达式的结果写入 conveyorOn.value。
```

**源码第 161 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 162 行**

```text
    } else if (ack.status === 'timeout') {
// 注释：开始前一条件不满足时的分支。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。
```

**源码第 163 行**

```text
      state.value = 'timeout'; stateMsg.value = '超时(15s 无回执)';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 164 行**

```text
    } else {
// 注释：开始前一条件不满足时的分支。 关键字：`else`＝进入另一条件分支。
```

**源码第 165 行**

```text
      state.value = 'rejected';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 166 行**

```text
      stateMsg.value = `被拒:${ack.message || ack.status}`;
// 注释：把右侧表达式的结果写入 stateMsg.value。
```

**源码第 167 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 168 行**

```text
    scheduleReset();
// 注释：调用 scheduleReset；括号中的表达式是传入的参数。
```

**源码第 169 行**

```text
  });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 170 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 173 行**

```text
const pendingType = ref<string>('');
// 注释：声明 pendingType，初始值由 ref<string>('') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 174 行**

```text
const pendingAction = ref<string>('');
// 注释：声明 pendingAction，初始值由 ref<string>('') 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 176 行**

```text
onBeforeUnmount(() => { offAck?.(); });
// 注释：调用 onBeforeUnmount；括号中的表达式是传入的参数。
```

**源码第 179 行**

```text
let resetTimer: ReturnType<typeof setTimeout> | null = null;
// 注释：声明 resetTimer，初始值由 null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`typeof`＝读取值的运行时类型；`null`＝空值。
```

**源码第 180 行**

```text
function scheduleReset() {
// 注释：定义函数 `scheduleReset`。 关键字：`function`＝定义函数。
```

**源码第 181 行**

```text
  if (resetTimer) clearTimeout(resetTimer);
// 注释：判断 if (resetTimer) clearTimeout(resetTimer); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 182 行**

```text
  resetTimer = setTimeout(() => {
// 注释：把右侧表达式的结果写入 resetTimer。
```

**源码第 183 行**

```text
    state.value = 'idle'; stateMsg.value = ''; currentCmdId.value = '';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 184 行**

```text
  }, 2500);
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 185 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 187 行**

```text
async function confirm(type: CmdType, params?: Record<string, unknown>) {
// 注释：定义函数 `confirm`。 关键字：`async`＝声明异步函数；`function`＝定义函数；`unknown`＝需检查后才能使用的类型。
```

**源码第 188 行**

```text
  if (state.value !== 'idle') return;
// 注释：判断 if (state.value !== 'idle') return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 191 行**

```text
  const action = (params ?? {}).action as string | undefined;
// 注释：声明 action，初始值由 (params ?? {}).action as string | undefined 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`undefined`＝未定义值。
```

**源码第 192 行**

```text
  if (!can(type, action)) {
// 注释：判断 if (!can(type, action)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 193 行**

```text
    ElMessage.warning(`当前产线状态不允许该指令。${gateHint.value}`);
// 注释：调用 ElMessage.warning，把括号中的值作为参数传入。
```

**源码第 194 行**

```text
    return;
// 注释：立即结束当前函数，不返回具体值。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 195 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 196 行**

```text
  try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 197 行**

```text
    await ElMessageBox.confirm(CONFIRM_PROMPT[type], '下发控制指令', {
// 注释：调用 ElMessageBox.confirm，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成。
```

**源码第 198 行**

```text
      confirmButtonText: '确认下发', cancelButtonText: '取消', type: 'warning',
// 注释：设置字段 `confirmButtonText`。 关键字：type＝定义类型别名。
```

**源码第 199 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 200 行**

```text
  } catch { return; /* 用户取消 */ }
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常；`return`＝返回结果并结束当前函数。
```

**源码第 202 行**

```text
  pendingType.value = type;
// 注释：把右侧表达式的结果写入 pendingType.value。 关键字：type＝定义类型别名。
```

**源码第 203 行**

```text
  pendingAction.value = String((params ?? {}).action ?? '');
// 注释：把右侧表达式的结果写入 pendingAction.value。
```

**源码第 204 行**

```text
  state.value = 'sending';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 205 行**

```text
  stateMsg.value = '下发中…';
// 注释：把右侧表达式的结果写入 stateMsg.value。
```

**源码第 206 行**

```text
  try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 207 行**

```text
    const r = await apiSendCommand(lineId, { deviceId: deviceId.value, type, params });
// 注释：声明 r，初始值由 await apiSendCommand(lineId, { deviceId: deviceId.value, type, params }) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成。
```

**源码第 208 行**

```text
    if (!r.ok || !r.cmdId) {
// 注释：判断 if (!r.ok || !r.cmdId) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 209 行**

```text
      state.value = 'failed';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 210 行**

```text
      stateMsg.value = `服务端拒绝:${r.error || '未知错误'}`;
// 注释：把右侧表达式的结果写入 stateMsg.value。
```

**源码第 211 行**

```text
      scheduleReset();
// 注释：调用 scheduleReset；括号中的表达式是传入的参数。
```

**源码第 212 行**

```text
      return;
// 注释：立即结束当前函数，不返回具体值。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 213 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 214 行**

```text
    currentCmdId.value = r.cmdId;
// 注释：把右侧表达式的结果写入 currentCmdId.value。
```

**源码第 215 行**

```text
    lastSentAt.value = Date.now();
// 注释：把右侧表达式的结果写入 lastSentAt.value。
```

**源码第 216 行**

```text
    state.value = 'sent';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 217 行**

```text
    stateMsg.value = `已发送(${r.cmdId.slice(0, 8)}…)`;
// 注释：把右侧表达式的结果写入 stateMsg.value。
```

**源码第 219 行**

```text
    if (MOCK_ONLY) {
// 注释：判断 if (MOCK_ONLY) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 220 行**

```text
      setTimeout(() => {
// 注释：调用 setTimeout；括号中的表达式是传入的参数。
```

**源码第 221 行**

```text
        if (currentCmdId.value === r.cmdId) {
// 注释：判断 if (currentCmdId.value === r.cmdId) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 222 行**

```text
          state.value = 'acked';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 223 行**

```text
          stateMsg.value = 'mock:已执行 ✓';
// 注释：把右侧表达式的结果写入 stateMsg.value。
```

**源码第 224 行**

```text
          scheduleReset();
// 注释：调用 scheduleReset；括号中的表达式是传入的参数。
```

**源码第 225 行**

```text
        }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 226 行**

```text
      }, 300);
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 227 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 229 行**

```text
    setTimeout(() => {
// 注释：调用 setTimeout；括号中的表达式是传入的参数。
```

**源码第 230 行**

```text
      if (currentCmdId.value === r.cmdId && state.value === 'sent') {
// 注释：判断 if (currentCmdId.value === r.cmdId && state.value === 'sent') { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 231 行**

```text
        state.value = 'timeout';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 232 行**

```text
        stateMsg.value = '超时(15s 无回执)';
// 注释：把右侧表达式的结果写入 stateMsg.value。
```

**源码第 233 行**

```text
        scheduleReset();
// 注释：调用 scheduleReset；括号中的表达式是传入的参数。
```

**源码第 234 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 235 行**

```text
    }, 15000);
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 236 行**

```text
  } catch (e) {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 237 行**

```text
    state.value = 'failed';
// 注释：把右侧表达式的结果写入 state.value。
```

**源码第 238 行**

```text
    stateMsg.value = (e as Error).message || '下发失败';
// 注释：把右侧表达式的结果写入 stateMsg.value。
```

**源码第 239 行**

```text
    scheduleReset();
// 注释：调用 scheduleReset；括号中的表达式是传入的参数。
```

**源码第 240 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 241 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 242 行**

```text
</script>
// 注释：结束 Vue 组件的逻辑区域。
```

**源码第 244 行**

```text
<style scoped>
/* 注释：开始 Vue 组件的局部样式区域。 */
```

**源码第 245 行**

```text
.ctrl-btns { display: flex; flex-direction: column; gap: 6px; }
/* 注释：display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=6px：设置子元素间距。 */
```

**源码第 246 行**

```text
.ctrl-title {
/* 注释：对选择器 .ctrl-title 匹配的元素应用后续声明。 */
```

**源码第 247 行**

```text
  font-size: 11px; color: var(--text-dim);
/* 注释：font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
```

**源码第 248 行**

```text
  text-transform: uppercase; letter-spacing: 0.5px;
/* 注释：text-transform=uppercase：设置该样式属性；letter-spacing=0.5px：设置该样式属性。 */
```

**源码第 249 行**

```text
  margin-bottom: 2px;
/* 注释：margin-bottom=2px：设置该样式属性。 */
```

**源码第 250 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 251 行**

```text
.ctrl-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
/* 注释：display=flex：决定元素如何布局或显示；gap=6px：设置子元素间距；align-items=center：控制交叉轴上的对齐方式；flex-wrap=wrap：设置该样式属性。 */
```

**源码第 252 行**

```text
.ctrl-note { font-size: 10px; color: var(--text-dim); opacity: 0.75; }
/* 注释：font-size=10px：设置字号；color=var(--text-dim)：设置文字颜色；opacity=0.75：设置透明度。 */
```

**源码第 254 行**

```text
.ctrl-reason {
/* 注释：对选择器 .ctrl-reason 匹配的元素应用后续声明。 */
```

**源码第 255 行**

```text
  font-size: 11px; color: var(--text-dim); line-height: 1.5;
/* 注释：font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；line-height=1.5：设置行高。 */
```

**源码第 256 行**

```text
  padding: 4px 6px; border-radius: 4px;
/* 注释：padding=4px 6px：设置内边距；border-radius=4px：设置圆角。 */
```

**源码第 257 行**

```text
  background: rgba(255,255,255,0.02);
/* 注释：background=rgba(255,255,255,0.02)：设置背景。 */
```

**源码第 258 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 259 行**

```text
.ctrl-reason:empty { display: none; }
/* 注释：ctrl-reason=empty { display: none：设置该样式属性。 */
```

**源码第 261 行**

```text
.ctrl-state {
/* 注释：对选择器 .ctrl-state 匹配的元素应用后续声明。 */
```

**源码第 262 行**

```text
  margin-top: 6px; padding: 4px 6px;
/* 注释：margin-top=6px：设置该样式属性；padding=4px 6px：设置内边距。 */
```

**源码第 263 行**

```text
  border-radius: 4px;
/* 注释：border-radius=4px：设置圆角。 */
```

**源码第 264 行**

```text
  display: flex; align-items: center; gap: 6px;
/* 注释：display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=6px：设置子元素间距。 */
```

**源码第 265 行**

```text
  font-size: 11px;
/* 注释：font-size=11px：设置字号。 */
```

**源码第 266 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 267 行**

```text
.ctrl-state .dot {
/* 注释：对选择器 .ctrl-state .dot 匹配的元素应用后续声明。 */
```

**源码第 268 行**

```text
  width: 6px; height: 6px; border-radius: 50%;
/* 注释：width=6px：设置宽度；height=6px：设置高度；border-radius=50%：设置圆角。 */
```

**源码第 269 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 270 行**

```text
.ctrl-state.sending { background: rgba(59,130,246,0.15); color: #93c5fd; }
/* 注释：background=rgba(59,130,246,0.15)：设置背景；color=#93c5fd：设置文字颜色。 */
```

**源码第 271 行**

```text
.ctrl-state.sending .dot { background: #3b82f6; }
/* 注释：background=#3b82f6：设置背景。 */
```

**源码第 272 行**

```text
.ctrl-state.sent { background: rgba(245,158,11,0.12); color: #fcd34d; }
/* 注释：background=rgba(245,158,11,0.12)：设置背景；color=#fcd34d：设置文字颜色。 */
```

**源码第 273 行**

```text
.ctrl-state.sent .dot { background: #f59e0b; }
/* 注释：background=#f59e0b：设置背景。 */
```

**源码第 274 行**

```text
.ctrl-state.acked { background: rgba(34,197,94,0.12); color: #86efac; }
/* 注释：background=rgba(34,197,94,0.12)：设置背景；color=#86efac：设置文字颜色。 */
```

**源码第 275 行**

```text
.ctrl-state.acked .dot { background: #22c55e; }
/* 注释：background=#22c55e：设置背景。 */
```

**源码第 276 行**

```text
.ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout {
/* 注释：对选择器 .ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout 匹配的元素应用后续声明。 */
```

**源码第 277 行**

```text
  background: rgba(239,68,68,0.12); color: #fca5a5;
/* 注释：background=rgba(239,68,68,0.12)：设置背景；color=#fca5a5：设置文字颜色。 */
```

**源码第 278 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 279 行**

```text
.ctrl-state.rejected .dot,
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 280 行**

```text
.ctrl-state.failed .dot,
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 281 行**

```text
.ctrl-state.timeout .dot { background: #ef4444; }
/* 注释：background=#ef4444：设置背景。 */
```

**源码第 282 行**

```text
.ctrl-state .msg { font-variant-numeric: tabular-nums; }
/* 注释：font-variant-numeric=tabular-nums：设置该样式属性。 */
```

**源码第 283 行**

```text
</style>
/* 注释：结束 Vue 组件的样式区域。 */
```
