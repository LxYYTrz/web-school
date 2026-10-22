# edge/ — 边缘采集层

> **一句话定位**：整条数据链路的**起点**。把 PLC / 机器人的原始数据
> 翻译成**统一数据契约**（docs/contract/README.md）后，通过 MQTT 发出去。

---

## 1. 它在整体架构中的位置

```
   PLC / 六轴机器人
        │  Modbus TCP / OPC UA / S7
        ▼
   ┌───────────────────────────────────────────┐
   │ edge/  ← 本目录                            │
   │   plc_collector.py    ★现场版★ 读真实寄存器 │
   │   mock_collector.py      开发版 正弦模拟    │
   │   （两者实现同一套契约，云端零改动）         │
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
| `plc_collector.py` | ★★ **真实采集器**（现场用）。Modbus TCP 读 PLC → 按点位表解码 → 组装契约报文 → 发 MQTT。点位由 CSV 驱动，改点位不改代码 |
| `mock_collector.py` | ★ **Mock 采集器**（开发用）。模拟六轴遥测(10Hz)、产线状态(1Hz)、单件完成事件、偶发报警；订阅下行指令并自动回 ack |
| `register-mapping.csv` | **正式点位表**（现场填）。当前 PLC 的实际寄存器地址 |
| `register-mapping.template.csv` | 点位表模板（复制成 register-mapping.csv 后填写） |
| `register-mapping.README.md` | 点位表逐列说明与填写指南 |
| `requirements.txt` | Python 依赖清单（`paho-mqtt` + `pymodbus`） |
| `wheels/` | **离线安装包**。工控机无外网时用 `--no-index` 本地安装 |
| `_plc_smoke.py` | 🔧 现场工具：连通性冒烟测试（试字节序） |
| `_plc_scan.py` | 🔧 现场工具：扫描可读地址段、找数据起点 |
| `_plc_scan2.py` | 🔧 现场工具：四类数据区 + 多 unit id 全面探测 |
| `_plc_read11.py` | 🔧 现场工具：按候选名字/缩放精读 11 个 word |

> `_` 前缀的文件是**现场一次性诊断工具**，不属于运行链路，不参与部署。

---

## 3. 两个采集器怎么切换

用 `scripts\start-local.bat` 的 `COLLECTOR` 环境变量：

```bat
:: 现场（有 PLC）—— 默认
scripts\start-local.bat

:: 开发机（无 PLC）
set COLLECTOR=mock && scripts\start-local.bat
```

两者发出去的 MQTT 主题、JSON 字段、QoS、retain、LWT **完全一致**，
所以切换采集器时 **云端 / 前端 / 数据库 / 契约 全部零改动**。

---

## 4. 三个 MQTT 机制在采集器里的体现

| 机制 | 用在哪 | 为什么 |
|---|---|---|
| **retained** | 产线状态、边缘在线状态 | 后端**晚启动**也能立刻拿到当前状态（不用等下一个上报周期） |
| **LWT（遗嘱）** | 边缘在线状态 | 进程崩溃 / 网线被拔 → Broker 自动发 `offline` → 产线离线状态**自动产生，无需心跳轮询** |
| **QoS** | 机器人帧用 0；状态/事件/指令用 1 | 高频帧丢一帧无所谓；状态和指令不能丢 |

---

## 5. 运行

```bash
pip install -r requirements.txt
python plc_collector.py      # 现场（读 PLC）
python mock_collector.py     # 开发（模拟数据）
```

环境变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PLC_HOST` | 192.168.10.31 | PLC 的 IP |
| `PLC_PORT` | 503 | Modbus TCP 端口（S7 的 MB_SERVER 一般是 503，不是标准 502） |
| `PLC_UNIT_ID` | 2 | 从站号 |
| `PLC_POLL_MS` | 200 | 轮询周期（200ms → 5Hz，符合契约 5~10Hz） |
| `MQTT_HOST` / `MQTT_PORT` | localhost / 1883 | Broker 地址 |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | 空 | 认证凭据 |
| `LINE_ID` | line-01 | 产线编码，**必须与数据库 `production_lines.code` 一致** |
| `ROBOT_ID` | robot-01 | 设备编码，**必须与数据库 `devices.code` 一致** |
| `MAPPING_FILE` | edge/register-mapping.csv | 点位表路径 |

离线安装（工控机无外网）：
```bat
python -m pip install --no-index --find-links=edge\wheels paho-mqtt pymodbus
```

---

## 6. 现场怎么把点位表填对

```
① 跑 _plc_smoke.py    → 确认 Modbus TCP 能通、试出字节序
② 跑 _plc_scan.py     → 扫出可读地址段、找到数据起点
③ 跑 _plc_read11.py   → 按候选名字翻译，和 PLC 程序对照确认
④ 把结论写进 register-mapping.csv（列含义见 register-mapping.README.md）
⑤ 跑 plc_collector.py → 验证：后端快照接口有数据、前端机械臂在动
```

---

## 7. ★ 现场实现时必须注意的四点

1. **正常下线要主动发 `offline`** —— LWT 只在异常断开时触发。
   `plc_collector.py` 已在 `finally` 块里处理；`mock_collector.py` 目前未处理（见其末尾注释）。
2. **字节序** —— Modbus 规定大端字序，S7 的 MB_SERVER 默认也是大端。
   若现场 PLC 用小端，改 `plc_collector.py` 的 `decode_signal()` 里
   `Endian.BIG` → `Endian.BIG_SWAP` / `Endian.LITTLE`。
3. **报警事件尚未上报** —— `plc_collector.py` 目前只发遥测和状态，
   没有在 `alarmCode` 变化时发 `event`（代码里有 TODO 标记），现场需补。
4. **下行指令尚未真正写 PLC** —— `plc_collector.py` 的 `on_command()` 目前是
   mock 式回 ack，真实实现要 `write_register` / `write_coil` + 按 `cmdId` 幂等。
5. **急停不做在软件里** —— 急停必须是硬件回路。
   本系统只提供 `start/stop/reset/changeover` 四个白名单指令。
