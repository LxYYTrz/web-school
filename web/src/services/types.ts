// 与数据契约 docs/contract/README.md 对齐的前端类型(字段一致,只增不改)
// 机器人六轴遥测（契约 3.1）
// 这一段负责配置和实现 web/src/services/types.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
// 这一段声明 RobotState，用于项目数据契约中的机器人遥测结构，包含六轴角度、模式和报警码。
export interface RobotState {
// 定义 RobotState，约束或实现本模块涉及的数据和行为。
// RobotState：项目数据契约中的机器人遥测结构，包含六轴角度、模式和报警码
  ts: number;
  // 声明或设置 ts，用于数据产生时的毫秒时间戳。
  // ts：数据产生时的毫秒时间戳
  deviceId: string;
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  joints: [number, number, number, number, number, number];
  // 声明或设置 joints，用于按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度。
  // joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度
  tcp: number[] | null;
  // 声明或设置 tcp，用于机器人末端位姿数据，无数据时为 null。
  // tcp：机器人末端位姿数据，无数据时为 null
  speedPct: number;
  // 声明或设置 speedPct，用于机器人速度百分比。
  // speedPct：机器人速度百分比
  mode: 'manual' | 'auto' | 'remote' | 'error' | string;
  // 声明或设置 mode，用于机器人或设备运行模式。
  // mode：机器人或设备运行模式
  program: string;
  // 声明或设置 program，用于机器人当前程序名称。
  // program：机器人当前程序名称
  alarmCode: number;
  // 声明或设置 alarmCode，用于设备报警编号，0 表示无报警。
  // alarmCode：设备报警编号，0 表示无报警
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 RobotState 的字段或服务能力，供项目其他模块使用。

// 产线状态快照（契约 3.2）
// 这一段声明 LineStatus，用于项目数据契约中的产线状态结构，包含工序、计数和节拍。
export interface LineStatus {
// 定义 LineStatus，约束或实现本模块涉及的数据和行为。
// LineStatus：项目数据契约中的产线状态结构，包含工序、计数和节拍
  ts: number;
  // 声明或设置 ts，用于数据产生时的毫秒时间戳。
  // ts：数据产生时的毫秒时间戳
  lineId: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  // 契约 v1.1:4 态(兼容 mock/旧数据)+ 10 态(PLC 工序状态)
  // PLC 整数对照见 edge/plc_collector.py STATE_MAP 与 db/init/004_line_state_stages.sql
  state:
  // 声明或设置 state，用于当前状态值或实时状态服务实例，以所在对象为准。
  // state：当前状态值或实时状态服务实例，以所在对象为准
    | 'running' | 'idle' | 'alarm' | 'offline'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    // 这一行允许的取值分别是 running、idle、alarm、offline，由上方字段或类型联合声明使用
    | 'waiting_feed' | 'feeding' | 'assembling' | 'waiting_robot'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    // 这一行允许的取值分别是 waiting_feed、feeding、assembling、waiting_robot，由上方字段或类型联合声明使用
    | 'unload_done' | 'waiting_next'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    // 这一行允许的取值分别是 unload_done、waiting_next，由上方字段或类型联合声明使用
    | 'init_error' | 'stopped' | 'manual_mode'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    // 这一行允许的取值分别是 init_error、stopped、manual_mode，由上方字段或类型联合声明使用
    // 旧口径:2026-10-23 之前状态 3 叫 unloading(下料中),历史数据里还有
    | 'unloading'
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    // 这一行允许的取值分别是 unloading，由上方字段或类型联合声明使用
    | string;
    // 给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。
    // string 表示除列出的固定值外，仍接受其他文本状态值以兼容扩展数据
  productCode: string;
  // 声明或设置 productCode，用于当前产品编码。
  // productCode：当前产品编码
  goodCount: number;
  // 声明或设置 goodCount，用于合格品累计数量。
  // goodCount：合格品累计数量
  ngCount: number;
  // 声明或设置 ngCount，用于不合格品累计数量。
  // ngCount：不合格品累计数量
  beatMs: number;
  // 声明或设置 beatMs，用于生产节拍，单位毫秒。
  // beatMs：生产节拍，单位毫秒
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 LineStatus 的字段或服务能力，供项目其他模块使用。

// 生产事件 / 报警（契约 3.3）
// 这一段声明 ProductionEvent，用于项目数据契约中的生产事件结构，包含类型、等级和事件内容。
export interface ProductionEvent {
// 定义 ProductionEvent，约束或实现本模块涉及的数据和行为。
// ProductionEvent：项目数据契约中的生产事件结构，包含类型、等级和事件内容
  ts: number;
  // 声明或设置 ts，用于数据产生时的毫秒时间戳。
  // ts：数据产生时的毫秒时间戳
  lineId: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  deviceId: string;
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  type: 'start' | 'stop' | 'alarm' | 'piece_done' | 'changeover' | 'custom' | string;
  // 声明或设置 type，用于当前报文、指令或对象的类别字段。
  // type：当前报文、指令或对象的类别字段
  level: 'info' | 'warning' | 'critical';
  // 声明或设置 level，用于用户操作级别或事件严重级别，依据当前接口结构区分。
  // level：用户操作级别或事件严重级别，依据当前接口结构区分
  code?: string | null;
  // 声明或设置 code，用于业务编码、状态码或数据库查询字段，结合所在报文解释。
  // code：业务编码、状态码或数据库查询字段，结合所在报文解释
  message?: string | null;
  // 声明或设置 message，用于消息正文或用于展示的结果说明。
  // message：消息正文或用于展示的结果说明
  payload?: Record<string, unknown>;
  // 声明或设置 payload，用于消息或事件携带的数据内容。
  // payload：消息或事件携带的数据内容；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 ProductionEvent 的字段或服务能力，供项目其他模块使用。

// 产线 IO 信号(契约 v1.3 §3.8,对应 DB3 MB_SERVER HOLD 区 word 11~16)
// 只读。单个点位读失败时为 null —— "没读到"和"确实是 0"必须区分开,
// 前端把 null 显示成 "—" 而不是 0。
export type IoValue = number | null;
// 定义 IoValue，约束或实现本模块涉及的数据和行为。
// IoValue：项目定义的 IO 值类型，数字表示读数，null 表示未读到

// 这一段声明 IoSignals，用于项目数据契约中的六个现场 IO 信号字段。
export interface IoSignals {
// 定义 IoSignals，约束或实现本模块涉及的数据和行为。
// IoSignals：项目数据契约中的六个现场 IO 信号字段
  sensorIn: IoValue;      // word 11 入料传感器  1=有料 0=无料
  // 声明或设置 sensorIn，用于word 11 的入料传感器读数。
  // sensorIn：word 11 的入料传感器读数；IoValue：项目定义的 IO 值类型，数字表示读数，null 表示未读到
  sensorArrive: IoValue;  // word 12 到料传感器  1=有料 0=无料
  // 声明或设置 sensorArrive，用于word 12 的到料传感器读数。
  // sensorArrive：word 12 的到料传感器读数；IoValue：项目定义的 IO 值类型，数字表示读数，null 表示未读到
  sensorRetreat: IoValue; // word 13 退料传感器  1=有料 0=无料
  // 声明或设置 sensorRetreat，用于word 13 的退料传感器读数。
  // sensorRetreat：word 13 的退料传感器读数；IoValue：项目定义的 IO 值类型，数字表示读数，null 表示未读到
  lightColor: IoValue;    // word 14 产线灯光颜色 0=绿灯 1=黄灯 2=红灯
  // 声明或设置 lightColor，用于word 14 的灯色读数：0 绿、1 黄、2 红。
  // lightColor：word 14 的灯色读数：0 绿、1 黄、2 红；IoValue：项目定义的 IO 值类型，数字表示读数，null 表示未读到
  trayUp: IoValue;        // word 15 托料盘上升  1=上升 0=下降
  // 声明或设置 trayUp，用于word 15 的托料盘升降读数。
  // trayUp：word 15 的托料盘升降读数；IoValue：项目定义的 IO 值类型，数字表示读数，null 表示未读到
  blockUp: IoValue;       // word 16 阻挡干上升  1=上升 0=下降
  // 声明或设置 blockUp，用于word 16 的阻挡杆升降读数。
  // blockUp：word 16 的阻挡杆升降读数；IoValue：项目定义的 IO 值类型，数字表示读数，null 表示未读到
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 IoSignals 的字段或服务能力，供项目其他模块使用。

// 这一段声明 IoState，用于项目数据契约中的 IO 状态帧结构，包含时间、产线和只读信号。
export interface IoState {
// 定义 IoState，约束或实现本模块涉及的数据和行为。
// IoState：项目数据契约中的 IO 状态帧结构，包含时间、产线和只读信号
  ts: number;
  // 声明或设置 ts，用于数据产生时的毫秒时间戳。
  // ts：数据产生时的毫秒时间戳
  lineId: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  io: IoSignals;
  // 声明或设置 io，用于现场 IO 信号对象或当前 IO 状态帧。
  // io：现场 IO 信号对象或当前 IO 状态帧；IoSignals：项目数据契约中的六个现场 IO 信号字段
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 IoState 的字段或服务能力，供项目其他模块使用。

// 快照 REST 接口的返回(见 server/src/state/line-state.service.ts)
// 这一段声明 LineSnapshot，用于项目定义的产线快照结构，汇总状态、边缘在线信息、IO 与机器人帧。
export interface LineSnapshot {
// 定义 LineSnapshot，约束或实现本模块涉及的数据和行为。
// LineSnapshot：项目定义的产线快照结构，汇总状态、边缘在线信息、IO 与机器人帧
  lineId: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  ts: number;
  // 声明或设置 ts，用于数据产生时的毫秒时间戳。
  // ts：数据产生时的毫秒时间戳
  status: LineStatus | null;
  // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
  // status：当前连接、产线、请求或指令的状态字段；LineStatus：项目数据契约中的产线状态结构，包含工序、计数和节拍
  edge: { status: 'online' | 'offline' } | null;
  // 声明或设置 edge，用于当前对象或接口的对应数据。
  // edge：本处声明的字段或类型，类型为 { status: 'online' | 'offline' } | null；status：当前连接、产线、请求或指令的状态字段
  io: IoState | null;
  // 声明或设置 io，用于现场 IO 信号对象或当前 IO 状态帧。
  // io：现场 IO 信号对象或当前 IO 状态帧；IoState：项目数据契约中的 IO 状态帧结构，包含时间、产线和只读信号
  robots: Record<string, RobotState>;
  // 声明或设置 robots，用于按设备编码索引的机器人最新遥测集合。
  // robots：按设备编码索引的机器人最新遥测集合；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容；RobotState：项目数据契约中的机器人遥测结构，包含六轴角度、模式和报警码
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 LineSnapshot 的字段或服务能力，供项目其他模块使用。

// 控制指令回执(契约 §3.7);前端订阅 socket 'command_ack' 收到
// 这一段声明 CommandAck，用于项目数据契约中的指令回执结构，通过 cmdId 关联下发指令。
export interface CommandAck {
// 定义 CommandAck，约束或实现本模块涉及的数据和行为。
// CommandAck：项目数据契约中的指令回执结构，通过 cmdId 关联下发指令
  cmdId: string;
  // 声明或设置 cmdId，用于控制指令唯一编号，用于关联下发与回执。
  // cmdId：控制指令唯一编号，用于关联下发与回执
  ts: number;
  // 声明或设置 ts，用于数据产生时的毫秒时间戳。
  // ts：数据产生时的毫秒时间戳
  status: 'acked' | 'rejected' | 'failed' | 'timeout';
  // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
  // status：当前连接、产线、请求或指令的状态字段
  message?: string | null;
  // 声明或设置 message，用于消息正文或用于展示的结果说明。
  // message：消息正文或用于展示的结果说明
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 CommandAck 的字段或服务能力，供项目其他模块使用。

// ---------------------------------------------------------------------------
// AI 助手(hermes agent)
// ---------------------------------------------------------------------------

/**
 * AI 提交的控制建议。**它不是一条指令** —— 只是候选。
 * 必须由用户点确认后才会走 POST /api/ai/proposals/:id/confirm → CommandService.issue()。
 * 前端订阅 socket 'ai_proposal' 收到(见 server/src/ai/proposal.service.ts)。
 */
// 这一段声明 AiProposal，用于项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令。
export interface AiProposal {
// 定义 AiProposal，约束或实现本模块涉及的数据和行为。
// AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
  id: string;
  // 声明或设置 id，用于当前记录或对象的标识。
  // id：当前记录或对象的标识
  lineId: string;
  // 声明或设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
  // lineId：产线标识，接口通常使用 line-01 等编码
  deviceId: string;
  // 声明或设置 deviceId，用于设备标识，接口使用配置中的设备编码。
  // deviceId：设备标识，接口使用配置中的设备编码
  type: string;
  // 声明或设置 type，用于当前报文、指令或对象的类别字段。
  // type：当前报文、指令或对象的类别字段
  params: Record<string, unknown>;
  // 声明或设置 params，用于指令附加参数对象。
  // params：指令附加参数对象；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
  reason: string;
  // 声明或设置 reason，用于AI 给出控制建议的理由。
  // reason：AI 给出控制建议的理由
  status: 'pending';
  // 声明或设置 status，用于当前连接、产线、请求或指令的状态字段。
  // status：当前连接、产线、请求或指令的状态字段
  createdAt: number;
  // 声明或设置 createdAt，用于记录创建时的时间值。
  // createdAt：记录创建时的时间值
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 AiProposal 的字段或服务能力，供项目其他模块使用。

/** SSE 事件(后端 ai.service.ts 归一化后的形状,与 OpenAI chunk 无关) */
// 这一段声明 AiStreamEvent，用于项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束。
export interface AiStreamEvent {
// 定义 AiStreamEvent，约束或实现本模块涉及的数据和行为。
// AiStreamEvent：项目定义的 AI 流式事件结构，区分文字增量、工具、错误和结束
  type: 'delta' | 'tool' | 'error' | 'done';
  // 声明或设置 type，用于当前报文、指令或对象的类别字段。
  // type：当前报文、指令或对象的类别字段
  text?: string;
  // 声明或设置 text，用于聊天正文、文本片段或界面展示文字。
  // text：聊天正文、文本片段或界面展示文字
  name?: string;
  // 声明或设置 name，用于当前对象的名称字段。
  // name：当前对象的名称字段
  message?: string;
  // 声明或设置 message，用于消息正文或用于展示的结果说明。
  // message：消息正文或用于展示的结果说明
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 AiStreamEvent 的字段或服务能力，供项目其他模块使用。

/** 抽屉里的一条消息。工具痕迹不单独存气泡,折成 hint 挂在消息上 */
// 这一段声明 AiMessage，用于前端聊天消息结构，记录角色、正文、工具提示和建议卡片。
export interface AiMessage {
// 定义 AiMessage，约束或实现本模块涉及的数据和行为。
// AiMessage：前端聊天消息结构，记录角色、正文、工具提示和建议卡片
  role: 'user' | 'assistant';
  // 声明或设置 role，用于当前对象或接口的对应数据。
  // role：本处声明的字段或类型，类型为 'user' | 'assistant'
  text: string;
  // 声明或设置 text，用于聊天正文、文本片段或界面展示文字。
  // text：聊天正文、文本片段或界面展示文字
  /** 本轮里 agent 用过的工具,用于展示「查了什么」 */
  tools?: string[];
  // 声明或设置 tools，用于当前回答涉及的工具名称列表。
  // tools：当前回答涉及的工具名称列表
  error?: string;
  // 声明或设置 error，用于失败原因或错误对象。
  // error：失败原因或错误对象
  proposal?: AiProposal;
  // 声明或设置 proposal，用于当前对象或接口的对应数据。
  // proposal：本处声明的字段或类型，类型为 AiProposal；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 web/src/services/types.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 AiMessage 的字段或服务能力，供项目其他模块使用。
