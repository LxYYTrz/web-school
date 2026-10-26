import { defineStore } from 'pinia';
// 从 pinia 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ref, computed } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { apiLogin, apiLogout, apiMe } from '../services/auth';
// 从 ../services/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 三级权限(对齐 server/src/users/users.service.ts)
// level=1 普通用户、level=2 二级、level=3 管理员
export type Level = 1 | 2 | 3;
// 声明 Level 的结构。 关键字：export＝向其他模块开放符号；type＝定义类型别名。

export interface AuthUser {
// 声明 AuthUser 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  username: string;
  // 设置字段 username。
  level: Level;
  // 设置字段 level。
}
// 结束当前对象、函数或条件代码块。

export const useAuthStore = defineStore('auth', () => {
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
  const user = ref<AuthUser | null>(null);
  // 声明 user，初始值由 ref<AuthUser | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  const ready = ref(false);  // 首次拉 /me 完成(无论成功失败)才算 ready
  // 声明 ready，初始值由 ref(false);  // 首次拉 /me 完成(无论成功失败)才算 ready 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。

  const isLoggedIn = computed(() => user.value !== null);
  // 声明 isLoggedIn，初始值由 computed(() => user.value !== null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
  const isAdmin = computed(() => user.value?.level === 3);
  // 声明 isAdmin，初始值由 computed(() => user.value?.level === 3) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  // 可发控制指令的等级:admin(3) + 二级(2)
  const canCommand = computed(() => (user.value?.level ?? 0) >= 2);
  // 声明 canCommand，初始值由 computed(() => (user.value?.level ?? 0) >= 2) 计算得到。 关键字：const＝声明不可重新绑定的变量。
  // 可进用户管理页:admin(3) only
  const canManageUsers = computed(() => user.value?.level === 3);
  // 声明 canManageUsers，初始值由 computed(() => user.value?.level === 3) 计算得到。 关键字：const＝声明不可重新绑定的变量。

  async function refresh() {
  // 定义函数 refresh。 关键字：async＝声明异步函数；function＝定义函数。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      user.value = await apiMe();
      // 把右侧表达式的结果写入 user.value。 关键字：await＝等待异步操作完成。
    } catch {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      // dev/demo fallback:无后端时填默认 admin,纯看页面用
      // VITE_MOCK_ONLY 由 build 时显式注入;默认 false,prod 不走 mock
      if (import.meta.env.VITE_MOCK_ONLY === 'true') {
      // 判断 if (import.meta.env.VITE_MOCK_ONLY === 'true') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；import＝导入模块或符号。
        user.value = { username: 'demo', level: 3 };
        // 把右侧表达式的结果写入 user.value。
      } else {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支。
        user.value = null;
        // 把右侧表达式的结果写入 user.value。 关键字：null＝空值。
      }
      // 结束当前对象、函数或条件代码块。
    } finally {
    // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
      ready.value = true;
      // 把右侧表达式的结果写入 ready.value。 关键字：true＝布尔真值。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  async function login(username: string, password: string) {
  // 定义函数 login。 关键字：async＝声明异步函数；function＝定义函数。
    const u = await apiLogin(username, password);
    // 声明 u，初始值由 await apiLogin(username, password) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    user.value = u;
    // 把右侧表达式的结果写入 user.value。
  }
  // 结束当前对象、函数或条件代码块。

  // dev/demo 用:没后端时本地填一个用户(让登录页 submit 也能进首页)
  async function demoLogin(username: string, level: Level = 3) {
  // 定义函数 demoLogin。 关键字：async＝声明异步函数；function＝定义函数。
    if (import.meta.env.VITE_MOCK_ONLY !== 'true') throw new Error('demoLogin 仅 mock-only 环境可用');
    // 判断 if (import.meta.env.VITE_MOCK_ONLY !== 'true') throw new Error('demoLogin 仅 mock-only 环境可用'); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；import＝导入模块或符号；throw＝抛出错误；new＝创建对象实例。
    user.value = { username, level };
    // 把右侧表达式的结果写入 user.value。
  }
  // 结束当前对象、函数或条件代码块。

  async function logout() {
  // 定义函数 logout。 关键字：async＝声明异步函数；function＝定义函数。
    await apiLogout();
    // 调用 apiLogout，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
    user.value = null;
    // 把右侧表达式的结果写入 user.value。 关键字：null＝空值。
  }
  // 结束当前对象、函数或条件代码块。

  return { user, ready, isLoggedIn, isAdmin, canCommand, canManageUsers, refresh, login, demoLogin, logout };
  // 返回 { user, ready, isLoggedIn, isAdmin, canCommand, canManageUsers, refresh, login, demoLogin, logout } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
});
// 结束当前回调或对象，并完成外层函数调用。
