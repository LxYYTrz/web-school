# edge/_plc_scan.py 逐行注释

[打开源码](../../../edge/_plc_scan.py) · 61 行 · 36 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 3 行**

```text
import sys
# 注释：从 Python 环境 导入 sys，供后续代码使用。 关键字：`import`＝导入模块或符号。
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
HOST = "192.168.10.31"
# 注释：给 `HOST` 赋值。
```

**源码第 10 行**

```text
PORT = 503
# 注释：给 `PORT` 赋值。
```

**源码第 13 行**

```text
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 注释：给 `cli` 赋值。
```

**源码第 14 行**

```text
if not cli.connect():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 15 行**

```text
    print("连接失败")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 16 行**

```text
    sys.exit(1)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 17 行**

```text
print("已连接")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 23 行**

```text
print("\n=== [1] 试 unit_id 1/2/255 × address 0, count 4 ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 24 行**

```text
for unit in [1, 2, 255]:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 25 行**

```text
    rr = cli.read_holding_registers(address=0, count=4, slave=unit)
# 注释：给 `rr` 赋值。
```

**源码第 26 行**

```text
    if rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 27 行**

```text
        print(f"  unit={unit}: 错误 {rr}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 28 行**

```text
    else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 29 行**

```text
        print(f"  unit={unit}: OK -> {rr.registers}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 34 行**

```text
print("\n=== [2] unit=2, scan address 0..400 step 20, count 4 ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 35 行**

```text
for addr in range(0, 400, 20):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 36 行**

```text
    rr = cli.read_holding_registers(address=addr, count=4, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 37 行**

```text
    if rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 38 行**

```text
        print(f"  addr {addr:>4}: ERR")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 39 行**

```text
    else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 40 行**

```text
        vals = rr.registers
# 注释：给 `vals` 赋值。
```

**源码第 41 行**

```text
        print(f"  addr {addr:>4}: {vals}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 46 行**

```text
print("\n=== [3] unit=2, 找首段非零数据 (addr 0..100 step 1) ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 47 行**

```text
for addr in range(0, 100):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 48 行**

```text
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 50 行**

```text
    if not rr.isError() and rr.registers and rr.registers[0] != 0:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`and`＝逻辑与。
```

**源码第 53 行**

```text
        rr2 = cli.read_holding_registers(address=addr, count=4, slave=2)
# 注释：给 `rr2` 赋值。
```

**源码第 54 行**

```text
        if not rr2.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 55 行**

```text
            print(f"  addr {addr:>4}: {rr2.registers}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 57 行**

```text
        break
# 注释：立即结束当前循环或分支。
```

**源码第 60 行**

```text
cli.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 61 行**

```text
print("\n=== 完成 ===")
# 注释：调用函数或对象方法并传入参数。
```
