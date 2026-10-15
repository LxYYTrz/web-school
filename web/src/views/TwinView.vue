<template>
  <div class="twin-wrap">
    <div ref="host" class="canvas-host" />

    <!-- 左:机器人关节实时角度 -->
    <div class="panel overlay left">
      <div class="panel-title">
        <span>机器人 ROBOT-01</span>
        <el-tag v-if="robot" size="small" effect="plain"
          :type="robot.alarmCode ? 'danger' : 'success'">
          {{ robot.alarmCode ? `报警 #${robot.alarmCode}` : robot.mode }}
        </el-tag>
      </div>

      <div v-if="robot" class="joints">
        <div v-for="(deg, i) in robot.joints" :key="i" class="joint-row">
          <span class="joint-label">J{{ i + 1 }}</span>
          <div class="joint-bar">
            <div class="joint-marker" :style="{ left: markerPos(deg) }" />
          </div>
          <span class="joint-deg">{{ deg.toFixed(1) }}°</span>
        </div>
      </div>
      <el-empty v-else description="等待机器人数据…" :image-size="60" />

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

const host = ref<HTMLElement>();
let scene: SceneManager | null = null;
let arm: RobotArm | null = null;

onMounted(() => {
  if (!host.value) return;
  scene = new SceneManager(host.value);
  arm = new RobotArm();
  scene.add(arm.group);
  scene.start();
});

onBeforeUnmount(() => {
  scene?.dispose();
  scene = null;
  arm = null;
});

// 实时驱动:10Hz 直接驱动已足够平滑;如需更丝滑可在此加插值
watch(robot, (r) => {
  if (!r || !arm) return;
  arm.setJoints(r.joints);
  arm.setAlarm(r.alarmCode !== 0);
});

// 角度 → 刻度条上的位置(量程 ±180°)
function markerPos(deg: number) {
  const pct = ((deg + 180) / 360) * 100;
  return `${Math.min(100, Math.max(0, pct))}%`;
}
</script>

<style scoped>
.twin-wrap { position: relative; width: 100%; height: 100%; border-radius: 10px; overflow: hidden; }
.canvas-host { position: absolute; inset: 0; }

.overlay { position: absolute; top: 14px; width: 240px; z-index: 5; }
.overlay.left { left: 14px; }

.joints { display: flex; flex-direction: column; gap: 8px; }
.joint-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.joint-label { width: 22px; color: var(--text-dim); }
.joint-bar {
  flex: 1; height: 6px; border-radius: 3px;
  background: #1c2733; position: relative;
}
.joint-marker {
  position: absolute; top: -2px; width: 3px; height: 10px;
  background: var(--accent); border-radius: 2px;
  transform: translateX(-50%);
  transition: left 80ms linear;
  box-shadow: 0 0 6px var(--accent);
}
.joint-deg { width: 58px; text-align: right; font-variant-numeric: tabular-nums; }

.meta {
  margin-top: 10px; padding-top: 8px;
  border-top: 1px dashed var(--panel-border);
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--text-dim);
}

.hint {
  position: absolute; left: 14px; bottom: 10px;
  font-size: 11px; color: var(--text-dim); opacity: 0.7;
}

.lost {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: rgba(11, 15, 20, 0.7); backdrop-filter: blur(2px);
  color: var(--warn); font-size: 14px;
}
.lost-icon { font-size: 20px; }
</style>
