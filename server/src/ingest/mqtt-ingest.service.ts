import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, MqttClient } from 'mqtt';
import { config } from '../config/configuration';
import { LineStateService } from '../state/line-state.service';
import { HistoryWriterService } from '../history/history-writer.service';
import { TelemetryGateway } from '../realtime/telemetry.gateway';

// MQTT 消费入口:订阅契约主题 → 解析 → 三路分发
// (Redis 实时快照 / TimescaleDB 历史 / WebSocket 推送)
@Injectable()
export class MqttIngestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttIngestService.name);
  private client: MqttClient;

  constructor(
    private readonly state: LineStateService,
    private readonly history: HistoryWriterService,
    private readonly gateway: TelemetryGateway,
  ) {}

  onModuleInit() {
    const p = config.topicPrefix;
    this.client = connect(config.mqtt.url, {
      clientId: config.mqtt.clientId,
      username: config.mqtt.username,
      password: config.mqtt.password,
      keepalive: 30,
      reconnectPeriod: 2000,
    });
    this.client.on('connect', () => {
      this.logger.log(`MQTT 已连接: ${config.mqtt.url}`);
      this.client.subscribe(
        [
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
    this.client.on('reconnect', () => this.logger.warn('MQTT 重连中...'));
    this.client.on('error', (e) => this.logger.error(`MQTT 错误: ${e.message}`));
    this.client.on('message', (topic, payload) => this.dispatch(topic, payload));
  }

  onModuleDestroy() {
    this.client?.end();
  }

  // 控制指令下发(供 CommandService 调用)
  publishCommand(lineId: string, deviceId: string, cmd: Record<string, unknown>) {
    this.client.publish(
      `${config.topicPrefix}/${lineId}/cmd/${deviceId}`,
      JSON.stringify(cmd),
      { qos: 1 },
    );
  }

  private dispatch(topic: string, payload: Buffer) {
    // 主题结构见数据契约: tl/v1/{lineId}/...
    const seg = topic.split('/');
    const lineId = seg[2];
    const kind = seg.slice(3).join('/');

    let msg: any;
    try {
      msg = JSON.parse(payload.toString('utf8'));
    } catch {
      this.logger.warn(`非 JSON 报文已忽略: ${topic}`);
      return;
    }

    try {
      if (kind.startsWith('telemetry/robot/')) {
        const deviceId = seg[5];
        if (!Array.isArray(msg.joints) || msg.joints.length !== 6) {
          this.logger.warn(`robot_state 缺少合法 joints[6],已忽略: ${topic}`);
          return;
        }
        this.state.setRobotFrame(lineId, deviceId, msg);
        this.history.bufferRobotFrame(deviceId, msg);
        this.gateway.broadcastRobot(lineId, msg);
      } else if (kind === 'telemetry/io') {
        // 产线 IO(契约 §3.8):高频瞬时量,只走 Redis 快照 + WebSocket,不落 TimescaleDB。
        // 单个点位读失败时值为 null(edge 保证"没读到"不冒充 0),这里整包照收。
        if (!msg.io || typeof msg.io !== 'object' || Array.isArray(msg.io)) {
          this.logger.warn(`io_state 缺少合法 io 对象,已忽略: ${topic}`);
          return;
        }
        this.state.setIoFrame(lineId, msg);
        this.gateway.broadcastIo(lineId, msg);
      } else if (kind === 'telemetry/status') {
        this.state.setLineStatus(lineId, msg);
        this.history.insertLineStatus(lineId, msg);
        this.gateway.broadcastLineStatus(lineId, msg);
      } else if (kind === 'event') {
        this.history.insertEvent(lineId, msg);
        this.gateway.broadcastEvent(lineId, msg);
      } else if (kind === 'edge/status') {
        this.state.setEdgeStatus(lineId, msg);
        this.gateway.broadcastEdge(lineId, msg);
      } else if (kind === 'cmd_ack') {
        this.history.ackCommand(msg);
        this.gateway.broadcastCommandAck(lineId, msg);
      }
    } catch (e) {
      this.logger.error(`报文处理失败 ${topic}: ${(e as Error).message}`);
    }
  }
}
