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
        <!-- 菜单项 index 就是路由 path -->
        <el-menu-item index="/twin">
          <el-icon><Monitor /></el-icon>实时孪生
        </el-menu-item>
        <el-menu-item index="/status">
          <el-icon><Odometer /></el-icon>产线状态
        </el-menu-item>
      </el-menu>

      <!-- 右侧：全局状态指示灯组 -->
      <div class="badges">
        <!-- ① 与后端 WebSocket 的连接状态 -->
        <span class="badge">
          <i class="dot" :class="connected ? 'ok' : 'off'" />
          服务 {{ connected ? '已连接' : '断开' }}
        </span>
        <!-- ② 边缘采集器在线状态（来自 MQTT edge/status + LWT 遗嘱） -->
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
      </div>
    </el-header>

    <!-- ---------------- 内容区 ---------------- -->
    <el-main class="body">
      <!-- 路由出口：/twin 渲染 TwinView.vue，/status 渲染 StatusView.vue -->
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
/**
 * <script setup> 是 Vue 3 的组合式 API 语法糖写法：
 *   - 顶层变量自动暴露给模板（不用 return { xxx }）
 *   - 引入的组件自动可用（不用 components: { xxx }）
 *   - 编译效率更高
 */
import { computed } from 'vue';                    // Vue 的响应式计算属性
import { Monitor, Odometer } from '@element-plus/icons-vue'; // 图标组件
import { useLineData } from './composables/useLineData';       // 数据层单例

/**
 * 取得产线数据。传入 'line-01'。
 * 注意：useLineData 内部是模块级单例，这里传什么产线，
 * 第一次调用时决定，之后所有调用返回同一个实例。
 */
const { connected, edgeOnline, edgeText, status, alarmText } = useLineData('line-01');

/**
 * 产线状态 → 中文文案。
 * computed 是「计算属性」：依赖的 status 变化时自动重新计算并更新 DOM，
 * 模板里写 statusText 就能拿到最新值。
 */
const statusText = computed(() => {
  // 契约里 state 的四个枚举值 → 中文
  const map: Record<string, string> = {
    running: '运行中', idle: '待机', alarm: '报警', offline: '离线',
  };
  // 有状态就查表，查不到就原样显示（防止新枚举值显示空白）
  return status.value ? map[status.value.state] ?? status.value.state : '';
});

/**
 * 产线状态 → 标签颜色类型。
 * Element Plus 的 el-tag type 决定配色：success 绿 / info 灰 / danger 红 / warning 橙
 */
const statusTagType = computed(() => {
  const map: Record<string, 'success' | 'info' | 'danger' | 'warning'> = {
    running: 'success', idle: 'info', alarm: 'danger', offline: 'warning',
  };
  return status.value ? map[status.value.state] ?? 'info' : 'info';
});
</script>
