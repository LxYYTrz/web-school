# edge/plc_collector.py 逐行说明

[打开源码](../../../edge/plc_collector.py) · 678 行 · 397 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 25 | <code>import csv</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 26 | <code>import json</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 27 | <code>import logging</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 28 | <code>import os</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 29 | <code>import struct</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 30 | <code>import sys</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 31 | <code>import threading</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 32 | <code>import time</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 33 | <code>from collections import defaultdict</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 34 | <code>from dataclasses import dataclass</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 35 | <code>from pathlib import Path</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 36 | <code>from typing import Any</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 38 | <code>import paho.mqtt.client as mqtt</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号；`as`＝为导入或上下文对象命名。 |
| 39 | <code>from pymodbus.client import ModbusTcpClient</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 40 | <code>from pymodbus.client.mixin import ModbusClientMixin</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 43 | <code>LOG = logging.getLogger("plc-collector")</code> | 给 `LOG` 赋值。 |
| 46 | <code>PLC_HOST        = os.getenv("PLC_HOST", "192.168.10.31")</code> | 给 `PLC_HOST` 赋值。 |
| 48 | <code>PLC_PORT        = int(os.getenv("PLC_PORT", "503"))</code> | 给 `PLC_PORT` 赋值。 |
| 50 | <code>PLC_UNIT_ID     = int(os.getenv("PLC_UNIT_ID", "2"))</code> | 给 `PLC_UNIT_ID` 赋值。 |
| 52 | <code>PLC_POLL_MS     = int(os.getenv("PLC_POLL_MS", "200"))</code> | 给 `PLC_POLL_MS` 赋值。 |
| 56 | <code>PLC_WORD_ORDER  = os.getenv("PLC_WORD_ORDER", "BIG").upper()</code> | 给 `PLC_WORD_ORDER` 赋值。 |
| 58 | <code>MQTT_HOST       = os.getenv("MQTT_HOST", "localhost")</code> | 给 `MQTT_HOST` 赋值。 |
| 59 | <code>MQTT_PORT       = int(os.getenv("MQTT_PORT", "1883"))</code> | 给 `MQTT_PORT` 赋值。 |
| 61 | <code>MQTT_USERNAME   = os.getenv("MQTT_USERNAME") or None</code> | 给 `MQTT_USERNAME` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。 |
| 62 | <code>MQTT_PASSWORD   = os.getenv("MQTT_PASSWORD") or None</code> | 给 `MQTT_PASSWORD` 赋值。 关键字：`or`＝逻辑或；`None`＝空值。 |
| 64 | <code>LINE_ID         = os.getenv("LINE_ID", "line-01")</code> | 给 `LINE_ID` 赋值。 |
| 65 | <code>ROBOT_ID        = os.getenv("ROBOT_ID", "robot-01")</code> | 给 `ROBOT_ID` 赋值。 |
| 68 | <code>MAPPING_FILE    = Path(os.getenv("MAPPING_FILE",</code> | 给 `MAPPING_FILE` 赋值。 |
| 69 | <code>str(Path(__file__).with_name("register-mapping.csv"))))</code> | 调用函数或对象方法并传入参数。 |
| 73 | <code>T_ROBOT  = f"tl/v1/{LINE_ID}/telemetry/robot/{ROBOT_ID}"</code> | 给 `T_ROBOT` 赋值。 |
| 74 | <code>T_IO     = f"tl/v1/{LINE_ID}/telemetry/io"</code> | 给 `T_IO` 赋值。 |
| 76 | <code>T_STATUS = f"tl/v1/{LINE_ID}/telemetry/status"</code> | 给 `T_STATUS` 赋值。 |
| 78 | <code>T_EVENT  = f"tl/v1/{LINE_ID}/event"</code> | 给 `T_EVENT` 赋值。 |
| 80 | <code>T_EDGE   = f"tl/v1/{LINE_ID}/edge/status"</code> | 给 `T_EDGE` 赋值。 |
| 82 | <code>T_CMD    = f"tl/v1/{LINE_ID}/cmd/+"</code> | 给 `T_CMD` 赋值。 |
| 84 | <code>T_ACK    = f"tl/v1/{LINE_ID}/cmd_ack"</code> | 给 `T_ACK` 赋值。 |
| 88 | <code>_cmd_signals: dict = {}</code> | 给 `_cmd_signals` 赋值。 |
| 95 | <code>LOCK_FILE = Path(os.getenv("COLLECTOR_LOCK_FILE",</code> | 给 `LOCK_FILE` 赋值。 |
| 96 | <code>str(Path(__file__).with_name(".plc_collector.lock"))))</code> | 调用函数或对象方法并传入参数。 |
| 99 | <code>def acquire_single_instance_lock(path: Path):</code> | 定义函数 `acquire_single_instance_lock`。 关键字：`def`＝定义 Python 函数。 |
| 105 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 106 | <code>fh = path.open("a+b")</code> | 给 `fh` 赋值。 |
| 107 | <code>except OSError as exc:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 108 | <code>LOG.warning("锁文件打不开(%s),不启用单实例保护", exc)</code> | 调用函数或对象方法并传入参数。 |
| 109 | <code>return None</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。 |
| 110 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 111 | <code>if os.name == "nt":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 112 | <code>import msvcrt</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 113 | <code>fh.seek(0)</code> | 调用函数或对象方法并传入参数。 |
| 114 | <code>if fh.tell() == 0:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 115 | <code>fh.write(b"0")</code> | 调用函数或对象方法并传入参数。 |
| 116 | <code>fh.flush()</code> | 调用函数或对象方法并传入参数。 |
| 117 | <code>fh.seek(0)</code> | 调用函数或对象方法并传入参数。 |
| 118 | <code>msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)</code> | 调用函数或对象方法并传入参数。 |
| 119 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 120 | <code>import fcntl</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 121 | <code>fcntl.flock(fh.fileno(), fcntl.LOCK_EX &#124; fcntl.LOCK_NB)</code> | 调用函数或对象方法并传入参数。 |
| 122 | <code>except OSError:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。 |
| 123 | <code>fh.close()</code> | 调用函数或对象方法并传入参数。 |
| 124 | <code>return None</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。 |
| 125 | <code>return fh  # 必须在整个进程生命周期里持有这个句柄,锁才有效</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 129 | <code>@dataclass</code> | 续写当前表达式、集合或调用。 |
| 130 | <code>class Signal:</code> | 定义类 `Signal`。 关键字：`class`＝定义类。 |
| 131 | <code>name: str              # e.g. "robot.joints[0]" / "line.goodCount" / "robot.alarmCode"</code> | 续写当前表达式、集合或调用。 |
| 132 | <code>address: int           # Modbus 起始寄存器地址(0-based,持有寄存器)</code> | 续写当前表达式、集合或调用。 |
| 133 | <code>type: str              # INT16 &#124; UINT16 &#124; INT32 &#124; UINT32 &#124; FLOAT32 &#124; BOOL &#124; STRING</code> | 续写当前表达式、集合或调用。 |
| 134 | <code>count: int             # 占用寄存器数量</code> | 续写当前表达式、集合或调用。 |
| 135 | <code>scale: float = 1.0     # 物理量 = 原始值 * scale</code> | 给 `scale` 赋值。 |
| 136 | <code>offset: int = 0        # 物理量 = (原始值 + offset) * scale</code> | 给 `offset` 赋值。 |
| 137 | <code>unit: str = ""         # 物理单位,留作日志</code> | 给 `unit` 赋值。 |
| 140 | <code>def _read_csv(path: Path) -&gt; list[Signal]:</code> | 定义函数 `_read_csv`。 关键字：`def`＝定义 Python 函数。 |
| 143 | <code>sigs: list[Signal] = []</code> | 给 `sigs` 赋值。 |
| 144 | <code>_cmd_signals.clear()</code> | 调用函数或对象方法并传入参数。 |
| 146 | <code>if not path.exists():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 147 | <code>LOG.error("点位表不存在: %s", path)</code> | 调用函数或对象方法并传入参数。 |
| 148 | <code>return sigs</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 150 | <code>with path.open("r", encoding="utf-8-sig", newline="") as f:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`as`＝为导入或上下文对象命名。 |
| 151 | <code>lines = [ln for ln in f</code> | 给 `lines` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 152 | <code>if ln.strip() and not ln.lstrip().startswith("#")]</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`and`＝逻辑与；`not`＝逻辑否定。 |
| 154 | <code>reader = csv.DictReader(lines)</code> | 给 `reader` 赋值。 |
| 156 | <code>required = {"name", "address", "type"}</code> | 给 `required` 赋值。 |
| 157 | <code>if not required.issubset(reader.fieldnames or []):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`or`＝逻辑或。 |
| 158 | <code>LOG.error("点位表缺少必需列(需要 %s),实际: %s",</code> | 调用函数或对象方法并传入参数。 |
| 159 | <code>sorted(required), reader.fieldnames)</code> | 调用函数或对象方法并传入参数。 |
| 160 | <code>return sigs</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 162 | <code>for line_no, row in enumerate(reader, start=2):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 163 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 165 | <code>addr = int(row["address"])</code> | 给 `addr` 赋值。 |
| 167 | <code>t = row["type"].upper().strip()</code> | 给 `t` 赋值。 |
| 169 | <code>size_map = {"INT16": 1, "UINT16": 1, "BOOL": 1,</code> | 给 `size_map` 赋值。 |
| 170 | <code>"INT32": 2, "UINT32": 2, "FLOAT32": 2,</code> | 续写当前表达式、集合或调用。 |
| 172 | <code>"INT": 1, "UINT": 1, "DINT": 2}</code> | 续写当前表达式、集合或调用。 |
| 173 | <code>cnt = size_map.get(t)</code> | 给 `cnt` 赋值。 |
| 175 | <code>if cnt is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 176 | <code>LOG.warning("L%d 未知类型 %s,跳过", line_no, t)</code> | 调用函数或对象方法并传入参数。 |
| 177 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 178 | <code>name = row["name"].strip()</code> | 给 `name` 赋值。 |
| 179 | <code>sig = Signal(</code> | 给 `sig` 赋值。 |
| 180 | <code>name=name,</code> | 给 `name` 赋值。 |
| 181 | <code>address=addr,</code> | 给 `address` 赋值。 |
| 182 | <code>type=t,</code> | 给 `type` 赋值。 |
| 183 | <code>count=cnt,</code> | 给 `count` 赋值。 |
| 184 | <code>scale=float(row.get("scale") or 1.0),</code> | 给 `scale` 赋值。 关键字：`or`＝逻辑或。 |
| 185 | <code>offset=int(row.get("offset") or 0),</code> | 给 `offset` 赋值。 关键字：`or`＝逻辑或。 |
| 186 | <code>unit=row.get("unit", ""),</code> | 给 `unit` 赋值。 |
| 187 | <code>)</code> | 续写当前表达式、集合或调用。 |
| 189 | <code>if name.startswith("cmd."):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 190 | <code>_cmd_signals[name] = sig</code> | 续写当前表达式、集合或调用。 |
| 191 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 192 | <code>sigs.append(sig)</code> | 调用函数或对象方法并传入参数。 |
| 193 | <code>except Exception as exc:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 195 | <code>LOG.warning("L%d 解析失败: %s (行=%s)", line_no, exc, row)</code> | 调用函数或对象方法并传入参数。 |
| 196 | <code>LOG.info("已加载 %d 个读点位 + %d 个写点位: %s", len(sigs), len(_cmd_signals), path)</code> | 调用函数或对象方法并传入参数。 |
| 197 | <code>return sigs</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 200 | <code>def _words_to_u32(regs: list[int]) -&gt; int:</code> | 定义函数 `_words_to_u32`。 关键字：`def`＝定义 Python 函数。 |
| 204 | <code>if PLC_WORD_ORDER == "LITTLE":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 205 | <code>regs = list(reversed(regs))</code> | 给 `regs` 赋值。 |
| 206 | <code>return (regs[0] &lt;&lt; 16) &#124; regs[1]</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 209 | <code>def decode_signal(regs: list[int], sig: Signal) -&gt; Any:</code> | 定义函数 `decode_signal`。 关键字：`def`＝定义 Python 函数。 |
| 213 | <code>if not regs:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 215 | <code>return None</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。 |
| 216 | <code>if sig.type in ("INT16", "INT"):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。 |
| 218 | <code>raw = regs[0] if regs[0] &lt; 0x8000 else regs[0] - 0x10000</code> | 给 `raw` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 219 | <code>return (raw + sig.offset) * sig.scale</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 220 | <code>if sig.type in ("UINT16", "UINT"):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。 |
| 221 | <code>return (regs[0] + sig.offset) * sig.scale</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 223 | <code>if sig.type == "BOOL":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 225 | <code>return bool(regs[0])</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 226 | <code>if sig.type in ("INT32", "DINT"):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。 |
| 227 | <code>raw = _words_to_u32(regs)</code> | 给 `raw` 赋值。 |
| 229 | <code>if raw &gt;= 0x80000000:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 230 | <code>raw -= 0x100000000</code> | 续写当前表达式、集合或调用。 |
| 231 | <code>return (raw + sig.offset) * sig.scale</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 233 | <code>if sig.type == "UINT32":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 234 | <code>raw = _words_to_u32(regs)</code> | 给 `raw` 赋值。 |
| 235 | <code>return (raw + sig.offset) * sig.scale</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 237 | <code>if sig.type == "FLOAT32":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 240 | <code>wo = "little" if PLC_WORD_ORDER == "LITTLE" else "big"</code> | 给 `wo` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 241 | <code>v = ModbusClientMixin.convert_from_registers(</code> | 给 `v` 赋值。 |
| 242 | <code>regs, ModbusClientMixin.DATATYPE.FLOAT32, word_order=wo)</code> | 续写当前表达式、集合或调用。 |
| 243 | <code>return (v + sig.offset) * sig.scale</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 244 | <code>return None</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。 |
| 248 | <code>class Plc:</code> | 定义类 `Plc`。 关键字：`class`＝定义类。 |
| 249 | <code>def __init__(self, host, port, unit_id):</code> | 定义函数 `__init__`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。 |
| 251 | <code>self.host = host</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 252 | <code>self.port = port</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 253 | <code>self.unit = unit_id</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 255 | <code>self.cli = ModbusTcpClient(host=host, port=port, timeout=2)</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 257 | <code>self.lock = threading.Lock()</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 259 | <code>self.connected = False</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。 |
| 261 | <code>def connect(self):</code> | 定义函数 `connect`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。 |
| 263 | <code>with self.lock:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`self`＝当前 Python 实例。 |
| 264 | <code>if not self.cli.connect():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`self`＝当前 Python 实例。 |
| 265 | <code>self.connected = False</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。 |
| 266 | <code>return False</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 267 | <code>self.connected = True</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例；`True`＝布尔真值。 |
| 268 | <code>return True</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`True`＝布尔真值。 |
| 270 | <code>def close(self):</code> | 定义函数 `close`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。 |
| 271 | <code>with self.lock:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`self`＝当前 Python 实例。 |
| 272 | <code>self.cli.close()</code> | 调用函数或对象方法并传入参数。 关键字：`self`＝当前 Python 实例。 |
| 273 | <code>self.connected = False</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。 |
| 275 | <code>def read_all(self, signals: list[Signal]) -&gt; dict[str, Any]:</code> | 定义函数 `read_all`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。 |
| 278 | <code>if not self.connected:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`self`＝当前 Python 实例。 |
| 279 | <code>if not self.connect():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`self`＝当前 Python 实例。 |
| 280 | <code>return {}</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 283 | <code>sigs_sorted = sorted(signals, key=lambda s: s.address)</code> | 给 `sigs_sorted` 赋值。 关键字：`lambda`＝定义匿名函数。 |
| 285 | <code>values: dict[str, Any] = {}</code> | 给 `values` 赋值。 |
| 286 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 287 | <code>for s in sigs_sorted:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 290 | <code>with self.lock:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`self`＝当前 Python 实例。 |
| 291 | <code>rr = self.cli.read_holding_registers(</code> | 给 `rr` 赋值。 关键字：`self`＝当前 Python 实例。 |
| 292 | <code>address=s.address, count=s.count, device_id=self.unit)</code> | 给 `address` 赋值。 关键字：`self`＝当前 Python 实例。 |
| 294 | <code>if rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 295 | <code>LOG.warning("读 %s @%d 失败: %s", s.name, s.address, rr)</code> | 调用函数或对象方法并传入参数。 |
| 297 | <code>values[s.name] = None</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 298 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 300 | <code>values[s.name] = decode_signal(rr.registers, s)</code> | 续写当前表达式、集合或调用。 |
| 301 | <code>except Exception as exc:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 303 | <code>LOG.error("PLC 通信异常: %s", exc)</code> | 调用函数或对象方法并传入参数。 |
| 304 | <code>self.connected = False</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例；`False`＝布尔假值。 |
| 305 | <code>return values</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 309 | <code>def group_signals(signals: list[Signal], values: dict[str, Any]) -&gt; dict:</code> | 定义函数 `group_signals`。 关键字：`def`＝定义 Python 函数。 |
| 312 | <code>grouped: dict[str, dict[str, Any]] = defaultdict(dict)</code> | 给 `grouped` 赋值。 |
| 313 | <code>for s in signals:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 315 | <code>v = values.get(s.name)</code> | 给 `v` 赋值。 |
| 319 | <code>ns, _, key = s.name.partition(".")</code> | 续写当前表达式、集合或调用。 |
| 321 | <code>if not key:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 322 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 325 | <code>if "[" in key and "]" in key:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员；`and`＝逻辑与。 |
| 326 | <code>base, _, idx = key.partition("[")</code> | 续写当前表达式、集合或调用。 |
| 327 | <code>idx = int(idx.rstrip("]"))</code> | 给 `idx` 赋值。 |
| 329 | <code>grouped[ns].setdefault(base, [None] * 6)[idx] = v</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 330 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 332 | <code>grouped[ns][key] = v</code> | 续写当前表达式、集合或调用。 |
| 335 | <code>payload: dict[str, Any] = {"ts": now_ms(), "lineId": LINE_ID}</code> | 给 `payload` 赋值。 |
| 338 | <code>if "robot" in grouped:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。 |
| 339 | <code>r = grouped["robot"]</code> | 给 `r` 赋值。 |
| 340 | <code>payload["deviceId"] = ROBOT_ID</code> | 续写当前表达式、集合或调用。 |
| 341 | <code>payload["joints"] = r.get("joints", [None] * 6)</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 342 | <code>payload["tcp"]    = r.get("tcp", None)</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 343 | <code>payload["speedPct"] = int(r.get("speedPct", 0) or 0)</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 345 | <code>payload["mode"]     = {0: "manual", 1: "auto", 2: "remote", 3: "error"}.get(</code> | 续写当前表达式、集合或调用。 |
| 346 | <code>int(r.get("mode", 0) or 0), "manual")</code> | 调用函数或对象方法并传入参数。 关键字：`or`＝逻辑或。 |
| 347 | <code>payload["program"]   = str(r.get("program", "") or "")</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 348 | <code>payload["alarmCode"] = int(r.get("alarmCode", 0) or 0)</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 349 | <code>return payload</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 352 | <code>def io_payload(signals: list[Signal], values: dict[str, Any]) -&gt; dict &#124; None:</code> | 定义函数 `io_payload`。 关键字：`def`＝定义 Python 函数；`None`＝空值。 |
| 359 | <code>io = {s.name.split(".", 1)[1]: values.get(s.name)</code> | 给 `io` 赋值。 |
| 360 | <code>for s in signals if s.name.startswith("io.")}</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`if`＝按条件分支。 |
| 361 | <code>if not io:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 362 | <code>return None</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`None`＝空值。 |
| 363 | <code>return {"ts": now_ms(), "lineId": LINE_ID, "io": io}</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 366 | <code>def line_status_payload(values: dict[str, Any]) -&gt; dict:</code> | 定义函数 `line_status_payload`。 关键字：`def`＝定义 Python 函数。 |
| 370 | <code>raw_state = values.get("line.state")</code> | 给 `raw_state` 赋值。 |
| 371 | <code>state = STATE_MAP.get(int(raw_state), "offline") if isinstance(raw_state, (int, float)) else "offline"</code> | 给 `state` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 372 | <code>return {</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 373 | <code>"ts": now_ms(),</code> | 续写当前表达式、集合或调用。 |
| 374 | <code>"lineId": LINE_ID,</code> | 续写当前表达式、集合或调用。 |
| 375 | <code>"state": state,</code> | 续写当前表达式、集合或调用。 |
| 376 | <code>"productCode": str(values.get("line.productCode", "") or ""),</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 377 | <code>"goodCount":   int(values.get("line.goodCount", 0) or 0),</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 378 | <code>"ngCount":     int(values.get("line.ngCount", 0) or 0),</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 379 | <code>"beatMs":      int(values.get("line.beatMs", 0) or 0),</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 380 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 384 | <code>def now_ms() -&gt; int:</code> | 定义函数 `now_ms`。 关键字：`def`＝定义 Python 函数。 |
| 385 | <code>return int(time.time() * 1000)</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 388 | <code>def setup_logging():</code> | 定义函数 `setup_logging`。 关键字：`def`＝定义 Python 函数。 |
| 389 | <code>logging.basicConfig(</code> | 调用函数或对象方法并传入参数。 |
| 390 | <code>level=logging.INFO,</code> | 给 `level` 赋值。 |
| 391 | <code>format="%(asctime)s %(levelname)s [%(name)s] %(message)s",</code> | 给 `format` 赋值。 |
| 392 | <code>datefmt="%Y-%m-%d %H:%M:%S",</code> | 给 `datefmt` 赋值。 |
| 393 | <code>)</code> | 续写当前表达式、集合或调用。 |
| 397 | <code>def make_mqtt() -&gt; mqtt.Client:</code> | 定义函数 `make_mqtt`。 关键字：`def`＝定义 Python 函数。 |
| 403 | <code>c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,</code> | 给 `c` 赋值。 |
| 404 | <code>client_id=f"plc-edge-{LINE_ID}-{os.getpid()}")</code> | 给 `client_id` 赋值。 |
| 406 | <code>if MQTT_USERNAME:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 407 | <code>c.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)</code> | 调用函数或对象方法并传入参数。 |
| 410 | <code>c.will_set(T_EDGE,</code> | 调用函数或对象方法并传入参数。 |
| 411 | <code>json.dumps({"ts": now_ms(), "lineId": LINE_ID, "status": "offline"}),</code> | 调用函数或对象方法并传入参数。 |
| 412 | <code>qos=1, retain=True)</code> | 给 `qos` 赋值。 关键字：`True`＝布尔真值。 |
| 414 | <code>c.connect(MQTT_HOST, MQTT_PORT, keepalive=30)</code> | 调用函数或对象方法并传入参数。 |
| 416 | <code>c.loop_start()</code> | 调用函数或对象方法并传入参数。 |
| 417 | <code>return c</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 420 | <code>def publish(c: mqtt.Client, topic: str, payload: dict, qos=0, retain=False):</code> | 定义函数 `publish`。 关键字：`def`＝定义 Python 函数；`False`＝布尔假值。 |
| 421 | <code>c.publish(topic, json.dumps(payload, ensure_ascii=False), qos=qos, retain=retain)</code> | 调用函数或对象方法并传入参数。 关键字：`False`＝布尔假值。 |
| 428 | <code>CMD_DISPATCH = {</code> | 给 `CMD_DISPATCH` 赋值。 |
| 429 | <code>'start':       ('cmd.start',       'pulse'),</code> | 续写当前表达式、集合或调用。 |
| 430 | <code>'stop':        ('cmd.stop',        'pulse'),</code> | 续写当前表达式、集合或调用。 |
| 431 | <code>'reset':       (None,              'noop'),</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 432 | <code>'changeover':  (None,              'noop'),</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 433 | <code>'mode_set':    ('cmd.modeToggle',  'mode_toggle'),</code> | 续写当前表达式、集合或调用。 |
| 434 | <code>'alarm_clear': (None,              'noop'),</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 435 | <code>'conveyor':    ('cmd.conveyor',    'conveyor'),</code> | 续写当前表达式、集合或调用。 |
| 436 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 441 | <code>MODE_TOGGLE_VALUE = {'acquire': 1, 'release': 2}</code> | 给 `MODE_TOGGLE_VALUE` 赋值。 |
| 443 | <code>CONVEYOR_VALUE = {'stop': 0, 'forward': 1}</code> | 给 `CONVEYOR_VALUE` 赋值。 |
| 453 | <code>STATE_MAP = {</code> | 给 `STATE_MAP` 赋值。 |
| 454 | <code>0:   'waiting_feed',   # 等待入料</code> | 续写当前表达式、集合或调用。 |
| 455 | <code>1:   'feeding',        # 入料中</code> | 续写当前表达式、集合或调用。 |
| 456 | <code>2:   'assembling',     # 装配中</code> | 续写当前表达式、集合或调用。 |
| 457 | <code>3:   'waiting_robot',  # 等待机器人完成</code> | 续写当前表达式、集合或调用。 |
| 458 | <code>4:   'unload_done',    # 下料完成</code> | 续写当前表达式、集合或调用。 |
| 459 | <code>5:   'waiting_next',   # 等待后站入料</code> | 续写当前表达式、集合或调用。 |
| 460 | <code>100: 'init_error',     # 初始化错误状态</code> | 续写当前表达式、集合或调用。 |
| 461 | <code>101: 'stopped',        # 停止状态</code> | 续写当前表达式、集合或调用。 |
| 462 | <code>102: 'manual_mode',    # 手动控制模式</code> | 续写当前表达式、集合或调用。 |
| 463 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 466 | <code>def _dispatch_cmd(plc: Plc, cmd_type: str, params: dict) -&gt; tuple[bool, str]:</code> | 定义函数 `_dispatch_cmd`。 关键字：`def`＝定义 Python 函数。 |
| 468 | <code>spec = CMD_DISPATCH.get(cmd_type)</code> | 给 `spec` 赋值。 |
| 469 | <code>if spec is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 470 | <code>return False, f'未知指令类型: {cmd_type}'</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 471 | <code>sig_name, kind = spec</code> | 续写当前表达式、集合或调用。 |
| 472 | <code>if sig_name is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 474 | <code>return False, f'现场 PLC 无 {cmd_type} 对应寄存器(register-mapping.csv 未开放该点),指令未下发'</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 475 | <code>sig = _cmd_signals.get(sig_name)</code> | 给 `sig` 赋值。 |
| 476 | <code>if sig is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 477 | <code>return False, f'点位 {sig_name} 未在 register-mapping.csv 配置'</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 478 | <code>params = params or {}</code> | 给 `params` 赋值。 关键字：`or`＝逻辑或。 |
| 480 | <code>if kind == 'pulse':</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 481 | <code>value = 1</code> | 给 `value` 赋值。 |
| 482 | <code>elif kind == 'mode_toggle':</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 483 | <code>act = params.get('action')</code> | 给 `act` 赋值。 |
| 484 | <code>if act not in MODE_TOGGLE_VALUE:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 485 | <code>return False, (f'mode_set.params.action 必须是 '</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 486 | <code>f'{list(MODE_TOGGLE_VALUE.keys())},收到 {act!r}')</code> | 续写当前表达式、集合或调用。 |
| 487 | <code>value = MODE_TOGGLE_VALUE[act]</code> | 给 `value` 赋值。 |
| 488 | <code>elif kind == 'conveyor':</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 489 | <code>act = params.get('action')</code> | 给 `act` 赋值。 |
| 490 | <code>if act not in CONVEYOR_VALUE:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 491 | <code>return False, (f'conveyor.params.action 必须是 '</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 492 | <code>f'{list(CONVEYOR_VALUE.keys())},收到 {act!r}')</code> | 续写当前表达式、集合或调用。 |
| 493 | <code>value = CONVEYOR_VALUE[act]</code> | 给 `value` 赋值。 |
| 494 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 495 | <code>return False, f'未知 kind={kind}'</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 497 | <code>return _write_cmd(plc, sig.address, value)</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 500 | <code>def _write_cmd(plc: Plc, address: int, value: int) -&gt; tuple[bool, str]:</code> | 定义函数 `_write_cmd`。 关键字：`def`＝定义 Python 函数。 |
| 510 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 511 | <code>with plc.lock:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行。 |
| 512 | <code>if not plc.connected:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 513 | <code>LOG.error('PLC 未连接,拒绝下发 addr=%d,value=%d(不假 ack)', address, value)</code> | 调用函数或对象方法并传入参数。 |
| 514 | <code>return False, 'PLC 未连接,指令未下发'</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 515 | <code>rr = plc.cli.write_register(address=address, value=value, device_id=plc.unit)</code> | 给 `rr` 赋值。 |
| 516 | <code>if rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 517 | <code>return False, f'PLC 写寄存器失败: {rr}'</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 518 | <code>return True, ''</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`True`＝布尔真值。 |
| 519 | <code>except Exception as exc:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 520 | <code>return False, f'PLC 通信异常: {exc}'</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`False`＝布尔假值。 |
| 523 | <code>def on_command(c: mqtt.Client, plc: Plc):</code> | 定义函数 `on_command`。 关键字：`def`＝定义 Python 函数。 |
| 527 | <code>def _cb(_client, _userdata, msg):</code> | 定义函数 `_cb`。 关键字：`def`＝定义 Python 函数。 |
| 528 | <code>cmd_id, ack_status, ack_msg = '', 'failed', ''</code> | 续写当前表达式、集合或调用。 |
| 529 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 531 | <code>cmd = json.loads(msg.payload.decode("utf-8"))</code> | 给 `cmd` 赋值。 |
| 532 | <code>cmd_id = cmd.get('cmdId') or ''</code> | 给 `cmd_id` 赋值。 关键字：`or`＝逻辑或。 |
| 533 | <code>cmd_type = cmd.get('type')</code> | 给 `cmd_type` 赋值。 |
| 534 | <code>params = cmd.get('params') or {}</code> | 给 `params` 赋值。 关键字：`or`＝逻辑或。 |
| 535 | <code>LOG.info('收到指令 type=%s cmdId=%s topic=%s', cmd_type, cmd_id, msg.topic)</code> | 调用函数或对象方法并传入参数。 |
| 536 | <code>if not cmd_id:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 537 | <code>ack_status, ack_msg = 'rejected', 'cmdId 缺失'</code> | 续写当前表达式、集合或调用。 |
| 538 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 539 | <code>ok, ack_msg = _dispatch_cmd(plc, cmd_type, params)</code> | 续写当前表达式、集合或调用。 |
| 540 | <code>ack_status = 'acked' if ok else 'rejected'</code> | 给 `ack_status` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 541 | <code>except Exception as exc:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 542 | <code>LOG.error('处理指令异常: %s', exc)</code> | 调用函数或对象方法并传入参数。 |
| 543 | <code>ack_status, ack_msg = 'failed', str(exc)</code> | 续写当前表达式、集合或调用。 |
| 544 | <code>finally:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`finally`＝执行收尾逻辑。 |
| 545 | <code>if cmd_id:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 547 | <code>publish(c, T_ACK, {</code> | 调用函数或对象方法并传入参数。 |
| 548 | <code>'cmdId': cmd_id,</code> | 续写当前表达式、集合或调用。 |
| 549 | <code>'ts': now_ms(),</code> | 续写当前表达式、集合或调用。 |
| 550 | <code>'status': ack_status,</code> | 续写当前表达式、集合或调用。 |
| 551 | <code>'message': ack_msg or '',</code> | 续写当前表达式、集合或调用。 关键字：`or`＝逻辑或。 |
| 552 | <code>}, qos=1)</code> | 续写当前表达式、集合或调用。 |
| 555 | <code>c.message_callback_add(T_CMD, _cb)</code> | 调用函数或对象方法并传入参数。 |
| 557 | <code>c.subscribe(T_CMD, qos=1)</code> | 调用函数或对象方法并传入参数。 |
| 561 | <code>def main():</code> | 定义函数 `main`。 关键字：`def`＝定义 Python 函数。 |
| 563 | <code>setup_logging()</code> | 调用函数或对象方法并传入参数。 |
| 568 | <code>lock_fh = acquire_single_instance_lock(LOCK_FILE)</code> | 给 `lock_fh` 赋值。 |
| 569 | <code>if lock_fh is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 570 | <code>LOG.error("已有采集器在运行(锁 %s 被占用),本进程退出。"</code> | 调用函数或对象方法并传入参数。 |
| 571 | <code>"重复起采集器会抢 PLC 连接并互踢 MQTT,不要再起第二个。", LOCK_FILE)</code> | 续写当前表达式、集合或调用。 |
| 572 | <code>sys.exit(1)</code> | 调用函数或对象方法并传入参数。 |
| 573 | <code>LOG.info("单实例锁已获取: %s", LOCK_FILE)</code> | 调用函数或对象方法并传入参数。 |
| 576 | <code>LOG.info("PLC: %s:%d  unit=%d  poll=%dms", PLC_HOST, PLC_PORT, PLC_UNIT_ID, PLC_POLL_MS)</code> | 调用函数或对象方法并传入参数。 |
| 577 | <code>LOG.info("MQTT: %s:%d  line=%s  robot=%s", MQTT_HOST, MQTT_PORT, LINE_ID, ROBOT_ID)</code> | 调用函数或对象方法并传入参数。 |
| 580 | <code>signals = _read_csv(MAPPING_FILE)</code> | 给 `signals` 赋值。 |
| 582 | <code>if not signals:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 583 | <code>LOG.error("无可用点位,退出。请编辑 %s 后重试。", MAPPING_FILE)</code> | 调用函数或对象方法并传入参数。 |
| 584 | <code>sys.exit(1)</code> | 调用函数或对象方法并传入参数。 |
| 587 | <code>plc = Plc(PLC_HOST, PLC_PORT, PLC_UNIT_ID)</code> | 给 `plc` 赋值。 |
| 588 | <code>mq = make_mqtt()</code> | 给 `mq` 赋值。 |
| 590 | <code>on_command(mq, plc)</code> | 调用函数或对象方法并传入参数。 |
| 593 | <code>publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},</code> | 调用函数或对象方法并传入参数。 |
| 594 | <code>qos=1, retain=True)</code> | 给 `qos` 赋值。 关键字：`True`＝布尔真值。 |
| 597 | <code>last_status_pub = 0.0</code> | 给 `last_status_pub` 赋值。 |
| 599 | <code>STATUS_PERIOD = 1.0  # line_status 1Hz retained</code> | 给 `STATUS_PERIOD` 赋值。 |
| 605 | <code>EDGE_HEARTBEAT_S = float(os.getenv("EDGE_HEARTBEAT_S", "30"))</code> | 给 `EDGE_HEARTBEAT_S` 赋值。 |
| 606 | <code>last_edge_pub = time.time()</code> | 给 `last_edge_pub` 赋值。 |
| 608 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 609 | <code>while True:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`while`＝按条件重复执行；`True`＝布尔真值。 |
| 611 | <code>t_loop = time.time()</code> | 给 `t_loop` 赋值。 |
| 613 | <code>if t_loop - last_edge_pub &gt;= EDGE_HEARTBEAT_S:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 614 | <code>last_edge_pub = t_loop</code> | 给 `last_edge_pub` 赋值。 |
| 615 | <code>publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "online"},</code> | 调用函数或对象方法并传入参数。 |
| 616 | <code>qos=1, retain=True)</code> | 给 `qos` 赋值。 关键字：`True`＝布尔真值。 |
| 617 | <code>LOG.debug("edge 心跳已发")</code> | 调用函数或对象方法并传入参数。 |
| 619 | <code>values = plc.read_all(signals)</code> | 给 `values` 赋值。 |
| 621 | <code>if not values:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 622 | <code>LOG.warning("PLC 无响应,1s 后重试")</code> | 调用函数或对象方法并传入参数。 |
| 623 | <code>time.sleep(1.0)</code> | 调用函数或对象方法并传入参数。 |
| 624 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 629 | <code>tele = group_signals(signals, values)</code> | 给 `tele` 赋值。 |
| 631 | <code>if "deviceId" in tele:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`in`＝遍历键或判断成员。 |
| 632 | <code>publish(mq, T_ROBOT, tele, qos=0)</code> | 调用函数或对象方法并传入参数。 |
| 635 | <code>io_msg = io_payload(signals, values)</code> | 给 `io_msg` 赋值。 |
| 636 | <code>if io_msg is not None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`not`＝逻辑否定；`None`＝空值。 |
| 637 | <code>publish(mq, T_IO, io_msg, qos=0)</code> | 调用函数或对象方法并传入参数。 |
| 640 | <code>now = time.time()</code> | 给 `now` 赋值。 |
| 642 | <code>if now - last_status_pub &gt;= STATUS_PERIOD:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 643 | <code>last_status_pub = now</code> | 给 `last_status_pub` 赋值。 |
| 644 | <code>publish(mq, T_STATUS, line_status_payload(values), qos=1, retain=True)</code> | 调用函数或对象方法并传入参数。 关键字：`True`＝布尔真值。 |
| 651 | <code>dt = time.time() - t_loop</code> | 给 `dt` 赋值。 |
| 653 | <code>sleep_s = max(0.0, PLC_POLL_MS / 1000.0 - dt)</code> | 给 `sleep_s` 赋值。 |
| 654 | <code>time.sleep(sleep_s)</code> | 调用函数或对象方法并传入参数。 |
| 656 | <code>except KeyboardInterrupt:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。 |
| 658 | <code>LOG.info("用户中断,退出")</code> | 调用函数或对象方法并传入参数。 |
| 659 | <code>finally:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`finally`＝执行收尾逻辑。 |
| 661 | <code>publish(mq, T_EDGE, {"ts": now_ms(), "lineId": LINE_ID, "status": "offline"},</code> | 调用函数或对象方法并传入参数。 |
| 662 | <code>qos=1, retain=True)</code> | 给 `qos` 赋值。 关键字：`True`＝布尔真值。 |
| 664 | <code>mq.loop_stop()</code> | 调用函数或对象方法并传入参数。 |
| 666 | <code>mq.disconnect()</code> | 调用函数或对象方法并传入参数。 |
| 668 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 669 | <code>lock_fh.close()</code> | 调用函数或对象方法并传入参数。 |
| 670 | <code>except Exception:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常。 |
| 671 | <code>pass</code> | 续写当前表达式、集合或调用。 关键字：`pass`＝保留空语句块。 |
| 673 | <code>plc.close()</code> | 调用函数或对象方法并传入参数。 |
| 677 | <code>if __name__ == "__main__":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 678 | <code>main()</code> | 调用函数或对象方法并传入参数。 |
