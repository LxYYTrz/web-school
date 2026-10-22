# edge/ — 边缘采集层

> **一句话定位**：整条数据链路的**起点**。把 PLC / 机器人的原始数据
> 翻译成**统一数据契约**（docs/contract/README.md）后，通过 MQTT 发出去。

---

## 1. 它在整体架构中的位置

```
   PLC / 六轴机器人
        │  Modbus TCP / OPC UA / S7  （现场协议，未实现）
        ▼
   ┌───────────────────────────────────────────┐
   │ edge/  ← 本目录                            │
   │   mock_collector.py   现在：正弦模拟数据    │
   │   plc_collector.py    现场：读真实寄存器   │
   │   （两者实现同一套契约，云端零改动）        │
   └────────────────┬──────────────────────────┘
                    │ MQTT publish
                    │ 主题：tl/v1/{lineId}/...
                    ▼
              EMQX Broker（工控机本机）
                    │
                    ▼
              server/ 后端订阅
```

**关键设计**：采集器只做"翻译"，不做业务判断、不连数据库。
现场要做的全部工作就是"把寄存器里的数搬进契约的 JSON 里"。

---

## 2. 文件说明

| 文件 | 作用 |
|---|---|
| `mock_collector.py` | ★ **Mock 采集器**（当前实现）。模拟六轴遥测(10Hz)、产线状态(1Hz)、单件完成事件、偶发报警；订阅下行指令并自动回 ack |
| `requirements.txt` | Python 依赖清单（目前只有 `paho-mqtt`） |
| `wheels/` | **离线安装包**（`paho_mqtt-2.1.0-py3-none-any.whl`）。工控机无外网时用 `--no-index` 本地安装 |

---

## 3. 三个 MQTT 机制在采集器里的体现

| 机制 | 用在哪 | 为什么 |
|---|---|---|
| **retained** | 产线状态、边缘在线状态 | 后端**晚启动**也能立刻拿到当前状态（不用等下一个上报周期） |
| **LWT（遗嘱）** | 边缘在线状态 | 进程崩溃 / 网线被拔 → Broker 自动发 `offline` → 产线离线状态**自动产生，无需心跳轮询** |
| **QoS** | 机器人帧用 0；状态/事件/指令用 1 | 高频帧丢一帧无所谓；状态和指令不能丢 |

---

## 4. 运行

```bash
pip install -r requirements.txt
python mock_collector.py
```

环境变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `MQTT_HOST` | localhost | Broker 地址 |
| `MQTT_PORT` | 1883 | Broker 端口（生产 8883/TLS） |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | 空 | 认证凭据 |
| `LINE_ID` | line-01 | 产线编码，**必须与数据库 `production_lines.code` 一致** |
| `ROBOT_ID` | robot-01 | 设备编码，**必须与数据库 `devices.code` 一致** |

离线安装（工控机无外网）：
```bat
python -m pip install --no-index --find-links=edge\wheels paho-mqtt
```

---

## 5. 现场切换到真实采集器

1. 新建 `plc_collector.py`，实现同样的"发布契约报文"逻辑；
2. 读点位用**配置驱动**（`docs/contract/register-mapping.template.csv`），
   现场只要填表、不改代码；
3. 停止 `mock_collector.py`，改跑 `plc_collector.py`。

**云端、前端、数据库、契约全部零改动。** 这就是"契约先行"的价值。

---

## 6. 现场实现时必须注意的两点

1. **正常下线要主动发 `offline`** —— LWT 只在异常断开时触发，
   正常停机时不会发，否则页面会一直显示"在线"。
   （mock 版本目前未实现这点，见 `mock_collector.py` 末尾注释。）
2. **急停不做在软件里** —— 急停必须是硬件回路。
   本系统只提供 `start/stop/reset/changeover` 四个白名单指令。
