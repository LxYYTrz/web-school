# edge/_plc_read11.py 逐行注释

[打开源码](../../../edge/_plc_read11.py) · 81 行 · 42 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 3 行**

```text
import json, sys
# 注释：从 Python 环境 导入 json, sys，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 4 行**

```text
from pymodbus.client import ModbusTcpClient
# 注释：从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 5 行**

```text
from pymodbus.payload import BinaryPayloadDecoder
# 注释：从 pymodbus.payload 导入 BinaryPayloadDecoder，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 6 行**

```text
from pymodbus.constants import Endian
# 注释：从 pymodbus.constants 导入 Endian，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 9 行**

```text
HOST, PORT, UNIT = "192.168.10.31", 503, 2
# 注释：把 "192.168.10.31", 503, 2 的结果赋给 HOST, PORT, UNIT。
```

**源码第 11 行**

```text
OUT = r"C:\Users\Administrator\deploy_work\plc-read11.out"
# 注释：给 `OUT` 赋值。
```

**源码第 13 行**

```text
def to_signed(u16):
# 注释：定义函数 `to_signed`。 关键字：`def`＝定义 Python 函数。
```

**源码第 15 行**

```text
    return u16 if u16 < 0x8000 else u16 - 0x10000
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 18 行**

```text
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 注释：给 `cli` 赋值。
```

**源码第 19 行**

```text
ok = cli.connect()
# 注释：给 `ok` 赋值。
```

**源码第 22 行**

```text
lines = []
# 注释：给 `lines` 赋值。
```

**源码第 23 行**

```text
def w(s): lines.append(s); print(s, flush=True)
# 注释：定义函数 `w`。 关键字：`def`＝定义 Python 函数；`True`＝布尔真值。
```

**源码第 26 行**

```text
w(f"connect {HOST}:{PORT} unit={UNIT}: {'OK' if ok else 'FAIL'}")
# 注释：调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
```

**源码第 28 行**

```text
if not ok: raise SystemExit(1)
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`raise`＝抛出 Python 异常。
```

**源码第 31 行**

```text
rr = cli.read_holding_registers(address=0, count=11, slave=UNIT)
# 注释：给 `rr` 赋值。
```

**源码第 32 行**

```text
if rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 33 行**

```text
    w(f"读取失败: {rr}"); cli.close(); raise SystemExit(2)
# 注释：调用函数或对象方法并传入参数。 关键字：`raise`＝抛出 Python 异常。
```

**源码第 36 行**

```text
regs = rr.registers
# 注释：给 `regs` 赋值。
```

**源码第 37 行**

```text
w(f"\n原始 11 个 word: {regs}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 39 行**

```text
w(f"十六进制: {[hex(r) for r in regs]}")
# 注释：调用函数或对象方法并传入参数。 关键字：for＝开始循环。
```

**源码第 44 行**

```text
NAMES = ["J1","J2","J3","J4","J5","J6","speedPct","mode","alarmCode","lineState","beatMs(÷10)"]
# 注释：给 `NAMES` 赋值。
```

**源码第 48 行**

```text
SCALES= [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1,    1,    1,          1,        10]
# 注释：给 `SCALES` 赋值。
```

**源码第 50 行**

```text
SIGNED = [True,True,True,True,True,True, False, False, False,    False,    False]
# 注释：给 `SIGNED` 赋值。 关键字：`True`＝布尔真值；`False`＝布尔假值。
```

**源码第 52 行**

```text
w(f"\n按 0.1° 缩放翻译:")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 54 行**

```text
w(f"{'DB':<5} {'名字':<14} {'原始':>8} {'缩放后':>10} {'物理量':<20}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 56 行**

```text
for i, r in enumerate(regs):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 57 行**

```text
    v = to_signed(r) if SIGNED[i] else r
# 注释：给 `v` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 58 行**

```text
    phys = v * SCALES[i]
# 注释：给 `phys` 赋值。
```

**源码第 59 行**

```text
    w(f"DB[{i}] {NAMES[i]:<14} {r:>6} -> {v:>6} * {SCALES[i]:>5} = {phys:>10.1f}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 63 行**

```text
w(f"\n尝试按 REAL(大端)解读:作为参考(可能无意义)")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 65 行**

```text
for i in range(0, 11, 2):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 67 行**

```text
    if i+1 >= 11: break
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 68 行**

```text
    pair = regs[i:i+2]
# 注释：给 `pair` 赋值。
```

**源码第 69 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 70 行**

```text
        d = BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordorder=Endian.BIG)
# 注释：给 `d` 赋值。
```

**源码第 71 行**

```text
        f = d.decode_32bit_float()
# 注释：给 `f` 赋值。
```

**源码第 72 行**

```text
        w(f"  [{i},{i+1}] as float = {f}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 73 行**

```text
    except: pass
# 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`except`＝处理指定异常；`pass`＝保留空语句块。
```

**源码第 76 行**

```text
cli.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 77 行**

```text
w("\n完成")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 80 行**

```text
with open(OUT, "w", encoding="utf-8") as f:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`as`＝为导入或上下文对象命名。
```

**源码第 81 行**

```text
    f.write("\n".join(lines))
# 注释：调用函数或对象方法并传入参数。
```
