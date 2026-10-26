# web/src/views/TwinView.vue 逐行注释

[打开源码](../../../../../web/src/views/TwinView.vue) · 186 行 · 112 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 5 行**

```text
<template>
<!-- 注释：开始 Vue 模板，定义组件渲染的内容。 -->
```

**源码第 6 行**

```text
  <div class="twin-wrap">
<!-- 注释：渲染容器，应用 twin-wrap 样式类。 -->
```

**源码第 8 行**

```text
    <div ref="host" class="canvas-host" />
<!-- 注释：渲染容器，应用 canvas-host 样式类。 -->
```

**源码第 11 行**

```text
    <div class="panel overlay left">
<!-- 注释：渲染容器，应用 panel overlay left 样式类。 -->
```

**源码第 12 行**

```text
      <div class="panel-title">
<!-- 注释：渲染容器，应用 panel-title 样式类。 -->
```

**源码第 13 行**

```text
        <span>机器人 ROBOT-01</span>
<!-- 注释：渲染行内文字。 -->
```

**源码第 15 行**

```text
        <el-tag v-if="robot" size="small" effect="plain"
<!-- 注释：渲染状态标签，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。 -->
```

**源码第 16 行**

```text
          :type="robot.alarmCode ? 'danger' : 'success'">
<!-- 注释：设置 :type=robot.alarmCode ? ：选择组件外观或字段类型。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 17 行**

```text
          {{ robot.alarmCode ? `报警 #${robot.alarmCode}` : robot.mode }}
<!-- 注释：显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 18 行**

```text
        </el-tag>
<!-- 注释：结束 el-tag 元素及其中的内容。 -->
```

**源码第 19 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 22 行**

```text
      <div v-if="robot" class="joints">
<!-- 注释：渲染容器，应用 joints 样式类，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。 -->
```

**源码第 24 行**

```text
        <div v-for="(deg, i) in robot.joints" :key="i" class="joint-row">
<!-- 注释：渲染容器，应用 joint-row 样式类，按集合重复生成（(deg, i) in robot.joints）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
```

**源码第 25 行**

```text
          <span class="joint-label">J{{ i + 1 }}</span>
<!-- 注释：渲染行内文字，应用 joint-label 样式类，其中显示 i + 1 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 27 行**

```text
          <div class="joint-bar">
<!-- 注释：渲染容器，应用 joint-bar 样式类。 -->
```

**源码第 28 行**

```text
            <div class="joint-marker" :style="{ left: markerPos(deg) }" />
<!-- 注释：渲染容器，应用 joint-marker 样式类。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 29 行**

```text
          </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 30 行**

```text
          <span class="joint-deg">{{ deg.toFixed(1) }}°</span>
<!-- 注释：渲染行内文字，应用 joint-deg 样式类，其中显示 deg.toFixed(1) 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 31 行**

```text
        </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 32 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 34 行**

```text
      <el-empty v-else description="等待机器人数据…" :image-size="60" />
<!-- 注释：渲染el-empty 元素或组件。 关键字：v-else＝前面条件不成立时渲染；:＝属性动态绑定的简写。 -->
```

**源码第 37 行**

```text
      <div v-if="robot" class="meta">
<!-- 注释：渲染容器，应用 meta 样式类，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。 -->
```

**源码第 38 行**

```text
        <span>程序 {{ robot.program }}</span>
<!-- 注释：渲染行内文字，其中显示 robot.program 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 39 行**

```text
        <span>倍率 {{ robot.speedPct }}%</span>
<!-- 注释：渲染行内文字，其中显示 robot.speedPct 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
```

**源码第 40 行**

```text
      </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 41 行**

```text
    </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 44 行**

```text
    <IoPanel :can-command="auth.canCommand">
<!-- 注释：渲染IoPanel 元素或组件。 关键字：:＝属性动态绑定的简写。 -->
```

**源码第 45 行**

```text
      <template #controls>
<!-- 注释：渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
```

**源码第 46 行**

```text
        <ControlButtons />
<!-- 注释：渲染ControlButtons 元素或组件。 -->
```

**源码第 47 行**

```text
      </template>
<!-- 注释：结束当前模板或插槽内容。 -->
```

**源码第 48 行**

```text
    </IoPanel>
<!-- 注释：结束 IoPanel 元素及其中的内容。 -->
```

**源码第 51 行**

```text
    <div class="hint">拖拽旋转 · 滚轮缩放</div>
<!-- 注释：渲染容器，应用 hint 样式类。 -->
```

**源码第 54 行**

```text
    <div v-if="!connected" class="lost">
<!-- 注释：渲染容器，应用 lost 样式类，条件成立时显示（!connected）。 关键字：v-if＝条件为真时才渲染。 -->
```

**源码第 55 行**

```text
      <el-icon class="lost-icon"><WarningFilled /></el-icon>
<!-- 注释：渲染图标容器，应用 lost-icon 样式类。 -->
```

**源码第 56 行**

```text
      与服务器连接断开,正在重连…
<!-- 注释：显示该行文本内容或结束当前元素。 -->
```

**源码第 57 行**

```text
    </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 58 行**

```text
  </div>
<!-- 注释：结束 div 元素及其中的内容。 -->
```

**源码第 59 行**

```text
</template>
<!-- 注释：结束当前模板或插槽内容。 -->
```

**源码第 61 行**

```text
<script setup lang="ts">
// 注释：开始 Vue 组件的 TypeScript 逻辑区域。
```

**源码第 62 行**

```text
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
// 注释：从 vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 63 行**

```text
import { WarningFilled } from '@element-plus/icons-vue';
// 注释：从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 64 行**

```text
import { useLineData } from '../composables/useLineData';
// 注释：从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 65 行**

```text
import { useAuthStore } from '../stores/auth';
// 注释：从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 66 行**

```text
import { SceneManager } from '../three/SceneManager';
// 注释：从 ../three/SceneManager 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 67 行**

```text
import { RobotArm } from '../three/RobotArm';
// 注释：从 ../three/RobotArm 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 68 行**

```text
import IoPanel from '../components/IoPanel.vue';
// 注释：从 ../components/IoPanel.vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 69 行**

```text
import ControlButtons from '../components/ControlButtons.vue';
// 注释：从 ../components/ControlButtons.vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 71 行**

```text
const { robot, connected } = useLineData();
// 注释：从右侧结果中取出 robot, connected，分别赋给同名变量。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 72 行**

```text
const auth = useAuthStore();
// 注释：声明 auth，初始值由 useAuthStore() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 79 行**

```text
const host = ref<HTMLElement>();
// 注释：声明 host，初始值由 ref<HTMLElement>() 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 81 行**

```text
let scene: SceneManager | null = null;
// 注释：声明 scene，初始值由 null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。
```

**源码第 83 行**

```text
let arm: RobotArm | null = null;
// 注释：声明 arm，初始值由 null 计算得到。 关键字：`let`＝声明可重新赋值的变量；`null`＝空值。
```

**源码第 85 行**

```text
onMounted(() => {
// 注释：调用 onMounted；括号中的表达式是传入的参数。
```

**源码第 87 行**

```text
  if (!host.value) return;
// 注释：判断 if (!host.value) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 89 行**

```text
  scene = new SceneManager(host.value);
// 注释：把右侧表达式的结果写入 scene。 关键字：`new`＝创建对象实例。
```

**源码第 91 行**

```text
  arm = new RobotArm();
// 注释：把右侧表达式的结果写入 arm。 关键字：`new`＝创建对象实例。
```

**源码第 93 行**

```text
  scene.add(arm.group);
// 注释：调用 scene.add，把括号中的值作为参数传入。
```

**源码第 95 行**

```text
  scene.start();
// 注释：调用 scene.start，把括号中的值作为参数传入。
```

**源码第 96 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 102 行**

```text
onBeforeUnmount(() => {
// 注释：调用 onBeforeUnmount；括号中的表达式是传入的参数。
```

**源码第 103 行**

```text
  scene?.dispose();
// 注释：调用 .dispose，把括号中的值作为参数传入。
```

**源码第 104 行**

```text
  scene = null;
// 注释：把右侧表达式的结果写入 scene。 关键字：`null`＝空值。
```

**源码第 105 行**

```text
  arm = null;
// 注释：把右侧表达式的结果写入 arm。 关键字：`null`＝空值。
```

**源码第 106 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 113 行**

```text
watch(robot, (r) => {
// 注释：调用 watch；括号中的表达式是传入的参数。
```

**源码第 115 行**

```text
  if (!r || !arm) return;
// 注释：判断 if (!r || !arm) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 117 行**

```text
  arm.setJoints(r.joints);
// 注释：调用 arm.setJoints，把括号中的值作为参数传入。
```

**源码第 119 行**

```text
  arm.setAlarm(r.alarmCode !== 0);
// 注释：调用 arm.setAlarm，把括号中的值作为参数传入。
```

**源码第 120 行**

```text
});
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 127 行**

```text
function markerPos(deg: number) {
// 注释：定义函数 `markerPos`。 关键字：`function`＝定义函数。
```

**源码第 129 行**

```text
  const pct = ((deg + 180) / 360) * 100;
// 注释：声明 pct，初始值由 ((deg + 180) / 360) * 100 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 131 行**

```text
  return `${Math.min(100, Math.max(0, pct))}%`;
// 注释：返回 `${Math.min(100, Math.max(0, pct))}%` 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 132 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 133 行**

```text
</script>
// 注释：结束 Vue 组件的逻辑区域。
```

**源码第 135 行**

```text
<style scoped>
/* 注释：开始 Vue 组件的局部样式区域。 */
```

**源码第 137 行**

```text
.twin-wrap { position: relative; width: 100%; height: 100%; border-radius: 10px; overflow: hidden; }
/* 注释：position=relative：设置定位方式；width=100%：设置宽度；height=100%：设置高度；border-radius=10px：设置圆角；overflow=hidden：决定溢出内容如何处理。 */
```

**源码第 139 行**

```text
.canvas-host { position: absolute; inset: 0; }
/* 注释：position=absolute：设置定位方式；inset=0：设置该样式属性。 */
```

**源码第 142 行**

```text
.overlay { position: absolute; top: 14px; width: 240px; z-index: 5; }
/* 注释：position=absolute：设置定位方式；top=14px：设置该样式属性；width=240px：设置宽度；z-index=5：设置该样式属性。 */
```

**源码第 143 行**

```text
.overlay.left { left: 14px; }
/* 注释：left=14px：设置该样式属性。 */
```

**源码第 146 行**

```text
.joints { display: flex; flex-direction: column; gap: 8px; }
/* 注释：display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=8px：设置子元素间距。 */
```

**源码第 147 行**

```text
.joint-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
/* 注释：display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距；font-size=12px：设置字号。 */
```

**源码第 148 行**

```text
.joint-label { width: 22px; color: var(--text-dim); }
/* 注释：width=22px：设置宽度；color=var(--text-dim)：设置文字颜色。 */
```

**源码第 150 行**

```text
.joint-bar {
/* 注释：对选择器 .joint-bar 匹配的元素应用后续声明。 */
```

**源码第 151 行**

```text
  flex: 1; height: 6px; border-radius: 3px;
/* 注释：flex=1：设置弹性项的伸缩比例；height=6px：设置高度；border-radius=3px：设置圆角。 */
```

**源码第 152 行**

```text
  background: #1c2733; position: relative;
/* 注释：background=#1c2733：设置背景；position=relative：设置定位方式。 */
```

**源码第 153 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 155 行**

```text
.joint-marker {
/* 注释：对选择器 .joint-marker 匹配的元素应用后续声明。 */
```

**源码第 156 行**

```text
  position: absolute; top: -2px; width: 3px; height: 10px;
/* 注释：position=absolute：设置定位方式；top=-2px：设置该样式属性；width=3px：设置宽度；height=10px：设置高度。 */
```

**源码第 157 行**

```text
  background: var(--accent); border-radius: 2px;
/* 注释：background=var(--accent)：设置背景；border-radius=2px：设置圆角。 */
```

**源码第 158 行**

```text
  transform: translateX(-50%);
/* 注释：transform=translateX(-50%)：变换元素位置或形状。 */
```

**源码第 159 行**

```text
  transition: left 80ms linear;
/* 注释：transition=left 80ms linear：设置状态变化时的过渡。 */
```

**源码第 160 行**

```text
  box-shadow: 0 0 6px var(--accent);
/* 注释：box-shadow=0 0 6px var(--accent)：设置阴影。 */
```

**源码第 161 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 162 行**

```text
.joint-deg { width: 58px; text-align: right; font-variant-numeric: tabular-nums; }
/* 注释：width=58px：设置宽度；text-align=right：设置该样式属性；font-variant-numeric=tabular-nums：设置该样式属性。 */
```

**源码第 165 行**

```text
.meta {
/* 注释：对选择器 .meta 匹配的元素应用后续声明。 */
```

**源码第 166 行**

```text
  margin-top: 10px; padding-top: 8px;
/* 注释：margin-top=10px：设置该样式属性；padding-top=8px：设置该样式属性。 */
```

**源码第 167 行**

```text
  border-top: 1px dashed var(--panel-border);
/* 注释：border-top=1px dashed var(--panel-border)：设置该样式属性。 */
```

**源码第 168 行**

```text
  display: flex; justify-content: space-between;
/* 注释：display=flex：决定元素如何布局或显示；justify-content=space-between：控制主轴上的分布方式。 */
```

**源码第 169 行**

```text
  font-size: 12px; color: var(--text-dim);
/* 注释：font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
```

**源码第 170 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 173 行**

```text
.hint {
/* 注释：对选择器 .hint 匹配的元素应用后续声明。 */
```

**源码第 174 行**

```text
  position: absolute; left: 14px; bottom: 10px;
/* 注释：position=absolute：设置定位方式；left=14px：设置该样式属性；bottom=10px：设置该样式属性。 */
```

**源码第 175 行**

```text
  font-size: 11px; color: var(--text-dim); opacity: 0.7;
/* 注释：font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；opacity=0.7：设置透明度。 */
```

**源码第 176 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 179 行**

```text
.lost {
/* 注释：对选择器 .lost 匹配的元素应用后续声明。 */
```

**源码第 180 行**

```text
  position: absolute; inset: 0; z-index: 10;
/* 注释：position=absolute：设置定位方式；inset=0：设置该样式属性；z-index=10：设置该样式属性。 */
```

**源码第 181 行**

```text
  display: flex; align-items: center; justify-content: center; gap: 8px;
/* 注释：display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=center：控制主轴上的分布方式；gap=8px：设置子元素间距。 */
```

**源码第 182 行**

```text
  background: rgba(11, 15, 20, 0.7); backdrop-filter: blur(2px);
/* 注释：background=rgba(11, 15, 20, 0.7)：设置背景；backdrop-filter=blur(2px)：设置该样式属性。 */
```

**源码第 183 行**

```text
  color: var(--warn); font-size: 14px;
/* 注释：color=var(--warn)：设置文字颜色；font-size=14px：设置字号。 */
```

**源码第 184 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 185 行**

```text
.lost-icon { font-size: 20px; }
/* 注释：font-size=20px：设置字号。 */
```

**源码第 186 行**

```text
</style>
/* 注释：结束 Vue 组件的样式区域。 */
```
