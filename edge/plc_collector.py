# -*- coding: utf-8 -*-
"""
真实边缘采集器:Modbus TCP → 数据契约 v1 → MQTT
====================================================
适配 Siemens S7-1200 / S7-1500(以及任何暴露 MB_SERVER / 标准 Modbus Server 的 PLC)
点位由同目录 register-mapping.csv 配置驱动,改点位不改代码。
现场 DB3 HOLD 区 17 word(2026-10-16):word 0..5 关节 / 6 产线状态 /
7..10 控制写点 / 11..16 产线 IO 只读点。

环境变量:
    PLC_HOST            PLC IP (默认 192.168.10.31)
    PLC_PORT            Modbus TCP 端口 (默认 503)
    PLC_UNIT_ID         从站号 (默认 2)
    PLC_POLL_MS         轮询周期毫秒 (默认 200)
    EDGE_HEARTBEAT_S    edge/status 心跳周期秒 (默认 30,需 < 后端 Redis TTL 300)
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
from pymodbus.client.mixin import ModbusClientMixin

LOG = logging.getLogger("plc-collector")

PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")
PLC_PORT        = int(os.getenv("PLC_PORT", "503"))
PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))
PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))
# 32 位类型(INT32/UINT32/DINT/FLOAT32)的字序。
# 默认 BIG = Modbus 标准(高字在前),TIA 大端与此一致;
# 西门子 DINT 在内存里是低字在前,跟 Modbus 冲突,读出来值异常时改 LITTLE。
PLC_WORD_ORDER  = os.getenv("PLC_WORD_ORDER", "BIG").upper()
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
T_IO     = f"tl/v1/{LINE_ID}/telemetry/io"
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
T_EVENT  = f"tl/v1/{LINE_ID}/event"
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"

# 写命令点位(name 以 cmd. 开头),与读取点位分流,只给 _dispatch_cmd 用
# 用字符串注解延后求值(Signal 在本文件下方定义)
_cmd_signals: dict = {}


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
    """读取点位表;支持 # 开头的注释行;缺失/格式错的行打 warning 跳过,不致命。
    name 以 "cmd." 开头的为写命令点位,单独存到 _cmd_signals(不进主循环读取)。"""
    sigs: list[Signal] = []
    _cmd_signals.clear()
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
                        "INT32": 2, "UINT32": 2, "FLOAT32": 2,
                        # 西门子 DBW/DBD 别名(xls 用这种)
                        "INT": 1, "UINT": 1, "DINT": 2}
            cnt = size_map.get(t)
            if cnt is None:
                LOG.warning("L%d 未知类型 %s,跳过", line_no, t)
                continue
            name = row["name"].strip()
            sig = Signal(
                name=name,
                address=addr,
                type=t,
                count=cnt,
                scale=float(row.get("scale") or 1.0),
                offset=int(row.get("offset") or 0),
                unit=row.get("unit", ""),
            )
            # 写命令点位走 _cmd_signals,不进主循环
            if name.startswith("cmd."):
                _cmd_signals[name] = sig
            else:
                sigs.append(sig)
        except Exception as exc:
            LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)
    LOG.info("已加载 %d 个读点位 + %d 个写点位: %s", len(sigs), len(_cmd_signals), path)
    return sigs


def _words_to_u32(regs: list[int]) -> int:
    """按 PLC_WORD_ORDER 把 2 个 word 合并成 32 位整数。
    BIG   = 高字在前(Modbus 标准,TIA 大端与此一致,默认)
    LITTLE = 低字在前(西门子 DINT 在内存里就是这个顺序)"""
    if PLC_WORD_ORDER == "LITTLE":
        regs = list(reversed(regs))
    return (regs[0] << 16) | regs[1]


def decode_signal(regs: list[int], sig: Signal) -> Any:
    """把 Modbus 寄存器值翻译成物理量。Modbus 协议是大端字序(高字在前);
    S7 的 MB_SERVER 默认也是大端;若现场 PLC 用了小端,把 PLC_WORD_ORDER 改 LITTLE。"""
    if not regs:
        return None
    if sig.type in ("INT16", "INT"):
        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
        return (raw + sig.offset) * sig.scale
    if sig.type in ("UINT16", "UINT"):
        return (regs[0] + sig.offset) * sig.scale
    if sig.type == "BOOL":
        return bool(regs[0])
    if sig.type in ("INT32", "DINT"):
        raw = _words_to_u32(regs)
        if raw >= 0x80000000:
            raw -= 0x100000000
        return (raw + sig.offset) * sig.scale
    if sig.type == "UINT32":
        raw = _words_to_u32(regs)
        return (raw + sig.offset) * sig.scale
    if sig.type == "FLOAT32":
        # pymodbus 3.x: 用 ModbusClientMixin.convert_from_registers
        # word_order 控制 word 间的字节序(BIG=高字在前,默认;LITTLE=低字在前,西门子 REAL 反向)
        wo = "little" if PLC_WORD_ORDER == "LITTLE" else "big"
        v = ModbusClientMixin.convert_from_registers(
            regs, ModbusClientMixin.DATATYPE.FLOAT32, word_order=wo)
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
                    address=s.address, count=s.count, device_id=self.unit)
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


def io_payload(signals: list[Signal], values: dict[str, Any]) -> dict | None:
    """产线 IO 快照(契约 §3.8):io.* 命名空间的点位原样透传。

    只发 io.* 前缀的点位;读失败的点值为 None → 前端显示 "—",
    不做 0 兜底(0 对传感器/灯光是有意义的真实值,"没读到"和"确实是 0"必须区分开)。
    一个 io.* 点都没配时返回 None,调用方跳过发布。
    """
    io = {s.name.split(".", 1)[1]: values.get(s.name)
          for s in signals if s.name.startswith("io.")}
    if not io:
        return None
    return {"ts": now_ms(), "lineId": LINE_ID, "io": io}


def line_status_payload(values: dict[str, Any]) -> dict:
    # 注意:state 的 0(等待入料)是合法值,不能用 `or 1` 兜底,否则 0 被吞成 1。
    # 现场 11 word 表不提供 productCode / goodCount / ngCount / beatMs,
    # 这些按契约"只增不改"原则保留字段、输出默认值。
    raw_state = values.get("line.state")
    state = STATE_MAP.get(int(raw_state), "offline") if isinstance(raw_state, (int, float)) else "offline"
    return {
        "ts": now_ms(),
        "lineId": LINE_ID,
        "state": state,
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


# ---------- 控制命令 ----------
# 契约 v1.1 type 白名单(对齐 docs/contract/README.md §3.6)
# sig_name 指向 register-mapping.csv 里的 cmd.* 点位;None 表示契约预留(edge 暂不写)
# kind 只用于校验 params;真正的写入一律"只写一次",PLC 侧自行清零脉冲点(见 _write_cmd)
CMD_DISPATCH = {
    'start':       ('cmd.start',       'pulse'),
    'stop':        ('cmd.stop',        'pulse'),
    'reset':       (None,              'noop'),
    'changeover':  (None,              'noop'),
    'mode_set':    ('cmd.modeToggle',  'mode_toggle'),
    'alarm_clear': (None,              'noop'),
    'conveyor':    ('cmd.conveyor',    'conveyor'),
}
# 现场 11 word 表没有 reset / changeover / alarm_clear 对应寄存器,
# 这三个指令回 rejected 而不是假装 acked —— 避免操作员以为生效了。

# 手动模式切换:PLC word 8,值域 {1,2};PLC 完成模式切换后自动置 0
MODE_TOGGLE_VALUE = {'acquire': 1, 'release': 2}
# 传送带:PLC word 10,值域 {0,1},电平型(持续写值)
CONVEYOR_VALUE = {'stop': 0, 'forward': 1}

# 产线状态:PLC dataDB[6](Modbus word 6)整数 → 契约字符串
# 依据 DB3-Modbus-映射表.xls「产线状态」枚举(契约 v1.1,见 db/init/004_line_state_stages.sql)
STATE_MAP = {
    0:   'waiting_feed',   # 等待入料
    1:   'feeding',        # 入料中
    2:   'assembling',     # 装配中
    3:   'unloading',      # 下料中
    4:   'unload_done',    # 下料完成
    5:   'waiting_next',   # 等待后站入料
    100: 'init_error',     # 初始化错误状态
    101: 'stopped',        # 停止状态
    102: 'manual_mode',    # 手动控制模式
}


def _dispatch_cmd(plc: Plc, cmd_type: str, params: dict) -> tuple[bool, str]:
    """返回 (success, message)。False → cmd_ack.status=rejected,True → acked。"""
    spec = CMD_DISPATCH.get(cmd_type)
    if spec is None:
        return False, f'未知指令类型: {cmd_type}'
    sig_name, kind = spec
    if sig_name is None:
        # 现场 PLC 点位表里没有这个点位的寄存器 → 明确拒绝,不能假 ack
        return False, f'现场 PLC 无 {cmd_type} 对应寄存器(register-mapping.csv 未开放该点),指令未下发'
    sig = _cmd_signals.get(sig_name)
    if sig is None:
        return False, f'点位 {sig_name} 未在 register-mapping.csv 配置'
    params = params or {}

    if kind == 'pulse':
        value = 1
    elif kind == 'mode_toggle':
        act = params.get('action')
        if act not in MODE_TOGGLE_VALUE:
            return False, (f'mode_set.params.action 必须是 '
                           f'{list(MODE_TOGGLE_VALUE.keys())},收到 {act!r}')
        value = MODE_TOGGLE_VALUE[act]
    elif kind == 'conveyor':
        act = params.get('action')
        if act not in CONVEYOR_VALUE:
            return False, (f'conveyor.params.action 必须是 '
                           f'{list(CONVEYOR_VALUE.keys())},收到 {act!r}')
        value = CONVEYOR_VALUE[act]
    else:
        return False, f'未知 kind={kind}'

    return _write_cmd(plc, sig.address, value)


def _write_cmd(plc: Plc, address: int, value: int) -> tuple[bool, str]:
    """写 PLC 寄存器(只写一次,不回写 0)。

    2026-10-16 现场确认:停止 / 启动 / 手动模式切换这三个点,PLC 在完成动作后
    会**自己把寄存器置 0**,所以采集器不再做 "写值 → sleep 100ms → 写 0"。
    传送带本来就是电平语义,同样只写一次,值由下一次写入覆盖。
    两个写者抢同一个寄存器反而可能把 PLC 刚写好的 1 覆盖掉。

    plc.connected=False → 直接 rejected,不下发(不假 ack)。
    """
    if not plc.connected:
        # 不能假 ack:PLC 都没连上,操作员若看到 acked 会以为指令生效了。
        # 与 CMD_DISPATCH 里 reset/changeover/alarm_clear 的处理保持同一原则。
        LOG.error('PLC 未连接,拒绝下发 addr=%d,value=%d(不假 ack)', address, value)
        return False, 'PLC 未连接,指令未下发'
    try:
        rr = plc.cli.write_register(address=address, value=value, device_id=plc.unit)
        if rr.isError():
            return False, f'PLC 写寄存器失败: {rr}'
        return True, ''
    except Exception as exc:
        return False, f'PLC 通信异常: {exc}'


def on_command(c: mqtt.Client, plc: Plc):
    """订阅控制指令。校验白名单 → 真写 PLC(PLC 未连则 rejected)→ 回 cmd_ack。
    cmdId 缺失 → 回 rejected;ack 始终回(契约 §3.7)。"""
    def _cb(_client, _userdata, msg):
        cmd_id, ack_status, ack_msg = '', 'failed', ''
        try:
            cmd = json.loads(msg.payload.decode("utf-8"))
            cmd_id = cmd.get('cmdId') or ''
            cmd_type = cmd.get('type')
            params = cmd.get('params') or {}
            LOG.info('收到指令 type=%s cmdId=%s topic=%s', cmd_type, cmd_id, msg.topic)
            if not cmd_id:
                ack_status, ack_msg = 'rejected', 'cmdId 缺失'
            else:
                ok, ack_msg = _dispatch_cmd(plc, cmd_type, params)
                ack_status = 'acked' if ok else 'rejected'
        except Exception as exc:
            LOG.error('处理指令异常: %s', exc)
            ack_status, ack_msg = 'failed', str(exc)
        finally:
            if cmd_id:
                publish(c, T_ACK, {
                    'cmdId': cmd_id,
                    'ts': now_ms(),
                    'status': ack_status,
                    'message': ack_msg or '',
                }, qos=1)
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
    # edge 心跳:后端把 edge/status 存进 Redis,TTL 只有 300s
    # (server/src/state/line-state.service.ts setEdgeStatus)。
    # edge/status 若只在启动/退出时各发一次,运行满 5 分钟后 Redis key 过期,
    # 前端 snapshot 的 edge 就永久变 null。这里按 EDGE_HEARTBEAT_S 周期重发
    # 上线声明(retain),保活后端的 Redis key。
    EDGE_HEARTBEAT_S = float(os.getenv("EDGE_HEARTBEAT_S", "30"))
    last_edge_pub = time.time()

    try:
        while True:
            t_loop = time.time()
            # 心跳放在 PLC 读取之前 —— PLC 断线时也要发,否则后端会以为 edge 掉线
            if t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:
                last_edge_pub = t_loop
                publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
                        qos=1, retain=True)
                LOG.debug("edge 心跳已发")
            values = plc.read_all(signals)
            if not values:
                LOG.warning("PLC 无响应,1s 后重试")
                time.sleep(1.0)
                continue

            # 1) 机器人遥测 (5~10Hz,这里跟随 poll)
            tele = group_signals(signals, values)
            if "deviceId" in tele:
                publish(mq, T_ROBOT, tele, qos=0)

            # 2) 产线 IO (跟随 poll;word 11..16,契约 §3.8)
            io_msg = io_payload(signals, values)
            if io_msg is not None:
                publish(mq, T_IO, io_msg, qos=0)

            # 3) 产线状态 (1Hz, retained)
            now = time.time()
            if now - last_status_pub >= STATUS_PERIOD:
                last_status_pub = now
                publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)

            # 4) 报警:alarmCode 变化时上报一次事件
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
