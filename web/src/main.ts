/**
 // 这一段负责配置和实现 web/src/main.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
 *   ⑦ 引入路由 —— 让 URL 能切换页面（/twin 孪生页、/io 信号页）
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
// 从 vue 导入这一行列出的符号，供本文件调用。
// createApp：Vue 创建应用实例的函数
import { createPinia } from 'pinia';
// 从 pinia 导入这一行列出的符号，供本文件调用。
// createPinia：Pinia 创建全局状态管理实例的函数
import ElementPlus from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。
// ElementPlus：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
import zhCn from 'element-plus/es/locale/lang/zh-cn';
// 从 element-plus/es/locale/lang/zh-cn 导入这一行列出的符号，供本文件调用。
// zhCn：从 element-plus/es/locale/lang/zh-cn 导入的对象，用于本文件的调用或类型约束
import 'element-plus/dist/index.css';
// 从 element-plus/dist/index.css 加载本文件需要的对象，供后续处理使用。
// element-plus/dist/index.css 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
import 'element-plus/theme-chalk/dark/css-vars.css';
// 从 element-plus/theme-chalk/dark/css-vars.css 加载本文件需要的对象，供后续处理使用。
// element-plus/theme-chalk/dark/css-vars.css 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
import App from './App.vue';
// 从 ./App.vue 导入这一行列出的符号，供本文件调用。
// App：从 ./App.vue 导入的对象，用于本文件的调用或类型约束
import { router } from './router';
// 从 ./router 导入这一行列出的符号，供本文件调用。
// router：从 ./router 导入的对象，用于本文件的调用或类型约束
import './styles.css';
// 从 ./styles.css 加载本文件需要的对象，供后续处理使用。
// ./styles.css 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用

// 创建 Vue 应用实例

// 浏览器下载网页文件后，从这里创建 Vue 根应用，并按顺序安装共享状态、路由与界面组件插件。
// App 是公共外框；router 决定 router-view 中显示 LoginView、TwinView、IoView 等哪个页面。
// 挂载完成只是网页程序就绪，现场状态还需要通过快照接口和实时连接取得。

const app = createApp(App);
// 创建网页应用，以 App.vue 作为公共外框；接下来依次安装共享状态、路由和界面组件。
// app 是当前 Vue 应用实例；createApp 来自 Vue；App 是项目导入的根组件，创建应用不等于现场数据已经到达。
app.use(createPinia());
// 安装 Pinia，让登录等共享状态能被不同页面使用。
// createPinia 来自 pinia 库，返回状态管理实例；use 是 Vue 应用安装插件的方法。
// 装上路由插件（让 <router-view> 和 <router-link> 可用）
app.use(router);
// 安装项目配置好的路由器，由访问路径决定公共外框里显示哪个页面。
// router 来自本项目的 ./router；use 是 Vue 的插件安装方法，具体路径与组件对应关系在 router/index.ts 中。
// 装上 Element Plus，并指定中文语言包
app.use(ElementPlus, { locale: zhCn });
// 安装 Element Plus 界面组件，并使用中文语言配置。
// ElementPlus 来自 element-plus，zhCn 来自其中文语言包；这一步准备页面组件，不负责连接 PLC。
// 挂载到 index.html 中的 #app 容器
app.mount('#app');
// 把已经装好插件的网页应用挂载到 HTML 的 #app 容器，开始显示公共外框和当前路由页面。
// mount 是 Vue 应用的方法；#app 是页面容器选择器；之后组件再按各自逻辑请求快照或建立实时连接。
// 这一段提供了配置和实现 web/src/main.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
