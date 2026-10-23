# web/src/views/TwinView.vue 逐行说明

[打开源码](../../../../../web/src/views/TwinView.vue) · 186 行 · 74 行待说明代码

只列出 `<script>` 与 `<style>` 中的源码；`<template>` 按要求排除。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 61 | <code>&lt;script setup lang="ts"&gt;</code> | 开始 Vue 组件的 TypeScript 逻辑区域。 |
| 62 | <code>import { onBeforeUnmount, onMounted, ref, watch } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 63 | <code>import { WarningFilled } from '@element-plus/icons-vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 64 | <code>import { useLineData } from '../composables/useLineData';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 65 | <code>import { useAuthStore } from '../stores/auth';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 66 | <code>import { SceneManager } from '../three/SceneManager';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 67 | <code>import { RobotArm } from '../three/RobotArm';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 68 | <code>import IoPanel from '../components/IoPanel.vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 69 | <code>import ControlButtons from '../components/ControlButtons.vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 71 | <code>const { robot, connected } = useLineData();</code> | 续写当前表达式、对象、类型或调用。 关键字：`const`＝声明不可重新绑定的变量。 |
| 72 | <code>const auth = useAuthStore();</code> | 声明变量 `auth` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 79 | <code>const host = ref&lt;HTMLElement&gt;();</code> | 声明变量 `host` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 81 | <code>let scene: SceneManager &#124; null = null;</code> | 声明变量 `scene` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。 |
| 83 | <code>let arm: RobotArm &#124; null = null;</code> | 声明变量 `arm` 并设置初始值或类型。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。 |
| 85 | <code>onMounted(() =&gt; {</code> | 定义或调用 `onMounted`，参数由括号给出。 |
| 87 | <code>if (!host.value) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 89 | <code>scene = new SceneManager(host.value);</code> | 调用函数、设置值或更新状态。 关键字：`new`＝创建对象实例。 |
| 91 | <code>arm = new RobotArm();</code> | 调用函数、设置值或更新状态。 关键字：`new`＝创建对象实例。 |
| 93 | <code>scene.add(arm.group);</code> | 调用函数、设置值或更新状态。 |
| 95 | <code>scene.start();</code> | 调用函数、设置值或更新状态。 |
| 96 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 102 | <code>onBeforeUnmount(() =&gt; {</code> | 定义或调用 `onBeforeUnmount`，参数由括号给出。 |
| 103 | <code>scene?.dispose();</code> | 调用函数、设置值或更新状态。 |
| 104 | <code>scene = null;</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 105 | <code>arm = null;</code> | 调用函数、设置值或更新状态。 关键字：`null`＝空值。 |
| 106 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 113 | <code>watch(robot, (r) =&gt; {</code> | 定义或调用 `watch`，参数由括号给出。 |
| 115 | <code>if (!r &#124;&#124; !arm) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。 |
| 117 | <code>arm.setJoints(r.joints);</code> | 调用函数、设置值或更新状态。 |
| 119 | <code>arm.setAlarm(r.alarmCode !== 0);</code> | 调用函数、设置值或更新状态。 |
| 120 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 127 | <code>function markerPos(deg: number) {</code> | 定义函数 `markerPos`。 关键字：`function`＝定义函数。 |
| 129 | <code>const pct = ((deg + 180) / 360) * 100;</code> | 声明变量 `pct` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 131 | <code>return `${Math.min(100, Math.max(0, pct))}%`;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 132 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 133 | <code>&lt;/script&gt;</code> | 结束 Vue 组件的逻辑区域。 |
| 135 | <code>&lt;style scoped&gt;</code> | 开始 Vue 组件的局部样式区域。 |
| 137 | <code>.twin-wrap { position: relative; width: 100%; height: 100%; border-radius: 10px; overflow: hidden; }</code> | 为选择器 `.twin-wrap` 设置同一行列出的样式属性。 |
| 139 | <code>.canvas-host { position: absolute; inset: 0; }</code> | 为选择器 `.canvas-host` 设置同一行列出的样式属性。 |
| 142 | <code>.overlay { position: absolute; top: 14px; width: 240px; z-index: 5; }</code> | 为选择器 `.overlay` 设置同一行列出的样式属性。 |
| 143 | <code>.overlay.left { left: 14px; }</code> | 为选择器 `.overlay.left` 设置同一行列出的样式属性。 |
| 146 | <code>.joints { display: flex; flex-direction: column; gap: 8px; }</code> | 为选择器 `.joints` 设置同一行列出的样式属性。 |
| 147 | <code>.joint-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }</code> | 为选择器 `.joint-row` 设置同一行列出的样式属性。 |
| 148 | <code>.joint-label { width: 22px; color: var(--text-dim); }</code> | 为选择器 `.joint-label` 设置同一行列出的样式属性。 |
| 150 | <code>.joint-bar {</code> | 开始一个选择器或媒体规则的样式块。 |
| 151 | <code>flex: 1; height: 6px; border-radius: 3px;</code> | 设置样式属性 `flex`。 |
| 152 | <code>background: #1c2733; position: relative;</code> | 设置样式属性 `background`。 |
| 153 | <code>}</code> | 结束样式块或续写样式声明。 |
| 155 | <code>.joint-marker {</code> | 开始一个选择器或媒体规则的样式块。 |
| 156 | <code>position: absolute; top: -2px; width: 3px; height: 10px;</code> | 设置样式属性 `position`。 |
| 157 | <code>background: var(--accent); border-radius: 2px;</code> | 设置样式属性 `background`。 |
| 158 | <code>transform: translateX(-50%);</code> | 设置样式属性 `transform`。 |
| 159 | <code>transition: left 80ms linear;</code> | 设置样式属性 `transition`。 |
| 160 | <code>box-shadow: 0 0 6px var(--accent);</code> | 设置样式属性 `box-shadow`。 |
| 161 | <code>}</code> | 结束样式块或续写样式声明。 |
| 162 | <code>.joint-deg { width: 58px; text-align: right; font-variant-numeric: tabular-nums; }</code> | 为选择器 `.joint-deg` 设置同一行列出的样式属性。 |
| 165 | <code>.meta {</code> | 开始一个选择器或媒体规则的样式块。 |
| 166 | <code>margin-top: 10px; padding-top: 8px;</code> | 设置样式属性 `margin-top`。 |
| 167 | <code>border-top: 1px dashed var(--panel-border);</code> | 设置样式属性 `border-top`。 |
| 168 | <code>display: flex; justify-content: space-between;</code> | 设置样式属性 `display`。 |
| 169 | <code>font-size: 12px; color: var(--text-dim);</code> | 设置样式属性 `font-size`。 |
| 170 | <code>}</code> | 结束样式块或续写样式声明。 |
| 173 | <code>.hint {</code> | 开始一个选择器或媒体规则的样式块。 |
| 174 | <code>position: absolute; left: 14px; bottom: 10px;</code> | 设置样式属性 `position`。 |
| 175 | <code>font-size: 11px; color: var(--text-dim); opacity: 0.7;</code> | 设置样式属性 `font-size`。 |
| 176 | <code>}</code> | 结束样式块或续写样式声明。 |
| 179 | <code>.lost {</code> | 开始一个选择器或媒体规则的样式块。 |
| 180 | <code>position: absolute; inset: 0; z-index: 10;</code> | 设置样式属性 `position`。 |
| 181 | <code>display: flex; align-items: center; justify-content: center; gap: 8px;</code> | 设置样式属性 `display`。 |
| 182 | <code>background: rgba(11, 15, 20, 0.7); backdrop-filter: blur(2px);</code> | 设置样式属性 `background`。 |
| 183 | <code>color: var(--warn); font-size: 14px;</code> | 设置样式属性 `color`。 |
| 184 | <code>}</code> | 结束样式块或续写样式声明。 |
| 185 | <code>.lost-icon { font-size: 20px; }</code> | 为选择器 `.lost-icon` 设置同一行列出的样式属性。 |
| 186 | <code>&lt;/style&gt;</code> | 结束 Vue 组件的样式区域。 |
