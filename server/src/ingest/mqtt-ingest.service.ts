/**
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
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { connect, MqttClient } from 'mqtt';
// 从 mqtt 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { LineStateService } from '../state/line-state.service';
// 从 ../state/line-state.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { HistoryWriterService } from '../history/history-writer.service';
// 从 ../history/history-writer.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { TelemetryGateway } from '../realtime/telemetry.gateway';
// 从 ../realtime/telemetry.gateway 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// MQTT 消费入口:订阅契约主题 → 解析 → 三路分发
// (Redis 实时快照 / TimescaleDB 历史 / WebSocket 推送)
/**
 * MQTT 消费入口服务。
 */
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class MqttIngestService implements OnModuleInit, OnModuleDestroy {
// 声明 MqttIngestService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  private readonly logger = new Logger(MqttIngestService.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。
  // MQTT 客户端实例。onModuleInit 里创建
  private client: MqttClient;
  // 声明类属性或构造参数 client，类型为 MqttClient。 关键字：private＝限定类内部访问。

  /**
   * 构造函数：注入三个下游消费者。
   * 注意依赖方向：本服务依赖下游（state/history/realtime），
   * 而下游**不依赖**本服务 —— 所以不存在循环依赖，模块依赖图是单向的。
   */
  constructor(
  // 调用 constructor，把括号中的值作为参数传入。
    private readonly state: LineStateService,
    // 声明类属性或构造参数 state，类型为 LineStateService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly history: HistoryWriterService,
    // 声明类属性或构造参数 history，类型为 HistoryWriterService。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    private readonly gateway: TelemetryGateway,
    // 声明类属性或构造参数 gateway，类型为 TelemetryGateway。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
  ) {}
  // 结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。

  onModuleInit() {
  // 定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
    // ① 取主题前缀（默认 tl/v1）
    const p = config.topicPrefix;
    // 声明 p，初始值由 config.topicPrefix 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // ② 建立连接。connect() 是同步返回客户端对象的，不会阻塞；
    //    真正的连接建立是异步的，靠下面的事件回调感知
    this.client = connect(config.mqtt.url, {
    // 把右侧表达式的结果写入 this.client。 关键字：this＝当前对象实例。
      clientId: config.mqtt.clientId,
      // 设置字段 clientId。
      username: config.mqtt.username,
      // 设置字段 username。
      password: config.mqtt.password,
      // 设置字段 password。
      keepalive: 30,
      // 设置字段 keepalive。
      reconnectPeriod: 2000,
      // 设置字段 reconnectPeriod。
    });
    // 结束当前回调或对象，并完成外层函数调用。
    // ③ 连接成功事件：此时才能订阅主题
    this.client.on('connect', () => {
    // 调用 this.client.on，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      this.logger.log(`MQTT 已连接: ${config.mqtt.url}`);
      // 调用 this.logger.log，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      // 订阅 5 类主题。数组形式一次性订阅，效率更高。
      // 通配符说明：
      //   +  = 单层通配，匹配恰好一个层级
      //   #  = 多层通配（本系统未使用，避免订阅范围过宽）
      this.client.subscribe(
      // 调用 this.client.subscribe，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        [
        // 开始当前表达式的分组或数组内容。
          `${p}/+/telemetry/robot/+`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          `${p}/+/telemetry/io`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          `${p}/+/telemetry/status`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          `${p}/+/event`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          `${p}/+/edge/status`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
          `${p}/+/cmd_ack`,
          // 构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。
        ],
        // 结束当前数组，继续外层表达式。
        { qos: 1 },
        // 开始对象字面量，并在这一行设置其中列出的字段。
      );
      // 结束当前函数的参数列表并完成调用。
    });
    // 结束当前回调或对象，并完成外层函数调用。
    // ④ 重连中：打 warn 日志，便于运维发现网络抖动
    this.client.on('reconnect', () => this.logger.warn('MQTT 重连中...'));
    // 调用 this.client.on，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // ⑤ 错误事件：记录错误信息（不抛出，避免进程崩溃）
    this.client.on('error', (e) => this.logger.error(`MQTT 错误: ${e.message}`));
    // 调用 this.client.on，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // ⑥ 消息事件：每收到一条报文就调用 dispatch 分发。
    //    这是整个上行链路唯一的"数据入口函数"
    this.client.on('message', (topic, payload) => this.dispatch(topic, payload));
    // 调用 this.client.on，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 模块销毁钩子：进程退出时优雅关闭 MQTT 连接。
   * end() 会先发 DISCONNECT 报文再断开 TCP，避免 Broker 误判为异常掉线
   * （异常掉线会触发 LWT，把产线标成 offline）
   */
  onModuleDestroy() {
  // 定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
    this.client?.end();
    // 调用 .end，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

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
  publishCommand(lineId: string, deviceId: string, cmd: Record<string, unknown>) {
  // 定义方法 publishCommand；括号中声明参数，花括号内实现逻辑。 关键字：unknown＝需检查后才能使用的类型。
    this.client.publish(
    // 调用 this.client.publish，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      `${config.topicPrefix}/${lineId}/cmd/${deviceId}`,
      // 构造模板字符串，把 ${...} 中的值插入目标路径或文本。
      JSON.stringify(cmd),
      // 调用 JSON.stringify，把括号中的值作为参数传入。
      { qos: 1 },
      // 开始对象字面量，并在这一行设置其中列出的字段。
    );
    // 结束当前函数的参数列表并完成调用。
  }
  // 结束当前对象、函数或条件代码块。

  private dispatch(topic: string, payload: Buffer) {
  // 定义方法 dispatch；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问。
    // 主题结构见数据契约: tl/v1/{lineId}/...
    // ---------- 第 1 步：解析主题 ----------
    // 按 '/' 切分：'tl/v1/line-01/telemetry/robot/robot-01'
    //   → ['tl','v1','line-01','telemetry','robot','robot-01']
    const seg = topic.split('/');
    // 声明 seg，初始值由 topic.split('/') 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // seg[2] 是产线编码（因为前缀固定是 tl/v1，占了 0 和 1 两段）
    const lineId = seg[2];
    // 声明 lineId，初始值由 seg[2] 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // kind 是主题剩余部分拼接，用来判断消息类型
    const kind = seg.slice(3).join('/');
    // 声明 kind，初始值由 seg.slice(3).join('/') 计算得到。 关键字：const＝声明不可重新绑定的变量。

    // ---------- 第 2 步：解析 JSON 载荷 ----------
    let msg: any;
    // 声明变量 msg，类型为 any；其值稍后赋入。 关键字：let＝声明可重新赋值的变量；any＝跳过静态类型检查。
    // ---------- 第 3 步：按类型三路分发 ----------
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      // Buffer → utf8 字符串 → JSON 对象
      msg = JSON.parse(payload.toString('utf8'));
      // 把右侧表达式的结果写入 msg。
    } catch {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      // 不是合法 JSON：记 warn 并丢弃这一条（不能影响其他消息）
      this.logger.warn(`非 JSON 报文已忽略: ${topic}`);
      // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      return;
      // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。

    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      // 场景 A：机器人六轴帧（10Hz，最高频）
      if (kind.startsWith('telemetry/robot/')) {
      // 判断 if (kind.startsWith('telemetry/robot/')) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        // 设备编码取 seg[5]：telemetry(3) / robot(4) / {deviceId}(5)
        const deviceId = seg[5];
        // 声明 deviceId，初始值由 seg[5] 计算得到。 关键字：const＝声明不可重新绑定的变量。
        // 【契约校验】joints 必须是长度 6 的数组。
        // 这是契约里唯一的必填字段，不合法直接丢 —— 脏数据进库会污染时序表
        if (!Array.isArray(msg.joints) || msg.joints.length !== 6) {
        // 判断 if (!Array.isArray(msg.joints) || msg.joints.length !== 6) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
          this.logger.warn(`robot_state 缺少合法 joints[6],已忽略: ${topic}`);
          // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
          return;
          // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
        }
        // 结束当前对象、函数或条件代码块。
        // 第 1 路：写 Redis 实时快照（覆盖写，带 60s TTL）
        this.state.setRobotFrame(lineId, deviceId, msg);
        // 调用 this.state.setRobotFrame，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        // 第 2 路：放进历史缓冲队列（每秒批量写 TimescaleDB）
        this.history.bufferRobotFrame(deviceId, msg);
        // 调用 this.history.bufferRobotFrame，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        // 第 3 路：WebSocket 推送给订阅了该产线房间的浏览器
        this.gateway.broadcastRobot(lineId, msg);
        // 调用 this.gateway.broadcastRobot，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      } else if (kind === 'telemetry/io') {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
        // 产线 IO(契约 §3.8):高频瞬时量,只走 Redis 快照 + WebSocket,不落 TimescaleDB。
        // 单个点位读失败时值为 null(edge 保证"没读到"不冒充 0),这里整包照收。
        if (!msg.io || typeof msg.io !== 'object' || Array.isArray(msg.io)) {
        // 判断 if (!msg.io || typeof msg.io !== 'object' || Array.isArray(msg.io)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型。
          this.logger.warn(`io_state 缺少合法 io 对象,已忽略: ${topic}`);
          // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
          return;
          // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
        }
        // 结束当前对象、函数或条件代码块。
        this.state.setIoFrame(lineId, msg);
        // 调用 this.state.setIoFrame，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        this.gateway.broadcastIo(lineId, msg);
        // 调用 this.gateway.broadcastIo，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      // 场景 B：产线状态快照（1Hz，retained）
      } else if (kind === 'telemetry/status') {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
        this.state.setLineStatus(lineId, msg);
        // 调用 this.state.setLineStatus，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        this.history.insertLineStatus(lineId, msg);
        // 调用 this.history.insertLineStatus，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        this.gateway.broadcastLineStatus(lineId, msg);
        // 调用 this.gateway.broadcastLineStatus，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      // 场景 C：生产事件 / 报警（事件触发，低频）
      } else if (kind === 'event') {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
        this.history.insertEvent(lineId, msg);
        // 调用 this.history.insertEvent，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        this.gateway.broadcastEvent(lineId, msg);
        // 调用 this.gateway.broadcastEvent，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      // 场景 D：边缘采集器在线状态（retained + LWT，极低频）
      } else if (kind === 'edge/status') {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
        this.state.setEdgeStatus(lineId, msg);
        // 调用 this.state.setEdgeStatus，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        this.gateway.broadcastEdge(lineId, msg);
        // 调用 this.gateway.broadcastEdge，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      // 场景 E：控制指令回执（每条指令一次）
      } else if (kind === 'cmd_ack') {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
        this.history.ackCommand(msg);
        // 调用 this.history.ackCommand，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        this.gateway.broadcastCommandAck(lineId, msg);
        // 调用 this.gateway.broadcastCommandAck，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      }
      // 结束当前对象、函数或条件代码块。
    } catch (e) {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      // 兜底 try/catch：任何一处理路抛错都不应让 MQTT 客户端崩溃
      this.logger.error(`报文处理失败 ${topic}: ${(e as Error).message}`);
      // 调用 this.logger.error，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
