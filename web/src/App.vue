<!--
  ============================================================================
  文件作用：应用根组件（外壳）—— 顶栏 + 内容区
  所属模块：web/src/
  ============================================================================

  【宏观定位】整个页面只有这一层"外壳"。它负责：
    ① 顶部导航条：品牌名 + 菜单（实时孪生 / IO 信号 / 用户管理）
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
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
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
      <!-- 结束 div 元素及其中的内容。 -->

      <!-- 中间：主导航菜单。router 模式 → 点击即跳转路由 -->
      <el-menu class="nav" mode="horizontal" router :default-active="$route.path" :ellipsis="false" >
      <!-- 渲染导航菜单。；设置 class=nav：指定 CSS 样式类。；设置 mode=horizontal：设置菜单布局方向。；启用当前元素的 router 布尔属性。；设置 :default-active=$route.path：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；设置 :ellipsis=false：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；结束当前元素的属性列表或自闭合标签。 -->
        <el-menu-item v-if="canSee('twin')" index="/twin">
        <!-- 渲染导航项，条件成立时显示（canSee('twin')）。 关键字：v-if＝条件为真时才渲染。 -->
          <el-icon><Monitor /></el-icon>实时孪生
          <!-- 渲染图标容器。 -->
        </el-menu-item>
        <!-- 结束 el-menu-item 元素及其中的内容。 -->
        <!-- IO 只读信号(word 11~16) -->
        <el-menu-item v-if="canSee('io')" index="/io">
        <!-- 渲染导航项，条件成立时显示（canSee('io')）。 关键字：v-if＝条件为真时才渲染。 -->
          <el-icon><Switch /></el-icon>IO 信号
          <!-- 渲染图标容器。 -->
        </el-menu-item>
        <!-- 结束 el-menu-item 元素及其中的内容。 -->
        <el-menu-item v-if="canSee('users')" index="/users">
        <!-- 渲染导航项，条件成立时显示（canSee('users')）。 关键字：v-if＝条件为真时才渲染。 -->
          <el-icon><User /></el-icon>用户管理
          <!-- 渲染图标容器。 -->
        </el-menu-item>
        <!-- 结束 el-menu-item 元素及其中的内容。 -->
      </el-menu>
      <!-- 结束 el-menu 元素及其中的内容。 -->

      <!-- 右侧：全局状态指示灯组 -->
      <div class="badges">
      <!-- 渲染容器，应用 badges 样式类。 -->
        <!-- ① 与后端 WebSocket 的连接状态 -->
        <!-- ② 边缘采集器在线状态（来自 MQTT edge/status + LWT 遗嘱） -->
        <span class="badge">
        <!-- 渲染行内文字，应用 badge 样式类。 -->
          <i class="dot" :class="connected ? 'ok' : 'off'" />
          <!-- 渲染图标或状态点，应用 dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
          服务 {{ connected ? '已连接' : '断开' }}
          <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
        <span class="badge">
        <!-- 渲染行内文字，应用 badge 样式类。 -->
          <i class="dot" :class="edgeOnline ? 'ok' : 'off'" />
          <!-- 渲染图标或状态点，应用 dot 样式类。 关键字：:＝属性动态绑定的简写。 -->
          边缘 {{ edgeText }}
          <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
        <!-- ③ 产线运行状态标签（有状态时才显示） -->
        <el-tag v-if="status" :type="statusTagType" effect="dark" size="small" class="state-tag" >
        <!-- 渲染状态标签。；设置 v-if=status：设置该属性。 关键字：v-if＝条件为真时才渲染。；设置 :type=statusTagType：选择组件外观或字段类型。 关键字：:＝属性动态绑定的简写。；设置 effect=dark：设置组件视觉效果。；设置 size=small：设置组件尺寸。；设置 class=state-tag：指定 CSS 样式类。；结束当前元素的属性列表或自闭合标签。 -->
          {{ statusText }}
          <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </el-tag>
        <!-- 结束 el-tag 元素及其中的内容。 -->
        <!-- ④ 报警提示：悬停显示详情 -->
        <el-tooltip v-if="alarmText" :content="alarmText" placement="bottom">
        <!-- 渲染悬停提示，条件成立时显示（alarmText）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->
          <span class="badge alarm"><i class="dot alarm-dot" />报警</span>
          <!-- 渲染行内文字，应用 badge alarm 样式类。 -->
        </el-tooltip>
        <!-- 结束 el-tooltip 元素及其中的内容。 -->
        <!-- 当前用户 + 登出(可见菜单才显示) -->
        <span v-if="auth.user" class="user-box">
        <!-- 渲染行内文字，应用 user-box 样式类，条件成立时显示（auth.user）。 关键字：v-if＝条件为真时才渲染。 -->
          <!-- AI 抽屉:只读查询对所有登录用户开放,能否下发由建议卡片自己按 level 挡 -->
          <el-tooltip content="AI 产线助手" placement="bottom">
          <!-- 渲染悬停提示。 -->
            <el-button size="small" text @click="aiOpen = true">
            <!-- 渲染操作按钮。 关键字：@＝事件监听的简写。 -->
              <el-icon><ChatDotRound /></el-icon>AI
              <!-- 渲染图标容器。 -->
            </el-button>
            <!-- 结束 el-button 元素及其中的内容。 -->
          </el-tooltip>
          <!-- 结束 el-tooltip 元素及其中的内容。 -->
          <el-tag size="small" :type="levelTag(auth.user.level)" effect="dark">
          <!-- 渲染状态标签。 关键字：:＝属性动态绑定的简写。 -->
            {{ auth.user.username }} · L{{ auth.user.level }}
            <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
          </el-tag>
          <!-- 结束 el-tag 元素及其中的内容。 -->
          <el-button size="small" text @click="onLogout">登出</el-button>
          <!-- 渲染操作按钮。 关键字：@＝事件监听的简写。 -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </el-header>
    <!-- 结束 el-header 元素及其中的内容。 -->

    <!-- ---------------- 内容区 ---------------- -->
    <el-main class="body">
    <!-- 渲染页面主体，应用 body 样式类。 -->
      <!-- 路由出口 -->
      <router-view />
      <!-- 渲染当前路由对应的页面。 -->
    </el-main>
    <!-- 结束 el-main 元素及其中的内容。 -->

    <AiDrawer v-if="auth.user" v-model="aiOpen" />
    <!-- 渲染AiDrawer 元素或组件，条件成立时显示（auth.user），与状态双向同步（aiOpen）。 关键字：v-if＝条件为真时才渲染；v-model＝让输入值和状态双向同步。 -->
  </el-container>
  <!-- 结束 el-container 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { computed, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useRouter } from 'vue-router';
// 从 vue-router 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Monitor, User, ChatDotRound, Switch } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useLineData } from './composables/useLineData';
// 从 ./composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useAuthStore } from './stores/auth';
// 从 ./stores/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { stateText, stateTagType } from './services/lineState';
// 从 ./services/lineState 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import AiDrawer from './components/AiDrawer.vue';
// 从 ./components/AiDrawer.vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { setAiUnauthorizedHandler } from './services/ai';
// 从 ./services/ai 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// AI 流会话过期时的处理,与 services/auth.ts 的约定一致:
// 清掉本地用户态并回登录页,不自己弹错。
setAiUnauthorizedHandler(() => {
// 调用 setAiUnauthorizedHandler；括号中的表达式是传入的参数。
  auth.user = null;
  // 把右侧表达式的结果写入 auth.user。 关键字：null＝空值。
  router.push('/login');
  // 调用 router.push，把括号中的值作为参数传入。
});
// 结束当前回调或对象，并完成外层函数调用。

/**
 * 取得产线数据。传入 'line-01'。
 * 注意：useLineData 内部是模块级单例，这里传什么产线，
 * 第一次调用时决定，之后所有调用返回同一个实例。
 */
const { connected, edgeOnline, edgeText, status, alarmText } = useLineData('line-01');
// 从右侧结果中取出 connected, edgeOnline, edgeText, status, alarmText，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。

const auth = useAuthStore();
// 声明 auth，初始值由 useAuthStore() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const router = useRouter();
// 声明 router，初始值由 useRouter() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const aiOpen = ref(false);
// 声明 aiOpen，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。

// 菜单显隐:对照 router meta.requiredLevel
// level=1 普通 → twin + io(只读观测,无写操作)
// level=2 二级 → twin + io
// level=3 admin → 全部 + 用户管理
function canSee(routeName: string): boolean {
// 定义函数 canSee。 关键字：function＝定义函数。
  if (!auth.user) return false;
  // 判断 if (!auth.user) return false; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；false＝布尔假值。
  const routes = router.options.routes;
  // 声明 routes，初始值由 router.options.routes 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const r = routes.find((x) => x.name === routeName);
  // 声明 r，初始值由 routes.find((x) => x.name === routeName) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  const need = (r?.meta as { requiredLevel?: number } | undefined)?.requiredLevel ?? 1;
  // 声明 need，初始值由 (r?.meta as { requiredLevel?: number } | undefined)?.requiredLevel ?? 1 计算得到。 关键字：const＝声明不可重新绑定的变量；undefined＝未定义值。
  return auth.user.level >= need;
  // 返回 auth.user.level >= need 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

function levelTag(l: number): 'danger' | 'warning' | 'info' {
// 定义函数 levelTag。 关键字：function＝定义函数。
  return l === 3 ? 'danger' : l === 2 ? 'warning' : 'info';
  // 返回 l === 3 ? 'danger' : l === 2 ? 'warning' : 'info' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

async function onLogout() {
// 定义函数 onLogout。 关键字：async＝声明异步函数；function＝定义函数。
  await auth.logout();
  // 调用 auth.logout，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  router.push('/login');
  // 调用 router.push，把括号中的值作为参数传入。
}
// 结束当前对象、函数或条件代码块。

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
// 声明 statusText，初始值由 computed(() => (status.value ? stateText(status.value.state) : '')) 计算得到。 关键字：const＝声明不可重新绑定的变量。

/**
 * 产线状态 → 标签颜色类型。
 * Element Plus 的 el-tag type 决定配色：success 绿 / info 灰 / danger 红 / warning 橙
 * 同样取自 lineState.ts（stateTagType），保证顶栏与孪生页配色一致。
 */
const statusTagType = computed(() => stateTagType(status.value?.state));
// 声明 statusTagType，初始值由 computed(() => stateTagType(status.value?.state)) 计算得到。 关键字：const＝声明不可重新绑定的变量。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
.user-box {
/* 对选择器 .user-box 匹配的元素应用后续声明。 */
  display: inline-flex;
  /* display=inline-flex：决定元素如何布局或显示。 */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  gap: 6px;
  /* gap=6px：设置子元素间距。 */
  margin-left: 12px;
  /* margin-left=12px：设置该样式属性。 */
  padding-left: 12px;
  /* padding-left=12px：设置该样式属性。 */
  border-left: 1px solid var(--panel-border);
  /* border-left=1px solid var(--panel-border)：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
