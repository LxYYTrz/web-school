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
