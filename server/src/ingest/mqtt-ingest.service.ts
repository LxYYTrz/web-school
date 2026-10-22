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
 *   │ edge 采集器  │ ───────────────────▶ │ EMQX Broker  │ (工控机本机)
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
 *     1) TCP 三次握手：采集器 ←→ EMQX 建立字节流连接（1883 明文 / 8883 TLS 加密）
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
import { connect, MqttClient } from 'mqtt'; // mqtt.js 客户端
import { config } from '../config/configuration';          // 统一配置
import { LineStateService } from '../state/line-state.service'; // Redis 快照
import { HistoryWriterService } from '../history/history-writer.service'; // PG 落库
import { TelemetryGateway } from '../realtime/telemetry.gateway'; // WebSocket 网关

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
    private readonly state: LineStateService,      // 第 1 路：Redis 快照
    private readonly history: HistoryWriterService, // 第 2 路：TimescaleDB 历史
    private readonly gateway: TelemetryGateway,     // 第 3 路：WebSocket 推送
  ) {}

  /**
   * 模块初始化钩子：建立 MQTT 连接并订阅主题。
   *
   * 【为什么放在 onModuleInit 而不是构造函数】
   *   构造函数里做异步 IO 拿不到"已连接"的状态，也不好处理失败。
   *   onModuleInit 是 Nest 规定的"模块就绪"钩子，此处启动长连接最合适。
   */
  onModuleInit() {
    // ① 取主题前缀（默认 tl/v1）
    const p = config.topicPrefix;

    // ② 建立连接。connect() 是同步返回客户端对象的，不会阻塞；
    //    真正的连接建立是异步的，靠下面的事件回调感知
    this.client = connect(config.mqtt.url, {
      clientId: config.mqtt.clientId,   // 客户端唯一标识
      username: config.mqtt.username,   // 认证账号（undefined = 匿名）
      password: config.mqtt.password,   // 认证密码
      keepalive: 30,                    // 心跳间隔（秒）：30 秒无流量则发 PINGREQ
      reconnectPeriod: 2000,            // 断线后每 2 秒尝试重连
    });

    // ③ 连接成功事件：此时才能订阅主题
    this.client.on('connect', () => {
      this.logger.log(`MQTT 已连接: ${config.mqtt.url}`);

      // 订阅 5 类主题。数组形式一次性订阅，效率更高。
      // 通配符说明：
      //   +  = 单层通配，匹配恰好一个层级
      //   #  = 多层通配（本系统未使用，避免订阅范围过宽）
      this.client.subscribe(
        [
          `${p}/+/telemetry/robot/+`, // 机器人六轴帧：tl/v1/{line}/telemetry/robot/{device}
          `${p}/+/telemetry/status`,   // 产线状态：  tl/v1/{line}/telemetry/status
          `${p}/+/event`,              // 生产事件：  tl/v1/{line}/event
          `${p}/+/edge/status`,        // 边缘在线：  tl/v1/{line}/edge/status
          `${p}/+/cmd_ack`,            // 指令回执：  tl/v1/{line}/cmd_ack
        ],
        { qos: 1 }, // QoS 1 = 至少送达一次（配合下游幂等设计）
      );
    });

    // ④ 重连中：打 warn 日志，便于运维发现网络抖动
    this.client.on('reconnect', () => this.logger.warn('MQTT 重连中...'));

    // ⑤ 错误事件：记录错误信息（不抛出，避免进程崩溃）
    this.client.on('error', (e) => this.logger.error(`MQTT 错误: ${e.message}`));

    // ⑥ 消息事件：每收到一条报文就调用 dispatch 分发。
    //    这是整个上行链路唯一的"数据入口函数"
    this.client.on('message', (topic, payload) => this.dispatch(topic, payload));
  }

  /**
   * 模块销毁钩子：进程退出时优雅关闭 MQTT 连接。
   * end() 会先发 DISCONNECT 报文再断开 TCP，避免 Broker 误判为异常掉线
   * （异常掉线会触发 LWT，把产线标成 offline）
   */
  onModuleDestroy() {
    this.client?.end();
  }

  /**
   * 控制指令下发（下行链路）。供 CommandService 调用。
   *
   * 【下行数据流】
   *   浏览器 POST /api/lines/line-01/commands
   *     → CommandController → CommandService（校验白名单 + 落审计表）
   *     → 本方法 publish 到 tl/v1/{lineId}/cmd/{deviceId}
   *     → EMQX 转发给订阅了该主题的采集器
   *     → 采集器写 PLC → 回 cmd_ack → 又回到本文件的 dispatch（kind === 'cmd_ack'）
   *
   * @param lineId   产线编码（主题第 2 段）
   * @param deviceId 设备编码（主题最后一段）
   * @param cmd      指令报文，结构见契约 3.5 节
   */
  publishCommand(lineId: string, deviceId: string, cmd: Record<string, unknown>) {
    this.client.publish(
      `${config.topicPrefix}/${lineId}/cmd/${deviceId}`, // 主题：tl/v1/{line}/cmd/{device}
      JSON.stringify(cmd),                               // 载荷：JSON 字符串
      { qos: 1 },                                        // QoS 1
    );
  }

  /**
   * 报文分发（私有方法）：每条 MQTT 消息都会经过这里。
   *
   * @param topic   完整主题，例如 'tl/v1/line-01/telemetry/robot/robot-01'
   * @param payload 原始字节（Buffer）
   */
  private dispatch(topic: string, payload: Buffer) {
    // ---------- 第 1 步：解析主题 ----------
    // 按 '/' 切分：'tl/v1/line-01/telemetry/robot/robot-01'
    //   → ['tl','v1','line-01','telemetry','robot','robot-01']
    const seg = topic.split('/');
    // seg[2] 是产线编码（因为前缀固定是 tl/v1，占了 0 和 1 两段）
    const lineId = seg[2];
    // kind 是主题剩余部分拼接，用来判断消息类型
    const kind = seg.slice(3).join('/');

    // ---------- 第 2 步：解析 JSON 载荷 ----------
    let msg: any;
    try {
      // Buffer → utf8 字符串 → JSON 对象
      msg = JSON.parse(payload.toString('utf8'));
    } catch {
      // 不是合法 JSON：记 warn 并丢弃这一条（不能影响其他消息）
      this.logger.warn(`非 JSON 报文已忽略: ${topic}`);
      return;
    }

    // ---------- 第 3 步：按类型三路分发 ----------
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
        this.state.setRobotFrame(lineId, deviceId, msg);
        // 第 2 路：放进历史缓冲队列（每秒批量写 TimescaleDB）
        this.history.bufferRobotFrame(deviceId, msg);
        // 第 3 路：WebSocket 推送给订阅了该产线房间的浏览器
        this.gateway.broadcastRobot(lineId, msg);

      // 场景 B：产线状态快照（1Hz，retained）
      } else if (kind === 'telemetry/status') {
        this.state.setLineStatus(lineId, msg);       // 第 1 路：Redis
        this.history.insertLineStatus(lineId, msg);  // 第 2 路：PG（当前表 + 历史表）
        this.gateway.broadcastLineStatus(lineId, msg); // 第 3 路：WS

      // 场景 C：生产事件 / 报警（事件触发，低频）
      } else if (kind === 'event') {
        this.history.insertEvent(lineId, msg);  // 事件必须留档，所以直接入库
        this.gateway.broadcastEvent(lineId, msg); // 并推给前端做事件流 + 报警提示
        // 注意：事件**不写 Redis 快照** —— 它是流水，不是"当前状态"

      // 场景 D：边缘采集器在线状态（retained + LWT，极低频）
      } else if (kind === 'edge/status') {
        this.state.setEdgeStatus(lineId, msg);   // 写 Redis 快照（前端顶栏显示"边缘 在线/离线"）
        this.gateway.broadcastEdge(lineId, msg); // 推给前端实时更新小圆点
        // 注意：边缘状态**不入库** —— 它是瞬时状态，历史价值低

      // 场景 E：控制指令回执（每条指令一次）
      } else if (kind === 'cmd_ack') {
        this.history.ackCommand(msg); // 更新 control_commands 的状态（审计闭环）
        // 注意：ack **不推给前端** —— 前端是通过 REST 查询指令状态来获知的
      }
    } catch (e) {
      // 兜底 try/catch：任何一处理路抛错都不应让 MQTT 客户端崩溃
      this.logger.error(`报文处理失败 ${topic}: ${(e as Error).message}`);
    }
  }
}
