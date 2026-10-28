<!--
  浏览器中的公共页面外框，提供导航、账号操作、顶栏状态、AI 抽屉与 router-view。
  模板先看公共区域与当前页面位置，再看脚本如何读取 auth store 与 useLineData；路由决定页面组件。
  App 当前传入 line-01，共享产线状态与 Redis 是两处独立存储；点击界面后仍通过后端请求处理业务。
-->
<!-- 这一段实现界面模板，服务于组织导航、全局连接状态、当前用户与页面容器。 -->
<template>
  <!-- 最外层容器：Element Plus 的纵向/横向弹性布局 -->
  <el-container class="layout">
  <!-- 渲染页面布局容器，应用 layout 样式类。 -->
    <!-- ---------------- 顶栏 ---------------- -->
    <el-header class="topbar">
    <!-- 渲染页面顶栏，应用 topbar 样式类。 -->
      <!-- 左侧：品牌标识 -->
      <div class="brand">
      <!-- 渲染容器，应用 brand 样式类。 -->
        <span class="brand-dot" />
        <!-- 渲染行内文字，应用 brand-dot 样式类。 -->
        <span class="brand-name">产线数字孪生监控平台</span>
        <!-- 渲染行内文字，应用 brand-name 样式类。 -->
      </div>

      <!-- 中间：主导航菜单。router 模式 → 点击即跳转路由 -->
      <el-menu class="nav" mode="horizontal" router :default-active="$route.path" :ellipsis="false" >
        <el-menu-item v-if="canSee('twin')" index="/twin">
        <!-- 渲染导航项，条件成立时显示（canSee('twin')）。 -->
          <el-icon><Monitor /></el-icon>实时孪生
        </el-menu-item>
        <!-- IO 只读信号(word 11~16) -->
        <el-menu-item v-if="canSee('io')" index="/io">
        <!-- 渲染导航项，条件成立时显示（canSee('io')）。 -->
          <el-icon><Switch /></el-icon>IO 信号
        </el-menu-item>
        <el-menu-item v-if="canSee('users')" index="/users">
        <!-- 渲染导航项，条件成立时显示（canSee('users')）。 -->
          <el-icon><User /></el-icon>用户管理
        </el-menu-item>
      </el-menu>

      <!-- 右侧：全局状态指示灯组 -->
      <div class="badges">
      <!-- 渲染容器，应用 badges 样式类。 -->
        <!-- ① 与后端 WebSocket 的连接状态 -->
        <!-- ② 边缘采集器在线状态（来自 MQTT edge/status + LWT 遗嘱） -->
        <span class="badge">
        <!-- 渲染行内文字，应用 badge 样式类。 -->
          <i class="dot" :class="connected ? 'ok' : 'off'" />
          <!-- 渲染图标或状态点，应用 dot 样式类。 -->
          服务 {{ connected ? '已连接' : '断开' }}
        </span>
        <span class="badge">
        <!-- 渲染行内文字，应用 badge 样式类。 -->
          <i class="dot" :class="edgeOnline ? 'ok' : 'off'" />
          <!-- 渲染图标或状态点，应用 dot 样式类。 -->
          边缘 {{ edgeText }}
        </span>
        <!-- ③ 产线运行状态标签（有状态时才显示） -->
        <el-tag v-if="status" :type="statusTagType" effect="dark" size="small" class="state-tag" >
          {{ statusText }}
        </el-tag>
        <!-- ④ 报警提示：悬停显示详情 -->
        <el-tooltip v-if="alarmText" :content="alarmText" placement="bottom">
        <!-- 渲染悬停提示，条件成立时显示（alarmText）。 -->
          <span class="badge alarm"><i class="dot alarm-dot" />报警</span>
          <!-- 渲染行内文字，应用 badge alarm 样式类。 -->
        </el-tooltip>
        <!-- 当前用户 + 登出(可见菜单才显示) -->
        <span v-if="auth.user" class="user-box">
        <!-- 渲染行内文字，应用 user-box 样式类，条件成立时显示（auth.user）。 -->
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
    <!-- 渲染页面主体，应用 body 样式类。 -->
      <!-- 路由出口 -->

      <!-- App 的公共框架继续存在，页面需要的数据由对应逻辑取得；这个标签自身不读取 PLC，也不查询数据库。 -->

      <router-view />
    </el-main>

    <AiDrawer v-if="auth.user" v-model="aiOpen" />
    <!-- 渲染AiDrawer 元素或组件，条件成立时显示（auth.user），与状态双向同步（aiOpen）。 -->
  </el-container>
</template>

<!-- 这一段实现组件状态与事件处理，服务于组织导航、全局连接状态、当前用户与页面容器。 -->
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
// 注册 AI 接口遇到 HTTP 401 时的统一处理函数。
  auth.user = null;
  router.push('/login');
});

/**
 * 取得产线数据。传入 'line-01'。
 * 注意：useLineData 内部是模块级单例，这里传什么产线，
 * 第一次调用时决定，之后所有调用返回同一个实例。
 */

// App 在这里使用 line-01 的共享现场状态，顶栏取其中的连接、边缘在线和工序字段。
// useLineData() 复用模块级 shared 实例，机械臂和 IO 页面因此能使用同一套状态与订阅。
// 当前不是按每次传入的产线编码创建独立实例，不能据此宣称已经支持任意多产线切换。

const { connected, edgeOnline, edgeText, status, alarmText } = useLineData('line-01');
// 取得按产线编码复用的数据单例，供多个页面共享状态。

const auth = useAuthStore();
const router = useRouter();
const aiOpen = ref(false);

// 菜单显隐:对照 router meta.requiredLevel
// level=1 普通 → twin + io(只读观测,无写操作)
// level=2 二级 → twin + io
// level=3 admin → 全部 + 用户管理
function canSee(routeName: string): boolean {
// 定义 canSee，用于按当前用户级别判断导航页面是否可见。
  if (!auth.user) return false;
  const routes = router.options.routes;
  const r = routes.find((x) => x.name === routeName);
  const need = (r?.meta as { requiredLevel?: number } | undefined)?.requiredLevel ?? 1;
  return auth.user.level >= need;
}

function levelTag(l: number): 'danger' | 'warning' | 'info' {
// 定义 levelTag，用于把用户操作级别转换为标签展示类型。
  return l === 3 ? 'danger' : l === 2 ? 'warning' : 'info';
}

async function onLogout() {
// 退出当前账号并切换到登录页面。
  await auth.logout();
  // 清除当前登录状态与会话信息。
  router.push('/login');
}

/**
 * 产线状态 → 中文文案。
 * computed 是「计算属性」：依赖的 status 变化时自动重新计算并更新 DOM，
 * 模板里写 statusText 就能拿到最新值。
 *
 * ★ 映射表是单点定义（services/lineState.ts），这里不要再自己写一份。
 *   之前这里只映射了原 4 态(running/idle/alarm/offline)，PLC 的 10 态工序
 *   (waiting_feed/feeding/assembling/waiting_robot/...) 查不到 → 直接把英文原值
 *   显示出来（如 "waiting_robot"），浏览器翻译后就会变成半通不通的英文/中文。
 *   现在统一走 lineState.ts，页面显示的都是标准中文。
 */
const statusText = computed(() => (status.value ? stateText(status.value.state) : ''));

/**
 * 产线状态 → 标签颜色类型。
 * 同样取自 lineState.ts（stateTagType），保证顶栏与孪生页配色一致。
 */
const statusTagType = computed(() => stateTagType(status.value?.state));
</script>

<!-- 这一段实现当前页面或组件的外观样式，服务于组织导航、全局连接状态、当前用户与页面容器。 -->
<style scoped>
/* 这一段为 .user-box 对应的界面元素定义尺寸、布局或视觉样式。 */
.user-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--panel-border);
}
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
