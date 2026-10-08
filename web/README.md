# web/ — 前端(Vue3 + TS + Three.js)

三个页面:**实时孪生**(6 轴机器人随数据运动)、**产线状态**(统计卡 + 事件流 + 报警声音)、
**视觉检测**(实时检测流,网格/单件两种模式,NG 缺陷框叠加)。

## 启动

```bash
cp .env.example .env        # 默认指向 http://localhost:3000
npm install
npm run dev                 # http://localhost:5173
```

前置:`deploy/` 基础设施、`server/` 后端、`edge/mock_collector.py` 都在运行。
开发期 `/api` 与 `/socket.io` 由 Vite 代理到后端(见 vite.config.ts);生产构建后用 Nginx 同源反代。

## 结构

| 文件 | 职责 |
|---|---|
| `src/composables/useLineData.ts` | 数据层单例:快照预载 + socket.io 订阅 + 滚动列表(所有页面共享) |
| `src/services/socket.ts` | socket.io 连接管理(断线自动重连) |
| `src/services/types.ts` | 与数据契约对齐的前端类型 |
| `src/three/RobotArm.ts` | **程序化 6 轴机械臂**(占位模型,接口 = setJoints(度[6])) |
| `src/three/SceneManager.ts` | 渲染器/相机/灯光/网格/主循环封装 |
| `src/views/TwinView.vue` | 孪生页:10Hz 关节驱动 + 角度刻度条 + 产线摘要 |
| `src/views/StatusView.vue` | 状态页:统计卡片 + 事件流(报警高亮 + WebAudio 蜂鸣) |
| `src/views/VisionView.vue` | 视觉页:检测流网格 / 单件详情,缺陷框按 640×480 归一化叠加 |

## 换成真实机器人模型

RobotArm 是占位模型(关节层次与轴向按标准 6 轴臂)。拿到厂商 URDF 后:

```ts
import URDFLoader from 'urdf-loader';
const robot = URDFLoader.load('/models/robot.urdf');   // 网格文件放 public/models/
// robot.joints['joint_1'].setJointValue(rad) 或直接改 .angle
```

保持 `setJoints(deg[6])` 接口即可,TwinView 不用改。依赖已装好(`urdf-loader`)。

## 已知 TODO(按路线图)

- 第 4 步:登录页 + JWT;菜单/按钮按角色权限渲染
- 第 4 步:数据分析页(ECharts,读 TimescaleDB 历史)
- 第 5 步:vision 页接通 MinIO 图片(imageUrl/thumbUrl 目前是 null → 显示占位图)
- 打磨:机器人角度插值补帧(当前 10Hz 直驱已平滑);TCP 轨迹线;多产线切换
