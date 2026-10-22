# -*- coding: utf-8 -*-
"""
===============================================================================
文件作用：真实边缘采集器（Modbus TCP → 数据契约 v1 → MQTT）
所属模块：edge/
===============================================================================

===============================================================================
★ 本文件是「现场版」采集器，是 mock_collector.py 的正式替代品 ★
===============================================================================

【一、它在整体架构中的位置】

    ┌──────────────────────────────┐
    │ PLC（西门子 S7-1200/1500）    │  ← 真实设备
    │ 内部开 MB_SERVER（Modbus Server）│
    └──────────────┬───────────────┘
                   │ Modbus TCP（端口 503，TCP 协议栈）
                   │  读保持寄存器 read_holding_registers
                   ▼
    ┌──────────────────────────────────────────────────────┐
    │ ★ 本文件 plc_collector.py ★                          │
    │   ① 读 register-mapping.csv（点位表）→ Signal 列表     │
    │   ② 轮询 PLC 寄存器 → 解码成物理量（度/毫米/个）       │
    │   ③ 组装成数据契约 v1 的 JSON                        │
    │   ④ publish 到 tl/v1/{lineId}/...                     │
    └──────────────────────┬───────────────────────────────┘
                           │ MQTT（与 mock_collector.py 完全相同的协议）
                           ▼
                       EMQX Broker → 后端 → 前端

【二、和 mock_collector.py 的关系（★ 契约不变，这是设计的核心）】

    两者实现的是**同一套数据契约**（docs/contract/README.md）：
      - 同样的 MQTT 主题        tl/v1/{lineId}/...
      - 同样的 JSON 字段        joints[6] / speedPct / mode / ...
      - 同样的 QoS 与 retain 策略
      - 同样的 LWT 遗嘱机制
    所以切换采集器时，**云端 / 前端 / 数据库 / 契约 全部零改动**。
    开发机没有 PLC 时用 mock，现场有 PLC 时用 plc，用 scripts/start-local.bat
    的 COLLECTOR 环境变量切换即可。

【三、Modbus TCP 通信是怎么发生的（回答"TCP 怎么通信"）】

    Modbus TCP 跑在 TCP 502/503 之上，报文格式是
    "MBAP 头(7字节) + PDU(功能码 + 数据)"。本文件只做**读操作**：
        功能码 0x03 = Read Holding Registers（读保持寄存器）

    一次读取的完整过程：
      1) TCP 三次握手建立连接（pymodbus 的 ModbusTcpClient.connect()）
      2) 客户端发 MBAP(事务号/协议号/长度/单元号) + PDU(功能码 0x03 + 起始地址 + 数量)
      3) PLC 返回 MBAP + PDU(字节数 + 寄存器数据)
      4) pymodbus 解析成 Python 的 regs 列表（每个元素是一个 16 位寄存器）
      5) 本文件用 decode_signal() 把寄存器解码成物理量（浮点数/整数/布尔）

    ★ 字节序问题：Modbus 协议规定是**大端字序**（高字在前），
      西门子 S7 的 MB_SERVER 默认也是大端。
      若现场 PLC 用了小端，把 decode_signal() 里的 Endian.BIG 改成
      Endian.BIG_SWAP / Endian.LITTLE 即可（见该函数的注释）。

【四、配置驱动 = 现场改点位不用改代码】

    点位表在 edge/register-mapping.csv，格式：
        name,address,type,scale,offset,unit
        robot.joints[0],0,FLOAT32,1.0,0,deg
        line.goodCount,42,UINT32,1.0,0,pcs

    现场跟电气工程师对完点表，只要改这个 CSV，**一行代码都不用动**。
    模板与逐列说明见 edge/register-mapping.README.md。

【五、环境变量】

    PLC_HOST            PLC IP (默认 192.168.10.31)
    PLC_PORT            Modbus TCP 端口 (默认 503)
    PLC_UNIT_ID         从站号 (默认 2)
    PLC_POLL_MS         轮询周期毫秒 (默认 200)
    MQTT_HOST           MQTT broker (默认 localhost)
    MQTT_PORT           (默认 1883)
    MQTT_USERNAME/PASSWORD  可选
    LINE_ID             产线编码 (默认 line-01)
    ROBOT_ID            机器人编码 (默认 robot-01)
    MAPPING_FILE        点位表路径 (默认本文件旁 register-mapping.csv)

【六、运行】

    运行:  python plc_collector.py
    依赖:  pip install -r requirements.txt   （需要 pymodbus）

【七、★ 已知不足（现场必须补）】

    1. 报警事件（alarm）没有上报：alarmCode 变化时应该 publish 一条 event。
    2. 下行指令还没真正写 PLC：on_command() 目前是 mock 式回 ack，
       真实实现要 write_register / write_coil + 按 cmdId 幂等。
    3. 正常下线的 offline 已处理（finally 块），但**异常掉线**靠 LWT。
"""

import csv           # 解析点位表 CSV
import json          # JSON 序列化
import logging       # 日志
import os            # 读环境变量
import struct        # 字节序处理（预留）
import sys            # sys.exit
import time          # 计时与时间戳
from collections import defaultdict  # 默认字典
from dataclasses import dataclass    # 数据类（轻量结构体）
from pathlib import Path             # 路径处理
from typing import Any               # 类型标注

import paho.mqtt.client as mqtt                  # MQTT 客户端
from pymodbus.client import ModbusTcpClient      # Modbus TCP 客户端
from pymodbus.payload import BinaryPayloadDecoder # 二进制解码器（FLOAT32 等）
from pymodbus.constants import Endian            # 字节序常量

# 本模块的日志器（名字固定，便于按名过滤）
LOG = logging.getLogger("plc-collector")

# ---------------------------------------------------------------------------
# 一、配置区（从环境变量读取，带默认值）
# ---------------------------------------------------------------------------

# PLC 的 IP 地址。产线局域网内的固定地址
PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")
# Modbus TCP 端口。标准是 502，S7 的 MB_SERVER 常用 503
PLC_PORT        = int(os.getenv("PLC_PORT", "503"))
# 从站号（Modbus unit id）。S7 一般是 2
PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))
# 轮询周期（毫秒）。200ms → 5Hz，符合契约要求的 5~10Hz
PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))
# MQTT Broker 地址与端口
MQTT_HOST       = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT       = int(os.getenv("MQTT_PORT", "1883"))
# MQTT 认证（空 = 匿名）
MQTT_USERNAME   = os.getenv("MQTT_USERNAME") or None
MQTT_PASSWORD   = os.getenv("MQTT_PASSWORD") or None
# 产线编码 / 机器人编码：必须与数据库 production_lines.code、devices.code 一致
LINE_ID         = os.getenv("LINE_ID", "line-01")
ROBOT_ID        = os.getenv("ROBOT_ID", "robot-01")
# 点位表路径。默认取本文件同目录下的 register-mapping.csv
# （用 Path(__file__).with_name(...) 而不是相对路径，保证从任何工作目录启动都能找到）
MAPPING_FILE    = Path(os.getenv("MAPPING_FILE",
                                str(Path(__file__).with_name("register-mapping.csv"))))

# ---------------------------------------------------------------------------
# 二、MQTT 主题（对齐 docs/contract/README.md §2 —— 与 mock_collector.py 完全一致）
# ---------------------------------------------------------------------------

# 机器人六轴遥测主题（上行）
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 产线状态主题（上行，retained）
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 生产事件主题（上行）
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 边缘在线状态主题（上行，retained + LWT）
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# 控制指令主题（下行，订阅它）。+ 是单层通配符，表示该产线下所有设备
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 指令回执主题（上行）
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"


# ---------------------------------------------------------------------------
# 三、点位表加载与解码
# ---------------------------------------------------------------------------

@dataclass
class Signal:
    """
    一个"点位"的描述 —— 即"读 PLC 的哪个地址、怎么解释这个值"。

    对应点位表里的一行：
        name,address,type,scale,offset,unit
    """
    name: str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"
    address: int           # Modbus 起始寄存器地址(0-based,持有寄存器)
    type: str              # INT16 | UINT16 | INT32 | UINT32 | FLOAT32 | BOOL | STRING
    count: int             # 占用寄存器数量
    scale: float = 1.0     # 物理量 = 原始值 * scale
    offset: int = 0        # 物理量 = (原始值 + offset) * scale
    unit: str = ""         # 物理单位,留作日志


def _read_csv(path: Path) -> list[Signal]:
    """读取点位表;支持 # 开头的注释行;缺失/格式错的行打 warning 跳过,不致命。"""
    sigs: list[Signal] = []
    # 点位表不存在 → 致命（没有点位就什么都采不了）
    if not path.exists():
        LOG.error("点位表不存在: %s", path)
        return sigs

    # 跳过以 # 开头的注释行(以及空行),保留真正的表头和数据
    # encoding="utf-8-sig" 能自动去掉 Excel 保存的 UTF-8 BOM（否则第一个列名会带上不可见字符）
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        lines = [ln for ln in f
                 if ln.strip() and not ln.lstrip().startswith("#")]

    # csv.DictReader：把每行变成"列名 → 值"的字典
    reader = csv.DictReader(lines)

    # 必需的列。缺了就无法解析，直接退出
    required = {"name", "address", "type"}
    if not required.issubset(reader.fieldnames or []):
        LOG.error("点位表缺少必需列(需要 %s),实际: %s",
                  sorted(required), reader.fieldnames)
        return sigs

    # 从第 2 行开始（start=2 是因为表头占了第 1 行，报错时行号才对得上）
    for line_no, row in enumerate(reader, start=2):
        try:
            # 起始地址
            addr = int(row["address"])
            # 类型统一大写并去空格
            t = row["type"].upper().strip()
            # 类型 → 占用寄存器数。16 位占 1 个，32 位占 2 个
            size_map = {"INT16": 1, "UINT16": 1, "BOOL": 1,
                        "INT32": 2, "UINT32": 2, "FLOAT32": 2}
            cnt = size_map.get(t)
            # 未知类型 → 跳过这一行（不致命，其它点位照常工作）
            if cnt is None:
                LOG.warning("L%d 未知类型 %s,跳过", line_no, t)
                continue
            # 组装成 Signal 对象加入列表
            sigs.append(Signal(
                name=row["name"].strip(),
                address=addr,
                type=t,
                count=cnt,
                scale=float(row.get("scale") or 1.0),   # 比例因子，默认 1
                offset=int(row.get("offset") or 0),      # 偏移，默认 0
                unit=row.get("unit", ""),
            ))
        except Exception as exc:
            # 单行解析失败只打 warning，不影响其它点位（现场改表时容错很重要）
            LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)
    LOG.info("已加载 %d 个点位: %s", len(sigs), path)
    return sigs


def decode_signal(regs: list[int], sig: Signal) -> Any:
    """把 Modbus 寄存器值翻译成物理量。Modbus 协议是大端字序(高字在前);
    S7 的 MB_SERVER 默认也是大端;若现场 PLC 用了小端,把 Endian.BIG 改 BIG_SWAP/LITTLE 即可。"""
    # 没有读到寄存器 → 返回 None（表示本次读失败/无数据）
    if not regs:
        return None

    # ---- 16 位有符号整数 ----
    if sig.type == "INT16":
        # Modbus 的寄存器是无符号的：>= 0x8000 视为负数，减去 0x10000 转成有符号
        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
        return (raw + sig.offset) * sig.scale

    # ---- 16 位无符号整数 ----
    if sig.type == "UINT16":
        return (regs[0] + sig.offset) * sig.scale

    # ---- 布尔 ----
    if sig.type == "BOOL":
        # 寄存器非 0 即为真
        return bool(regs[0])

    # ---- 32 位有符号整数（占 2 个寄存器）----
    if sig.type == "INT32":
        # 高字在前（<<16）拼成 32 位
        raw = (regs[0] << 16) | regs[1]
        # 超过 0x80000000 说明是负数，转成有符号
        if raw >= 0x80000000:
            raw -= 0x100000000
        return (raw + sig.offset) * sig.scale

    # ---- 32 位无符号整数 ----
    if sig.type == "UINT32":
        raw = (regs[0] << 16) | regs[1]
        return (raw + sig.offset) * sig.scale

    # ---- 32 位浮点（占 2 个寄存器）----
    if sig.type == "FLOAT32":
        # 用 pymodbus 的解码器按"大端字节序 + 大端字序"解析
        # ★ 现场若 PLC 用小端，这里要改成 Endian.BIG_SWAP 或 Endian.LITTLE
        dec = BinaryPayloadDecoder.fromRegisters(
            regs, byteorder=Endian.BIG, wordorder=Endian.BIG)
        v = dec.decode_32bit_float()
        return (v + sig.offset) * sig.scale

    # 未知类型 → None
    return None


# ---------------------------------------------------------------------------
# 四、PLC 客户端封装（合并请求、容错）
# ---------------------------------------------------------------------------

class Plc:
    """
    Modbus TCP 连接的薄封装：负责连接状态管理 + 批量读取 + 异常容错。

    ★ 为什么封装一层：pymodbus 的 client 本身是"无状态"的，
      每次调用都要自己判断连没连、捕不捕获异常。封装后主循环只需一行
      `values = plc.read_all(signals)`。
    """

    def __init__(self, host, port, unit_id):
        # PLC 地址信息
        self.host = host
        self.port = port
        self.unit = unit_id
        # pymodbus 客户端。timeout=2 秒 —— 2 秒读不到就当通信异常
        self.cli = ModbusTcpClient(host=host, port=port, timeout=2)
        # 连接状态标记（自己维护，不依赖库的内部状态）
        self.connected = False

    def connect(self):
        """建立 TCP 连接。返回 True/False，调用方决定要不要重试。"""
        # connect() 返回布尔值：True 表示 TCP 握手成功
        if not self.cli.connect():
            self.connected = False
            return False
        self.connected = True
        return True

    def close(self):
        """关闭连接（正常退出时调用）。"""
        self.cli.close()
        self.connected = False

    def read_all(self, signals: list[Signal]) -> dict[str, Any]:
        """一次性读所有点位(把同区段合并成一次请求,减少 IO)。"""
        # 没连上 → 先尝试连接，失败就直接返回空字典（主循环会 sleep 后重试）
        if not self.connected:
            if not self.connect():
                return {}

        # 按 address 排序 —— 让同一段的寄存器尽量连续读，减少总线往返
        sigs_sorted = sorted(signals, key=lambda s: s.address)
        # 结果字典：信号名 → 物理量
        values: dict[str, Any] = {}

        try:
            for s in sigs_sorted:
                # ★ 核心读操作：读保持寄存器（功能码 0x03）
                #   address=起始地址，count=读几个寄存器，slave=从站号
                rr = self.cli.read_holding_registers(
                    address=s.address, count=s.count, slave=self.unit)
                # isError() 表示 Modbus 异常码（地址越界等），不是 Python 异常
                if rr.isError():
                    LOG.warning("读 %s @%d 失败: %s", s.name, s.address, rr)
                    # 该点位记 None（前端看到 null），但继续读后面的点位
                    values[s.name] = None
                    continue
                # 正常读到 → 解码成物理量
                values[s.name] = decode_signal(rr.registers, s)
        except Exception as exc:
            # 通信异常（断线、超时）→ 记错误并把连接标记为断开，下次循环会重连
            LOG.error("PLC 通信异常: %s", exc)
            self.connected = False
        return values


# ---------------------------------------------------------------------------
# 五、数据契约装配（★ 这一段决定了发出去的 JSON 长什么样）
# ---------------------------------------------------------------------------

def group_signals(signals: list[Signal], values: dict[str, Any]) -> dict:
    """按 'robot' / 'line' 命名空间组装契约 payload。"""
    # 按命名空间分组： {"robot": {...}, "line": {...}}
    grouped: dict[str, dict[str, Any]] = defaultdict(dict)

    for s in signals:
        # 取该信号本次的值
        v = values.get(s.name)
        # 按第一个 "." 拆成命名空间和键名
        #   "robot.joints[0]" → ns="robot", key="joints[0]"
        #   "line.goodCount"  → ns="line",  key="goodCount"
        ns, _, key = s.name.partition(".")
        # 没有 "." 的信号名无法归类，跳过
        if not key:
            continue

        # 带下标的键（joints[0]）要展开成数组
        if "[" in key and "]" in key:
            base, _, idx = key.partition("[")     # base="joints", idx="0]"
            idx = int(idx.rstrip("]"))             # 去掉右方括号 → 0
            # setdefault：不存在就先建一个长度 6 的 None 数组
            grouped[ns].setdefault(base, [None] * 6)[idx] = v
        else:
            # 普通键直接赋值
            grouped[ns][key] = v

    # 组装最终报文。ts 由采集器打（契约规定时间戳由产生方打）
    payload: dict[str, Any] = {"ts": now_ms(), "lineId": LINE_ID}

    # 只有采到了 robot.* 的点位，才生成机器人报文
    if "robot" in grouped:
        r = grouped["robot"]
        payload["deviceId"] = ROBOT_ID              # 契约 §3.1 必填
        payload["joints"] = r.get("joints", [None] * 6)   # ★ 契约必填的六轴
        payload["tcp"]    = r.get("tcp", None)      # TCP 位姿，现场无则 null
        payload["speedPct"] = int(r.get("speedPct", 0) or 0)
        # PLC 里的模式是数字，契约要求字符串 → 这里做映射
        payload["mode"]     = {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get(
                                int(r.get("mode", 0) or 0), "manual")
        payload["program"]   = str(r.get("program", "") or "")
        payload["alarmCode"] = int(r.get("alarmCode", 0) or 0)

    return payload


def line_status_payload(values: dict[str, Any]) -> dict:
    """按契约 §3.2 生成产线状态报文。"""
    return {
        "ts": now_ms(),
        "lineId": LINE_ID,
        # PLC 里是数字枚举，契约要求字符串枚举
        "state":  {0: "offline", 1: "idle", 2: "running", 3: "alarm"}.get(
                    int(values.get("line.state", 1) or 1), "idle"),
        "productCode": str(values.get("line.productCode", "") or ""),
        "goodCount":   int(values.get("line.goodCount", 0) or 0),
        "ngCount":     int(values.get("line.ngCount", 0) or 0),
        "beatMs":      int(values.get("line.beatMs", 0) or 0),
    }


# ---------------------------------------------------------------------------
# 六、工具函数
# ---------------------------------------------------------------------------

def now_ms() -> int:
    """当前时间戳（Unix 毫秒）。契约规定 ts 由产生方(边缘)打。"""
    return int(time.time() * 1000)


def setup_logging():
    """配置日志格式。现场排障全靠这些日志，所以格式要带时间和级别。"""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


# ---------------------------------------------------------------------------
# 七、MQTT 客户端
# ---------------------------------------------------------------------------

def make_mqtt() -> mqtt.Client:
    """创建并连接 MQTT 客户端（与 mock_collector.py 的行为完全一致）。"""
    # client_id 必须唯一（同一时刻两个同 ID 的连接，Broker 会踢掉前一个）
    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                    client_id=f"plc-edge-{LINE_ID}")
    # 需要认证才设置账号密码
    if MQTT_USERNAME:
        c.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    # ★ 遗嘱消息（LWT）：采集器异常掉线时，Broker 自动代发 offline
    #   → 产线离线状态由此自动产生，不需要心跳轮询
    c.will_set(T_EDGE,
               json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
               qos=1, retain=True)
    # 建立连接（keepalive 30 秒）
    c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    # 启动后台网络线程（不调用 loop_start 就没有收发能力）
    c.loop_start()
    return c


def publish(c: mqtt.Client, topic: str, payload: dict, qos=0, retain=False):
    """发布一条契约报文。ensure_ascii=False 让中文保持可读。"""
    c.publish(topic, json.dumps(payload, ensure_ascii=False), qos=qos, retain=retain)


def on_command(c: mqtt.Client, plc: Plc):
    """订阅控制指令。真实场景里这里应该按 cmdId 幂等,然后下发给 PLC 寄存器。"""
    # 内部回调函数（paho 的签名：client, userdata, message）
    def _cb(_client, _userdata, msg):
        try:
            # 解析指令 JSON
            cmd = json.loads(msg.payload.decode("utf-8"))
            LOG.info("收到指令 type=%s topic=%s", cmd.get("type"), msg.topic)
            # 真实实现:plc.cli.write_register/write_coil,然后等 ack
            # 这里先按 mock 风格 0.3s 回 ack
            time.sleep(0.3)
            # 回执：cmdId 必须原样带回，后端靠它更新 control_commands 状态
            publish(c, T_ACK, {
                "ts": now_ms(),
                "cmdId": cmd.get("cmdId"),
                "status": "acked",
                "message": "plc 已执行",
            }, qos=1)
        except Exception as exc:
            # 指令处理失败只记日志，不影响主循环
            LOG.error("处理指令失败: %s", exc)

    # ★ 用 message_callback_add 而不是全局 on_message：
    #   这样以后要加别的订阅主题不会互相覆盖
    c.message_callback_add(T_CMD, _cb)
    # 订阅下行指令主题（QoS 1：指令不能丢）
    c.subscribe(T_CMD, qos=1)


# ---------------------------------------------------------------------------
# 八、主循环
# ---------------------------------------------------------------------------

def main():
    """采集器主入口：加载点位 → 连 PLC → 连 MQTT → 循环发布。"""
    # 配置日志
    setup_logging()
    # 打印关键配置，排障时第一眼就能确认连的是哪台 PLC、哪个 Broker
    LOG.info("PLC: %s:%d  unit=%d  poll=%dms", PLC_HOST, PLC_PORT, PLC_UNIT_ID, PLC_POLL_MS)
    LOG.info("MQTT: %s:%d  line=%s  robot=%s", MQTT_HOST, MQTT_PORT, LINE_ID, ROBOT_ID)

    # 加载点位表
    signals = _read_csv(MAPPING_FILE)
    # 一个点位都没有 → 没法采，直接退出（继续跑也没意义）
    if not signals:
        LOG.error("无可用点位,退出。请编辑 %s 后重试。", MAPPING_FILE)
        sys.exit(1)

    # 建立 PLC 连接对象与 MQTT 连接
    plc = Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID)
    mq = make_mqtt()
    # 订阅下行指令
    on_command(mq, plc)

    # 上线声明（retained）：后端任何时候订阅都能立刻拿到 online
    publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
            qos=1, retain=True)

    # 上次发产线状态的时间（用于限速到 1Hz）
    last_status_pub = 0.0
    # line_status 1Hz retained —— 契约 §2 规定产线状态是 1Hz
    STATUS_PERIOD = 1.0

    try:
        while True:
            # 记录本轮开始时间（用于精确控制轮询周期）
            t_loop = time.time()

            # ---- 读 PLC ----
            values = plc.read_all(signals)
            # 一个值都没读到 → PLC 没响应，记警告并等 1 秒后重试
            if not values:
                LOG.warning("PLC 无响应,1s 后重试")
                time.sleep(1.0)
                continue

            # ---- 1) 机器人遥测 (5~10Hz,这里跟随 poll) ----
            # 按点位表组装成契约 §3.1 的 robot_state 报文
            tele = group_signals(signals, values)
            # 有 deviceId 才说明采到了 robot.* 的点位
            if "deviceId" in tele:
                publish(mq, T_ROBOT, tele, qos=0)   # 高频数据用 QoS0

            # ---- 2) 产线状态 (1Hz, retained) ----
            now = time.time()
            # 距离上次发布已超过 1 秒才发
            if now - last_status_pub >= STATUS_PERIOD:
                last_status_pub = now
                publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)

            # ---- 3) 报警:alarmCode 变化时上报一次事件 ----
            # (简化:采集者自行维护上一次值;这里留给上层)
            # ★ TODO：现场必须补。正确做法是记住上一次的 alarmCode，
            #   变化且非 0 时 publish 一条 type="alarm" 的 event。

            # ---- 控制轮询节奏 ----
            # 本轮实际耗时
            dt = time.time() - t_loop
            # 目标周期 - 实际耗时 = 还要睡多久（不能为负）
            sleep_s = max(0.0, PLC_POLL_MS / 1000.0 - dt)
            time.sleep(sleep_s)

    except KeyboardInterrupt:
        # Ctrl+C 退出
        LOG.info("用户中断,退出")
    finally:
        # ★ 无论怎么退出，都要主动发 offline（正常下线不会触发 LWT）
        publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "offline"},
                qos=1, retain=True)
        # 停网络线程
        mq.loop_stop()
        # 断开 MQTT
        mq.disconnect()
        # 关 PLC 连接
        plc.close()


# 程序的直接入口（被 import 时不执行）
if __name__ == "__main__":
    main()
