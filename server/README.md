# server/ — 云端后端(NestJS)

最小链路:MQTT 订阅 → 解析数据契约报文 → 三路分发
(**Redis 实时快照** / **TimescaleDB 历史** / **socket.io 推送**),
外加联调用的指令下发接口(白名单 + 审计落库)。

## 启动

```bash
cp .env.example .env        # 按需修改(默认值对应 deploy/ 的开发环境)
npm install
npm run start:dev           # tsx watch;如遇问题改用 npm run build && npm start
```

前置条件:`deploy/` 的基础设施已启动,`edge/` 的 `mock_collector.py` 正在运行。

## 验证(全部基于 mock 数据)

1. **快照接口**
   ```bash
   curl http://localhost:3000/api/lines/line-01/snapshot
   ```
   → 返回产线状态 + 边缘在线状态 + 机器人最新一帧(来自 Redis)

2. **WebSocket**:浏览器打开 `tools/ws-test.html`(需联网加载 socket.io-client CDN)
   → 应滚动看到 `robot_state`(10Hz)、`line_status`(1Hz)、每 8.5s 一条 `vision_result` 与 `event`

3. **指令闭环**(mock 采集器会自动回 ack):
   ```bash
   curl -X POST http://localhost:3000/api/lines/line-01/commands \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"plc-01","type":"reset","operator":"admin"}'
   ```
   → 返回 `{"ok":true,"cmdId":"..."}`;再查库:
   ```sql
   SELECT type, status, acked_at FROM control_commands ORDER BY id DESC LIMIT 1;
   ```
   status 应为 `acked`

4. **历史入库**:
   ```sql
   SELECT count(*) FROM robot_joint_states;   -- 持续增长(10Hz,每秒批量写)
   SELECT * FROM production_events ORDER BY "time" DESC LIMIT 5;
   ```

## 目录

| 文件 | 职责 |
|---|---|
| `src/config/` | 环境变量统一入口 |
| `src/infra/` | PG 连接池 / Redis / 编码映射缓存(code→id,全局模块) |
| `src/ingest/` | MQTT 连接、订阅、报文解析与三路分发;指令 publish |
| `src/state/` | Redis 实时快照(前端首屏数据源) |
| `src/history/` | TimescaleDB 写入(机器人帧 1s 批量;状态/事件/视觉即时) |
| `src/realtime/` | socket.io 推送(按产线分房间)+ 快照 REST |
| `src/command/` | 指令下发(白名单 + `control_commands` 审计) |

## 已知 TODO(按路线图接入)

- 第 4 步:登录 + JWT;WS 订阅与指令接口的 RBAC / `user_line_scope` 校验(当前均无鉴权,仅联调!)
- 第 5 步:`POST /api/vision/images` 图片上传(MinIO),按 sn 补全 `vision_images`
- 第 6 步:指令超时器(15s 无 ack → status=timeout)
- 生产部署:MQTT 走 8883/TLS;CORS 收敛;EMQX 关闭匿名登录
