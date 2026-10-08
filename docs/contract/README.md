# 数据契约 v1

本文件是**边缘采集层、云端后端、前端**三方之间唯一的数据约定。所有代码只依赖本契约;
PLC 寄存器、视觉软件输出等现场细节,由边缘采集适配器负责翻译成本契约格式。

**修改规则:只增字段,不改名、不删字段。** 破坏性变更必须升级主题版本号(见文末)。

## 1. 通用约定

- 传输:MQTT over TLS(本地开发可用明文 1883 端口)
- 报文编码:UTF-8 JSON
- 时间戳 `ts`:Unix 毫秒(epoch ms),由**产生方(边缘)**打
- 单位:角度 = 度(deg),长度 = 毫米(mm),时长 = 毫秒(ms),计数 = pcs
- 字段命名:camelCase;主题中的 id:kebab-case
- 主题中的 `{lineId}` / `{deviceId}` 与数据库 `production_lines.code` / `devices.code` 一致

## 2. 主题总览

| 主题 | 方向 | QoS | Retain | 频率 | 说明 |
|---|---|---|---|---|---|
| `tl/v1/{lineId}/telemetry/robot/{deviceId}` | 边缘→云 | 0 | 否 | 5~10Hz | 机器人关节与运行状态 |
| `tl/v1/{lineId}/telemetry/status` | 边缘→云 | 1 | 是 | 1Hz 或变更时 | 产线状态快照 |
| `tl/v1/{lineId}/event` | 边缘→云 | 1 | 否 | 事件触发 | 启停 / 报警 / 单件完成等 |
| `tl/v1/{lineId}/vision/result` | 边缘→云 | 1 | 否 | 每件一次 | 视觉检测元数据(**不含图片**) |
| `tl/v1/{lineId}/edge/status` | 边缘→云 | 1 | 是 | 连接/断开时 | 边缘在线状态(LWT) |
| `tl/v1/{lineId}/cmd/{deviceId}` | 云→边缘 | 1 | 否 | 人工触发 | 控制指令(白名单) |
| `tl/v1/{lineId}/cmd_ack` | 边缘→云 | 1 | 否 | 每指令一次 | 指令回执 |

## 3. 报文定义

### 3.1 robot_state — 机器人遥测

```json
{
  "ts": 1760000000123,
  "deviceId": "robot-01",
  "joints": [10.2, -35.0, 42.1, 0.5, 88.0, 12.3],
  "tcp": [512.3, -120.5, 388.0, 179.9, 0.2, 45.0],
  "speedPct": 80,
  "mode": "auto",
  "program": "PICK_A",
  "alarmCode": 0
}
```

| 字段 | 类型 | 单位 | 说明 |
|---|---|---|---|
| ts | number | ms | 采集时间戳 |
| deviceId | string | - | 机器人设备编码 |
| joints | number[6] | deg | J1~J6 关节角,**必填** |
| tcp | number[6] \| null | mm / deg | TCP 位姿 [x,y,z,rx,ry,rz],现场若无此数据填 null |
| speedPct | number | % | 速度倍率 0~100 |
| mode | string | - | manual / auto / remote / error |
| program | string | - | 当前程序名 |
| alarmCode | number | - | 0 = 无报警 |

### 3.2 line_status — 产线状态快照(retained)

```json
{
  "ts": 1760000000123,
  "lineId": "line-01",
  "state": "running",
  "productCode": "P-1001",
  "goodCount": 1024,
  "ngCount": 3,
  "beatMs": 8500
}
```

state 枚举:running / idle / alarm / offline。retained 消息,新订阅者立即可读到最新值。

### 3.3 event — 事件/报警

```json
{
  "ts": 1760000000123,
  "lineId": "line-01",
  "deviceId": "plc-01",
  "type": "alarm",
  "level": "warning",
  "code": "W201",
  "message": "气源压力偏低",
  "payload": {}
}
```

type 枚举:start / stop / alarm / piece_done / changeover / custom。
level 枚举:info / warning / critical。`code` 为厂商报警码,可空。

### 3.4 vision_result — 视觉检测元数据

```json
{
  "ts": 1760000000123,
  "lineId": "line-01",
  "cameraId": "cam-01",
  "sn": "SN20261008000123",
  "result": "ng",
  "defects": [{ "type": "scratch", "x": 120, "y": 88, "w": 34, "h": 12 }],
  "imageUrl": "https://oss.example.com/vision/2026/10/08/xxx.jpg",
  "thumbUrl": "https://oss.example.com/vision/2026/10/08/xxx_thumb.jpg"
}
```

defects 坐标为像素(原图坐标系)。图片链路未接通时 imageUrl/thumbUrl 为 null,
由后端在图片上传后补全(见第 4 节)。

### 3.5 edge/status — 边缘在线状态(retained + LWT)

```json
{ "ts": 1760000000123, "lineId": "line-01", "status": "online" }
```

边缘连接成功后 retained 发布 `online`;同时向 Broker 注册遗嘱消息(LWT),
异常掉线时 Broker 自动发布 `offline` —— **产线离线状态由此自动产生,无需心跳轮询**。

### 3.6 command — 控制指令(云→边缘)

```json
{
  "cmdId": "3f6b1c2e-9a4d-4e2f-8b7a-1c0d2e3f4a5b",
  "ts": 1760000000123,
  "lineId": "line-01",
  "deviceId": "plc-01",
  "type": "reset",
  "params": {},
  "operator": "zhangsan"
}
```

type 为**指令白名单**:start / stop / reset / changeover。不提供任意写寄存器的能力。
`cmdId` 即数据库 `control_commands.idempotency_key`,全链路幂等与审计都靠它。

### 3.7 command_ack — 指令回执(边缘→云)

```json
{ "cmdId": "3f6b1c2e-9a4d-4e2f-8b7a-1c0d2e3f4a5b", "ts": 1760000000456, "status": "acked", "message": "" }
```

status 枚举:acked / rejected / failed。云端侧完整状态机:
`pending → sent → acked / rejected / failed / timeout`(见 `control_commands` 表,15s 无回执置 timeout)。

## 4. 图片链路约定

图片二进制**不走 MQTT**。流程:

1. 视觉侧 `HTTP POST /api/vision/images`(multipart:图片文件 + sn + cameraId + result + ts)
2. 后端存对象存储(MinIO/OSS),写 `vision_images` 表,补全 imageUrl / thumbUrl
3. 后端经 WebSocket 向前端推送"新图通知"(含 URL),前端按需拉取
4. MQTT 的 `vision/result` 用于实时事件流与时间对齐;两边以 **sn + ts** 关联

建议同时存原图与 web 尺寸图,并配置保留策略(如原图保留 30 天)。

## 5. 控制链路约定

1. 前端 → 后端 REST(带 JWT)
2. 后端:校验角色(`api:command:execute`)+ 产线数据权限(`user_line_scope`)
   → 写 `control_commands`(pending)→ publish cmd(置 sent)
3. 边缘:收到 cmd → 写入 PLC(**PLC 自身联锁逻辑拥有最终否决权**)→ publish cmd_ack
4. 后端:收到 ack 更新状态;15s 无 ack 置 timeout
5. 全流程落 `audit_logs`。**急停为硬件回路,不在本系统范围内,网页永远不做急停。**

## 6. 现场切换(mock → 真实)

- 现场只需实现真实采集器(如 `edge/plc_collector.py`)替换 `mock_collector.py`,**本契约不变**,
  云端、前端、数据库零改动
- 采集器为**配置驱动**:读 `register-mapping.csv`(信号 → 协议地址),轮询 PLC 后组装为本契约报文;
  到现场与电气工程师对点位后填正式映射表,不改代码
- 模板见同目录 `register-mapping.template.csv`;视觉结果不经 PLC,由视觉工控机直接产生

## 7. 版本策略

主题统一前缀 `tl/v1/`。破坏性变更(删字段 / 改语义)时升级 `v2` 并行运行,灰度切换。
新增可选字段不算破坏性变更,直接在本文档追加。
