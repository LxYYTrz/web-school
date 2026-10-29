/**
 * 工控机后端的 MQTT 接入与下发服务，由 NestJS 创建并在 onModuleInit 连接 Broker。
 * 启动时注册连接、重连、错误与 message 回调；每条消息到来后才执行 dispatch，不是从头重跑整个文件。
 * dispatch 按主题和内容区分机器人、IO、工序、事件、边缘状态和回执，再交给 State、History、Realtime 服务。
 * 机器人同一帧分成 Redis 快照、历史缓冲和 Socket.IO 推送三路；结果分别处理，不构成同时成功的事务。
 * 控制的 publishCommand 由 CommandService 调用；它使用 mqtt 库发送消息，采集器才实际写 PLC。
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { config } from '../config/configuration';
import { LineStateService } from '../state/line-state.service';
import { HistoryWriterService } from '../history/history-writer.service';
import { TelemetryGateway } from '../realtime/telemetry.gateway';

// MQTT 消费入口:订阅契约主题 → 解析 → 三路分发
// (Redis 实时快照 / TimescaleDB 历史 / WebSocket 推送)
/**
 * MQTT 消费入口服务。
 */
@Injectable()
export class MqttIngestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttIngestService.name);
  // MQTT 客户端实例。onModuleInit 里创建
  private client: MqttClient;

  /**
   * 构造函数：注入三个下游消费者。
   * 注意依赖方向：本服务依赖下游（state/history/realtime），
   * 而下游**不依赖**本服务 —— 所以不存在循环依赖，模块依赖图是单向的。
   */
  constructor(
    private readonly state: LineStateService,
    private readonly history: HistoryWriterService,
    private readonly gateway: TelemetryGateway,
  ) {}

  // NestJS 启动本服务时调用一次，创建 mqtt 库客户端并注册连接和消息回调。
  // 连接成功后订阅各类上行与回执主题；每个 message 到达再交给 dispatch，重连后 connect 回调也会重新订阅。
  onModuleInit() {
    // ① 取主题前缀（默认 tl/v1）
    const p = config.topicPrefix;
    // ② 建立连接。connect() 是同步返回客户端对象的，不会阻塞；
    //    真正的连接建立是异步的，靠下面的事件回调感知

    // NestJS 在这里作为 MQTT 客户端主动连接 Broker，和采集器连接 Broker 是两条不同连接。
    // 连接目标、客户端编号与认证信息来自统一配置。连接成功回调会登记订阅，Broker 才能沿这条连接交付匹配主题。
    // 这里建立的是消息接入通道，不是采集器向后端发 HTTP 请求；网络重连与后续报文业务检查分别处理。

    this.client = connect(config.mqtt.url, {
    // 1. connect 从 mqtt 库导入，返回客户端对象；真正连接成功由后面的 connect 事件通知。
    // 2. config.mqtt.url 指向 Broker，clientId 标识这个后端客户端；可选账号与密码来自配置。
    // 3. keepalive=30 是 MQTT 保活配置；reconnectPeriod=2000 表示断开后按库规则尝试重连的间隔毫秒数。
    // 4. 采集器也连接同一 Broker，但与后端是两条不同的客户端连接。
      clientId: config.mqtt.clientId,
      username: config.mqtt.username,
      password: config.mqtt.password,
      keepalive: 30,
      reconnectPeriod: 2000,
    });

    // 这是连接成功后的处理入口：用当前前缀订阅机器人、IO、工序、事件、边缘状态和命令回执。
    // + 匹配单个主题层级；订阅请求上限 QoS 1，不会把采集器以 QoS 0 发布的消息自动升级成业务可靠执行。
    this.client.on('connect', () => {
      this.logger.log(`MQTT 已连接: ${config.mqtt.url}`);
      // 用数组列出本服务订阅的六类主题；回执、在线状态与遥测按各自分支处理。
      // 通配符说明：
      //   +  = 单层通配，匹配恰好一个层级
      //   #  = 多层通配（本系统未使用，避免订阅范围过宽）

      // 连接成功后登记业务订阅，主题中的产线编码与设备编码随后用于路由这条报文。
      // robot 主题末尾有设备层级，IO、工序状态与 cmd_ack 使用各自主题；“+”只匹配单个主题层级。
      // subscribe 的 QoS 不能把采集器以 QoS 0 发布的机器人帧变成保证补传的历史，消息接收也不等于数据库写入成功。

      this.client.subscribe(
        [
        // #  = 多层通配（本系统未使用，避免订阅范围过宽）。
          `${p}/+/telemetry/robot/+`,
          `${p}/+/telemetry/io`,
          `${p}/+/telemetry/status`,
          `${p}/+/event`,
          `${p}/+/edge/status`,
          `${p}/+/cmd_ack`,
        ],
        { qos: 1 },
      );
    });
    // ④ 重连中：打 warn 日志，便于运维发现网络抖动
    this.client.on('reconnect', () => this.logger.warn('MQTT 重连中...'));
    // ⑤ 错误事件：记录错误信息（不抛出，避免进程崩溃）
    this.client.on('error', (e) => this.logger.error(`MQTT 错误: ${e.message}`));

    // Broker 交来一条消息时，mqtt 库提供 topic 和二进制 payload，这个回调把二者交给项目 dispatch。
    // 这是异步事件入口；外层 onModuleInit 已结束后，后续每条消息仍可触发该回调。
    this.client.on('message', (topic, payload) => this.dispatch(topic, payload));
  }

  // NestJS 关闭本模块时结束 MQTT 客户端连接，避免继续接收消息。
  onModuleDestroy() {
    this.client?.end();
  }

  // CommandService 建好命令编号后调用本方法，将业务对象编码为 JSON 并发布到 cmd/设备编码 主题。
  // publish 来自 mqtt 库，当前使用 QoS 1；方法不等待采集器 cmd_ack，回执从 dispatch 的另一分支返回。
  publishCommand(lineId: string, deviceId: string, cmd: Record<string, unknown>) {
    this.client.publish(
      `${config.topicPrefix}/${lineId}/cmd/${deviceId}`,
      // 构造模板字符串，把 ${...} 中的值插入目标路径或文本。
      JSON.stringify(cmd),
      { qos: 1 },
    );
  }

  // 收到一条 MQTT 消息后，先从主题取得产线与消息类别，再把 payload 解码成业务对象。
  // 机器人分支检查 joints 数组长度后做三路分发；IO 不走关节历史表，工序、事件、边缘状态和回执分别交给对应服务。
  private dispatch(topic: string, payload: Buffer) {
    // 主题结构见数据契约: tl/v1/{lineId}/...
    // ---------- 第 1 步：解析主题 ----------
    // 按 '/' 切分：'tl/v1/line-01/telemetry/robot/robot-01'
    //   → ['tl','v1','line-01','telemetry','robot','robot-01']
    const seg = topic.split('/');
    // 1. topic 是 mqtt 回调给出的主题字符串，split() 是 JavaScript 字符串方法。
    // 2. 示例 tl/v1/line-01/telemetry/robot/robot-01 被拆成六段。
    // 3. 本项目按固定前缀结构取 seg[2] 为产线，seg[5] 为机器人设备；它们都是业务编码。
    // 4. kind 从第 3 段拼接，用来决定下面进入机器人、IO、状态还是回执分支。
    const lineId = seg[2];
    // kind 是主题剩余部分拼接，用来判断消息类型
    const kind = seg.slice(3).join('/');

    // ---------- 第 2 步：解析 JSON 载荷 ----------
    let msg: any;
    // ---------- 第 3 步：按类型三路分发 ----------
    try {
      // Buffer → utf8 字符串 → JSON 对象
      msg = JSON.parse(payload.toString('utf8'));
      // 1. payload 是 Node.js Buffer，先按 UTF-8 还原消息正文，再用内置 JSON.parse() 得到对象。
      // 2. 例如文本中的 joints 数组在这里成为可以访问的 msg.joints。
      // 3. JSON 语法合法不等于业务字段有效；机器人分支还会检查 joints 是否为长度 6 的数组。
      // 4. 解析失败只结束当前报文处理，不是关闭整个 MQTT 客户端。
    } catch {
      // 不是合法 JSON：记 warn 并丢弃这一条（不能影响其他消息）
      this.logger.warn(`非 JSON 报文已忽略: ${topic}`);
      return;
    }

    try {
      // 场景 A：机器人六轴帧（10Hz，最高频）
      if (kind.startsWith('telemetry/robot/')) {
        // 设备编码取 seg[5]：telemetry(3) / robot(4) / {deviceId}(5)
        const deviceId = seg[5];
        // 【契约校验】joints 必须是长度 6 的数组。
        // 这是契约里唯一的必填字段，不合法直接丢 —— 脏数据进库会污染时序表
        if (!Array.isArray(msg.joints) || msg.joints.length !== 6) {
          this.logger.warn(`robot_state 缺少合法 joints[6],已忽略: ${topic}`);
          return;
        }
        // 第 1 路：写 Redis 实时快照（覆盖写，带 60s TTL）

        // 机器人消息检查通过后，从这里分出快照、历史缓冲和实时推送三条处理路径。
        // lineId 与 deviceId 来自主题识别，msg 是解析后的机器人帧，包含 joints 等字段；同一帧分别交给三个服务。
        // setRobotFrame() 更新 Redis 最新快照，bufferRobotFrame() 准备历史记录，broadcastRobot() 向产线房间推送。
        // 这些调用不构成保证同时成功的事务，所以网页更新不能单独证明历史完整保存。

        this.state.setRobotFrame(lineId, deviceId, msg);
        // 1. state 是 NestJS 注入的项目 LineStateService，不是 mqtt 库提供的存储对象。
        // 2. 参数依次传入主题中的产线编码、设备编码以及解析后的整帧 msg。
        // 3. 进入 state/line-state.service.ts 的 setRobotFrame，才能看到 ioredis SET、key 和 60 秒有效期的实际实现。
        // 4. 本行只交给最新快照路径；下面两行分别处理历史缓冲和在线网页推送。

        // 把同一条机器人消息交给历史缓冲；这个方法只负责入队，后续定时批量写 PostgreSQL。
        // deviceId 在接入层是设备业务编码，HistoryWriter 会通过 CatalogService 找到数据库内部设备 id。

        this.history.bufferRobotFrame(deviceId, msg);
        // 1. history 是项目 HistoryWriterService；这里的 deviceId 仍是 robot-01 这类业务编码。
        // 2. 方法内部先通过 CatalogService 找数据库设备 id，再把这一帧的时间和关节值放入 robotBuffer。
        // 3. bufferRobotFrame 只是入队；定时器后来调用 flushRobots 才发数据库 INSERT。
        // 4. 因此网页已经更新，也不能据此断言这一帧已经成功持久保存。

        // 将这帧机器人消息推送给正在订阅对应产线的网页，事件名为 robot_state。
        // 网页收到后更新 useLineData 的 robot，TwinView 再把 joints 交给模型。

        this.gateway.broadcastRobot(lineId, msg);
        // 1. gateway 是项目 TelemetryGateway；它内部使用 Socket.IO 的房间广播 API。
        // 2. lineId 选择 line:line-01 这样的房间；msg 作为 robot_state 事件正文送给已经订阅的连接。
        // 3. 网页 useLineData 的回调更新共享 robot，TwinView 再按需要把 joints 交给模型。
        // 4. 没有正在订阅的网页时，本行不会替新网页保留历史；首屏快照由 Redis 路径另行提供。
      } else if (kind === 'telemetry/io') {
        // 产线 IO(契约 §3.8):高频瞬时量,只走 Redis 快照 + WebSocket,不落 TimescaleDB。
        // 单个点位读失败时值为 null(edge 保证"没读到"不冒充 0),这里整包照收。
        if (!msg.io || typeof msg.io !== 'object' || Array.isArray(msg.io)) {
          this.logger.warn(`io_state 缺少合法 io 对象,已忽略: ${topic}`);
          return;
        }
        this.state.setIoFrame(lineId, msg);
        // 把产线最新 IO 信号帧存入 Redis 并设置有效期。
        this.gateway.broadcastIo(lineId, msg);
        // 向产线房间广播 IO 信号帧。
      // 场景 B：产线状态快照（1Hz，retained）
      } else if (kind === 'telemetry/status') {
        this.state.setLineStatus(lineId, msg);
        // 把产线最新工序和计数状态存入 Redis 并设置有效期。
        this.history.insertLineStatus(lineId, msg);
        // 把产线状态帧写入历史状态表。
        this.gateway.broadcastLineStatus(lineId, msg);
        // 向产线房间广播最新生产状态。
      // 场景 C：生产事件 / 报警（事件触发，低频）
      } else if (kind === 'event') {
        this.history.insertEvent(lineId, msg);
        // 把生产事件写入数据库事件表。
        this.gateway.broadcastEvent(lineId, msg);
        // 向产线房间广播生产事件。
      // 场景 D：边缘采集器在线状态（retained + LWT，极低频）
      } else if (kind === 'edge/status') {
        this.state.setEdgeStatus(lineId, msg);
        // 更新边缘采集器在线状态缓存。
        this.gateway.broadcastEdge(lineId, msg);
        // 向产线房间广播边缘采集器在线状态。
      // 场景 E：控制指令回执（每条指令一次）
      } else if (kind === 'cmd_ack') {
        this.history.ackCommand(msg);
        // 1. cmd_ack 主题进入这里时，msg.cmdId 对应原 control_commands.idempotency_key。
        // 2. ackCommand 用 SQL 条件更新仍为 pending/sent 的记录；终态保护发生在数据库更新阶段。
        // 3. 下一行仍独立广播给网页，所以数据库没匹配到行不等于整条回执在所有路径都被丢弃。
        this.gateway.broadcastCommandAck(lineId, msg);
        // 向产线房间广播控制指令回执。
      }
    } catch (e) {
      // 兜底 try/catch：任何一处理路抛错都不应让 MQTT 客户端崩溃
      this.logger.error(`报文处理失败 ${topic}: ${(e as Error).message}`);
    }
  }
}
