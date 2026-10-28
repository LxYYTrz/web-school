/**
 // 这一段负责配置和实现 web/src/router/index.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
// 从 vue-router 导入这一行列出的符号，供本文件调用。
// createRouter：Vue Router 创建路由器的函数；createWebHistory：Vue Router 创建浏览器 history 路由模式的函数
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。
// useAuthStore：项目定义的登录状态仓库入口
import { setUnauthorizedHandler } from '../services/auth';
// 从 ../services/auth 导入这一行列出的符号，供本文件调用。
// setUnauthorizedHandler：从 ../services/auth 导入的对象，用于本文件的调用或类型约束

// 创建路由实例
export const router = createRouter({
// 导出这一行声明的符号，供项目其他模块使用。
// router：前端页面路由器实例；createRouter：Vue Router 创建路由器的函数
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
    // 开始对象字面量，并在这一行设置其中列出的字段。
    // path / 是访问路径；redirect /twin 是访问该路径时跳转的页面
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: '登录', public: true } },
    // 开始对象字面量，并在这一行设置其中列出的字段。
    // name：当前对象的名称字段
    // 孪生页：name 用于编程式跳转，meta.title 用于页面标题（扩展用）
    { path: '/twin', name: 'twin', component: () => import('../views/TwinView.vue'), meta: { title: '实时孪生' } },
    // 开始对象字面量，并在这一行设置其中列出的字段。
    // name：当前对象的名称字段
    // IO 只读信号:level 1 可见(纯观测,不下发任何写操作)
    { path: '/io', name: 'io', component: () => import('../views/IoView.vue'), meta: { title: 'IO 信号' } },
    // 开始对象字面量，并在这一行设置其中列出的字段。
    // name：当前对象的名称字段
    { path: '/users', name: 'users', component: () => import('../views/UsersView.vue'), meta: { title: '用户管理', requiredLevel: 3 } },
    // 开始对象字面量，并在这一行设置其中列出的字段。
    // name：当前对象的名称字段
  ],
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 此处结束当前数组参数，各元素保持上方列出的顺序
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// HTTP 401 → 跳登录;已登录用户访问受保护路由时 session 过期,这里兜底
setUnauthorizedHandler(() => {
// 注册认证和用户接口遇到 HTTP 401 时的统一处理函数。
// setUnauthorizedHandler：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
  const auth = useAuthStore();
  // 创建或使用项目定义的登录状态仓库入口，将结果保存或写入 auth。
  // auth：Pinia 登录状态仓库实例；useAuthStore：项目定义的登录状态仓库入口
  auth.user = null;
  // 把右侧表达式的结果写入 auth.user。
  // auth：Pinia 登录状态仓库实例；user：当前会话或调用方的用户信息
  if (router.currentRoute.value.path !== '/login') {
  // 检查(router.currentRoute.value.path !== '/login')，按判断结果进入对应的处理分支。
  // router：前端页面路由器实例；currentRoute：本处声明的字段或类型，类型为 ShallowRef<RouteLocationNormalizedLoaded>；value：当前字段或点位的实际取值；path：本处声明的字段或类型，类型为 string
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
    // 向数组末尾追加元素。
    // router：前端页面路由器实例；push：向数组末尾追加元素；query：查询字符串参数或数据库查询操作，以当前对象为准；currentRoute：本处声明的字段或类型，类型为 ShallowRef<RouteLocationNormalizedLoaded>；value：当前字段或点位的实际取值；fullPath：本处声明的字段或类型，类型为 string
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 路由守卫:首次进入前先拉一次 /me,确定登录态后再放行

// 跳转页面前先取得 auth 共享登录状态，首次未就绪时等待 refresh() 调用 /api/auth/me。
// 没有有效登录时转到登录页，并记录目标位置，供登录后回到原页面；用户管理页面另有管理员级别要求。
// 这层导航检查帮助组织界面，真正提交控制或用户管理请求时仍由后端独立校验会话和权限。

router.beforeEach(async (to) => {
// 执行 beforeEach 对应的本地处理，使用本行提供的数据。
// router：前端页面路由器实例；beforeEach：本处声明的字段或类型，类型为 () => void；to：当前方法接收的参数
  const auth = useAuthStore();
  // 创建或使用项目定义的登录状态仓库入口，将结果保存或写入 auth。
  // auth：Pinia 登录状态仓库实例；useAuthStore：项目定义的登录状态仓库入口
  if (!auth.ready) await auth.refresh();
  // 检查(!auth.ready) await auth.refresh();，按判断结果进入对应的处理分支。
  // auth：Pinia 登录状态仓库实例；ready：auth 对象上的字段或操作；refresh：auth 对象上的字段或操作
  // 已登录访问 /login → 跳默认页
  if (to.path === '/login' && auth.isLoggedIn) {
  // 检查(to.path === '/login' && auth.isLoggedIn)，按判断结果进入对应的处理分支。
  // to：当前方法接收的参数；path：本处声明的字段或类型，类型为 string；auth：Pinia 登录状态仓库实例；isLoggedIn：auth 对象上的字段或操作
    return { path: '/twin' };
    // 把{ path: '/twin' }作为当前函数的结果返回。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 公开路由放行
  if (to.meta.public) return true;
  // 检查(to.meta.public) return true;，按判断结果进入对应的处理分支。
  // to：当前方法接收的参数；meta：本处声明的字段或类型，类型为 RouteMeta；public：to.meta 对象上的字段或操作
  // 未登录 → 跳登录(带上 redirect)
  if (!auth.isLoggedIn) {
  // 检查(!auth.isLoggedIn)，按判断结果进入对应的处理分支。
  // auth：Pinia 登录状态仓库实例；isLoggedIn：auth 对象上的字段或操作
    return { path: '/login', query: { redirect: to.fullPath } };
    // 把{ path: '/login', query: { redirect: to.fullPath } }作为当前函数的结果返回。
    // query：查询字符串参数或数据库查询操作，以当前对象为准；to：当前方法接收的参数；fullPath：本处声明的字段或类型，类型为 string
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // requiredLevel 检查
  const need = to.meta.requiredLevel as number | undefined;
  // 根据 to.meta.requiredLevel as number | undefined 设置 need，供当前流程后续使用。
  // need：本处保存 to.meta.requiredLevel as number | undefined 的结果；to：当前方法接收的参数；meta：本处声明的字段或类型，类型为 RouteMeta；requiredLevel：to.meta 对象上的字段或操作
  if (need && (auth.user?.level ?? 0) < need) {
  // 检查(need && (auth.user?.level ?? 0) < need)，按判断结果进入对应的处理分支。
  // need：本处保存 to.meta.requiredLevel as number | undefined 的结果；auth：Pinia 登录状态仓库实例；user：当前会话或调用方的用户信息；level：用户操作级别或事件严重级别，依据当前接口结构区分
    return { path: '/twin' };
    // 把{ path: '/twin' }作为当前函数的结果返回。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return true;
  // 把true作为当前函数的结果返回。
  // 布尔结果由当前函数的调用方用于决定是否允许继续执行
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/router/index.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
