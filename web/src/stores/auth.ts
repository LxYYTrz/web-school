import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiLogin, apiLogout, apiMe } from '../services/auth';

// 三级权限(对齐 server/src/users/users.service.ts)
// level=1 普通用户、level=2 二级、level=3 管理员
export type Level = 1 | 2 | 3;

export interface AuthUser {
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
  // 可进用户管理页:admin(3) only
  const canManageUsers = computed(() => user.value?.level === 3);

  async function refresh() {
    try {
      user.value = await apiMe();
    } catch {
      user.value = null;
    } finally {
      ready.value = true;
    }
  }

  async function login(username: string, password: string) {
    const u = await apiLogin(username, password);
    user.value = u;
  }

  async function logout() {
    await apiLogout();
    user.value = null;
  }

  return { user, ready, isLoggedIn, isAdmin, canCommand, canManageUsers, refresh, login, logout };
});
