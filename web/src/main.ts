/**
 * ============================================================================
 * 文件作用：前端应用入口（挂载 Vue 应用）
 * 所属模块：web/src/
 * ============================================================================
 *
 * 【宏观定位】浏览器端 SPA（单页应用）的启动文件。
 *   打包后对应的产物是 web/dist/assets/index-*.js，由云端 Nginx 直接托管。
 *
 * 【启动顺序（看懂每一行的关键）】
 *   ① 引入 Vue 的 createApp —— 创建应用实例的工厂函数
 *   ② 引入 Element Plus UI 库（基于 Vue3 的组件库，本项目用它做面板/标签/菜单）
 *   ③ 引入中文语言包，让组件库里的日期、下拉等文案显示中文
 *   ④ 引入 Element Plus 的样式表 —— 必须先于自定义样式加载，
 *      否则自定义的 CSS 变量会覆盖不了组件库的默认样式
 *   ⑤ 引入 Element Plus 的「暗色主题」CSS 变量
 *      （index.html 的 <html class="dark"> 配合它整体切换暗色）
 *   ⑥ 引入根组件 App.vue —— 整个应用的外壳（顶栏 + 内容区）
 *   ⑦ 引入路由 —— 让 URL 能切换页面（/twin 孪生页、/status 状态页）
 *   ⑧ 引入全局样式 styles.css —— 定义深色工业风主题变量
 *
 * 【挂载】
 *   createApp(App) → 用 router / Element Plus 装配件 → mount('#app')
 *   mount 的目标是 index.html 里的 <div id="app"></div>，
 *   Vue 会把这个 div 作为渲染根，替换成 App.vue 渲染出的 DOM。
 *
 * 【前端在整体架构中的位置】
 *   浏览器拿到的前端是纯静态文件（HTML+JS+CSS），不含任何业务逻辑和数据。
 *   所有数据来自后端：
 *     - 首屏：REST GET /api/lines/line-01/snapshot（读 Redis 快照）
 *     - 实时：WebSocket（socket.io）长连接推送
 *   所以前端刷新页面不会丢数据 —— 状态在后端的 Redis 里。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import App from './App.vue';
import { router } from './router';
import './styles.css';

// 创建 Vue 应用实例
const app = createApp(App);
app.use(createPinia());
// 装上路由插件（让 <router-view> 和 <router-link> 可用）
app.use(router);
// 装上 Element Plus，并指定中文语言包
app.use(ElementPlus, { locale: zhCn });
// 挂载到 index.html 中的 #app 容器
app.mount('#app');
