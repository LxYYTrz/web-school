/**
 * 浏览器前端入口，网页文件被加载后创建 Vue 根应用，不是服务器上的 NestJS 启动文件。
 * 按 createApp → 安装 Pinia、router、Element Plus → mount 阅读；App.vue 提供公共外框与路由页面位置。
 * 页面挂载只是程序就绪，现场数据由 composables/useLineData.ts 的快照和实时入口取得。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
// 从 element-plus/dist/index.css 加载本文件需要的对象，供后续处理使用。
// element-plus/dist/index.css 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
import 'element-plus/theme-chalk/dark/css-vars.css';
// 从 element-plus/theme-chalk/dark/css-vars.css 加载本文件需要的对象，供后续处理使用。
// element-plus/theme-chalk/dark/css-vars.css 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
import App from './App.vue';
import { router } from './router';
import './styles.css';

// 浏览器执行模块入口，从 App.vue 创建根应用，然后按下方顺序安装共享状态、路由和组件库。
// createApp 来自 Vue；App 是项目根组件，后端的 NestFactory 与这里分别运行在服务器和浏览器。
const app = createApp(App);
// 1. createApp 从 vue 导入，App 从本项目 App.vue 导入。
// 2. 调用返回 Vue 应用实例 app，先准备应用，还没有把它显示到 HTML 容器。
// 3. 后续按顺序安装 Pinia、router 和 Element Plus，最后 mount 开始显示。
app.use(createPinia());
// 1. createPinia 来自 pinia，创建应用使用的共享状态管理实例。
// 2. app.use 是 Vue 安装插件的接口；安装后 auth store 才能在页面、路由等位置共享。
// 3. Pinia 管理的是前端状态，不代替后端登录检查，也不保存 PostgreSQL 历史。
app.use(router);
// 1. router 从项目 router/index.ts 导入，里面定义路径、页面组件和进入前的检查。
// 2. 安装后 App.vue 的 router-view 能按当前路径显示对应页面。
// 3. 前端页面切换通常由浏览器内路由完成，不需要每次重新下载整套网站。
app.use(ElementPlus, { locale: zhCn });
// 安装 Element Plus 界面组件，并使用中文语言配置。
// ElementPlus 来自 element-plus，zhCn 来自其中文语言包；这一步准备页面组件，不负责连接 PLC。
// 挂载到 index.html 中的 #app 容器
app.mount('#app');
// 1. mount 将已配置好的应用挂载到 index.html 的 id=app 元素。
// 2. #app 是 CSS 选择器，指定页面容器，不是后端接口路径或 Socket.IO 房间。
// 3. 组件开始生命周期后，再按各自入口请求登录信息、快照或注册实时事件。
