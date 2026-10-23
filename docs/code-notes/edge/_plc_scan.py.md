# edge/_plc_scan.py 逐行说明

[打开源码](../../../edge/_plc_scan.py) · 61 行 · 36 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 3 | <code>import sys</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 4 | <code>from pymodbus.client import ModbusTcpClient</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 5 | <code>from pymodbus.payload import BinaryPayloadDecoder</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 6 | <code>from pymodbus.constants import Endian</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 9 | <code>HOST = "192.168.10.31"</code> | 给 `HOST` 赋值。 |
| 10 | <code>PORT = 503</code> | 给 `PORT` 赋值。 |
| 13 | <code>cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)</code> | 给 `cli` 赋值。 |
| 14 | <code>if not cli.connect():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 15 | <code>print("连接失败")</code> | 调用函数或对象方法并传入参数。 |
| 16 | <code>sys.exit(1)</code> | 调用函数或对象方法并传入参数。 |
| 17 | <code>print("已连接")</code> | 调用函数或对象方法并传入参数。 |
| 23 | <code>print("\n=== [1] 试 unit_id 1/2/255 × address 0, count 4 ===")</code> | 调用函数或对象方法并传入参数。 |
| 24 | <code>for unit in [1, 2, 255]:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 25 | <code>rr = cli.read_holding_registers(address=0, count=4, slave=unit)</code> | 给 `rr` 赋值。 |
| 26 | <code>if rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 27 | <code>print(f"  unit={unit}: 错误 {rr}")</code> | 调用函数或对象方法并传入参数。 |
| 28 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 29 | <code>print(f"  unit={unit}: OK -&gt; {rr.registers}")</code> | 调用函数或对象方法并传入参数。 |
| 34 | <code>print("\n=== [2] unit=2, scan address 0..400 step 20, count 4 ===")</code> | 调用函数或对象方法并传入参数。 |
| 35 | <code>for addr in range(0, 400, 20):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 36 | <code>rr = cli.read_holding_registers(address=addr, count=4, slave=2)</code> | 给 `rr` 赋值。 |
| 37 | <code>if rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 38 | <code>print(f"  addr {addr:&gt;4}: ERR")</code> | 调用函数或对象方法并传入参数。 |
| 39 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 40 | <code>vals = rr.registers</code> | 给 `vals` 赋值。 |
| 41 | <code>print(f"  addr {addr:&gt;4}: {vals}")</code> | 调用函数或对象方法并传入参数。 |
| 46 | <code>print("\n=== [3] unit=2, 找首段非零数据 (addr 0..100 step 1) ===")</code> | 调用函数或对象方法并传入参数。 |
| 47 | <code>for addr in range(0, 100):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 48 | <code>rr = cli.read_holding_registers(address=addr, count=1, slave=2)</code> | 给 `rr` 赋值。 |
| 50 | <code>if not rr.isError() and rr.registers and rr.registers[0] != 0:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`and`＝逻辑与。 |
| 53 | <code>rr2 = cli.read_holding_registers(address=addr, count=4, slave=2)</code> | 给 `rr2` 赋值。 |
| 54 | <code>if not rr2.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 55 | <code>print(f"  addr {addr:&gt;4}: {rr2.registers}")</code> | 调用函数或对象方法并传入参数。 |
| 57 | <code>break</code> | 续写当前表达式、集合或调用。 |
| 60 | <code>cli.close()</code> | 调用函数或对象方法并传入参数。 |
| 61 | <code>print("\n=== 完成 ===")</code> | 调用函数或对象方法并传入参数。 |
