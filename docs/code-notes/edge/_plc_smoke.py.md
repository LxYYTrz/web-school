# edge/_plc_smoke.py 逐行注释

[打开源码](../../../edge/_plc_smoke.py) · 72 行 · 46 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 7 行**

```text
import sys
# 注释：从 Python 环境 导入 sys，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 8 行**

```text
from pymodbus.client import ModbusTcpClient
# 注释：从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 9 行**

```text
from pymodbus.payload import BinaryPayloadDecoder
# 注释：从 pymodbus.payload 导入 BinaryPayloadDecoder，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 10 行**

```text
from pymodbus.constants import Endian
# 注释：从 pymodbus.constants 导入 Endian，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 13 行**

```text
HOST = "192.168.10.31"
# 注释：给 `HOST` 赋值。
```

**源码第 14 行**

```text
PORT = 503
# 注释：给 `PORT` 赋值。
```

**源码第 15 行**

```text
UNIT = 2
# 注释：给 `UNIT` 赋值。
```

**源码第 16 行**

```text
COUNT = 16
# 注释：给 `COUNT` 赋值。
```

**源码第 17 行**

```text
START = 0
# 注释：给 `START` 赋值。
```

**源码第 20 行**

```text
print(f"=== 尝试连接 {HOST}:{PORT} unit={UNIT} ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 22 行**

```text
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=3)
# 注释：给 `cli` 赋值。
```

**源码第 24 行**

```text
if not cli.connect():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 25 行**

```text
    print("连接失败")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 26 行**

```text
    sys.exit(1)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 27 行**

```text
print("已连接")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 30 行**

```text
print(f"\n=== 读 Holding Register [{START}..{START+COUNT-1}] ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 31 行**

```text
rr = cli.read_holding_registers(address=START, count=COUNT, slave=UNIT)
# 注释：给 `rr` 赋值。
```

**源码第 33 行**

```text
if rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 34 行**

```text
    print(f"读取失败: {rr}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 36 行**

```text
    cli.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 37 行**

```text
    sys.exit(2)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 40 行**

```text
print(f"原始寄存器(INT16, 共 {len(rr.registers)} 个):")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 41 行**

```text
for i, v in enumerate(rr.registers):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 43 行**

```text
    print(f"  [{START+i:>4}] = {v:>6} (0x{v:04X})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 46 行**

```text
print("\n=== 按大端 FLOAT32 解读前 8 寄存器(4 浮点) ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 48 行**

```text
dec = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
# 注释：给 `dec` 赋值。
```

**源码第 49 行**

```text
                                        byteorder=Endian.BIG,
# 注释：给 `byteorder` 赋值。
```

**源码第 50 行**

```text
                                        wordorder=Endian.BIG)
# 注释：给 `wordorder` 赋值。
```

**源码第 51 行**

```text
for i in range(4):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 52 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 54 行**

```text
        f = dec.decode_32bit_float()
# 注释：给 `f` 赋值。
```

**源码第 55 行**

```text
        print(f"  float[{i}] = {f}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 56 行**

```text
    except Exception as e:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 57 行**

```text
        print(f"  float[{i}] 解码失败: {e}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 60 行**

```text
print("\n=== 按小端 FLOAT32 解读前 8 寄存器 ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 61 行**

```text
dec2 = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
# 注释：给 `dec2` 赋值。
```

**源码第 62 行**

```text
                                          byteorder=Endian.LITTLE,
# 注释：给 `byteorder` 赋值。
```

**源码第 63 行**

```text
                                          wordorder=Endian.LITTLE)
# 注释：给 `wordorder` 赋值。
```

**源码第 64 行**

```text
for i in range(4):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 65 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 66 行**

```text
        f = dec2.decode_32bit_float()
# 注释：给 `f` 赋值。
```

**源码第 67 行**

```text
        print(f"  float_le[{i}] = {f}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 68 行**

```text
    except Exception as e:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 69 行**

```text
        print(f"  float_le[{i}] 解码失败: {e}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 71 行**

```text
cli.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 72 行**

```text
print("\n=== 关闭连接 ===")
# 注释：调用函数或对象方法并传入参数。
```
