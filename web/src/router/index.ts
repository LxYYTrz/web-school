/**
 * ============================================================================
 * 文件作用：前端路由表
 * 所属模块：web/src/router/
 * ============================================================================
 *
 * 【宏观定位】定义"URL → 页面组件"的映射关系。
 *
 * 【路由模式：HTML5 History】
 *   createWebHistory() 生成的是 /twin、/io 这样的真路径。
 *   用户直接访问页面或刷新时，Web 服务器必须能返回 index.html，
 *   否则 404。生产环境由 Nginx 的这条规则兜底：
 *       location / { try_files $uri $uri/ /index.html; }
 *   （见 deploy/nginx/cloud.conf）
 *
 * 【目前的页面】
 *   /        → 重定向到 /twin（孪生页是主页面）
 *   /twin    → 实时孪生页：3D 机械臂随实时数据运动
 *   /io      → 六路只读 IO
 *   /users   → 管理员用户管理
 *   /login   → 登录
 */
import { createRouter, createWebHistory } from 'vue-router';
// 从 vue-router 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { setUnauthorizedHandler } from '../services/auth';
// 从 ../services/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 创建路由实例
export const router = createRouter({
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
  // 使用 HTML5 History 模式
  history: createWebHistory(),
  // 设置字段 history。
  // 路由表
  routes: [
  // 设置字段 routes。
    // 根路径重定向到孪生页（redirect 是字符串目标路径）
    { path: '/', redirect: '/twin' },
    // 开始对象字面量，并在这一行设置其中列出的字段。
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: '登录', public: true } },
    // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：import＝导入模块或符号；public＝公开成员；true＝布尔真值。
    // 孪生页：name 用于编程式跳转，meta.title 用于页面标题（扩展用）
    { path: '/twin', name: 'twin', component: () => import('../views/TwinView.vue'), meta: { title: '实时孪生' } },
    // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：import＝导入模块或符号。
    // IO 只读信号:level 1 可见(纯观测,不下发任何写操作)
    { path: '/io', name: 'io', component: () => import('../views/IoView.vue'), meta: { title: 'IO 信号' } },
    // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：import＝导入模块或符号。
    { path: '/users', name: 'users', component: () => import('../views/UsersView.vue'), meta: { title: '用户管理', requiredLevel: 3 } },
    // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：import＝导入模块或符号。
  ],
  // 结束当前数组，继续外层表达式。
});
// 结束当前回调或对象，并完成外层函数调用。

// HTTP 401 → 跳登录;已登录用户访问受保护路由时 session 过期,这里兜底
setUnauthorizedHandler(() => {
// 调用 setUnauthorizedHandler；括号中的表达式是传入的参数。
  const auth = useAuthStore();
  // 声明 auth，初始值由 useAuthStore() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  auth.user = null;
  // 把右侧表达式的结果写入 auth.user。 关键字：null＝空值。
  if (router.currentRoute.value.path !== '/login') {
  // 判断 if (router.currentRoute.value.path !== '/login') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
    // 调用 router.push，把括号中的值作为参数传入。
  }
  // 结束当前对象、函数或条件代码块。
});
// 结束当前回调或对象，并完成外层函数调用。

// 路由守卫:首次进入前先拉一次 /me,确定登录态后再放行
router.beforeEach(async (to) => {
// 调用 router.beforeEach，把括号中的值作为参数传入。 关键字：async＝声明异步函数。
  const auth = useAuthStore();
  // 声明 auth，初始值由 useAuthStore() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (!auth.ready) await auth.refresh();
  // 判断 if (!auth.ready) await auth.refresh(); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；await＝等待异步操作完成。
  // 已登录访问 /login → 跳默认页
  if (to.path === '/login' && auth.isLoggedIn) {
  // 判断 if (to.path === '/login' && auth.isLoggedIn) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { path: '/twin' };
    // 返回 { path: '/twin' } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  // 公开路由放行
  if (to.meta.public) return true;
  // 判断 if (to.meta.public) return true; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；public＝公开成员；return＝返回结果并结束当前函数；true＝布尔真值。
  // 未登录 → 跳登录(带上 redirect)
  if (!auth.isLoggedIn) {
  // 判断 if (!auth.isLoggedIn) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { path: '/login', query: { redirect: to.fullPath } };
    // 返回 { path: '/login', query: { redirect: to.fullPath } } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  // requiredLevel 检查
  const need = to.meta.requiredLevel as number | undefined;
  // 声明 need，初始值由 to.meta.requiredLevel as number | undefined 计算得到。 关键字：const＝声明不可重新绑定的变量；undefined＝未定义值。
  if (need && (auth.user?.level ?? 0) < need) {
  // 判断 if (need && (auth.user?.level ?? 0) < need) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    return { path: '/twin' };
    // 返回 { path: '/twin' } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
  return true;
  // 返回 true 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
});
// 结束当前回调或对象，并完成外层函数调用。
