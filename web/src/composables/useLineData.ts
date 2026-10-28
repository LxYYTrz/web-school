/**
 // 这一段负责按产线共享快照加载与实时消息订阅状态，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：产线数据层（前端的核心：快照预载 + 实时订阅 + 派生状态）
 * 所属模块：web/src/composables/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件回答"前端数据是怎么流动的" ★
 * ============================================================================
 *
 * 【前端数据流全景】
 *
 *   ┌──────────── 后端 ────────────┐        ┌──────── 浏览器 ────────┐
 *   │ Redis（快照）                 │        │                        │
 *   │      │                        │        │                        │
 *   │      │ ① REST /snapshot        │───────▶│ ② preload() 填初始值  │
 *   │      │                        │        │         ↓              │
 *   │ MQTT→ingest→gateway          │        │ ③ socket.on(...) 订阅   │
 *   │      │                        │◀───────│         ↓              │
 *   │      │ ④ WS 实时推送 10Hz/1Hz  │        │ ④ 写入 ref 响应式变量   │
 *   └───────────────────────────────┘        │         ↓              │
 *                                            │ ⑤ computed 派生状态    │
 *                                            │         ↓              │
 *                                            │ ⑥ 模板自动重渲染       │
 *                                            └────────────────────────┘
 *
 * 【为什么是"模块级单例"】
 *   createLineData() 创建一个内部闭包，保存了 socket 事件监听 + 所有 ref。
 *   它的实例被存在模块级变量 shared 里，useLineData() 每次都返回同一个实例。
 *   好处：
 *     ① App.vue 顶栏和 TwinView/IoView 页面用的是同一份数据 → 天然同步
 *     ② 路由切换时组件卸载/重建，但数据层不重建 → WebSocket 连接不断、状态不丢
 *     ③ 只注册一份 socket 监听器 → 不会重复消费同一条消息
 *
 * 【设计约束：只保留"最新一帧"，不累积高频数据】
 *   机器人帧是 10Hz。如果把每一帧都存进数组，一小时就是 36000 个对象，
 *   浏览器内存和 Vue 的响应式开销都会爆。
 *   所以：
 *     - robot   → 单个 ref（覆盖写，只留最新一帧）
 *     - status  → 单个 ref
 *     - events  → 滚动列表，最多 MAX_FEED(60) 条，超出丢弃最旧的
 *
 * 【降级策略】
 *   preload() 失败（后端没起 / 网络不通）→ 只打 console.warn，不抛错，
 *   页面继续靠 WebSocket 的实时数据填充。
 */
import { computed, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// computed：Vue 根据其他响应式值计算并缓存结果的函数；ref：Vue 创建可通过 .value 读写的响应式引用
import { getSocket, fetchSnapshot } from '../services/socket';
// 从 ../services/socket 导入这一行列出的符号，供本文件调用。
// getSocket：从 ../services/socket 导入的对象，用于本文件的调用或类型约束；fetchSnapshot：从 ../services/socket 导入的对象，用于本文件的调用或类型约束
import type {
// 开始列出本文件从其他模块导入的类型或运行时对象。
// 大括号内逐项列出从后续模块路径导入的类型或运行时对象
  IoState,
  // 把变量 IoState 作为同名对象字段加入当前对象。
  // IoState：项目数据契约中的 IO 状态帧结构，包含时间、产线和只读信号
  LineSnapshot,
  // 把变量 LineSnapshot 作为同名对象字段加入当前对象。
  // LineSnapshot：项目定义的产线快照结构，汇总状态、边缘在线信息、IO 与机器人帧
  LineStatus,
  // 把变量 LineStatus 作为同名对象字段加入当前对象。
  // LineStatus：项目数据契约中的产线状态结构，包含工序、计数和节拍
  ProductionEvent,
  // 把变量 ProductionEvent 作为同名对象字段加入当前对象。
  // ProductionEvent：项目数据契约中的生产事件结构，包含类型、等级和事件内容
  RobotState,
  // 把变量 RobotState 作为同名对象字段加入当前对象。
  // RobotState：项目数据契约中的机器人遥测结构，包含六轴角度、模式和报警码
} from '../services/types';
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 本行完成上面一层已说明的函数、分支或对象配置

/** 事件流最多保留条数（防止高频事件把内存和 DOM 撑爆） */
const MAX_FEED = 60;
// 根据 60 设置 MAX_FEED，供当前流程后续使用。
// MAX_FEED：本处保存 60 的结果

// ===== dev 演示 mock 数据(仅 VITE_MOCK_ONLY=true 时使用) =====
// 没后端时让视图(twin/io)有数据可见,纯看页面用。
// 开启方式:build 时设 VITE_MOCK_ONLY=true (例:VITE_MOCK_ONLY=true npm run build)。
// 不设 → prod 走真实链路,mock 不生效。
// 这一段定义 MOCK_NOW，用于生成演示数据使用的当前时间戳。
const MOCK_NOW = () => Date.now();
// 取得当前时间戳；Date.now 使用毫秒，将结果保存或写入 MOCK_NOW。
// MOCK_NOW：生成演示数据使用的当前时间戳；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒
// 这一段提供了生成演示数据使用的当前时间戳的实现；实际结果由运行时输入和执行分支决定。
// 这一段定义 MOCK_EARLIER，用于生成演示数据使用的较早时间戳。
const MOCK_EARLIER = (secAgo: number) => Date.now() - secAgo * 1000;
// 取得当前时间戳；Date.now 使用毫秒，将结果保存或写入 MOCK_EARLIER。
// MOCK_EARLIER：生成演示数据使用的较早时间戳；secAgo：当前方法接收的参数，类型为 number；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒
// 这一段提供了生成演示数据使用的较早时间戳的实现；实际结果由运行时输入和执行分支决定。
const MOCK_ENABLED = import.meta.env.VITE_MOCK_ONLY === 'true';
// 根据 import.meta.env.VITE_MOCK_ONLY === 'true' 设置 MOCK_ENABLED，供当前流程后续使用。
// MOCK_ENABLED：本处保存 import.meta.env.VITE_MOCK_ONLY === 'true' 的结果；env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_MOCK_ONLY：本处声明的字段或类型，类型为 any
const MOCK_ROBOT: RobotState = {
// 声明 MOCK_ROBOT，初始值由 { 计算得到，供当前处理流程继续使用。
// MOCK_ROBOT：本处保存 { ts: MOCK_NOW(), deviceId: 'robot-01', joints: [10.2, -35.0… 的结果，类型为 RobotState；RobotState：项目数据契约中的机器人遥测结构，包含六轴角度、模式和报警码
  ts: MOCK_NOW(),
  // 生成演示数据使用的当前时间戳。
  // ts：数据产生时的毫秒时间戳；MOCK_NOW：生成演示数据使用的当前时间戳
  deviceId: 'robot-01',
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  joints: [10.2, -35.0, 42.1, 0.5, 88.0, 12.3],
  // 声明或设置 joints，用于按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度。
  // joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度
  tcp: [512.3, -120.5, 388.0, 179.9, 0.2, 45.0],
  // 声明或设置 tcp，用于机器人末端位姿数据，无数据时为 null。
  // tcp：机器人末端位姿数据，无数据时为 null
  speedPct: 80,
  // 声明或设置 speedPct，用于机器人速度百分比。
  // speedPct：机器人速度百分比
  mode: 'auto',
  // 声明或设置 mode，用于机器人或设备运行模式。
  // mode：机器人或设备运行模式
  program: 'PICK_A',
  // 声明或设置 program，用于机器人当前程序名称。
  // program：机器人当前程序名称
  alarmCode: 0,
  // 声明或设置 alarmCode，用于设备报警编号，0 表示无报警。
  // alarmCode：设备报警编号，0 表示无报警
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
const MOCK_STATUS: LineStatus = {
// 声明 MOCK_STATUS，初始值由 { 计算得到，供当前处理流程继续使用。
// MOCK_STATUS：本处保存 { ts: MOCK_NOW(), lineId: 'line-01', state: 'running', produ… 的结果，类型为 LineStatus；LineStatus：项目数据契约中的产线状态结构，包含工序、计数和节拍
  ts: MOCK_NOW(),
  // 生成演示数据使用的当前时间戳。
  // ts：数据产生时的毫秒时间戳；MOCK_NOW：生成演示数据使用的当前时间戳
  lineId: 'line-01',
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  state: 'running',
  // 声明或设置 state，用于当前状态值或实时状态服务实例，以所在对象为准。
  // state：当前状态值或实时状态服务实例，以所在对象为准
  productCode: 'P-1001',
  // 声明或设置 productCode，用于当前产品编码。
  // productCode：当前产品编码
  goodCount: 1024,
  // 声明或设置 goodCount，用于合格品累计数量。
  // goodCount：合格品累计数量
  ngCount: 3,
  // 声明或设置 ngCount，用于不合格品累计数量。
  // ngCount：不合格品累计数量
  beatMs: 8500,
  // 声明或设置 beatMs，用于生产节拍，单位毫秒。
  // beatMs：生产节拍，单位毫秒
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
const MOCK_EVENTS: ProductionEvent[] = [
// 声明 MOCK_EVENTS，初始值由 [ 计算得到，供当前处理流程继续使用。
// MOCK_EVENTS：本处保存 [ { ts: MOCK_EARLIER(2), lineId: 'line-01', deviceId: 'plc-0… 的结果，类型为 ProductionEvent[]；ProductionEvent：项目数据契约中的生产事件结构，包含类型、等级和事件内容
  { ts: MOCK_EARLIER(2),  lineId: 'line-01', deviceId: 'plc-01', type: 'start',      level: 'info',    message: '产线启动(mock)' },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // ts：数据产生时的毫秒时间戳；MOCK_EARLIER：生成演示数据使用的较早时间戳；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；level：用户操作级别或事件严重级别，依据当前接口结构区分；message：消息正文或用于展示的结果说明
  { ts: MOCK_EARLIER(8),  lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000001 完成' },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // ts：数据产生时的毫秒时间戳；MOCK_EARLIER：生成演示数据使用的较早时间戳；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；level：用户操作级别或事件严重级别，依据当前接口结构区分；message：消息正文或用于展示的结果说明
  { ts: MOCK_EARLIER(15), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000002 完成' },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // ts：数据产生时的毫秒时间戳；MOCK_EARLIER：生成演示数据使用的较早时间戳；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；level：用户操作级别或事件严重级别，依据当前接口结构区分；message：消息正文或用于展示的结果说明
  { ts: MOCK_EARLIER(23), lineId: 'line-01', deviceId: 'plc-01',   type: 'alarm',      level: 'warning', code: 'W201', message: '气源压力偏低(mock)' },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // ts：数据产生时的毫秒时间戳；MOCK_EARLIER：生成演示数据使用的较早时间戳；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；level：用户操作级别或事件严重级别，依据当前接口结构区分；code：业务编码、状态码或数据库查询字段，结合所在报文解释；message：消息正文或用于展示的结果说明
  { ts: MOCK_EARLIER(30), lineId: 'line-01', deviceId: 'robot-01', type: 'piece_done', level: 'info',    message: '工件 SN20261014000003 完成' },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // ts：数据产生时的毫秒时间戳；MOCK_EARLIER：生成演示数据使用的较早时间戳；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；type：当前报文、指令或对象的类别字段；level：用户操作级别或事件严重级别，依据当前接口结构区分；message：消息正文或用于展示的结果说明
];
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 此处结束上方数组的元素列表，并完成赋值或返回语句
// demo 模式下 6 个 IO 点各给一个不同的值,便于在页面上区分每个点位
const MOCK_IO: IoState = {
// 声明 MOCK_IO，初始值由 { 计算得到，供当前处理流程继续使用。
// MOCK_IO：本处保存 { ts: MOCK_NOW(), lineId: 'line-01', io: { sensorIn: 1, sens… 的结果，类型为 IoState；IoState：项目数据契约中的 IO 状态帧结构，包含时间、产线和只读信号
  ts: MOCK_NOW(), lineId: 'line-01',
  // 生成演示数据使用的当前时间戳。
  // ts：数据产生时的毫秒时间戳；MOCK_NOW：生成演示数据使用的当前时间戳；lineId：产线标识，接口通常使用 line-01 等编码
  io: {
  // 声明或设置 io，用于现场 IO 信号对象或当前 IO 状态帧。
  // io：现场 IO 信号对象或当前 IO 状态帧
    sensorIn: 1, sensorArrive: 0, sensorRetreat: null,
    // 声明或设置 sensorIn，用于word 11 的入料传感器读数。
    // sensorIn：word 11 的入料传感器读数；sensorArrive：word 12 的到料传感器读数；sensorRetreat：word 13 的退料传感器读数
    lightColor: 1, trayUp: 1, blockUp: 0,
    // 声明或设置 lightColor，用于word 14 的灯色读数：0 绿、1 黄、2 红。
    // lightColor：word 14 的灯色读数：0 绿、1 黄、2 红；trayUp：word 15 的托料盘升降读数；blockUp：word 16 的阻挡杆升降读数
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 产线数据(模块级单例):快照预载 + socket.io 实时订阅。
// 约定:只持有"最新一帧"与"滚动列表",不累积高频数据,避免内存与渲染压力。
// App 与各页面共享同一实例;SPA 生命周期内常驻,不做组件级注销。
/**
 * 产线数据(模块级单例):快照预载 + socket.io 实时订阅。
 * 约定:只持有"最新一帧"与"滚动列表",不累积高频数据,避免内存与渲染压力。
 * App 与各页面共享同一实例;SPA 生命周期内常驻,不做组件级注销。
 *
 * @param lineId 要订阅的产线编码
 */
// 这一段定义 createLineData，用于创建指定产线的共享实时数据、初始快照与消息订阅。
function createLineData(lineId: string) {
// 定义函数 createLineData。
// createLineData：创建指定产线的共享实时数据、初始快照与消息订阅；lineId：产线标识，接口通常使用 line-01 等编码
  // 取得（并懒创建）全局唯一的 socket 连接
  const socket = getSocket();
  // 取得并复用浏览器端 Socket.IO 单例连接，将结果保存或写入 socket。
  // socket：Socket.IO 实时连接实例；getSocket：从 ../services/socket 导入的对象，用于本文件的调用或类型约束

  // ---- 响应式状态变量（ref）----
  // WebSocket 是否已连接（对应顶栏"服务 已连接/断开"）
  const connected = ref(false);
  // 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 connected。
  // connected：连接是否已建立的状态标记；ref：Vue 创建可通过 .value 读写的响应式引用
  // 边缘采集器是否在线。null = 未知（还没收到任何消息）
  const edgeOnline = ref<boolean | null>(null);
  // 根据 ref<boolean | null>(null) 设置 edgeOnline，供当前流程后续使用。
  // edgeOnline：本处保存 ref<boolean | null>(null) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
  // 机器人最新一帧（10Hz 覆盖写）

  // robot、status、io 分别保存机器人角度帧、工序状态和 IO 帧，供不同界面读取。
  // ref 的值变化会通知依赖它的页面与 watch；同一对象的实时事件更新它自己的分支，不把关节角依次转换成工序和 IO。
  // 初始 null 表示没有对应现场帧；收到过帧后，这份浏览器内存与后端 Redis 的有效期分别管理。

  const robot = ref<RobotState | null>(null);
  // 为机器人这一分支保存当前帧，初始 null 表示还没有收到对应数据。
  // robot 是 Vue 的响应式 ref，类型为 RobotState 或 null；快照和 robot_state 回调写入它，TwinView 的 watch 读取它。
  // 产线当前状态（1Hz 覆盖写）
  const status = ref<LineStatus | null>(null);
  // 根据 ref<LineStatus | null>(null) 设置 status，用于当前连接、产线、请求或指令的状态字段。
  // status：当前连接、产线、请求或指令的状态字段；ref：Vue 创建可通过 .value 读写的响应式引用；LineStatus：项目数据契约中的产线状态结构，包含工序、计数和节拍
  const io = ref<IoState | null>(null);
  // 根据 ref<IoState | null>(null) 设置 io，用于现场 IO 信号对象或当前 IO 状态帧。
  // io：现场 IO 信号对象或当前 IO 状态帧；ref：Vue 创建可通过 .value 读写的响应式引用；IoState：项目数据契约中的 IO 状态帧结构，包含时间、产线和只读信号
  // 事件滚动列表（最新在前，因为用 unshift）
  const events = ref<ProductionEvent[]>([]);
  // 根据 ref<ProductionEvent[]>([]) 设置 events，供当前流程后续使用。
  // events：本处保存 ref<ProductionEvent[]>([]) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；ProductionEvent：项目数据契约中的生产事件结构，包含类型、等级和事件内容
  const lastEventAt = ref(0);
  // 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 lastEventAt。
  // lastEventAt：本处保存 ref(0) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
  // 快照和实时推送并行到达时，不能用较早的快照覆盖已收到的新帧。
  const liveSeen = { robot: false, status: false, io: false, edge: false, event: false };
  // 分别记录各类数据是否已经收到实时事件，用于处理快照响应与实时消息的先后顺序。
  // liveSeen 是本次共享数据实例中的标记对象；robot、status、io 等是数据类别；初始 false 表示对应类别尚未接到实时事件。

  // ---------- 快照预载(首屏立即有数据,不等下一帧) ----------
  /**
   * 拉取一次 REST 快照并填充初始值。
   * 与 WebSocket 并行执行：谁先到谁先渲染，最终状态一致。
   */
  // 这一段定义 preload，用于加载产线快照，填充首次进入页面时的状态。

  // preload() 请求后端快照，为刚打开的网页提供已有状态；实时订阅可以与这个 HTTP 请求并行。
  // liveSeen 分别标记机器人、工序、IO 等分支是否已收到实时数据，避免较晚返回的旧快照覆盖先到的新帧。
  // snap.robots 是按设备编码保存的帧集合；当前取其中第一台，App 的共享使用也固定在 line-01，不代表任意多设备切换。
  // 演示回退只在 MOCK_ENABLED 的相应异常分支执行，不能把模拟值当成现场采集结果。

  async function preload() {
  // 为刚打开的页面预载后端已有快照，并防止迟到的旧快照覆盖先收到的实时帧。
  // lineId 是当前产线编码；fetchSnapshot() 发 HTTP 请求；liveSeen 按机器人、工序、IO 等类别记录是否已经收到实时数据。
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      // 调用 REST 快照接口
      const snap = (await fetchSnapshot(lineId)) as LineSnapshot;
      // 通过 HTTP 获取指定产线的当前快照，将结果保存或写入 snap。
      // snap：本处保存 (await fetchSnapshot(lineId)) as LineSnapshot 的结果；fetchSnapshot：从 ../services/socket 导入的对象，用于本文件的调用或类型约束；lineId：产线标识，接口通常使用 line-01 等编码；LineSnapshot：项目定义的产线快照结构，汇总状态、边缘在线信息、IO 与机器人帧
      // 有产线状态就填上
      if (snap.status && !liveSeen.status) status.value = snap.status;
      // 检查(snap.status && !liveSeen.status) status.value = snap.status;，按判断结果进入对应的处理分支。
      // snap：本处保存 (await fetchSnapshot(lineId)) as LineSnapshot 的结果；status：当前连接、产线、请求或指令的状态字段；liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；value：当前字段或点位的实际取值
      // 有边缘状态就换算成布尔：只有 'online' 才算在线
      if (snap.edge && !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online';
      // 检查(snap.edge && !liveSeen.edge) edgeOnline.value = snap.edge.status === 'online';，按判断结果进入对应的处理分支。
      // snap：本处保存 (await fetchSnapshot(lineId)) as LineSnapshot 的结果；edge：本处声明的字段或类型，类型为 { status: 'online' | 'offline' } | null；liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；edgeOnline：本处保存 ref<boolean | null>(null) 的结果；value：当前字段或点位的实际取值；status：当前连接、产线、请求或指令的状态字段
      if (snap.io && !liveSeen.io) io.value = snap.io;
      // 检查(snap.io && !liveSeen.io) io.value = snap.io;，按判断结果进入对应的处理分支。
      // snap：本处保存 (await fetchSnapshot(lineId)) as LineSnapshot 的结果；io：现场 IO 信号对象或当前 IO 状态帧；liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；value：当前字段或点位的实际取值
      // robots 是 { deviceId: RobotState } 字典。
      // 当前前端只驱动一台机器人，所以取第一个（Object.values[0]）用即可。
      // 当前只驱动一台机器人；支持多机器人时需要按 deviceId 分发到多个视图。
      const first = Object.values(snap.robots ?? {})[0];
      // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
      // first：本处保存 Object.values(snap.robots ?? {})[0] 的结果；Object：JavaScript 对象辅助 API；values：取得字典或映射中的所有值；snap：本处保存 (await fetchSnapshot(lineId)) as LineSnapshot 的结果；robots：按设备编码索引的机器人最新遥测集合
      if (first && !liveSeen.robot) robot.value = first;
      // 仅在快照有机器人帧且尚未收到实时机器人数据时，用快照补充首屏。
      // first 是本次快照中的首台机器人帧；liveSeen.robot 防止较晚返回的旧快照覆盖已经收到的新帧；robot.value 是网页保存的响应式机器人状态。
    } catch (e) {
    // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
    // e：本处保存的局部数据
      // 后端没起或网络异常:静默,等待 socket 实时数据
      console.warn('[lineData] snapshot 预载失败', e);
      // 记录警告日志或显示警告提示，以接收对象为准。
      // console：浏览器或 Node.js 的日志输出对象；warn：记录警告日志或显示警告提示，以接收对象为准；e：本处保存的局部数据
      // dev 演示 fallback:无后端时填 mock,让视图有数据可见
      if (MOCK_ENABLED) {
      // 检查(MOCK_ENABLED)，按判断结果进入对应的处理分支。
      // MOCK_ENABLED：本处保存 import.meta.env.VITE_MOCK_ONLY === 'true' 的结果
        if (!liveSeen.robot) robot.value = MOCK_ROBOT;
        // 检查(!liveSeen.robot) robot.value = MOCK_ROBOT;，按判断结果进入对应的处理分支。
        // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；robot：liveSeen 对象上的字段或操作；value：当前字段或点位的实际取值；MOCK_ROBOT：本处保存 { ts: MOCK_NOW(), deviceId: 'robot-01', joints: [10.2, -35.0… 的结果，类型为 RobotState
        if (!liveSeen.status) status.value = MOCK_STATUS;
        // 检查(!liveSeen.status) status.value = MOCK_STATUS;，按判断结果进入对应的处理分支。
        // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；MOCK_STATUS：本处保存 { ts: MOCK_NOW(), lineId: 'line-01', state: 'running', produ… 的结果，类型为 LineStatus
        if (!liveSeen.event) events.value = MOCK_EVENTS;
        // 检查(!liveSeen.event) events.value = MOCK_EVENTS;，按判断结果进入对应的处理分支。
        // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；event：liveSeen 对象上的字段或操作；events：本处保存 ref<ProductionEvent[]>([]) 的结果；value：当前字段或点位的实际取值；MOCK_EVENTS：本处保存 [ { ts: MOCK_EARLIER(2), lineId: 'line-01', deviceId: 'plc-0… 的结果，类型为 ProductionEvent[]
        if (!liveSeen.edge) edgeOnline.value = true;
        // 检查(!liveSeen.edge) edgeOnline.value = true;，按判断结果进入对应的处理分支。
        // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；edge：liveSeen 对象上的字段或操作；edgeOnline：本处保存 ref<boolean | null>(null) 的结果；value：当前字段或点位的实际取值
        if (!liveSeen.io) io.value = MOCK_IO;
        // 检查(!liveSeen.io) io.value = MOCK_IO;，按判断结果进入对应的处理分支。
        // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；io：现场 IO 信号对象或当前 IO 状态帧；value：当前字段或点位的实际取值；MOCK_IO：本处保存 { ts: MOCK_NOW(), lineId: 'line-01', io: { sensorIn: 1, sens… 的结果，类型为 IoState
        if (!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts;
        // 检查(!liveSeen.event) lastEventAt.value = MOCK_EVENTS[0].ts;，按判断结果进入对应的处理分支。
        // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；event：liveSeen 对象上的字段或操作；lastEventAt：本处保存 ref(0) 的结果；value：当前字段或点位的实际取值；MOCK_EVENTS：本处保存 [ { ts: MOCK_EARLIER(2), lineId: 'line-01', deviceId: 'plc-0… 的结果，类型为 ProductionEvent[]；ts：数据产生时的毫秒时间戳
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了加载产线快照，填充首次进入页面时的状态的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 订阅产线房间。
   * 后端收到后会把本 socket 加入 room `line:{lineId}`，之后只推这条产线的数据。
   */
  // 这一段定义 subscribe，用于向实时连接申请订阅指定产线。
  function subscribe() {
  // 定义函数 subscribe。
  // subscribe：向实时连接申请订阅指定产线
    socket.emit('subscribe', { lineId });
    // 向订阅方发送指定实时事件。
    // socket：Socket.IO 实时连接实例；emit：向 Socket.IO 连接或房间发送事件；lineId：产线标识，接口通常使用 line-01 等编码
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向实时连接申请订阅指定产线的实现；实际结果由运行时输入和执行分支决定。

  // 连接建立
  socket.on('connect', () => {
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数
    connected.value = true;
    // 把右侧表达式的结果写入 connected.value。
    // connected：连接是否已建立的状态标记；value：当前字段或点位的实际取值
    subscribe();
    // 订阅消息主题、频道或事件流。
    // subscribe：订阅消息主题、频道或事件流
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 连接断开（顶栏灯变红；socket.io 会自动重连）
  socket.on('disconnect', () => {
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数
    connected.value = false;
    // 把右侧表达式的结果写入 connected.value。
    // connected：连接是否已建立的状态标记；value：当前字段或点位的实际取值
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 机器人六轴帧（10Hz）—— 覆盖写，只保留最新一帧
  socket.on('robot_state', (msg: RobotState) => {
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数；msg：当前收到的消息或提示文字；RobotState：项目数据契约中的机器人遥测结构，包含六轴角度、模式和报警码
    liveSeen.robot = true;
    // 把右侧表达式的结果写入 liveSeen.robot。
    // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；robot：liveSeen 对象上的字段或操作
    robot.value = msg;
    // 把右侧表达式的结果写入 robot.value。
    // robot：本处保存 ref<RobotState | null>(null) 的结果；value：当前字段或点位的实际取值；msg：当前收到的消息或提示文字
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 产线状态（1Hz）
  socket.on('line_status', (msg: LineStatus) => {
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数；msg：当前收到的消息或提示文字；LineStatus：项目数据契约中的产线状态结构，包含工序、计数和节拍
    liveSeen.status = true;
    // 把右侧表达式的结果写入 liveSeen.status。
    // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；status：当前连接、产线、请求或指令的状态字段
    status.value = msg;
    // 把右侧表达式的结果写入 status.value。
    // status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；msg：当前收到的消息或提示文字
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  socket.on('io_state', (msg: IoState) => {
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数；msg：当前收到的消息或提示文字；IoState：项目数据契约中的 IO 状态帧结构，包含时间、产线和只读信号
    liveSeen.io = true;
    // 把右侧表达式的结果写入 liveSeen.io。
    // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；io：现场 IO 信号对象或当前 IO 状态帧
    io.value = msg;
    // 把右侧表达式的结果写入 io.value。
    // io：现场 IO 信号对象或当前 IO 状态帧；value：当前字段或点位的实际取值；msg：当前收到的消息或提示文字
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 生产事件 —— unshift 插到最前面（最新的在上面）
  socket.on('event', (msg: ProductionEvent) => {
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数；msg：当前收到的消息或提示文字；ProductionEvent：项目数据契约中的生产事件结构，包含类型、等级和事件内容
    liveSeen.event = true;
    // 把右侧表达式的结果写入 liveSeen.event。
    // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；event：liveSeen 对象上的字段或操作
    events.value.unshift(msg);
    // 把当前元素放到数组开头。
    // events：本处保存 ref<ProductionEvent[]>([]) 的结果；value：当前字段或点位的实际取值；unshift：本处声明的字段或类型，类型为 number；msg：当前收到的消息或提示文字
    // 超过上限就截断（直接改 length 是 Vue3 响应式数组支持的做法）
    if (events.value.length > MAX_FEED) events.value.length = MAX_FEED;
    // 检查(events.value.length > MAX_FEED) events.value.length = MAX_FEED;，按判断结果进入对应的处理分支。
    // events：本处保存 ref<ProductionEvent[]>([]) 的结果；value：当前字段或点位的实际取值；length：本处声明的字段或类型，类型为 number；MAX_FEED：本处保存 60 的结果
    lastEventAt.value = msg.ts;
    // 把右侧表达式的结果写入 lastEventAt.value。
    // lastEventAt：本处保存 ref(0) 的结果；value：当前字段或点位的实际取值；msg：当前收到的消息或提示文字；ts：数据产生时的毫秒时间戳
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 边缘在线状态（低频，仅连接/断开时）
  socket.on('edge_status', (msg: { status: 'online' | 'offline' }) => {
  // 注册指定消息事件的回调。
  // socket：Socket.IO 实时连接实例；on：注册指定事件的回调函数；msg：当前收到的消息或提示文字；status：当前连接、产线、请求或指令的状态字段
    liveSeen.edge = true;
    // 把右侧表达式的结果写入 liveSeen.edge。
    // liveSeen：本处保存 { robot: false, status: false, io: false, edge: false, event… 的结果；edge：liveSeen 对象上的字段或操作
    edgeOnline.value = msg.status === 'online';
    // 把右侧表达式的结果写入 edgeOnline.value。
    // edgeOnline：本处保存 ref<boolean | null>(null) 的结果；value：当前字段或点位的实际取值；msg：当前收到的消息或提示文字；status：当前连接、产线、请求或指令的状态字段
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  // 立即发起快照预载（不 await：并行执行，谁先到谁先渲染）
  void preload();
  // 加载产线快照，填充首次进入页面时的状态。
  // preload：加载产线快照，填充首次进入页面时的状态
  // 如果 socket 已经连上了（比如 preload 期间连上的），这里补一次订阅
  if (socket.connected) subscribe();
  // 检查(socket.connected) subscribe();，按判断结果进入对应的处理分支。
  // socket：Socket.IO 实时连接实例；connected：连接是否已建立的状态标记；subscribe：订阅消息主题、频道或事件流

  // ---------- 派生状态 ----------
  /**
   * 报警文案：优先用机器人自身的 alarmCode（最直接），
   * 没有的话找最近一条 alarm 事件的消息文本。
   */
  const alarmText = computed(() => {
  // 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 alarmText。
  // alarmText：本处保存 computed(() => { // 机器人报了警 → 显示 "机器人报警 #123" if (robot.value… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
    // 机器人报了警 → 显示 "机器人报警 #123"
    if (robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`;
    // 检查(robot.value?.alarmCode) return `机器人报警 #${robot.value.alarmCode}`;，按判断结果进入对应的处理分支。
    // robot：本处保存 ref<RobotState | null>(null) 的结果；value：当前字段或点位的实际取值；alarmCode：设备报警编号，0 表示无报警
    // 否则在事件列表里找第一条 alarm 类型的事件（events 是最新的在前）
    const latestAlarm = events.value.find((e) => e.type === 'alarm');
    // 查找首个满足条件的集合元素，将结果保存或写入 latestAlarm。
    // latestAlarm：本处保存 events.value.find((e) => e.type === 'alarm') 的结果；events：本处保存 ref<ProductionEvent[]>([]) 的结果；value：当前字段或点位的实际取值；find：查找首个满足条件的集合元素；e：当前方法接收的参数；type：当前报文、指令或对象的类别字段
    return latestAlarm?.message ?? null;
    // 把latestAlarm?.message ?? null作为当前函数的结果返回。
    // latestAlarm：本处保存 events.value.find((e) => e.type === 'alarm') 的结果；message：消息正文或用于展示的结果说明
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  /**
   * 边缘状态文案：null=未知，true=在线，false=离线。
   */
  const edgeText = computed(() => {
  // 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 edgeText。
  // edgeText：本处保存 computed(() => { if (edgeOnline.value === null) return '未知';… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
    if (edgeOnline.value === null) return '未知';
    // 检查(edgeOnline.value === null) return '未知';，按判断结果进入对应的处理分支。
    // edgeOnline：本处保存 ref<boolean | null>(null) 的结果；value：当前字段或点位的实际取值
    return edgeOnline.value ? '在线' : '离线';
    // 把edgeOnline.value ? '在线' : '离线'作为当前函数的结果返回。
    // edgeOnline：本处保存 ref<boolean | null>(null) 的结果；value：当前字段或点位的实际取值
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

  // 返回所有状态与方法，供组件解构使用
  return {
  // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
  // 下方各属性共同组成返回对象，调用方按字段名读取结果
    connected,
    // 把变量 connected 作为同名对象字段加入当前对象。
    // connected：连接是否已建立的状态标记
    edgeOnline,
    // 把变量 edgeOnline 作为同名对象字段加入当前对象。
    // edgeOnline 是上方取得或计算的同名局部值，在此作为返回对象的 edgeOnline 属性
    edgeText,
    // 把变量 edgeText 作为同名对象字段加入当前对象。
    // edgeText 是上方取得或计算的同名局部值，在此作为返回对象的 edgeText 属性
    robot,
    // 把变量 robot 作为同名对象字段加入当前对象。
    // robot 是上方取得或计算的同名局部值，在此作为返回对象的 robot 属性
    status,
    // 把变量 status 作为同名对象字段加入当前对象。
    // status：当前连接、产线、请求或指令的状态字段
    io,
    // 把变量 io 作为同名对象字段加入当前对象。
    // io：现场 IO 信号对象或当前 IO 状态帧
    events,
    // 把变量 events 作为同名对象字段加入当前对象。
    // events 是上方取得或计算的同名局部值，在此作为返回对象的 events 属性
    alarmText,
    // 把变量 alarmText 作为同名对象字段加入当前对象。
    // alarmText 是上方取得或计算的同名局部值，在此作为返回对象的 alarmText 属性
    lastEventAt,
    // 把变量 lastEventAt 作为同名对象字段加入当前对象。
    // lastEventAt 是上方取得或计算的同名局部值，在此作为返回对象的 lastEventAt 属性
  };
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了创建指定产线的共享实时数据、初始快照与消息订阅的实现；实际结果由运行时输入和执行分支决定。

/** 模块级单例变量：保存唯一的数据层实例 */

// shared 保存在模块作用域，多个组件调用 useLineData() 时取得同一个已有实例。
// App、TwinView 和 IO 页面因此共享状态与订阅，而不是每处各自保留一套现场数据。
// lineId 的默认值是 line-01；实例首次创建后后续调用复用它，不会因传入另一个编码自动切成多产线状态。

let shared: ReturnType<typeof createLineData> | null = null;
// 在模块作用域保存唯一的现场数据实例，多个组件调用时复用它。
// shared 为 null 时由 createLineData(lineId) 创建；默认产线为 line-01，后续传入其他编码不会自动创建独立的多产线实例。

// 这一段定义 useLineData，用于取得按产线编码复用的数据单例，供多个页面共享状态。
export function useLineData(lineId = 'line-01') {
// 定义函数 useLineData。
// useLineData：取得按产线编码复用的数据单例，供多个页面共享状态；lineId：产线标识，接口通常使用 line-01 等编码
  // 还没有实例 → 创建
  if (!shared) shared = createLineData(lineId);
  // 检查(!shared) shared = createLineData(lineId);，按判断结果进入对应的处理分支。
  // shared：本处保存 null 的结果，类型为 ReturnType<typeof createLineData> | null；createLineData：创建指定产线的共享实时数据、初始快照与消息订阅；lineId：产线标识，接口通常使用 line-01 等编码
  // 返回单例
  return shared;
  // 把shared作为当前函数的结果返回。
  // shared：本处保存 null 的结果，类型为 ReturnType<typeof createLineData> | null
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了按产线共享快照加载与实时消息订阅状态所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了取得按产线编码复用的数据单例，供多个页面共享状态的实现；实际结果由运行时输入和执行分支决定。
