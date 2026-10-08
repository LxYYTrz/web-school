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

    <!-- 右:产线状态摘要 -->
    <div class="panel overlay right">
      <div class="panel-title"><span>产线 LINE-01</span></div>
      <div v-if="status" class="line-stats">
        <div class="stat">
          <div class="stat-value" :class="status.state">{{ statusText }}</div>
          <div class="stat-label">状态</div>
        </div>
        <div class="stat">
          <div class="stat-value ok">{{ status.goodCount }}</div>
          <div class="stat-label">良品</div>
        </div>
        <div class="stat">
          <div class="stat-value ng">{{ status.ngCount }}</div>
          <div class="stat-label">不良</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ (status.beatMs / 1000).toFixed(1) }}s</div>
          <div class="stat-label">节拍</div>
        </div>
      </div>
      <el-empty v-else description="等待产线状态…" :image-size="60" />
      <div v-if="status" class="meta">
        <span>产品 {{ status.productCode }}</span>
        <span>边缘 {{ edgeText }}</span>
      </div>
    </div>

    <div class="hint">拖拽旋转 · 滚轮缩放</div>

    <!-- 服务断开时遮挡提示 -->
    <div v-if="!connected" class="lost">
      <el-icon class="lost-icon"><WarningFilled /></el-icon>
      与服务器连接断开,正在重连…
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';
import { useLineData } from '../composables/useLineData';
import { SceneManager } from '../three/SceneManager';
import { RobotArm } from '../three/RobotArm';

const { robot, status, edgeText, connected } = useLineData();

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

const statusText = computed(() => {
  const map: Record<string, string> = {
    running: '运行中', idle: '待机', alarm: '报警', offline: '离线',
  };
  return status.value ? map[status.value.state] ?? status.value.state : '';
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
.overlay.right { right: 14px; width: 260px; }

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

.line-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; }
.stat-value { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
.stat-value.ok { color: var(--ok); }
.stat-value.ng { color: var(--ng); }
.stat-value.running { color: var(--ok); }
.stat-value.alarm { color: var(--ng); }
.stat-value.offline { color: var(--warn); }
.stat-value.idle { color: var(--text-dim); }
.stat-label { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

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
