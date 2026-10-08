<template>
  <div class="vision-page">
    <div class="panel head">
      <div class="panel-title" style="margin:0">
        <span>视觉检测 · CAM-01(实时)</span>
        <span class="ops">
          <span class="count">已收 {{ vision.length }} 条</span>
          <el-radio-group v-model="mode" size="small">
            <el-radio-button value="grid">网格</el-radio-button>
            <el-radio-button value="single">单件</el-radio-button>
          </el-radio-group>
        </span>
      </div>
    </div>

    <el-empty v-if="vision.length === 0" description="等待视觉数据…" style="flex:1" />

    <!-- 网格模式 -->
    <div v-else-if="mode === 'grid'" class="grid">
      <div v-for="v in vision" :key="v.sn" class="panel cell" :class="{ ng: v.result === 'ng' }">
        <div class="shot">
          <img v-if="v.thumbUrl" :src="v.thumbUrl" alt="" />
          <div v-else class="placeholder">
            <el-icon :size="28"><Picture /></el-icon>
            <span>等待图片链路</span>
          </div>
          <!-- 缺陷框:坐标按 640×480 归一化;图片链路接通后改用原图实际尺寸 -->
          <div
            v-for="(d, i) in v.defects"
            :key="i"
            class="defect"
            :style="defectStyle(d)"
          />
        </div>
        <div class="cell-meta">
          <span class="sn">{{ v.sn }}</span>
          <el-tag size="small" effect="dark" :type="v.result === 'ng' ? 'danger' : 'success'">
            {{ v.result.toUpperCase() }}
          </el-tag>
        </div>
        <div class="cell-time">{{ fmtTime(v.ts) }}</div>
      </div>
    </div>

    <!-- 单件模式 -->
    <div v-else class="single">
      <div class="panel big-shot">
        <img v-if="latest?.thumbUrl" :src="latest.thumbUrl" alt="" />
        <div v-else class="placeholder big">
          <el-icon :size="56"><Picture /></el-icon>
          <span>图片链路接通后展示原图(见契约第 4 节)</span>
        </div>
        <div
          v-for="(d, i) in latest?.defects ?? []"
          :key="i"
          class="defect"
          :style="defectStyle(d)"
        />
      </div>
      <div class="panel detail">
        <div class="panel-title"><span>检测结果</span></div>
        <template v-if="latest">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="序列号">{{ latest.sn }}</el-descriptions-item>
            <el-descriptions-item label="判定">
              <el-tag :type="latest.result === 'ng' ? 'danger' : 'success'" effect="dark">
                {{ latest.result.toUpperCase() }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="相机">{{ latest.cameraId }}</el-descriptions-item>
            <el-descriptions-item label="时间">{{ fmtFull(latest.ts) }}</el-descriptions-item>
          </el-descriptions>
          <div class="panel-title" style="margin-top:14px">
            <span>缺陷明细({{ latest.defects.length }})</span>
          </div>
          <el-table v-if="latest.defects.length" :data="latest.defects" size="small">
            <el-table-column prop="type" label="类型" />
            <el-table-column label="位置 (x, y)">
              <template #default="{ row }">({{ row.x }}, {{ row.y }})</template>
            </el-table-column>
            <el-table-column label="尺寸 (w×h)">
              <template #default="{ row }">{{ row.w }}×{{ row.h }}</template>
            </el-table-column>
          </el-table>
          <div v-else class="no-defect">无缺陷</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Picture } from '@element-plus/icons-vue';
import { useLineData } from '../composables/useLineData';
import type { VisionDefect } from '../services/types';

const { vision } = useLineData();
const mode = ref<'grid' | 'single'>('grid');

const latest = computed(() => vision.value[0] ?? null);

// 缺陷坐标按 640×480 归一化为百分比,适配任意渲染尺寸
function defectStyle(d: VisionDefect) {
  return {
    left: `${(d.x / 640) * 100}%`,
    top: `${(d.y / 480) * 100}%`,
    width: `${(d.w / 640) * 100}%`,
    height: `${(d.h / 480) * 100}%`,
  };
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false });
}
function fmtFull(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}
</script>

<style scoped>
.vision-page { display: flex; flex-direction: column; gap: 12px; height: 100%; }
.head { padding: 10px 14px; }
.ops { display: inline-flex; align-items: center; gap: 12px; }
.count { font-size: 11px; color: var(--text-dim); }

.grid {
  flex: 1; overflow: auto;
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
  align-content: start;
}
.cell { padding: 8px; }
.cell.ng { border-color: rgba(255, 92, 92, 0.5); }

.shot {
  position: relative; aspect-ratio: 4 / 3; border-radius: 6px;
  overflow: hidden; background: #10161d;
}
.shot img { width: 100%; height: 100%; object-fit: cover; display: block; }

.placeholder {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; color: #33414f; font-size: 11px;
  background:
    repeating-linear-gradient(45deg, #10161d, #10161d 10px, #121a23 10px, #121a23 20px);
}
.placeholder.big { font-size: 13px; }

.defect {
  position: absolute; border: 1.5px solid var(--ng);
  border-radius: 2px; box-shadow: 0 0 6px rgba(255, 92, 92, 0.6);
}

.cell-meta {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8px; font-size: 12px;
}
.sn { font-family: monospace; color: var(--text-dim); }
.cell-time { font-size: 11px; color: var(--text-dim); margin-top: 4px; text-align: right; }

.single { flex: 1; display: grid; grid-template-columns: 1fr 340px; gap: 12px; min-height: 0; }
.big-shot { position: relative; overflow: hidden; display: flex; }
.big-shot img { width: 100%; height: 100%; object-fit: contain; }
.detail { overflow: auto; }
.no-defect { color: var(--ok); font-size: 13px; padding: 8px 0; }
</style>
