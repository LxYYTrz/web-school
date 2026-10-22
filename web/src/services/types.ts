/**
 * ============================================================================
 * 文件作用：与数据契约对齐的前端 TypeScript 类型定义
 * 所属模块：web/src/services/
 * ============================================================================
 *
 * 【宏观定位】前端对"数据长什么样"的唯一声明。
 *   后端传 JSON，前端拿到的就是 any；这个文件给它们套上类型，
 *   好处是：字段名写错、类型不匹配时，编辑器/编译期立刻报错，而不是运行时才发现。
 *
 * 【与后端/契约的对应关系】
 *   前端类型         ←→ 契约章节        ←→ 后端产出位置
 *   RobotState      ←→ 3.1 robot_state ←→ ingest.dispatch → gateway.broadcastRobot
 *   LineStatus      ←→ 3.2 line_status ←→ ingest.dispatch → gateway.broadcastLineStatus
 *   ProductionEvent ←→ 3.3 event       ←→ ingest.dispatch → gateway.broadcastEvent
 *   LineSnapshot    ←→ REST 快照接口    ←→ state/line-state.service.getLineSnapshot
 *
 * 【修改规则】
 *   与契约一致：**只增字段，不改名、不删字段**。
 *   破坏性变更必须升级契约版本（tl/v1 → tl/v2）。
 *
 * 【为什么 mode / type / level 用 `| string` 联合】
 *   例如 mode: 'manual' | 'auto' | 'remote' | 'error' | string
 *   前面列出已知枚举值（编辑器能补全、能查错），末尾加 | string 表示
 *   "还可能有契约没覆盖的新值" —— 这样后端加了新枚举值不会让前端编译失败，
 *   但已知值仍有智能提示。这是渐进式接入新枚举值的常用写法。
 */

// 机器人六轴遥测（契约 3.1）
export interface RobotState {
  ts: number;                                          // 采集时间戳（Unix 毫秒）
  deviceId: string;                                    // 设备编码，如 'robot-01'
  joints: [number, number, number, number, number, number]; // 六元组，固定 6 个（契约必填）
  tcp: number[] | null;                                // TCP 位姿 [x,y,z,rx,ry,rz]，现场无则 null
  speedPct: number;                                    // 速度倍率 0~100
  mode: 'manual' | 'auto' | 'remote' | 'error' | string; // 运行模式
  program: string;                                     // 当前程序名
  alarmCode: number;                                   // 报警码，0 = 无报警
}

// 产线状态快照（契约 3.2）
export interface LineStatus {
  ts: number;                                          // 时间戳
  lineId: string;                                      // 产线编码
  state: 'running' | 'idle' | 'alarm' | 'offline';     // 产线状态枚举
  productCode: string;                                 // 当前产品型号
  goodCount: number;                                   // 良品累计
  ngCount: number;                                     // 不良累计
  beatMs: number;                                      // 节拍（毫秒）
}

// 生产事件 / 报警（契约 3.3）
export interface ProductionEvent {
  ts: number;                                          // 事件时间戳
  lineId: string;                                      // 产线编码
  deviceId: string;                                    // 设备编码
  type: 'start' | 'stop' | 'alarm' | 'piece_done' | 'changeover' | 'custom' | string; // 事件类型
  level: 'info' | 'warning' | 'critical';              // 级别
  code?: string | null;                                // 厂商报警码（可空）
  message?: string | null;                             // 描述文本（可空）
  payload?: Record<string, unknown>;                   // 自定义负载（可空）
}

// 快照 REST 接口的返回(见 server/src/state/line-state.service.ts)
export interface LineSnapshot {
  lineId: string;                        // 产线编码
  ts: number;                            // 快照生成时刻
  status: LineStatus | null;             // 产线状态（可能为 null = 还没数据）
  edge: { status: 'online' | 'offline' } | null; // 边缘在线状态
  robots: Record<string, RobotState>;    // 各机器人最新一帧，key 是 deviceId
}
