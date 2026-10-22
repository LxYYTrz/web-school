/**
 * ============================================================================
 * 文件作用：前端路由表
 * 所属模块：web/src/router/
 * ============================================================================
 *
 * 【宏观定位】定义"URL → 页面组件"的映射关系。
 *
 * 【路由模式：HTML5 History】
 *   createWebHistory() 生成的是 /twin、/status 这样的**真路径**（不是 /#/twin）。
 *   代价：用户直接访问 /status 或刷新页面时，Web 服务器必须能返回 index.html，
 *   否则 404。生产环境由 Nginx 的这条规则兜底：
 *       location / { try_files $uri $uri/ /index.html; }
 *   （见 deploy/nginx/cloud.conf）
 *
 * 【目前的页面】
 *   /        → 重定向到 /twin（孪生页是主页面）
 *   /twin    → 实时孪生页：3D 机械臂随实时数据运动
 *   /status  → 产线状态页：统计卡片 + 事件流 + 报警声音
 *
 * 【与 RBAC 的关系（TODO）】
 *   第 4 步接入登录后，这里要加路由守卫（beforeEach），
 *   按 meta.permission 判断当前角色能否访问该页面。
 *   现在只有两页且无鉴权，暂不需要。
 */
import { createRouter, createWebHistory } from 'vue-router';
import TwinView from '../views/TwinView.vue';
// import StatusView from '../views/StatusView.vue';   // @deprecated 2026-10-16 暂停使用,文件保留不删,见 App.vue 同等注释
import IoView from '../views/IoView.vue';   // 2026-10-16 新增:IO 只读信号
import LoginView from '../views/LoginView.vue';
import UsersView from '../views/UsersView.vue';
import { useAuthStore } from '../stores/auth';
import { setUnauthorizedHandler } from '../services/auth';

// 创建路由实例
export const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(),
  // 路由表
  routes: [
    // 根路径重定向到孪生页（redirect 是字符串目标路径）
    { path: '/', redirect: '/twin' },
    { path: '/login', name: 'login', component: LoginView, meta: { title: '登录', public: true } },
    // 孪生页：name 用于编程式跳转，meta.title 用于页面标题（扩展用）
    { path: '/twin', name: 'twin', component: TwinView, meta: { title: '实时孪生' } },
    // @deprecated 2026-10-16 暂停使用(/status 路由暂停,文件保留不删)
    // { path: '/status', name: 'status', component: StatusView, meta: { title: '产线状态' } },
    // IO 只读信号:level 1 可见(纯观测,不下发任何写操作)
    { path: '/io', name: 'io', component: IoView, meta: { title: 'IO 信号' } },
    { path: '/users', name: 'users', component: UsersView, meta: { title: '用户管理', requiredLevel: 3 } },
  ],
});

// HTTP 401 → 跳登录;已登录用户访问受保护路由时 session 过期,这里兜底
setUnauthorizedHandler(() => {
  const auth = useAuthStore();
  auth.user = null;
  if (router.currentRoute.value.path !== '/login') {
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
  }
});

// 路由守卫:首次进入前先拉一次 /me,确定登录态后再放行
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
});
