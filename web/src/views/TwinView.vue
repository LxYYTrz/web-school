<!--
  实时孪生页：useLineData 接收机器人关节角，watch 回调将角度写入
  RobotArm.setJoints()，Three.js 在下一帧渲染新姿态。
-->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
  <div class="twin-wrap">
  <!-- 渲染容器，应用 twin-wrap 样式类。 -->
    <!-- 3D 画布容器。Three.js 会把 canvas 追加到这个 div 里 -->
    <div ref="host" class="canvas-host" />
    <!-- 渲染容器，应用 canvas-host 样式类。 -->

    <!-- 左:机器人关节实时角度 -->
    <div class="panel overlay left">
    <!-- 渲染容器，应用 panel overlay left 样式类。 -->
      <div class="panel-title">
      <!-- 渲染容器，应用 panel-title 样式类。 -->
        <span>机器人 ROBOT-01</span>
        <!-- 渲染行内文字。 -->
        <!-- 报警时标签变红并显示报警码，否则显示运行模式 -->
        <el-tag v-if="robot" size="small" effect="plain" :type="robot.alarmCode ? 'danger' : 'success'">
        <!-- 渲染状态标签，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。；设置 :type=robot.alarmCode ? ：选择组件外观或字段类型。 关键字：:＝属性动态绑定的简写。 -->
          {{ robot.alarmCode ? `报警 #${robot.alarmCode}` : robot.mode }}
          <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </el-tag>
        <!-- 结束 el-tag 元素及其中的内容。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->

      <!-- 有数据时：6 行关节角度刻度条 -->
      <div v-if="robot" class="joints">
      <!-- 渲染容器，应用 joints 样式类，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。 -->
        <!-- v-for 遍历 6 个关节角 -->
        <div v-for="(deg, i) in robot.joints" :key="i" class="joint-row">
        <!-- 渲染容器，应用 joint-row 样式类，按集合重复生成（(deg, i) in robot.joints）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
          <span class="joint-label">J{{ i + 1 }}</span>
          <!-- 渲染行内文字，应用 joint-label 样式类，其中显示 i + 1 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
          <!-- 刻度条：marker 的 left 百分比由角度算出 -->
          <div class="joint-bar">
          <!-- 渲染容器，应用 joint-bar 样式类。 -->
            <div class="joint-marker" :style="{ left: markerPos(deg) }" />
            <!-- 渲染容器，应用 joint-marker 样式类。 关键字：:＝属性动态绑定的简写。 -->
          </div>
          <!-- 结束 div 元素及其中的内容。 -->
          <span class="joint-deg">{{ deg.toFixed(1) }}°</span>
          <!-- 渲染行内文字，应用 joint-deg 样式类，其中显示 deg.toFixed(1) 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- 无数据时的占位 -->
      <el-empty v-else description="等待机器人数据…" :image-size="60" />
      <!-- 渲染el-empty 元素或组件。 关键字：v-else＝前面条件不成立时渲染；:＝属性动态绑定的简写。 -->

      <!-- 底部附加信息 -->
      <div v-if="robot" class="meta">
      <!-- 渲染容器，应用 meta 样式类，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。 -->
        <span>程序 {{ robot.program }}</span>
        <!-- 渲染行内文字，其中显示 robot.program 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        <span>倍率 {{ robot.speedPct }}%</span>
        <!-- 渲染行内文字，其中显示 robot.speedPct 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <!-- 右:产线状态 + I/O 摘要 + 控制(契约 v1.1 路线 6) -->
    <IoPanel :can-command="auth.canCommand">
    <!-- 渲染IoPanel 元素或组件。 关键字：:＝属性动态绑定的简写。 -->
      <template #controls>
      <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
        <ControlButtons />
        <!-- 渲染ControlButtons 元素或组件。 -->
      </template>
      <!-- 结束当前模板或插槽内容。 -->
    </IoPanel>
    <!-- 结束 IoPanel 元素及其中的内容。 -->

    <!-- 左下角操作提示 -->
    <div class="hint">拖拽旋转 · 滚轮缩放</div>
    <!-- 渲染容器，应用 hint 样式类。 -->

    <!-- 服务断开时遮挡提示 -->
    <div v-if="!connected" class="lost">
    <!-- 渲染容器，应用 lost 样式类，条件成立时显示（!connected）。 关键字：v-if＝条件为真时才渲染。 -->
      <el-icon class="lost-icon"><WarningFilled /></el-icon>
      <!-- 渲染图标容器，应用 lost-icon 样式类。 -->
      与服务器连接断开,正在重连…
      <!-- 显示该行文本内容或结束当前元素。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { WarningFilled } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { SceneManager } from '../three/SceneManager';
// 从 ../three/SceneManager 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { RobotArm } from '../three/RobotArm';
// 从 ../three/RobotArm 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import IoPanel from '../components/IoPanel.vue';
// 从 ../components/IoPanel.vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import ControlButtons from '../components/ControlButtons.vue';
// 从 ../components/ControlButtons.vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

const { robot, connected } = useLineData();
// 从右侧结果中取出 robot, connected，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。
const auth = useAuthStore();
// 声明 auth，初始值由 useAuthStore() 计算得到。 关键字：const＝声明不可重新绑定的变量。

/**
 * 3D 画布的宿主 DOM 元素引用。
 * ref 在模板上声明后，Vue 会自动把它指向真实 DOM。
 * 注意：组件挂载前它是 undefined，所以 onMounted 里要先判空。
 */
const host = ref<HTMLElement>();
// 声明 host，初始值由 ref<HTMLElement>() 计算得到。 关键字：const＝声明不可重新绑定的变量。
/** 场景管理器实例（负责渲染器/相机/灯光/主循环） */
let scene: SceneManager | null = null;
// 声明 scene，初始值由 null 计算得到。 关键字：let＝声明可重新赋值的变量；null＝空值。
/** 机械臂模型实例 */
let arm: RobotArm | null = null;
// 声明 arm，初始值由 null 计算得到。 关键字：let＝声明可重新赋值的变量；null＝空值。

onMounted(() => {
// 调用 onMounted；括号中的表达式是传入的参数。
  // 模板 ref 还没拿到 DOM（理论上不会发生，但类型系统要求判空）
  if (!host.value) return;
  // 判断 if (!host.value) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  // 创建场景：渲染器 + 相机 + 灯光 + 地面 + 网格，自动 append canvas 到容器
  scene = new SceneManager(host.value);
  // 把右侧表达式的结果写入 scene。 关键字：new＝创建对象实例。
  // 创建机械臂模型（纯几何体拼出来的 6 轴结构）
  arm = new RobotArm();
  // 把右侧表达式的结果写入 arm。 关键字：new＝创建对象实例。
  // 把机械臂加入场景（group 是一个可整体变换的容器）
  scene.add(arm.group);
  // 调用 scene.add，把括号中的值作为参数传入。
  // 启动 requestAnimationFrame 渲染循环
  scene.start();
  // 调用 scene.start，把括号中的值作为参数传入。
});
// 结束当前回调或对象，并完成外层函数调用。

/**
 * 组件卸载前：释放 GPU 资源。
 * ★ 非常重要：不释放会导致用户来回切页面时显存/内存持续增长，最终浏览器崩溃。
 */
onBeforeUnmount(() => {
// 调用 onBeforeUnmount；括号中的表达式是传入的参数。
  scene?.dispose();
  // 调用 .dispose，把括号中的值作为参数传入。
  scene = null;
  // 把右侧表达式的结果写入 scene。 关键字：null＝空值。
  arm = null;
  // 把右侧表达式的结果写入 arm。 关键字：null＝空值。
});
// 结束当前回调或对象，并完成外层函数调用。

// 实时驱动:10Hz 直接驱动已足够平滑;如需更丝滑可在此加插值
/**
 * 侦听 robot 变化 → 驱动 3D 模型。
 * 这是"数据 → 画面"的关键一行。
 */
watch(robot, (r) => {
// 调用 watch；括号中的表达式是传入的参数。
  // 没有数据或模型还没建好就跳过
  if (!r || !arm) return;
  // 判断 if (!r || !arm) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  // 把 6 个关节角（度）写进模型
  arm.setJoints(r.joints);
  // 调用 arm.setJoints，把括号中的值作为参数传入。
  // 报警码非 0 → 关节光环变红
  arm.setAlarm(r.alarmCode !== 0);
  // 调用 arm.setAlarm，把括号中的值作为参数传入。
});
// 结束当前回调或对象，并完成外层函数调用。

// 角度 → 刻度条上的位置(量程 ±180°)
/**
 * 角度 → 刻度条上的位置（量程 ±180°）。
 * 把 [-180, 180] 线性映射到 [0%, 100%]，再夹紧防止越界。
 */
function markerPos(deg: number) {
// 定义函数 markerPos。 关键字：function＝定义函数。
  // 归一化：(角度 + 180) / 360
  const pct = ((deg + 180) / 360) * 100;
  // 声明 pct，初始值由 ((deg + 180) / 360) * 100 计算得到。 关键字：const＝声明不可重新绑定的变量。
  // Math.min/max 夹紧到 [0,100]，再拼成 CSS 的百分比字符串
  return `${Math.min(100, Math.max(0, pct))}%`;
  // 返回 ${Math.min(100, Math.max(0, pct))}% 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
/* scoped：这些样式只作用于本组件的 DOM，不影响其他组件 */
.twin-wrap { position: relative; width: 100%; height: 100%; border-radius: 10px; overflow: hidden; }
/* position=relative：设置定位方式；width=100%：设置宽度；height=100%：设置高度；border-radius=10px：设置圆角；overflow=hidden：决定溢出内容如何处理。 */
/* 画布容器铺满整个区域 */
.canvas-host { position: absolute; inset: 0; }
/* position=absolute：设置定位方式；inset=0：设置该样式属性。 */

/* 左右浮层面板：绝对定位在 3D 画布之上 */
.overlay { position: absolute; top: 14px; width: 240px; z-index: 5; }
/* position=absolute：设置定位方式；top=14px：设置该样式属性；width=240px：设置宽度；z-index=5：设置该样式属性。 */
.overlay.left { left: 14px; }
/* left=14px：设置该样式属性。 */

/* 关节列表与单行布局 */
.joints { display: flex; flex-direction: column; gap: 8px; }
/* display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=8px：设置子元素间距。 */
.joint-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
/* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距；font-size=12px：设置字号。 */
.joint-label { width: 22px; color: var(--text-dim); }
/* width=22px：设置宽度；color=var(--text-dim)：设置文字颜色。 */
/* 刻度条底槽 */
.joint-bar {
/* 对选择器 .joint-bar 匹配的元素应用后续声明。 */
  flex: 1; height: 6px; border-radius: 3px;
  /* flex=1：设置弹性项的伸缩比例；height=6px：设置高度；border-radius=3px：设置圆角。 */
  background: #1c2733; position: relative;
  /* background=#1c2733：设置背景；position=relative：设置定位方式。 */
}
/* 结束样式块或续写样式声明。 */
/* 刻度条上的游标（当前位置） */
.joint-marker {
/* 对选择器 .joint-marker 匹配的元素应用后续声明。 */
  position: absolute; top: -2px; width: 3px; height: 10px;
  /* position=absolute：设置定位方式；top=-2px：设置该样式属性；width=3px：设置宽度；height=10px：设置高度。 */
  background: var(--accent); border-radius: 2px;
  /* background=var(--accent)：设置背景；border-radius=2px：设置圆角。 */
  transform: translateX(-50%);
  /* transform=translateX(-50%)：变换元素位置或形状。 */
  transition: left 80ms linear;
  /* transition=left 80ms linear：设置状态变化时的过渡。 */
  box-shadow: 0 0 6px var(--accent);
  /* box-shadow=0 0 6px var(--accent)：设置阴影。 */
}
/* 结束样式块或续写样式声明。 */
.joint-deg { width: 58px; text-align: right; font-variant-numeric: tabular-nums; }
/* width=58px：设置宽度；text-align=right：设置该样式属性；font-variant-numeric=tabular-nums：设置该样式属性。 */

/* 面板底部的附加信息行 */
.meta {
/* 对选择器 .meta 匹配的元素应用后续声明。 */
  margin-top: 10px; padding-top: 8px;
  /* margin-top=10px：设置该样式属性；padding-top=8px：设置该样式属性。 */
  border-top: 1px dashed var(--panel-border);
  /* border-top=1px dashed var(--panel-border)：设置该样式属性。 */
  display: flex; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；justify-content=space-between：控制主轴上的分布方式。 */
  font-size: 12px; color: var(--text-dim);
  /* font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
}
/* 结束样式块或续写样式声明。 */

/* 左下角提示文字 */
.hint {
/* 对选择器 .hint 匹配的元素应用后续声明。 */
  position: absolute; left: 14px; bottom: 10px;
  /* position=absolute：设置定位方式；left=14px：设置该样式属性；bottom=10px：设置该样式属性。 */
  font-size: 11px; color: var(--text-dim); opacity: 0.7;
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；opacity=0.7：设置透明度。 */
}
/* 结束样式块或续写样式声明。 */

/* 断线遮罩：覆盖整个画面 */
.lost {
/* 对选择器 .lost 匹配的元素应用后续声明。 */
  position: absolute; inset: 0; z-index: 10;
  /* position=absolute：设置定位方式；inset=0：设置该样式属性；z-index=10：设置该样式属性。 */
  display: flex; align-items: center; justify-content: center; gap: 8px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=center：控制主轴上的分布方式；gap=8px：设置子元素间距。 */
  background: rgba(11, 15, 20, 0.7); backdrop-filter: blur(2px);
  /* background=rgba(11, 15, 20, 0.7)：设置背景；backdrop-filter=blur(2px)：设置该样式属性。 */
  color: var(--warn); font-size: 14px;
  /* color=var(--warn)：设置文字颜色；font-size=14px：设置字号。 */
}
/* 结束样式块或续写样式声明。 */
.lost-icon { font-size: 20px; }
/* font-size=20px：设置字号。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
