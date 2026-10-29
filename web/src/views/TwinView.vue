<!--
  浏览器的机械臂孪生页面，组合现场数据、三维画布和控制面板。
  挂载时创建 SceneManager 和 RobotArm；监听机器人帧后将 joints 交给 setJoints，报警另调 setAlarm。
  拖动模型只改变观察视角；控制按钮通过后端业务链操作现场，三维 rotation 本身不向 PLC 写入。
-->
<!-- 这一段实现界面模板，服务于展示机械臂三维场景、实时工序、IO 和操作面板。 -->
<template>
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
        <!-- 报警时标签变红并显示报警码，否则显示运行模式 -->
        <el-tag v-if="robot" size="small" effect="plain" :type="robot.alarmCode ? 'danger' : 'success'">
        <!-- 渲染状态标签，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。；设置 :type=robot.alarmCode ? ：选择组件外观或字段类型。 关键字：:＝属性动态绑定的简写。 -->
          {{ robot.alarmCode ? `报警 #${robot.alarmCode}` : robot.mode }}
        </el-tag>
      </div>

      <!-- 有数据时：6 行关节角度刻度条 -->
      <div v-if="robot" class="joints">
      <!-- 渲染容器，应用 joints 样式类，条件成立时显示（robot）。 -->
        <!-- v-for 遍历 6 个关节角 -->
        <div v-for="(deg, i) in robot.joints" :key="i" class="joint-row">
        <!-- 渲染容器，应用 joint-row 样式类，按集合重复生成（(deg, i) in robot.joints）。 -->
          <span class="joint-label">J{{ i + 1 }}</span>
          <!-- 渲染行内文字，应用 joint-label 样式类，其中显示 i + 1 的计算结果。 -->
          <!-- 刻度条：marker 的 left 百分比由角度算出 -->
          <div class="joint-bar">
          <!-- 渲染容器，应用 joint-bar 样式类。 -->
            <div class="joint-marker" :style="{ left: markerPos(deg) }" />
            <!-- 渲染容器，应用 joint-marker 样式类。 -->
          </div>
          <span class="joint-deg">{{ deg.toFixed(1) }}°</span>
          <!-- 渲染行内文字，应用 joint-deg 样式类，其中显示 deg.toFixed(1) 的计算结果。 -->
        </div>
      </div>
      <!-- 无数据时的占位 -->

      <!-- robot 为空时显示等待文案，对应“尚未取得机器人帧”的页面状态。 -->
      <!-- 已经收到过的旧帧不会仅因 Redis 的 key 过期就被这里自动清空，是否仍有新数据需结合时间和实时链路判断。 -->

      <el-empty v-else description="等待机器人数据…" :image-size="60" />
      <!-- 渲染el-empty 元素或组件。 -->

      <!-- 底部附加信息 -->
      <div v-if="robot" class="meta">
      <!-- 渲染容器，应用 meta 样式类，条件成立时显示（robot）。 -->
        <span>程序 {{ robot.program }}</span>
        <!-- 渲染行内文字，其中显示 robot.program 的计算结果。 -->
        <span>倍率 {{ robot.speedPct }}%</span>
        <!-- 渲染行内文字，其中显示 robot.speedPct 的计算结果。 -->
      </div>
    </div>

    <!-- 右:产线状态 + I/O 摘要 + 控制(契约 v1.1 路线 6) -->
    <IoPanel :can-command="auth.canCommand">
    <!-- 渲染IoPanel 元素或组件。 -->
      <template #controls>
        <ControlButtons />
        <!-- 渲染ControlButtons 元素或组件。 -->
      </template>
    </IoPanel>
    <!-- 结束 IoPanel 元素及其中的内容。 -->

    <!-- 左下角操作提示 -->
    <div class="hint">拖拽旋转 · 滚轮缩放</div>
    <!-- 渲染容器，应用 hint 样式类。 -->

    <!-- 服务断开时遮挡提示 -->
    <div v-if="!connected" class="lost">
    <!-- 渲染容器，应用 lost 样式类，条件成立时显示（!connected）。 -->
      <el-icon class="lost-icon"><WarningFilled /></el-icon>
      <!-- 渲染图标容器，应用 lost-icon 样式类。 -->
      与服务器连接断开,正在重连…
      <!-- 在当前页面元素中直接显示文字「与服务器连接断开,正在重连…」。 -->
      <!-- 与服务器连接断开,正在重连… 是直接显示在当前界面元素中的文字内容 -->
    </div>
  </div>
</template>

<!-- 这一段实现组件状态与事件处理，服务于展示机械臂三维场景、实时工序、IO 和操作面板。 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';
import { useLineData } from '../composables/useLineData';
import { useAuthStore } from '../stores/auth';
import { SceneManager } from '../three/SceneManager';
import { RobotArm } from '../three/RobotArm';
import IoPanel from '../components/IoPanel.vue';
import ControlButtons from '../components/ControlButtons.vue';

const { robot, connected } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。
const auth = useAuthStore();

/**
 * 3D 画布的宿主 DOM 元素引用。
 * ref 在模板上声明后，Vue 会自动把它指向真实 DOM。
 * 注意：组件挂载前它是 undefined，所以 onMounted 里要先判空。
 */
const host = ref<HTMLElement>();
/** 场景管理器实例（负责渲染器/相机/灯光/主循环） */
let scene: SceneManager | null = null;
/** 机械臂模型实例 */
let arm: RobotArm | null = null;

// 页面 DOM 容器就绪后创建场景与机械臂，挂入模型并开始浏览器绘制。
// 后续 robot 监听才把收到的 joints 交给 setJoints；创建初始模型不代表现场采集到了对应姿态。
onMounted(() => {
  // 模板 ref 还没拿到 DOM（理论上不会发生，但类型系统要求判空）
  if (!host.value) return;
  // 创建场景：渲染器 + 相机 + 灯光 + 地面 + 网格，自动 append canvas 到容器
  scene = new SceneManager(host.value);
  // 创建机械臂模型（纯几何体拼出来的 6 轴结构）
  arm = new RobotArm();
  // 把机械臂加入场景（group 是一个可整体变换的容器）
  scene.add(arm.group);
  // 启动 requestAnimationFrame 渲染循环
  scene.start();
  // 启动 Three.js 的连续渲染循环。
});

// 页面离开时释放本页的场景资源；共享现场数据实例由其模块继续维护。
onBeforeUnmount(() => {
  scene?.dispose();
  // 释放 GPU、材质、几何体或控制器资源。
  scene = null;
  arm = null;
});

// 实时驱动:10Hz 直接驱动已足够平滑;如需更丝滑可在此加插值
/**
 * 侦听 robot 变化 → 驱动 3D 模型。
 * 这是"数据 → 画面"的关键一行。
 */

// 这段承接机器人数据的显示分支：useLineData 更新 robot 后，watch 得到最新帧 r。
// 只有帧和模型都存在时才把 r.joints 交给 setJoints()；数组元素仍以度表示，度转弧度在 RobotArm 内部完成。
// setAlarm() 根据报警码更新模型显示。工序中文和 IO 点位值由另外的显示规则处理，不经过 setJoints()。

// 1. watch 从 Vue 导入，观察 useLineData 返回的共享 robot 容器。
// 2. 实时回调或首屏快照替换 robot.value 后，r 就是本次触发所用的帧。
// 3. 下方先确认帧和模型存在，再把 joints 交给 arm.setJoints，把 alarmCode 转成报警布尔值。
// 4. 这段是数据层到模型层的连接点；网络接收在 composables，角度与节点处理在 RobotArm。
watch(robot, (r) => {
// 机器人共享状态变化时，取最新帧更新模型关节角和报警显示。
// robot 来自 useLineData()；r 是本次机器人帧；arm 是已创建的 RobotArm；r.joints 的元素是度数，弧度转换在模型内部进行。
  // 没有数据或模型还没建好就跳过
  if (!r || !arm) return;
  // 把 6 个关节角（度）写进模型
  arm.setJoints(r.joints);
  // 把六轴角度从度转换为弧度并更新机械臂关节节点。
  // 报警码非 0 → 关节光环变红
  arm.setAlarm(r.alarmCode !== 0);
  // 根据报警状态调整机械臂关节环的发光效果。
});
// 报警码非 0 → 关节光环变红。

// 角度 → 刻度条上的位置(量程 ±180°)
/**
 * 角度 → 刻度条上的位置（量程 ±180°）。
 * 把 [-180, 180] 线性映射到 [0%, 100%]，再夹紧防止越界。
 */
function markerPos(deg: number) {
  // 归一化：(角度 + 180) / 360
  const pct = ((deg + 180) / 360) * 100;
  // Math.min/max 夹紧到 [0,100]，再拼成 CSS 的百分比字符串
  return `${Math.min(100, Math.max(0, pct))}%`;
}
</script>

<!-- 这一段实现当前页面或组件的外观样式，服务于展示机械臂三维场景、实时工序、IO 和操作面板。 -->
<style scoped>
.twin-wrap { position: relative; width: 100%; height: 100%; border-radius: 10px; overflow: hidden; }
/* 画布容器铺满整个区域 */
.canvas-host { position: absolute; inset: 0; }

/* 左右浮层面板：绝对定位在 3D 画布之上 */
.overlay { position: absolute; top: 14px; width: 240px; z-index: 5; }
.overlay.left { left: 14px; }

/* 关节列表与单行布局 */
.joints { display: flex; flex-direction: column; gap: 8px; }
.joint-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.joint-label { width: 22px; color: var(--text-dim); }
/* 刻度条底槽 */
/* 这一段为 .joint-bar 对应的界面元素定义尺寸、布局或视觉样式。 */
.joint-bar {
  flex: 1; height: 6px; border-radius: 3px;
  background: #1c2733; position: relative;
}
/* 刻度条上的游标（当前位置） */
/* 这一段为 .joint-marker 对应的界面元素定义尺寸、布局或视觉样式。 */
.joint-marker {
  position: absolute; top: -2px; width: 3px; height: 10px;
  background: var(--accent); border-radius: 2px;
  transform: translateX(-50%);
  /* transform=translateX(-50%)：变换元素位置或形状。 */
  transition: left 80ms linear;
  box-shadow: 0 0 6px var(--accent);
}
.joint-deg { width: 58px; text-align: right; font-variant-numeric: tabular-nums; }

/* 面板底部的附加信息行 */
/* 这一段为 .meta 对应的界面元素定义尺寸、布局或视觉样式。 */
.meta {
  margin-top: 10px; padding-top: 8px;
  border-top: 1px dashed var(--panel-border);
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--text-dim);
}

/* 左下角提示文字 */
/* 这一段为 .hint 对应的界面元素定义尺寸、布局或视觉样式。 */
.hint {
  position: absolute; left: 14px; bottom: 10px;
  font-size: 11px; color: var(--text-dim); opacity: 0.7;
}

/* 断线遮罩：覆盖整个画面 */
/* 这一段为 .lost 对应的界面元素定义尺寸、布局或视觉样式。 */
.lost {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: rgba(11, 15, 20, 0.7); backdrop-filter: blur(2px);
  color: var(--warn); font-size: 14px;
}
.lost-icon { font-size: 20px; }
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
