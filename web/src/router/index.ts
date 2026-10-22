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
import TwinView from '../views/TwinView.vue';    // 实时孪生页组件
import StatusView from '../views/StatusView.vue'; // 产线状态页组件

// 创建路由实例
export const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(),
  // 路由表
  routes: [
    // 根路径重定向到孪生页（redirect 是字符串目标路径）
    { path: '/', redirect: '/twin' },
    // 孪生页：name 用于编程式跳转，meta.title 用于页面标题（扩展用）
    { path: '/twin', name: 'twin', component: TwinView, meta: { title: '实时孪生' } },
    // 状态页
    { path: '/status', name: 'status', component: StatusView, meta: { title: '产线状态' } },
  ],
});
