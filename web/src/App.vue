<template>
  <el-container class="layout">
    <el-header class="topbar">
      <div class="brand">
        <span class="brand-dot" />
        <span class="brand-name">产线数字孪生监控平台</span>
      </div>

      <el-menu
        class="nav"
        mode="horizontal"
        router
        :default-active="$route.path"
        :ellipsis="false"
      >
        <el-menu-item index="/twin">
          <el-icon><Monitor /></el-icon>实时孪生
        </el-menu-item>
        <el-menu-item index="/status">
          <el-icon><Odometer /></el-icon>产线状态
        </el-menu-item>
        <el-menu-item index="/vision">
          <el-icon><CameraFilled /></el-icon>视觉检测
        </el-menu-item>
      </el-menu>

      <div class="badges">
        <span class="badge">
          <i class="dot" :class="connected ? 'ok' : 'off'" />
          服务 {{ connected ? '已连接' : '断开' }}
        </span>
        <span class="badge">
          <i class="dot" :class="edgeOnline ? 'ok' : 'off'" />
          边缘 {{ edgeText }}
        </span>
        <el-tag
          v-if="status"
          :type="statusTagType"
          effect="dark"
          size="small"
          class="state-tag"
        >
          {{ statusText }}
        </el-tag>
        <el-tooltip v-if="alarmText" :content="alarmText" placement="bottom">
          <span class="badge alarm"><i class="dot alarm-dot" />报警</span>
        </el-tooltip>
      </div>
    </el-header>

    <el-main class="body">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Monitor, Odometer, CameraFilled } from '@element-plus/icons-vue';
import { useLineData } from './composables/useLineData';

const { connected, edgeOnline, edgeText, status, alarmText } = useLineData('line-01');

const statusText = computed(() => {
  const map: Record<string, string> = {
    running: '运行中', idle: '待机', alarm: '报警', offline: '离线',
  };
  return status.value ? map[status.value.state] ?? status.value.state : '';
});

const statusTagType = computed(() => {
  const map: Record<string, 'success' | 'info' | 'danger' | 'warning'> = {
    running: 'success', idle: 'info', alarm: 'danger', offline: 'warning',
  };
  return status.value ? map[status.value.state] ?? 'info' : 'info';
});
</script>
