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
        <el-menu-item v-if="canSee('twin')" index="/twin">
          <el-icon><Monitor /></el-icon>实时孪生
        </el-menu-item>
        <!-- @deprecated 2026-10-16 暂停使用(产线状态页暂停,文件保留不删) -->
        <!--
        <el-menu-item v-if="canSee('status')" index="/status">
          <el-icon><Odometer /></el-icon>产线状态
        </el-menu-item>
        -->
        <!-- 2026-10-16 新增:IO 只读信号(word 11~16),取代停用的产线状态页承担信号观测 -->
        <el-menu-item v-if="canSee('io')" index="/io">
          <el-icon><Switch /></el-icon>IO 信号
        </el-menu-item>
        <el-menu-item v-if="canSee('vision')" index="/vision">
          <el-icon><CameraFilled /></el-icon>视觉检测
        </el-menu-item>
        <el-menu-item v-if="canSee('users')" index="/users">
          <el-icon><User /></el-icon>用户管理
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
        <!-- 当前用户 + 登出(可见菜单才显示) -->
        <span v-if="auth.user" class="user-box">
          <!-- AI 抽屉:只读查询对所有登录用户开放,能否下发由建议卡片自己按 level 挡 -->
          <el-tooltip content="AI 产线助手" placement="bottom">
            <el-button size="small" text @click="aiOpen = true">
              <el-icon><ChatDotRound /></el-icon>AI
            </el-button>
          </el-tooltip>
          <el-tag size="small" :type="levelTag(auth.user.level)" effect="dark">
            {{ auth.user.username }} · L{{ auth.user.level }}
          </el-tag>
          <el-button size="small" text @click="onLogout">登出</el-button>
        </span>
      </div>
    </el-header>

    <el-main class="body">
      <router-view />
    </el-main>

    <AiDrawer v-if="auth.user" v-model="aiOpen" />
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Monitor, CameraFilled, User, ChatDotRound, Switch } from '@element-plus/icons-vue';
import { useLineData } from './composables/useLineData';
import { useAuthStore } from './stores/auth';
import AiDrawer from './components/AiDrawer.vue';
import { setAiUnauthorizedHandler } from './services/ai';

// AI 流会话过期时的处理,与 services/auth.ts 的约定一致:
// 清掉本地用户态并回登录页,不自己弹错。
setAiUnauthorizedHandler(() => {
  auth.user = null;
  router.push('/login');
});

const { connected, edgeOnline, edgeText, status, alarmText } = useLineData('line-01');

const auth = useAuthStore();
const router = useRouter();
const aiOpen = ref(false);

// 菜单显隐:对照 router meta.requiredLevel
// level=1 普通 → twin + io(只读观测,无写操作)
// level=2 二级 → twin + io + vision
// level=3 admin → 全部 + 用户管理
function canSee(routeName: string): boolean {
  if (!auth.user) return false;
  const routes = router.options.routes;
  const r = routes.find((x) => x.name === routeName);
  const need = (r?.meta as { requiredLevel?: number } | undefined)?.requiredLevel ?? 1;
  return auth.user.level >= need;
}

function levelTag(l: number): 'danger' | 'warning' | 'info' {
  return l === 3 ? 'danger' : l === 2 ? 'warning' : 'info';
}

async function onLogout() {
  await auth.logout();
  router.push('/login');
}

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

<style scoped>
.user-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--panel-border);
}
</style>
