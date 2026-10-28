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

# 运行在工控机的现场采集与控制入口；main() 创建 PLC、MQTT 客户端后进入持续读取循环。
# 上行按 _read_csv → Plc.read_all → decode_signal → group_signals/io_payload/line_status_payload → publish 阅读。
# 下行由 on_command 注册 MQTT 回调，再经 _dispatch_cmd → _write_cmd 写 PLC，最后发送带原 cmdId 的回执。
# pymodbus 负责 Modbus 请求，paho-mqtt 负责 Broker 连接；本文件负责点表解释、报文组装和业务分发。
# PLC_POLL_MS 默认目标周期为 200ms；实际周期受读取和重试影响。正常写响应不等于物理动作完成。

import csv
import json
import logging
import os
import struct
import sys
import threading
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
                                # 将输入转换为文本，供日志或消息正文使用。

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
# 写命令点位(name 以 cmd. 开头),与读取点位分流,只给 _dispatch_cmd 用。

# 单实例锁文件:同一台机器**只允许一个采集器**。
#   原因:PLC 的 MB_SERVER 只接受 1 条 Modbus TCP 连接,第二个采集器永远连不上;
#   而且两个采集器用同一个 MQTT client_id 会互相把对方踢下线(见 make_mqtt),
#   结果是「状态偶尔能上、指令永远收不到」——2026-10-23 实测踩过。
#   所以这里用**文件独占锁**做硬保证:拿不到锁就直接退出,不去抢 PLC 也不去踢 MQTT。
LOCK_FILE = Path(os.getenv("COLLECTOR_LOCK_FILE",
                           str(Path(__file__).with_name(".plc_collector.lock"))))

# main 启动时尝试持有独占文件锁，避免同一采集入口同时运行多个实例。
# 返回的句柄必须保持到进程结束；返回 None 时由 main 决定退出，不把锁文件存在本身当成进程仍在运行。
def acquire_single_instance_lock(path: Path):
    """拿独占锁;拿不到说明已经有采集器在跑 → 返回 None(调用方应退出)。

    Windows 用 msvcrt.locking,Linux/macOS 用 fcntl.flock。
    锁随进程退出自动释放(文件句柄被关闭),不会留下"死锁"。
    """
    try:
        fh = path.open("a+b")
    except OSError as exc:
        LOG.warning("锁文件打不开(%s),不启用单实例保护", exc)
        # 记录本次异常或状态的警告日志。
        return None
    try:
        if os.name == "nt":
        # 检查os.name == "nt":，按判断结果进入对应的处理分支。
            import msvcrt
            fh.seek(0)
            # 把文件读写位置移动到指定偏移处。
            if fh.tell() == 0:
            # 检查fh.tell() == 0:，按判断结果进入对应的处理分支。
                fh.write(b"0")
                # 把本行提供的内容写到已打开的文件或通信目标。
                fh.flush()
            fh.seek(0)
            # 把文件读写位置移动到指定偏移处。
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

# main 把点表路径交给这里，得到周期读取使用的 Signal 列表。
# csv.DictReader 读取字段；cmd.* 点另外登记到 _cmd_signals，供下行查找，不进入上行周期读取。
def _read_csv(path: Path) -> list[Signal]:
    """读取点位表;支持 # 开头的注释行;缺失/格式错的行打 warning 跳过,不致命。
    name 以 "cmd." 开头的为写命令点位,单独存到 _cmd_signals(不进主循环读取)。"""
    sigs: list[Signal] = []
    _cmd_signals.clear()
    # 清空集合、映射或缓存中的现有条目。
    # 点位表不存在 → 致命（没有点位就什么都采不了）
    if not path.exists():
    # 检查not path.exists():，按判断结果进入对应的处理分支。
        LOG.error("点位表不存在: %s", path)
        return sigs
    # 跳过以 # 开头的注释行(以及空行),保留真正的表头和数据
    with path.open("r", encoding="utf-8-sig", newline="") as f:
    # 按指定模式打开文件。
        lines = [ln for ln in f
                 if ln.strip() and not ln.lstrip().startswith("#")]
                 # 检查ln.strip() and not ln.lstrip().startswith("#")]，按判断结果进入对应的处理分支。
    reader = csv.DictReader(lines)
    # 必需的列。缺了就无法解析，直接退出
    required = {"name", "address", "type"}
    if not required.issubset(reader.fieldnames or []):
    # 检查not required.issubset(reader.fieldnames or []):，按判断结果进入对应的处理分支。
        LOG.error("点位表缺少必需列(需要 %s),实际: %s",
                  sorted(required), reader.fieldnames)
                  # 把当前集合按指定规则排序并返回新列表。
        return sigs
    # 从第 2 行开始（start=2 是因为表头占了第 1 行，报错时行号才对得上）
    for line_no, row in enumerate(reader, start=2):
    # 循环处理line_no, row in enumerate(reader, start=2):，按判断结果进入对应的处理分支。
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
            # 检查cnt is None:，按判断结果进入对应的处理分支。
                LOG.warning("L%d 未知类型 %s,跳过", line_no, t)
                # 记录本次异常或状态的警告日志。
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
            # 检查name.startswith("cmd."):，按判断结果进入对应的处理分支。
                _cmd_signals[name] = sig
            else:
                sigs.append(sig)
        except Exception as exc:
            # 单行解析失败只打 warning，不影响其它点位（现场改表时容错很重要）
            LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)
            # 记录本次异常或状态的警告日志。
    LOG.info("已加载 %d 个读点位 + %d 个写点位: %s", len(sigs), len(_cmd_signals), path)
    return sigs

# decode_signal 在处理跨两个 word 的数值时调用这里，按 PLC_WORD_ORDER 拼成无符号 32 位整数。
# word 顺序是解码约定，不是 MQTT 字段顺序；结果还要按当前信号类型继续解释。
def _words_to_u32(regs: list[int]) -> int:
    """按 PLC_WORD_ORDER 把 2 个 word 合并成 32 位整数。
    BIG   = 高字在前(Modbus 标准,TIA 大端与此一致,默认)
    LITTLE = 低字在前(西门子 DINT 在内存里就是这个顺序)"""
    if PLC_WORD_ORDER == "LITTLE":
    # 检查PLC_WORD_ORDER == "LITTLE":，按判断结果进入对应的处理分支。
        regs = list(reversed(regs))
    return (regs[0] << 16) | regs[1]

# Plc.read_all 把本次响应寄存器数组和当前 Signal 配置交给这里。
# 先按 BOOL/INT/UINT/FLOAT/STRING 解释，再应用相应偏移与缩放；例如 J1 原始整数 250 对应 25 度，缺失值保留为 None。
def decode_signal(regs: list[int], sig: Signal) -> Any:
# 按点表规定的类型解释这次寄存器响应，再应用偏移和缩放，返回业务数值；没有读到值时保留 None。
# regs 是这次 Modbus 响应的寄存器数组；sig 是本点位的 Signal 配置，提供 type、offset、scale 等解释规则。
    """把 Modbus 寄存器值翻译成物理量。Modbus 协议是大端字序(高字在前);
    S7 的 MB_SERVER 默认也是大端;若现场 PLC 用了小端,把 PLC_WORD_ORDER 改 LITTLE。"""
    # 没有读到寄存器 → 返回 None（表示本次读失败/无数据）
    if not regs:
    # 检查not regs:，按判断结果进入对应的处理分支。
        # 未知类型 → None
        return None
    if sig.type in ("INT16", "INT"):
    # 检查sig.type in ("INT16", "INT"):，按判断结果进入对应的处理分支。

        # regs[0] 是原始 16 位字，可能以 0～65535 表示；达到 0x8000 的值减去 0x10000 后才是对应有符号整数。
        # 例如原始 65526 在 INT 分支解释为 -10，再使用点表缩放系数，避免负角度被误读成很大的正数。

        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
        return (raw + sig.offset) * sig.scale
    if sig.type in ("UINT16", "UINT"):
    # 检查sig.type in ("UINT16", "UINT"):，按判断结果进入对应的处理分支。
        return (regs[0] + sig.offset) * sig.scale
    # ---- 布尔 ----
    if sig.type == "BOOL":
    # 检查sig.type == "BOOL":，按判断结果进入对应的处理分支。
        # 寄存器非 0 即为真
        return bool(regs[0])
    if sig.type in ("INT32", "DINT"):
    # 检查sig.type in ("INT32", "DINT"):，按判断结果进入对应的处理分支。
        raw = _words_to_u32(regs)
        # 超过 0x80000000 说明是负数，转成有符号
        if raw >= 0x80000000:
        # 检查raw >= 0x80000000:，按判断结果进入对应的处理分支。
            raw -= 0x100000000
            # 用 0x100000000 更新 raw；-= 表示先计算再赋回。
        return (raw + sig.offset) * sig.scale
    # ---- 32 位无符号整数 ----
    if sig.type == "UINT32":
    # 检查sig.type == "UINT32":，按判断结果进入对应的处理分支。
        raw = _words_to_u32(regs)
        return (raw + sig.offset) * sig.scale
    # ---- 32 位浮点（占 2 个寄存器）----
    if sig.type == "FLOAT32":
    # 检查sig.type == "FLOAT32":，按判断结果进入对应的处理分支。
        # pymodbus 3.x: 用 ModbusClientMixin.convert_from_registers
        # word_order 控制 word 间的字节序(BIG=高字在前,默认;LITTLE=低字在前,西门子 REAL 反向)
        wo = "little" if PLC_WORD_ORDER == "LITTLE" else "big"
        v = ModbusClientMixin.convert_from_registers(
            regs, ModbusClientMixin.DATATYPE.FLOAT32, word_order=wo)
            # 向 Modbus 解码器传入寄存器原值、FLOAT32 类型和字序。
        return (v + sig.offset) * sig.scale
    return None


# ---------- PLC 客户端封装(串行读写、容错) ----------
class Plc:

    # main 创建现场 PLC 客户端；host、port、unit 来自环境配置，pymodbus 实例负责网络请求。
    # 同一 Plc 的锁协调读取与下行写入，减少同一客户端被并发使用；创建对象还没有证明连接成功。
    def __init__(self, host, port, unit_id):
    # 定义 __init__，用于保存 PLC 地址与站号，创建通信客户端和读写互斥锁。
        # PLC 地址信息
        self.host = host
        self.port = port
        self.unit = unit_id
        # pymodbus 客户端。timeout=2 秒 —— 2 秒读不到就当通信异常
        self.cli = ModbusTcpClient(host=host, port=port, timeout=2)
        # MQTT 回调与采集循环位于不同线程，不能并发操作同一个 Modbus 连接。
        self.lock = threading.Lock()
        # 连接状态标记（自己维护，不依赖库的内部状态）
        self.connected = False

    # 主循环和写入路径按需尝试建立 PLC 连接，返回连接状态给调用者。
    # connect 是项目包装；内部客户端 connect 来自 pymodbus，失败由调用路径决定重试或拒绝。
    def connect(self):
    # 定义 connect，用于在互斥锁保护下建立 PLC 连接并更新连接状态。
        with self.lock:
            if not self.cli.connect():
            # 检查not self.cli.connect():，按判断结果进入对应的处理分支。
                self.connected = False
                return False
            self.connected = True
            return True

    def close(self):
    # 定义 close，用于在互斥锁保护下关闭 PLC 连接并清除连接标记。
        with self.lock:
            self.cli.close()
            self.connected = False

    # 每轮采集根据点表依次读取现场寄存器，返回信号名称到已解码值的字典。
    # 当前 s 决定地址和数量，rr 是这一点位的读取响应；错误保留未知值，成功才交给 decode_signal。
    def read_all(self, signals: list[Signal]) -> dict[str, Any]:
    # 读取本轮点表配置的现场信号，将读取响应逐点解码，返回按业务名称组织的结果字典。
    # self 是已有 Plc 客户端；signals 是点表 Signal 列表；返回字典供 group_signals()、io_payload() 等分别组装消息。
        """逐个读取已配置点位，返回本轮采集结果。"""
        # 没连上 → 先尝试连接，失败就直接返回空字典（主循环会 sleep 后重试）
        if not self.connected:
        # 检查not self.connected:，按判断结果进入对应的处理分支。
            if not self.connect():
            # 检查not self.connect():，按判断结果进入对应的处理分支。
                return {}
        # 按 address 排序,合并相邻段
        # 按 address 排序 —— 让同一段的寄存器尽量连续读，减少总线往返
        sigs_sorted = sorted(signals, key=lambda s: s.address)
        # 结果字典：信号名 → 物理量
        values: dict[str, Any] = {}
        try:
            for s in sigs_sorted:
            # 循环处理s in sigs_sorted:，按判断结果进入对应的处理分支。
                # ★ 核心读操作：读保持寄存器（功能码 0x03）
                #   address=起始地址，count=读几个寄存器，slave=从站号
                with self.lock:
                # ★ 核心读操作：读保持寄存器（功能码 0x03）。

                    # 在已有 PLC 连接上读取这一点位，响应保存在 rr，供下面检查错误和提取 registers。
                    # address、count 来自当前点表信号 s；device_id 使用 self.unit，三者共同确定本次向 PLC 读什么。

                    rr = self.cli.read_holding_registers(
                        address=s.address, count=s.count, device_id=self.unit)
                # isError() 表示 Modbus 异常码（地址越界等），不是 Python 异常
                if rr.isError():
                # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
                    LOG.warning("读 %s @%d 失败: %s", s.name, s.address, rr)
                    # 记录本次异常或状态的警告日志。
                    # 该点位记 None（前端看到 null），但继续读后面的点位
                    values[s.name] = None
                    continue
                # 正常读到 → 解码成物理量
                values[s.name] = decode_signal(rr.registers, s)
                # 把本次读回的寄存器按该点位的类型、偏移和缩放解码，保存到本轮采集结果字典。
                # values 是本轮的“信号名称 → 已解码值”字典；s 是当前点表配置；rr.registers 来自 pymodbus 读取响应；decode_signal 是本项目定义的方法。
        except Exception as exc:
            # 通信异常（断线、超时）→ 记错误并把连接标记为断开，下次循环会重连
            LOG.error("PLC 通信异常: %s", exc)
            self.connected = False
        return values

# 主循环把点表和本轮读取结果分组成机器人报文，产线编码、设备编码和产生时间由采集器补入。
# robot.joints[i] 这些点名被归入同一个六轴数组；这里只组装数据，后面的 publish 才通过 MQTT 发送。
def group_signals(signals: list[Signal], values: dict[str, Any]) -> dict:
    """按 'robot' / 'line' 命名空间组装契约 payload。"""
    # 按命名空间分组： {"robot": {...}, "line": {...}}
    grouped: dict[str, dict[str, Any]] = defaultdict(dict)
    for s in signals:
    # 循环处理s in signals:，按判断结果进入对应的处理分支。
        # 取该信号本次的值
        v = values.get(s.name)
        # 按第一个 "." 拆成命名空间和键名
        #   "robot.joints[0]" → ns="robot", key="joints[0]"
        #   "line.goodCount"  → ns="line",  key="goodCount"
        ns, _, key = s.name.partition(".")
        # 没有 "." 的信号名无法归类，跳过
        if not key:
        # 检查not key:，按判断结果进入对应的处理分支。
            continue
        # joints[0] 这种数组下标展开成 list
        # 带下标的键（joints[0]）要展开成数组
        if "[" in key and "]" in key:
        # 检查"[" in key and "]" in key:，按判断结果进入对应的处理分支。
            base, _, idx = key.partition("[")
            idx = int(idx.rstrip("]"))
            grouped[ns].setdefault(base, [None] * 6)[idx] = v
        else:
            # 普通键直接赋值
            grouped[ns][key] = v

    # 组装最终报文。ts 由采集器打（契约规定时间戳由产生方打）
    payload: dict[str, Any] = {"ts": now_ms(), "lineId": LINE_ID}
    # 生成当前毫秒时间戳，作为上行报文的产生时间。

    # 只有采到了 robot.* 的点位，才生成机器人报文
    if "robot" in grouped:
    # 检查"robot" in grouped:，按判断结果进入对应的处理分支。
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

# 主循环从同一轮 values 中抽取 io.* 点位，组装独立 IO 帧。
# IO 字段与机器人关节分别处理，读取失败的 None 在 JSON 中成为 null，不能冒充有效的 0。
def io_payload(signals: list[Signal], values: dict[str, Any]) -> dict | None:
    """产线 IO 快照(契约 §3.8):io.* 命名空间的点位原样透传。

    只发 io.* 前缀的点位;读失败的点值为 None → 前端显示 "—",
    不做 0 兜底(0 对传感器/灯光是有意义的真实值,"没读到"和"确实是 0"必须区分开)。
    一个 io.* 点都没配时返回 None,调用方跳过发布。
    """
    io = {s.name.split(".", 1)[1]: values.get(s.name)
          for s in signals if s.name.startswith("io.")}
          # 循环处理s in signals if s.name.startswith("io.")}，按判断结果进入对应的处理分支。
    if not io:
    # 检查not io:，按判断结果进入对应的处理分支。
        return None
    return {"ts": now_ms(), "lineId": LINE_ID, "io": io}

# 主循环读取 line.state，再用 STATE_MAP 将现场工序整数转成契约字符串。
# 其他生产字段按当前已有点位和默认值组装；没有对应现场读取的默认值不能当成实测指标。
def line_status_payload(values: dict[str, Any]) -> dict:
    # 注意:state 的 0(等待入料)是合法值,不能用 `or 1` 兜底,否则 0 被吞成 1。
    # 现场 17 word 表不提供 productCode / goodCount / ngCount / beatMs,
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

# 为当前上行帧或回执生成毫秒时间戳，随报文一起传输。
# 时间来自运行采集器这台机器；浏览器按帧时间判断停滞时会受两端时钟影响。
def now_ms() -> int:
# 定义 now_ms，用于生成当前毫秒时间戳，作为上行报文的产生时间。
    return int(time.time() * 1000)

# main 在建立客户端前配置本进程日志，统一输出采集、连接与命令处理结果。
# 日志用于观察本进程分支，不能仅由一条启动日志推断整条业务链正常。
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

# main 调用这里创建 paho-mqtt 客户端，配置连接回调与断线在线状态通知。
# connect/loop_start 使用各自库行为；on_command 在后续为同一客户端注册控制主题回调。
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
    # 检查MQTT_USERNAME:，按判断结果进入对应的处理分支。
        c.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        # 设置 MQTT 登录用户名和密码。
    # ★ 遗嘱消息（LWT）：采集器异常掉线时，Broker 自动代发 offline
    #   → 产线离线状态由此自动产生，不需要心跳轮询
    c.will_set(T_EDGE,
    # 配置 MQTT 断线遗嘱消息。
               json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
               # 把 Python 对象编码成 JSON 文本。
               qos=1, retain=True)
    # 建立连接（keepalive 30 秒）
    c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    # 尝试建立网络连接。
    # 启动后台网络线程（不调用 loop_start 就没有收发能力）
    c.loop_start()
    # 启动 Paho MQTT 后台网络线程。
    return c

# 把调用方组装好的 Python 字典编码成 JSON，按主题、QoS 和 retain 参数交给 paho-mqtt。
# 上行机器人帧与命令回执使用各自的投递参数；发布返回不表示后端历史已经保存或设备动作完成。
def publish(c: mqtt.Client, topic: str, payload: dict, qos=0, retain=False):
# 将 payload 编码为 JSON 文本，交给已连接 Broker 的客户端向 topic 发布。
# c 是 paho-mqtt 客户端；topic 是消息主题；qos 和 retain 来自本次调用参数，决定这次消息的投递选项。
    c.publish(topic, json.dumps(payload, ensure_ascii=False), qos=qos, retain=retain)
    # 把已组装的业务报文编码成 JSON，交给 MQTT 客户端向 Broker 发布。
    # c 是 paho-mqtt 客户端，publish 是库方法；topic、payload、qos、retain 由调用方提供；Broker 接收消息不等于数据库保存或设备动作完成。


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
# 现场 17 word 表没有 reset / changeover / alarm_clear 对应寄存器,
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

# 这张映射表解释工序状态，和机器人角度的数值缩放是两条不同的处理分支。
# PLC 现场整数 3 在这里对应 waiting_robot；line_status_payload() 再把契约字符串装入工序状态报文。
# 网页的 lineState.ts 随后把 waiting_robot 显示为“等待机器人完成”并选择色调；中文显示和颜色不在本表里生成。

STATE_MAP = {
# 建立现场工序整数到契约状态字符串的对应关系，供状态报文组装时查找。
# STATE_MAP 的键来自 PLC 工序状态值；例如 3 对应 waiting_robot，中文文案再由前端映射生成。
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

# on_command 解析业务指令后进入这里，将 start、stop、mode_set、conveyor 等映射到配置的控制点。
# 先核对类型和参数，再找到 _cmd_signals 中的地址与值并调用 _write_cmd；未知类型返回拒绝原因。
def _dispatch_cmd(plc: Plc, cmd_type: str, params: dict) -> tuple[bool, str]:
    """返回 (success, message)。False → cmd_ack.status=rejected,True → acked。"""
    spec = CMD_DISPATCH.get(cmd_type)
    if spec is None:
    # 检查spec is None:，按判断结果进入对应的处理分支。
        return False, f'未知指令类型: {cmd_type}'
    sig_name, kind = spec
    if sig_name is None:
    # 检查sig_name is None:，按判断结果进入对应的处理分支。
        # 现场 PLC 点位表里没有这个点位的寄存器 → 明确拒绝,不能假 ack
        return False, f'现场 PLC 无 {cmd_type} 对应寄存器(register-mapping.csv 未开放该点),指令未下发'
    sig = _cmd_signals.get(sig_name)
    if sig is None:
    # 检查sig is None:，按判断结果进入对应的处理分支。
        return False, f'点位 {sig_name} 未在 register-mapping.csv 配置'
    params = params or {}

    if kind == 'pulse':
    # 检查kind == 'pulse':，按判断结果进入对应的处理分支。
        value = 1
    elif kind == 'mode_toggle':
    # 检查kind == 'mode_toggle':，按判断结果进入对应的处理分支。
        act = params.get('action')
        if act not in MODE_TOGGLE_VALUE:
        # 检查act not in MODE_TOGGLE_VALUE:，按判断结果进入对应的处理分支。
            return False, (f'mode_set.params.action 必须是 '
                           f'{list(MODE_TOGGLE_VALUE.keys())},收到 {act!r}')
        value = MODE_TOGGLE_VALUE[act]
    elif kind == 'conveyor':
    # 检查kind == 'conveyor':，按判断结果进入对应的处理分支。
        act = params.get('action')
        if act not in CONVEYOR_VALUE:
        # 检查act not in CONVEYOR_VALUE:，按判断结果进入对应的处理分支。
            return False, (f'conveyor.params.action 必须是 '
                           f'{list(CONVEYOR_VALUE.keys())},收到 {act!r}')
        value = CONVEYOR_VALUE[act]
    else:
        return False, f'未知 kind={kind}'

    return _write_cmd(plc, sig.address, value)

# 下行流程到这里才实际调用 pymodbus 写一个保持寄存器。
# 取得锁并连接后发送 address/value，rr 是写响应；返回正常只说明协议写响应成功，未等待独立的物理完成信号。
def _write_cmd(plc: Plc, address: int, value: int) -> tuple[bool, str]:
# 向指定 PLC 寄存器写入一次值，依据本次 Modbus 响应返回成功标记与失败说明。
# plc 是现场 Plc 对象，address 和 value 已由指令分发及点表确定；返回 True 不单独证明物理动作完成。
    """写 PLC 寄存器(只写一次,不回写 0)。

    2026-10-16 现场确认:停止 / 启动 / 手动模式切换这三个点,PLC 在完成动作后
    会**自己把寄存器置 0**,所以采集器不再做 "写值 → sleep 100ms → 写 0"。
    传送带本来就是电平语义,同样只写一次,值由下一次写入覆盖。
    两个写者抢同一个寄存器反而可能把 PLC 刚写好的 1 覆盖掉。

    plc.connected=False → 直接 rejected,不下发(不假 ack)。
    """
    try:
        with plc.lock:
            if not plc.connected:
            # 检查not plc.connected:，按判断结果进入对应的处理分支。
                LOG.error('PLC 未连接,拒绝下发 addr=%d,value=%d(不假 ack)', address, value)
                return False, 'PLC 未连接,指令未下发'

            # 按已确定的地址和值发出一次 Modbus 写请求，并把响应保存到 rr。
            # 随后检查 rr.isError() 决定返回成功或失败；这一步没有等待独立的现场动作完成信号。

            rr = plc.cli.write_register(address=address, value=value, device_id=plc.unit)
            # 按映射得到的寄存器地址和数值发起 Modbus 写请求，保存 PLC 返回的写响应。
            # plc.cli 是 pymodbus 客户端，write_register 是库方法；address、value 来自已选定的控制点位与动作；plc.unit 是目标站号；这里的 rr 是写响应，不是之前的读取响应。
        if rr.isError():
        # 检查本次 Modbus 写响应是否报错；报错时返回本次寄存器写入失败。
        # rr 是本次 write_register 的写响应，isError() 用于检查协议错误，不是设备物理动作完成信号；isError：判断 Modbus 响应是否携带协议错误
            return False, f'PLC 写寄存器失败: {rr}'
            # rr 是本次 write_register 的写响应，isError() 用于检查协议错误，不是设备物理动作完成信号
        return True, ''
    except Exception as exc:
        return False, f'PLC 通信异常: {exc}'

# main 注册控制主题回调；后续收到匹配消息时才执行内部 _cb，不是在注册时写 PLC。
# 回调解析 JSON、取 cmdId/type/params、分派写入，再原样带回 cmdId；当前没有已执行编号去重表。
def on_command(c: mqtt.Client, plc: Plc):
# 为 MQTT 命令安装接收处理：解析报文、按契约分发、调用现场写入，再发布带编号的回执。
# c 是 MQTT 客户端；plc 是现场连接对象；回调 msg.payload 中的 cmdId 用来对应后端控制记录和网页等待结果。
    """订阅控制指令。校验白名单 → 真写 PLC(PLC 未连则 rejected)→ 回 cmd_ack。
    cmdId 缺失 → 回 rejected;ack 始终回(契约 §3.7)。"""
    # 内部回调函数（paho 的签名：client, userdata, message）
    def _cb(_client, _userdata, msg):
    # 定义 _cb，用于解析收到的控制消息，分派现场写入并组装回执。
        cmd_id, ack_status, ack_msg = '', 'failed', ''
        try:
            # 解析指令 JSON
            cmd = json.loads(msg.payload.decode("utf-8"))
            cmd_id = cmd.get('cmdId') or ''
            cmd_type = cmd.get('type')
            params = cmd.get('params') or {}
            LOG.info('收到指令 type=%s cmdId=%s topic=%s', cmd_type, cmd_id, msg.topic)
            if not cmd_id:
            # 检查not cmd_id:，按判断结果进入对应的处理分支。
                ack_status, ack_msg = 'rejected', 'cmdId 缺失'
            else:
                ok, ack_msg = _dispatch_cmd(plc, cmd_type, params)
                ack_status = 'acked' if ok else 'rejected'
        except Exception as exc:
            LOG.error('处理指令异常: %s', exc)
            ack_status, ack_msg = 'failed', str(exc)
        finally:
        # 执行无论上面操作成功还是失败都需要的清理步骤。
            if cmd_id:
            # 检查cmd_id:，按判断结果进入对应的处理分支。
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
    # 为指定 MQTT 主题注册消息回调函数。
    # 订阅下行指令主题（QoS 1：指令不能丢）
    c.subscribe(T_CMD, qos=1)

# 正式入口先取得单实例锁，再加载点表、创建 PLC/MQTT、注册命令回调，随后循环采集。
# 每轮生成独立机器人、IO 与工序报文，并按目标周期扣除读取耗时后等待；Ctrl+C 等退出路径负责关闭连接。
def main():
# 定义 main，用于读取点位配置并循环采集 PLC，发布遥测、IO、工序与心跳报文。
    # 配置日志
    setup_logging()
    # 配置采集器日志格式和输出级别。

    # ★ 单实例保护:拿不到独占锁 = 已经有一个采集器在跑,直接退出。
    #   PLC 的 MB_SERVER 只接受一条连接,两个采集器必然有一个连不上;
    #   更糟的是同 client_id 会在 Broker 上互踢,导致下行指令收不到。
    lock_fh = acquire_single_instance_lock(LOCK_FILE)
    if lock_fh is None:
    # 检查lock_fh is None:，按判断结果进入对应的处理分支。
        LOG.error("已有采集器在运行(锁 %s 被占用),本进程退出。"
                  "重复起采集器会抢 PLC 连接并互踢 MQTT,不要再起第二个。", LOCK_FILE)
                  # 把重复启动采集器的错误提示和锁文件路径传给日志或异常。
        sys.exit(1)
    LOG.info("单实例锁已获取: %s", LOCK_FILE)

    # 打印关键配置，排障时第一眼就能确认连的是哪台 PLC、哪个 Broker
    LOG.info("PLC: %s:%d  unit=%d  poll=%dms", PLC_HOST, PLC_PORT, PLC_UNIT_ID, PLC_POLL_MS)
    LOG.info("MQTT: %s:%d  line=%s  robot=%s", MQTT_HOST, MQTT_PORT, LINE_ID, ROBOT_ID)

    # 加载点位表
    signals = _read_csv(MAPPING_FILE)
    # 一个点位都没有 → 没法采，直接退出（继续跑也没意义）
    if not signals:
    # 检查not signals:，按判断结果进入对应的处理分支。
        LOG.error("无可用点位,退出。请编辑 %s 后重试。", MAPPING_FILE)
        sys.exit(1)

    # 建立 PLC 连接对象与 MQTT 连接
    plc = Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID)
    mq = make_mqtt()
    # 订阅下行指令
    on_command(mq, plc)
    # 构造 MQTT 控制消息回调，解析指令并发布回执。

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
        # 持续检查True:，按判断结果进入对应的处理分支。
            # 记录本轮开始时间（用于精确控制轮询周期）
            t_loop = time.time()
            # 心跳放在 PLC 读取之前 —— PLC 断线时也要发,否则后端会以为 edge 掉线
            if t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:
            # 检查t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:，按判断结果进入对应的处理分支。
                last_edge_pub = t_loop
                publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
                        qos=1, retain=True)
                LOG.debug("edge 心跳已发")
            # ---- 读 PLC ----

            # 这是持续采集循环中的一轮读取，values 保存本轮各点位已经解释后的值。
            # 机器人报文由 group_signals() 组装；满足组装条件就发布，没有先比较本轮与上一轮关节角是否相同。
            # IO 和工序状态另走各自组装与发布分支，不能把它们画成“同一角度依次翻译成工序再变成 IO”。
            # 目标周期来自配置，读取耗时与重试影响实际间隔；机器人不动也可以持续上报新的同值帧。

            values = plc.read_all(signals)
            # 执行这一轮 PLC 读取，将各信号的已解码值保存到 values，随后分别组装机器人、工序与 IO 消息。
            # values 是本轮业务名称到数值的字典；signals 来自点表；plc.read_all() 不先判断角度是否变化，所以同值新帧也能继续上报。
            # 一个值都没读到 → PLC 没响应，记警告并等 1 秒后重试
            if not values:
            # 检查not values:，按判断结果进入对应的处理分支。
                LOG.warning("PLC 无响应,1s 后重试")
                # 记录本次异常或状态的警告日志。
                time.sleep(1.0)
                # 暂停当前线程指定秒数。
                continue

            # 1) 机器人遥测 (5~10Hz,这里跟随 poll)
            # ---- 1) 机器人遥测 (5~10Hz,这里跟随 poll) ----
            # 按点位表组装成契约 §3.1 的 robot_state 报文
            tele = group_signals(signals, values)
            # 有 deviceId 才说明采到了 robot.* 的点位
            if "deviceId" in tele:
            # 检查"deviceId" in tele:，按判断结果进入对应的处理分支。
                publish(mq, T_ROBOT, tele, qos=0)

            # 2) 产线 IO (跟随 poll;word 11..16,契约 §3.8)
            io_msg = io_payload(signals, values)
            if io_msg is not None:
            # 检查io_msg is not None:，按判断结果进入对应的处理分支。
                publish(mq, T_IO, io_msg, qos=0)

            # ---- 2) 产线状态 (1Hz, retained) ----
            now = time.time()
            # 距离上次发布已超过 1 秒才发
            if now - last_status_pub >= STATUS_PERIOD:
            # 检查now - last_status_pub >= STATUS_PERIOD:，按判断结果进入对应的处理分支。
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
            # 暂停当前线程指定秒数。

    except KeyboardInterrupt:
        # Ctrl+C 退出
        LOG.info("用户中断,退出")
    finally:
    # 执行无论上面操作成功还是失败都需要的清理步骤。
        # ★ 无论怎么退出，都要主动发 offline（正常下线不会触发 LWT）
        publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "offline"},
                qos=1, retain=True)
        # 停网络线程
        mq.loop_stop()
        # 停止 Paho MQTT 后台网络线程。
        # 断开 MQTT
        mq.disconnect()
        # 释放单实例锁(进程退出也会自动释放,这里只是别留文件句柄)
        try:
            lock_fh.close()
        except Exception:
            pass
            # 保留空代码块；这里暂时不执行操作。
        # 关 PLC 连接
        plc.close()


# 程序的直接入口（被 import 时不执行）
if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
    main()
