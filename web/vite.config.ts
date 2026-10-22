/**
 * ============================================================================
 * 文件作用：Vite 构建/开发服务器配置
 * 所属模块：web/
 * ============================================================================
 *
 * 【宏观定位】前端"打包器 + 开发服务器"的配置文件。
 *   - 开发期（npm run dev）：启动一个带热更新的开发服务器，并把 /api 与
 *     /socket.io 代理到本地后端。
 *   - 生产期（npm run build）：把 src/ 打包成 dist/ 静态文件（纯 ES5/ES2015+
 *     的 JS + CSS + 资源），由云端 Nginx 托管。
 *
 * 【★ 开发代理 vs 生产同源（这是前后端"打通"的关键）】
 *
 *   开发期：
 *     浏览器 ──▶ Vite(5173) ──proxy──▶ NestJS(3000)
 *     浏览器认为请求都发给了 5173（同源），Vite 在服务端转发给后端，
 *     所以**开发期浏览器完全不需要处理跨域**（后端的 CORS 只是双保险）。
 *
 *   生产期：
 *     浏览器 ──▶ 云服务器 Nginx(80/443) ──▶ 静态文件 或 反代到工控机后端
 *     同样是同源，浏览器无跨域问题。
 *
 *   两个环境都是"同源"，这是本项目的一个漂亮的简化：不用考虑 CORS 策略问题。
 *
 * 【代理项说明】
 *   /api       → 后端 REST 接口（快照查询、控制指令）
 *   /socket.io → 后端 WebSocket。**必须加 ws: true**，
 *                 否则 Vite 不会处理 WebSocket 升级握手，连接会失败。
 *   changeOrigin: true → 把请求的 Host 头改成目标主机（后端不校验，但更规范）
 */

import { defineConfig } from 'vite';          // Vite 配置工厂函数
// ★ 注意导入方式：@vitejs/plugin-vue v5 起改为 **默认导出**（export default vuePlugin），
//   不再有 v2/v3 时代的具名导出 `vue`。写成 `import { vue } from ...` 会导致
//   `vite build` 报 "does not provide an export named 'vue'"。
import vue from '@vitejs/plugin-vue';           // Vue 官方插件：编译 .vue 单文件组件

/**
 * Vite 配置对象。
 */
export default defineConfig({
  // 插件列表：Vue 插件负责解析 .vue 文件的 <template>/<script>/<style>
  plugins: [vue()],

  // 开发服务器配置
  server: {
    // 开发服务器端口（Vite 默认 5173，这里显式声明）
    port: 5173,
    // 代理规则：把前端请求转发到后端
    proxy: {
      // 开发期把 /api 与 /socket.io 代理到本地 NestJS,生产构建后用 Nginx 同源反代
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      // ws: true —— 启用 WebSocket 代理（socket.io 依赖它）
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
