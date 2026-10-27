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
# 这一段负责采集 PLC 寄存器并通过 MQTT 发布状态，同时接收受限控制指令，为后续代码提供当前文件的处理入口。
import csv
# 从 Python 环境 导入 csv，供后续代码使用。
# csv：来自 csv，Python CSV 表格解析库
import json
# 从 Python 环境 导入 json，供后续代码使用。
# json：来自 json，Python JSON 编解码库
import logging
# 从 Python 环境 导入 logging，供后续代码使用。
# logging：来自 logging，Python 日志接口
import os
# 从 Python 环境 导入 os，供后续代码使用。
# os：来自 os，Python 操作系统环境变量接口
import struct
# 从 Python 环境 导入 struct，供后续代码使用。
# struct：来自 struct，Python 二进制编解码接口
import sys
# 从 Python 环境 导入 sys，供后续代码使用。
# sys：来自 sys，Python 运行环境与退出状态接口
import threading
# 从 Python 环境 导入 threading，供后续代码使用。
# threading：来自 threading，Python 线程与锁接口
import time
# 从 Python 环境 导入 time，供后续代码使用。
# time：来自 time，Python 时间与暂停接口
from collections import defaultdict
# 从 collections 导入 defaultdict，供后续代码使用。
# defaultdict：来自 collections，供本文件后续调用的对象
from dataclasses import dataclass
# 从 dataclasses 导入 dataclass，供后续代码使用。
# dataclass：来自 dataclasses，供本文件后续调用的对象
from pathlib import Path
# 从 pathlib 导入 Path，供后续代码使用。
# Path：来自 pathlib，pathlib 的文件路径类
from typing import Any
# 从 typing 导入 Any，供后续代码使用。
# Any：来自 typing，供本文件后续调用的对象

import paho.mqtt.client as mqtt
# 从 Python 环境 导入 paho.mqtt.client as mqtt，供后续代码使用。
# mqtt：来自 paho.mqtt.client，Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。
# ModbusTcpClient：来自 pymodbus.client，pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器
from pymodbus.client.mixin import ModbusClientMixin
# 从 pymodbus.client.mixin 导入 ModbusClientMixin，供后续代码使用。
# ModbusClientMixin：来自 pymodbus.client.mixin，pymodbus 提供的寄存器类型转换工具类

# 本模块的日志器（名字固定，便于按名过滤）
LOG = logging.getLogger("plc-collector")
# 取得指定名称的 Python 日志器，将结果保存或写入 LOG。
# LOG：保存 logging.getLogger('plc-collector') 的结果；getLogger：取得指定名称的 Python 日志器；logging：Python 日志接口

# PLC 的 IP 地址。产线局域网内的固定地址
PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 PLC_HOST。
# PLC_HOST：保存 os.getenv('PLC_HOST', '192.168.10.31') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# Modbus TCP 端口。标准是 502，S7 的 MB_SERVER 常用 503
PLC_PORT        = int(os.getenv("PLC_PORT", "503"))
# 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 PLC_PORT。
# PLC_PORT：保存 int(os.getenv('PLC_PORT', '503')) 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 从站号（Modbus unit id）。S7 一般是 2
PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))
# 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 PLC_UNIT_ID。
# PLC_UNIT_ID：保存 int(os.getenv('PLC_UNIT_ID', '2')) 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 轮询周期（毫秒）。200ms → 5Hz，符合契约要求的 5~10Hz
PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))
# 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 PLC_POLL_MS。
# PLC_POLL_MS：保存 int(os.getenv('PLC_POLL_MS', '200')) 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 32 位类型(INT32/UINT32/DINT/FLOAT32)的字序。
# 默认 BIG = Modbus 标准(高字在前),TIA 大端与此一致;
# 西门子 DINT 在内存里是低字在前,跟 Modbus 冲突,读出来值异常时改 LITTLE。
PLC_WORD_ORDER  = os.getenv("PLC_WORD_ORDER", "BIG").upper()
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 PLC_WORD_ORDER。
# PLC_WORD_ORDER：保存 os.getenv('PLC_WORD_ORDER', 'BIG').upper() 的结果；upper：把字符串转换为大写；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# MQTT Broker 地址与端口
MQTT_HOST       = os.getenv("MQTT_HOST", "localhost")
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 MQTT_HOST。
# MQTT_HOST：保存 os.getenv('MQTT_HOST', 'localhost') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
MQTT_PORT       = int(os.getenv("MQTT_PORT", "1883"))
# 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 MQTT_PORT。
# MQTT_PORT：保存 int(os.getenv('MQTT_PORT', '1883')) 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# MQTT 认证（空 = 匿名）
MQTT_USERNAME   = os.getenv("MQTT_USERNAME") or None
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 MQTT_USERNAME。
# MQTT_USERNAME：保存 os.getenv('MQTT_USERNAME') or None 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
MQTT_PASSWORD   = os.getenv("MQTT_PASSWORD") or None
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 MQTT_PASSWORD。
# MQTT_PASSWORD：保存 os.getenv('MQTT_PASSWORD') or None 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 产线编码 / 机器人编码：必须与数据库 production_lines.code、devices.code 一致
LINE_ID         = os.getenv("LINE_ID", "line-01")
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 LINE_ID。
# LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
ROBOT_ID        = os.getenv("ROBOT_ID", "robot-01")
# 读取操作系统环境变量，未设置时使用指定默认值，将结果保存或写入 ROBOT_ID。
# ROBOT_ID：保存 os.getenv('ROBOT_ID', 'robot-01') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
# 点位表路径。默认取本文件同目录下的 register-mapping.csv
# （用 Path(__file__).with_name(...) 而不是相对路径，保证从任何工作目录启动都能找到）
MAPPING_FILE    = Path(os.getenv("MAPPING_FILE",
# 将字符串或父路径构造成可操作的文件路径对象，将结果保存或写入 MAPPING_FILE。
# MAPPING_FILE：保存 Path(os.getenv('MAPPING_FILE', str(Path(__file__).with_name('register-… 的结果；Path：pathlib 的文件路径类；os：Python 操作系统环境变量接口；getenv：读取操作系统环境变量，未设置时使用指定默认值
                                str(Path(__file__).with_name("register-mapping.csv"))))
                                # 将输入转换为文本，供日志或消息正文使用。
                                # Path：pathlib 的文件路径类；with_name：保留父目录，仅替换路径中的文件名

# MQTT 主题(对齐 docs/contract/README.md §2)
# 机器人六轴遥测主题（上行）
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 根据 f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}" 设置 T_ROBOT，供当前流程后续使用。
# T_ROBOT：保存 f'tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；ROBOT_ID：保存 os.getenv('ROBOT_ID', 'robot-01') 的结果
T_IO     = f"tl/v1/{LINE_ID}/telemetry/io"
# 根据 f"tl/v1/{LINE_ID}/telemetry/io" 设置 T_IO，供当前流程后续使用。
# T_IO：保存 f'tl/v1/{LINE_ID}/telemetry/io' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 产线状态主题（上行，retained）
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 根据 f"tl/v1/{LINE_ID}/telemetry/status" 设置 T_STATUS，供当前流程后续使用。
# T_STATUS：保存 f'tl/v1/{LINE_ID}/telemetry/status' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 生产事件主题（上行）
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 根据 f"tl/v1/{LINE_ID}/event" 设置 T_EVENT，供当前流程后续使用。
# T_EVENT：保存 f'tl/v1/{LINE_ID}/event' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 边缘在线状态主题（上行，retained + LWT）
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# 根据 f"tl/v1/{LINE_ID}/edge/status" 设置 T_EDGE，供当前流程后续使用。
# T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 控制指令主题（下行，订阅它）。+ 是单层通配符，表示该产线下所有设备
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 根据 f"tl/v1/{LINE_ID}/cmd/+" 设置 T_CMD，供当前流程后续使用。
# T_CMD：保存 f'tl/v1/{LINE_ID}/cmd/+' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果
# 指令回执主题（上行）
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"
# 根据 f"tl/v1/{LINE_ID}/cmd_ack" 设置 T_ACK，供当前流程后续使用。
# T_ACK：保存 f'tl/v1/{LINE_ID}/cmd_ack' 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果

# 写命令点位(name 以 cmd. 开头),与读取点位分流,只给 _dispatch_cmd 用
# 用字符串注解延后求值(Signal 在本文件下方定义)
_cmd_signals: dict = {}
# 写命令点位(name 以 cmd. 开头),与读取点位分流,只给 _dispatch_cmd 用。
# _cmd_signals：本处声明的局部变量，类型为 dict

# 单实例锁文件:同一台机器**只允许一个采集器**。
#   原因:PLC 的 MB_SERVER 只接受 1 条 Modbus TCP 连接,第二个采集器永远连不上;
#   而且两个采集器用同一个 MQTT client_id 会互相把对方踢下线(见 make_mqtt),
#   结果是「状态偶尔能上、指令永远收不到」——2026-10-23 实测踩过。
#   所以这里用**文件独占锁**做硬保证:拿不到锁就直接退出,不去抢 PLC 也不去踢 MQTT。
LOCK_FILE = Path(os.getenv("COLLECTOR_LOCK_FILE",
# 将字符串或父路径构造成可操作的文件路径对象，将结果保存或写入 LOCK_FILE。
# LOCK_FILE：保存 Path(os.getenv('COLLECTOR_LOCK_FILE', str(Path(__file__).with_name('.p… 的结果；Path：pathlib 的文件路径类；os：Python 操作系统环境变量接口；getenv：读取操作系统环境变量，未设置时使用指定默认值
                           str(Path(__file__).with_name(".plc_collector.lock"))))
                           # 将输入转换为文本，供日志或消息正文使用。
                           # Path：pathlib 的文件路径类；with_name：保留父目录，仅替换路径中的文件名


# 这一段定义 acquire_single_instance_lock，用于取得本机文件锁，阻止重复启动 PLC 采集进程。
def acquire_single_instance_lock(path: Path):
# 定义函数 acquire_single_instance_lock。
# acquire_single_instance_lock：取得本机文件锁，阻止重复启动 PLC 采集进程；path：方法输入参数，类型为 Path；Path：pathlib 的文件路径类
    """拿独占锁;拿不到说明已经有采集器在跑 → 返回 None(调用方应退出)。

    Windows 用 msvcrt.locking,Linux/macOS 用 fcntl.flock。
    锁随进程退出自动释放(文件句柄被关闭),不会留下"死锁"。
    """
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        fh = path.open("a+b")
        # 按指定模式打开文件，将结果保存或写入 fh。
        # fh：保存 path.open('a+b') 的结果；open：按指定模式打开文件；path：方法输入参数，类型为 Path
    except OSError as exc:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        LOG.warning("锁文件打不开(%s),不启用单实例保护", exc)
        # 记录本次异常或状态的警告日志。
        # LOG：保存 logging.getLogger('plc-collector') 的结果
        return None
        # 把None作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        if os.name == "nt":
        # 检查os.name == "nt":，按判断结果进入对应的处理分支。
        # os：Python 操作系统环境变量接口；name：当前对象的名称字段，本次传入 = "nt":
            import msvcrt
            # 从 Python 环境 导入 msvcrt，供后续代码使用。
            # msvcrt：来自 msvcrt，供本文件后续调用的对象
            fh.seek(0)
            # 把文件读写位置移动到指定偏移处。
            # fh：保存 path.open('a+b') 的结果
            if fh.tell() == 0:
            # 检查fh.tell() == 0:，按判断结果进入对应的处理分支。
            # fh：保存 path.open('a+b') 的结果
                fh.write(b"0")
                # 把本行提供的内容写到已打开的文件或通信目标。
                # fh：保存 path.open('a+b') 的结果
                fh.flush()
                # 执行 flush 对应的本地处理，使用本行提供的数据。
                # fh：保存 path.open('a+b') 的结果
            fh.seek(0)
            # 把文件读写位置移动到指定偏移处。
            # fh：保存 path.open('a+b') 的结果
            msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
            # 执行 locking 对应的本地处理，使用本行提供的数据。
            # msvcrt：从 msvcrt 导入的模块，类型为 msvcrt；fh：保存 path.open('a+b') 的结果
        else:
        # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            import fcntl
            # 从 Python 环境 导入 fcntl，供后续代码使用。
            # fcntl：来自 fcntl，供本文件后续调用的对象
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            # 执行 flock 对应的本地处理，使用本行提供的数据。
            # fcntl：从 fcntl 导入的模块，类型为 fcntl；fh：保存 path.open('a+b') 的结果
    except OSError:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        fh.close()
        # 关闭当前通信连接。
        # close：关闭连接或释放当前打开的资源；fh：保存 path.open('a+b') 的结果
        return None
        # 把None作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    return fh  # 必须在整个进程生命周期里持有这个句柄,锁才有效
    # 把fh # 必须在整个进程生命周期里持有这个句柄,锁才有效作为当前函数的结果返回。
    # fh：保存 path.open('a+b') 的结果
    # 这一段实现了取得本机文件锁，阻止重复启动 PLC 采集进程；返回值或异常由调用方按当前分支处理。


# ---------- 点位表加载与解码 ----------
@dataclass
# 装饰器 dataclass：给后面的类、方法或参数附加元数据。
# dataclass：从 dataclasses 导入的对象，类型为 dataclasses
class Signal:
# 定义 Signal，约束或实现本模块涉及的数据和行为。
# Signal：本文件定义的点位配置类型，包含名称、地址、类型和缩放参数
    name: str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"
    # 设置字段 name，值为 str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"，供当前处理流程继续使用。
    # name：当前对象的名称字段
    address: int           # Modbus 起始寄存器地址(0-based,持有寄存器)
    # 设置字段 address，值为 int           # Modbus 起始寄存器地址(0-based,持有寄存器)，供当前处理流程继续使用。
    # address：Modbus 寄存器起始地址，使用从 0 开始的编号
    type: str              # INT16 | UINT16 | INT32 | UINT32 | FLOAT32 | BOOL | STRING
    # 设置字段 type，值为 str              # INT16 | UINT16 | INT32 | UINT32 | FLOAT32 | BOOL | STRING，供当前处理流程继续使用。
    # type：当前报文、指令或对象的类别字段
    count: int             # 占用寄存器数量
    # 设置字段 count，值为 int             # 占用寄存器数量，供当前处理流程继续使用。
    # count：本次读取或数据结构声明的数量
    scale: float = 1.0     # 物理量 = 原始值 * scale
    # 给 scale 赋值，供当前处理流程继续使用。
    # scale：原始数值转换为实际物理量的缩放系数
    offset: int = 0        # 物理量 = (原始值 + offset) * scale
    # 给 offset 赋值，供当前处理流程继续使用。
    # offset：点位原始值转换前使用的偏移量
    unit: str = ""         # 物理单位,留作日志
    # 给 unit 赋值，供当前处理流程继续使用。
    # unit：设备站号或点位物理单位，依据所在对象区分


# 这一段定义 _read_csv，用于读取点位映射表，将可读信号与控制写点分开保存。
def _read_csv(path: Path) -> list[Signal]:
# 定义函数 _read_csv。
# _read_csv：读取点位映射表，将可读信号与控制写点分开保存；path：方法输入参数，类型为 Path；Path：pathlib 的文件路径类；Signal：本文件定义的点位配置类型，包含名称、地址、类型和缩放参数
    """读取点位表;支持 # 开头的注释行;缺失/格式错的行打 warning 跳过,不致命。
    name 以 "cmd." 开头的为写命令点位,单独存到 _cmd_signals(不进主循环读取)。"""
    sigs: list[Signal] = []
    # 给 sigs 赋值，供当前处理流程继续使用。
    # sigs：本处声明的局部变量，类型为 list[Signal]；Signal：本文件定义的点位配置类型，包含名称、地址、类型和缩放参数
    _cmd_signals.clear()
    # 清空集合、映射或缓存中的现有条目。
    # clear：清空集合、映射或缓存中的现有条目；_cmd_signals：本处声明的局部变量，类型为 dict
    # 点位表不存在 → 致命（没有点位就什么都采不了）
    if not path.exists():
    # 检查not path.exists():，按判断结果进入对应的处理分支。
    # path：方法输入参数，类型为 Path；exists：检查路径对应的文件或目录是否存在
        LOG.error("点位表不存在: %s", path)
        # 记录错误日志或显示失败提示，以接收对象为准。
        # error：记录错误日志或显示失败提示，以接收对象为准；path：方法输入参数，类型为 Path；LOG：保存 logging.getLogger('plc-collector') 的结果
        return sigs
        # 把sigs作为当前函数的结果返回。
        # sigs：本处声明的局部变量，类型为 list[Signal]
    # 跳过以 # 开头的注释行(以及空行),保留真正的表头和数据
    with path.open("r", encoding="utf-8-sig", newline="") as f:
    # 按指定模式打开文件。
    # path：方法输入参数，类型为 Path；open：按指定模式打开文件
        lines = [ln for ln in f
        # 根据 [ln for ln in f 设置 lines，供当前流程后续使用。
        # lines：保存 [ln for ln in f if ln.strip() and (not ln.lstrip().startswith('#'))] 的结果
                 if ln.strip() and not ln.lstrip().startswith("#")]
                 # 检查ln.strip() and not ln.lstrip().startswith("#")]，按判断结果进入对应的处理分支。
                 # strip：移除字符串两端空白或指定字符；lstrip：移除字符串左侧空白或指定字符
    # csv.DictReader：把每行变成"列名 → 值"的字典
    reader = csv.DictReader(lines)
    # 执行 DictReader 对应的本地处理，使用本行提供的数据，将结果保存或写入 reader。
    # reader：保存 csv.DictReader(lines) 的结果；lines：保存 [ln for ln in f if ln.strip() and (not ln.lstrip().startswith('#'))] 的结果；csv：Python CSV 表格解析库
    # 必需的列。缺了就无法解析，直接退出
    required = {"name", "address", "type"}
    # 根据 {"name", "address", "type"} 设置 required，供当前流程后续使用。
    # required：保存 {'name', 'address', 'type'} 的结果
    if not required.issubset(reader.fieldnames or []):
    # 检查not required.issubset(reader.fieldnames or []):，按判断结果进入对应的处理分支。
    # required：保存 {'name', 'address', 'type'} 的结果；reader：保存 csv.DictReader(lines) 的结果
        LOG.error("点位表缺少必需列(需要 %s),实际: %s",
        # 记录错误日志或显示失败提示，以接收对象为准。
        # LOG：保存 logging.getLogger('plc-collector') 的结果；error：记录错误日志或显示失败提示，以接收对象为准
                  sorted(required), reader.fieldnames)
                  # 把当前集合按指定规则排序并返回新列表。
                  # required：保存 {'name', 'address', 'type'} 的结果；reader：保存 csv.DictReader(lines) 的结果
        return sigs
        # 把sigs作为当前函数的结果返回。
        # sigs：本处声明的局部变量，类型为 list[Signal]
    # 从第 2 行开始（start=2 是因为表头占了第 1 行，报错时行号才对得上）
    for line_no, row in enumerate(reader, start=2):
    # 循环处理line_no, row in enumerate(reader, start=2):，按判断结果进入对应的处理分支。
    # line_no：逐项遍历 enumerate(reader, start=2) 的当前元素；row：逐项遍历 enumerate(reader, start=2) 的当前元素；reader：保存 csv.DictReader(lines) 的结果；start：启动 Three.js 的连续渲染循环
        try:
        # 开始执行可能失败的操作，错误由后续异常分支处理。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 起始地址
            addr = int(row["address"])
            # 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 addr。
            # addr：保存 int(row['address']) 的结果；row：逐项遍历 enumerate(reader, start=2) 的当前元素
            # 类型统一大写并去空格
            t = row["type"].upper().strip()
            # 把字符串转换为大写，将结果保存或写入 t。
            # t：保存 row['type'].upper().strip() 的结果；strip：移除字符串两端空白或指定字符；upper：把字符串转换为大写；row：逐项遍历 enumerate(reader, start=2) 的当前元素
            # 类型 → 占用寄存器数。16 位占 1 个，32 位占 2 个
            size_map = {"INT16": 1, "UINT16": 1, "BOOL": 1,
            # 根据 {"INT16": 1, "UINT16": 1, "BOOL": 1, 设置 size_map，供当前流程后续使用。
            # size_map：保存 {'INT16': 1, 'UINT16': 1, 'BOOL': 1, 'INT32': 2, 'UINT32': 2, 'FLOAT32… 的结果
                        "INT32": 2, "UINT32": 2, "FLOAT32": 2,
                        # 在当前模拟输入或配置映射中，将键 INT32 设为 2。
                        # INT32 是当前映射表的查找键；2 是用该键读取时取得的值
                        # 西门子 DBW/DBD 别名(xls 用这种)
                        "INT": 1, "UINT": 1, "DINT": 2}
                        # 在当前模拟输入或配置映射中，将键 INT 设为 1。
                        # INT 是当前映射表的查找键；1 是用该键读取时取得的值
            cnt = size_map.get(t)
            # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 cnt。
            # cnt：保存 size_map.get(t) 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；t：保存 row['type'].upper().strip() 的结果；size_map：保存 {'INT16': 1, 'UINT16': 1, 'BOOL': 1, 'INT32': 2, 'UINT32': 2, 'FLOAT32… 的结果
            # 未知类型 → 跳过这一行（不致命，其它点位照常工作）
            if cnt is None:
            # 检查cnt is None:，按判断结果进入对应的处理分支。
            # cnt：保存 size_map.get(t) 的结果
                LOG.warning("L%d 未知类型 %s,跳过", line_no, t)
                # 记录本次异常或状态的警告日志。
                # line_no：逐项遍历 enumerate(reader, start=2) 的当前元素；t：保存 row['type'].upper().strip() 的结果；LOG：保存 logging.getLogger('plc-collector') 的结果
                continue
                # 跳过本轮剩余语句，进入下一次循环。
                # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            name = row["name"].strip()
            # 移除字符串两端空白或指定字符，将结果保存或写入 name。
            # name：当前对象的名称字段；strip：移除字符串两端空白或指定字符；row：逐项遍历 enumerate(reader, start=2) 的当前元素
            sig = Signal(
            # 创建或使用本文件定义的点位配置类型，包含名称、地址、类型和缩放参数，将结果保存或写入 sig。
            # sig：保存 Signal(name=name, address=addr, type=t, count=cnt, scale=float(row.get… 的结果；Signal：本文件定义的点位配置类型，包含名称、地址、类型和缩放参数
                name=name,
                # 根据 name, 设置 name，用于当前对象的名称字段。
                # name：当前对象的名称字段
                address=addr,
                # 根据 addr, 设置 address，用于Modbus 寄存器起始地址，使用从 0 开始的编号。
                # address：Modbus 寄存器起始地址，使用从 0 开始的编号；addr：保存 int(row['address']) 的结果
                type=t,
                # 根据 t, 设置 type，用于当前报文、指令或对象的类别字段。
                # type：当前报文、指令或对象的类别字段；t：保存 row['type'].upper().strip() 的结果
                count=cnt,
                # 根据 cnt, 设置 count，用于本次读取或数据结构声明的数量。
                # count：本次读取或数据结构声明的数量；cnt：保存 size_map.get(t) 的结果
                scale=float(row.get("scale") or 1.0),
                # 将输入转换为浮点数，供带缩放的测量值计算，将结果保存或写入 scale。
                # scale：原始数值转换为实际物理量的缩放系数；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；row：逐项遍历 enumerate(reader, start=2) 的当前元素
                offset=int(row.get("offset") or 0),
                # 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 offset。
                # offset：点位原始值转换前使用的偏移量；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；row：逐项遍历 enumerate(reader, start=2) 的当前元素
                unit=row.get("unit", ""),
                # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 unit。
                # unit：设备站号或点位物理单位，依据所在对象区分；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；row：逐项遍历 enumerate(reader, start=2) 的当前元素
            )
            # 结束当前函数、分支或对象配置，返回上一层处理流程。
            # 本行结束上面最近一层已经介绍的表达式或代码块
            # 写命令点位走 _cmd_signals,不进主循环
            if name.startswith("cmd."):
            # 检查name.startswith("cmd."):，按判断结果进入对应的处理分支。
            # name：当前对象的名称字段
                _cmd_signals[name] = sig
                # 把 sig 的结果赋给 _cmd_signals[name]。
                # sig：保存 Signal(name=name, address=addr, type=t, count=cnt, scale=float(row.get… 的结果；_cmd_signals：保存 sig 的结果；name：当前对象的名称字段
            else:
            # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
                sigs.append(sig)
                # 把一个元素追加到 Python 列表末尾。
                # append：把一个元素追加到 Python 列表末尾；sig：保存 Signal(name=name, address=addr, type=t, count=cnt, scale=float(row.get… 的结果；sigs：本处声明的局部变量，类型为 list[Signal]
        except Exception as exc:
        # 接收并处理上一段操作产生的异常。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 单行解析失败只打 warning，不影响其它点位（现场改表时容错很重要）
            LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)
            # 记录本次异常或状态的警告日志。
            # line_no：逐项遍历 enumerate(reader, start=2) 的当前元素；row：逐项遍历 enumerate(reader, start=2) 的当前元素；LOG：保存 logging.getLogger('plc-collector') 的结果
    LOG.info("已加载 %d 个读点位 + %d 个写点位: %s", len(sigs), len(_cmd_signals), path)
    # 记录运行信息或显示普通提示，以接收对象为准。
    # info：记录运行信息或显示普通提示，以接收对象为准；path：方法输入参数，类型为 Path；LOG：保存 logging.getLogger('plc-collector') 的结果；sigs：本处声明的局部变量，类型为 list[Signal]；_cmd_signals：保存 sig 的结果
    return sigs
    # 把sigs作为当前函数的结果返回。
    # sigs：本处声明的局部变量，类型为 list[Signal]
    # 这一段实现了读取点位映射表，将可读信号与控制写点分开保存；返回值或异常由调用方按当前分支处理。


# 这一段定义 _words_to_u32，用于按配置字序把两个 16 位寄存器拼成 32 位无符号整数。
def _words_to_u32(regs: list[int]) -> int:
# 定义函数 _words_to_u32。
# _words_to_u32：按配置字序把两个 16 位寄存器拼成 32 位无符号整数；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    """按 PLC_WORD_ORDER 把 2 个 word 合并成 32 位整数。
    BIG   = 高字在前(Modbus 标准,TIA 大端与此一致,默认)
    LITTLE = 低字在前(西门子 DINT 在内存里就是这个顺序)"""
    if PLC_WORD_ORDER == "LITTLE":
    # 检查PLC_WORD_ORDER == "LITTLE":，按判断结果进入对应的处理分支。
    # PLC_WORD_ORDER：保存 os.getenv('PLC_WORD_ORDER', 'BIG').upper() 的结果
        regs = list(reversed(regs))
        # 执行 list 对应的本地处理，使用本行提供的数据，将结果保存或写入 regs。
        # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    return (regs[0] << 16) | regs[1]
    # 把(regs[0] << 16) | regs[1]作为当前函数的结果返回。
    # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    # 这一段实现了按配置字序把两个 16 位寄存器拼成 32 位无符号整数；返回值或异常由调用方按当前分支处理。


# 这一段定义 decode_signal，用于按点位类型、偏移和缩放系数把原始寄存器转换为物理量。

# 这段完成现场原始值到业务数值的转换，由 Plc.read_all() 在读到寄存器后调用。
# regs 是本次 Modbus 响应中的 16 位寄存器数组；sig 是 CSV 点表里对应信号的名称、类型、偏移和缩放配置。
# 例如 J1 点位的原始值为 250，按 INT 解释后计算 (250 + 0) * 0.1，得到 25 度，供机器人报文的 joints 使用。
# 没有读到值返回 None；这里不做 Three.js 的度转弧度，也不把读取失败替换为有效的 0。

def decode_signal(regs: list[int], sig: Signal) -> Any:
# 按点表规定的类型解释这次寄存器响应，再应用偏移和缩放，返回业务数值；没有读到值时保留 None。
# regs 是这次 Modbus 响应的寄存器数组；sig 是本点位的 Signal 配置，提供 type、offset、scale 等解释规则。
    """把 Modbus 寄存器值翻译成物理量。Modbus 协议是大端字序(高字在前);
    S7 的 MB_SERVER 默认也是大端;若现场 PLC 用了小端,把 PLC_WORD_ORDER 改 LITTLE。"""
    # 没有读到寄存器 → 返回 None（表示本次读失败/无数据）
    if not regs:
    # 检查not regs:，按判断结果进入对应的处理分支。
    # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
        # 未知类型 → None
        return None
        # 把None作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    if sig.type in ("INT16", "INT"):
    # 检查sig.type in ("INT16", "INT"):，按判断结果进入对应的处理分支。
    # sig：方法输入参数，类型为 Signal；type：当前报文、指令或对象的类别字段
        # Modbus 的寄存器是无符号的：>= 0x8000 视为负数，减去 0x10000 转成有符号

        # regs[0] 是原始 16 位字，可能以 0～65535 表示；达到 0x8000 的值减去 0x10000 后才是对应有符号整数。
        # 例如原始 65526 在 INT 分支解释为 -10，再使用点表缩放系数，避免负角度被误读成很大的正数。

        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
        # 根据 regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000 设置 raw，供当前流程后续使用。
        # raw：保存 regs[0] if regs[0] < 32768 else regs[0] - 65536 的结果；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
        return (raw + sig.offset) * sig.scale
        # 把(raw + sig.offset) * sig.scale作为当前函数的结果返回。
        # scale：原始数值转换为实际物理量的缩放系数；raw：保存 regs[0] if regs[0] < 32768 else regs[0] - 65536 的结果；offset：点位原始值转换前使用的偏移量；sig：方法输入参数，类型为 Signal
    if sig.type in ("UINT16", "UINT"):
    # 检查sig.type in ("UINT16", "UINT"):，按判断结果进入对应的处理分支。
    # sig：方法输入参数，类型为 Signal；type：当前报文、指令或对象的类别字段
        return (regs[0] + sig.offset) * sig.scale
        # 把(regs[0] + sig.offset) * sig.scale作为当前函数的结果返回。
        # scale：原始数值转换为实际物理量的缩放系数；offset：点位原始值转换前使用的偏移量；sig：方法输入参数，类型为 Signal；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    # ---- 布尔 ----
    if sig.type == "BOOL":
    # 检查sig.type == "BOOL":，按判断结果进入对应的处理分支。
    # sig：方法输入参数，类型为 Signal；type：当前报文、指令或对象的类别字段，本次传入 = "BOOL":
        # 寄存器非 0 即为真
        return bool(regs[0])
        # 把bool(regs[0])作为当前函数的结果返回。
        # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    if sig.type in ("INT32", "DINT"):
    # 检查sig.type in ("INT32", "DINT"):，按判断结果进入对应的处理分支。
    # sig：方法输入参数，类型为 Signal；type：当前报文、指令或对象的类别字段
        raw = _words_to_u32(regs)
        # 按配置字序把两个 16 位寄存器拼成 32 位无符号整数，将结果保存或写入 raw。
        # raw：保存 _words_to_u32(regs) 的结果；_words_to_u32：按配置字序把两个 16 位寄存器拼成 32 位无符号整数；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
        # 超过 0x80000000 说明是负数，转成有符号
        if raw >= 0x80000000:
        # 检查raw >= 0x80000000:，按判断结果进入对应的处理分支。
        # raw：保存 _words_to_u32(regs) 的结果
            raw -= 0x100000000
            # 用 0x100000000 更新 raw；-= 表示先计算再赋回。
            # raw：保存 _words_to_u32(regs) 的结果
        return (raw + sig.offset) * sig.scale
        # 把(raw + sig.offset) * sig.scale作为当前函数的结果返回。
        # scale：原始数值转换为实际物理量的缩放系数；raw：保存 _words_to_u32(regs) 的结果；offset：点位原始值转换前使用的偏移量；sig：方法输入参数，类型为 Signal
    # ---- 32 位无符号整数 ----
    if sig.type == "UINT32":
    # 检查sig.type == "UINT32":，按判断结果进入对应的处理分支。
    # sig：方法输入参数，类型为 Signal；type：当前报文、指令或对象的类别字段，本次传入 = "UINT32":
        raw = _words_to_u32(regs)
        # 按配置字序把两个 16 位寄存器拼成 32 位无符号整数，将结果保存或写入 raw。
        # raw：保存 _words_to_u32(regs) 的结果；_words_to_u32：按配置字序把两个 16 位寄存器拼成 32 位无符号整数；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
        return (raw + sig.offset) * sig.scale
        # 把(raw + sig.offset) * sig.scale作为当前函数的结果返回。
        # scale：原始数值转换为实际物理量的缩放系数；raw：保存 _words_to_u32(regs) 的结果；offset：点位原始值转换前使用的偏移量；sig：方法输入参数，类型为 Signal
    # ---- 32 位浮点（占 2 个寄存器）----
    if sig.type == "FLOAT32":
    # 检查sig.type == "FLOAT32":，按判断结果进入对应的处理分支。
    # sig：方法输入参数，类型为 Signal；type：当前报文、指令或对象的类别字段，本次传入 = "FLOAT32":
        # pymodbus 3.x: 用 ModbusClientMixin.convert_from_registers
        # word_order 控制 word 间的字节序(BIG=高字在前,默认;LITTLE=低字在前,西门子 REAL 反向)
        wo = "little" if PLC_WORD_ORDER == "LITTLE" else "big"
        # 根据 "little" if PLC_WORD_ORDER == "LITTLE" else "big" 设置 wo，供当前流程后续使用。
        # wo：保存 'little' if PLC_WORD_ORDER == 'LITTLE' else 'big' 的结果；PLC_WORD_ORDER：保存 os.getenv('PLC_WORD_ORDER', 'BIG').upper() 的结果
        v = ModbusClientMixin.convert_from_registers(
        # 按指定数据类型和字序把寄存器数组转换为数值，将结果保存或写入 v。
        # v：保存 ModbusClientMixin.convert_from_registers(regs, ModbusClientMixin.DATAT… 的结果；ModbusClientMixin：pymodbus 提供的寄存器类型转换工具类；convert_from_registers：按指定数据类型和字序把寄存器数组转换为数值
            regs, ModbusClientMixin.DATATYPE.FLOAT32, word_order=wo)
            # 向 Modbus 解码器传入寄存器原值、FLOAT32 类型和字序。
            # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组；ModbusClientMixin：pymodbus 提供的寄存器类型转换工具类；wo：保存 'little' if PLC_WORD_ORDER == 'LITTLE' else 'big' 的结果
        return (v + sig.offset) * sig.scale
        # 把(v + sig.offset) * sig.scale作为当前函数的结果返回。
        # scale：原始数值转换为实际物理量的缩放系数；v：保存 ModbusClientMixin.convert_from_registers(regs, ModbusClientMixin.DATAT… 的结果；offset：点位原始值转换前使用的偏移量；sig：方法输入参数，类型为 Signal
    return None
    # 把None作为当前函数的结果返回。
    # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    # 这一段实现了按点位类型、偏移和缩放系数把原始寄存器转换为物理量；返回值或异常由调用方按当前分支处理。


# ---------- PLC 客户端封装(串行读写、容错) ----------
class Plc:
# 定义 Plc，约束或实现本模块涉及的数据和行为。
# Plc：本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理
    # 这一段定义 __init__，用于保存 PLC 地址与站号，创建通信客户端和读写互斥锁。
    def __init__(self, host, port, unit_id):
    # 定义 __init__，用于保存 PLC 地址与站号，创建通信客户端和读写互斥锁。
    # __init__：本文件定义的函数，用于初始化  使用的实例状态和依赖；host：网络连接的目标主机地址；port：网络连接的目标端口；unit_id：Modbus 设备站号参数
        # PLC 地址信息
        self.host = host
        # 把 host 的结果赋给 self.host。
        # host：网络连接的目标主机地址，本次传入 host
        self.port = port
        # 把 port 的结果赋给 self.port。
        # port：网络连接的目标端口，本次传入 port
        self.unit = unit_id
        # 把 unit_id 的结果赋给 self.unit。
        # unit：设备站号或点位物理单位，依据所在对象区分，本次传入 unit_id；unit_id：Modbus 设备站号参数
        # pymodbus 客户端。timeout=2 秒 —— 2 秒读不到就当通信异常
        self.cli = ModbusTcpClient(host=host, port=port, timeout=2)
        # 把 ModbusTcpClient(host=host, port=port, timeout=2) 的结果赋给 self.cli。
        # cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求，本次传入 ModbusTcpClient(host=host；ModbusTcpClient：pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器；host：网络连接的目标主机地址，本次传入 host；port：网络连接的目标端口，本次传入 port；timeout：操作的最长等待时间，本处客户端以秒为单位，本次传入 2
        # MQTT 回调与采集循环位于不同线程，不能并发操作同一个 Modbus 连接。
        self.lock = threading.Lock()
        # 把 threading.Lock() 的结果赋给 self.lock。
        # threading：Python 线程与锁接口
        # 连接状态标记（自己维护，不依赖库的内部状态）
        self.connected = False
        # 把 False 的结果赋给 self.connected。
        # connected：连接是否已建立的状态标记，本次传入 False
        # 这一段实现了保存 PLC 地址与站号，创建通信客户端和读写互斥锁；返回值或异常由调用方按当前分支处理。

    # 这一段定义 connect，用于在互斥锁保护下建立 PLC 连接并更新连接状态。
    def connect(self):
    # 定义 connect，用于在互斥锁保护下建立 PLC 连接并更新连接状态。
    # connect：尝试建立网络连接
        # connect() 返回布尔值：True 表示 TCP 握手成功
        with self.lock:
        # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            if not self.cli.connect():
            # 检查not self.cli.connect():，按判断结果进入对应的处理分支。
            # cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；connect：尝试建立网络连接
                self.connected = False
                # 把 False 的结果赋给 self.connected。
                # connected：连接是否已建立的状态标记，本次传入 False
                return False
                # 把False作为当前函数的结果返回。
                # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
            self.connected = True
            # 把 True 的结果赋给 self.connected。
            # connected：连接是否已建立的状态标记，本次传入 True
            return True
            # 把True作为当前函数的结果返回。
            # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
            # 这一段实现了在互斥锁保护下建立 PLC 连接并更新连接状态；返回值或异常由调用方按当前分支处理。

    # 这一段定义 close，用于在互斥锁保护下关闭 PLC 连接并清除连接标记。
    def close(self):
    # 定义 close，用于在互斥锁保护下关闭 PLC 连接并清除连接标记。
    # close：关闭连接或释放当前打开的资源
        with self.lock:
        # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            self.cli.close()
            # 关闭当前通信连接。
            # close：关闭连接或释放当前打开的资源；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
            self.connected = False
            # 把 False 的结果赋给 self.connected。
            # connected：连接是否已建立的状态标记，本次传入 False
            # 这一段实现了在互斥锁保护下关闭 PLC 连接并清除连接标记；返回值或异常由调用方按当前分支处理。

    # 这一段定义 read_all，用于读取全部配置的只读点位，逐点解码并保留读取失败的空值。

    # 这段是每轮现场采集的读取入口：按点表逐个读取 PLC，再返回“信号名称 → 已解码值”的字典。
    # signals 来自点表；s.address 是寄存器起始地址，s.count 是占用的寄存器数量，self.unit 是 Modbus 从站编号。
    # read_holding_registers() 发出请求，rr 保存 PLC 的本次响应；成功后把 rr.registers 交给 decode_signal() 解释类型与单位。
    # 主循环取得这份字典后，分别组装机器人、IO 和工序状态报文；通信错误与合法零值在这里保留区别。

    def read_all(self, signals: list[Signal]) -> dict[str, Any]:
    # 读取本轮点表配置的现场信号，将读取响应逐点解码，返回按业务名称组织的结果字典。
    # self 是已有 Plc 客户端；signals 是点表 Signal 列表；返回字典供 group_signals()、io_payload() 等分别组装消息。
        """逐个读取已配置点位，返回本轮采集结果。"""
        # 没连上 → 先尝试连接，失败就直接返回空字典（主循环会 sleep 后重试）
        if not self.connected:
        # 检查not self.connected:，按判断结果进入对应的处理分支。
        # connected：连接是否已建立的状态标记
            if not self.connect():
            # 检查not self.connect():，按判断结果进入对应的处理分支。
            # connect：尝试建立网络连接
                return {}
                # 把{}作为当前函数的结果返回。
                # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
        # 按 address 排序,合并相邻段
        # 按 address 排序 —— 让同一段的寄存器尽量连续读，减少总线往返
        sigs_sorted = sorted(signals, key=lambda s: s.address)
        # 把当前集合按指定规则排序并返回新列表，将结果保存或写入 sigs_sorted。
        # sigs_sorted：保存 sorted(signals, key=lambda s: s.address) 的结果；signals：方法输入参数，类型为 list[Signal]；key：缓存、映射或对象中使用的查找键，本次传入 lambda s: s.address；address：Modbus 寄存器起始地址，使用从 0 开始的编号
        # 结果字典：信号名 → 物理量
        values: dict[str, Any] = {}
        # 给 values 赋值，供当前处理流程继续使用。
        # values：取得字典或映射中的所有值；Any：从 typing 导入的对象，类型为 typing
        try:
        # 开始执行可能失败的操作，错误由后续异常分支处理。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            for s in sigs_sorted:
            # 循环处理s in sigs_sorted:，按判断结果进入对应的处理分支。
            # s：逐项遍历 sigs_sorted 的当前元素；sigs_sorted：保存 sorted(signals, key=lambda s: s.address) 的结果
                # ★ 核心读操作：读保持寄存器（功能码 0x03）
                #   address=起始地址，count=读几个寄存器，slave=从站号
                with self.lock:
                # ★ 核心读操作：读保持寄存器（功能码 0x03）。
                # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定

                    # 在已有 PLC 连接上读取这一点位，响应保存在 rr，供下面检查错误和提取 registers。
                    # address、count 来自当前点表信号 s；device_id 使用 self.unit，三者共同确定本次向 PLC 读什么。

                    rr = self.cli.read_holding_registers(
                    # 向 PLC 读取指定寄存器，将结果保存或写入 rr。
                    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象
                        address=s.address, count=s.count, device_id=self.unit)
                        # 根据 s.address, count=s.count, device_id=self.unit) 设置 address，用于Modbus 寄存器起始地址，使用从 0 开始的编号。
                        # address：Modbus 寄存器起始地址，使用从 0 开始的编号；s：逐项遍历 sigs_sorted 的当前元素；count：本次读取或数据结构声明的数量，本次传入 s.count；device_id：pymodbus 当前接口的目标设备站号参数，本次传入 self.unit；unit：设备站号或点位物理单位，依据所在对象区分
                # isError() 表示 Modbus 异常码（地址越界等），不是 Python 异常
                if rr.isError():
                # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
                # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
                    LOG.warning("读 %s @%d 失败: %s", s.name, s.address, rr)
                    # 记录本次异常或状态的警告日志。
                    # name：当前对象的名称字段；address：Modbus 寄存器起始地址，使用从 0 开始的编号；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；LOG：保存 logging.getLogger('plc-collector') 的结果；s：逐项遍历 sigs_sorted 的当前元素
                    # 该点位记 None（前端看到 null），但继续读后面的点位
                    values[s.name] = None
                    # 把 None 的结果赋给 values[s.name]。
                    # values：取得字典或映射中的所有值；name：当前对象的名称字段；s：保存 None 的结果
                    continue
                    # 跳过本轮剩余语句，进入下一次循环。
                    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
                # 正常读到 → 解码成物理量
                values[s.name] = decode_signal(rr.registers, s)
                # 把 decode_signal(rr.registers, s) 的结果赋给 values[s.name]。
                # values：取得字典或映射中的所有值；name：当前对象的名称字段；decode_signal：按点位类型、偏移和缩放系数把原始寄存器转换为物理量；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；s：保存 decode_signal(rr.registers, s) 的结果；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
        except Exception as exc:
        # 接收并处理上一段操作产生的异常。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 通信异常（断线、超时）→ 记错误并把连接标记为断开，下次循环会重连
            LOG.error("PLC 通信异常: %s", exc)
            # 记录错误日志或显示失败提示，以接收对象为准。
            # error：记录错误日志或显示失败提示，以接收对象为准；LOG：保存 logging.getLogger('plc-collector') 的结果
            self.connected = False
            # 把 False 的结果赋给 self.connected。
            # connected：连接是否已建立的状态标记，本次传入 False
        return values
        # 把values作为当前函数的结果返回。
        # values：取得字典或映射中的所有值
        # 这一段实现了读取全部配置的只读点位，逐点解码并保留读取失败的空值；返回值或异常由调用方按当前分支处理。


# ---------- 数据契约装配 ----------
# 这一段定义 group_signals，用于按信号命名空间组装机器人遥测所需的报文字段。
def group_signals(signals: list[Signal], values: dict[str, Any]) -> dict:
# 定义函数 group_signals。
# group_signals：按信号命名空间组装机器人遥测所需的报文字段；signals：方法输入参数，类型为 list[Signal]；Signal：本文件定义的点位配置类型，包含名称、地址、类型和缩放参数；values：取得字典或映射中的所有值；Any：从 typing 导入的对象，类型为 typing
    """按 'robot' / 'line' 命名空间组装契约 payload。"""
    # 按命名空间分组： {"robot": {...}, "line": {...}}
    grouped: dict[str, dict[str, Any]] = defaultdict(dict)
    # 执行 defaultdict 对应的本地处理，使用本行提供的数据。
    # grouped：本处声明的局部变量，类型为 dict[str, dict[str, Any]]；defaultdict：从 collections 导入的对象，类型为 collections；Any：从 typing 导入的对象，类型为 typing
    for s in signals:
    # 循环处理s in signals:，按判断结果进入对应的处理分支。
    # s：逐项遍历 signals 的当前元素；signals：方法输入参数，类型为 list[Signal]
        # 取该信号本次的值
        v = values.get(s.name)
        # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 v。
        # v：保存 values.get(s.name) 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；name：当前对象的名称字段；values：取得字典或映射中的所有值；s：逐项遍历 signals 的当前元素
        # 按第一个 "." 拆成命名空间和键名
        #   "robot.joints[0]" → ns="robot", key="joints[0]"
        #   "line.goodCount"  → ns="line",  key="goodCount"
        ns, _, key = s.name.partition(".")
        # 把 s.name.partition(".") 的结果赋给 ns, _, key。
        # ns：保存 s.name.partition('.') 的结果；_：保存 s.name.partition('.') 的结果；key：缓存、映射或对象中使用的查找键，本次传入 s.name.partition("."；partition：按第一个分隔符拆成前部、分隔符和后部三段；name：当前对象的名称字段；s：逐项遍历 signals 的当前元素
        # 没有 "." 的信号名无法归类，跳过
        if not key:
        # 检查not key:，按判断结果进入对应的处理分支。
        # key：缓存、映射或对象中使用的查找键
            continue
            # 跳过本轮剩余语句，进入下一次循环。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # joints[0] 这种数组下标展开成 list
        # 带下标的键（joints[0]）要展开成数组
        if "[" in key and "]" in key:
        # 检查"[" in key and "]" in key:，按判断结果进入对应的处理分支。
        # key：缓存、映射或对象中使用的查找键
            base, _, idx = key.partition("[")
            # 把 key.partition("[") 的结果赋给 base, _, idx。
            # base：保存 key.partition('[') 的结果；_：保存 key.partition('[') 的结果；idx：保存 key.partition('[') 的结果；partition：按第一个分隔符拆成前部、分隔符和后部三段；key：缓存、映射或对象中使用的查找键
            idx = int(idx.rstrip("]"))
            # 将输入转换为整数，供寄存器地址或状态编号计算，将结果保存或写入 idx。
            # idx：保存 int(idx.rstrip(']')) 的结果；rstrip：移除字符串右侧空白或指定字符
            # setdefault：不存在就先建一个长度 6 的 None 数组
            grouped[ns].setdefault(base, [None] * 6)[idx] = v
            # 把 v 的结果赋给 grouped[ns].setdefault(base, [None] * 6)[idx]。
            # v：保存 values.get(s.name) 的结果；idx：保存 v 的结果；setdefault：读取字典键，不存在时先写入给定默认值；base：保存 v 的结果；grouped：保存 v 的结果；ns：保存 v 的结果
        else:
        # setdefault：不存在就先建一个长度 6 的 None 数组。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 普通键直接赋值
            grouped[ns][key] = v
            # 把 v 的结果赋给 grouped[ns][key]。
            # v：保存 values.get(s.name) 的结果；key：缓存、映射或对象中使用的查找键；grouped：保存 v 的结果；ns：保存 v 的结果

    # 组装最终报文。ts 由采集器打（契约规定时间戳由产生方打）
    payload: dict[str, Any] = {"ts": now_ms(), "lineId": LINE_ID}
    # 生成当前毫秒时间戳，作为上行报文的产生时间。
    # payload：消息或事件携带的数据内容；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；Any：从 typing 导入的对象，类型为 typing；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间

    # 只有采到了 robot.* 的点位，才生成机器人报文
    if "robot" in grouped:
    # 检查"robot" in grouped:，按判断结果进入对应的处理分支。
    # grouped：保存 v 的结果
        r = grouped["robot"]
        # 根据 grouped["robot"] 设置 r，供当前流程后续使用。
        # r：保存 grouped['robot'] 的结果；grouped：保存 v 的结果
        payload["deviceId"] = ROBOT_ID
        # 把 ROBOT_ID 的结果赋给 payload["deviceId"]。
        # ROBOT_ID：保存 os.getenv('ROBOT_ID', 'robot-01') 的结果；payload：消息或事件携带的数据内容
        payload["joints"] = r.get("joints", [None] * 6)
        # 把 r.get("joints", [None] * 6) 的结果赋给 payload["joints"]。
        # payload：消息或事件携带的数据内容；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；r：保存 grouped['robot'] 的结果
        payload["tcp"]    = r.get("tcp", None)
        # 把 r.get("tcp", None) 的结果赋给 payload["tcp"]。
        # payload：消息或事件携带的数据内容；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；r：保存 grouped['robot'] 的结果
        payload["speedPct"] = int(r.get("speedPct", 0) or 0)
        # 把 int(r.get("speedPct", 0) or 0) 的结果赋给 payload["speedPct"]。
        # payload：消息或事件携带的数据内容；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；r：保存 grouped['robot'] 的结果
        # PLC 里的模式是数字，契约要求字符串 → 这里做映射
        payload["mode"]     = {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get(
        # 把 {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get( 的结果赋给 payload["mode"]。
        # payload：消息或事件携带的数据内容；mode：机器人或设备运行模式；error：记录错误日志或显示失败提示，以接收对象为准；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定
                                int(r.get("mode", 0) or 0), "manual")
                                # 将输入转换为整数，供寄存器地址或状态编号计算。
                                # r：保存 grouped['robot'] 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定
        payload["program"]   = str(r.get("program", "") or "")
        # 把 str(r.get("program", "") or "") 的结果赋给 payload["program"]。
        # payload：消息或事件携带的数据内容；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；r：保存 grouped['robot'] 的结果
        payload["alarmCode"] = int(r.get("alarmCode", 0) or 0)
        # 把 int(r.get("alarmCode", 0) or 0) 的结果赋给 payload["alarmCode"]。
        # payload：消息或事件携带的数据内容；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；r：保存 grouped['robot'] 的结果
    return payload
    # 把payload作为当前函数的结果返回。
    # payload：消息或事件携带的数据内容
    # 这一段实现了按信号命名空间组装机器人遥测所需的报文字段；返回值或异常由调用方按当前分支处理。


# 这一段定义 io_payload，用于把已采集的六个 IO 点位组装为契约规定的信号帧。
def io_payload(signals: list[Signal], values: dict[str, Any]) -> dict | None:
# 定义函数 io_payload。
# io_payload：把已采集的六个 IO 点位组装为契约规定的信号帧；signals：方法输入参数，类型为 list[Signal]；Signal：本文件定义的点位配置类型，包含名称、地址、类型和缩放参数；values：取得字典或映射中的所有值；Any：从 typing 导入的对象，类型为 typing
    """产线 IO 快照(契约 §3.8):io.* 命名空间的点位原样透传。

    只发 io.* 前缀的点位;读失败的点值为 None → 前端显示 "—",
    不做 0 兜底(0 对传感器/灯光是有意义的真实值,"没读到"和"确实是 0"必须区分开)。
    一个 io.* 点都没配时返回 None,调用方跳过发布。
    """
    io = {s.name.split(".", 1)[1]: values.get(s.name)
    # 按分隔符拆分字符串，将结果保存或写入 io。
    # io：现场 IO 信号对象或当前 IO 状态帧；name：当前对象的名称字段；split：按分隔符拆分字符串；values：取得字典或映射中的所有值；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定
          for s in signals if s.name.startswith("io.")}
          # 循环处理s in signals if s.name.startswith("io.")}，按判断结果进入对应的处理分支。
          # signals：方法输入参数，类型为 list[Signal]；name：当前对象的名称字段
    if not io:
    # 检查not io:，按判断结果进入对应的处理分支。
    # io：现场 IO 信号对象或当前 IO 状态帧
        return None
        # 把None作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    return {"ts": now_ms(), "lineId": LINE_ID, "io": io}
    # 把{"ts": now_ms(), "lineId": LINE_ID, "io": io}作为当前函数的结果返回。
    # LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；io：现场 IO 信号对象或当前 IO 状态帧；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间
    # 这一段实现了把已采集的六个 IO 点位组装为契约规定的信号帧；返回值或异常由调用方按当前分支处理。


# 这一段定义 line_status_payload，用于把 PLC 状态码和计数数据组装为产线状态帧。
def line_status_payload(values: dict[str, Any]) -> dict:
# 定义函数 line_status_payload。
# line_status_payload：把 PLC 状态码和计数数据组装为产线状态帧；values：取得字典或映射中的所有值；Any：从 typing 导入的对象，类型为 typing
    # 注意:state 的 0(等待入料)是合法值,不能用 `or 1` 兜底,否则 0 被吞成 1。
    # 现场 17 word 表不提供 productCode / goodCount / ngCount / beatMs,
    # 这些按契约"只增不改"原则保留字段、输出默认值。
    raw_state = values.get("line.state")
    # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 raw_state。
    # raw_state：保存 values.get('line.state') 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；values：取得字典或映射中的所有值
    state = STATE_MAP.get(int(raw_state), "offline") if isinstance(raw_state, (int, float)) else "offline"
    # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 state。
    # state：当前状态值或实时状态服务实例，以所在对象为准；raw_state：保存 values.get('line.state') 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定
    return {
    # 开始组装当前函数要返回的对象，下方逐项给出结果字段。
    # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
        "ts": now_ms(),
        # 在当前模拟输入或配置映射中，将键 ts 设为 now_ms()。
        # ts 是当前映射表的查找键；now_ms() 是用该键读取时取得的值
        "lineId": LINE_ID,
        # 在当前模拟输入或配置映射中，将键 lineId 设为 LINE_ID。
        # lineId 是当前映射表的查找键；LINE_ID 是用该键读取时取得的值
        "state": state,
        # 在当前模拟输入或配置映射中，将键 state 设为 state。
        # state 是当前映射表的查找键；state 是用该键读取时取得的值
        "productCode": str(values.get("line.productCode", "") or ""),
        # 在当前模拟输入或配置映射中，将键 productCode 设为 str(values.get("line.productCode"。
        # productCode 是当前映射表的查找键；str(values.get("line.productCode" 是用该键读取时取得的值
        "goodCount":   int(values.get("line.goodCount", 0) or 0),
        # 在当前模拟输入或配置映射中，将键 goodCount 设为 int(values.get("line.goodCount"。
        # goodCount 是当前映射表的查找键；int(values.get("line.goodCount" 是用该键读取时取得的值
        "ngCount":     int(values.get("line.ngCount", 0) or 0),
        # 在当前模拟输入或配置映射中，将键 ngCount 设为 int(values.get("line.ngCount"。
        # ngCount 是当前映射表的查找键；int(values.get("line.ngCount" 是用该键读取时取得的值
        "beatMs":      int(values.get("line.beatMs", 0) or 0),
        # 在当前模拟输入或配置映射中，将键 beatMs 设为 int(values.get("line.beatMs"。
        # beatMs 是当前映射表的查找键；int(values.get("line.beatMs" 是用该键读取时取得的值
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 本行结束上面最近一层已经介绍的表达式或代码块
    # 这一段实现了把 PLC 状态码和计数数据组装为产线状态帧；返回值或异常由调用方按当前分支处理。


# ---------- 工具 ----------
# 这一段定义 now_ms，用于生成当前毫秒时间戳，作为上行报文的产生时间。
def now_ms() -> int:
# 定义 now_ms，用于生成当前毫秒时间戳，作为上行报文的产生时间。
# now_ms：生成当前毫秒时间戳，作为上行报文的产生时间
    return int(time.time() * 1000)
    # 把int(time.time() * 1000)作为当前函数的结果返回。
    # time：Python 时间与暂停接口
    # 这一段实现了生成当前毫秒时间戳，作为上行报文的产生时间；返回值或异常由调用方按当前分支处理。


# 这一段定义 setup_logging，用于配置采集器日志格式和输出级别。
def setup_logging():
# 定义函数 setup_logging。
# setup_logging：配置采集器日志格式和输出级别
    logging.basicConfig(
    # 执行 basicConfig 对应的本地处理，使用本行提供的数据。
    # logging：Python 日志接口
        level=logging.INFO,
        # 根据 logging.INFO, 设置 level，用于用户操作级别或事件严重级别，依据当前接口结构区分。
        # level：用户操作级别或事件严重级别，依据当前接口结构区分；logging：Python 日志接口
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        # 根据 "%(asctime)s %(levelname)s [%(name)s] %(message)s", 设置 format，供当前流程后续使用。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        datefmt="%Y-%m-%d %H:%M:%S",
        # 根据 "%Y-%m-%d %H:%M:%S", 设置 datefmt，供当前流程后续使用。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    )
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 本行结束上面最近一层已经介绍的表达式或代码块
    # 这一段实现了配置采集器日志格式和输出级别；返回值或异常由调用方按当前分支处理。


# ---------- MQTT 客户端 ----------
# 这一段定义 make_mqtt，用于创建 MQTT 客户端，配置认证、遗嘱和重连参数。
def make_mqtt() -> mqtt.Client:
# 定义函数 make_mqtt。
# make_mqtt：创建 MQTT 客户端，配置认证、遗嘱和重连参数；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
    # client_id 必须唯一（同一时刻两个同 ID 的连接，Broker 会踢掉前一个）
    # ★ 带 PID:万一真起了两个采集器,它们不会在 Broker 上互相踢下线。
    #   （2026-10-23 踩过：两个采集器同 client_id 互踢,表现为"状态偶尔上得来、
    #   下行指令一条也收不到",排查起来极费时间。真正的防线是单实例锁,
    #   这里只是让"万一有两个"不至于互相破坏。）
    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
    # 创建 MQTT 客户端，用于连接消息代理并收发采集报文，将结果保存或写入 c。
    # c：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'plc-edge-{LI… 的结果；mqtt：Paho MQTT 客户端模块，用于发布上行帧并订阅下行指令
                    client_id=f"plc-edge-{LINE_ID}-{os.getpid()}")
                    # 根据 f"plc-edge-{LINE_ID}-{os.getpid()}") 设置 client_id，供当前流程后续使用。
                    # LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；os：Python 操作系统环境变量接口
    # 需要认证才设置账号密码
    if MQTT_USERNAME:
    # 检查MQTT_USERNAME:，按判断结果进入对应的处理分支。
    # MQTT_USERNAME：保存 os.getenv('MQTT_USERNAME') or None 的结果
        c.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        # 设置 MQTT 登录用户名和密码。
        # username_pw_set：设置 MQTT 登录用户名和密码；MQTT_USERNAME：保存 os.getenv('MQTT_USERNAME') or None 的结果；MQTT_PASSWORD：保存 os.getenv('MQTT_PASSWORD') or None 的结果；c：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'plc-edge-{LI… 的结果
    # ★ 遗嘱消息（LWT）：采集器异常掉线时，Broker 自动代发 offline
    #   → 产线离线状态由此自动产生，不需要心跳轮询
    c.will_set(T_EDGE,
    # 配置 MQTT 断线遗嘱消息。
    # c：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'plc-edge-{LI… 的结果；will_set：配置 MQTT 断线遗嘱消息；T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果
               json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
               # 把 Python 对象编码成 JSON 文本。
               # dumps：把 Python 对象编码成 JSON 文本；json：Python JSON 编解码库；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间
               qos=1, retain=True)
               # 根据 1, retain=True) 设置 qos，用于MQTT 消息投递质量等级。
               # qos：MQTT 消息投递质量等级；retain：MQTT 是否保留主题的最后一条消息，本次传入 True
    # 建立连接（keepalive 30 秒）
    c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
    # 尝试建立网络连接。
    # connect：尝试建立网络连接；MQTT_HOST：保存 os.getenv('MQTT_HOST', 'localhost') 的结果；MQTT_PORT：保存 int(os.getenv('MQTT_PORT', '1883')) 的结果；c：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'plc-edge-{LI… 的结果
    # 启动后台网络线程（不调用 loop_start 就没有收发能力）
    c.loop_start()
    # 启动 Paho MQTT 后台网络线程。
    # loop_start：启动 Paho MQTT 后台网络线程；c：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'plc-edge-{LI… 的结果
    return c
    # 把c作为当前函数的结果返回。
    # c：保存 mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f'plc-edge-{LI… 的结果
    # 这一段实现了创建 MQTT 客户端，配置认证、遗嘱和重连参数；返回值或异常由调用方按当前分支处理。


# 这一段定义 publish，用于将契约报文编码为 JSON 并发布到指定 MQTT 主题。

# 这段负责将已组装的业务报文交给 MQTT 客户端发布，调用方已经决定主题、内容和 QoS。
# c 是与 Broker 建立连接的 paho-mqtt 客户端；topic 决定消息栏目，payload 是 Python 字典，json.dumps() 将其编码为 JSON 文本。
# 机器人与 IO 上报可使用 QoS 0，命令回执由对应调用提供自己的投递参数；发布不等于后端已经保存历史或 PLC 已完成物理动作。

def publish(c: mqtt.Client, topic: str, payload: dict, qos=0, retain=False):
# 将 payload 编码为 JSON 文本，交给已连接 Broker 的客户端向 topic 发布。
# c 是 paho-mqtt 客户端；topic 是消息主题；qos 和 retain 来自本次调用参数，决定这次消息的投递选项。
    c.publish(topic, json.dumps(payload, ensure_ascii=False), qos=qos, retain=retain)
    # 把消息发布到指定主题或频道。
    # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；topic：MQTT 发布或订阅使用的主题路径；qos：MQTT 消息投递质量等级，本次传入 qos；retain：MQTT 是否保留主题的最后一条消息，本次传入 retain；c：方法输入参数，类型为 mqtt.Client；dumps：把 Python 对象编码成 JSON 文本；payload：消息或事件携带的数据内容；json：Python JSON 编解码库
    # 这一段实现了将契约报文编码为 JSON 并发布到指定 MQTT 主题；返回值或异常由调用方按当前分支处理。


# ---------- 控制命令 ----------
# 契约 v1.1 type 白名单(对齐 docs/contract/README.md §3.6)
# sig_name 指向 register-mapping.csv 里的 cmd.* 点位;None 表示契约预留(edge 暂不写)
# kind 只用于校验 params;真正的写入一律"只写一次",PLC 侧自行清零脉冲点(见 _write_cmd)
CMD_DISPATCH = {
# 根据 { 设置 CMD_DISPATCH，供当前流程后续使用。
# CMD_DISPATCH：保存 {'start': ('cmd.start', 'pulse'), 'stop': ('cmd.stop', 'pulse'), 'rese… 的结果
    'start':       ('cmd.start',       'pulse'),
    # 在当前模拟输入或配置映射中，将键 start 设为 ('cmd.start'。
    # start 是当前映射表的查找键；('cmd.start' 是用该键读取时取得的值
    'stop':        ('cmd.stop',        'pulse'),
    # 在当前模拟输入或配置映射中，将键 stop 设为 ('cmd.stop'。
    # stop 是当前映射表的查找键；('cmd.stop' 是用该键读取时取得的值
    'reset':       (None,              'noop'),
    # 在当前模拟输入或配置映射中，将键 reset 设为 (None。
    # reset 是当前映射表的查找键；(None 是用该键读取时取得的值
    'changeover':  (None,              'noop'),
    # 在当前模拟输入或配置映射中，将键 changeover 设为 (None。
    # changeover 是当前映射表的查找键；(None 是用该键读取时取得的值
    'mode_set':    ('cmd.modeToggle',  'mode_toggle'),
    # 在当前模拟输入或配置映射中，将键 mode_set 设为 ('cmd.modeToggle'。
    # mode_set 是当前映射表的查找键；('cmd.modeToggle' 是用该键读取时取得的值
    'alarm_clear': (None,              'noop'),
    # 在当前模拟输入或配置映射中，将键 alarm_clear 设为 (None。
    # alarm_clear 是当前映射表的查找键；(None 是用该键读取时取得的值
    'conveyor':    ('cmd.conveyor',    'conveyor'),
    # 在当前模拟输入或配置映射中，将键 conveyor 设为 ('cmd.conveyor'。
    # conveyor 是当前映射表的查找键；('cmd.conveyor' 是用该键读取时取得的值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 本行结束上面最近一层已经介绍的表达式或代码块
# 现场 17 word 表没有 reset / changeover / alarm_clear 对应寄存器,
# 这三个指令回 rejected 而不是假装 acked —— 避免操作员以为生效了。

# 手动模式切换:PLC word 8,值域 {1,2};PLC 完成模式切换后自动置 0
MODE_TOGGLE_VALUE = {'acquire': 1, 'release': 2}
# 根据 {'acquire': 1, 'release': 2} 设置 MODE_TOGGLE_VALUE，供当前流程后续使用。
# MODE_TOGGLE_VALUE：保存 {'acquire': 1, 'release': 2} 的结果
# 传送带:PLC word 10,值域 {0,1},电平型(持续写值)
CONVEYOR_VALUE = {'stop': 0, 'forward': 1}
# 根据 {'stop': 0, 'forward': 1} 设置 CONVEYOR_VALUE，供当前流程后续使用。
# CONVEYOR_VALUE：保存 {'stop': 0, 'forward': 1} 的结果

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
    # 设置字段 0，值为 'waiting_feed',   # 等待入料，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    1:   'feeding',        # 入料中
    # 设置字段 1，值为 'feeding',        # 入料中，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    2:   'assembling',     # 装配中
    # 设置字段 2，值为 'assembling',     # 装配中，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    3:   'waiting_robot',  # 等待机器人完成
    # 设置字段 3，值为 'waiting_robot',  # 等待机器人完成，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    4:   'unload_done',    # 下料完成
    # 设置字段 4，值为 'unload_done',    # 下料完成，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    5:   'waiting_next',   # 等待后站入料
    # 设置字段 5，值为 'waiting_next',   # 等待后站入料，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    100: 'init_error',     # 初始化错误状态
    # 设置字段 100，值为 'init_error',     # 初始化错误状态，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    101: 'stopped',        # 停止状态
    # 设置字段 101，值为 'stopped',        # 停止状态，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    102: 'manual_mode',    # 手动控制模式
    # 设置字段 102，值为 'manual_mode',    # 手动控制模式，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 本行结束上面最近一层已经介绍的表达式或代码块


# 这一段定义 _dispatch_cmd，用于按契约和现场写点分派控制指令，拒绝不支持的动作。
def _dispatch_cmd(plc: Plc, cmd_type: str, params: dict) -> tuple[bool, str]:
# 定义函数 _dispatch_cmd。
# _dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；plc：方法输入参数，类型为 Plc；Plc：本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理；cmd_type：方法输入参数，类型为 str；params：指令附加参数对象
    """返回 (success, message)。False → cmd_ack.status=rejected,True → acked。"""
    spec = CMD_DISPATCH.get(cmd_type)
    # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 spec。
    # spec：保存 CMD_DISPATCH.get(cmd_type) 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；cmd_type：方法输入参数，类型为 str；CMD_DISPATCH：保存 {'start': ('cmd.start', 'pulse'), 'stop': ('cmd.stop', 'pulse'), 'rese… 的结果
    if spec is None:
    # 检查spec is None:，按判断结果进入对应的处理分支。
    # spec：保存 CMD_DISPATCH.get(cmd_type) 的结果
        return False, f'未知指令类型: {cmd_type}'
        # 把False, f'未知指令类型: {cmd_type}'作为当前函数的结果返回。
        # cmd_type：方法输入参数，类型为 str
    sig_name, kind = spec
    # 把 spec 的结果赋给 sig_name, kind。
    # spec：保存 CMD_DISPATCH.get(cmd_type) 的结果；sig_name：保存 spec 的结果；kind：保存 spec 的结果
    if sig_name is None:
    # 检查sig_name is None:，按判断结果进入对应的处理分支。
    # sig_name：保存 spec 的结果
        # 现场 PLC 点位表里没有这个点位的寄存器 → 明确拒绝,不能假 ack
        return False, f'现场 PLC 无 {cmd_type} 对应寄存器(register-mapping.csv 未开放该点),指令未下发'
        # 把False, f'现场 PLC 无 {cmd_type} 对应寄存器(register-mapping.csv 未开放该点),指令未下发'作为当前函数的结果返回。
        # cmd_type：方法输入参数，类型为 str
    sig = _cmd_signals.get(sig_name)
    # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 sig。
    # sig：保存 _cmd_signals.get(sig_name) 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；sig_name：保存 spec 的结果；_cmd_signals：本处声明的局部变量，类型为 dict
    if sig is None:
    # 检查sig is None:，按判断结果进入对应的处理分支。
    # sig：保存 _cmd_signals.get(sig_name) 的结果
        return False, f'点位 {sig_name} 未在 register-mapping.csv 配置'
        # 把False, f'点位 {sig_name} 未在 register-mapping.csv 配置'作为当前函数的结果返回。
        # sig_name：保存 spec 的结果
    params = params or {}
    # 根据 params or {} 设置 params，用于指令附加参数对象。
    # params：指令附加参数对象

    if kind == 'pulse':
    # 检查kind == 'pulse':，按判断结果进入对应的处理分支。
    # kind：保存 spec 的结果
        value = 1
        # 根据 1 设置 value，用于当前字段或点位的实际取值。
        # value：当前字段或点位的实际取值
    elif kind == 'mode_toggle':
    # 检查kind == 'mode_toggle':，按判断结果进入对应的处理分支。
    # kind：保存 spec 的结果
        act = params.get('action')
        # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 act。
        # act：保存 params.get('action') 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；params：指令附加参数对象
        if act not in MODE_TOGGLE_VALUE:
        # 检查act not in MODE_TOGGLE_VALUE:，按判断结果进入对应的处理分支。
        # act：保存 params.get('action') 的结果；MODE_TOGGLE_VALUE：保存 {'acquire': 1, 'release': 2} 的结果
            return False, (f'mode_set.params.action 必须是 '
            # 把False, (f'mode_set.params.action 必须是 '作为当前函数的结果返回。
            # params：指令附加参数对象
                           f'{list(MODE_TOGGLE_VALUE.keys())},收到 {act!r}')
                           # 调用 list；括号中的表达式是传入的参数，供当前处理流程继续使用。
                           # MODE_TOGGLE_VALUE：保存 {'acquire': 1, 'release': 2} 的结果；keys：取得字典或对象中的所有键；act：保存 params.get('action') 的结果
        value = MODE_TOGGLE_VALUE[act]
        # 根据 MODE_TOGGLE_VALUE[act] 设置 value，用于当前字段或点位的实际取值。
        # value：当前字段或点位的实际取值；MODE_TOGGLE_VALUE：保存 {'acquire': 1, 'release': 2} 的结果；act：保存 params.get('action') 的结果
    elif kind == 'conveyor':
    # 检查kind == 'conveyor':，按判断结果进入对应的处理分支。
    # kind：保存 spec 的结果
        act = params.get('action')
        # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 act。
        # act：保存 params.get('action') 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；params：指令附加参数对象
        if act not in CONVEYOR_VALUE:
        # 检查act not in CONVEYOR_VALUE:，按判断结果进入对应的处理分支。
        # act：保存 params.get('action') 的结果；CONVEYOR_VALUE：保存 {'stop': 0, 'forward': 1} 的结果
            return False, (f'conveyor.params.action 必须是 '
            # 把False, (f'conveyor.params.action 必须是 '作为当前函数的结果返回。
            # params：指令附加参数对象
                           f'{list(CONVEYOR_VALUE.keys())},收到 {act!r}')
                           # 调用 list；括号中的表达式是传入的参数，供当前处理流程继续使用。
                           # CONVEYOR_VALUE：保存 {'stop': 0, 'forward': 1} 的结果；keys：取得字典或对象中的所有键；act：保存 params.get('action') 的结果
        value = CONVEYOR_VALUE[act]
        # 根据 CONVEYOR_VALUE[act] 设置 value，用于当前字段或点位的实际取值。
        # value：当前字段或点位的实际取值；CONVEYOR_VALUE：保存 {'stop': 0, 'forward': 1} 的结果；act：保存 params.get('action') 的结果
    else:
    # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        return False, f'未知 kind={kind}'
        # 把False, f'未知 kind={kind}'作为当前函数的结果返回。
        # kind：保存 spec 的结果

    return _write_cmd(plc, sig.address, value)
    # 把_write_cmd(plc, sig.address, value)作为当前函数的结果返回。
    # _write_cmd：在 PLC 连接和锁保护下写入一个控制寄存器并返回结果；plc：方法输入参数，类型为 Plc；address：Modbus 寄存器起始地址，使用从 0 开始的编号；value：当前字段或点位的实际取值；sig：保存 _cmd_signals.get(sig_name) 的结果
    # 这一段实现了按契约和现场写点分派控制指令，拒绝不支持的动作；返回值或异常由调用方按当前分支处理。


# 这一段定义 _write_cmd，用于在 PLC 连接和锁保护下写入一个控制寄存器并返回结果。

# 控制链到这里才真正写 PLC：_dispatch_cmd() 已经把 start 等业务指令对应到点表地址和写入值。
# plc 是已有的现场客户端；address 是寄存器地址，value 是本次要写的值，plc.unit 指定 Modbus 从站编号。
# write_register() 返回的 rr 是本次写请求响应；返回 True 只表示取得正常 Modbus 写响应，不能据此宣布物理动作完成。
# 当前相关脉冲点按既有约定由 PLC 清零，Python 只写一次；未连接、错误响应或异常分别返回失败信息。

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
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        with plc.lock:
        # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
        # plc：方法输入参数，类型为 Plc
            if not plc.connected:
            # 检查not plc.connected:，按判断结果进入对应的处理分支。
            # plc：方法输入参数，类型为 Plc；connected：连接是否已建立的状态标记
                LOG.error('PLC 未连接,拒绝下发 addr=%d,value=%d(不假 ack)', address, value)
                # 记录错误日志或显示失败提示，以接收对象为准。
                # error：记录错误日志或显示失败提示，以接收对象为准；address：Modbus 寄存器起始地址，使用从 0 开始的编号；value：当前字段或点位的实际取值，本次传入 %d(不假 ack；LOG：保存 logging.getLogger('plc-collector') 的结果
                return False, 'PLC 未连接,指令未下发'
                # 把False, 'PLC 未连接,指令未下发'作为当前函数的结果返回。
                # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理

            # 按已确定的地址和值发出一次 Modbus 写请求，并把响应保存到 rr。
            # 随后检查 rr.isError() 决定返回成功或失败；这一步没有等待独立的现场动作完成信号。

            rr = plc.cli.write_register(address=address, value=value, device_id=plc.unit)
            # 向 PLC 写入指定寄存器，将结果保存或写入 rr。
            # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；write_register：向一个 Modbus 保持寄存器写入指定值，返回写入响应；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 address；value：当前字段或点位的实际取值，本次传入 value；device_id：pymodbus 当前接口的目标设备站号参数，本次传入 plc.unit；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；unit：设备站号或点位物理单位，依据所在对象区分；plc：方法输入参数，类型为 Plc
        if rr.isError():
        # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
        # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
            return False, f'PLC 写寄存器失败: {rr}'
            # 把False, f'PLC 写寄存器失败: {rr}'作为当前函数的结果返回。
            # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
        return True, ''
        # 把True, ''作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    except Exception as exc:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        return False, f'PLC 通信异常: {exc}'
        # 把False, f'PLC 通信异常: {exc}'作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
        # 这一段实现了在 PLC 连接和锁保护下写入一个控制寄存器并返回结果；返回值或异常由调用方按当前分支处理。


# 这一段定义 on_command，用于构造 MQTT 控制消息回调，解析指令并发布回执。

# 这段把 MQTT 命令接收接回现场写入，并为本次命令生成带 cmdId 的业务回执。
# 回调从 msg.payload 读取 JSON，取得 type、params、cmdId，再调用 _dispatch_cmd() 选择写点和处理分支。
# 写入结果被组装为 cmd_ack 发布回 Broker；后端靠 cmdId 更新控制记录，再向网页发 command_ack。
# 这里的 acked 表示本次 Modbus 写入正常响应；当前没有按 cmdId 持久保存并过滤已执行命令。

def on_command(c: mqtt.Client, plc: Plc):
# 为 MQTT 命令安装接收处理：解析报文、按契约分发、调用现场写入，再发布带编号的回执。
# c 是 MQTT 客户端；plc 是现场连接对象；回调 msg.payload 中的 cmdId 用来对应后端控制记录和网页等待结果。
    """订阅控制指令。校验白名单 → 真写 PLC(PLC 未连则 rejected)→ 回 cmd_ack。
    cmdId 缺失 → 回 rejected;ack 始终回(契约 §3.7)。"""
    # 内部回调函数（paho 的签名：client, userdata, message）
    # 这一段定义 _cb，用于解析收到的控制消息，分派现场写入并组装回执。
    def _cb(_client, _userdata, msg):
    # 定义 _cb，用于解析收到的控制消息，分派现场写入并组装回执。
    # _cb：解析收到的控制消息，分派现场写入并组装回执；_client：方法输入参数；_userdata：方法输入参数；msg：当前收到的消息或提示文字
        cmd_id, ack_status, ack_msg = '', 'failed', ''
        # 把 '', 'failed', '' 的结果赋给 cmd_id, ack_status, ack_msg。
        # cmd_id：保存 ('', 'failed', '') 的结果；ack_status：保存 ('', 'failed', '') 的结果；ack_msg：保存 ('', 'failed', '') 的结果
        try:
        # 开始执行可能失败的操作，错误由后续异常分支处理。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 解析指令 JSON
            cmd = json.loads(msg.payload.decode("utf-8"))
            # 把 JSON 文本解码成 Python 对象，将结果保存或写入 cmd。
            # cmd：保存 json.loads(msg.payload.decode('utf-8')) 的结果；loads：把 JSON 文本解码成 Python 对象；json：Python JSON 编解码库；decode：把字节序列解码成字符串；payload：消息或事件携带的数据内容；msg：当前收到的消息或提示文字
            cmd_id = cmd.get('cmdId') or ''
            # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 cmd_id。
            # cmd_id：保存 cmd.get('cmdId') or '' 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；cmd：保存 json.loads(msg.payload.decode('utf-8')) 的结果
            cmd_type = cmd.get('type')
            # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 cmd_type。
            # cmd_type：保存 cmd.get('type') 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；cmd：保存 json.loads(msg.payload.decode('utf-8')) 的结果
            params = cmd.get('params') or {}
            # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 params。
            # params：指令附加参数对象；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；cmd：保存 json.loads(msg.payload.decode('utf-8')) 的结果
            LOG.info('收到指令 type=%s cmdId=%s topic=%s', cmd_type, cmd_id, msg.topic)
            # 记录运行信息或显示普通提示，以接收对象为准。
            # info：记录运行信息或显示普通提示，以接收对象为准；cmd_type：保存 cmd.get('type') 的结果；cmd_id：保存 cmd.get('cmdId') or '' 的结果；topic：MQTT 发布或订阅使用的主题路径，本次传入 %s'；LOG：保存 logging.getLogger('plc-collector') 的结果；msg：当前收到的消息或提示文字
            if not cmd_id:
            # 检查not cmd_id:，按判断结果进入对应的处理分支。
            # cmd_id：保存 cmd.get('cmdId') or '' 的结果
                ack_status, ack_msg = 'rejected', 'cmdId 缺失'
                # 把 'rejected', 'cmdId 缺失' 的结果赋给 ack_status, ack_msg。
                # ack_status：保存 ('rejected', 'cmdId 缺失') 的结果；ack_msg：保存 ('rejected', 'cmdId 缺失') 的结果
            else:
            # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
                ok, ack_msg = _dispatch_cmd(plc, cmd_type, params)
                # 把 _dispatch_cmd(plc, cmd_type, params) 的结果赋给 ok, ack_msg。
                # ok：操作是否成功的布尔结果；ack_msg：保存 _dispatch_cmd(plc, cmd_type, params) 的结果；_dispatch_cmd：按契约和现场写点分派控制指令，拒绝不支持的动作；plc：方法输入参数，类型为 Plc；cmd_type：保存 cmd.get('type') 的结果；params：指令附加参数对象
                ack_status = 'acked' if ok else 'rejected'
                # 根据 'acked' if ok else 'rejected' 设置 ack_status，供当前流程后续使用。
                # ack_status：保存 'acked' if ok else 'rejected' 的结果；ok：操作是否成功的布尔结果
        except Exception as exc:
        # 接收并处理上一段操作产生的异常。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            LOG.error('处理指令异常: %s', exc)
            # 记录错误日志或显示失败提示，以接收对象为准。
            # error：记录错误日志或显示失败提示，以接收对象为准；LOG：保存 logging.getLogger('plc-collector') 的结果
            ack_status, ack_msg = 'failed', str(exc)
            # 把 'failed', str(exc) 的结果赋给 ack_status, ack_msg。
            # ack_status：保存 ('failed', str(exc)) 的结果；ack_msg：保存 ('failed', str(exc)) 的结果
        finally:
        # 执行无论上面操作成功还是失败都需要的清理步骤。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            if cmd_id:
            # 检查cmd_id:，按判断结果进入对应的处理分支。
            # cmd_id：保存 cmd.get('cmdId') or '' 的结果
                # 回执：cmdId 必须原样带回，后端靠它更新 control_commands 状态
                publish(c, T_ACK, {
                # 把消息发布到指定主题或频道。
                # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；c：方法输入参数，类型为 mqtt.Client；T_ACK：保存 f'tl/v1/{LINE_ID}/cmd_ack' 的结果
                    'cmdId': cmd_id,
                    # 在当前模拟输入或配置映射中，将键 cmdId 设为 cmd_id。
                    # cmdId 是当前映射表的查找键；cmd_id 是用该键读取时取得的值
                    'ts': now_ms(),
                    # 在当前模拟输入或配置映射中，将键 ts 设为 now_ms()。
                    # ts 是当前映射表的查找键；now_ms() 是用该键读取时取得的值
                    'status': ack_status,
                    # 在当前模拟输入或配置映射中，将键 status 设为 ack_status。
                    # status 是当前映射表的查找键；ack_status 是用该键读取时取得的值
                    'message': ack_msg or '',
                    # 在当前模拟输入或配置映射中，将键 message 设为 ack_msg or ''。
                    # message 是当前映射表的查找键；ack_msg or '' 是用该键读取时取得的值
                }, qos=1)
                # 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
                # qos：MQTT 消息投递质量等级，本次传入 1
                # 这一段实现了解析收到的控制消息，分派现场写入并组装回执；返回值或异常由调用方按当前分支处理。
    # ★ 用 message_callback_add 而不是全局 on_message：
    #   这样以后要加别的订阅主题不会互相覆盖
    c.message_callback_add(T_CMD, _cb)
    # 为指定 MQTT 主题注册消息回调函数。
    # T_CMD：保存 f'tl/v1/{LINE_ID}/cmd/+' 的结果；_cb：解析收到的控制消息，分派现场写入并组装回执；c：方法输入参数，类型为 mqtt.Client
    # 订阅下行指令主题（QoS 1：指令不能丢）
    c.subscribe(T_CMD, qos=1)
    # 订阅消息主题、频道或事件流。
    # subscribe：订阅消息主题、频道或事件流；T_CMD：保存 f'tl/v1/{LINE_ID}/cmd/+' 的结果；qos：MQTT 消息投递质量等级，本次传入 1；c：方法输入参数，类型为 mqtt.Client
    # 这一段实现了构造 MQTT 控制消息回调，解析指令并发布回执；返回值或异常由调用方按当前分支处理。


# ---------- 主循环 ----------
# 这一段定义 main，用于读取点位配置并循环采集 PLC，发布遥测、IO、工序与心跳报文。
def main():
# 定义 main，用于读取点位配置并循环采集 PLC，发布遥测、IO、工序与心跳报文。
# main：本文件定义的函数，用于运行  的入口流程
    # 配置日志
    setup_logging()
    # 配置采集器日志格式和输出级别。
    # setup_logging：配置采集器日志格式和输出级别

    # ★ 单实例保护:拿不到独占锁 = 已经有一个采集器在跑,直接退出。
    #   PLC 的 MB_SERVER 只接受一条连接,两个采集器必然有一个连不上;
    #   更糟的是同 client_id 会在 Broker 上互踢,导致下行指令收不到。
    lock_fh = acquire_single_instance_lock(LOCK_FILE)
    # 取得本机文件锁，阻止重复启动 PLC 采集进程，将结果保存或写入 lock_fh。
    # lock_fh：保存 acquire_single_instance_lock(LOCK_FILE) 的结果；acquire_single_instance_lock：取得本机文件锁，阻止重复启动 PLC 采集进程；LOCK_FILE：保存 Path(os.getenv('COLLECTOR_LOCK_FILE', str(Path(__file__).with_name('.p… 的结果
    if lock_fh is None:
    # 检查lock_fh is None:，按判断结果进入对应的处理分支。
    # lock_fh：保存 acquire_single_instance_lock(LOCK_FILE) 的结果
        LOG.error("已有采集器在运行(锁 %s 被占用),本进程退出。"
        # 记录错误日志或显示失败提示，以接收对象为准。
        # LOG：保存 logging.getLogger('plc-collector') 的结果；error：记录错误日志或显示失败提示，以接收对象为准
                  "重复起采集器会抢 PLC 连接并互踢 MQTT,不要再起第二个。", LOCK_FILE)
                  # 把重复启动采集器的错误提示和锁文件路径传给日志或异常。
                  # LOCK_FILE：保存 Path(os.getenv('COLLECTOR_LOCK_FILE', str(Path(__file__).with_name('.p… 的结果
        sys.exit(1)
        # 以指定状态码结束当前进程或处理流程。
        # sys：Python 运行环境与退出状态接口
    LOG.info("单实例锁已获取: %s", LOCK_FILE)
    # 记录运行信息或显示普通提示，以接收对象为准。
    # info：记录运行信息或显示普通提示，以接收对象为准；LOCK_FILE：保存 Path(os.getenv('COLLECTOR_LOCK_FILE', str(Path(__file__).with_name('.p… 的结果；LOG：保存 logging.getLogger('plc-collector') 的结果

    # 打印关键配置，排障时第一眼就能确认连的是哪台 PLC、哪个 Broker
    LOG.info("PLC: %s:%d  unit=%d  poll=%dms", PLC_HOST, PLC_PORT, PLC_UNIT_ID, PLC_POLL_MS)
    # 记录运行信息或显示普通提示，以接收对象为准。
    # info：记录运行信息或显示普通提示，以接收对象为准；PLC_HOST：保存 os.getenv('PLC_HOST', '192.168.10.31') 的结果；PLC_PORT：保存 int(os.getenv('PLC_PORT', '503')) 的结果；PLC_UNIT_ID：保存 int(os.getenv('PLC_UNIT_ID', '2')) 的结果；PLC_POLL_MS：保存 int(os.getenv('PLC_POLL_MS', '200')) 的结果；LOG：保存 logging.getLogger('plc-collector') 的结果
    LOG.info("MQTT: %s:%d  line=%s  robot=%s", MQTT_HOST, MQTT_PORT, LINE_ID, ROBOT_ID)
    # 记录运行信息或显示普通提示，以接收对象为准。
    # info：记录运行信息或显示普通提示，以接收对象为准；MQTT_HOST：保存 os.getenv('MQTT_HOST', 'localhost') 的结果；MQTT_PORT：保存 int(os.getenv('MQTT_PORT', '1883')) 的结果；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；ROBOT_ID：保存 os.getenv('ROBOT_ID', 'robot-01') 的结果；LOG：保存 logging.getLogger('plc-collector') 的结果

    # 加载点位表
    signals = _read_csv(MAPPING_FILE)
    # 读取点位映射表，将可读信号与控制写点分开保存，将结果保存或写入 signals。
    # signals：保存 _read_csv(MAPPING_FILE) 的结果；_read_csv：读取点位映射表，将可读信号与控制写点分开保存；MAPPING_FILE：保存 Path(os.getenv('MAPPING_FILE', str(Path(__file__).with_name('register-… 的结果
    # 一个点位都没有 → 没法采，直接退出（继续跑也没意义）
    if not signals:
    # 检查not signals:，按判断结果进入对应的处理分支。
    # signals：保存 _read_csv(MAPPING_FILE) 的结果
        LOG.error("无可用点位,退出。请编辑 %s 后重试。", MAPPING_FILE)
        # 记录错误日志或显示失败提示，以接收对象为准。
        # error：记录错误日志或显示失败提示，以接收对象为准；MAPPING_FILE：保存 Path(os.getenv('MAPPING_FILE', str(Path(__file__).with_name('register-… 的结果；LOG：保存 logging.getLogger('plc-collector') 的结果
        sys.exit(1)
        # 以指定状态码结束当前进程或处理流程。
        # sys：Python 运行环境与退出状态接口

    # 建立 PLC 连接对象与 MQTT 连接
    plc = Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID)
    # 创建或使用本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理，将结果保存或写入 plc。
    # plc：保存 Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID) 的结果；Plc：本文件封装的 PLC 客户端，负责串行读写、重连和通信状态管理；PLC_HOST：保存 os.getenv('PLC_HOST', '192.168.10.31') 的结果；PLC_PORT：保存 int(os.getenv('PLC_PORT', '503')) 的结果；PLC_UNIT_ID：保存 int(os.getenv('PLC_UNIT_ID', '2')) 的结果
    mq = make_mqtt()
    # 创建 MQTT 客户端，配置认证、遗嘱和重连参数，将结果保存或写入 mq。
    # mq：保存 make_mqtt() 的结果；make_mqtt：创建 MQTT 客户端，配置认证、遗嘱和重连参数
    # 订阅下行指令
    on_command(mq, plc)
    # 构造 MQTT 控制消息回调，解析指令并发布回执。
    # on_command：构造 MQTT 控制消息回调，解析指令并发布回执；mq：保存 make_mqtt() 的结果；plc：保存 Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID) 的结果

    # 上线声明（retained）：后端任何时候订阅都能立刻拿到 online
    publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
    # 把消息发布到指定主题或频道。
    # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；mq：保存 make_mqtt() 的结果；T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果；ts：数据产生时的毫秒时间戳；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间；lineId：产线标识，接口通常使用 line-01 等编码；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；status：当前连接、产线、请求或指令的状态字段
            qos=1, retain=True)
            # 根据 1, retain=True) 设置 qos，用于MQTT 消息投递质量等级。
            # qos：MQTT 消息投递质量等级；retain：MQTT 是否保留主题的最后一条消息，本次传入 True

    # 上次发产线状态的时间（用于限速到 1Hz）
    last_status_pub = 0.0
    # 根据 0.0 设置 last_status_pub，供当前流程后续使用。
    # last_status_pub：保存 0.0 的结果
    # line_status 1Hz retained —— 契约 §2 规定产线状态是 1Hz
    STATUS_PERIOD = 1.0  # line_status 1Hz retained
    # 根据 1.0 # line_status 1Hz retained 设置 STATUS_PERIOD，供当前流程后续使用。
    # STATUS_PERIOD：保存 1.0 的结果
    # edge 心跳:后端把 edge/status 存进 Redis,TTL 只有 300s
    # (server/src/state/line-state.service.ts setEdgeStatus)。
    # edge/status 若只在启动/退出时各发一次,运行满 5 分钟后 Redis key 过期,
    # 前端 snapshot 的 edge 就永久变 null。这里按 EDGE_HEARTBEAT_S 周期重发
    # 上线声明(retain),保活后端的 Redis key。
    EDGE_HEARTBEAT_S = float(os.getenv("EDGE_HEARTBEAT_S", "30"))
    # 将输入转换为浮点数，供带缩放的测量值计算，将结果保存或写入 EDGE_HEARTBEAT_S。
    # EDGE_HEARTBEAT_S：保存 float(os.getenv('EDGE_HEARTBEAT_S', '30')) 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
    last_edge_pub = time.time()
    # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 last_edge_pub。
    # last_edge_pub：保存 time.time() 的结果；time：Python 时间与暂停接口

    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        while True:
        # 持续检查True:，按判断结果进入对应的处理分支。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 记录本轮开始时间（用于精确控制轮询周期）
            t_loop = time.time()
            # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 t_loop。
            # t_loop：保存 time.time() 的结果；time：Python 时间与暂停接口
            # 心跳放在 PLC 读取之前 —— PLC 断线时也要发,否则后端会以为 edge 掉线
            if t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:
            # 检查t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:，按判断结果进入对应的处理分支。
            # t_loop：保存 time.time() 的结果；last_edge_pub：保存 time.time() 的结果；EDGE_HEARTBEAT_S：保存 float(os.getenv('EDGE_HEARTBEAT_S', '30')) 的结果
                last_edge_pub = t_loop
                # 根据 t_loop 设置 last_edge_pub，供当前流程后续使用。
                # last_edge_pub：保存 t_loop 的结果；t_loop：保存 time.time() 的结果
                publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
                # 把消息发布到指定主题或频道。
                # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；mq：保存 make_mqtt() 的结果；T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果；ts：数据产生时的毫秒时间戳；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间；lineId：产线标识，接口通常使用 line-01 等编码；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；status：当前连接、产线、请求或指令的状态字段
                        qos=1, retain=True)
                        # 根据 1, retain=True) 设置 qos，用于MQTT 消息投递质量等级。
                        # qos：MQTT 消息投递质量等级；retain：MQTT 是否保留主题的最后一条消息，本次传入 True
                LOG.debug("edge 心跳已发")
                # 执行 debug 对应的本地处理，使用本行提供的数据。
                # LOG：保存 logging.getLogger('plc-collector') 的结果
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
            # values：取得字典或映射中的所有值
                LOG.warning("PLC 无响应,1s 后重试")
                # 记录本次异常或状态的警告日志。
                # LOG：保存 logging.getLogger('plc-collector') 的结果
                time.sleep(1.0)
                # 暂停当前线程指定秒数。
                # sleep：暂停当前线程指定秒数；time：Python 时间与暂停接口
                continue
                # 跳过本轮剩余语句，进入下一次循环。
                # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定

            # 1) 机器人遥测 (5~10Hz,这里跟随 poll)
            # ---- 1) 机器人遥测 (5~10Hz,这里跟随 poll) ----
            # 按点位表组装成契约 §3.1 的 robot_state 报文
            tele = group_signals(signals, values)
            # 把采集值整理成契约报文，将结果保存或写入 tele。
            # tele：保存 group_signals(signals, values) 的结果；group_signals：按信号命名空间组装机器人遥测所需的报文字段；signals：保存 _read_csv(MAPPING_FILE) 的结果；values：取得字典或映射中的所有值
            # 有 deviceId 才说明采到了 robot.* 的点位
            if "deviceId" in tele:
            # 检查"deviceId" in tele:，按判断结果进入对应的处理分支。
            # tele：保存 group_signals(signals, values) 的结果
                publish(mq, T_ROBOT, tele, qos=0)
                # 把消息发布到指定主题或频道。
                # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；mq：保存 make_mqtt() 的结果；T_ROBOT：保存 f'tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}' 的结果；tele：保存 group_signals(signals, values) 的结果；qos：MQTT 消息投递质量等级，本次传入 0

            # 2) 产线 IO (跟随 poll;word 11..16,契约 §3.8)
            io_msg = io_payload(signals, values)
            # 把采集值整理成契约报文，将结果保存或写入 io_msg。
            # io_msg：保存 io_payload(signals, values) 的结果；io_payload：把已采集的六个 IO 点位组装为契约规定的信号帧；signals：保存 _read_csv(MAPPING_FILE) 的结果；values：取得字典或映射中的所有值
            if io_msg is not None:
            # 检查io_msg is not None:，按判断结果进入对应的处理分支。
            # io_msg：保存 io_payload(signals, values) 的结果
                publish(mq, T_IO, io_msg, qos=0)
                # 把消息发布到指定主题或频道。
                # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；mq：保存 make_mqtt() 的结果；T_IO：保存 f'tl/v1/{LINE_ID}/telemetry/io' 的结果；io_msg：保存 io_payload(signals, values) 的结果；qos：MQTT 消息投递质量等级，本次传入 0

            # ---- 2) 产线状态 (1Hz, retained) ----
            now = time.time()
            # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 now。
            # now：取得当前时间戳；Date.now 使用毫秒；time：Python 时间与暂停接口
            # 距离上次发布已超过 1 秒才发
            if now - last_status_pub >= STATUS_PERIOD:
            # 检查now - last_status_pub >= STATUS_PERIOD:，按判断结果进入对应的处理分支。
            # now：取得当前时间戳；Date.now 使用毫秒；last_status_pub：保存 0.0 的结果；STATUS_PERIOD：保存 1.0 的结果
                last_status_pub = now
                # 根据 now 设置 last_status_pub，供当前流程后续使用。
                # last_status_pub：保存 now 的结果；now：取得当前时间戳；Date.now 使用毫秒
                publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)
                # 把消息发布到指定主题或频道。
                # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；mq：保存 make_mqtt() 的结果；T_STATUS：保存 f'tl/v1/{LINE_ID}/telemetry/status' 的结果；qos：MQTT 消息投递质量等级，本次传入 1；retain：MQTT 是否保留主题的最后一条消息，本次传入 True；line_status_payload：把 PLC 状态码和计数数据组装为产线状态帧；values：取得字典或映射中的所有值

            # 4) 报警:alarmCode 变化时上报一次事件
            # (简化:采集者自行维护上一次值;这里留给上层)

            # ---- 控制轮询节奏 ----
            # 本轮实际耗时
            dt = time.time() - t_loop
            # 读取当前 Unix 时间，供采集间隔与消息时间戳计算，将结果保存或写入 dt。
            # dt：保存 time.time() - t_loop 的结果；t_loop：保存 time.time() 的结果；time：Python 时间与暂停接口
            # 目标周期 - 实际耗时 = 还要睡多久（不能为负）
            sleep_s = max(0.0, PLC_POLL_MS / 1000.0 - dt)
            # 执行 max 对应的本地处理，使用本行提供的数据，将结果保存或写入 sleep_s。
            # sleep_s：保存 max(0.0, PLC_POLL_MS / 1000.0 - dt) 的结果；dt：保存 time.time() - t_loop 的结果；PLC_POLL_MS：保存 int(os.getenv('PLC_POLL_MS', '200')) 的结果
            time.sleep(sleep_s)
            # 暂停当前线程指定秒数。
            # sleep：暂停当前线程指定秒数；sleep_s：保存 max(0.0, PLC_POLL_MS / 1000.0 - dt) 的结果；time：Python 时间与暂停接口

    except KeyboardInterrupt:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # Ctrl+C 退出
        LOG.info("用户中断,退出")
        # 记录运行信息或显示普通提示，以接收对象为准。
        # info：记录运行信息或显示普通提示，以接收对象为准；LOG：保存 logging.getLogger('plc-collector') 的结果
    finally:
    # 执行无论上面操作成功还是失败都需要的清理步骤。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # ★ 无论怎么退出，都要主动发 offline（正常下线不会触发 LWT）
        publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "offline"},
        # 把消息发布到指定主题或频道。
        # publish：向 MQTT 主题或 Redis 频道发布消息，以客户端类型为准；mq：保存 make_mqtt() 的结果；T_EDGE：保存 f'tl/v1/{LINE_ID}/edge/status' 的结果；ts：数据产生时的毫秒时间戳；now_ms：生成当前毫秒时间戳，作为上行报文的产生时间；lineId：产线标识，接口通常使用 line-01 等编码；LINE_ID：保存 os.getenv('LINE_ID', 'line-01') 的结果；status：当前连接、产线、请求或指令的状态字段
                qos=1, retain=True)
                # 根据 1, retain=True) 设置 qos，用于MQTT 消息投递质量等级。
                # qos：MQTT 消息投递质量等级；retain：MQTT 是否保留主题的最后一条消息，本次传入 True
        # 停网络线程
        mq.loop_stop()
        # 停止 Paho MQTT 后台网络线程。
        # loop_stop：停止 Paho MQTT 后台网络线程；mq：保存 make_mqtt() 的结果
        # 断开 MQTT
        mq.disconnect()
        # 关闭当前通信连接。
        # disconnect：断开实时通信客户端连接；mq：保存 make_mqtt() 的结果
        # 释放单实例锁(进程退出也会自动释放,这里只是别留文件句柄)
        try:
        # 开始执行可能失败的操作，错误由后续异常分支处理。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            lock_fh.close()
            # 关闭当前通信连接。
            # close：关闭连接或释放当前打开的资源；lock_fh：保存 acquire_single_instance_lock(LOCK_FILE) 的结果
        except Exception:
        # 接收并处理上一段操作产生的异常。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            pass
            # 保留空代码块；这里暂时不执行操作。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 关 PLC 连接
        plc.close()
        # 关闭当前通信连接。
        # close：关闭连接或释放当前打开的资源；plc：保存 Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID) 的结果
        # 这一段实现了读取点位配置并循环采集 PLC，发布遥测、IO、工序与心跳报文；返回值或异常由调用方按当前分支处理。


# 程序的直接入口（被 import 时不执行）
if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    main()
    # 执行 main 对应的本地处理，使用本行提供的数据。
    # main：本文件定义的函数，用于运行  的入口流程
    # 这一段提供了采集 PLC 寄存器并通过 MQTT 发布状态，同时接收受限控制指令所需的定义和处理逻辑，结果交由调用方或运行环境使用。
