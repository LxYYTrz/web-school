<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
  <div class="panel overlay right">
  <!-- 渲染容器，应用 panel overlay right 样式类。 -->
    <div class="panel-title">
    <!-- 渲染容器，应用 panel-title 样式类。 -->
      <span>产线 LINE-01</span>
      <!-- 渲染行内文字。 -->
      <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
      <!-- 渲染状态标签，条件成立时显示（status）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->
        {{ statusText }}
        <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </el-tag>
      <!-- 结束 el-tag 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <!-- 报警灯:alarmCode > 0,或产线处于 alarm / init_error 时红色脉冲 -->
    <div v-if="alarmOn" class="alarm-row">
    <!-- 渲染容器，应用 alarm-row 样式类，条件成立时显示（alarmOn）。 关键字：v-if＝条件为真时才渲染。 -->
      <span class="alarm-light" :class="{ pulse: true }" />
      <!-- 渲染行内文字，应用 alarm-light 样式类。 关键字：:＝属性动态绑定的简写。 -->
      <span class="alarm-text">{{ alarmText || `产线异常(${statusText})` }}</span>
      <!-- 渲染行内文字，应用 alarm-text 样式类，其中显示 alarmText || 产线异常(${statusText}) 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <!-- I/O 信号灯矩阵:现场 17 word 表提供产线状态、6 轴关节与 6 路 IO -->
    <div v-if="status || robot" class="io-grid">
    <!-- 渲染容器，应用 io-grid 样式类，条件成立时显示（status || robot）。 关键字：v-if＝条件为真时才渲染。 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="modeDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
        <span class="io-label">模式</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ robot?.mode ?? '—' }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 robot?.mode ?? '—' 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="runDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
        <span class="io-label">状态</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ runText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 runText 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="edgeDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
        <span class="io-label">边缘</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ edgeText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 edgeText 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
        <span class="io-dot" :class="alarmDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
        <span class="io-label">报警</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <span class="io-val">{{ alarmCodeText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 alarmCodeText 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <!-- 六轴关节角(现场 PLC 唯一上送的机器人数据) -->
    <div v-if="joints.length" class="joints">
    <!-- 渲染容器，应用 joints 样式类，条件成立时显示（joints.length）。 关键字：v-if＝条件为真时才渲染。 -->
      <div class="stat" v-for="(j, i) in joints" :key="i">
      <!-- 渲染容器，应用 stat 样式类，按集合重复生成（(j, i) in joints）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
        <div class="val">{{ j === null ? '—' : j.toFixed(1) }}</div>
        <!-- 渲染容器，应用 val 样式类，其中显示 j === null ? '—' : j.toFixed(1) 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        <div class="lbl">J{{ i + 1 }}</div>
        <!-- 渲染容器，应用 lbl 样式类，其中显示 i + 1 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <!--
      注:契约里的 goodCount / ngCount / beatMs / speedPct 仍保留(只增不改),
      但现场 PLC 点位表未提供这些实测值,edge 输出默认值 0 —— 展示出来只会
      误导成"真实计数为 0",故已从面板移除(2026-10-23)。
    -->

    <div class="meta">
    <!-- 渲染容器，应用 meta 样式类。 -->
      <span>程序 {{ robot?.program || '—' }}</span>
      <!-- 渲染行内文字，其中显示 robot?.program || '—' 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      <span>产品 {{ status?.productCode || '—' }}</span>
      <!-- 渲染行内文字，其中显示 status?.productCode || '—' 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <el-empty v-if="!status && !robot" description="切换实时数据…" :image-size="50" />
    <!-- 渲染el-empty 元素或组件，条件成立时显示（!status && !robot）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->

    <!-- 控制按钮区(level >= 2 才渲染;由父级传 isAdminOrL2 控制) -->
    <div v-if="canCommand" class="ctrl-slot">
    <!-- 渲染容器，应用 ctrl-slot 样式类，条件成立时显示（canCommand）。 关键字：v-if＝条件为真时才渲染。 -->
      <slot name="controls" />
      <!-- 渲染slot 元素或组件。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { computed } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { stateText, stateTagType as tagTypeOf, isRunning } from '../services/lineState';
// 从 ../services/lineState 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

defineProps<{ canCommand: boolean }>();
// 继续当前表达式；这一行的值由外层代码块或调用使用。
const { robot, status, edgeText, alarmText, edgeOnline } = useLineData();
// 从右侧结果中取出 robot, status, edgeText, alarmText, edgeOnline，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。

const statusText = computed(() =>
// 声明 statusText，初始值由 computed(() => 计算得到。 关键字：const＝声明不可重新绑定的变量。
  status.value ? stateText(status.value.state) : '等待中');
  // 调用 stateText；括号中的表达式是传入的参数。

const stateTagType = computed(() => tagTypeOf(status.value?.state));
// 声明 stateTagType，初始值由 computed(() => tagTypeOf(status.value?.state)) 计算得到。 关键字：const＝声明不可重新绑定的变量。

// 现场 PLC 17 word 表上送 joints[0..5]、产线状态和 6 路 IO,没有 alarmCode;
// 该字段保留在契约里(只增不改),edge 无数据时输出 0。
const alarmOn = computed(() =>
// 声明 alarmOn，初始值由 computed(() => 计算得到。 关键字：const＝声明不可重新绑定的变量。
  (robot.value?.alarmCode !== undefined && robot.value.alarmCode !== 0) ||
  // 开始当前表达式的分组或数组内容。 关键字：undefined＝未定义值。
  status.value?.state === 'alarm' ||
  // 把右侧表达式的结果写入 status.value?.state。
  status.value?.state === 'init_error',
  // 把右侧表达式的结果写入 status.value?.state。
);
// 结束当前函数的参数列表并完成调用。

const runText = computed(() => status.value ? statusText.value : '—');
// 声明 runText，初始值由 computed(() => status.value ? statusText.value : '—') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const runDot = computed(() => {
// 声明 runDot，初始值由 computed(() => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const s = status.value?.state;
  // 声明 s，初始值由 status.value?.state 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (isRunning(s)) return 'ok';
  // 判断 if (isRunning(s)) return 'ok'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  if (s === 'alarm' || s === 'init_error') return 'ng';
  // 判断 if (s === 'alarm' || s === 'init_error') return 'ng'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  if (s === 'offline') return 'warn';
  // 判断 if (s === 'offline') return 'warn'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  return 'idle';
  // 返回 'idle' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
});
// 结束当前回调或对象，并完成外层函数调用。

const modeDot = computed(() => {
// 声明 modeDot，初始值由 computed(() => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const m = robot.value?.mode;
  // 声明 m，初始值由 robot.value?.mode 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (m === 'auto') return 'ok';
  // 判断 if (m === 'auto') return 'ok'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  if (m === 'manual') return 'warn';
  // 判断 if (m === 'manual') return 'warn'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  if (m === 'error') return 'ng';
  // 判断 if (m === 'error') return 'ng'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  return 'idle';
  // 返回 'idle' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
});
// 结束当前回调或对象，并完成外层函数调用。

const alarmDot = computed(() => alarmOn.value ? 'ng' : 'ok');
// 声明 alarmDot，初始值由 computed(() => alarmOn.value ? 'ng' : 'ok') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const alarmCodeText = computed(() =>
// 声明 alarmCodeText，初始值由 computed(() => 计算得到。 关键字：const＝声明不可重新绑定的变量。
  robot.value?.alarmCode ? `#${robot.value.alarmCode}` : '无',
  // 继续当前表达式；这一行的值由外层代码块或调用使用。
);
// 结束当前函数的参数列表并完成调用。

const edgeDot = computed(() => {
// 声明 edgeDot，初始值由 computed(() => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (edgeOnline.value === null) return 'idle';
  // 判断 if (edgeOnline.value === null) return 'idle'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；null＝空值；return＝返回结果并结束当前函数。
  return edgeOnline.value ? 'ok' : 'ng';
  // 返回 edgeOnline.value ? 'ok' : 'ng' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
});
// 结束当前回调或对象，并完成外层函数调用。

// 六轴关节角:现场 PLC 唯一上送的机器人数据(word 0..5,÷10 还原)
const joints = computed<(number | null)[]>(() => {
// 声明 joints，初始值由 computed<(number | null)[]>(() => { 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  const j = robot.value?.joints;
  // 声明 j，初始值由 robot.value?.joints 计算得到。 关键字：const＝声明不可重新绑定的变量。
  return Array.isArray(j) ? j.slice(0, 6) : [];
  // 返回 Array.isArray(j) ? j.slice(0, 6) : [] 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
});
// 结束当前回调或对象，并完成外层函数调用。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
.panel.overlay.right {
/* 对选择器 .panel.overlay.right 匹配的元素应用后续声明。 */
  position: absolute;
  /* position=absolute：设置定位方式。 */
  top: 14px;
  /* top=14px：设置该样式属性。 */
  right: 14px;
  /* right=14px：设置该样式属性。 */
  width: 260px;
  /* width=260px：设置宽度。 */
  z-index: 5;
  /* z-index=5：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.panel-title {
/* 对选择器 .panel-title 匹配的元素应用后续声明。 */
  display: flex; align-items: center; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=space-between：控制主轴上的分布方式。 */
  font-size: 13px; color: var(--text); margin-bottom: 8px;
  /* font-size=13px：设置字号；color=var(--text)：设置文字颜色；margin-bottom=8px：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */

/* 报警行(脉冲红点) */
.alarm-row {
/* 对选择器 .alarm-row 匹配的元素应用后续声明。 */
  display: flex; align-items: center; gap: 8px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距。 */
  padding: 6px 8px; margin-bottom: 8px;
  /* padding=6px 8px：设置内边距；margin-bottom=8px：设置该样式属性。 */
  background: rgba(220, 38, 38, 0.12);
  /* background=rgba(220, 38, 38, 0.12)：设置背景。 */
  border: 1px solid rgba(220, 38, 38, 0.4);
  /* border=1px solid rgba(220, 38, 38, 0.4)：设置边框。 */
  border-radius: 6px;
  /* border-radius=6px：设置圆角。 */
}
/* 结束样式块或续写样式声明。 */
.alarm-light {
/* 对选择器 .alarm-light 匹配的元素应用后续声明。 */
  width: 10px; height: 10px; border-radius: 50%;
  /* width=10px：设置宽度；height=10px：设置高度；border-radius=50%：设置圆角。 */
  background: #ef4444; box-shadow: 0 0 8px #ef4444;
  /* background=#ef4444：设置背景；box-shadow=0 0 8px #ef4444：设置阴影。 */
}
/* 结束样式块或续写样式声明。 */
.alarm-light.pulse { animation: pulse 1s infinite; }
/* animation=pulse 1s infinite：设置该样式属性。 */
.alarm-text { font-size: 12px; color: #fca5a5; }
/* font-size=12px：设置字号；color=#fca5a5：设置文字颜色。 */
@keyframes pulse {
/* 对选择器 @keyframes pulse 匹配的元素应用后续声明。 */
  0%, 100% { opacity: 1; }
  /* opacity=1：设置透明度。 */
  50% { opacity: 0.35; }
  /* opacity=0.35：设置透明度。 */
}
/* 结束样式块或续写样式声明。 */

/* I/O 灯矩阵 */
.io-grid {
/* 对选择器 .io-grid 匹配的元素应用后续声明。 */
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  /* display=grid：决定元素如何布局或显示；grid-template-columns=1fr 1fr：定义网格列布局；gap=6px：设置子元素间距。 */
  padding: 6px 0; margin-bottom: 6px;
  /* padding=6px 0：设置内边距；margin-bottom=6px：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.io-cell {
/* 对选择器 .io-cell 匹配的元素应用后续声明。 */
  display: flex; align-items: center; gap: 6px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=6px：设置子元素间距。 */
  font-size: 11px;
  /* font-size=11px：设置字号。 */
  padding: 4px 6px;
  /* padding=4px 6px：设置内边距。 */
  background: rgba(255,255,255,0.02);
  /* background=rgba(255,255,255,0.02)：设置背景。 */
  border-radius: 4px;
  /* border-radius=4px：设置圆角。 */
}
/* 结束样式块或续写样式声明。 */
.io-dot {
/* 对选择器 .io-dot 匹配的元素应用后续声明。 */
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  /* width=8px：设置宽度；height=8px：设置高度；border-radius=50%：设置圆角；flex-shrink=0：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.io-dot.ok   { background: #22c55e; box-shadow: 0 0 4px #22c55e; }
/* background=#22c55e：设置背景；box-shadow=0 0 4px #22c55e：设置阴影。 */
.io-dot.ng   { background: #ef4444; box-shadow: 0 0 4px #ef4444; }
/* background=#ef4444：设置背景；box-shadow=0 0 4px #ef4444：设置阴影。 */
.io-dot.warn { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; }
/* background=#f59e0b：设置背景；box-shadow=0 0 4px #f59e0b：设置阴影。 */
.io-dot.idle { background: #475569; }
/* background=#475569：设置背景。 */
.io-label { color: var(--text-dim); width: 28px; }
/* color=var(--text-dim)：设置文字颜色；width=28px：设置宽度。 */
.io-val { color: var(--text); font-weight: 500; }
/* color=var(--text)：设置文字颜色；font-weight=500：设置字重。 */

/* 六轴关节角 */
.joints { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; text-align: center; padding: 6px 0; }
/* display=grid：决定元素如何布局或显示；grid-template-columns=repeat(6, 1fr)：定义网格列布局；gap=4px：设置子元素间距；text-align=center：设置该样式属性；padding=6px 0：设置内边距。 */
.joints .val { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--accent); }
/* font-size=13px：设置字号；font-weight=600：设置字重；font-variant-numeric=tabular-nums：设置该样式属性；color=var(--accent)：设置文字颜色。 */
.joints .lbl { font-size: 9px; color: var(--text-dim); margin-top: 1px; }
/* font-size=9px：设置字号；color=var(--text-dim)：设置文字颜色；margin-top=1px：设置该样式属性。 */

/* 数值字段样式已随 良品/不良/节拍/倍率 一同移除 */

.meta {
/* 对选择器 .meta 匹配的元素应用后续声明。 */
  margin-top: 8px; padding-top: 6px;
  /* margin-top=8px：设置该样式属性；padding-top=6px：设置该样式属性。 */
  border-top: 1px dashed var(--panel-border);
  /* border-top=1px dashed var(--panel-border)：设置该样式属性。 */
  display: flex; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；justify-content=space-between：控制主轴上的分布方式。 */
  font-size: 11px; color: var(--text-dim);
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
}
/* 结束样式块或续写样式声明。 */

.ctrl-slot {
/* 对选择器 .ctrl-slot 匹配的元素应用后续声明。 */
  margin-top: 10px; padding-top: 10px;
  /* margin-top=10px：设置该样式属性；padding-top=10px：设置该样式属性。 */
  border-top: 1px dashed var(--panel-border);
  /* border-top=1px dashed var(--panel-border)：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
