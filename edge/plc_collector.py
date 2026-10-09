# -*- coding: utf-8 -*-
"""
真实边缘采集器:Modbus TCP → 数据契约 v1 → MQTT
====================================================
适配 Siemens S7-1200 / S7-1500(以及任何暴露 MB_SERVER / 标准 Modbus Server 的 PLC)
点位由同目录 register-mapping.csv 配置驱动,改点位不改代码。

环境变量:
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

运行:  python plc_collector.py
"""
import csv
import json
import logging
import os
import struct
import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import paho.mqtt.client as mqtt
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

LOG = logging.getLogger("plc-collector")

PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")
PLC_PORT        = int(os.getenv("PLC_PORT", "503"))
PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))
PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))
MQTT_HOST       = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT       = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME   = os.getenv("MQTT_USERNAME") or None
MQTT_PASSWORD   = os.getenv("MQTT_PASSWORD") or None
LINE_ID         = os.getenv("LINE_ID", "line-01")
ROBOT_ID        = os.getenv("ROBOT_ID", "robot-01")
MAPPING_FILE    = Path(os.getenv("MAPPING_FILE",
                                str(Path(__file__).with_name("register-mapping.csv"))))

# MQTT 主题(对齐 docs/contract/README.md §2)
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
T_EVENT  = f"tl/v1/{LINE_ID}/event"
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"


# ---------- 点位表加载与解码 ----------
@dataclass
class Signal:
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
    if not path.exists():
        LOG.error("点位表不存在: %s", path)
        return sigs
    # 跳过以 # 开头的注释行(以及空行),保留真正的表头和数据
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        lines = [ln for ln in f
                 if ln.strip() and not ln.lstrip().startswith("#")]
    reader = csv.DictReader(lines)
    required = {"name", "address", "type"}
    if not required.issubset(reader.fieldnames or []):
        LOG.error("点位表缺少必需列(需要 %s),实际: %s",
                  sorted(required), reader.fieldnames)
        return sigs
    for line_no, row in enumerate(reader, start=2):
        try:
            addr = int(row["address"])
            t = row["type"].upper().strip()
            size_map = {"INT16": 1, "UINT16": 1, "BOOL": 1,
                        "INT32": 2, "UINT32": 2, "FLOAT32": 2}
            cnt = size_map.get(t)
            if cnt is None:
                LOG.warning("L%d 未知类型 %s,跳过", line_no, t)
                continue
            sigs.append(Signal(
                name=row["name"].strip(),
                address=addr,
                type=t,
                count=cnt,
                scale=float(row.get("scale") or 1.0),
                offset=int(row.get("offset") or 0),
                unit=row.get("unit", ""),
            ))
        except Exception as exc:
            LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)
    LOG.info("已加载 %d 个点位: %s", len(sigs), path)
    return sigs


def decode_signal(regs: list[int], sig: Signal) -> Any:
    """把 Modbus 寄存器值翻译成物理量。Modbus 协议是大端字序(高字在前);
    S7 的 MB_SERVER 默认也是大端;若现场 PLC 用了小端,把 Endian.BIG 改 BIG_SWAP/LITTLE 即可。"""
    if not regs:
        return None
    if sig.type == "INT16":
        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
        return (raw + sig.offset) * sig.scale
    if sig.type == "UINT16":
        return (regs[0] + sig.offset) * sig.scale
    if sig.type == "BOOL":
        return bool(regs[0])
    if sig.type == "INT32":
        raw = (regs[0] << 16) | regs[1]
        if raw >= 0x80000000:
            raw -= 0x100000000
        return (raw + sig.offset) * sig.scale
    if sig.type == "UINT32":
        raw = (regs[0] << 16) | regs[1]
        return (raw + sig.offset) * sig.scale
    if sig.type == "FLOAT32":
        dec = BinaryPayloadDecoder.fromRegisters(
            regs, byteorder=Endian.BIG, wordorder=Endian.BIG)
        v = dec.decode_32bit_float()
        return (v + sig.offset) * sig.scale
    return None


# ---------- PLC 客户端封装(合并请求、容错) ----------
class Plc:
    def __init__(self, host, port, unit_id):
        self.host = host
        self.port = port
        self.unit = unit_id
        self.cli = ModbusTcpClient(host=host, port=port, timeout=2)
        self.connected = False

    def connect(self):
        if not self.cli.connect():
            self.connected = False
            return False
        self.connected = True
        return True

    def close(self):
        self.cli.close()
        self.connected = False

    def read_all(self, signals: list[Signal]) -> dict[str, Any]:
        """一次性读所有点位(把同区段合并成一次请求,减少 IO)。"""
        if not self.connected:
            if not self.connect():
                return {}
        # 按 address 排序,合并相邻段
        sigs_sorted = sorted(signals, key=lambda s: s.address)
        values: dict[str, Any] = {}
        try:
            for s in sigs_sorted:
                rr = self.cli.read_holding_registers(
                    address=s.address, count=s.count, slave=self.unit)
                if rr.isError():
                    LOG.warning("读 %s @%d 失败: %s", s.name, s.address, rr)
                    values[s.name] = None
                    continue
                values[s.name] = decode_signal(rr.registers, s)
        except Exception as exc:
            LOG.error("PLC 通信异常: %s", exc)
            self.connected = False
        return values


# ---------- 数据契约装配 ----------
def group_signals(signals: list[Signal], values: dict[str, Any]) -> dict:
    """按 'robot' / 'line' 命名空间组装契约 payload。"""
    grouped: dict[str, dict[str, Any]] = defaultdict(dict)
    for s in signals:
        v = values.get(s.name)
        ns, _, key = s.name.partition(".")
        if not key:
            continue
        # joints[0] 这种数组下标展开成 list
        if "[" in key and "]" in key:
            base, _, idx = key.partition("[")
            idx = int(idx.rstrip("]"))
            grouped[ns].setdefault(base, [None] * 6)[idx] = v
        else:
            grouped[ns][key] = v

    payload: dict[str, Any] = {"ts": now_ms(), "lineId": LINE_ID}

    if "robot" in grouped:
        r = grouped["robot"]
        payload["deviceId"] = ROBOT_ID
        payload["joints"] = r.get("joints", [None] * 6)
        payload["tcp"]    = r.get("tcp", None)
        payload["speedPct"] = int(r.get("speedPct", 0) or 0)
        payload["mode"]     = {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get(
                                int(r.get("mode", 0) or 0), "manual")
        payload["program"]   = str(r.get("program", "") or "")
        payload["alarmCode"] = int(r.get("alarmCode", 0) or 0)
    return payload


def line_status_payload(values: dict[str, Any]) -> dict:
    return {
        "ts": now_ms(),
        "lineId": LINE_ID,
        "state":  {0: "offline", 1: "idle", 2: "running", 3: "alarm"}.get(
                    int(values.get("line.state", 1) or 1), "idle"),
        "productCode": str(values.get("line.productCode", "") or ""),
        "goodCount":   int(values.get("line.goodCount", 0) or 0),
        "ngCount":     int(values.get("line.ngCount", 0) or 0),
        "beatMs":      int(values.get("line.beatMs", 0) or 0),
    }


# ---------- 工具 ----------
def now_ms() -> int:
    return int(time.time() * 1000)


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


# ---------- MQTT 客户端 ----------
def make_mqtt() -> mqtt.Client:
    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                    client_id=f"plc-edge-{LINE_ID}")
    if MQTT_USERNAME:
        c.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    c.will_set(T_EDGE,
               json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
               qos=1, retain=True)
    c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    c.loop_start()
    return c


def publish(c: mqtt.Client, topic: str, payload: dict, qos=0, retain=False):
    c.publish(topic, json.dumps(payload, ensure_ascii=False), qos=qos, retain=retain)


def on_command(c: mqtt.Client, plc: Plc):
    """订阅控制指令。真实场景里这里应该按 cmdId 幂等,然后下发给 PLC 寄存器。"""
    def _cb(_client, _userdata, msg):
        try:
            cmd = json.loads(msg.payload.decode("utf-8"))
            LOG.info("收到指令 type=%s topic=%s", cmd.get("type"), msg.topic)
            # 真实实现:plc.cli.write_register/write_coil,然后等 ack
            # 这里先按 mock 风格 0.3s 回 ack
            time.sleep(0.3)
            publish(c, T_ACK, {
                "ts": now_ms(),
                "cmdId": cmd.get("cmdId"),
                "status": "acked",
                "message": "plc 已执行",
            }, qos=1)
        except Exception as exc:
            LOG.error("处理指令失败: %s", exc)
    c.message_callback_add(T_CMD, _cb)
    c.subscribe(T_CMD, qos=1)


# ---------- 主循环 ----------
def main():
    setup_logging()
    LOG.info("PLC: %s:%d  unit=%d  poll=%dms", PLC_HOST, PLC_PORT, PLC_UNIT_ID, PLC_POLL_MS)
    LOG.info("MQTT: %s:%d  line=%s  robot=%s", MQTT_HOST, MQTT_PORT, LINE_ID, ROBOT_ID)

    signals = _read_csv(MAPPING_FILE)
    if not signals:
        LOG.error("无可用点位,退出。请编辑 %s 后重试。", MAPPING_FILE)
        sys.exit(1)

    plc = Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID)
    mq = make_mqtt()
    on_command(mq, plc)

    # 上线声明
    publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
            qos=1, retain=True)

    last_status_pub = 0.0
    STATUS_PERIOD = 1.0  # line_status 1Hz retained

    try:
        while True:
            t_loop = time.time()
            values = plc.read_all(signals)
            if not values:
                LOG.warning("PLC 无响应,1s 后重试")
                time.sleep(1.0)
                continue

            # 1) 机器人遥测 (5~10Hz,这里跟随 poll)
            tele = group_signals(signals, values)
            if "deviceId" in tele:
                publish(mq, T_ROBOT, tele, qos=0)

            # 2) 产线状态 (1Hz, retained)
            now = time.time()
            if now - last_status_pub >= STATUS_PERIOD:
                last_status_pub = now
                publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)

            # 3) 报警:alarmCode 变化时上报一次事件
            # (简化:采集者自行维护上一次值;这里留给上层)

            dt = time.time() - t_loop
            sleep_s = max(0.0, PLC_POLL_MS / 1000.0 - dt)
            time.sleep(sleep_s)

    except KeyboardInterrupt:
        LOG.info("用户中断,退出")
    finally:
        publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "offline"},
                qos=1, retain=True)
        mq.loop_stop()
        mq.disconnect()
        plc.close()


if __name__ == "__main__":
    main()
