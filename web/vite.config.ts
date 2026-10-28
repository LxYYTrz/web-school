/**
 * Vite 开发与构建配置；本地开发服务器代理与部署后的 Nginx 分别工作。
 * 按插件、路径与 server.proxy 阅读，/api、/socket.io 默认转到后端 3000，实时代理需 ws: true。
 * 构建产物放 web/dist；显式 VITE_API_BASE 可改变前端请求目标，不能只凭开发代理推断线上路径。
 */
import { defineConfig } from 'vite';
// ★ 注意导入方式：@vitejs/plugin-vue v5 起改为 **默认导出**（export default vuePlugin），
//   不再有 v2/v3 时代的具名导出 `vue`。写成 `import { vue } from ...` 会导致
//   `vite build` 报 "does not provide an export named 'vue'"。
import vue from '@vitejs/plugin-vue';

/**
 * Vite 配置对象。
 */
export default defineConfig({
// 把后面的配置或实现作为当前模块的默认导出，供其他文件直接导入。
  // 插件列表：Vue 插件负责解析 .vue 文件的 <template>/<script>/<style>
  plugins: [vue()],
  // 开发服务器配置
  server: {
    // 开发服务器端口（Vite 默认 5173，这里显式声明）
    port: 5173,
    // 代理规则：把前端请求转发到后端
    proxy: {
      // 开发期把 /api 与 /socket.io 代理到本地 NestJS,生产构建后用 Nginx 同源反代

      // 本地开发由 Vite 提供网页，/api 和 /socket.io 请求通过这里的代理转到后端 3000。
      // ws:true 为实时连接开启 WebSocket 代理；这是开发服务器行为，构建后的 web/dist 由部署中的 Nginx 提供。
      // 显式设置前端 API 基址可能改变请求目标，不能把开发代理配置直接当成线上请求路径。

      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      // ws: true —— 启用 WebSocket 代理（socket.io 依赖它）
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
