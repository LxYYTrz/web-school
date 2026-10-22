# web/ — 前端（Vue3 + TypeScript + Three.js）

> **一句话定位**：把后端推来的实时数据变成"看得懂"的画面 —— 3D 机械臂、
> 关节角度、产线统计、事件流、报警提示。

---

## 1. 两个页面

**实时孪生**（`/twin`）：6 轴机器人随数据运动 + 关节角度刻度条 + 产线摘要
**产线状态**（`/status`）：统计卡片 + 事件流 + 报警声音

---

## 2. 启动

```bash
cp .env.example .env        # 默认指向 http://localhost:3000
npm install
npm run dev                 # http://localhost:5173
```

前置:`deploy/` 基础设施、`server/` 后端、`edge/mock_collector.py` 都在运行。
开发期 `/api` 与 `/socket.io` 由 Vite 代理到后端(见 vite.config.ts);生产构建后用 Nginx 同源反代。

生产构建：`npm run build` → 产物在 `web/dist/`，拷到云服务器 `deploy/dist/`。

---

## 3. 结构（★ 每个文件夹/文件的作用）

| 文件 | 职责 |
|---|---|
| `index.html` | **HTML 入口模板**。Vite 的起点；`<html class="dark">` 激活 Element Plus 暗色主题 |
| `vite.config.ts` | **构建配置 + 开发代理**：`/api` 与 `/socket.io` 代理到 `localhost:3000`（`ws:true` 必须开） |
| `src/main.ts` | **应用入口**：创建 Vue 应用、装路由与 Element Plus、挂载到 `#app` |
| `src/App.vue` | **应用外壳**：顶栏（品牌/菜单/状态灯）+ `<router-view>` 内容区 |
| `src/router/index.ts` | **路由表**：`/` → `/twin`，`/twin`、`/status` 两个页面 |
| `src/styles.css` | **全局主题**：深色工业风的 CSS 变量（`--ok`/`--ng`/`--accent` 等） |
| `src/services/socket.ts` | **通信层**：socket.io 连接管理（单例 + 无限重连）+ 快照 REST 请求 |
| `src/services/types.ts` | **类型定义**：与数据契约一一对应的 TypeScript 接口 |
| `src/composables/useLineData.ts` | ★ **数据层核心**：快照预载 + socket 订阅 + 派生状态（模块级单例） |
| `src/three/SceneManager.ts` | **3D 场景封装**：渲染器/相机/灯光/地面/网格/渲染主循环/dispose |
| `src/three/RobotArm.ts` | ★ **程序化 6 轴机械臂**（占位模型，接口 = `setJoints(deg[6])`） |
| `src/views/TwinView.vue` | **孪生页**：10Hz 关节驱动 + 角度刻度条 + 产线摘要 + 断线遮罩 |
| `src/views/StatusView.vue` | **状态页**：6 张统计卡 + 事件流（报警高亮 + WebAudio 蜂鸣） |
| `src/vite-env.d.ts` | 让 `import.meta.env` 有类型（Vite 客户端类型引用） |

---

## 4. 依赖说明（package.json）

> JSON 文件不支持注释，所以在这里逐条解释每个依赖的用途。

| 依赖 | 用途 |
|---|---|
| `vue` | Vue 3 核心（响应式系统、模板编译） |
| `vue-router` | 前端路由（SPA 页面切换，不重载文档 → WebSocket 连接不断） |
| `element-plus` | UI 组件库（面板、标签、菜单、滚动条、空状态、开关） |
| `@element-plus/icons-vue` | Element Plus 图标组件 |
| `socket.io-client` | WebSocket 客户端（与后端 `@nestjs/platform-socket.io` 协议配套） |
| `three` | 3D 引擎（场景图、WebGL 渲染、几何体、材质） |

开发依赖：`vite`（打包器）、`@vitejs/plugin-vue`（编译 .vue）、`typescript` / `vue-tsc`（类型检查）、`@types/three`。

---

## 5. 前端数据流（★ 关键）

```
                        ┌─────────── 后端 ───────────┐
                        │  Redis（快照）              │
                        │       ↓ REST               │
浏览器 ────① preload() ─▶│  GET /api/lines/:id/snapshot
  │                       │                            │
  │                       │  MQTT → ingest → gateway   │
  │◀──② WebSocket 推送 ───│  (10Hz robot_state)        │
  │                       └────────────────────────────┘
  │
  └──③ 写入 Vue 的 ref → computed 派生 → 模板自动重渲染
```

- `useLineData()` 返回**模块级单例** → 顶栏与页面共用一份数据，天然同步；
  路由切换时连接不断、状态不丢。
- 只保留"最新一帧"（`robot`/`status`），事件列表滚动保留 60 条 → 不累积高频数据。
- `preload()` 失败会静默降级，靠 WebSocket 实时数据兜底。

---

## 6. 换成真实机器人模型

RobotArm 是占位模型(关节层次与轴向按标准 6 轴臂)。拿到厂商 URDF 后:

```ts
import URDFLoader from 'urdf-loader';
const robot = URDFLoader.load('/models/robot.urdf');   // 网格文件放 public/models/
// robot.joints['joint_1'].setJointValue(rad) 或直接改 .angle
```

保持 `setJoints(deg[6])` 接口即可,TwinView 不用改。
`urdf-loader` 不在依赖里(当前用不到),换真模型时再 `npm i urdf-loader`。

---

## 7. 已知 TODO(按路线图)

- 第 4 步:登录页 + JWT;菜单/按钮按角色权限渲染
- 第 4 步:数据分析页(需装 ECharts:`npm i echarts`,读 TimescaleDB 历史)
- 打磨:机器人角度插值补帧(当前 10Hz 直驱已平滑);TCP 轨迹线;多产线切换
  （当前 `useLineData` 只取 `Object.values(robots)[0]` 驱动一台机器人）
