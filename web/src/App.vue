<!--
  <!-- 这一段负责组织导航、全局连接状态、当前用户与页面容器，为后续代码提供当前文件的处理入口。 -->
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
<!-- 这一段实现界面模板，服务于组织导航、全局连接状态、当前用户与页面容器。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <!-- 最外层容器：Element Plus 的纵向/横向弹性布局 -->
  <el-container class="layout">
  <!-- 渲染页面布局容器，应用 layout 样式类。 -->
  <!-- el-container 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 layout -->
    <!-- ---------------- 顶栏 ---------------- -->
    <el-header class="topbar">
    <!-- 渲染页面顶栏，应用 topbar 样式类。 -->
    <!-- el-header 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 topbar -->
      <!-- 左侧：品牌标识 -->
      <div class="brand">
      <!-- 渲染容器，应用 brand 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 brand -->
        <span class="brand-dot" />
        <!-- 渲染行内文字，应用 brand-dot 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 brand-dot -->
        <span class="brand-name">产线数字孪生监控平台</span>
        <!-- 渲染行内文字，应用 brand-name 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 brand-name -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->

      <!-- 中间：主导航菜单。router 模式 → 点击即跳转路由 -->
      <el-menu class="nav" mode="horizontal" router :default-active="$route.path" :ellipsis="false" >
      <!-- 在界面中配置 el-menu 元素及其内容或事件绑定。 -->
      <!-- el-menu 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 nav；router 表示把菜单项编号用作路由路径；:default-active 表示把表达式结果动态绑定到组件属性，当前值为 $route.path；:ellipsis 表示把表达式结果动态绑定到组件属性，当前值为 false -->
        <el-menu-item v-if="canSee('twin')" index="/twin">
        <!-- 渲染导航项，条件成立时显示（canSee('twin')）。 -->
        <!-- el-menu-item 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 canSee('twin')；index 表示当前菜单项的路由路径或编号，当前值为 /twin -->
          <el-icon><Monitor /></el-icon>实时孪生
          <!-- 在界面中配置 el-icon 元素及其内容或事件绑定。 -->
          <!-- el-icon 是当前使用的界面元素或组件 -->
        </el-menu-item>
        <!-- 结束 el-menu-item 元素及其中的内容。 -->
        <!-- el-menu-item 是当前使用的界面元素或组件 -->
        <!-- IO 只读信号(word 11~16) -->
        <el-menu-item v-if="canSee('io')" index="/io">
        <!-- 渲染导航项，条件成立时显示（canSee('io')）。 -->
        <!-- el-menu-item 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 canSee('io')；index 表示当前菜单项的路由路径或编号，当前值为 /io -->
          <el-icon><Switch /></el-icon>IO 信号
          <!-- 在界面中配置 el-icon 元素及其内容或事件绑定。 -->
          <!-- el-icon 是当前使用的界面元素或组件 -->
        </el-menu-item>
        <!-- 结束 el-menu-item 元素及其中的内容。 -->
        <!-- el-menu-item 是当前使用的界面元素或组件 -->
        <el-menu-item v-if="canSee('users')" index="/users">
        <!-- 渲染导航项，条件成立时显示（canSee('users')）。 -->
        <!-- el-menu-item 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 canSee('users')；index 表示当前菜单项的路由路径或编号，当前值为 /users -->
          <el-icon><User /></el-icon>用户管理
          <!-- 在界面中配置 el-icon 元素及其内容或事件绑定。 -->
          <!-- el-icon 是当前使用的界面元素或组件 -->
        </el-menu-item>
        <!-- 结束 el-menu-item 元素及其中的内容。 -->
        <!-- el-menu-item 是当前使用的界面元素或组件 -->
      </el-menu>
      <!-- 结束 el-menu 元素及其中的内容。 -->
      <!-- el-menu 是当前使用的界面元素或组件 -->

      <!-- 右侧：全局状态指示灯组 -->
      <div class="badges">
      <!-- 渲染容器，应用 badges 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 badges -->
        <!-- ① 与后端 WebSocket 的连接状态 -->
        <!-- ② 边缘采集器在线状态（来自 MQTT edge/status + LWT 遗嘱） -->
        <span class="badge">
        <!-- 渲染行内文字，应用 badge 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 badge -->
          <i class="dot" :class="connected ? 'ok' : 'off'" />
          <!-- 渲染图标或状态点，应用 dot 样式类。 -->
          <!-- i 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 connected ? 'ok' : 'off' -->
          服务 {{ connected ? '已连接' : '断开' }}
          <!-- 显示花括号中表达式的结果，供当前处理流程继续使用。 -->
          <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
        <!-- span 是当前使用的界面元素或组件 -->
        <span class="badge">
        <!-- 渲染行内文字，应用 badge 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 badge -->
          <i class="dot" :class="edgeOnline ? 'ok' : 'off'" />
          <!-- 渲染图标或状态点，应用 dot 样式类。 -->
          <!-- i 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 edgeOnline ? 'ok' : 'off' -->
          边缘 {{ edgeText }}
          <!-- 显示花括号中表达式的结果，供当前处理流程继续使用。 -->
          <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
        <!-- span 是当前使用的界面元素或组件 -->
        <!-- ③ 产线运行状态标签（有状态时才显示） -->
        <el-tag v-if="status" :type="statusTagType" effect="dark" size="small" class="state-tag" >
        <!-- 在界面中配置 el-tag 元素及其内容或事件绑定。 -->
        <!-- el-tag 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 status；:type 表示把表达式结果动态绑定到组件属性，当前值为 statusTagType；effect 表示组件视觉风格，当前值为 dark；size 表示组件尺寸，当前值为 small；class 表示应用的样式类，当前值为 state-tag -->
          {{ statusText }}
          <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
          <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
        </el-tag>
        <!-- 结束 el-tag 元素及其中的内容。 -->
        <!-- el-tag 是当前使用的界面元素或组件 -->
        <!-- ④ 报警提示：悬停显示详情 -->
        <el-tooltip v-if="alarmText" :content="alarmText" placement="bottom">
        <!-- 渲染悬停提示，条件成立时显示（alarmText）。 -->
        <!-- el-tooltip 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 alarmText；:content 表示把表达式结果动态绑定到组件属性，当前值为 alarmText；placement 表示弹层出现位置，当前值为 bottom -->
          <span class="badge alarm"><i class="dot alarm-dot" />报警</span>
          <!-- 渲染行内文字，应用 badge alarm 样式类。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 badge alarm；class 表示应用的样式类，当前值为 dot alarm-dot -->
        </el-tooltip>
        <!-- 结束 el-tooltip 元素及其中的内容。 -->
        <!-- el-tooltip 是当前使用的界面元素或组件 -->
        <!-- 当前用户 + 登出(可见菜单才显示) -->
        <span v-if="auth.user" class="user-box">
        <!-- 渲染行内文字，应用 user-box 样式类，条件成立时显示（auth.user）。 -->
        <!-- span 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 auth.user；class 表示应用的样式类，当前值为 user-box -->
          <!-- AI 抽屉:只读查询对所有登录用户开放,能否下发由建议卡片自己按 level 挡 -->
          <el-tooltip content="AI 产线助手" placement="bottom">
          <!-- 在界面中配置 el-tooltip 元素及其内容或事件绑定。 -->
          <!-- el-tooltip 是当前使用的界面元素或组件；content 表示提示弹层展示的正文，当前值为 AI 产线助手；placement 表示弹层出现位置，当前值为 bottom -->
            <el-button size="small" text @click="aiOpen = true">
            <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
            <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 aiOpen = true -->
              <el-icon><ChatDotRound /></el-icon>AI
              <!-- 在界面中配置 el-icon 元素及其内容或事件绑定。 -->
              <!-- el-icon 是当前使用的界面元素或组件 -->
            </el-button>
            <!-- 结束 el-button 元素及其中的内容。 -->
            <!-- el-button 是当前使用的界面元素或组件 -->
          </el-tooltip>
          <!-- 结束 el-tooltip 元素及其中的内容。 -->
          <!-- el-tooltip 是当前使用的界面元素或组件 -->
          <el-tag size="small" :type="levelTag(auth.user.level)" effect="dark">
          <!-- 在界面中配置 el-tag 元素及其内容或事件绑定。 -->
          <!-- el-tag 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；:type 表示把表达式结果动态绑定到组件属性，当前值为 levelTag(auth.user.level)；effect 表示组件视觉风格，当前值为 dark -->
            {{ auth.user.username }} · L{{ auth.user.level }}
            <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
            <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
          </el-tag>
          <!-- 结束 el-tag 元素及其中的内容。 -->
          <!-- el-tag 是当前使用的界面元素或组件 -->
          <el-button size="small" text @click="onLogout">登出</el-button>
          <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
          <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 onLogout -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
        <!-- span 是当前使用的界面元素或组件 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </el-header>
    <!-- 结束 el-header 元素及其中的内容。 -->
    <!-- el-header 是当前使用的界面元素或组件 -->

    <!-- ---------------- 内容区 ---------------- -->
    <el-main class="body">
    <!-- 渲染页面主体，应用 body 样式类。 -->
    <!-- el-main 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 body -->
      <!-- 路由出口 -->

      <!-- router-view 是当前路由页面的显示位置：菜单切换后，路由器在这里显示孪生、IO 或用户管理等组件。 -->
      <!-- App 的公共框架继续存在，页面需要的数据由对应逻辑取得；这个标签自身不读取 PLC，也不查询数据库。 -->

      <router-view />
      <!-- 在界面中配置 router-view 元素及其内容或事件绑定。 -->
      <!-- router-view 是当前使用的界面元素或组件 -->
    </el-main>
    <!-- 结束 el-main 元素及其中的内容。 -->
    <!-- el-main 是当前使用的界面元素或组件 -->

    <AiDrawer v-if="auth.user" v-model="aiOpen" />
    <!-- 渲染AiDrawer 元素或组件，条件成立时显示（auth.user），与状态双向同步（aiOpen）。 -->
    <!-- AiDrawer 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 auth.user；v-model 表示把输入内容与响应式变量双向同步，当前值为 aiOpen -->
  </el-container>
  <!-- 结束 el-container 元素及其中的内容。 -->
  <!-- el-container 是当前使用的界面元素或组件 -->
</template>
<!-- 结束 template 组件或元素对应的界面区域。 -->
<!-- template 是当前使用的界面元素或组件 -->
<!-- 这一段完成了界面布局和数据展示的定义，供页面渲染时使用。 -->

<!-- 这一段实现组件状态与事件处理，服务于组织导航、全局连接状态、当前用户与页面容器。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { computed, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// computed：Vue 根据其他响应式值计算并缓存结果的函数；ref：Vue 创建可通过 .value 读写的响应式引用
import { useRouter } from 'vue-router';
// 从 vue-router 导入这一行列出的符号，供本文件调用。
// useRouter：Vue Router 获取路由实例的函数
import { Monitor, User, ChatDotRound, Switch } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。
// Monitor：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束；User：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束；ChatDotRound：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束；Switch：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束
import { useLineData } from './composables/useLineData';
// 从 ./composables/useLineData 导入这一行列出的符号，供本文件调用。
// useLineData：从 ./composables/useLineData 导入的对象，用于本文件的调用或类型约束
import { useAuthStore } from './stores/auth';
// 从 ./stores/auth 导入这一行列出的符号，供本文件调用。
// useAuthStore：项目定义的登录状态仓库入口
import { stateText, stateTagType } from './services/lineState';
// 从 ./services/lineState 导入这一行列出的符号，供本文件调用。
// stateText：从 ./services/lineState 导入的对象，用于本文件的调用或类型约束；stateTagType：从 ./services/lineState 导入的对象，用于本文件的调用或类型约束
import AiDrawer from './components/AiDrawer.vue';
// 从 ./components/AiDrawer.vue 导入这一行列出的符号，供本文件调用。
// AiDrawer：从 ./components/AiDrawer.vue 导入的对象，用于本文件的调用或类型约束
import { setAiUnauthorizedHandler } from './services/ai';
// 从 ./services/ai 导入这一行列出的符号，供本文件调用。
// setAiUnauthorizedHandler：从 ./services/ai 导入的对象，用于本文件的调用或类型约束

// AI 流会话过期时的处理,与 services/auth.ts 的约定一致:
// 清掉本地用户态并回登录页,不自己弹错。
setAiUnauthorizedHandler(() => {
// 注册 AI 接口遇到 HTTP 401 时的统一处理函数。
// setAiUnauthorizedHandler：从 ./services/ai 导入的对象，用于本文件的调用或类型约束
  auth.user = null;
  // 把右侧表达式的结果写入 auth.user。
  // auth：Pinia 登录状态仓库实例；user：当前会话或调用方的用户信息
  router.push('/login');
  // 向数组末尾追加元素。
  // router：前端页面路由器实例；push：向数组末尾追加元素
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

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
// connected：连接是否已建立的状态标记；status：当前连接、产线、请求或指令的状态字段；useLineData：从 ./composables/useLineData 导入的对象，用于本文件的调用或类型约束

const auth = useAuthStore();
// 创建或使用项目定义的登录状态仓库入口，将结果保存或写入 auth。
// auth：Pinia 登录状态仓库实例；useAuthStore：项目定义的登录状态仓库入口
const router = useRouter();
// 创建或使用Vue Router 获取路由实例的函数，将结果保存或写入 router。
// router：前端页面路由器实例；useRouter：Vue Router 获取路由实例的函数
const aiOpen = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 aiOpen。
// aiOpen：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用

// 菜单显隐:对照 router meta.requiredLevel
// level=1 普通 → twin + io(只读观测,无写操作)
// level=2 二级 → twin + io
// level=3 admin → 全部 + 用户管理
// 这一段定义 canSee，用于按当前用户级别判断导航页面是否可见。
function canSee(routeName: string): boolean {
// 定义 canSee，用于按当前用户级别判断导航页面是否可见。
// canSee：按当前用户级别判断导航页面是否可见；routeName：当前方法接收的参数，类型为 string
  if (!auth.user) return false;
  // 检查(!auth.user) return false;，按判断结果进入对应的处理分支。
  // auth：Pinia 登录状态仓库实例；user：当前会话或调用方的用户信息
  const routes = router.options.routes;
  // 根据 router.options.routes 设置 routes，供当前流程后续使用。
  // routes：本处保存 router.options.routes 的结果；router：前端页面路由器实例；options：本处声明的字段或类型，类型为 RouterOptions
  const r = routes.find((x) => x.name === routeName);
  // 查找首个满足条件的集合元素，将结果保存或写入 r。
  // r：本处保存 routes.find((x) => x.name === routeName) 的结果；routes：本处保存 router.options.routes 的结果；find：查找首个满足条件的集合元素；x：当前方法接收的参数；name：当前对象的名称字段；routeName：当前方法接收的参数，类型为 string
  const need = (r?.meta as { requiredLevel?: number } | undefined)?.requiredLevel ?? 1;
  // 根据 (r?.meta as { requiredLevel?: number } | undefined)?.requiredLevel ?? 1 设置 need，供当前流程后续使用。
  // need：本处保存 (r?.meta as { requiredLevel?: number } | undefined)?.require… 的结果；r：本处保存 routes.find((x) => x.name === routeName) 的结果；meta：本处声明的字段或类型，类型为 RouteMeta；requiredLevel：本处声明的字段或类型，类型为 number
  return auth.user.level >= need;
  // 把auth.user.level >= need作为当前函数的结果返回。
  // auth：Pinia 登录状态仓库实例；user：当前会话或调用方的用户信息；level：用户操作级别或事件严重级别，依据当前接口结构区分；need：本处保存 (r?.meta as { requiredLevel?: number } | undefined)?.require… 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了按当前用户级别判断导航页面是否可见的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 levelTag，用于把用户操作级别转换为标签展示类型。
function levelTag(l: number): 'danger' | 'warning' | 'info' {
// 定义 levelTag，用于把用户操作级别转换为标签展示类型。
// levelTag：把用户操作级别转换为标签展示类型；l：当前方法接收的参数，类型为 number
  return l === 3 ? 'danger' : l === 2 ? 'warning' : 'info';
  // 把l === 3 ? 'danger' : l === 2 ? 'warning' : 'info'作为当前函数的结果返回。
  // l：当前方法接收的参数，类型为 number
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了把用户操作级别转换为标签展示类型的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 onLogout，用于退出当前账号并切换到登录页面。
async function onLogout() {
// 退出当前账号并切换到登录页面。
// onLogout：退出当前账号并切换到登录页面
  await auth.logout();
  // 清除当前登录状态与会话信息。
  // auth：Pinia 登录状态仓库实例；logout：auth 对象上的字段或操作
  router.push('/login');
  // 向数组末尾追加元素。
  // router：前端页面路由器实例；push：向数组末尾追加元素
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了退出当前账号并切换到登录页面的实现；实际结果由运行时输入和执行分支决定。

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
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 statusText。
// statusText：本处保存 computed(() => (status.value ? stateText(status.value.state)… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；stateText：从 ./services/lineState 导入的对象，用于本文件的调用或类型约束；state：当前状态值或实时状态服务实例，以所在对象为准

/**
 * 产线状态 → 标签颜色类型。
 * Element Plus 的 el-tag type 决定配色：success 绿 / info 灰 / danger 红 / warning 橙
 * 同样取自 lineState.ts（stateTagType），保证顶栏与孪生页配色一致。
 */
const statusTagType = computed(() => stateTagType(status.value?.state));
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 statusTagType。
// statusTagType：本处保存 computed(() => stateTagType(status.value?.state)) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；stateTagType：从 ./services/lineState 导入的对象，用于本文件的调用或类型约束；status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；state：当前状态值或实时状态服务实例，以所在对象为准
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于组织导航、全局连接状态、当前用户与页面容器。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段为 .user-box 对应的界面元素定义尺寸、布局或视觉样式。 */
.user-box {
/* 对选择器 .user-box 匹配的元素应用后续声明。 */
/* .user-box 是这一组样式匹配的元素选择器 */
  display: inline-flex;
  /* display=inline-flex：决定元素如何布局或显示。 */
  /* display 控制元素布局方式，这里取 inline-flex */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  /* align-items 控制交叉轴对齐方式，这里取 center */
  gap: 6px;
  /* gap=6px：设置子元素间距。 */
  /* gap 控制子元素间距，这里取 6px */
  margin-left: 12px;
  /* margin-left=12px：设置该样式属性。 */
  /* margin-left 控制当前元素的样式取值，这里取 12px */
  padding-left: 12px;
  /* padding-left=12px：设置该样式属性。 */
  /* padding-left 控制当前元素的样式取值，这里取 12px */
  border-left: 1px solid var(--panel-border);
  /* border-left=1px solid var(--panel-border)：设置该样式属性。 */
  /* border-left 控制当前元素的样式取值，这里取 1px solid var(--panel-border) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .user-box 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了组织导航、全局连接状态、当前用户与页面容器所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
