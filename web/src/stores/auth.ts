/**
 * 浏览器 Pinia 登录状态，由页面和路由复用 user、ready 及权限计算值。
 * refresh 经 /me 恢复身份，login 调后端后保存返回用户，logout 调后端并清理本地状态。
 * demoLogin 与 mock 回退只用于相应演示配置；前端保存的级别不能代替后端会话检查。
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiLogin, apiLogout, apiMe } from '../services/auth';

// 三级权限(对齐 server/src/users/users.service.ts)
// level=1 普通用户、level=2 二级、level=3 管理员
export type Level = 1 | 2 | 3;

export interface AuthUser {
// AuthUser 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  username: string;
  level: Level;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const ready = ref(false);  // 首次拉 /me 完成(无论成功失败)才算 ready

  const isLoggedIn = computed(() => user.value !== null);
  const isAdmin = computed(() => user.value?.level === 3);
  // 可发控制指令的等级:admin(3) + 二级(2)
  const canCommand = computed(() => (user.value?.level ?? 0) >= 2);
  // 1. user 保存当前登录结果；可选链在未登录时得到 undefined，?? 0 将它按无权限级别处理。
  // 2. computed 随 user 更新而重新求值，level 为 2 或 3 时供页面启用控制交互。
  // 3. 它只是前端展示判断，后端 CommandGuard 仍独立检查请求会话。
  const canManageUsers = computed(() => user.value?.level === 3);

  // 调用 /api/auth/me 恢复浏览器已有会话对应的用户，成功或失败后都标记首次确认已完成。
  // VITE_MOCK_ONLY 回退只改变演示界面的本地用户，不会建立真实后端登录。
  async function refresh() {
  // 重新读取当前数据并更新界面显示。
    try {
      user.value = await apiMe();
    } catch {
      // dev/demo fallback:无后端时填默认 admin,纯看页面用
      // VITE_MOCK_ONLY 由 build 时显式注入;默认 false,prod 不走 mock
      if (import.meta.env.VITE_MOCK_ONLY === 'true') {
        user.value = { username: 'demo', level: 3 };
      } else {
        user.value = null;
      }
    } finally {
      ready.value = true;
    }
  }

  // 把表单输入交给 apiLogin，保存后端验证后返回的用户到 Pinia。
  // user 是浏览器状态，签名 Cookie 由浏览器与后端中间件按规则交换。
  async function login(username: string, password: string) {
  // 提交账号口令并建立登录会话。
    const u = await apiLogin(username, password);
    user.value = u;
  }

  // dev/demo 用:没后端时本地填一个用户(让登录页 submit 也能进首页)
  async function demoLogin(username: string, level: Level = 3) {
    if (import.meta.env.VITE_MOCK_ONLY !== 'true') throw new Error('demoLogin 仅 mock-only 环境可用');
    user.value = { username, level };
  }

  // 先请求后端删除会话字段，再清理浏览器保存的 user。
  async function logout() {
  // 清除当前登录状态与会话信息。
    await apiLogout();
    // 调用后端登出接口清除用户会话。
    user.value = null;
  }

  return { user, ready, isLoggedIn, isAdmin, canCommand, canManageUsers, refresh, login, demoLogin, logout };
});
