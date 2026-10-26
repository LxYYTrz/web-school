# edge/plc_collector.py 逐行注释

[打开源码](../../../edge/plc_collector.py) · 678 行 · 397 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 25 行**

```text
import csv
# 注释：从 Python 环境 导入 csv，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 26 行**

```text
import json
# 注释：从 Python 环境 导入 json，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 27 行**

```text
import logging
# 注释：从 Python 环境 导入 logging，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 28 行**

```text
import os
# 注释：从 Python 环境 导入 os，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 29 行**

```text
import struct
# 注释：从 Python 环境 导入 struct，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 30 行**

```text
import sys
# 注释：从 Python 环境 导入 sys，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 31 行**

```text
import threading
# 注释：从 Python 环境 导入 threading，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 32 行**

```text
import time
# 注释：从 Python 环境 导入 time，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 33 行**

```text
from collections import defaultdict
# 注释：从 collections 导入 defaultdict，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 34 行**

```text
from dataclasses import dataclass
# 注释：从 dataclasses 导入 dataclass，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 35 行**

```text
from pathlib import Path
# 注释：从 pathlib 导入 Path，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 36 行**

```text
from typing import Any
# 注释：从 typing 导入 Any，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 38 行**

```text
import paho.mqtt.client as mqtt
# 注释：从 Python 环境 导入 paho.mqtt.client as mqtt，供后续代码使用。 关键字：`import`＝导入模块或符号；`as`＝为导入或上下文对象命名。
```

**源码第 39 行**

```text
from pymodbus.client import ModbusTcpClient
# 注释：从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 40 行**

```text
from pymodbus.client.mixin import ModbusClientMixin
# 注释：从 pymodbus.client.mixin 导入 ModbusClientMixin，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 43 行**

```text
LOG = logging.getLogger("plc-collector")
# 注释：给 `LOG` 赋值。
```

**源码第 46 行**

```text
PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")
# 注释：给 `PLC_HOST` 赋值。
```

**源码第 48 行**

```text
PLC_PORT        = int(os.getenv("PLC_PORT", "503"))
# 注释：给 `PLC_PORT` 赋值。
```

**源码第 50 行**

```text
PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))
# 注释：给 `PLC_UNIT_ID` 赋值。
```

**源码第 52 行**

```text
PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))
# 注释：给 `PLC_POLL_MS` 赋值。
```

**源码第 56 行**

```text
PLC_WORD_ORDER  = os.getenv("PLC_WORD_ORDER", "BIG").upper()
# 注释：给 `PLC_WORD_ORDER` 赋值。
```

**源码第 58 行**

```text
MQTT_HOST       = os.getenv("MQTT_HOST", "localhost")
# 注释：给 `MQTT_HOST` 赋值。
```

**源码第 59 行**

```text
MQTT_PORT       = int(os.getenv("MQTT_PORT", "1883"))
# 注释：给 `MQTT_PORT` 赋值。
```

**源码第 61 行**

```text
MQTT_USERNAME   = os.getenv("MQTT_USERNAME") or None
# 注释：给 `MQTT_USERNAME` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。
```

**源码第 62 行**

```text
MQTT_PASSWORD   = os.getenv("MQTT_PASSWORD") or None
# 注释：给 `MQTT_PASSWORD` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。
```

**源码第 64 行**

```text
LINE_ID         = os.getenv("LINE_ID", "line-01")
# 注释：给 `LINE_ID` 赋值。
```

**源码第 65 行**

```text
ROBOT_ID        = os.getenv("ROBOT_ID", "robot-01")
# 注释：给 `ROBOT_ID` 赋值。
```

**源码第 68 行**

```text
MAPPING_FILE    = Path(os.getenv("MAPPING_FILE",
# 注释：给 `MAPPING_FILE` 赋值。
```

**源码第 69 行**

```text
                                str(Path(__file__).with_name("register-mapping.csv"))))
# 注释：调用函数或对象方法并传入参数。
```

**源码第 73 行**

```text
T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"
# 注释：给 `T_ROBOT` 赋值。
```

**源码第 74 行**

```text
T_IO     = f"tl/v1/{LINE_ID}/telemetry/io"
# 注释：给 `T_IO` 赋值。
```

**源码第 76 行**

```text
T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"
# 注释：给 `T_STATUS` 赋值。
```

**源码第 78 行**

```text
T_EVENT  = f"tl/v1/{LINE_ID}/event"
# 注释：给 `T_EVENT` 赋值。
```

**源码第 80 行**

```text
T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"
# 注释：给 `T_EDGE` 赋值。
```

**源码第 82 行**

```text
T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"
# 注释：给 `T_CMD` 赋值。
```

**源码第 84 行**

```text
T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"
# 注释：给 `T_ACK` 赋值。
```

**源码第 88 行**

```text
_cmd_signals: dict = {}
# 注释：给 `_cmd_signals` 赋值。
```

**源码第 95 行**

```text
LOCK_FILE = Path(os.getenv("COLLECTOR_LOCK_FILE",
# 注释：给 `LOCK_FILE` 赋值。
```

**源码第 96 行**

```text
                           str(Path(__file__).with_name(".plc_collector.lock"))))
# 注释：调用函数或对象方法并传入参数。
```

**源码第 99 行**

```text
def acquire_single_instance_lock(path: Path):
# 注释：定义函数 `acquire_single_instance_lock`。 关键字：`def`＝定义 Python 函数。
```

**源码第 105 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 106 行**

```text
        fh = path.open("a+b")
# 注释：给 `fh` 赋值。
```

**源码第 107 行**

```text
    except OSError as exc:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 108 行**

```text
        LOG.warning("锁文件打不开(%s),不启用单实例保护", exc)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 109 行**

```text
        return None
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。
```

**源码第 110 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 111 行**

```text
        if os.name == "nt":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 112 行**

```text
            import msvcrt
# 注释：从 Python 环境 导入 msvcrt，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 113 行**

```text
            fh.seek(0)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 114 行**

```text
            if fh.tell() == 0:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 115 行**

```text
                fh.write(b"0")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 116 行**

```text
                fh.flush()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 117 行**

```text
            fh.seek(0)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 118 行**

```text
            msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 119 行**

```text
        else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 120 行**

```text
            import fcntl
# 注释：从 Python 环境 导入 fcntl，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 121 行**

```text
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 122 行**

```text
    except OSError:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。
```

**源码第 123 行**

```text
        fh.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 124 行**

```text
        return None
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。
```

**源码第 125 行**

```text
    return fh  # 必须在整个进程生命周期里持有这个句柄,锁才有效
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 129 行**

```text
@dataclass
# 注释：装饰器 dataclass：给后面的类、方法或参数附加元数据。
```

**源码第 130 行**

```text
class Signal:
# 注释：定义类 `Signal`。 关键字：`class`＝定义类。
```

**源码第 131 行**

```text
    name: str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"
# 注释：设置字段 name，值为 str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"。
```

**源码第 132 行**

```text
    address: int           # Modbus 起始寄存器地址(0-based,持有寄存器)
# 注释：设置字段 address，值为 int           # Modbus 起始寄存器地址(0-based,持有寄存器)。
```

**源码第 133 行**

```text
    type: str              # INT16 | UINT16 | INT32 | UINT32 | FLOAT32 | BOOL | STRING
# 注释：设置字段 type，值为 str              # INT16 | UINT16 | INT32 | UINT32 | FLOAT32 | BOOL | STRING。 关键字：type＝定义类型别名。
```

**源码第 134 行**

```text
    count: int             # 占用寄存器数量
# 注释：设置字段 count，值为 int             # 占用寄存器数量。
```

**源码第 135 行**

```text
    scale: float = 1.0     # 物理量 = 原始值 * scale
# 注释：给 `scale` 赋值。
```

**源码第 136 行**

```text
    offset: int = 0        # 物理量 = (原始值 + offset) * scale
# 注释：给 `offset` 赋值。
```

**源码第 137 行**

```text
    unit: str = ""         # 物理单位,留作日志
# 注释：给 `unit` 赋值。
```

**源码第 140 行**

```text
def _read_csv(path: Path) -> list[Signal]:
# 注释：定义函数 `_read_csv`。 关键字：`def`＝定义 Python 函数。
```

**源码第 143 行**

```text
    sigs: list[Signal] = []
# 注释：给 `sigs` 赋值。
```

**源码第 144 行**

```text
    _cmd_signals.clear()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 146 行**

```text
    if not path.exists():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 147 行**

```text
        LOG.error("点位表不存在: %s", path)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 148 行**

```text
        return sigs
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 150 行**

```text
    with path.open("r", encoding="utf-8-sig", newline="") as f:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`as`＝为导入或上下文对象命名。
```

**源码第 151 行**

```text
        lines = [ln for ln in f
# 注释：给 `lines` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 152 行**

```text
                 if ln.strip() and not ln.lstrip().startswith("#")]
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`and`＝逻辑与；`not`＝逻辑否定。
```

**源码第 154 行**

```text
    reader = csv.DictReader(lines)
# 注释：给 `reader` 赋值。
```

**源码第 156 行**

```text
    required = {"name", "address", "type"}
# 注释：给 `required` 赋值。 关键字：type＝定义类型别名。
```

**源码第 157 行**

```text
    if not required.issubset(reader.fieldnames or []):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`or`＝逻辑或。
```

**源码第 158 行**

```text
        LOG.error("点位表缺少必需列(需要 %s),实际: %s",
# 注释：调用函数或对象方法并传入参数。
```

**源码第 159 行**

```text
                  sorted(required), reader.fieldnames)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 160 行**

```text
        return sigs
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 162 行**

```text
    for line_no, row in enumerate(reader, start=2):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 163 行**

```text
        try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 165 行**

```text
            addr = int(row["address"])
# 注释：给 `addr` 赋值。
```

**源码第 167 行**

```text
            t = row["type"].upper().strip()
# 注释：给 `t` 赋值。 关键字：type＝定义类型别名。
```

**源码第 169 行**

```text
            size_map = {"INT16": 1, "UINT16": 1, "BOOL": 1,
# 注释：给 `size_map` 赋值。
```

**源码第 170 行**

```text
                        "INT32": 2, "UINT32": 2, "FLOAT32": 2,
# 注释：设置字段 INT32，值为 2, "UINT32": 2, "FLOAT32": 2。
```

**源码第 172 行**

```text
                        "INT": 1, "UINT": 1, "DINT": 2}
# 注释：设置字段 INT，值为 1, "UINT": 1, "DINT": 2}。
```

**源码第 173 行**

```text
            cnt = size_map.get(t)
# 注释：给 `cnt` 赋值。
```

**源码第 175 行**

```text
            if cnt is None:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。
```

**源码第 176 行**

```text
                LOG.warning("L%d 未知类型 %s,跳过", line_no, t)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 177 行**

```text
                continue
# 注释：跳过本轮剩余语句，进入下一次循环。
```

**源码第 178 行**

```text
            name = row["name"].strip()
# 注释：给 `name` 赋值。
```

**源码第 179 行**

```text
            sig = Signal(
# 注释：给 `sig` 赋值。
```

**源码第 180 行**

```text
                name=name,
# 注释：给 `name` 赋值。
```

**源码第 181 行**

```text
                address=addr,
# 注释：给 `address` 赋值。
```

**源码第 182 行**

```text
                type=t,
# 注释：给 `type` 赋值。 关键字：type＝定义类型别名。
```

**源码第 183 行**

```text
                count=cnt,
# 注释：给 `count` 赋值。
```

**源码第 184 行**

```text
                scale=float(row.get("scale") or 1.0),
# 注释：给 `scale` 赋值。 关键字：`or`＝逻辑或。
```

**源码第 185 行**

```text
                offset=int(row.get("offset") or 0),
# 注释：给 `offset` 赋值。 关键字：`or`＝逻辑或。
```

**源码第 186 行**

```text
                unit=row.get("unit", ""),
# 注释：给 `unit` 赋值。
```

**源码第 187 行**

```text
            )
# 注释：结束当前集合、分组或调用参数。
```

**源码第 189 行**

```text
            if name.startswith("cmd."):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 190 行**

```text
                _cmd_signals[name] = sig
# 注释：把 sig 的结果赋给 _cmd_signals[name]。
```

**源码第 191 行**

```text
            else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 192 行**

```text
                sigs.append(sig)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 193 行**

```text
        except Exception as exc:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 195 行**

```text
            LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 196 行**

```text
    LOG.info("已加载 %d 个读点位 + %d 个写点位: %s", len(sigs), len(_cmd_signals), path)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 197 行**

```text
    return sigs
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 200 行**

```text
def _words_to_u32(regs: list[int]) -> int:
# 注释：定义函数 `_words_to_u32`。 关键字：`def`＝定义 Python 函数。
```

**源码第 204 行**

```text
    if PLC_WORD_ORDER == "LITTLE":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 205 行**

```text
        regs = list(reversed(regs))
# 注释：给 `regs` 赋值。
```

**源码第 206 行**

```text
    return (regs[0] << 16) | regs[1]
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 209 行**

```text
def decode_signal(regs: list[int], sig: Signal) -> Any:
# 注释：定义函数 `decode_signal`。 关键字：`def`＝定义 Python 函数。
```

**源码第 213 行**

```text
    if not regs:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 215 行**

```text
        return None
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。
```

**源码第 216 行**

```text
    if sig.type in ("INT16", "INT"):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。
```

**源码第 218 行**

```text
        raw = regs[0] if regs[0] < 0x8000 else regs[0] - 0x10000
# 注释：给 `raw` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 219 行**

```text
        return (raw + sig.offset) * sig.scale
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 220 行**

```text
    if sig.type in ("UINT16", "UINT"):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。
```

**源码第 221 行**

```text
        return (regs[0] + sig.offset) * sig.scale
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 223 行**

```text
    if sig.type == "BOOL":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 225 行**

```text
        return bool(regs[0])
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 226 行**

```text
    if sig.type in ("INT32", "DINT"):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。
```

**源码第 227 行**

```text
        raw = _words_to_u32(regs)
# 注释：给 `raw` 赋值。
```

**源码第 229 行**

```text
        if raw >= 0x80000000:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 230 行**

```text
            raw -= 0x100000000
# 注释：用 0x100000000 更新 raw；-= 表示先计算再赋回。
```

**源码第 231 行**

```text
        return (raw + sig.offset) * sig.scale
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 233 行**

```text
    if sig.type == "UINT32":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 234 行**

```text
        raw = _words_to_u32(regs)
# 注释：给 `raw` 赋值。
```

**源码第 235 行**

```text
        return (raw + sig.offset) * sig.scale
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 237 行**

```text
    if sig.type == "FLOAT32":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 240 行**

```text
        wo = "little" if PLC_WORD_ORDER == "LITTLE" else "big"
# 注释：给 `wo` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 241 行**

```text
        v = ModbusClientMixin.convert_from_registers(
# 注释：给 `v` 赋值。
```

**源码第 242 行**

```text
            regs, ModbusClientMixin.DATATYPE.FLOAT32, word_order=wo)
# 注释：向 Modbus 解码器传入寄存器原值、FLOAT32 类型和字序。
```

**源码第 243 行**

```text
        return (v + sig.offset) * sig.scale
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 244 行**

```text
    return None
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。
```

**源码第 248 行**

```text
class Plc:
# 注释：定义类 `Plc`。 关键字：`class`＝定义类。
```

**源码第 249 行**

```text
    def __init__(self, host, port, unit_id):
# 注释：定义函数 `__init__`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。
```

**源码第 251 行**

```text
        self.host = host
# 注释：把 host 的结果赋给 self.host。 关键字：`self`＝当前 Python 实例。
```

**源码第 252 行**

```text
        self.port = port
# 注释：把 port 的结果赋给 self.port。 关键字：`self`＝当前 Python 实例。
```

**源码第 253 行**

```text
        self.unit = unit_id
# 注释：把 unit_id 的结果赋给 self.unit。 关键字：`self`＝当前 Python 实例。
```

**源码第 255 行**

```text
        self.cli = ModbusTcpClient(host=host, port=port, timeout=2)
# 注释：把 ModbusTcpClient(host=host, port=port, timeout=2) 的结果赋给 self.cli。 关键字：`self`＝当前 Python 实例。
```

**源码第 257 行**

```text
        self.lock = threading.Lock()
# 注释：把 threading.Lock() 的结果赋给 self.lock。 关键字：`self`＝当前 Python 实例。
```

**源码第 259 行**

```text
        self.connected = False
# 注释：把 False 的结果赋给 self.connected。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。
```

**源码第 261 行**

```text
    def connect(self):
# 注释：定义函数 `connect`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。
```

**源码第 263 行**

```text
        with self.lock:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`self`＝当前 Python 实例。
```

**源码第 264 行**

```text
            if not self.cli.connect():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`self`＝当前 Python 实例。
```

**源码第 265 行**

```text
                self.connected = False
# 注释：把 False 的结果赋给 self.connected。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。
```

**源码第 266 行**

```text
                return False
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 267 行**

```text
            self.connected = True
# 注释：把 True 的结果赋给 self.connected。 关键字：`self`＝当前 Python 实例；`True`＝布尔真值。
```

**源码第 268 行**

```text
            return True
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`True`＝布尔真值。
```

**源码第 270 行**

```text
    def close(self):
# 注释：定义函数 `close`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。
```

**源码第 271 行**

```text
        with self.lock:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`self`＝当前 Python 实例。
```

**源码第 272 行**

```text
            self.cli.close()
# 注释：调用函数或对象方法并传入参数。 关键字：`self`＝当前 Python 实例。
```

**源码第 273 行**

```text
            self.connected = False
# 注释：把 False 的结果赋给 self.connected。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。
```

**源码第 275 行**

```text
    def read_all(self, signals: list[Signal]) -> dict[str, Any]:
# 注释：定义函数 `read_all`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。
```

**源码第 278 行**

```text
        if not self.connected:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`self`＝当前 Python 实例。
```

**源码第 279 行**

```text
            if not self.connect():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`self`＝当前 Python 实例。
```

**源码第 280 行**

```text
                return {}
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 283 行**

```text
        sigs_sorted = sorted(signals, key=lambda s: s.address)
# 注释：给 `sigs_sorted` 赋值。 关键字：`lambda`＝定义匿名函数。
```

**源码第 285 行**

```text
        values: dict[str, Any] = {}
# 注释：给 `values` 赋值。
```

**源码第 286 行**

```text
        try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 287 行**

```text
            for s in sigs_sorted:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 290 行**

```text
                with self.lock:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`self`＝当前 Python 实例。
```

**源码第 291 行**

```text
                    rr = self.cli.read_holding_registers(
# 注释：给 `rr` 赋值。 关键字：`self`＝当前 Python 实例。
```

**源码第 292 行**

```text
                        address=s.address, count=s.count, device_id=self.unit)
# 注释：给 `address` 赋值。 关键字：`self`＝当前 Python 实例。
```

**源码第 294 行**

```text
                if rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 295 行**

```text
                    LOG.warning("读 %s @%d 失败: %s", s.name, s.address, rr)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 297 行**

```text
                    values[s.name] = None
# 注释：把 None 的结果赋给 values[s.name]。 关键字：`None`＝空值。
```

**源码第 298 行**

```text
                    continue
# 注释：跳过本轮剩余语句，进入下一次循环。
```

**源码第 300 行**

```text
                values[s.name] = decode_signal(rr.registers, s)
# 注释：把 decode_signal(rr.registers, s) 的结果赋给 values[s.name]。
```

**源码第 301 行**

```text
        except Exception as exc:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 303 行**

```text
            LOG.error("PLC 通信异常: %s", exc)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 304 行**

```text
            self.connected = False
# 注释：把 False 的结果赋给 self.connected。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。
```

**源码第 305 行**

```text
        return values
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 309 行**

```text
def group_signals(signals: list[Signal], values: dict[str, Any]) -> dict:
# 注释：定义函数 `group_signals`。 关键字：`def`＝定义 Python 函数。
```

**源码第 312 行**

```text
    grouped: dict[str, dict[str, Any]] = defaultdict(dict)
# 注释：给 `grouped` 赋值。
```

**源码第 313 行**

```text
    for s in signals:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 315 行**

```text
        v = values.get(s.name)
# 注释：给 `v` 赋值。
```

**源码第 319 行**

```text
        ns, _, key = s.name.partition(".")
# 注释：把 s.name.partition(".") 的结果赋给 ns, _, key。
```

**源码第 321 行**

```text
        if not key:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 322 行**

```text
            continue
# 注释：跳过本轮剩余语句，进入下一次循环。
```

**源码第 325 行**

```text
        if "[" in key and "]" in key:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员；`and`＝逻辑与。
```

**源码第 326 行**

```text
            base, _, idx = key.partition("[")
# 注释：把 key.partition("[") 的结果赋给 base, _, idx。
```

**源码第 327 行**

```text
            idx = int(idx.rstrip("]"))
# 注释：给 `idx` 赋值。
```

**源码第 329 行**

```text
            grouped[ns].setdefault(base, [None] * 6)[idx] = v
# 注释：把 v 的结果赋给 grouped[ns].setdefault(base, [None] * 6)[idx]。 关键字：`None`＝空值。
```

**源码第 330 行**

```text
        else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 332 行**

```text
            grouped[ns][key] = v
# 注释：把 v 的结果赋给 grouped[ns][key]。
```

**源码第 335 行**

```text
    payload: dict[str, Any] = {"ts": now_ms(), "lineId": LINE_ID}
# 注释：给 `payload` 赋值。
```

**源码第 338 行**

```text
    if "robot" in grouped:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。
```

**源码第 339 行**

```text
        r = grouped["robot"]
# 注释：给 `r` 赋值。
```

**源码第 340 行**

```text
        payload["deviceId"] = ROBOT_ID
# 注释：把 ROBOT_ID 的结果赋给 payload["deviceId"]。
```

**源码第 341 行**

```text
        payload["joints"] = r.get("joints", [None] * 6)
# 注释：把 r.get("joints", [None] * 6) 的结果赋给 payload["joints"]。 关键字：`None`＝空值。
```

**源码第 342 行**

```text
        payload["tcp"]    = r.get("tcp", None)
# 注释：把 r.get("tcp", None) 的结果赋给 payload["tcp"]   。 关键字：`None`＝空值。
```

**源码第 343 行**

```text
        payload["speedPct"] = int(r.get("speedPct", 0) or 0)
# 注释：把 int(r.get("speedPct", 0) or 0) 的结果赋给 payload["speedPct"]。 关键字：`or`＝逻辑或。
```

**源码第 345 行**

```text
        payload["mode"]     = {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get(
# 注释：把 {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get( 的结果赋给 payload["mode"]    。
```

**源码第 346 行**

```text
                                int(r.get("mode", 0) or 0), "manual")
# 注释：调用函数或对象方法并传入参数。 关键字：`or`＝逻辑或。
```

**源码第 347 行**

```text
        payload["program"]   = str(r.get("program", "") or "")
# 注释：把 str(r.get("program", "") or "") 的结果赋给 payload["program"]  。 关键字：`or`＝逻辑或。
```

**源码第 348 行**

```text
        payload["alarmCode"] = int(r.get("alarmCode", 0) or 0)
# 注释：把 int(r.get("alarmCode", 0) or 0) 的结果赋给 payload["alarmCode"]。 关键字：`or`＝逻辑或。
```

**源码第 349 行**

```text
    return payload
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 352 行**

```text
def io_payload(signals: list[Signal], values: dict[str, Any]) -> dict | None:
# 注释：定义函数 `io_payload`。 关键字：`def`＝定义 Python 函数；`None`＝空值。
```

**源码第 359 行**

```text
    io = {s.name.split(".", 1)[1]: values.get(s.name)
# 注释：给 `io` 赋值。
```

**源码第 360 行**

```text
          for s in signals if s.name.startswith("io.")}
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`if`＝按条件分支。
```

**源码第 361 行**

```text
    if not io:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 362 行**

```text
        return None
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。
```

**源码第 363 行**

```text
    return {"ts": now_ms(), "lineId": LINE_ID, "io": io}
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 366 行**

```text
def line_status_payload(values: dict[str, Any]) -> dict:
# 注释：定义函数 `line_status_payload`。 关键字：`def`＝定义 Python 函数。
```

**源码第 370 行**

```text
    raw_state = values.get("line.state")
# 注释：给 `raw_state` 赋值。
```

**源码第 371 行**

```text
    state = STATE_MAP.get(int(raw_state), "offline") if isinstance(raw_state, (int, float)) else "offline"
# 注释：给 `state` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 372 行**

```text
    return {
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 373 行**

```text
        "ts": now_ms(),
# 注释：设置字段 ts，值为 now_ms()。
```

**源码第 374 行**

```text
        "lineId": LINE_ID,
# 注释：设置字段 lineId，值为 LINE_ID。
```

**源码第 375 行**

```text
        "state": state,
# 注释：设置字段 state，值为 state。
```

**源码第 376 行**

```text
        "productCode": str(values.get("line.productCode", "") or ""),
# 注释：设置字段 productCode，值为 str(values.get("line.productCode", "") or "")。 关键字：`or`＝逻辑或。
```

**源码第 377 行**

```text
        "goodCount":   int(values.get("line.goodCount", 0) or 0),
# 注释：设置字段 goodCount，值为 int(values.get("line.goodCount", 0) or 0)。 关键字：`or`＝逻辑或。
```

**源码第 378 行**

```text
        "ngCount":     int(values.get("line.ngCount", 0) or 0),
# 注释：设置字段 ngCount，值为 int(values.get("line.ngCount", 0) or 0)。 关键字：`or`＝逻辑或。
```

**源码第 379 行**

```text
        "beatMs":      int(values.get("line.beatMs", 0) or 0),
# 注释：设置字段 beatMs，值为 int(values.get("line.beatMs", 0) or 0)。 关键字：`or`＝逻辑或。
```

**源码第 380 行**

```text
    }
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 384 行**

```text
def now_ms() -> int:
# 注释：定义函数 `now_ms`。 关键字：`def`＝定义 Python 函数。
```

**源码第 385 行**

```text
    return int(time.time() * 1000)
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 388 行**

```text
def setup_logging():
# 注释：定义函数 `setup_logging`。 关键字：`def`＝定义 Python 函数。
```

**源码第 389 行**

```text
    logging.basicConfig(
# 注释：调用函数或对象方法并传入参数。
```

**源码第 390 行**

```text
        level=logging.INFO,
# 注释：给 `level` 赋值。
```

**源码第 391 行**

```text
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
# 注释：给 `format` 赋值。
```

**源码第 392 行**

```text
        datefmt="%Y-%m-%d %H:%M:%S",
# 注释：给 `datefmt` 赋值。
```

**源码第 393 行**

```text
    )
# 注释：结束当前集合、分组或调用参数。
```

**源码第 397 行**

```text
def make_mqtt() -> mqtt.Client:
# 注释：定义函数 `make_mqtt`。 关键字：`def`＝定义 Python 函数。
```

**源码第 403 行**

```text
    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
# 注释：给 `c` 赋值。
```

**源码第 404 行**

```text
                    client_id=f"plc-edge-{LINE_ID}-{os.getpid()}")
# 注释：给 `client_id` 赋值。
```

**源码第 406 行**

```text
    if MQTT_USERNAME:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 407 行**

```text
        c.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 410 行**

```text
    c.will_set(T_EDGE,
# 注释：调用函数或对象方法并传入参数。
```

**源码第 411 行**

```text
               json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),
# 注释：调用函数或对象方法并传入参数。
```

**源码第 412 行**

```text
               qos=1, retain=True)
# 注释：给 `qos` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 414 行**

```text
    c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 416 行**

```text
    c.loop_start()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 417 行**

```text
    return c
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 420 行**

```text
def publish(c: mqtt.Client, topic: str, payload: dict, qos=0, retain=False):
# 注释：定义函数 `publish`。 关键字：`def`＝定义 Python 函数；`False`＝布尔假值。
```

**源码第 421 行**

```text
    c.publish(topic, json.dumps(payload, ensure_ascii=False), qos=qos, retain=retain)
# 注释：调用函数或对象方法并传入参数。 关键字：`False`＝布尔假值。
```

**源码第 428 行**

```text
CMD_DISPATCH = {
# 注释：给 `CMD_DISPATCH` 赋值。
```

**源码第 429 行**

```text
    'start':       ('cmd.start',       'pulse'),
# 注释：设置字段 start，值为 ('cmd.start',       'pulse')。
```

**源码第 430 行**

```text
    'stop':        ('cmd.stop',        'pulse'),
# 注释：设置字段 stop，值为 ('cmd.stop',        'pulse')。
```

**源码第 431 行**

```text
    'reset':       (None,              'noop'),
# 注释：设置字段 reset，值为 (None,              'noop')。 关键字：`None`＝空值。
```

**源码第 432 行**

```text
    'changeover':  (None,              'noop'),
# 注释：设置字段 changeover，值为 (None,              'noop')。 关键字：`None`＝空值。
```

**源码第 433 行**

```text
    'mode_set':    ('cmd.modeToggle',  'mode_toggle'),
# 注释：设置字段 mode_set，值为 ('cmd.modeToggle',  'mode_toggle')。
```

**源码第 434 行**

```text
    'alarm_clear': (None,              'noop'),
# 注释：设置字段 alarm_clear，值为 (None,              'noop')。 关键字：`None`＝空值。
```

**源码第 435 行**

```text
    'conveyor':    ('cmd.conveyor',    'conveyor'),
# 注释：设置字段 conveyor，值为 ('cmd.conveyor',    'conveyor')。
```

**源码第 436 行**

```text
}
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 441 行**

```text
MODE_TOGGLE_VALUE = {'acquire': 1, 'release': 2}
# 注释：给 `MODE_TOGGLE_VALUE` 赋值。
```

**源码第 443 行**

```text
CONVEYOR_VALUE = {'stop': 0, 'forward': 1}
# 注释：给 `CONVEYOR_VALUE` 赋值。
```

**源码第 453 行**

```text
STATE_MAP = {
# 注释：给 `STATE_MAP` 赋值。
```

**源码第 454 行**

```text
    0:   'waiting_feed',   # 等待入料
# 注释：设置字段 0，值为 'waiting_feed',   # 等待入料。
```

**源码第 455 行**

```text
    1:   'feeding',        # 入料中
# 注释：设置字段 1，值为 'feeding',        # 入料中。
```

**源码第 456 行**

```text
    2:   'assembling',     # 装配中
# 注释：设置字段 2，值为 'assembling',     # 装配中。
```

**源码第 457 行**

```text
    3:   'waiting_robot',  # 等待机器人完成
# 注释：设置字段 3，值为 'waiting_robot',  # 等待机器人完成。
```

**源码第 458 行**

```text
    4:   'unload_done',    # 下料完成
# 注释：设置字段 4，值为 'unload_done',    # 下料完成。
```

**源码第 459 行**

```text
    5:   'waiting_next',   # 等待后站入料
# 注释：设置字段 5，值为 'waiting_next',   # 等待后站入料。
```

**源码第 460 行**

```text
    100: 'init_error',     # 初始化错误状态
# 注释：设置字段 100，值为 'init_error',     # 初始化错误状态。
```

**源码第 461 行**

```text
    101: 'stopped',        # 停止状态
# 注释：设置字段 101，值为 'stopped',        # 停止状态。
```

**源码第 462 行**

```text
    102: 'manual_mode',    # 手动控制模式
# 注释：设置字段 102，值为 'manual_mode',    # 手动控制模式。
```

**源码第 463 行**

```text
}
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 466 行**

```text
def _dispatch_cmd(plc: Plc, cmd_type: str, params: dict) -> tuple[bool, str]:
# 注释：定义函数 `_dispatch_cmd`。 关键字：`def`＝定义 Python 函数。
```

**源码第 468 行**

```text
    spec = CMD_DISPATCH.get(cmd_type)
# 注释：给 `spec` 赋值。
```

**源码第 469 行**

```text
    if spec is None:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。
```

**源码第 470 行**

```text
        return False, f'未知指令类型: {cmd_type}'
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 471 行**

```text
    sig_name, kind = spec
# 注释：把 spec 的结果赋给 sig_name, kind。
```

**源码第 472 行**

```text
    if sig_name is None:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。
```

**源码第 474 行**

```text
        return False, f'现场 PLC 无 {cmd_type} 对应寄存器(register-mapping.csv 未开放该点),指令未下发'
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 475 行**

```text
    sig = _cmd_signals.get(sig_name)
# 注释：给 `sig` 赋值。
```

**源码第 476 行**

```text
    if sig is None:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。
```

**源码第 477 行**

```text
        return False, f'点位 {sig_name} 未在 register-mapping.csv 配置'
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 478 行**

```text
    params = params or {}
# 注释：给 `params` 赋值。 关键字：`or`＝逻辑或。
```

**源码第 480 行**

```text
    if kind == 'pulse':
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 481 行**

```text
        value = 1
# 注释：给 `value` 赋值。
```

**源码第 482 行**

```text
    elif kind == 'mode_toggle':
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 483 行**

```text
        act = params.get('action')
# 注释：给 `act` 赋值。
```

**源码第 484 行**

```text
        if act not in MODE_TOGGLE_VALUE:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 485 行**

```text
            return False, (f'mode_set.params.action 必须是 '
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 486 行**

```text
                           f'{list(MODE_TOGGLE_VALUE.keys())},收到 {act!r}')
# 注释：调用 list；括号中的表达式是传入的参数。
```

**源码第 487 行**

```text
        value = MODE_TOGGLE_VALUE[act]
# 注释：给 `value` 赋值。
```

**源码第 488 行**

```text
    elif kind == 'conveyor':
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 489 行**

```text
        act = params.get('action')
# 注释：给 `act` 赋值。
```

**源码第 490 行**

```text
        if act not in CONVEYOR_VALUE:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 491 行**

```text
            return False, (f'conveyor.params.action 必须是 '
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 492 行**

```text
                           f'{list(CONVEYOR_VALUE.keys())},收到 {act!r}')
# 注释：调用 list；括号中的表达式是传入的参数。
```

**源码第 493 行**

```text
        value = CONVEYOR_VALUE[act]
# 注释：给 `value` 赋值。
```

**源码第 494 行**

```text
    else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 495 行**

```text
        return False, f'未知 kind={kind}'
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 497 行**

```text
    return _write_cmd(plc, sig.address, value)
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 500 行**

```text
def _write_cmd(plc: Plc, address: int, value: int) -> tuple[bool, str]:
# 注释：定义函数 `_write_cmd`。 关键字：`def`＝定义 Python 函数。
```

**源码第 510 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 511 行**

```text
        with plc.lock:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行。
```

**源码第 512 行**

```text
            if not plc.connected:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 513 行**

```text
                LOG.error('PLC 未连接,拒绝下发 addr=%d,value=%d(不假 ack)', address, value)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 514 行**

```text
                return False, 'PLC 未连接,指令未下发'
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 515 行**

```text
            rr = plc.cli.write_register(address=address, value=value, device_id=plc.unit)
# 注释：给 `rr` 赋值。
```

**源码第 516 行**

```text
        if rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 517 行**

```text
            return False, f'PLC 写寄存器失败: {rr}'
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 518 行**

```text
        return True, ''
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`True`＝布尔真值。
```

**源码第 519 行**

```text
    except Exception as exc:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 520 行**

```text
        return False, f'PLC 通信异常: {exc}'
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。
```

**源码第 523 行**

```text
def on_command(c: mqtt.Client, plc: Plc):
# 注释：定义函数 `on_command`。 关键字：`def`＝定义 Python 函数。
```

**源码第 527 行**

```text
    def _cb(_client, _userdata, msg):
# 注释：定义函数 `_cb`。 关键字：`def`＝定义 Python 函数。
```

**源码第 528 行**

```text
        cmd_id, ack_status, ack_msg = '', 'failed', ''
# 注释：把 '', 'failed', '' 的结果赋给 cmd_id, ack_status, ack_msg。
```

**源码第 529 行**

```text
        try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 531 行**

```text
            cmd = json.loads(msg.payload.decode("utf-8"))
# 注释：给 `cmd` 赋值。
```

**源码第 532 行**

```text
            cmd_id = cmd.get('cmdId') or ''
# 注释：给 `cmd_id` 赋值。 关键字：`or`＝逻辑或。
```

**源码第 533 行**

```text
            cmd_type = cmd.get('type')
# 注释：给 `cmd_type` 赋值。 关键字：type＝定义类型别名。
```

**源码第 534 行**

```text
            params = cmd.get('params') or {}
# 注释：给 `params` 赋值。 关键字：`or`＝逻辑或。
```

**源码第 535 行**

```text
            LOG.info('收到指令 type=%s cmdId=%s topic=%s', cmd_type, cmd_id, msg.topic)
# 注释：调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
```

**源码第 536 行**

```text
            if not cmd_id:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 537 行**

```text
                ack_status, ack_msg = 'rejected', 'cmdId 缺失'
# 注释：把 'rejected', 'cmdId 缺失' 的结果赋给 ack_status, ack_msg。
```

**源码第 538 行**

```text
            else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 539 行**

```text
                ok, ack_msg = _dispatch_cmd(plc, cmd_type, params)
# 注释：把 _dispatch_cmd(plc, cmd_type, params) 的结果赋给 ok, ack_msg。
```

**源码第 540 行**

```text
                ack_status = 'acked' if ok else 'rejected'
# 注释：给 `ack_status` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 541 行**

```text
        except Exception as exc:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 542 行**

```text
            LOG.error('处理指令异常: %s', exc)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 543 行**

```text
            ack_status, ack_msg = 'failed', str(exc)
# 注释：把 'failed', str(exc) 的结果赋给 ack_status, ack_msg。
```

**源码第 544 行**

```text
        finally:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`finally`＝执行收尾逻辑。
```

**源码第 545 行**

```text
            if cmd_id:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 547 行**

```text
                publish(c, T_ACK, {
# 注释：调用函数或对象方法并传入参数。
```

**源码第 548 行**

```text
                    'cmdId': cmd_id,
# 注释：设置字段 cmdId，值为 cmd_id。
```

**源码第 549 行**

```text
                    'ts': now_ms(),
# 注释：设置字段 ts，值为 now_ms()。
```

**源码第 550 行**

```text
                    'status': ack_status,
# 注释：设置字段 status，值为 ack_status。
```

**源码第 551 行**

```text
                    'message': ack_msg or '',
# 注释：把这一段文字作为当前调用、数组或对象的值。 关键字：`or`＝逻辑或。
```

**源码第 552 行**

```text
                }, qos=1)
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 555 行**

```text
    c.message_callback_add(T_CMD, _cb)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 557 行**

```text
    c.subscribe(T_CMD, qos=1)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 561 行**

```text
def main():
# 注释：定义函数 `main`。 关键字：`def`＝定义 Python 函数。
```

**源码第 563 行**

```text
    setup_logging()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 568 行**

```text
    lock_fh = acquire_single_instance_lock(LOCK_FILE)
# 注释：给 `lock_fh` 赋值。
```

**源码第 569 行**

```text
    if lock_fh is None:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。
```

**源码第 570 行**

```text
        LOG.error("已有采集器在运行(锁 %s 被占用),本进程退出。"
# 注释：调用函数或对象方法并传入参数。
```

**源码第 571 行**

```text
                  "重复起采集器会抢 PLC 连接并互踢 MQTT,不要再起第二个。", LOCK_FILE)
# 注释：把重复启动采集器的错误提示和锁文件路径传给日志或异常。
```

**源码第 572 行**

```text
        sys.exit(1)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 573 行**

```text
    LOG.info("单实例锁已获取: %s", LOCK_FILE)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 576 行**

```text
    LOG.info("PLC: %s:%d  unit=%d  poll=%dms", PLC_HOST, PLC_PORT, PLC_UNIT_ID, PLC_POLL_MS)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 577 行**

```text
    LOG.info("MQTT: %s:%d  line=%s  robot=%s", MQTT_HOST, MQTT_PORT, LINE_ID, ROBOT_ID)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 580 行**

```text
    signals = _read_csv(MAPPING_FILE)
# 注释：给 `signals` 赋值。
```

**源码第 582 行**

```text
    if not signals:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 583 行**

```text
        LOG.error("无可用点位,退出。请编辑 %s 后重试。", MAPPING_FILE)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 584 行**

```text
        sys.exit(1)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 587 行**

```text
    plc = Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID)
# 注释：给 `plc` 赋值。
```

**源码第 588 行**

```text
    mq = make_mqtt()
# 注释：给 `mq` 赋值。
```

**源码第 590 行**

```text
    on_command(mq, plc)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 593 行**

```text
    publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
# 注释：调用函数或对象方法并传入参数。
```

**源码第 594 行**

```text
            qos=1, retain=True)
# 注释：给 `qos` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 597 行**

```text
    last_status_pub = 0.0
# 注释：给 `last_status_pub` 赋值。
```

**源码第 599 行**

```text
    STATUS_PERIOD = 1.0  # line_status 1Hz retained
# 注释：给 `STATUS_PERIOD` 赋值。
```

**源码第 605 行**

```text
    EDGE_HEARTBEAT_S = float(os.getenv("EDGE_HEARTBEAT_S", "30"))
# 注释：给 `EDGE_HEARTBEAT_S` 赋值。
```

**源码第 606 行**

```text
    last_edge_pub = time.time()
# 注释：给 `last_edge_pub` 赋值。
```

**源码第 608 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 609 行**

```text
        while True:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`while`＝按条件重复执行；`True`＝布尔真值。
```

**源码第 611 行**

```text
            t_loop = time.time()
# 注释：给 `t_loop` 赋值。
```

**源码第 613 行**

```text
            if t_loop - last_edge_pub >= EDGE_HEARTBEAT_S:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 614 行**

```text
                last_edge_pub = t_loop
# 注释：给 `last_edge_pub` 赋值。
```

**源码第 615 行**

```text
                publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},
# 注释：调用函数或对象方法并传入参数。
```

**源码第 616 行**

```text
                        qos=1, retain=True)
# 注释：给 `qos` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 617 行**

```text
                LOG.debug("edge 心跳已发")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 619 行**

```text
            values = plc.read_all(signals)
# 注释：给 `values` 赋值。
```

**源码第 621 行**

```text
            if not values:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 622 行**

```text
                LOG.warning("PLC 无响应,1s 后重试")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 623 行**

```text
                time.sleep(1.0)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 624 行**

```text
                continue
# 注释：跳过本轮剩余语句，进入下一次循环。
```

**源码第 629 行**

```text
            tele = group_signals(signals, values)
# 注释：给 `tele` 赋值。
```

**源码第 631 行**

```text
            if "deviceId" in tele:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。
```

**源码第 632 行**

```text
                publish(mq, T_ROBOT, tele, qos=0)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 635 行**

```text
            io_msg = io_payload(signals, values)
# 注释：给 `io_msg` 赋值。
```

**源码第 636 行**

```text
            if io_msg is not None:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`not`＝逻辑否定；`None`＝空值。
```

**源码第 637 行**

```text
                publish(mq, T_IO, io_msg, qos=0)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 640 行**

```text
            now = time.time()
# 注释：给 `now` 赋值。
```

**源码第 642 行**

```text
            if now - last_status_pub >= STATUS_PERIOD:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 643 行**

```text
                last_status_pub = now
# 注释：给 `last_status_pub` 赋值。
```

**源码第 644 行**

```text
                publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)
# 注释：调用函数或对象方法并传入参数。 关键字：`True`＝布尔真值。
```

**源码第 651 行**

```text
            dt = time.time() - t_loop
# 注释：给 `dt` 赋值。
```

**源码第 653 行**

```text
            sleep_s = max(0.0, PLC_POLL_MS / 1000.0 - dt)
# 注释：给 `sleep_s` 赋值。
```

**源码第 654 行**

```text
            time.sleep(sleep_s)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 656 行**

```text
    except KeyboardInterrupt:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。
```

**源码第 658 行**

```text
        LOG.info("用户中断,退出")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 659 行**

```text
    finally:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`finally`＝执行收尾逻辑。
```

**源码第 661 行**

```text
        publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "offline"},
# 注释：调用函数或对象方法并传入参数。
```

**源码第 662 行**

```text
                qos=1, retain=True)
# 注释：给 `qos` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 664 行**

```text
        mq.loop_stop()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 666 行**

```text
        mq.disconnect()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 668 行**

```text
        try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 669 行**

```text
            lock_fh.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 670 行**

```text
        except Exception:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。
```

**源码第 671 行**

```text
            pass
# 注释：保留空代码块；这里暂时不执行操作。 关键字：`pass`＝保留空语句块。
```

**源码第 673 行**

```text
        plc.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 677 行**

```text
if __name__ == "__main__":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 678 行**

```text
    main()
# 注释：调用函数或对象方法并传入参数。
```
