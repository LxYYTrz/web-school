<!--
  ============================================================================
  文件作用：应用根组件（外壳）—— 顶栏 + 内容区
  所属模块：web/src/
  ============================================================================

  【宏观定位】整个页面只有这一层"外壳"。它负责：
    ① 顶部导航条：品牌名 + 菜单（实时孪生 / 产线状态）
    ② 全局状态指示灯：服务连接、边缘在线、产线状态、报警提示
    ③ 底部内容区：<router-view /> —— 由路由决定显示哪个页面

  【数据来源】
    本组件调用 useLineData('line-01') 拿到**模块级单例**的数据层。
    因为是单例，所以：
      - 顶栏和页面内容用的是同一份数据，天然同步
      - 页面切换时数据不会断（WebSocket 连接不会因为路由切换而重建）
      - 不会出现"顶栏显示在线、页面显示离线"的矛盾

  【模板结构与 Element Plus 组件对应】
    el-container  弹性布局容器
      el-header   顶栏
      el-main     内容区
    el-menu      菜单（router 模式：菜单项 index 即路由路径）
    el-tag       状态标签（success/info/danger/warning 四种色）
    el-tooltip   悬浮提示（报警详情放这里）
    el-icon      图标容器
  ============================================================================
-->
<!--
  ============================================================================
  文件作用：应用根组件（外壳）—— 顶栏 + 内容区
  所属模块：web/src/
  ============================================================================

  【宏观定位】整个页面只有这一层"外壳"。它负责：
    ① 顶部导航条：品牌名 + 菜单（实时孪生 / 产线状态）
    ② 全局状态指示灯：服务连接、边缘在线、产线状态、报警提示
    ③ 底部内容区：<router-view /> —— 由路由决定显示哪个页面

  【数据来源】
    本组件调用 useLineData('line-01') 拿到**模块级单例**的数据层。
    因为是单例，所以：
      - 顶栏和页面内容用的是同一份数据，天然同步
      - 页面切换时数据不会断（WebSocket 连接不会因为路由切换而重建）
      - 不会出现"顶栏显示在线、页面显示离线"的矛盾

  【模板结构与 Element Plus 组件对应】
    el-container  弹性布局容器
      el-header   顶栏
      el-main     内容区
    el-menu      菜单（router 模式：菜单项 index 即路由路径）
    el-tag       状态标签（success/info/danger/warning 四种色）
    el-tooltip   悬浮提示（报警详情放这里）
    el-icon      图标容器
  ============================================================================
-->
<template>
  <!-- 最外层容器：Element Plus 的纵向/横向弹性布局 -->
  <el-container class="layout">
    <!-- ---------------- 顶栏 ---------------- -->
    <el-header class="topbar">
      <!-- 左侧：品牌标识 -->
      <div class="brand">
        <span class="brand-dot" />
        <span class="brand-name">产线数字孪生监控平台</span>
      </div>

      <!-- 中间：主导航菜单。router 模式 → 点击即跳转路由 -->
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
        <el-menu-item v-if="canSee('users')" index="/users">
          <el-icon><User /></el-icon>用户管理
        </el-menu-item>
      </el-menu>

      <!-- 右侧：全局状态指示灯组 -->
      <div class="badges">
        <!-- ① 与后端 WebSocket 的连接状态 -->
        <!-- ② 边缘采集器在线状态（来自 MQTT edge/status + LWT 遗嘱） -->
        <span class="badge">
          <i class="dot" :class="connected ? 'ok' : 'off'" />
          服务 {{ connected ? '已连接' : '断开' }}
        </span>
        <span class="badge">
          <i class="dot" :class="edgeOnline ? 'ok' : 'off'" />
          边缘 {{ edgeText }}
        </span>
        <!-- ③ 产线运行状态标签（有状态时才显示） -->
        <el-tag
          v-if="status"
          :type="statusTagType"
          effect="dark"
          size="small"
          class="state-tag"
        >
          {{ statusText }}
        </el-tag>
        <!-- ④ 报警提示：悬停显示详情 -->
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

    <!-- ---------------- 内容区 ---------------- -->
    <el-main class="body">
      <!-- 路由出口：/twin 渲染 TwinView.vue，/status 渲染 StatusView.vue -->
      <router-view />
    </el-main>

    <AiDrawer v-if="auth.user" v-model="aiOpen" />
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Monitor, User, ChatDotRound, Switch } from '@element-plus/icons-vue';
import { useLineData } from './composables/useLineData';
import { useAuthStore } from './stores/auth';
import { stateText, stateTagType } from './services/lineState';
import AiDrawer from './components/AiDrawer.vue';
import { setAiUnauthorizedHandler } from './services/ai';

// AI 流会话过期时的处理,与 services/auth.ts 的约定一致:
// 清掉本地用户态并回登录页,不自己弹错。
setAiUnauthorizedHandler(() => {
  auth.user = null;
  router.push('/login');
});

/**
 * 取得产线数据。传入 'line-01'。
 * 注意：useLineData 内部是模块级单例，这里传什么产线，
 * 第一次调用时决定，之后所有调用返回同一个实例。
 */
const { connected, edgeOnline, edgeText, status, alarmText } = useLineData('line-01');

const auth = useAuthStore();
const router = useRouter();
const aiOpen = ref(false);

// 菜单显隐:对照 router meta.requiredLevel
// level=1 普通 → twin + io(只读观测,无写操作)
// level=2 二级 → twin + io
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

/**
 * 产线状态 → 中文文案。
 * computed 是「计算属性」：依赖的 status 变化时自动重新计算并更新 DOM，
 * 模板里写 statusText 就能拿到最新值。
 *
 * ★ 映射表是单点定义（services/lineState.ts），这里不要再自己写一份。
 *   之前这里只映射了原 4 态(running/idle/alarm/offline)，PLC 的 10 态工序
 *   (waiting_feed/feeding/assembling/unloading/...) 查不到 → 直接把英文原值
 *   显示出来（如 "unloading"），浏览器翻译后就成了"等待机器人完成"这种鬼话，
 *   实际应为「下料中」。现在统一走 lineState.ts。
 */
const statusText = computed(() => (status.value ? stateText(status.value.state) : ''));

/**
 * 产线状态 → 标签颜色类型。
 * Element Plus 的 el-tag type 决定配色：success 绿 / info 灰 / danger 红 / warning 橙
 * 同样取自 lineState.ts（stateTagType），保证顶栏与孪生页配色一致。
 */
const statusTagType = computed(() => stateTagType(status.value?.state));
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
