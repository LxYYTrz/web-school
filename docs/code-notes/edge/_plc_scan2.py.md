# edge/_plc_scan2.py 逐行注释

[打开源码](../../../edge/_plc_scan2.py) · 85 行 · 51 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 3 行**

```text
from pymodbus.client import ModbusTcpClient
# 注释：从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 6 行**

```text
OUT = r"C:\Users\Administrator\deploy_work\plc-scan2.out"
# 注释：给 `OUT` 赋值。
```

**源码第 8 行**

```text
lines = []
# 注释：给 `lines` 赋值。
```

**源码第 9 行**

```text
def w(*a):
# 注释：定义函数 `w`。 关键字：`def`＝定义 Python 函数。
```

**源码第 10 行**

```text
    s = " ".join(str(x) for x in a)
# 注释：给 `s` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 11 行**

```text
    print(s, flush=True)
# 注释：调用函数或对象方法并传入参数。 关键字：`True`＝布尔真值。
```

**源码第 12 行**

```text
    lines.append(s)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 15 行**

```text
HOST = "192.168.10.31"; PORT = 503
# 注释：给 `HOST` 赋值。
```

**源码第 17 行**

```text
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 注释：给 `cli` 赋值。
```

**源码第 18 行**

```text
if not cli.connect():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 19 行**

```text
    w("连接失败"); raise SystemExit(1)
# 注释：调用函数或对象方法并传入参数。 关键字：`raise`＝抛出 Python 异常。
```

**源码第 20 行**

```text
w("已连接")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 24 行**

```text
w("\n[1] 读 0x07D0..0x07D3(标准诊断区)")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 25 行**

```text
rr = cli.read_holding_registers(address=0x07D0, count=4, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 26 行**

```text
w("  ", "ERR" if rr.isError() else rr.registers)
# 注释：调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 29 行**

```text
w("\n[2] Input Registers (FC 04) addr 0 count 16")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 30 行**

```text
rr = cli.read_input_registers(address=0, count=16, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 31 行**

```text
w("  ", "ERR" if rr.isError() else rr.registers)
# 注释：调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 34 行**

```text
w("\n[3] Coils (FC 01) addr 0 count 16")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 35 行**

```text
rr = cli.read_coils(address=0, count=16, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 37 行**

```text
w("  ", "ERR" if rr.isError() else rr.bits[:16])
# 注释：调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 40 行**

```text
w("\n[4] Discrete Inputs (FC 02) addr 0 count 16")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 41 行**

```text
rr = cli.read_discrete_inputs(address=0, count=16, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 42 行**

```text
w("  ", "ERR" if rr.isError() else rr.bits[:16])
# 注释：调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 46 行**

```text
w("\n[5] HR 范围扫描 1..255 step 1 (找可读段)")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 47 行**

```text
ok_ranges = []
# 注释：给 `ok_ranges` 赋值。
```

**源码第 48 行**

```text
in_range = False; start = None
# 注释：给 `in_range` 赋值。 关键字：`False`＝布尔假值；`None`＝空值。
```

**源码第 49 行**

```text
for addr in range(1, 256):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 50 行**

```text
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 51 行**

```text
    if not rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 53 行**

```text
        if not in_range:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 54 行**

```text
            start = addr; in_range = True
# 注释：给 `start` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 55 行**

```text
    else:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。
```

**源码第 57 行**

```text
        if in_range:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 58 行**

```text
            ok_ranges.append((start, addr-1)); in_range = False
# 注释：调用函数或对象方法并传入参数。 关键字：`False`＝布尔假值。
```

**源码第 60 行**

```text
if in_range: ok_ranges.append((start, 255))
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 61 行**

```text
w(f"  可读区段: {ok_ranges}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 64 行**

```text
w("\n[6] 完整读 HR[0..15]")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 65 行**

```text
rr = cli.read_holding_registers(address=0, count=16, slave=2)
# 注释：给 `rr` 赋值。
```

**源码第 66 行**

```text
if not rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 67 行**

```text
    w(f"  raw: {rr.registers}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 69 行**

```text
    nz = [(i, v) for i, v in enumerate(rr.registers) if v != 0]
# 注释：给 `nz` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`if`＝按条件分支。
```

**源码第 70 行**

```text
    w(f"  非零: {nz if nz else '(全 0)'}")
# 注释：调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
```

**源码第 74 行**

```text
w("\n[7] unit=2/3/4/255 在 addr=0 的对比")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 75 行**

```text
for u in [1, 2, 3, 4, 5, 255]:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 76 行**

```text
    rr = cli.read_holding_registers(address=0, count=4, slave=u)
# 注释：给 `rr` 赋值。
```

**源码第 77 行**

```text
    w(f"  unit={u}: {'ERR' if rr.isError() else rr.registers}")
# 注释：调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
```

**源码第 80 行**

```text
cli.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 81 行**

```text
w("\n完成")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 84 行**

```text
with open(OUT, "w", encoding="utf-8") as f:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`as`＝为导入或上下文对象命名。
```

**源码第 85 行**

```text
    f.write("\n".join(lines))
# 注释：调用函数或对象方法并传入参数。
```
