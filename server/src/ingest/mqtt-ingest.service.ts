/**
 // 这一段负责后端 MQTT 接入服务，订阅上行消息并发布控制指令，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：MQTT 消费入口（上行数据流的"总阀门"）
 * 所属模块：server/src/ingest/
 * ============================================================================
 *
 * ============================================================================
 * ★★★ 本文件是理解整个系统数据流的最佳起点 ★★★
 * ============================================================================
 *
 * 【一、它在宏观架构中的位置】
 *
 *   ┌──────────┐  PLC/机器人
 *      │  (Modbus/OPC UA/S7 —— 现场协议，由采集器适配)
 *      ▼
 *   ┌──────────────┐   MQTT publish      ┌──────────────┐
 *   │ edge 采集器  │ ───────────────────▶ │ MQTT Broker  │ (工控机本机)
 *   │ (Python)     │   tl/v1/...         └──────┬───────┘
 *   └──────────────┘                              │ subscribe
 *                                                 ▼
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  ★ 本文件 MqttIngestService ★                              │
 *   │  ① 订阅 5 类主题                                            │
 *   │  ② 解析主题 → 取出 lineId / deviceId / kind                │
 *   │  ③ 解析 JSON 报文                                          │
 *   │  ④ 按 kind 分发 → 三路并行落地                              │
 *   └───────────┬──────────────────┬───────────────────┬─────────┘
 *               ▼                  ▼                   ▼
 *      ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
 *      │ state/  Redis  │ │ history/  PG   │ │ realtime/ WS   │
 *      │ 实时快照       │ │ TimescaleDB    │ │ socket.io 推送 │
 *      └────────┬───────┘ └────────────────┘ └────────┬───────┘
 *               │                                      │
 *               └──────────────┬───────────────────────┘
 *                              ▼
 *                    浏览器（前端 web/）
 *
 * 【二、MQTT 协议在这里到底发生了什么】（回答"TCP 是怎么通信的"）
 *
 *   MQTT 跑在 TCP 之上。连接建立过程：
 *     1) TCP 三次握手：采集器 ←→ Broker 建立字节流连接
 *     2) MQTT CONNECT 报文：携带 clientId / username / password / keepalive
 *     3) Broker 回 CONNACK：连接成功
 *     4) MQTT SUBSCRIBE 报文：本进程订阅 5 类主题，Broker 回 SUBACK
 *     5) 之后 Broker 主动向本进程 PUBLISH 报文（推送模型，不是轮询！）
 *
 *   关键点：
 *     - 本进程是「订阅者」，采集器是「发布者」。谁先连谁后连都行，
 *       Broker 会在订阅者连上后立刻推送匹配主题的 retained 消息。
 *     - keepalive=30：客户端每 30 秒发一次 PINGREQ，若 1.5 倍时间没收到
 *       PINGRESP，Broker 判定连接已死并触发 LWT（遗嘱消息）。
 *     - reconnectPeriod=2000：连接断开后每 2 秒重连一次（网络恢复自动接上，
 *       不需要人工干预）。
 *     - QoS 1 = "至少送达一次"：报文在网络中断时会重发，所以**下游必须做幂等**
 *       （本项目用 code→id 映射 + UPSERT + cmdId 状态机来保证幂等）。
 *
 * 【三、主题结构与解析】
 *   契约（docs/contract/README.md）规定主题形如：
 *       tl/v1/{lineId}/telemetry/robot/{deviceId}
 *       tl/v1/{lineId}/telemetry/status
 *       tl/v1/{lineId}/event
 *       tl/v1/{lineId}/edge/status
 *       tl/v1/{lineId}/cmd_ack
 *   拆解示例：'tl/v1/line-01/telemetry/robot/robot-01'
 *       seg[0]='tl'  seg[1]='v1'  seg[2]='line-01'  seg[3]='telemetry'
 *       seg[4]='robot'  seg[5]='robot-01'
 *       → lineId = seg[2]，kind = seg.slice(3).join('/') = 'telemetry/robot/robot-01'
 *
 * 【四、为什么是"三路分发"】
 *   同一份 MQTT 报文，三种消费方有三种不同的需求：
 *     - 实时快照（Redis）：要最新一份，旧的没意义 → 覆盖写 + TTL
 *     - 历史数据（PG）：要全量，一条都不能丢 → 追加写
 *     - 实时推送（WS）：要立刻推给在线浏览器 → 广播
 *   所以一条报文进来要同时走三条路。这也是本文件代码量看起来"重复"的原因 ——
 *   不是重复，而是三条路的语义确实不同。
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Injectable：NestJS 把类注册为可注入服务的装饰器；Logger：NestJS 按模块名称记录日志的工具类；OnModuleDestroy：NestJS 模块销毁清理回调接口；OnModuleInit：NestJS 模块初始化回调接口
import { connect, MqttClient } from 'mqtt';
// 从 mqtt 导入这一行列出的符号，供本文件调用。
// connect：从 mqtt 导入的对象，用于本文件的MQTT 消息客户端；MqttClient：从 mqtt 导入的对象，用于本文件的MQTT 消息客户端
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值
import { LineStateService } from '../state/line-state.service';
// 从 ../state/line-state.service 导入这一行列出的符号，供本文件调用。
// LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis
import { HistoryWriterService } from '../history/history-writer.service';
// 从 ../history/history-writer.service 导入这一行列出的符号，供本文件调用。
// HistoryWriterService：后端历史写入服务，将遥测、状态、事件和回执保存到数据库
import { TelemetryGateway } from '../realtime/telemetry.gateway';
// 从 ../realtime/telemetry.gateway 导入这一行列出的符号，供本文件调用。
// TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据

// MQTT 消费入口:订阅契约主题 → 解析 → 三路分发
// (Redis 实时快照 / TimescaleDB 历史 / WebSocket 推送)
/**
 * MQTT 消费入口服务。
 */
// 这一段声明 MqttIngestService，用于后端 MQTT 接入服务，订阅上行消息并发布控制指令。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class MqttIngestService implements OnModuleInit, OnModuleDestroy {
// 定义 MqttIngestService，约束或实现本模块涉及的数据和行为。
// MqttIngestService：后端 MQTT 接入服务，订阅上行消息并发布控制指令；OnModuleInit：NestJS 模块初始化回调接口；OnModuleDestroy：NestJS 模块销毁清理回调接口
  private readonly logger = new Logger(MqttIngestService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；MqttIngestService：后端 MQTT 接入服务，订阅上行消息并发布控制指令；name：当前对象的名称字段
  // MQTT 客户端实例。onModuleInit 里创建
  private client: MqttClient;
  // 声明类属性或构造参数 client，类型为 MqttClient。
  // client：本处声明的字段或类型，类型为 MqttClient；MqttClient：从 mqtt 导入的对象，用于本文件的MQTT 消息客户端

  /**
   * 构造函数：注入三个下游消费者。
   * 注意依赖方向：本服务依赖下游（state/history/realtime），
   * 而下游**不依赖**本服务 —— 所以不存在循环依赖，模块依赖图是单向的。
   */
  // 这一段定义 constructor，用于初始化 mqtt-ingest.service 使用的实例状态和依赖。
  constructor(
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // constructor 是类实例创建时执行的初始化方法；括号内声明构造参数
    private readonly state: LineStateService,
    // 声明类属性或构造参数 state，类型为 LineStateService。
    // state：当前状态值或实时状态服务实例，以所在对象为准；LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis
    private readonly history: HistoryWriterService,
    // 声明类属性或构造参数 history，类型为 HistoryWriterService。
    // history：历史写入服务实例；HistoryWriterService：后端历史写入服务，将遥测、状态、事件和回执保存到数据库
    private readonly gateway: TelemetryGateway,
    // 声明类属性或构造参数 gateway，类型为 TelemetryGateway。
    // gateway：当前方法接收的参数，类型为 TelemetryGateway；TelemetryGateway：后端 Socket.IO 网关，向对应产线房间广播实时数据
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
  // 构造函数只保存参数属性或注入依赖，没有额外的初始化语句
  // 这一段提供了初始化 mqtt-ingest.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onModuleInit，用于在模块启动时初始化 mqtt-ingest.service 所需的连接、订阅或周期任务。
  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
  // onModuleInit：在模块启动时初始化 mqtt-ingest.service 所需的连接、订阅或周期任务
    // ① 取主题前缀（默认 tl/v1）
    const p = config.topicPrefix;
    // 根据 config.topicPrefix 设置 p，供当前流程后续使用。
    // p：本处保存 config.topicPrefix 的结果；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；topicPrefix：config 对象上的字段或操作
    // ② 建立连接。connect() 是同步返回客户端对象的，不会阻塞；
    //    真正的连接建立是异步的，靠下面的事件回调感知

    // NestJS 在这里作为 MQTT 客户端主动连接 Broker，和采集器连接 Broker 是两条不同连接。
    // 连接目标、客户端编号与认证信息来自统一配置。连接成功回调会登记订阅，Broker 才能沿这条连接交付匹配主题。
    // 这里建立的是消息接入通道，不是采集器向后端发 HTTP 请求；网络重连与后续报文业务检查分别处理。

    this.client = connect(config.mqtt.url, {
    // 把右侧表达式的结果写入 this.client。
    // client：本处声明的字段或类型，类型为 MqttClient；connect：从 mqtt 导入的对象，用于本文件的MQTT 消息客户端；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令；url：当前服务的连接地址
      clientId: config.mqtt.clientId,
      // 声明或设置 clientId，用于MQTT 客户端唯一标识。
      // clientId：MQTT 客户端唯一标识；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
      username: config.mqtt.username,
      // 声明或设置 username，用于账号用户名。
      // username：账号用户名；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
      password: config.mqtt.password,
      // 声明或设置 password，用于登录口令或数据库保存的口令摘要，具体取决于所在对象。
      // password：登录口令或数据库保存的口令摘要，具体取决于所在对象；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
      keepalive: 30,
      // 声明或设置 keepalive，用于当前对象或接口的对应数据。
      // keepalive 是此处声明的字段，类型或取值约束为 30
      reconnectPeriod: 2000,
      // 声明或设置 reconnectPeriod，用于当前对象或接口的对应数据。
      // reconnectPeriod 是此处声明的字段，类型或取值约束为 2000
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // ③ 连接成功事件：此时才能订阅主题
    this.client.on('connect', () => {
    // 注册指定消息事件的回调。
    // client：本处声明的字段或类型，类型为 MqttClient；on：注册指定事件的回调函数
      this.logger.log(`MQTT 已连接: ${config.mqtt.url}`);
      // 输出调试或运行日志。
      // logger：当前模块的日志记录器；log：输出调试或运行日志；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令；url：当前服务的连接地址
      // 订阅 5 类主题。数组形式一次性订阅，效率更高。
      // 通配符说明：
      //   +  = 单层通配，匹配恰好一个层级
      //   #  = 多层通配（本系统未使用，避免订阅范围过宽）

      // 连接成功后登记业务订阅，主题中的产线编码与设备编码随后用于路由这条报文。
      // robot 主题末尾有设备层级，IO、工序状态与 cmd_ack 使用各自主题；“+”只匹配单个主题层级。
      // subscribe 的 QoS 不能把采集器以 QoS 0 发布的机器人帧变成保证补传的历史，消息接收也不等于数据库写入成功。

      this.client.subscribe(
      // 订阅消息主题、频道或事件流。
      // client：本处声明的字段或类型，类型为 MqttClient；subscribe：订阅消息主题、频道或事件流
        [
        // #  = 多层通配（本系统未使用，避免订阅范围过宽）。
        // 方括号内依次列出传给当前调用的数组参数或待保存的数据项
          `${p}/+/telemetry/robot/+`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          // p：本处保存 config.topicPrefix 的结果
          `${p}/+/telemetry/io`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          // p：本处保存 config.topicPrefix 的结果
          `${p}/+/telemetry/status`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          // p：本处保存 config.topicPrefix 的结果
          `${p}/+/event`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          // p：本处保存 config.topicPrefix 的结果
          `${p}/+/edge/status`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          // p：本处保存 config.topicPrefix 的结果
          `${p}/+/cmd_ack`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          // p：本处保存 config.topicPrefix 的结果
        ],
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 此处结束当前数组参数，各元素保持上方列出的顺序
        { qos: 1 },
        // 开始对象字面量，并在这一行设置其中列出的字段。
        // qos：MQTT 消息投递质量等级
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // ④ 重连中：打 warn 日志，便于运维发现网络抖动
    this.client.on('reconnect', () => this.logger.warn('MQTT 重连中...'));
    // 注册指定消息事件的回调。
    // client：本处声明的字段或类型，类型为 MqttClient；on：注册指定事件的回调函数；logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准
    // ⑤ 错误事件：记录错误信息（不抛出，避免进程崩溃）
    this.client.on('error', (e) => this.logger.error(`MQTT 错误: ${e.message}`));
    // 注册指定消息事件的回调。
    // client：本处声明的字段或类型，类型为 MqttClient；on：注册指定事件的回调函数；e：当前方法接收的参数；logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；message：消息正文或用于展示的结果说明
    // ⑥ 消息事件：每收到一条报文就调用 dispatch 分发。
    //    这是整个上行链路唯一的"数据入口函数"
    this.client.on('message', (topic, payload) => this.dispatch(topic, payload));
    // 注册指定消息事件的回调。
    // client：本处声明的字段或类型，类型为 MqttClient；on：注册指定事件的回调函数；topic：MQTT 发布或订阅使用的主题路径；payload：消息或事件携带的数据内容；dispatch：按 MQTT 主题类别分派报文到实时缓存、历史写入和界面广播
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块启动时初始化 mqtt-ingest.service 所需的连接、订阅或周期任务的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 模块销毁钩子：进程退出时优雅关闭 MQTT 连接。
   * end() 会先发 DISCONNECT 报文再断开 TCP，避免 Broker 误判为异常掉线
   * （异常掉线会触发 LWT，把产线标成 offline）
   */
  // 这一段定义 onModuleDestroy，用于在模块关闭时清理 mqtt-ingest.service 持有的连接、订阅或计时器。
  onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
  // onModuleDestroy：在模块关闭时清理 mqtt-ingest.service 持有的连接、订阅或计时器
    this.client?.end();
    // 关闭数据库连接池或结束 HTTP 响应，以接收对象为准。
    // client：本处声明的字段或类型，类型为 MqttClient；end：关闭数据库连接池或结束 HTTP 响应，以接收对象为准
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在模块关闭时清理 mqtt-ingest.service 持有的连接、订阅或计时器的实现；实际结果由运行时输入和执行分支决定。

  // 控制指令下发(供 CommandService 调用)
  /**
   * 控制指令下发（下行链路）。供 CommandService 调用。
   *
   * 【下行数据流】
   *   浏览器 POST /api/lines/line-01/commands
   *     → CommandController → CommandService（校验白名单 + 落审计表）
   *     → 本方法 publish 到 tl/v1/{lineId}/cmd/{deviceId}
   *     → Broker 转发给订阅了该主题的采集器
   *     → 采集器写 PLC → 回 cmd_ack → 又回到本文件的 dispatch（kind === 'cmd_ack'）
   *
   * @param lineId   产线编码（主题第 2 段）
   * @param deviceId 设备编码（主题最后一段）
   * @param cmd      指令报文，结构见契约 3.5 节
   */
  // 这一段定义 publishCommand，用于把已校验的控制报文发布到目标设备的 MQTT 指令主题。

  // CommandService 检查并记录命令后，通过本方法把带 cmdId 的报文发给设备的 MQTT 命令主题。
  // lineId、deviceId 在这里仍是业务编码；cmd 是命令内容，JSON.stringify() 将它变成消息正文。
  // 采集器预先订阅 cmd/+ 并接收。当前 publishCommand() 不等待采集器回执后才结束，HTTP 返回与现场回执是不同阶段。

  publishCommand(lineId: string, deviceId: string, cmd: Record<string, unknown>) {
  // 向指定设备的 MQTT 命令主题发布带编号的控制报文，采集器从其订阅连接接收。
  // lineId、deviceId 是主题中的业务编码；cmd 由命令服务组装，JSON.stringify() 编码正文；QoS 1 不代表物理动作已完成。
    this.client.publish(
    // 把消息发布到指定主题或频道。
    // client：本处声明的字段或类型，类型为 MqttClient；publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准
      `${config.topicPrefix}/${lineId}/cmd/${deviceId}`,
      // 构造模板字符串，把 ${...} 中的值插入目标路径或文本。
      // config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；topicPrefix：config 对象上的字段或操作；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码
      JSON.stringify(cmd),
      // 把对象编码为 JSON 文本。
      // JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；cmd：当前方法接收的参数，类型为 Record<string, unknown>
      { qos: 1 },
      // 开始对象字面量，并在这一行设置其中列出的字段。
      // qos：MQTT 消息投递质量等级
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把已校验的控制报文发布到目标设备的 MQTT 指令主题的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 dispatch，用于按 MQTT 主题类别分派报文到实时缓存、历史写入和界面广播。
  private dispatch(topic: string, payload: Buffer) {
  // 定义方法 dispatch；括号中声明参数，花括号内实现逻辑。
  // dispatch：按 MQTT 主题类别分派报文到实时缓存、历史写入和界面广播；topic：MQTT 发布或订阅使用的主题路径；payload：消息或事件携带的数据内容；Buffer：Node.js 二进制字节缓冲区 API
    // 主题结构见数据契约: tl/v1/{lineId}/...
    // ---------- 第 1 步：解析主题 ----------
    // 按 '/' 切分：'tl/v1/line-01/telemetry/robot/robot-01'
    //   → ['tl','v1','line-01','telemetry','robot','robot-01']
    const seg = topic.split('/');
    // 按分隔符拆分字符串，将结果保存或写入 seg。
    // seg：本处保存 topic.split('/') 的结果；topic：MQTT 发布或订阅使用的主题路径；split：按分隔符拆分字符串
    // seg[2] 是产线编码（因为前缀固定是 tl/v1，占了 0 和 1 两段）
    const lineId = seg[2];
    // 根据 seg[2] 设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
    // lineId：产线标识，接口通常使用 line-01 等编码；seg：本处保存 topic.split('/') 的结果
    // kind 是主题剩余部分拼接，用来判断消息类型
    const kind = seg.slice(3).join('/');
    // 截取数组或字符串的一部分，将结果保存或写入 kind。
    // kind：本处保存 seg.slice(3).join('/') 的结果；seg：本处保存 topic.split('/') 的结果；slice：截取数组或字符串的一部分；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准

    // ---------- 第 2 步：解析 JSON 载荷 ----------
    let msg: any;
    // 声明变量 msg，类型为 any；其值稍后赋入。
    // msg：当前收到的消息或提示文字
    // ---------- 第 3 步：按类型三路分发 ----------
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      // Buffer → utf8 字符串 → JSON 对象
      msg = JSON.parse(payload.toString('utf8'));
      // 把右侧表达式的结果写入 msg。
      // msg：当前收到的消息或提示文字；JSON：JavaScript 原生 JSON 编解码 API；parse：把 JSON 文本解析为对象，或按当前解析器处理文本；payload：消息或事件携带的数据内容；toString：本处声明的字段或类型，类型为 string
    } catch {
    // 开始异常处理分支，接收前面代码抛出的错误。
    // 本行完成上面一层已说明的函数、分支或对象配置
      // 不是合法 JSON：记 warn 并丢弃这一条（不能影响其他消息）
      this.logger.warn(`非 JSON 报文已忽略: ${topic}`);
      // 记录警告日志或显示警告提示，以接收对象为准。
      // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；topic：MQTT 发布或订阅使用的主题路径
      return;
      // 立即结束当前函数，不返回具体值。
      // 当前函数在此处结束，调用方不会从这条路径收到业务数据
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      // 场景 A：机器人六轴帧（10Hz，最高频）
      if (kind.startsWith('telemetry/robot/')) {
      // 检查(kind.startsWith('telemetry/robot/'))，按判断结果进入对应的处理分支。
      // kind：本处保存 seg.slice(3).join('/') 的结果；startsWith：检查字符串是否以指定内容开头
        // 设备编码取 seg[5]：telemetry(3) / robot(4) / {deviceId}(5)
        const deviceId = seg[5];
        // 根据 seg[5] 设置 deviceId，用于设备标识，接口使用配置中的设备编码。
        // deviceId：设备标识，接口使用配置中的设备编码；seg：本处保存 topic.split('/') 的结果
        // 【契约校验】joints 必须是长度 6 的数组。
        // 这是契约里唯一的必填字段，不合法直接丢 —— 脏数据进库会污染时序表
        if (!Array.isArray(msg.joints) || msg.joints.length !== 6) {
        // 检查(!Array.isArray(msg.joints) || msg.joints.length !== 6)，按判断结果进入对应的处理分支。
        // Array：JavaScript 数组辅助 API；isArray：本处声明的字段或类型，类型为 arg is any[]；msg：当前收到的消息或提示文字；joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；length：msg.joints 对象上的字段或操作
          this.logger.warn(`robot_state 缺少合法 joints[6],已忽略: ${topic}`);
          // 记录警告日志或显示警告提示，以接收对象为准。
          // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；topic：MQTT 发布或订阅使用的主题路径
          return;
          // 立即结束当前函数，不返回具体值。
          // 当前函数在此处结束，调用方不会从这条路径收到业务数据
        }
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
        // 第 1 路：写 Redis 实时快照（覆盖写，带 60s TTL）

        // 机器人消息检查通过后，从这里分出快照、历史缓冲和实时推送三条处理路径。
        // lineId 与 deviceId 来自主题识别，msg 是解析后的机器人帧，包含 joints 等字段；同一帧分别交给三个服务。
        // setRobotFrame() 更新 Redis 最新快照，bufferRobotFrame() 准备历史记录，broadcastRobot() 向产线房间推送。
        // 这些调用不构成保证同时成功的事务，所以网页更新不能单独证明历史完整保存。

        this.state.setRobotFrame(lineId, deviceId, msg);
        // 把本帧交给实时状态服务保存最新快照，供稍后打开或重连的网页读取。
        // state 是项目注入的 LineStateService；setRobotFrame 内部通过 ioredis 写 Redis 并设置 60 秒有效期；lineId、deviceId 是业务编码，msg 是收到的整帧，不在这一行保存历史或推送网页。
        // 第 2 路：放进历史缓冲队列（每秒批量写 TimescaleDB）

        // 把同一条机器人消息交给历史缓冲；这个方法只负责入队，后续定时批量写 PostgreSQL。
        // deviceId 在接入层是设备业务编码，HistoryWriter 会通过 CatalogService 找到数据库内部设备 id。

        this.history.bufferRobotFrame(deviceId, msg);
        // 把同一帧交给历史服务整理并入队，后续由定时批处理写入数据库。
        // history 是项目注入的 HistoryWriterService；此处 deviceId 是设备业务编码，方法内部会用 CatalogService 查数据库内部编号；入队不等于已经落库。
        // 第 3 路：WebSocket 推送给订阅了该产线房间的浏览器

        // 将这帧机器人消息推送给正在订阅对应产线的网页，事件名为 robot_state。
        // 网页收到后更新 useLineData 的 robot，TwinView 再把 joints 交给模型。

        this.gateway.broadcastRobot(lineId, msg);
        // 把同一帧交给实时网关，发送给订阅当前产线的在线网页。
        // gateway 是项目注入的 TelemetryGateway；broadcastRobot 内部使用 Socket.IO 房间发送 robot_state，网页收到后更新共享状态；这条路径与 Redis、历史写入分别处理。
      } else if (kind === 'telemetry/io') {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // kind：本处保存 seg.slice(3).join('/') 的结果
        // 产线 IO(契约 §3.8):高频瞬时量,只走 Redis 快照 + WebSocket,不落 TimescaleDB。
        // 单个点位读失败时值为 null(edge 保证"没读到"不冒充 0),这里整包照收。
        if (!msg.io || typeof msg.io !== 'object' || Array.isArray(msg.io)) {
        // 检查(!msg.io || typeof msg.io !== 'object' || Array.isArray(msg.io))，按判断结果进入对应的处理分支。
        // msg：当前收到的消息或提示文字；io：现场 IO 信号对象或当前 IO 状态帧；Array：JavaScript 数组辅助 API；isArray：本处声明的字段或类型，类型为 arg is any[]
          this.logger.warn(`io_state 缺少合法 io 对象,已忽略: ${topic}`);
          // 记录警告日志或显示警告提示，以接收对象为准。
          // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准；topic：MQTT 发布或订阅使用的主题路径
          return;
          // 立即结束当前函数，不返回具体值。
          // 当前函数在此处结束，调用方不会从这条路径收到业务数据
        }
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
        this.state.setIoFrame(lineId, msg);
        // 把产线最新 IO 信号帧存入 Redis 并设置有效期。
        // state：当前状态值或实时状态服务实例，以所在对象为准；setIoFrame：把产线最新 IO 信号帧存入 Redis 并设置有效期；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
        this.gateway.broadcastIo(lineId, msg);
        // 向产线房间广播 IO 信号帧。
        // gateway：当前方法接收的参数，类型为 TelemetryGateway；broadcastIo：向产线房间广播 IO 信号帧；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
      // 场景 B：产线状态快照（1Hz，retained）
      } else if (kind === 'telemetry/status') {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // kind：本处保存 seg.slice(3).join('/') 的结果
        this.state.setLineStatus(lineId, msg);
        // 把产线最新工序和计数状态存入 Redis 并设置有效期。
        // state：当前状态值或实时状态服务实例，以所在对象为准；setLineStatus：把产线最新工序和计数状态存入 Redis 并设置有效期；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
        this.history.insertLineStatus(lineId, msg);
        // 把产线状态帧写入历史状态表。
        // history：历史写入服务实例；insertLineStatus：把产线状态帧写入历史状态表；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
        this.gateway.broadcastLineStatus(lineId, msg);
        // 向产线房间广播最新生产状态。
        // gateway：当前方法接收的参数，类型为 TelemetryGateway；broadcastLineStatus：向产线房间广播最新生产状态；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
      // 场景 C：生产事件 / 报警（事件触发，低频）
      } else if (kind === 'event') {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // kind：本处保存 seg.slice(3).join('/') 的结果
        this.history.insertEvent(lineId, msg);
        // 把生产事件写入数据库事件表。
        // history：历史写入服务实例；insertEvent：把生产事件写入数据库事件表；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
        this.gateway.broadcastEvent(lineId, msg);
        // 向产线房间广播生产事件。
        // gateway：当前方法接收的参数，类型为 TelemetryGateway；broadcastEvent：向产线房间广播生产事件；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
      // 场景 D：边缘采集器在线状态（retained + LWT，极低频）
      } else if (kind === 'edge/status') {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // kind：本处保存 seg.slice(3).join('/') 的结果
        this.state.setEdgeStatus(lineId, msg);
        // 更新边缘采集器在线状态缓存。
        // state：当前状态值或实时状态服务实例，以所在对象为准；setEdgeStatus：更新边缘采集器在线状态缓存；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
        this.gateway.broadcastEdge(lineId, msg);
        // 向产线房间广播边缘采集器在线状态。
        // gateway：当前方法接收的参数，类型为 TelemetryGateway；broadcastEdge：向产线房间广播边缘采集器在线状态；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
      // 场景 E：控制指令回执（每条指令一次）
      } else if (kind === 'cmd_ack') {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // kind：本处保存 seg.slice(3).join('/') 的结果
        this.history.ackCommand(msg);
        // 根据指令编号更新控制审计记录的回执状态。
        // history：历史写入服务实例；ackCommand：根据指令编号更新控制审计记录的回执状态；msg：当前收到的消息或提示文字
        this.gateway.broadcastCommandAck(lineId, msg);
        // 向产线房间广播控制指令回执。
        // gateway：当前方法接收的参数，类型为 TelemetryGateway；broadcastCommandAck：向产线房间广播控制指令回执；lineId：产线标识，接口通常使用 line-01 等编码；msg：当前收到的消息或提示文字
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    } catch (e) {
    // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
    // e：本处保存的局部数据
      // 兜底 try/catch：任何一处理路抛错都不应让 MQTT 客户端崩溃
      this.logger.error(`报文处理失败 ${topic}: ${(e as Error).message}`);
      // 记录错误日志或显示失败提示，以接收对象为准。
      // logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；topic：MQTT 发布或订阅使用的主题路径；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了按 MQTT 主题类别分派报文到实时缓存、历史写入和界面广播的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端 MQTT 接入服务，订阅上行消息并发布控制指令所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 MqttIngestService 的字段或服务能力，供项目其他模块使用。
