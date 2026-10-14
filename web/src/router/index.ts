import { createRouter, createWebHistory } from 'vue-router';
import TwinView from '../views/TwinView.vue';
import StatusView from '../views/StatusView.vue';
import VisionView from '../views/VisionView.vue';
import LoginView from '../views/LoginView.vue';
import UsersView from '../views/UsersView.vue';
import { useAuthStore } from '../stores/auth';
import { setUnauthorizedHandler } from '../services/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/twin' },
    { path: '/login', name: 'login', component: LoginView, meta: { title: '登录', public: true } },
    { path: '/twin', name: 'twin', component: TwinView, meta: { title: '实时孪生' } },
    { path: '/status', name: 'status', component: StatusView, meta: { title: '产线状态' } },
    { path: '/vision', name: 'vision', component: VisionView, meta: { title: '视觉检测' } },
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
