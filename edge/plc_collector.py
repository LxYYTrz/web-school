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
# 从 Python 环境 导入 csv，供后续代码使用。 关键字：import＝导入模块或符号。
import json
# 从 Python 环境 导入 json，供后续代码使用。 关键字：import＝导入模块或符号。
import logging
# 从 Python 环境 导入 logging，供后续代码使用。 关键字：import＝导入模块或符号。
import os
# 从 Python 环境 导入 os，供后续代码使用。 关键字：import＝导入模块或符号。
import struct
# 从 Python 环境 导入 struct，供后续代码使用。 关键字：import＝导入模块或符号。
import sys
# 从 Python 环境 导入 sys，供后续代码使用。 关键字：import＝导入模块或符号。
import threading
# 从 Python 环境 导入 threading，供后续代码使用。 关键字：import＝导入模块或符号。
import time
# 从 Python 环境 导入 time，供后续代码使用。 关键字：import＝导入模块或符号。
from collections import defaultdict
# 从 collections 导入 defaultdict，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from dataclasses import dataclass
# 从 dataclasses 导入 dataclass，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pathlib import Path
# 从 pathlib 导入 Path，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from typing import Any
# 从 typing 导入 Any，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

import paho.mqtt.client as mqtt
# 从 Python 环境 导入 paho.mqtt.client as mqtt，供后续代码使用。 关键字：import＝导入模块或符号；as＝为导入或上下文对象命名。
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pymodbus.client.mixin import ModbusClientMixin
# 从 pymodbus.client.mixin 导入 ModbusClientMixin，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

# 本模块的日志器（名字固定，便于按名过滤）
LOG = logging.getLogger("plc-collector")
# 给 LOG 赋值。

# PLC 的 IP 地址。产线局域网内的固定地址
PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")
# 给 PLC_HOST 赋值。
# Modbus TCP 端口。标准是 502，S7 的 MB_SERVER 常用 503
PLC_PORT        = int(os.getenv("PLC_PORT", "503"))
# 给 PLC_PORT 赋值。
# 从站号（Modbus unit id）。S7 一般是 2
PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))
# 给 PLC_UNIT_ID 赋值。
# 轮询周期（毫秒）。200ms → 5Hz，符合契约要求的 5~10Hz
PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))
# 给 PLC_POLL_MS 赋值。
# 32 位类型(INT32/UINT32/DINT/FLOAT32)的字序。
# 默认 BIG = Modbus 标准(高字在前),TIA 大端与此一致;
# 西门子 DINT 在内存里是低字在前,跟 Modbus 冲突,读出来值异常时改 LITTLE。
PLC_WORD_ORDER  = os.getenv("PLC_WORD_ORDER", "BIG").upper()
# 给 PLC_WORD_ORDER 赋值。
# MQTT Broker 地址与端口
MQTT_HOST       = os.getenv("MQTT_HOST", "localhost")
# 给 MQTT_HOST 赋值。
MQTT_PORT       = int(os.getenv("MQTT_PORT", "1883"))
# 给 MQTT_PORT 赋值。
# MQTT 认证（空 = 匿名）
MQTT_USERNAME   = os.getenv("MQTT_USERNAME") or None
# 给 MQTT_USERNAME 赋值。 关键字：or＝逻辑或；None＝空值。
MQTT_PASSWORD   = os.getenv("MQTT_PASSWORD") or None
# 给 MQTT_PASSWORD 赋值。 关键字：or＝逻辑或；None＝空值。
# 产线编码 / 机器人编码：必须与数据库 production_lines.code、devices.code 一致
LINE_ID         = os.getenv("LINE_ID", "line-01")
# 给 LINE_ID 赋值。
ROBOT_ID        = os.getenv("ROBOT_ID", "robot-01")
# 给 ROBOT_ID 赋值。
# 点位表路径。默认取本文件同目录下的 register-mapping.csv
# （用 Path(__file__).with_name(...) 而不是相对路径，保证从任何工作目录启动都能找到）
MAPPING_FILE    = Path(os.getenv("MAPPING_FILE",
# 给 MAPPING_FILE 赋值。
                                str(Path(__file__).with_name("register-mapping.csv"))))
                                # 调用函数或对象方法并传入参数。

# MQTT 主题(对齐 docs/contract/README.md §2)
# 机器人六轴遥测主题（上行）
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 给 T_ROBOT 赋值。
T_IO     = f"tl/v1/{LINE_ID}/telemetry/io"
# 给 T_IO 赋值。
# 产线状态主题（上行，retained）
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 给 T_STATUS 赋值。
# 生产事件主题（上行）
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 给 T_EVENT 赋值。
# 边缘在线状态主题（上行，retained + LWT）
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# 给 T_EDGE 赋值。
# 控制指令主题（下行，订阅它）。+ 是单层通配符，表示该产线下所有设备
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 给 T_CMD 赋值。
# 指令回执主题（上行）
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"
# 给 T_ACK 赋值。

# 写命令点位(name 以 cmd. 开头),与读取点位分流,只给 _dispatch_cmd 用
# 用字符串注解延后求值(Signal 在本文件下方定义)
_cmd_signals: dict = {}
# 给 _cmd_signals 赋值。

# 单实例锁文件:同一台机器**只允许一个采集器**。
#   原因:PLC 的 MB_SERVER 只接受 1 条 Modbus TCP 连接,第二个采集器永远连不上;
#   而且两个采集器用同一个 MQTT client_id 会互相把对方踢下线(见 make_mqtt),
#   结果是「状态偶尔能上、指令永远收不到」——2026-10-23 实测踩过。
#   所以这里用**文件独占锁**做硬保证:拿不到锁就直接退出,不去抢 PLC 也不去踢 MQTT。
LOCK_FILE = Path(os.getenv("COLLECTOR_LOCK_FILE",
# 给 LOCK_FILE 赋值。
                           str(Path(__file__).with_name(".plc_collector.lock"))))
                           # 调用函数或对象方法并传入参数。


def acquire_single_instance_lock(path: Path):
# 定义函数 acquire_single_instance_lock。 关键字：def＝定义 Python 函数。
    """拿独占锁;拿不到说明已经有采集器在跑 → 返回 None(调用方应退出)。

    Windows 用 msvcrt.locking,Linux/macOS 用 fcntl.flock。
    锁随进程退出自动释放(文件句柄被关闭),不会留下"死锁"。
    """
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        fh = path.open("a+b")
        # 给 fh 赋值。
    except OSError as exc:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
        LOG.warning("锁文件打不开(%s),不启用单实例保护", exc)
        # 调用函数或对象方法并传入参数。
        return None
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；None＝空值。
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        if os.name == "nt":
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            import msvcrt
            # 从 Python 环境 导入 msvcrt，供后续代码使用。 关键字：import＝导入模块或符号。
            fh.seek(0)
            # 调用函数或对象方法并传入参数。
            if fh.tell() == 0:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                fh.write(b"0")
                # 调用函数或对象方法并传入参数。
                fh.flush()
                # 调用函数或对象方法并传入参数。
            fh.seek(0)
            # 调用函数或对象方法并传入参数。
            msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
            # 调用函数或对象方法并传入参数。
        else:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
            import fcntl
            # 从 Python 环境 导入 fcntl，供后续代码使用。 关键字：import＝导入模块或符号。
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            # 调用函数或对象方法并传入参数。
    except OSError:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常。
        fh.close()
        # 调用函数或对象方法并传入参数。
        return None
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；None＝空值。
    return fh  # 必须在整个进程生命周期里持有这个句柄,锁才有效
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


# ---------- 点位表加载与解码 ----------
@dataclass
# 装饰器 dataclass：给后面的类、方法或参数附加元数据。
class Signal:
# 定义类 Signal。 关键字：class＝定义类。
    name: str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"
    # 设置字段 name，值为 str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"。
    address: int           # Modbus 起始寄存器地址(0-based,持有寄存器)
    # 设置字段 address，值为 int           # Modbus 起始寄存器地址(0-based,持有寄存器)。
    type: str              # INT16 | UINT16 | INT32 | UINT32 | FLOAT32 | BOOL | STRING
    # 设置字段 type，值为 str              # INT16 | UINT16 | INT32 | UINT32 | FLOAT32 | BOOL | STRING。 关键字：type＝定义类型别名。
    count: int             # 占用寄存器数量
    # 设置字段 count，值为 int             # 占用寄存器数量。
    scale: float = 1.0     # 物理量 = 原始值 * scale
    # 给 scale 赋值。
    offset: int = 0        # 物理量 = (原始值 + offset) * scale
    # 给 offset 赋值。
    unit: str = ""         # 物理单位,留作日志
    # 给 unit 赋值。


def _read_csv(path: Path) -> list[Signal]:
# 定义函数 _read_csv。 关键字：def＝定义 Python 函数。
    """读取点位表;支持 # 开头的注释行;缺失/格式错的行打 warning 跳过,不致命。
    name 以 "cmd." 开头的为写命令点位,单独存到 _cmd_signals(不进主循环读取)。"""
    sigs: list[Signal] = []
    # 给 sigs 赋值。
    _cmd_signals.clear()
    # 调用函数或对象方法并传入参数。
    # 点位表不存在 → 致命（没有点位就什么都采不了）
    if not path.exists():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        LOG.error("点位表不存在: %s", path)
        # 调用函数或对象方法并传入参数。
        return sigs
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    # 跳过以 # 开头的注释行(以及空行),保留真正的表头和数据
    with path.open("r", encoding="utf-8-sig", newline="") as f:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：with＝在资源上下文中执行；as＝为导入或上下文对象命名。
        lines = [ln for ln in f
        # 给 lines 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
                 if ln.strip() and not ln.lstrip().startswith("#")]
                 # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；and＝逻辑与；not＝逻辑否定。
    # csv.DictReader：把每行变成"列名 → 值"的字典
    reader = csv.DictReader(lines)
    # 给 reader 赋值。
    # 必需的列。缺了就无法解析，直接退出
    required = {"name", "address", "type"}
    # 给 required 赋值。 关键字：type＝定义类型别名。
    if not required.issubset(reader.fieldnames or []):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；or＝逻辑或。
        LOG.error("点位表缺少必需列(需要 %s),实际: %s",
        # 调用函数或对象方法并传入参数。
                  sorted(required), reader.fieldnames)
                  # 调用函数或对象方法并传入参数。
        return sigs
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    # 从第 2 行开始（start=2 是因为表头占了第 1 行，报错时行号才对得上）
    for line_no, row in enumerate(reader, start=2):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        try:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
            # 起始地址
            addr = int(row["address"])
            # 给 addr 赋值。
            # 类型统一大写并去空格
            t = row["type"].upper().strip()
            # 给 t 赋值。 关键字：type＝定义类型别名。
            # 类型 → 占用寄存器数。16 位占 1 个，32 位占 2 个
            size_map = {"INT16": 1, "UINT16": 1, "BOOL": 1,
            # 给 size_map 赋值。
                        "INT32": 2, "UINT32": 2, "FLOAT32": 2,
                        # 设置字段 INT32，值为 2, "UINT32": 2, "FLOAT32": 2。
                        # 西门子 DBW/DBD 别名(xls 用这种)
                        "INT": 1, "UINT": 1, "DINT": 2}
                        # 设置字段 INT，值为 1, "UINT": 1, "DINT": 2}。
            cnt = size_map.get(t)
            # 给 cnt 赋值。
            # 未知类型 → 跳过这一行（不致命，其它点位照常工作）
            if cnt is None:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
                LOG.warning("L%d 未知类型 %s,跳过", line_no, t)
                # 调用函数或对象方法并传入参数。
                continue
                # 跳过本轮剩余语句，进入下一次循环。
            name = row["name"].strip()
            # 给 name 赋值。
            sig = Signal(
            # 给 sig 赋值。
                name=name,
                # 给 name 赋值。
                address=addr,
                # 给 address 赋值。
                type=t,
                # 给 type 赋值。 关键字：type＝定义类型别名。
                count=cnt,
                # 给 count 赋值。
                scale=float(row.get("scale") or 1.0),
                # 给 scale 赋值。 关键字：or＝逻辑或。
                offset=int(row.get("offset") or 0),
                # 给 offset 赋值。 关键字：or＝逻辑或。
                unit=row.get("unit", ""),
                # 给 unit 赋值。
            )
            # 结束当前集合、分组或调用参数。
            # 写命令点位走 _cmd_signals,不进主循环
            if name.startswith("cmd."):
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                _cmd_signals[name] = sig
                # 把 sig 的结果赋给 _cmd_signals[name]。
            else:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
                sigs.append(sig)
                # 调用函数或对象方法并传入参数。
        except Exception as exc:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
            # 单行解析失败只打 warning，不影响其它点位（现场改表时容错很重要）
            LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)
            # 调用函数或对象方法并传入参数。
    LOG.info("已加载 %d 个读点位 + %d 个写点位: %s", len(sigs), len(_cmd_signals), path)
    # 调用函数或对象方法并传入参数。
    return sigs
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def _words_to_u32(regs: list[int]) -> int:
# 定义函数 _words_to_u32。 关键字：def＝定义 Python 函数。
    """按 PLC_WORD_ORDER 把 2 个 word 合并成 32 位整数。
    BIG   = 高字在前(Modbus 标准,TIA 大端与此一致,默认)
    LITTLE = 低字在前(西门子 DINT 在内存里就是这个顺序)"""
    if PLC_WORD_ORDER == "LITTLE":
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        regs = list(reversed(regs))
        # 给 regs 赋值。
    return (regs[0] << 16) | regs[1]
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def decode_signal(regs: list[int], sig: Signal) -> Any:
# 定义函数 decode_signal。 关键字：def＝定义 Python 函数。
    """把 Modbus 寄存器值翻译成物理量。Modbus 协议是大端字序(高字在前);
    S7 的 MB_SERVER 默认也是大端;若现场 PLC 用了小端,把 PLC_WORD_ORDER 改 LITTLE。"""
    # 没有读到寄存器 → 返回 None（表示本次读失败/无数据）
    if not regs:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        # 未知类型 → None
        return None
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；None＝空值。
    if sig.type in ("INT16", "INT"):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；in＝遍历键或判断成员。
        # Modbus 的寄存器是无符号的：>= 0x8000 视为负数，减去 0x10000 转成有符号
        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
        # 给 raw 赋值。 关键字：if＝按条件分支；else＝进入另一条件分支。
        return (raw + sig.offset) * sig.scale
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    if sig.type in ("UINT16", "UINT"):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；in＝遍历键或判断成员。
        return (regs[0] + sig.offset) * sig.scale
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    # ---- 布尔 ----
    if sig.type == "BOOL":
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        # 寄存器非 0 即为真
        return bool(regs[0])
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    if sig.type in ("INT32", "DINT"):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；in＝遍历键或判断成员。
        raw = _words_to_u32(regs)
        # 给 raw 赋值。
        # 超过 0x80000000 说明是负数，转成有符号
        if raw >= 0x80000000:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            raw -= 0x100000000
            # 用 0x100000000 更新 raw；-= 表示先计算再赋回。
        return (raw + sig.offset) * sig.scale
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    # ---- 32 位无符号整数 ----
    if sig.type == "UINT32":
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        raw = _words_to_u32(regs)
        # 给 raw 赋值。
        return (raw + sig.offset) * sig.scale
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    # ---- 32 位浮点（占 2 个寄存器）----
    if sig.type == "FLOAT32":
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        # pymodbus 3.x: 用 ModbusClientMixin.convert_from_registers
        # word_order 控制 word 间的字节序(BIG=高字在前,默认;LITTLE=低字在前,西门子 REAL 反向)
        wo = "little" if PLC_WORD_ORDER == "LITTLE" else "big"
        # 给 wo 赋值。 关键字：if＝按条件分支；else＝进入另一条件分支。
        v = ModbusClientMixin.convert_from_registers(
        # 给 v 赋值。
            regs, ModbusClientMixin.DATATYPE.FLOAT32, word_order=wo)
            # 向 Modbus 解码器传入寄存器原值、FLOAT32 类型和字序。
        return (v + sig.offset) * sig.scale
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    return None
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；None＝空值。


# ---------- PLC 客户端封装(串行读写、容错) ----------
class Plc:
# 定义类 Plc。 关键字：class＝定义类。
    def __init__(self, host, port, unit_id):
    # 定义函数 __init__。 关键字：def＝定义 Python 函数；self＝当前 Python 实例。
        # PLC 地址信息
        self.host = host
        # 把 host 的结果赋给 self.host。 关键字：self＝当前 Python 实例。
        self.port = port
        # 把 port 的结果赋给 self.port。 关键字：self＝当前 Python 实例。
        self.unit = unit_id
        # 把 unit_id 的结果赋给 self.unit。 关键字：self＝当前 Python 实例。
        # pymodbus 客户端。timeout=2 秒 —— 2 秒读不到就当通信异常
        self.cli = ModbusTcpClient(host=host, port=port, timeout=2)
        # 把 ModbusTcpClient(host=host, port=port, timeout=2) 的结果赋给 self.cli。 关键字：self＝当前 Python 实例。
        # MQTT 回调与采集循环位于不同线程，不能并发操作同一个 Modbus 连接。
        self.lock = threading.Lock()
        # 把 threading.Lock() 的结果赋给 self.lock。 关键字：self＝当前 Python 实例。
        # 连接状态标记（自己维护，不依赖库的内部状态）
        self.connected = False
        # 把 False 的结果赋给 self.connected。 关键字：self＝当前 Python 实例；False＝布尔假值。

    def connect(self):
    # 定义函数 connect。 关键字：def＝定义 Python 函数；self＝当前 Python 实例。
        # connect() 返回布尔值：True 表示 TCP 握手成功
        with self.lock:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：with＝在资源上下文中执行；self＝当前 Python 实例。
            if not self.cli.connect():
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；self＝当前 Python 实例。
                self.connected = False
                # 把 False 的结果赋给 self.connected。 关键字：self＝当前 Python 实例；False＝布尔假值。
                return False
                # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
            self.connected = True
            # 把 True 的结果赋给 self.connected。 关键字：self＝当前 Python 实例；True＝布尔真值。
            return True
            # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；True＝布尔真值。

    def close(self):
    # 定义函数 close。 关键字：def＝定义 Python 函数；self＝当前 Python 实例。
        with self.lock:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：with＝在资源上下文中执行；self＝当前 Python 实例。
            self.cli.close()
            # 调用函数或对象方法并传入参数。 关键字：self＝当前 Python 实例。
            self.connected = False
            # 把 False 的结果赋给 self.connected。 关键字：self＝当前 Python 实例；False＝布尔假值。

    def read_all(self, signals: list[Signal]) -> dict[str, Any]:
    # 定义函数 read_all。 关键字：def＝定义 Python 函数；self＝当前 Python 实例。
        """逐个读取已配置点位，返回本轮采集结果。"""
        # 没连上 → 先尝试连接，失败就直接返回空字典（主循环会 sleep 后重试）
        if not self.connected:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；self＝当前 Python 实例。
            if not self.connect():
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；self＝当前 Python 实例。
                return {}
                # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
        # 按 address 排序,合并相邻段
        # 按 address 排序 —— 让同一段的寄存器尽量连续读，减少总线往返
        sigs_sorted = sorted(signals, key=lambda s: s.address)
        # 给 sigs_sorted 赋值。 关键字：lambda＝定义匿名函数。
        # 结果字典：信号名 → 物理量
        values: dict[str, Any] = {}
        # 给 values 赋值。
        try:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
            for s in sigs_sorted:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
                # ★ 核心读操作：读保持寄存器（功能码 0x03）
                #   address=起始地址，count=读几个寄存器，slave=从站号
                with self.lock:
                # 控制后续缩进代码块的执行条件或顺序。 关键字：with＝在资源上下文中执行；self＝当前 Python 实例。
                    rr = self.cli.read_holding_registers(
                    # 给 rr 赋值。 关键字：self＝当前 Python 实例。
                        address=s.address, count=s.count, device_id=self.unit)
                        # 给 address 赋值。 关键字：self＝当前 Python 实例。
                # isError() 表示 Modbus 异常码（地址越界等），不是 Python 异常
                if rr.isError():
                # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                    LOG.warning("读 %s @%d 失败: %s", s.name, s.address, rr)
                    # 调用函数或对象方法并传入参数。
                    # 该点位记 None（前端看到 null），但继续读后面的点位
                    values[s.name] = None
                    # 把 None 的结果赋给 values[s.name]。 关键字：None＝空值。
                    continue
                    # 跳过本轮剩余语句，进入下一次循环。
                # 正常读到 → 解码成物理量
                values[s.name] = decode_signal(rr.registers, s)
                # 把 decode_signal(rr.registers, s) 的结果赋给 values[s.name]。
        except Exception as exc:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
            # 通信异常（断线、超时）→ 记错误并把连接标记为断开，下次循环会重连
            LOG.error("PLC 通信异常: %s", exc)
            # 调用函数或对象方法并传入参数。
            self.connected = False
            # 把 False 的结果赋给 self.connected。 关键字：self＝当前 Python 实例；False＝布尔假值。
        return values
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


# ---------- 数据契约装配 ----------
def group_signals(signals: list[Signal], values: dict[str, Any]) -> dict:
# 定义函数 group_signals。 关键字：def＝定义 Python 函数。
    """按 'robot' / 'line' 命名空间组装契约 payload。"""
    # 按命名空间分组： {"robot": {...}, "line": {...}}
    grouped: dict[str, dict[str, Any]] = defaultdict(dict)
    # 给 grouped 赋值。
    for s in signals:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        # 取该信号本次的值
        v = values.get(s.name)
        # 给 v 赋值。
        # 按第一个 "." 拆成命名空间和键名
        #   "robot.joints[0]" → ns="robot", key="joints[0]"
        #   "line.goodCount"  → ns="line",  key="goodCount"
        ns, _, key = s.name.partition(".")
        # 把 s.name.partition(".") 的结果赋给 ns, _, key。
        # 没有 "." 的信号名无法归类，跳过
        if not key:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            continue
            # 跳过本轮剩余语句，进入下一次循环。
        # joints[0] 这种数组下标展开成 list
        # 带下标的键（joints[0]）要展开成数组
        if "[" in key and "]" in key:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；in＝遍历键或判断成员；and＝逻辑与。
            base, _, idx = key.partition("[")
            # 把 key.partition("[") 的结果赋给 base, _, idx。
            idx = int(idx.rstrip("]"))
            # 给 idx 赋值。
            # setdefault：不存在就先建一个长度 6 的 None 数组
            grouped[ns].setdefault(base, [None] * 6)[idx] = v
            # 把 v 的结果赋给 grouped[ns].setdefault(base, [None] * 6)[idx]。 关键字：None＝空值。
        else:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
            # 普通键直接赋值
            grouped[ns][key] = v
            # 把 v 的结果赋给 grouped[ns][key]。

    # 组装最终报文。ts 由采集器打（契约规定时间戳由产生方打）
    payload: dict[str, Any] = {"ts": now_ms(), "lineId": LINE_ID}
    # 给 payload 赋值。

    # 只有采到了 robot.* 的点位，才生成机器人报文
    if "robot" in grouped:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；in＝遍历键或判断成员。
        r = grouped["robot"]
        # 给 r 赋值。
        payload["deviceId"] = ROBOT_ID
        # 把 ROBOT_ID 的结果赋给 payload["deviceId"]。
        payload["joints"] = r.get("joints", [None] * 6)
        # 把 r.get("joints", [None] * 6) 的结果赋给 payload["joints"]。 关键字：None＝空值。
        payload["tcp"]    = r.get("tcp", None)
        # 把 r.get("tcp", None) 的结果赋给 payload["tcp"]   。 关键字：None＝空值。
        payload["speedPct"] = int(r.get("speedPct", 0) or 0)
        # 把 int(r.get("speedPct", 0) or 0) 的结果赋给 payload["speedPct"]。 关键字：or＝逻辑或。
        # PLC 里的模式是数字，契约要求字符串 → 这里做映射
        payload["mode"]     = {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get(
        # 把 {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get( 的结果赋给 payload["mode"]    。
                                int(r.get("mode", 0) or 0), "manual")
                                # 调用函数或对象方法并传入参数。 关键字：or＝逻辑或。
        payload["program"]   = str(r.get("program", "") or "")
        # 把 str(r.get("program", "") or "") 的结果赋给 payload["program"]  。 关键字：or＝逻辑或。
        payload["alarmCode"] = int(r.get("alarmCode", 0) or 0)
        # 把 int(r.get("alarmCode", 0) or 0) 的结果赋给 payload["alarmCode"]。 关键字：or＝逻辑或。
    return payload
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def io_payload(signals: list[Signal], values: dict[str, Any]) -> dict | None:
# 定义函数 io_payload。 关键字：def＝定义 Python 函数；None＝空值。
    """产线 IO 快照(契约 §3.8):io.* 命名空间的点位原样透传。

    只发 io.* 前缀的点位;读失败的点值为 None → 前端显示 "—",
    不做 0 兜底(0 对传感器/灯光是有意义的真实值,"没读到"和"确实是 0"必须区分开)。
    一个 io.* 点都没配时返回 None,调用方跳过发布。
    """
    io = {s.name.split(".", 1)[1]: values.get(s.name)
    # 给 io 赋值。
          for s in signals if s.name.startswith("io.")}
          # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员；if＝按条件分支。
    if not io:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        return None
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；None＝空值。
    return {"ts": now_ms(), "lineId": LINE_ID, "io": io}
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def line_status_payload(values: dict[str, Any]) -> dict:
# 定义函数 line_status_payload。 关键字：def＝定义 Python 函数。
    # 注意:state 的 0(等待入料)是合法值,不能用 `or 1` 兜底,否则 0 被吞成 1。
    # 现场 17 word 表不提供 productCode / goodCount / ngCount / beatMs,
    # 这些按契约"只增不改"原则保留字段、输出默认值。
    raw_state = values.get("line.state")
    # 给 raw_state 赋值。
    state = STATE_MAP.get(int(raw_state), "offline") if isinstance(raw_state, (int, float)) else "offline"
    # 给 state 赋值。 关键字：if＝按条件分支；else＝进入另一条件分支。
    return {
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
        "ts": now_ms(),
        # 设置字段 ts，值为 now_ms()。
        "lineId": LINE_ID,
        # 设置字段 lineId，值为 LINE_ID。
        "state": state,
        # 设置字段 state，值为 state。
        "productCode": str(values.get("line.productCode", "") or ""),
        # 设置字段 productCode，值为 str(values.get("line.productCode", "") or "")。 关键字：or＝逻辑或。
        "goodCount":   int(values.get("line.goodCount", 0) or 0),
        # 设置字段 goodCount，值为 int(values.get("line.goodCount", 0) or 0)。 关键字：or＝逻辑或。
        "ngCount":     int(values.get("line.ngCount", 0) or 0),
        # 设置字段 ngCount，值为 int(values.get("line.ngCount", 0) or 0)。 关键字：or＝逻辑或。
        "beatMs":      int(values.get("line.beatMs", 0) or 0),
        # 设置字段 beatMs，值为 int(values.get("line.beatMs", 0) or 0)。 关键字：or＝逻辑或。
    }
    # 结束当前对象、函数或条件代码块。


# ---------- 工具 ----------
def now_ms() -> int:
# 定义函数 now_ms。 关键字：def＝定义 Python 函数。
    return int(time.time() * 1000)
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def setup_logging():
# 定义函数 setup_logging。 关键字：def＝定义 Python 函数。
    logging.basicConfig(
    # 调用函数或对象方法并传入参数。
        level=logging.INFO,
        # 给 level 赋值。
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        # 给 format 赋值。
        datefmt="%Y-%m-%d %H:%M:%S",
        # 给 datefmt 赋值。
    )
    # 结束当前集合、分组或调用参数。


# ---------- MQTT 客户端 ----------
def make_mqtt() -> mqtt.Client:
# 定义函数 make_mqtt。 关键字：def＝定义 Python 函数。
    # client_id 必须唯一（同一时刻两个同 ID 的连接，Broker 会踢掉前一个）
    # ★ 带 PID:万一真起了两个采集器,它们不会在 Broker 上互相踢下线。
    #   （2026-10-23 踩过：两个采集器同 client_id 互踢,表现为"状态偶尔上得来、
    #   下行指令一条也收不到",排查起来极费时间。真正的防线是单实例锁,
    #   这里只是让"万一有两个"不至于互相破坏。）
    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
    # 给 c 赋值。
                    client_id=f"plc-edge-{LINE_ID}-{os.getpid()}")
                    # 给 client_id 赋值。
    # 需要认证才设置账号密码
    if MQTT_USERNAME:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        c.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        # 调用函数或对象方法并传入参数。
    # ★ 遗嘱消息（LWT）：采集器异常掉线时，Broker 自动代发 offline
    #   → 产线离线状态由此自动产生，不需要心跳轮询
    c.will_set(T_EDGE,
    # 调用函数或对象方法并传入参数。
               json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
               # 调用函数或对象方法并传入参数。
               qos=1, retain=True)
               # 给 qos 赋值。 关键字：True＝布尔真值。
    # 建立连接（keepalive 30 秒）
    c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    # 调用函数或对象方法并传入参数。
    # 启动后台网络线程（不调用 loop_start 就没有收发能力）
    c.loop_start()
    # 调用函数或对象方法并传入参数。
    return c
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def publish(c: mqtt.Client, topic: str, payload: dict, qos=0, retain=False):
# 定义函数 publish。 关键字：def＝定义 Python 函数；False＝布尔假值。
    c.publish(topic, json.dumps(payload, ensure_ascii=False), qos=qos, retain=retain)
    # 调用函数或对象方法并传入参数。 关键字：False＝布尔假值。


# ---------- 控制命令 ----------
# 契约 v1.1 type 白名单(对齐 docs/contract/README.md §3.6)
# sig_name 指向 register-mapping.csv 里的 cmd.* 点位;None 表示契约预留(edge 暂不写)
# kind 只用于校验 params;真正的写入一律"只写一次",PLC 侧自行清零脉冲点(见 _write_cmd)
CMD_DISPATCH = {
# 给 CMD_DISPATCH 赋值。
    'start':       ('cmd.start',       'pulse'),
    # 设置字段 start，值为 ('cmd.start',       'pulse')。
    'stop':        ('cmd.stop',        'pulse'),
    # 设置字段 stop，值为 ('cmd.stop',        'pulse')。
    'reset':       (None,              'noop'),
    # 设置字段 reset，值为 (None,              'noop')。 关键字：None＝空值。
    'changeover':  (None,              'noop'),
    # 设置字段 changeover，值为 (None,              'noop')。 关键字：None＝空值。
    'mode_set':    ('cmd.modeToggle',  'mode_toggle'),
    # 设置字段 mode_set，值为 ('cmd.modeToggle',  'mode_toggle')。
    'alarm_clear': (None,              'noop'),
    # 设置字段 alarm_clear，值为 (None,              'noop')。 关键字：None＝空值。
    'conveyor':    ('cmd.conveyor',    'conveyor'),
    # 设置字段 conveyor，值为 ('cmd.conveyor',    'conveyor')。
}
# 结束当前对象、函数或条件代码块。
# 现场 17 word 表没有 reset / changeover / alarm_clear 对应寄存器,
# 这三个指令回 rejected 而不是假装 acked —— 避免操作员以为生效了。

# 手动模式切换:PLC word 8,值域 {1,2};PLC 完成模式切换后自动置 0
MODE_TOGGLE_VALUE = {'acquire': 1, 'release': 2}
# 给 MODE_TOGGLE_VALUE 赋值。
# 传送带:PLC word 10,值域 {0,1},电平型(持续写值)
CONVEYOR_VALUE = {'stop': 0, 'forward': 1}
# 给 CONVEYOR_VALUE 赋值。

# 产线状态:PLC dataDB[6](Modbus word 6)整数 → 契约字符串
# 依据 DB3-Modbus-映射表1.csv「产线状态」枚举(契约 v1.1,见 db/init/004_line_state_stages.sql)
#
# ★ 2026-10-23 按现场给的 DB3-Modbus-映射表1.csv 校正:
#   表里原文是 "3 = 等待机器人" —— 之前误当成「下料中」(unloading)了。
#   现在 3 → waiting_robot(等待机器人完成),4 → unload_done(下料完成)不变。
#   旧契约值 'unloading' 只在历史数据里保留(DB 约束不删,见 005 迁移),
#   采集端不再产出。
STATE_MAP = {
# 给 STATE_MAP 赋值。
    0:   'waiting_feed',   # 等待入料
    # 设置字段 0，值为 'waiting_feed',   # 等待入料。
    1:   'feeding',        # 入料中
    # 设置字段 1，值为 'feeding',        # 入料中。
    2:   'assembling',     # 装配中
    # 设置字段 2，值为 'assembling',     # 装配中。
    3:   'waiting_robot',  # 等待机器人完成
    # 设置字段 3，值为 'waiting_robot',  # 等待机器人完成。
    4:   'unload_done',    # 下料完成
    # 设置字段 4，值为 'unload_done',    # 下料完成。
    5:   'waiting_next',   # 等待后站入料
    # 设置字段 5，值为 'waiting_next',   # 等待后站入料。
    100: 'init_error',     # 初始化错误状态
    # 设置字段 100，值为 'init_error',     # 初始化错误状态。
    101: 'stopped',        # 停止状态
    # 设置字段 101，值为 'stopped',        # 停止状态。
    102: 'manual_mode',    # 手动控制模式
    # 设置字段 102，值为 'manual_mode',    # 手动控制模式。
}
# 结束当前对象、函数或条件代码块。


def _dispatch_cmd(plc: Plc, cmd_type: str, params: dict) -> tuple[bool, str]:
# 定义函数 _dispatch_cmd。 关键字：def＝定义 Python 函数。
    """返回 (success, message)。False → cmd_ack.status=rejected,True → acked。"""
    spec = CMD_DISPATCH.get(cmd_type)
    # 给 spec 赋值。
    if spec is None:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
        return False, f'未知指令类型: {cmd_type}'
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
    sig_name, kind = spec
    # 把 spec 的结果赋给 sig_name, kind。
    if sig_name is None:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
        # 现场 PLC 点位表里没有这个点位的寄存器 → 明确拒绝,不能假 ack
        return False, f'现场 PLC 无 {cmd_type} 对应寄存器(register-mapping.csv 未开放该点),指令未下发'
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
    sig = _cmd_signals.get(sig_name)
    # 给 sig 赋值。
    if sig is None:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
        return False, f'点位 {sig_name} 未在 register-mapping.csv 配置'
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
    params = params or {}
    # 给 params 赋值。 关键字：or＝逻辑或。

    if kind == 'pulse':
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        value = 1
        # 给 value 赋值。
    elif kind == 'mode_toggle':
    # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
        act = params.get('action')
        # 给 act 赋值。
        if act not in MODE_TOGGLE_VALUE:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；in＝遍历键或判断成员。
            return False, (f'mode_set.params.action 必须是 '
            # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
                           f'{list(MODE_TOGGLE_VALUE.keys())},收到 {act!r}')
                           # 调用 list；括号中的表达式是传入的参数。
        value = MODE_TOGGLE_VALUE[act]
        # 给 value 赋值。
    elif kind == 'conveyor':
    # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
        act = params.get('action')
        # 给 act 赋值。
        if act not in CONVEYOR_VALUE:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；in＝遍历键或判断成员。
            return False, (f'conveyor.params.action 必须是 '
            # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
                           f'{list(CONVEYOR_VALUE.keys())},收到 {act!r}')
                           # 调用 list；括号中的表达式是传入的参数。
        value = CONVEYOR_VALUE[act]
        # 给 value 赋值。
    else:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
        return False, f'未知 kind={kind}'
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。

    return _write_cmd(plc, sig.address, value)
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


def _write_cmd(plc: Plc, address: int, value: int) -> tuple[bool, str]:
# 定义函数 _write_cmd。 关键字：def＝定义 Python 函数。
    """写 PLC 寄存器(只写一次,不回写 0)。

    2026-10-16 现场确认:停止 / 启动 / 手动模式切换这三个点,PLC 在完成动作后
    会**自己把寄存器置 0**,所以采集器不再做 "写值 → sleep 100ms → 写 0"。
    传送带本来就是电平语义,同样只写一次,值由下一次写入覆盖。
    两个写者抢同一个寄存器反而可能把 PLC 刚写好的 1 覆盖掉。

    plc.connected=False → 直接 rejected,不下发(不假 ack)。
    """
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        with plc.lock:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：with＝在资源上下文中执行。
            if not plc.connected:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
                LOG.error('PLC 未连接,拒绝下发 addr=%d,value=%d(不假 ack)', address, value)
                # 调用函数或对象方法并传入参数。
                return False, 'PLC 未连接,指令未下发'
                # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
            rr = plc.cli.write_register(address=address, value=value, device_id=plc.unit)
            # 给 rr 赋值。
        if rr.isError():
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            return False, f'PLC 写寄存器失败: {rr}'
            # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。
        return True, ''
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；True＝布尔真值。
    except Exception as exc:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
        return False, f'PLC 通信异常: {exc}'
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；False＝布尔假值。


def on_command(c: mqtt.Client, plc: Plc):
# 定义函数 on_command。 关键字：def＝定义 Python 函数。
    """订阅控制指令。校验白名单 → 真写 PLC(PLC 未连则 rejected)→ 回 cmd_ack。
    cmdId 缺失 → 回 rejected;ack 始终回(契约 §3.7)。"""
    # 内部回调函数（paho 的签名：client, userdata, message）
    def _cb(_client, _userdata, msg):
    # 定义函数 _cb。 关键字：def＝定义 Python 函数。
        cmd_id, ack_status, ack_msg = '', 'failed', ''
        # 把 '', 'failed', '' 的结果赋给 cmd_id, ack_status, ack_msg。
        try:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
            # 解析指令 JSON
            cmd = json.loads(msg.payload.decode("utf-8"))
            # 给 cmd 赋值。
            cmd_id = cmd.get('cmdId') or ''
            # 给 cmd_id 赋值。 关键字：or＝逻辑或。
            cmd_type = cmd.get('type')
            # 给 cmd_type 赋值。 关键字：type＝定义类型别名。
            params = cmd.get('params') or {}
            # 给 params 赋值。 关键字：or＝逻辑或。
            LOG.info('收到指令 type=%s cmdId=%s topic=%s', cmd_type, cmd_id, msg.topic)
            # 调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
            if not cmd_id:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
                ack_status, ack_msg = 'rejected', 'cmdId 缺失'
                # 把 'rejected', 'cmdId 缺失' 的结果赋给 ack_status, ack_msg。
            else:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
                ok, ack_msg = _dispatch_cmd(plc, cmd_type, params)
                # 把 _dispatch_cmd(plc, cmd_type, params) 的结果赋给 ok, ack_msg。
                ack_status = 'acked' if ok else 'rejected'
                # 给 ack_status 赋值。 关键字：if＝按条件分支；else＝进入另一条件分支。
        except Exception as exc:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
            LOG.error('处理指令异常: %s', exc)
            # 调用函数或对象方法并传入参数。
            ack_status, ack_msg = 'failed', str(exc)
            # 把 'failed', str(exc) 的结果赋给 ack_status, ack_msg。
        finally:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：finally＝执行收尾逻辑。
            if cmd_id:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                # 回执：cmdId 必须原样带回，后端靠它更新 control_commands 状态
                publish(c, T_ACK, {
                # 调用函数或对象方法并传入参数。
                    'cmdId': cmd_id,
                    # 设置字段 cmdId，值为 cmd_id。
                    'ts': now_ms(),
                    # 设置字段 ts，值为 now_ms()。
                    'status': ack_status,
                    # 设置字段 status，值为 ack_status。
                    'message': ack_msg or '',
                    # 把这一段文字作为当前调用、数组或对象的值。 关键字：or＝逻辑或。
                }, qos=1)
                # 结束当前对象、函数或条件代码块。
    # ★ 用 message_callback_add 而不是全局 on_message：
    #   这样以后要加别的订阅主题不会互相覆盖
    c.message_callback_add(T_CMD, _cb)
    # 调用函数或对象方法并传入参数。
    # 订阅下行指令主题（QoS 1：指令不能丢）
    c.subscribe(T_CMD, qos=1)
    # 调用函数或对象方法并传入参数。


# ---------- 主循环 ----------
def main():
# 定义函数 main。 关键字：def＝定义 Python 函数。
    # 配置日志
    setup_logging()
    # 调用函数或对象方法并传入参数。

    # ★ 单实例保护:拿不到独占锁 = 已经有一个采集器在跑,直接退出。
    #   PLC 的 MB_SERVER 只接受一条连接,两个采集器必然有一个连不上;
    #   更糟的是同 client_id 会在 Broker 上互踢,导致下行指令收不到。
    lock_fh = acquire_single_instance_lock(LOCK_FILE)
    # 给 lock_fh 赋值。
    if lock_fh is None:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
        LOG.error("已有采集器在运行(锁 %s 被占用),本进程退出。"
        # 调用函数或对象方法并传入参数。
                  "重复起采集器会抢 PLC 连接并互踢 MQTT,不要再起第二个。", LOCK_FILE)
                  # 把重复启动采集器的错误提示和锁文件路径传给日志或异常。
        sys.exit(1)
        # 调用函数或对象方法并传入参数。
    LOG.info("单实例锁已获取: %s", LOCK_FILE)
    # 调用函数或对象方法并传入参数。

    # 打印关键配置，排障时第一眼就能确认连的是哪台 PLC、哪个 Broker
    LOG.info("PLC: %s:%d  unit=%d  poll=%dms", PLC_HOST, PLC_PORT, PLC_UNIT_ID, PLC_POLL_MS)
    # 调用函数或对象方法并传入参数。
    LOG.info("MQTT: %s:%d  line=%s  robot=%s", MQTT_HOST, MQTT_PORT, LINE_ID, ROBOT_ID)
    # 调用函数或对象方法并传入参数。

    # 加载点位表
    signals = _read_csv(MAPPING_FILE)
    # 给 signals 赋值。
    # 一个点位都没有 → 没法采，直接退出（继续跑也没意义）
    if not signals:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        LOG.error("无可用点位,退出。请编辑 %s 后重试。", MAPPING_FILE)
        # 调用函数或对象方法并传入参数。
        sys.exit(1)
        # 调用函数或对象方法并传入参数。

    # 建立 PLC 连接对象与 MQTT 连接
    plc = Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID)
    # 给 plc 赋值。
    mq = make_mqtt()
    # 给 mq 赋值。
    # 订阅下行指令
    on_command(mq, plc)
    # 调用函数或对象方法并传入参数。

    # 上线声明（retained）：后端任何时候订阅都能立刻拿到 online
    publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
    # 调用函数或对象方法并传入参数。
            qos=1, retain=True)
            # 给 qos 赋值。 关键字：True＝布尔真值。

    # 上次发产线状态的时间（用于限速到 1Hz）
    last_status_pub = 0.0
    # 给 last_status_pub 赋值。
    # line_status 1Hz retained —— 契约 §2 规定产线状态是 1Hz
    STATUS_PERIOD = 1.0  # line_status 1Hz retained
    # 给 STATUS_PERIOD 赋值。
    # edge 心跳:后端把 edge/status 存进 Redis,TTL 只有 300s
    # (server/src/state/line-state.service.ts setEdgeStatus)。
    # edge/status 若只在启动/退出时各发一次,运行满 5 分钟后 Redis key 过期,
    # 前端 snapshot 的 edge 就永久变 null。这里按 EDGE_HEARTBEAT_S 周期重发
    # 上线声明(retain),保活后端的 Redis key。
    EDGE_HEARTBEAT_S = float(os.getenv("EDGE_HEARTBEAT_S", "30"))
    # 给 EDGE_HEARTBEAT_S 赋值。
    last_edge_pub = time.time()
    # 给 last_edge_pub 赋值。

    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        while True:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：while＝按条件重复执行；True＝布尔真值。
            # 记录本轮开始时间（用于精确控制轮询周期）
            t_loop = time.time()
            # 给 t_loop 赋值。
            # 心跳放在 PLC 读取之前 —— PLC 断线时也要发,否则后端会以为 edge 掉线
            if t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                last_edge_pub = t_loop
                # 给 last_edge_pub 赋值。
                publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
                # 调用函数或对象方法并传入参数。
                        qos=1, retain=True)
                        # 给 qos 赋值。 关键字：True＝布尔真值。
                LOG.debug("edge 心跳已发")
                # 调用函数或对象方法并传入参数。
            # ---- 读 PLC ----
            values = plc.read_all(signals)
            # 给 values 赋值。
            # 一个值都没读到 → PLC 没响应，记警告并等 1 秒后重试
            if not values:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
                LOG.warning("PLC 无响应,1s 后重试")
                # 调用函数或对象方法并传入参数。
                time.sleep(1.0)
                # 调用函数或对象方法并传入参数。
                continue
                # 跳过本轮剩余语句，进入下一次循环。

            # 1) 机器人遥测 (5~10Hz,这里跟随 poll)
            # ---- 1) 机器人遥测 (5~10Hz,这里跟随 poll) ----
            # 按点位表组装成契约 §3.1 的 robot_state 报文
            tele = group_signals(signals, values)
            # 给 tele 赋值。
            # 有 deviceId 才说明采到了 robot.* 的点位
            if "deviceId" in tele:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；in＝遍历键或判断成员。
                publish(mq, T_ROBOT, tele, qos=0)
                # 调用函数或对象方法并传入参数。

            # 2) 产线 IO (跟随 poll;word 11..16,契约 §3.8)
            io_msg = io_payload(signals, values)
            # 给 io_msg 赋值。
            if io_msg is not None:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；not＝逻辑否定；None＝空值。
                publish(mq, T_IO, io_msg, qos=0)
                # 调用函数或对象方法并传入参数。

            # ---- 2) 产线状态 (1Hz, retained) ----
            now = time.time()
            # 给 now 赋值。
            # 距离上次发布已超过 1 秒才发
            if now - last_status_pub >= STATUS_PERIOD:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                last_status_pub = now
                # 给 last_status_pub 赋值。
                publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)
                # 调用函数或对象方法并传入参数。 关键字：True＝布尔真值。

            # 4) 报警:alarmCode 变化时上报一次事件
            # (简化:采集者自行维护上一次值;这里留给上层)

            # ---- 控制轮询节奏 ----
            # 本轮实际耗时
            dt = time.time() - t_loop
            # 给 dt 赋值。
            # 目标周期 - 实际耗时 = 还要睡多久（不能为负）
            sleep_s = max(0.0, PLC_POLL_MS / 1000.0 - dt)
            # 给 sleep_s 赋值。
            time.sleep(sleep_s)
            # 调用函数或对象方法并传入参数。

    except KeyboardInterrupt:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常。
        # Ctrl+C 退出
        LOG.info("用户中断,退出")
        # 调用函数或对象方法并传入参数。
    finally:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：finally＝执行收尾逻辑。
        # ★ 无论怎么退出，都要主动发 offline（正常下线不会触发 LWT）
        publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "offline"},
        # 调用函数或对象方法并传入参数。
                qos=1, retain=True)
                # 给 qos 赋值。 关键字：True＝布尔真值。
        # 停网络线程
        mq.loop_stop()
        # 调用函数或对象方法并传入参数。
        # 断开 MQTT
        mq.disconnect()
        # 调用函数或对象方法并传入参数。
        # 释放单实例锁(进程退出也会自动释放,这里只是别留文件句柄)
        try:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
            lock_fh.close()
            # 调用函数或对象方法并传入参数。
        except Exception:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常。
            pass
            # 保留空代码块；这里暂时不执行操作。 关键字：pass＝保留空语句块。
        # 关 PLC 连接
        plc.close()
        # 调用函数或对象方法并传入参数。


# 程序的直接入口（被 import 时不执行）
if __name__ == "__main__":
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    main()
    # 调用函数或对象方法并传入参数。
