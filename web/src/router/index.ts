/**
 * Vue Router 的页面路径与进入检查，由 main.ts 安装到应用。
 * routes 对应登录、孪生、IO 和用户管理组件；导航守卫先确认 auth.ready，再判断登录及页面所需级别。
 * 这是浏览器页面进入规则；后端接口和现场控制仍有自己的身份、级别与参数检查。
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { setUnauthorizedHandler } from '../services/auth';

// main.ts 安装这个路由器；routes 将地址路径对应到页面组件，meta 提供本项目的页面规则。
// createRouter/createWebHistory 来自 vue-router，页面组件按配置懒加载；此处 history 是浏览器导航模式，不是历史写库服务。
export const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(),
  // 为网页路由选择 HTML5 History 模式，使地址路径对应不同页面。
  // 这里的 history 是 Vue Router 的浏览器导航配置；createWebHistory 来自 vue-router，与数据库历史记录服务无关。
  // 路由表

  // 路由表把访问路径对应到页面组件：/login 登录，/twin 机械臂，/io 点位展示，/users 用户管理。
  // 路由负责用户界面中进入哪个页面，组件再处理自己的数据和交互；页面进入条件与后端接口权限分别检查。

  routes: [
  // 列出访问路径与页面组件的对应关系，供已安装的 router 选择页面。
  // routes 是 Vue Router 的路由表；每项的 path 表示地址路径，component 表示应显示的 Vue 页面组件。
    // 根路径重定向到孪生页（redirect 是字符串目标路径）
    { path: '/', redirect: '/twin' },
    // path / 是访问路径；redirect /twin 是访问该路径时跳转的页面
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: '登录', public: true } },
    // 孪生页：name 用于编程式跳转，meta.title 用于页面标题（扩展用）
    { path: '/twin', name: 'twin', component: () => import('../views/TwinView.vue'), meta: { title: '实时孪生' } },
    // IO 只读信号:level 1 可见(纯观测,不下发任何写操作)
    { path: '/io', name: 'io', component: () => import('../views/IoView.vue'), meta: { title: 'IO 信号' } },
    { path: '/users', name: 'users', component: () => import('../views/UsersView.vue'), meta: { title: '用户管理', requiredLevel: 3 } },
  ],
});

// HTTP 401 → 跳登录;已登录用户访问受保护路由时 session 过期,这里兜底
setUnauthorizedHandler(() => {
// 注册认证和用户接口遇到 HTTP 401 时的统一处理函数。
  const auth = useAuthStore();
  auth.user = null;
  if (router.currentRoute.value.path !== '/login') {
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

// 每次页面导航先确认登录状态加载完成，再按目标页的 public/requiredLevel 等规则判断是否放行。
// auth store 的前端判断只管理页面进入；控制和用户管理的后端接口仍要自己检查权限。
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.refresh();
  // 已登录访问 /login → 跳默认页
  if (to.path === '/login' && auth.isLoggedIn) {
    return { path: '/twin' };
  }
  // 公开路由放行
  if (to.meta.public) return true;
  // 未登录 → 跳登录(带上 redirect)
  if (!auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  // requiredLevel 检查
  const need = to.meta.requiredLevel as number | undefined;
  if (need && (auth.user?.level ?? 0) < need) {
    return { path: '/twin' };
  }
  return true;
  // 布尔结果由当前函数的调用方用于决定是否允许继续执行
});
