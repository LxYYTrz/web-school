<!--
  ============================================================================
  文件作用：实时孪生页面（3D 机械臂 + 关节角度面板 + 产线摘要）
  所属模块：web/src/views/
  ============================================================================

  【宏观定位】系统的"门面"。它把实时数据映射成三种可视化：
    ① 3D 场景中的机械臂姿态（Three.js）—— 直观展示机器人怎么动
    ② 左侧关节角度刻度条 —— 精确看到 J1~J6 的角度数值
    ③ 右侧产线状态摘要 —— 状态/良品/不良/节拍

  【数据 → 画面 的完整路径】
    MQTT(10Hz) → EMQX → 后端 ingest → WebSocket('robot_state')
      → useLineData.robot (ref)
        → watch(robot) 回调（Vue 的侦听器）
          → arm.setJoints(r.joints)   ← 调用 Three.js 模型
            → 各关节 Group 的 rotation 被设置
              → 下一帧渲染时模型姿态就变了

  【为什么用 watch 而不是 computed】
    computed 适合"从状态推导出新状态"（值）；这里需要的是"状态变了就去做一件事"
    （副作用），所以用 watch。

  【10Hz 直驱够不够平滑？】
    够。浏览器渲染是 60Hz，10Hz 更新在视觉上略有台阶但可接受。
    要更丝滑可在 setJoints 前后加插值（lerp）—— 见 web/README.md 的 TODO。
  ============================================================================
-->
<!--
  ============================================================================
  文件作用：实时孪生页面（3D 机械臂 + 关节角度面板 + 产线摘要）
  所属模块：web/src/views/
  ============================================================================

  【宏观定位】系统的"门面"。它把实时数据映射成三种可视化：
    ① 3D 场景中的机械臂姿态（Three.js）—— 直观展示机器人怎么动
    ② 左侧关节角度刻度条 —— 精确看到 J1~J6 的角度数值
    ③ 右侧产线状态摘要 —— 状态/良品/不良/节拍

  【数据 → 画面 的完整路径】
    MQTT(10Hz) → EMQX → 后端 ingest → WebSocket('robot_state')
      → useLineData.robot (ref)
        → watch(robot) 回调（Vue 的侦听器）
          → arm.setJoints(r.joints)   ← 调用 Three.js 模型
            → 各关节 Group 的 rotation 被设置
              → 下一帧渲染时模型姿态就变了

  【为什么用 watch 而不是 computed】
    computed 适合"从状态推导出新状态"（值）；这里需要的是"状态变了就去做一件事"
    （副作用），所以用 watch。

  【10Hz 直驱够不够平滑？】
    够。浏览器渲染是 60Hz，10Hz 更新在视觉上略有台阶但可接受。
    要更丝滑可在 setJoints 前后加插值（lerp）—— 见 web/README.md 的 TODO。
  ============================================================================
-->
<template>
  <div class="twin-wrap">
    <!-- 3D 画布容器。Three.js 会把 canvas 追加到这个 div 里 -->
    <div ref="host" class="canvas-host" />

    <!-- 左:机器人关节实时角度 -->
    <div class="panel overlay left">
      <div class="panel-title">
        <span>机器人 ROBOT-01</span>
        <!-- 报警时标签变红并显示报警码，否则显示运行模式 -->
        <el-tag v-if="robot" size="small" effect="plain"
          :type="robot.alarmCode ? 'danger' : 'success'">
          {{ robot.alarmCode ? `报警 #${robot.alarmCode}` : robot.mode }}
        </el-tag>
      </div>

      <!-- 有数据时：6 行关节角度刻度条 -->
      <div v-if="robot" class="joints">
        <!-- v-for 遍历 6 个关节角 -->
        <div v-for="(deg, i) in robot.joints" :key="i" class="joint-row">
          <span class="joint-label">J{{ i + 1 }}</span>
          <!-- 刻度条：marker 的 left 百分比由角度算出 -->
          <div class="joint-bar">
            <div class="joint-marker" :style="{ left: markerPos(deg) }" />
          </div>
          <span class="joint-deg">{{ deg.toFixed(1) }}°</span>
        </div>
      </div>
      <!-- 无数据时的占位 -->
      <el-empty v-else description="等待机器人数据…" :image-size="60" />

      <!-- 底部附加信息 -->
      <div v-if="robot" class="meta">
        <span>程序 {{ robot.program }}</span>
        <span>倍率 {{ robot.speedPct }}%</span>
      </div>
    </div>

    <!-- 右:产线状态 + I/O 摘要 + 控制(契约 v1.1 路线 6) -->
    <IoPanel :can-command="auth.canCommand">
      <template #controls>
        <ControlButtons />
      </template>
    </IoPanel>

    <!-- 左下角操作提示 -->
    <div class="hint">拖拽旋转 · 滚轮缩放</div>

    <!-- 服务断开时遮挡提示 -->
    <div v-if="!connected" class="lost">
      <el-icon class="lost-icon"><WarningFilled /></el-icon>
      与服务器连接断开,正在重连…
    </div>
  </div>
</template>

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
});

/**
 * 组件卸载前：释放 GPU 资源。
 * ★ 非常重要：不释放会导致用户来回切页面时显存/内存持续增长，最终浏览器崩溃。
 */
onBeforeUnmount(() => {
  scene?.dispose();
  scene = null;
  arm = null;
});

// 实时驱动:10Hz 直接驱动已足够平滑;如需更丝滑可在此加插值
/**
 * 侦听 robot 变化 → 驱动 3D 模型。
 * 这是"数据 → 画面"的关键一行。
 */
watch(robot, (r) => {
  // 没有数据或模型还没建好就跳过
  if (!r || !arm) return;
  // 把 6 个关节角（度）写进模型
  arm.setJoints(r.joints);
  // 报警码非 0 → 关节光环变红
  arm.setAlarm(r.alarmCode !== 0);
});

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

<style scoped>
/* scoped：这些样式只作用于本组件的 DOM，不影响其他组件 */
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
.joint-bar {
  flex: 1; height: 6px; border-radius: 3px;
  background: #1c2733; position: relative;
}
/* 刻度条上的游标（当前位置） */
.joint-marker {
  position: absolute; top: -2px; width: 3px; height: 10px;
  background: var(--accent); border-radius: 2px;
  transform: translateX(-50%);
  transition: left 80ms linear;
  box-shadow: 0 0 6px var(--accent);
}
.joint-deg { width: 58px; text-align: right; font-variant-numeric: tabular-nums; }

/* 面板底部的附加信息行 */
.meta {
  margin-top: 10px; padding-top: 8px;
  border-top: 1px dashed var(--panel-border);
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--text-dim);
}

/* 左下角提示文字 */
.hint {
  position: absolute; left: 14px; bottom: 10px;
  font-size: 11px; color: var(--text-dim); opacity: 0.7;
}

/* 断线遮罩：覆盖整个画面 */
.lost {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: rgba(11, 15, 20, 0.7); backdrop-filter: blur(2px);
  color: var(--warn); font-size: 14px;
}
.lost-icon { font-size: 20px; }
</style>
