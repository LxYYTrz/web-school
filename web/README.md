# 前端

Vue 3 + TypeScript + Element Plus + Three.js。当前路由是 `/login`、`/twin`、`/io`、`/users`；其中用户管理仅级别 3 可见。孪生页显示程序化六轴机械臂、产线状态、IO 和控制按钮。`StatusView` 已停用并删除。

`src/composables/useLineData.ts` 同时从 REST 快照和 Socket.IO 接收数据，供顶栏及页面共用。`src/three/RobotArm.ts` 将六个关节角映射到机械臂层级；`SceneManager.ts` 管理渲染循环。`src/stores/auth.ts` 保存登录用户；路由和后端共同限制访问。

开发时本机后端应监听 `3000`：

```powershell
npm.cmd ci
npm.cmd run dev
```

打开 `http://localhost:5173`。Vite 将 `/api`、`/socket.io` 代理到后端。生产构建执行 `npm.cmd run build`，将 `dist/` 放到云服务器 `/opt/line-twin/deploy/dist/`，由 `deploy/nginx/cloud.conf` 提供同源访问。

真实机器人外观模型尚未接入；当前程序化模型的入口是 `RobotArm.setJoints(deg[6])`。现场未提供的计数和节拍字段不应展示成真实指标。
