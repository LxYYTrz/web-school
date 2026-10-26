<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
  <div class="ctrl-btns">
  <!-- 渲染容器，应用 ctrl-btns 样式类。 -->
    <div class="ctrl-title">控制</div>
    <!-- 渲染容器，应用 ctrl-title 样式类。 -->
    <div class="ctrl-row">
    <!-- 渲染容器，应用 ctrl-row 样式类。 -->
      <el-button size="small" type="success" :loading="state === 'sending'" :disabled="!can('start')" @click="confirm('start')">启动</el-button>
      <!-- 渲染操作按钮。；设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；渲染操作按钮。 关键字：@＝事件监听的简写。 -->
      <el-button size="small" type="danger" :loading="state === 'sending'" :disabled="!can('stop')" @click="confirm('stop')">停止</el-button>
      <!-- 渲染操作按钮。；设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；渲染操作按钮。 关键字：@＝事件监听的简写。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <div class="ctrl-row">
    <!-- 渲染容器，应用 ctrl-row 样式类。 -->
      <!-- PLC word 8:1=获取手动 2=释放手动,PLC 切换完成后自动置 0。
           acquire 仅 stopped(101) 可用;release 仅 manual_mode(102) 可用 -->
      <el-dropdown trigger="click" :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')" @command="(a: string) => confirm('mode_set', { action: a })">
      <!-- 渲染el-dropdown 元素或组件。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @command=(a: string) => confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
        <el-button size="small" :loading="state === 'sending'" :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')">
        <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。 -->
          手动模式 ▾<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          <!-- 渲染图标容器，应用 el-icon--right 样式类。 -->
        </el-button>
        <!-- 结束 el-button 元素及其中的内容。 -->
        <template #dropdown>
        <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
          <el-dropdown-menu>
          <!-- 渲染el-dropdown-menu 元素或组件。 -->
            <el-dropdown-item command="acquire" :disabled="!can('mode_set', 'acquire')">
            <!-- 渲染el-dropdown-item 元素或组件。 关键字：:＝属性动态绑定的简写。 -->
              获取手动模式
              <!-- 启用当前元素的 获取手动模式 布尔属性。 -->
            </el-dropdown-item>
            <!-- 结束 el-dropdown-item 元素及其中的内容。 -->
            <el-dropdown-item command="release" :disabled="!can('mode_set', 'release')">
            <!-- 渲染el-dropdown-item 元素或组件。 关键字：:＝属性动态绑定的简写。 -->
              释放手动模式
              <!-- 启用当前元素的 释放手动模式 布尔属性。 -->
            </el-dropdown-item>
            <!-- 结束 el-dropdown-item 元素及其中的内容。 -->
          </el-dropdown-menu>
          <!-- 结束 el-dropdown-menu 元素及其中的内容。 -->
        </template>
        <!-- 结束当前模板或插槽内容。 -->
      </el-dropdown>
      <!-- 结束 el-dropdown 元素及其中的内容。 -->
      <!-- PLC word 10:1=正转 0=停止,电平型。仅「手动控制模式」下有效 -->
      <el-button size="small" type="warning" :loading="state === 'sending'" :disabled="!can('conveyor')" @click="confirm('conveyor', { action: conveyorOn ? 'stop' : 'forward' })">
      <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @click=confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
        {{ conveyorOn ? '传送带停止' : '传送带正转' }}
        <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </el-button>
      <!-- 结束 el-button 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- @deprecated 2026-10-16 暂停使用(现场无 PLC 寄存器,edge 默认就拒绝) -->
  <!--
    <div class="ctrl-row">
      <el-button size="small" disabled>复位</el-button>
      <el-button size="small" disabled>清警</el-button>
      <el-button size="small" disabled>换型</el-button>
      <span class="ctrl-note">复位/清警/换型:现场 PLC 未开放对应寄存器</span>
    </div>
  -->
    <!-- 不可用时说明原因:鼠标悬停即可看到,不靠猜 -->
    <div class="ctrl-reason">{{ gateHint }}</div>
    <!-- 渲染容器，应用 ctrl-reason 样式类，其中显示 gateHint 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->

    <!-- 状态行:显示最近一次命令的状态与回执消息 -->
    <div v-if="state !== 'idle'" class="ctrl-state" :class="state">
    <!-- 渲染容器，应用 ctrl-state 样式类，条件成立时显示（state !== 'idle'）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->
      <span class="dot" />
      <!-- 渲染行内文字，应用 dot 样式类。 -->
      <span class="msg">{{ stateMsg }}</span>
      <!-- 渲染行内文字，应用 msg 样式类，其中显示 stateMsg 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ElMessage, ElMessageBox } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ArrowDown } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { apiSendCommand, onCommandAck } from '../services/control';
// 从 ../services/control 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { CommandAck } from '../services/types';
// 从 ../services/types 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

const { robot, status } = useLineData();
// 从右侧结果中取出 robot, status，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。
const deviceId = computed(() => robot.value?.deviceId ?? 'robot-01');
// 声明 deviceId，初始值由 computed(() => robot.value?.deviceId ?? 'robot-01') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const lineId = 'line-01';
// 声明 lineId，初始值由 'line-01' 计算得到。 关键字：const＝声明不可重新绑定的变量。

type CmdType = 'start' | 'stop' | 'mode_set' | 'conveyor';
// 声明 CmdType 的结构。 关键字：type＝定义类型别名。
type State = 'idle' | 'sending' | 'sent' | 'acked' | 'rejected' | 'failed' | 'timeout';
// 声明 State 的结构。 关键字：type＝定义类型别名。

const state = ref<State>('idle');
// 声明 state，初始值由 ref<State>('idle') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const stateMsg = ref('');
// 声明 stateMsg，初始值由 ref('') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const currentCmdId = ref('');
// 声明 currentCmdId，初始值由 ref('') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const lastSentAt = ref(0);
// 声明 lastSentAt，初始值由 ref(0) 计算得到。 关键字：const＝声明不可重新绑定的变量。

const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true';
// 声明 MOCK_ONLY，初始值由 import.meta.env.VITE_MOCK_ONLY === 'true' 计算得到。 关键字：const＝声明不可重新绑定的变量；import＝导入模块或符号。

// 传送带是电平型:按钮显示的是「下次点击要执行的动作」,
// 因此取反显示。默认(未开)时显示"正转"。
const conveyorOn = ref(false);
// 声明 conveyorOn，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。

// ---------- 前置条件(现场 PLC 联锁规则的镜像,2026-10-16 确认) ----------
//
//   stopped(101) ──[获取手动]──▶ manual_mode(102)
//        ▲                          │
//        └────[释放手动]─────────────┘   释放后 PLC 自动切回 stopped(101)
//
//   - 获取手动模式 仅 stopped(101) 可用
//   - 释放手动模式 仅 manual_mode(102) 可用
//   - 传送带       仅 manual_mode(102) 可用
//   - 启动         不可在 manual_mode(102) 下用(先释放手动);init_error 下不可用
//   - 停止         除 init_error 外均可用(任何状态都能停)
//   - init_error(100) 全部禁用 —— 只能由**产线物理按钮**解除,网页永远不提供
//
// 注意:这是 UI 层的拦截,PLC 侧联锁才有最终否决权。两边都要有,不能只靠前端。
const S_INIT_ERROR = 'init_error';
// 声明 S_INIT_ERROR，初始值由 'init_error' 计算得到。 关键字：const＝声明不可重新绑定的变量。
const S_STOPPED = 'stopped';
// 声明 S_STOPPED，初始值由 'stopped' 计算得到。 关键字：const＝声明不可重新绑定的变量。
const S_MANUAL = 'manual_mode';
// 声明 S_MANUAL，初始值由 'manual_mode' 计算得到。 关键字：const＝声明不可重新绑定的变量。

const lineState = computed(() => status.value?.state);
// 声明 lineState，初始值由 computed(() => status.value?.state) 计算得到。 关键字：const＝声明不可重新绑定的变量。
const initError = computed(() => lineState.value === S_INIT_ERROR);
// 声明 initError，初始值由 computed(() => lineState.value === S_INIT_ERROR) 计算得到。 关键字：const＝声明不可重新绑定的变量。

/** 某个指令当前是否可点。action 只对 mode_set 有意义 */
function can(type: CmdType, action?: string): boolean {
// 定义函数 can。 关键字：function＝定义函数。
  if (initError.value) return false;
  // 判断 if (initError.value) return false; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。
  switch (type) {
  // 控制分支、循环或异常处理流程。 关键字：switch＝按值分派分支。
    case 'stop':
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支。
      return true;
      // 返回 true 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
    case 'start':
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支。
      // 手动模式里不让启动:必须先释放手动回到停止状态
      return lineState.value !== S_MANUAL;
      // 返回 lineState.value !== S_MANUAL 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    case 'mode_set':
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支。
      return action === 'release' ? lineState.value === S_MANUAL
      // 返回 action === 'release' ? lineState.value === S_MANUAL 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
                                  : lineState.value === S_STOPPED;
                                  // 继续当前表达式；这一行的值由外层代码块或调用使用。
    case 'conveyor':
    // 控制分支、循环或异常处理流程。 关键字：case＝匹配一个分支。
      return lineState.value === S_MANUAL;
      // 返回 lineState.value === S_MANUAL 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
    default:
    // 设置字段 default。 关键字：default＝指定默认导出或默认分支。
      return false;
      // 返回 false 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

/** 不满足前置条件时的一句话原因,给操作员看;都可用时返回空串 */
const gateHint = computed(() => {
// 声明 gateHint，初始值由 computed(() => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (initError.value) {
  // 判断 if (initError.value) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return '产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。';
    // 返回 '产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  if (lineState.value === S_MANUAL) {
  // 判断 if (lineState.value === S_MANUAL) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return '手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。';
    // 返回 '手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  if (lineState.value === S_STOPPED) {
  // 判断 if (lineState.value === S_STOPPED) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return '停止状态:可「获取手动模式」或「启动」。';
    // 返回 '停止状态:可「获取手动模式」或「启动」。' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  if (lineState.value === undefined) {
  // 判断 if (lineState.value === undefined) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值。
    return '尚未收到产线状态,指令暂不可用。';
    // 返回 '尚未收到产线状态,指令暂不可用。' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  return '';
  // 返回 '' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
});
// 结束当前回调或对象，并完成外层函数调用。

/** 二次确认文案(type → 提示) */
const CONFIRM_PROMPT: Record<CmdType, string> = {
// 声明 CONFIRM_PROMPT，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  start:    '确认向产线发送「启动」指令?\n这会让 PLC 真正动作,产线状态跳转到「等待入料」。',
  // 设置字段 start。
  stop:     '确认向产线发送「停止」指令?\n这会中断当前作业并切换到停止状态。',
  // 设置字段 stop。
  mode_set: '确认切换手动模式?\nPLC 侧:写 1 = 获取手动,写 2 = 释放手动;PLC 切换完成后自行清零该位。',
  // 设置字段 mode_set。
  conveyor: '确认操作传送带?\nPLC 侧:写 1 = 正转,写 0 = 停止(电平型,持续有效)。',
  // 设置字段 conveyor。
};
// 结束当前对象或代码块，并完成这条语句。

let offAck: (() => void) | null = null;
// 声明 offAck，初始值由 > void) | null = null 计算得到。 关键字：let＝声明可重新赋值的变量；void＝表示没有返回值；null＝空值。

onMounted(() => {
// 调用 onMounted；括号中的表达式是传入的参数。
  offAck = onCommandAck((ack: CommandAck) => {
  // 把右侧表达式的结果写入 offAck。
    if (ack.cmdId !== currentCmdId.value) return;
    // 判断 if (ack.cmdId !== currentCmdId.value) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    if (ack.status === 'acked') {
    // 判断 if (ack.status === 'acked') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      state.value = 'acked'; stateMsg.value = '已执行 ✓';
      // 把右侧表达式的结果写入 state.value。
      // 传送带是电平型,成功后同步按钮显示
      if (pendingType.value === 'conveyor') {
      // 判断 if (pendingType.value === 'conveyor') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        conveyorOn.value = pendingAction.value === 'forward';
        // 把右侧表达式的结果写入 conveyorOn.value。
      }
      // 结束当前对象、函数或条件代码块。
    } else if (ack.status === 'timeout') {
    // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
      state.value = 'timeout'; stateMsg.value = '超时(15s 无回执)';
      // 把右侧表达式的结果写入 state.value。
    } else {
    // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支。
      state.value = 'rejected';
      // 把右侧表达式的结果写入 state.value。
      stateMsg.value = `被拒:${ack.message || ack.status}`;
      // 把右侧表达式的结果写入 stateMsg.value。
    }
    // 结束当前对象、函数或条件代码块。
    scheduleReset();
    // 调用 scheduleReset；括号中的表达式是传入的参数。
  });
  // 结束当前回调或对象，并完成外层函数调用。
});
// 结束当前回调或对象，并完成外层函数调用。

// 记录本次在途指令,供 ack 时判断是哪个按钮
const pendingType = ref<string>('');
// 声明 pendingType，初始值由 ref<string>('') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const pendingAction = ref<string>('');
// 声明 pendingAction，初始值由 ref<string>('') 计算得到。 关键字：const＝声明不可重新绑定的变量。

onBeforeUnmount(() => { offAck?.(); });
// 调用 onBeforeUnmount；括号中的表达式是传入的参数。

// 收到 ack(或失败)→ 2.5s 后回 idle,让用户看到结果
let resetTimer: ReturnType<typeof setTimeout> | null = null;
// 声明 resetTimer，初始值由 null 计算得到。 关键字：let＝声明可重新赋值的变量；typeof＝读取值的运行时类型；null＝空值。
function scheduleReset() {
// 定义函数 scheduleReset。 关键字：function＝定义函数。
  if (resetTimer) clearTimeout(resetTimer);
  // 判断 if (resetTimer) clearTimeout(resetTimer); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
  resetTimer = setTimeout(() => {
  // 把右侧表达式的结果写入 resetTimer。
    state.value = 'idle'; stateMsg.value = ''; currentCmdId.value = '';
    // 把右侧表达式的结果写入 state.value。
  }, 2500);
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

async function confirm(type: CmdType, params?: Record<string, unknown>) {
// 定义函数 confirm。 关键字：async＝声明异步函数；function＝定义函数；unknown＝需检查后才能使用的类型。
  if (state.value !== 'idle') return;
  // 判断 if (state.value !== 'idle') return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  // 双保险:按钮已按 can() 禁用,但点击瞬间产线状态可能刚变(比如别处刚发了指令),
  // 这里再挡一次,避免把明显违反联锁的指令发到 PLC。
  const action = (params ?? {}).action as string | undefined;
  // 声明 action，初始值由 (params ?? {}).action as string | undefined 计算得到。 关键字：const＝声明不可重新绑定的变量；undefined＝未定义值。
  if (!can(type, action)) {
  // 判断 if (!can(type, action)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    ElMessage.warning(`当前产线状态不允许该指令。${gateHint.value}`);
    // 调用 ElMessage.warning，把括号中的值作为参数传入。
    return;
    // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    await ElMessageBox.confirm(CONFIRM_PROMPT[type], '下发控制指令', {
    // 调用 ElMessageBox.confirm，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
      confirmButtonText: '确认下发', cancelButtonText: '取消', type: 'warning',
      // 设置字段 confirmButtonText。 关键字：type＝定义类型别名。
    });
    // 结束当前回调或对象，并完成外层函数调用。
  } catch { return; /* 用户取消 */ }
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常；return＝返回结果并结束当前函数。

  pendingType.value = type;
  // 把右侧表达式的结果写入 pendingType.value。 关键字：type＝定义类型别名。
  pendingAction.value = String((params ?? {}).action ?? '');
  // 把右侧表达式的结果写入 pendingAction.value。
  state.value = 'sending';
  // 把右侧表达式的结果写入 state.value。
  stateMsg.value = '下发中…';
  // 把右侧表达式的结果写入 stateMsg.value。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    const r = await apiSendCommand(lineId, { deviceId: deviceId.value, type, params });
    // 声明 r，初始值由 await apiSendCommand(lineId, { deviceId: deviceId.value, type, params }) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    if (!r.ok || !r.cmdId) {
    // 判断 if (!r.ok || !r.cmdId) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      state.value = 'failed';
      // 把右侧表达式的结果写入 state.value。
      stateMsg.value = `服务端拒绝:${r.error || '未知错误'}`;
      // 把右侧表达式的结果写入 stateMsg.value。
      scheduleReset();
      // 调用 scheduleReset；括号中的表达式是传入的参数。
      return;
      // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。
    currentCmdId.value = r.cmdId;
    // 把右侧表达式的结果写入 currentCmdId.value。
    lastSentAt.value = Date.now();
    // 把右侧表达式的结果写入 lastSentAt.value。
    state.value = 'sent';
    // 把右侧表达式的结果写入 state.value。
    stateMsg.value = `已发送(${r.cmdId.slice(0, 8)}…)`;
    // 把右侧表达式的结果写入 stateMsg.value。
    // mock 演示模式:本地模拟 300ms 后 acked(无真 socket 推送)
    if (MOCK_ONLY) {
    // 判断 if (MOCK_ONLY) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      setTimeout(() => {
      // 调用 setTimeout；括号中的表达式是传入的参数。
        if (currentCmdId.value === r.cmdId) {
        // 判断 if (currentCmdId.value === r.cmdId) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
          state.value = 'acked';
          // 把右侧表达式的结果写入 state.value。
          stateMsg.value = 'mock:已执行 ✓';
          // 把右侧表达式的结果写入 stateMsg.value。
          scheduleReset();
          // 调用 scheduleReset；括号中的表达式是传入的参数。
        }
        // 结束当前对象、函数或条件代码块。
      }, 300);
      // 结束当前对象、函数或条件代码块。
    }
    // 结束当前对象、函数或条件代码块。
    // 15s 没收到 ack → 视为超时(契约 §5 第 4 条)
    setTimeout(() => {
    // 调用 setTimeout；括号中的表达式是传入的参数。
      if (currentCmdId.value === r.cmdId && state.value === 'sent') {
      // 判断 if (currentCmdId.value === r.cmdId && state.value === 'sent') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        state.value = 'timeout';
        // 把右侧表达式的结果写入 state.value。
        stateMsg.value = '超时(15s 无回执)';
        // 把右侧表达式的结果写入 stateMsg.value。
        scheduleReset();
        // 调用 scheduleReset；括号中的表达式是传入的参数。
      }
      // 结束当前对象、函数或条件代码块。
    }, 15000);
    // 结束当前对象、函数或条件代码块。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    state.value = 'failed';
    // 把右侧表达式的结果写入 state.value。
    stateMsg.value = (e as Error).message || '下发失败';
    // 把右侧表达式的结果写入 stateMsg.value。
    scheduleReset();
    // 调用 scheduleReset；括号中的表达式是传入的参数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
.ctrl-btns { display: flex; flex-direction: column; gap: 6px; }
/* display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=6px：设置子元素间距。 */
.ctrl-title {
/* 对选择器 .ctrl-title 匹配的元素应用后续声明。 */
  font-size: 11px; color: var(--text-dim);
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
  text-transform: uppercase; letter-spacing: 0.5px;
  /* text-transform=uppercase：设置该样式属性；letter-spacing=0.5px：设置该样式属性。 */
  margin-bottom: 2px;
  /* margin-bottom=2px：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.ctrl-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
/* display=flex：决定元素如何布局或显示；gap=6px：设置子元素间距；align-items=center：控制交叉轴上的对齐方式；flex-wrap=wrap：设置该样式属性。 */
.ctrl-note { font-size: 10px; color: var(--text-dim); opacity: 0.75; }
/* font-size=10px：设置字号；color=var(--text-dim)：设置文字颜色；opacity=0.75：设置透明度。 */

.ctrl-reason {
/* 对选择器 .ctrl-reason 匹配的元素应用后续声明。 */
  font-size: 11px; color: var(--text-dim); line-height: 1.5;
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；line-height=1.5：设置行高。 */
  padding: 4px 6px; border-radius: 4px;
  /* padding=4px 6px：设置内边距；border-radius=4px：设置圆角。 */
  background: rgba(255,255,255,0.02);
  /* background=rgba(255,255,255,0.02)：设置背景。 */
}
/* 结束样式块或续写样式声明。 */
.ctrl-reason:empty { display: none; }
/* ctrl-reason=empty { display: none：设置该样式属性。 */

.ctrl-state {
/* 对选择器 .ctrl-state 匹配的元素应用后续声明。 */
  margin-top: 6px; padding: 4px 6px;
  /* margin-top=6px：设置该样式属性；padding=4px 6px：设置内边距。 */
  border-radius: 4px;
  /* border-radius=4px：设置圆角。 */
  display: flex; align-items: center; gap: 6px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=6px：设置子元素间距。 */
  font-size: 11px;
  /* font-size=11px：设置字号。 */
}
/* 结束样式块或续写样式声明。 */
.ctrl-state .dot {
/* 对选择器 .ctrl-state .dot 匹配的元素应用后续声明。 */
  width: 6px; height: 6px; border-radius: 50%;
  /* width=6px：设置宽度；height=6px：设置高度；border-radius=50%：设置圆角。 */
}
/* 结束样式块或续写样式声明。 */
.ctrl-state.sending { background: rgba(59,130,246,0.15); color: #93c5fd; }
/* background=rgba(59,130,246,0.15)：设置背景；color=#93c5fd：设置文字颜色。 */
.ctrl-state.sending .dot { background: #3b82f6; }
/* background=#3b82f6：设置背景。 */
.ctrl-state.sent { background: rgba(245,158,11,0.12); color: #fcd34d; }
/* background=rgba(245,158,11,0.12)：设置背景；color=#fcd34d：设置文字颜色。 */
.ctrl-state.sent .dot { background: #f59e0b; }
/* background=#f59e0b：设置背景。 */
.ctrl-state.acked { background: rgba(34,197,94,0.12); color: #86efac; }
/* background=rgba(34,197,94,0.12)：设置背景；color=#86efac：设置文字颜色。 */
.ctrl-state.acked .dot { background: #22c55e; }
/* background=#22c55e：设置背景。 */
.ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout {
/* 对选择器 .ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout 匹配的元素应用后续声明。 */
  background: rgba(239,68,68,0.12); color: #fca5a5;
  /* background=rgba(239,68,68,0.12)：设置背景；color=#fca5a5：设置文字颜色。 */
}
/* 结束样式块或续写样式声明。 */
.ctrl-state.rejected .dot,
/* 结束样式块或续写样式声明。 */
.ctrl-state.failed .dot,
/* 结束样式块或续写样式声明。 */
.ctrl-state.timeout .dot { background: #ef4444; }
/* background=#ef4444：设置背景。 */
.ctrl-state .msg { font-variant-numeric: tabular-nums; }
/* font-variant-numeric=tabular-nums：设置该样式属性。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->