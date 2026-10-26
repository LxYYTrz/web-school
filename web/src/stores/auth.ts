// 这一段负责配置和实现 web/src/stores/auth.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { defineStore } from 'pinia';
// 从 pinia 导入这一行列出的符号，供本文件调用。
// defineStore：Pinia 定义共享状态仓库的函数
import { ref, computed } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// ref：Vue 创建可通过 .value 读写的响应式引用；computed：Vue 根据其他响应式值计算并缓存结果的函数
import { apiLogin, apiLogout, apiMe } from '../services/auth';
// 从 ../services/auth 导入这一行列出的符号，供本文件调用。
// apiLogin：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；apiLogout：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；apiMe：从 ../services/auth 导入的对象，用于本文件的调用或类型约束

// 三级权限(对齐 server/src/users/users.service.ts)
// level=1 普通用户、level=2 二级、level=3 管理员
export type Level = 1 | 2 | 3;
// 定义 Level，约束或实现本模块涉及的数据和行为。
// Level：本处声明的字段或类型，类型为 1 | 2 | 3

// 这一段声明 AuthUser，用于AuthUser 的相关数据和行为。
export interface AuthUser {
// 定义 AuthUser，约束或实现本模块涉及的数据和行为。
// AuthUser 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
  username: string;
  // 声明或设置 username，用于账号用户名。
  // username：账号用户名
  level: Level;
  // 声明或设置 level，用于用户操作级别或事件严重级别，依据当前接口结构区分。
  // level：用户操作级别或事件严重级别，依据当前接口结构区分；Level：本处声明的字段或类型，类型为 1 | 2 | 3
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 AuthUser 的字段或服务能力，供项目其他模块使用。

export const useAuthStore = defineStore('auth', () => {
// 导出这一行声明的符号，供项目其他模块使用。
// useAuthStore：项目定义的登录状态仓库入口；defineStore：Pinia 定义共享状态仓库的函数
  const user = ref<AuthUser | null>(null);
  // 根据 ref<AuthUser | null>(null) 设置 user，用于当前会话或调用方的用户信息。
  // user：当前会话或调用方的用户信息；ref：Vue 创建可通过 .value 读写的响应式引用
  const ready = ref(false);  // 首次拉 /me 完成(无论成功失败)才算 ready
  // 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 ready。
  // ready：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用

  const isLoggedIn = computed(() => user.value !== null);
  // 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 isLoggedIn。
  // isLoggedIn：本处保存 computed(() => user.value !== null) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值
  const isAdmin = computed(() => user.value?.level === 3);
  // 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 isAdmin。
  // isAdmin：本处保存 computed(() => user.value?.level === 3) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值；level：用户操作级别或事件严重级别，依据当前接口结构区分
  // 可发控制指令的等级:admin(3) + 二级(2)
  const canCommand = computed(() => (user.value?.level ?? 0) >= 2);
  // 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 canCommand。
  // canCommand：本处保存 computed(() => (user.value?.level ?? 0) >= 2) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值；level：用户操作级别或事件严重级别，依据当前接口结构区分
  // 可进用户管理页:admin(3) only
  const canManageUsers = computed(() => user.value?.level === 3);
  // 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 canManageUsers。
  // canManageUsers：本处保存 computed(() => user.value?.level === 3) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值；level：用户操作级别或事件严重级别，依据当前接口结构区分

  // 这一段定义 refresh，用于向后端检查现有会话并同步前端登录状态。
  async function refresh() {
  // 重新读取当前数据并更新界面显示。
  // refresh：向后端检查现有会话并同步前端登录状态
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      user.value = await apiMe();
      // 把右侧表达式的结果写入 user.value。
      // user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值；apiMe：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
    } catch {
    // 开始异常处理分支，接收前面代码抛出的错误。
    // 本行完成上面一层已说明的函数、分支或对象配置
      // dev/demo fallback:无后端时填默认 admin,纯看页面用
      // VITE_MOCK_ONLY 由 build 时显式注入;默认 false,prod 不走 mock
      if (import.meta.env.VITE_MOCK_ONLY === 'true') {
      // 检查(import.meta.env.VITE_MOCK_ONLY === 'true')，按判断结果进入对应的处理分支。
      // env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_MOCK_ONLY：本处声明的字段或类型，类型为 any
        user.value = { username: 'demo', level: 3 };
        // 把右侧表达式的结果写入 user.value。
        // user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值；username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分
      } else {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 本行完成上面一层已说明的函数、分支或对象配置
        user.value = null;
        // 把右侧表达式的结果写入 user.value。
        // user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    } finally {
    // 开始收尾分支，无论前面的操作成功或失败都执行。
    // 本行完成上面一层已说明的函数、分支或对象配置
      ready.value = true;
      // 把右侧表达式的结果写入 ready.value。
      // ready：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向后端检查现有会话并同步前端登录状态的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 login，用于提交账号口令并把返回的用户信息保存到登录状态仓库。
  async function login(username: string, password: string) {
  // 提交账号口令并建立登录会话。
  // login：提交账号口令并把返回的用户信息保存到登录状态仓库；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象
    const u = await apiLogin(username, password);
    // 调用后端登录接口建立用户会话，将结果保存或写入 u。
    // u：本处保存 await apiLogin(username, password) 的结果；apiLogin：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象
    user.value = u;
    // 把右侧表达式的结果写入 user.value。
    // user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值；u：本处保存 await apiLogin(username, password) 的结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了提交账号口令并把返回的用户信息保存到登录状态仓库的实现；实际结果由运行时输入和执行分支决定。

  // dev/demo 用:没后端时本地填一个用户(让登录页 submit 也能进首页)
  // 这一段定义 demoLogin，用于建立前端演示用户状态并切换到演示模式。
  async function demoLogin(username: string, level: Level = 3) {
  // 定义函数 demoLogin。
  // demoLogin：建立前端演示用户状态并切换到演示模式；username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分；Level：本处声明的字段或类型，类型为 1 | 2 | 3
    if (import.meta.env.VITE_MOCK_ONLY !== 'true') throw new Error('demoLogin 仅 mock-only 环境可用');
    // 条件 (import.meta.env.VITE_MOCK_ONLY !== 'true') throw new Error('demoLogin 仅 mock-only 环境可用'); 成立时按本行给出的错误终止处理。
    // env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_MOCK_ONLY：本处声明的字段或类型，类型为 any；Error：标准错误对象类型
    user.value = { username, level };
    // 把右侧表达式的结果写入 user.value。
    // user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值；username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了建立前端演示用户状态并切换到演示模式的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 logout，用于结束后端会话并清空前端登录状态。
  async function logout() {
  // 清除当前登录状态与会话信息。
  // logout：结束后端会话并清空前端登录状态
    await apiLogout();
    // 调用后端登出接口清除用户会话。
    // apiLogout：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
    user.value = null;
    // 把右侧表达式的结果写入 user.value。
    // user：当前会话或调用方的用户信息；value：当前字段或点位的实际取值
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了结束后端会话并清空前端登录状态的实现；实际结果由运行时输入和执行分支决定。

  return { user, ready, isLoggedIn, isAdmin, canCommand, canManageUsers, refresh, login, demoLogin, logout };
  // 把{ user, ready, isLoggedIn, isAdmin, canCommand, canManageUsers, refresh, login, demoLogin, logo…作为当前函数的结果返回。
  // user：当前会话或调用方的用户信息
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/stores/auth.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
