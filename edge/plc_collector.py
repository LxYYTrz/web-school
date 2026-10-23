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

# 本模块的日志器（名字固定，便于按名过滤）
LOG = logging.getLogger("plc-collector")

# PLC 的 IP 地址。产线局域网内的固定地址
PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")
# Modbus TCP 端口。标准是 502，S7 的 MB_SERVER 常用 503
PLC_PORT        = int(os.getenv("PLC_PORT", "503"))
# 从站号（Modbus unit id）。S7 一般是 2
PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))
# 轮询周期（毫秒）。200ms → 5Hz，符合契约要求的 5~10Hz
PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))
# 32 位类型(INT32/UINT32/DINT/FLOAT32)的字序。
# 默认 BIG = Modbus 标准(高字在前),TIA 大端与此一致;
# 西门子 DINT 在内存里是低字在前,跟 Modbus 冲突,读出来值异常时改 LITTLE。
PLC_WORD_ORDER  = os.getenv("PLC_WORD_ORDER", "BIG").upper()
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

# MQTT 主题(对齐 docs/contract/README.md §2)
# 机器人六轴遥测主题（上行）
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
T_IO     = f"tl/v1/{LINE_ID}/telemetry/io"
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

# 写命令点位(name 以 cmd. 开头),与读取点位分流,只给 _dispatch_cmd 用
# 用字符串注解延后求值(Signal 在本文件下方定义)
_cmd_signals: dict = {}

# 单实例锁文件:同一台机器**只允许一个采集器**。
#   原因:PLC 的 MB_SERVER 只接受 1 条 Modbus TCP 连接,第二个采集器永远连不上;
#   而且两个采集器用同一个 MQTT client_id 会互相把对方踢下线(见 make_mqtt),
#   结果是「状态偶尔能上、指令永远收不到」——2026-10-23 实测踩过。
#   所以这里用**文件独占锁**做硬保证:拿不到锁就直接退出,不去抢 PLC 也不去踢 MQTT。
LOCK_FILE = Path(os.getenv("COLLECTOR_LOCK_FILE",
                           str(Path(__file__).with_name(".plc_collector.lock"))))


def acquire_single_instance_lock(path: Path):
    """拿独占锁;拿不到说明已经有采集器在跑 → 返回 None(调用方应退出)。

    Windows 用 msvcrt.locking,Linux/macOS 用 fcntl.flock。
    锁随进程退出自动释放(文件句柄被关闭),不会留下"死锁"。
    """
    try:
        fh = path.open("a+b")
    except OSError as exc:
        LOG.warning("锁文件打不开(%s),不启用单实例保护", exc)
        return None
    try:
        if os.name == "nt":
            import msvcrt
            fh.seek(0)
            if fh.tell() == 0:
                fh.write(b"0")
                fh.flush()
            fh.seek(0)
            msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        fh.close()
        return None
    return fh  # 必须在整个进程生命周期里持有这个句柄,锁才有效


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
    # 点位表不存在 → 致命（没有点位就什么都采不了）
    if not path.exists():
        LOG.error("点位表不存在: %s", path)
        return sigs
    # 跳过以 # 开头的注释行(以及空行),保留真正的表头和数据
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
                        "INT32": 2, "UINT32": 2, "FLOAT32": 2,
                        # 西门子 DBW/DBD 别名(xls 用这种)
                        "INT": 1, "UINT": 1, "DINT": 2}
            cnt = size_map.get(t)
            # 未知类型 → 跳过这一行（不致命，其它点位照常工作）
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
            # 单行解析失败只打 warning，不影响其它点位（现场改表时容错很重要）
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
    # 没有读到寄存器 → 返回 None（表示本次读失败/无数据）
    if not regs:
        # 未知类型 → None
        return None
    if sig.type in ("INT16", "INT"):
        # Modbus 的寄存器是无符号的：>= 0x8000 视为负数，减去 0x10000 转成有符号
        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
        return (raw + sig.offset) * sig.scale
    if sig.type in ("UINT16", "UINT"):
        return (regs[0] + sig.offset) * sig.scale
    # ---- 布尔 ----
    if sig.type == "BOOL":
        # 寄存器非 0 即为真
        return bool(regs[0])
    if sig.type in ("INT32", "DINT"):
        raw = _words_to_u32(regs)
        # 超过 0x80000000 说明是负数，转成有符号
        if raw >= 0x80000000:
            raw -= 0x100000000
        return (raw + sig.offset) * sig.scale
    # ---- 32 位无符号整数 ----
    if sig.type == "UINT32":
        raw = _words_to_u32(regs)
        return (raw + sig.offset) * sig.scale
    # ---- 32 位浮点（占 2 个寄存器）----
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
        # PLC 地址信息
        self.host = host
        self.port = port
        self.unit = unit_id
        # pymodbus 客户端。timeout=2 秒 —— 2 秒读不到就当通信异常
        self.cli = ModbusTcpClient(host=host, port=port, timeout=2)
        # 连接状态标记（自己维护，不依赖库的内部状态）
        self.connected = False

    def connect(self):
        # connect() 返回布尔值：True 表示 TCP 握手成功
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
        # 没连上 → 先尝试连接，失败就直接返回空字典（主循环会 sleep 后重试）
        if not self.connected:
            if not self.connect():
                return {}
        # 按 address 排序,合并相邻段
        # 按 address 排序 —— 让同一段的寄存器尽量连续读，减少总线往返
        sigs_sorted = sorted(signals, key=lambda s: s.address)
        # 结果字典：信号名 → 物理量
        values: dict[str, Any] = {}
        try:
            for s in sigs_sorted:
                # ★ 核心读操作：读保持寄存器（功能码 0x03）
                #   address=起始地址，count=读几个寄存器，slave=从站号
                rr = self.cli.read_holding_registers(
                    address=s.address, count=s.count, device_id=self.unit)
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


# ---------- 数据契约装配 ----------
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
        # joints[0] 这种数组下标展开成 list
        # 带下标的键（joints[0]）要展开成数组
        if "[" in key and "]" in key:
            base, _, idx = key.partition("[")
            idx = int(idx.rstrip("]"))
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
        payload["deviceId"] = ROBOT_ID
        payload["joints"] = r.get("joints", [None] * 6)
        payload["tcp"]    = r.get("tcp", None)
        payload["speedPct"] = int(r.get("speedPct", 0) or 0)
        # PLC 里的模式是数字，契约要求字符串 → 这里做映射
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
    # client_id 必须唯一（同一时刻两个同 ID 的连接，Broker 会踢掉前一个）
    # ★ 带 PID:万一真起了两个采集器,它们不会在 Broker 上互相踢下线。
    #   （2026-10-23 踩过：两个采集器同 client_id 互踢,表现为"状态偶尔上得来、
    #   下行指令一条也收不到",排查起来极费时间。真正的防线是单实例锁,
    #   这里只是让"万一有两个"不至于互相破坏。）
    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                    client_id=f"plc-edge-{LINE_ID}-{os.getpid()}")
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
# 依据 DB3-Modbus-映射表1.csv「产线状态」枚举(契约 v1.1,见 db/init/004_line_state_stages.sql)
#
# ★ 2026-10-23 按现场给的 DB3-Modbus-映射表1.csv 校正:
#   表里原文是 "3 = 等待机器人" —— 之前误当成「下料中」(unloading)了。
#   现在 3 → waiting_robot(等待机器人完成),4 → unload_done(下料完成)不变。
#   旧契约值 'unloading' 只在历史数据里保留(DB 约束不删,见 005 迁移),
#   采集端不再产出。
STATE_MAP = {
    0:   'waiting_feed',   # 等待入料
    1:   'feeding',        # 入料中
    2:   'assembling',     # 装配中
    3:   'waiting_robot',  # 等待机器人完成
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
    # 内部回调函数（paho 的签名：client, userdata, message）
    def _cb(_client, _userdata, msg):
        cmd_id, ack_status, ack_msg = '', 'failed', ''
        try:
            # 解析指令 JSON
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
                # 回执：cmdId 必须原样带回，后端靠它更新 control_commands 状态
                publish(c, T_ACK, {
                    'cmdId': cmd_id,
                    'ts': now_ms(),
                    'status': ack_status,
                    'message': ack_msg or '',
                }, qos=1)
    # ★ 用 message_callback_add 而不是全局 on_message：
    #   这样以后要加别的订阅主题不会互相覆盖
    c.message_callback_add(T_CMD, _cb)
    # 订阅下行指令主题（QoS 1：指令不能丢）
    c.subscribe(T_CMD, qos=1)


# ---------- 主循环 ----------
def main():
    # 配置日志
    setup_logging()

    # ★ 单实例保护:拿不到独占锁 = 已经有一个采集器在跑,直接退出。
    #   PLC 的 MB_SERVER 只接受一条连接,两个采集器必然有一个连不上;
    #   更糟的是同 client_id 会在 Broker 上互踢,导致下行指令收不到。
    lock_fh = acquire_single_instance_lock(LOCK_FILE)
    if lock_fh is None:
        LOG.error("已有采集器在运行(锁 %s 被占用),本进程退出。"
                  "重复起采集器会抢 PLC 连接并互踢 MQTT,不要再起第二个。", LOCK_FILE)
        sys.exit(1)
    LOG.info("单实例锁已获取: %s", LOCK_FILE)

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

    # 上线声明
    # 上线声明（retained）：后端任何时候订阅都能立刻拿到 online
    publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
            qos=1, retain=True)

    # 上次发产线状态的时间（用于限速到 1Hz）
    last_status_pub = 0.0
    # line_status 1Hz retained —— 契约 §2 规定产线状态是 1Hz
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
            # 记录本轮开始时间（用于精确控制轮询周期）
            t_loop = time.time()
            # 心跳放在 PLC 读取之前 —— PLC 断线时也要发,否则后端会以为 edge 掉线
            if t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:
                last_edge_pub = t_loop
                publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
                        qos=1, retain=True)
                LOG.debug("edge 心跳已发")
            # ---- 读 PLC ----
            values = plc.read_all(signals)
            # 一个值都没读到 → PLC 没响应，记警告并等 1 秒后重试
            if not values:
                LOG.warning("PLC 无响应,1s 后重试")
                time.sleep(1.0)
                continue

            # 1) 机器人遥测 (5~10Hz,这里跟随 poll)
            # ---- 1) 机器人遥测 (5~10Hz,这里跟随 poll) ----
            # 按点位表组装成契约 §3.1 的 robot_state 报文
            tele = group_signals(signals, values)
            # 有 deviceId 才说明采到了 robot.* 的点位
            if "deviceId" in tele:
                publish(mq, T_ROBOT, tele, qos=0)

            # 2) 产线 IO (跟随 poll;word 11..16,契约 §3.8)
            io_msg = io_payload(signals, values)
            if io_msg is not None:
                publish(mq, T_IO, io_msg, qos=0)

            # 3) 产线状态 (1Hz, retained)
            # ---- 2) 产线状态 (1Hz, retained) ----
            now = time.time()
            # 距离上次发布已超过 1 秒才发
            if now - last_status_pub >= STATUS_PERIOD:
                last_status_pub = now
                publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)

            # 4) 报警:alarmCode 变化时上报一次事件
            # (简化:采集者自行维护上一次值;这里留给上层)

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
        # 释放单实例锁(进程退出也会自动释放,这里只是别留文件句柄)
        try:
            lock_fh.close()
        except Exception:
            pass
        # 关 PLC 连接
        plc.close()


# 程序的直接入口（被 import 时不执行）
if __name__ == "__main__":
    main()
