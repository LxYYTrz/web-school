/**
 // 这一段负责后端 Socket.IO 网关，向对应产线房间广播实时数据，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：WebSocket 网关（socket.io）—— 把实时数据推给浏览器
 * 所属模块：server/src/realtime/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件回答"前后端是怎么打通的（实时部分）" ★
 * ============================================================================
 *
 * 【一、为什么要 WebSocket，而不是前端轮询？】
 *   轮询：前端每 100ms 发一次 GET /api/lines/.../snapshot
 *     → 浏览器发 10 个请求/秒 → 每个请求都要走"公网 → 云服务器 Nginx
 *       → SSH 隧道 → 工控机后端 → Redis 查询"这一整条链路 → 带宽和 CPU 双浪费。
 *   WebSocket：浏览器和后端建立**一条长连接**，数据一来服务端立即推送。
 *     → 1 条连接，10Hz 推送，浏览器零轮询。
 *
 * 【二、socket.io 的连接过程（也是 TCP 长连接）】
 *   1) 浏览器加载 socket.io-client 后，客户端先发一个 HTTP GET 到
 *      /socket.io/?EIO=4&transport=polling —— 这是"握手探测"，
 *      目的是确认服务端可达并协商协议版本。
 *   2) 服务端回 CONNACK，升级为 WebSocket（Upgrade 头）—— 之后就是纯 TCP 长连接。
 *   3) 客户端 emit('subscribe', { lineId }) 告诉服务端"我要看哪条产线"。
 *   4) 服务端把该 socket 加入房间（room）`line:{lineId}`。
 *   5) 之后每次有数据，调用 server.to('line:line-01').emit('robot_state', msg)，
 *      socket.io 只把消息投递给该房间里的 socket —— 这就是"按产线分房间"。
 *
 *   ★ 生产部署关键点：Nginx 必须代理 /socket.io/ 并带上 Upgrade 头，
 *     否则 WebSocket 升级失败，页面会退化成轮询或直接连不上。
 *     见 deploy/nginx/cloud.conf 的 /socket.io/ 段。
 *
 * 【三、"房间（room）"机制】
 *   socket.io 内置的房间概念：`socket.join('line:line-01')` 之后，
 *   `server.to('line:line-01').emit(...)` 只会发给这个房间的成员。
 *   好处：一条产线的数据不会串到另一条产线的页面上；
 *   而且后端不需要维护"哪个客户端订阅了什么"的映射表。
 *
 * 【四、消息事件名对照表（前后端必须一致）】
 *   服务端 emit 名        │ 前端监听名         │ 含义
 *   ─────────────────────┼───────────────────┼──────────────────────
 *   robot_state           │ robot_state        │ 机器人六轴帧（10Hz）
 *   line_status           │ line_status        │ 产线状态（1Hz）
 *   event                 │ event              │ 生产事件/报警
 *   edge_status           │ edge_status        │ 边缘采集器在线状态
 *   subscribe / unsubscribe│ subscribe          │ 客户端 → 服务端的控制指令
 */
import {
// 开始列出本文件从其他模块导入的类型或运行时对象。
// 大括号内逐项列出从后续模块路径导入的类型或运行时对象
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // ConnectedSocket：NestJS 注入当前 Socket.IO 连接的装饰器；MessageBody：NestJS 提取 Socket.IO 消息正文的装饰器；SubscribeMessage：NestJS 声明 Socket.IO 消息处理方法的装饰器；WebSocketGateway：NestJS 声明 Socket.IO 网关及连接配置的装饰器；WebSocketServer：NestJS 注入 Socket.IO 服务端实例的装饰器
} from '@nestjs/websockets';
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 本行完成上面一层已说明的函数、分支或对象配置
import { Server, Socket } from 'socket.io';
// 从 socket.io 导入这一行列出的符号，供本文件调用。
// Server：从 socket.io 导入的对象，用于本文件的服务端 Socket.IO 实时消息 API；Socket：从 socket.io 导入的对象，用于本文件的服务端 Socket.IO 实时消息 API
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值

// WebSocket 推送(socket.io)。前端先 emit('subscribe', {lineId}) 加入对应产线房间。
// TODO:接入会话鉴权和产线范围校验,防止未授权订阅其他产线。
// 这一段声明 TelemetryGateway，用于后端 Socket.IO 网关，向对应产线房间广播实时数据。
@WebSocketGateway({ cors: { origin: config.http.corsOrigin } })
// 装饰器 WebSocketGateway：声明 WebSocket 网关。
// WebSocketGateway：NestJS 声明 Socket.IO 网关及连接配置的装饰器；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；http：发送携带登录 Cookie 的 JSON 请求并统一处理 HTTP 错误；corsOrigin：config.http 对象上的字段或操作
export class TelemetryGateway {
// 定义 TelemetryGateway，约束或实现本模块涉及的数据和行为。
// TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据
  // @WebSocketServer()：由 Nest 注入 socket.io 的 Server 实例（就是那个 http server）
  @WebSocketServer() server: Server;
  // 装饰器 WebSocketServer：给后面的类、方法或参数附加元数据。
  // WebSocketServer：NestJS 注入 Socket.IO 服务端实例的装饰器；server：本处声明的字段或类型，类型为 Server；Server：从 socket.io 导入的对象，用于本文件的服务端 Socket.IO 实时消息 API

  /**
   * 客户端订阅某条产线。
   * 前端 emit('subscribe', { lineId: 'line-01' })
   */
  // 这一段定义 handleSubscribe，用于校验订阅请求并把客户端加入目标产线的消息房间。

  // 浏览器在 Socket.IO 连接上发项目自定义 subscribe 事件，声明要接收哪条产线的数据。
  // 后端将该连接加入 line:产线编码 房间，broadcastRobot 等方法随后只向对应房间发送事件。
  // 这个房间订阅与后端连接 Broker 后的 MQTT 主题订阅发生在不同程序、不同连接中。

  @SubscribeMessage('subscribe')
  // 装饰器 SubscribeMessage：订阅指定 WebSocket 消息。
  // SubscribeMessage：NestJS 声明 Socket.IO 消息处理方法的装饰器
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
  // 定义方法 handleSubscribe；括号中声明参数，花括号内实现逻辑。
  // handleSubscribe：校验订阅请求并把客户端加入目标产线的消息房间；ConnectedSocket：NestJS 注入当前 Socket.IO 连接的装饰器；client：当前方法接收的参数，类型为 Socket；Socket：从 socket.io 导入的对象，用于本文件的服务端 Socket.IO 实时消息 API；MessageBody：NestJS 提取 Socket.IO 消息正文的装饰器；body：当前 HTTP 请求或消息的正文；lineId：产线标识，接口通常使用 line-01 等编码
    // 参数校验：没有 lineId 直接拒绝（返回对象会作为 ack 回给客户端）
    if (!body?.lineId) return { ok: false, error: 'lineId required' };
    // 检查(!body?.lineId) return { ok: false, error: 'lineId required' };，按判断结果进入对应的处理分支。
    // body：当前 HTTP 请求或消息的正文；lineId：产线标识，接口通常使用 line-01 等编码；ok：操作是否成功的布尔结果；error：失败原因或错误对象
    // 把这个 socket 加入产线房间。之后该产线的所有广播都会推给它。
    // void 前缀：join 返回 Promise（Redis 适配器场景下是异步的），这里不关心结果
    void client.join(`line:${body.lineId}`);
    // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
    // client：当前方法接收的参数，类型为 Socket；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；body：当前 HTTP 请求或消息的正文；lineId：产线标识，接口通常使用 line-01 等编码
    // 返回确认信息（socket.io 的 emit 带回调函数时会收到这个对象）
    return { ok: true, lineId: body.lineId };
    // 把{ ok: true, lineId: body.lineId }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果；lineId：产线标识，接口通常使用 line-01 等编码；body：当前 HTTP 请求或消息的正文
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了校验订阅请求并把客户端加入目标产线的消息房间的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 客户端取消订阅（切换产线时用）。
   */
  // 这一段定义 handleUnsubscribe，用于让客户端退出目标产线的消息房间。
  @SubscribeMessage('unsubscribe')
  // 装饰器 SubscribeMessage：订阅指定 WebSocket 消息。
  // SubscribeMessage：NestJS 声明 Socket.IO 消息处理方法的装饰器
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
  // 定义方法 handleUnsubscribe；括号中声明参数，花括号内实现逻辑。
  // handleUnsubscribe：让客户端退出目标产线的消息房间；ConnectedSocket：NestJS 注入当前 Socket.IO 连接的装饰器；client：当前方法接收的参数，类型为 Socket；Socket：从 socket.io 导入的对象，用于本文件的服务端 Socket.IO 实时消息 API；MessageBody：NestJS 提取 Socket.IO 消息正文的装饰器；body：当前 HTTP 请求或消息的正文；lineId：产线标识，接口通常使用 line-01 等编码
    if (body?.lineId) void client.leave(`line:${body.lineId}`);
    // 检查(body?.lineId) void client.leave(`line:${body.lineId}`);，按判断结果进入对应的处理分支。
    // body：当前 HTTP 请求或消息的正文；lineId：产线标识，接口通常使用 line-01 等编码；client：当前方法接收的参数，类型为 Socket；leave：让 Socket.IO 客户端离开指定产线房间
    return { ok: true };
    // 把{ ok: true }作为当前函数的结果返回。
    // ok：操作是否成功的布尔结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了让客户端退出目标产线的消息房间的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 broadcastRobot，用于向产线房间广播机器人最新遥测。
  broadcastRobot(lineId: string, msg: unknown) {
  // 定义方法 broadcastRobot；括号中声明参数，花括号内实现逻辑。
  // broadcastRobot：向产线房间广播机器人最新遥测；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
    this.server?.to(`line:${lineId}`).emit('robot_state', msg);
    // 选择要广播消息的 Socket.IO 房间。
    // server：本处声明的字段或类型，类型为 Server；to：选择要广播消息的 Socket.IO 房间；lineId：产线标识，接口通常使用 line-01 等编码；emit：向 Socket.IO 连接或房间发送事件；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向产线房间广播机器人最新遥测的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 broadcastLineStatus，用于向产线房间广播最新生产状态。
  broadcastLineStatus(lineId: string, msg: unknown) {
  // 定义方法 broadcastLineStatus；括号中声明参数，花括号内实现逻辑。
  // broadcastLineStatus：向产线房间广播最新生产状态；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
    this.server?.to(`line:${lineId}`).emit('line_status', msg);
    // 选择要广播消息的 Socket.IO 房间。
    // server：本处声明的字段或类型，类型为 Server；to：选择要广播消息的 Socket.IO 房间；lineId：产线标识，接口通常使用 line-01 等编码；emit：向 Socket.IO 连接或房间发送事件；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向产线房间广播最新生产状态的实现；实际结果由运行时输入和执行分支决定。

  // 产线 IO(DB3 word 11~16,契约 §3.8)
  // 这一段定义 broadcastIo，用于向产线房间广播 IO 信号帧。
  broadcastIo(lineId: string, msg: unknown) {
  // 定义方法 broadcastIo；括号中声明参数，花括号内实现逻辑。
  // broadcastIo：向产线房间广播 IO 信号帧；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
    this.server?.to(`line:${lineId}`).emit('io_state', msg);
    // 选择要广播消息的 Socket.IO 房间。
    // server：本处声明的字段或类型，类型为 Server；to：选择要广播消息的 Socket.IO 房间；lineId：产线标识，接口通常使用 line-01 等编码；emit：向 Socket.IO 连接或房间发送事件；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向产线房间广播 IO 信号帧的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 广播生产事件 / 报警。
   */
  // 这一段定义 broadcastEvent，用于向产线房间广播生产事件。
  broadcastEvent(lineId: string, msg: unknown) {
  // 定义方法 broadcastEvent；括号中声明参数，花括号内实现逻辑。
  // broadcastEvent：向产线房间广播生产事件；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
    this.server?.to(`line:${lineId}`).emit('event', msg);
    // 选择要广播消息的 Socket.IO 房间。
    // server：本处声明的字段或类型，类型为 Server；to：选择要广播消息的 Socket.IO 房间；lineId：产线标识，接口通常使用 line-01 等编码；emit：向 Socket.IO 连接或房间发送事件；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向产线房间广播生产事件的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 broadcastEdge，用于向产线房间广播边缘采集器在线状态。
  broadcastEdge(lineId: string, msg: unknown) {
  // 定义方法 broadcastEdge；括号中声明参数，花括号内实现逻辑。
  // broadcastEdge：向产线房间广播边缘采集器在线状态；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
    this.server?.to(`line:${lineId}`).emit('edge_status', msg);
    // 选择要广播消息的 Socket.IO 房间。
    // server：本处声明的字段或类型，类型为 Server；to：选择要广播消息的 Socket.IO 房间；lineId：产线标识，接口通常使用 line-01 等编码；emit：向 Socket.IO 连接或房间发送事件；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向产线房间广播边缘采集器在线状态的实现；实际结果由运行时输入和执行分支决定。

  // 控制指令回执推前端(cmd_ack → command_ack)
  // 这一段定义 broadcastCommandAck，用于向产线房间广播控制指令回执。

  // 把带 cmdId 的命令结果发送给订阅该产线的网页，Socket.IO 事件名为 command_ack。
  // MQTT 上采集器发布的主题名称是 cmd_ack；这里完成到网页事件通道的转交，页面再按编号匹配当前请求。
  // 此推送不代表数据库更新与消息通知已经组成保证同时成功的事务。

  broadcastCommandAck(lineId: string, msg: unknown) {
  // 将这条命令回执推送给正在订阅对应产线的网页。
  // lineId 决定 line:产线 房间；msg 带 cmdId 等结果字段；事件名 command_ack 与采集器的 MQTT cmd_ack 主题名称不同。
    this.server?.to(`line:${lineId}`).emit('command_ack', msg);
    // 选择要广播消息的 Socket.IO 房间。
    // server：本处声明的字段或类型，类型为 Server；to：选择要广播消息的 Socket.IO 房间；lineId：产线标识，接口通常使用 line-01 等编码；emit：向 Socket.IO 连接或房间发送事件；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向产线房间广播控制指令回执的实现；实际结果由运行时输入和执行分支决定。

  // AI 建议推前端(propose_action MCP 工具 → 抽屉里的建议卡片)。
  // 推给整条产线房间而非个人:房间成员都能看到这条建议,
  // 谁点确认由各自的权限决定 —— 建议本身不构成授权。
  // 这一段定义 broadcastAiProposal，用于向产线房间广播 AI 待确认建议。
  broadcastAiProposal(lineId: string, msg: unknown) {
  // 定义方法 broadcastAiProposal；括号中声明参数，花括号内实现逻辑。
  // broadcastAiProposal：向产线房间广播 AI 待确认建议；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
    this.server?.to(`line:${lineId}`).emit('ai_proposal', msg);
    // 选择要广播消息的 Socket.IO 房间。
    // server：本处声明的字段或类型，类型为 Server；to：选择要广播消息的 Socket.IO 房间；lineId：产线标识，接口通常使用 line-01 等编码；emit：向 Socket.IO 连接或房间发送事件；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向产线房间广播 AI 待确认建议的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端 Socket.IO 网关，向对应产线房间广播实时数据所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 TelemetryGateway 的字段或服务能力，供项目其他模块使用。
