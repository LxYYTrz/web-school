# edge/_plc_scan2.py 逐行说明

[打开源码](../../../edge/_plc_scan2.py) · 85 行 · 51 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 3 | <code>from pymodbus.client import ModbusTcpClient</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 6 | <code>OUT = r"C:\Users\Administrator\deploy_work\plc-scan2.out"</code> | 给 `OUT` 赋值。 |
| 8 | <code>lines = []</code> | 给 `lines` 赋值。 |
| 9 | <code>def w(*a):</code> | 定义函数 `w`。 关键字：`def`＝定义 Python 函数。 |
| 10 | <code>s = " ".join(str(x) for x in a)</code> | 给 `s` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 11 | <code>print(s, flush=True)</code> | 调用函数或对象方法并传入参数。 关键字：`True`＝布尔真值。 |
| 12 | <code>lines.append(s)</code> | 调用函数或对象方法并传入参数。 |
| 15 | <code>HOST = "192.168.10.31"; PORT = 503</code> | 给 `HOST` 赋值。 |
| 17 | <code>cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)</code> | 给 `cli` 赋值。 |
| 18 | <code>if not cli.connect():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 19 | <code>w("连接失败"); raise SystemExit(1)</code> | 调用函数或对象方法并传入参数。 关键字：`raise`＝抛出 Python 异常。 |
| 20 | <code>w("已连接")</code> | 调用函数或对象方法并传入参数。 |
| 24 | <code>w("\n[1] 读 0x07D0..0x07D3(标准诊断区)")</code> | 调用函数或对象方法并传入参数。 |
| 25 | <code>rr = cli.read_holding_registers(address=0x07D0, count=4, slave=2)</code> | 给 `rr` 赋值。 |
| 26 | <code>w("  ", "ERR" if rr.isError() else rr.registers)</code> | 调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 29 | <code>w("\n[2] Input Registers (FC 04) addr 0 count 16")</code> | 调用函数或对象方法并传入参数。 |
| 30 | <code>rr = cli.read_input_registers(address=0, count=16, slave=2)</code> | 给 `rr` 赋值。 |
| 31 | <code>w("  ", "ERR" if rr.isError() else rr.registers)</code> | 调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 34 | <code>w("\n[3] Coils (FC 01) addr 0 count 16")</code> | 调用函数或对象方法并传入参数。 |
| 35 | <code>rr = cli.read_coils(address=0, count=16, slave=2)</code> | 给 `rr` 赋值。 |
| 37 | <code>w("  ", "ERR" if rr.isError() else rr.bits[:16])</code> | 调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 40 | <code>w("\n[4] Discrete Inputs (FC 02) addr 0 count 16")</code> | 调用函数或对象方法并传入参数。 |
| 41 | <code>rr = cli.read_discrete_inputs(address=0, count=16, slave=2)</code> | 给 `rr` 赋值。 |
| 42 | <code>w("  ", "ERR" if rr.isError() else rr.bits[:16])</code> | 调用函数或对象方法并传入参数。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 46 | <code>w("\n[5] HR 范围扫描 1..255 step 1 (找可读段)")</code> | 调用函数或对象方法并传入参数。 |
| 47 | <code>ok_ranges = []</code> | 给 `ok_ranges` 赋值。 |
| 48 | <code>in_range = False; start = None</code> | 给 `in_range` 赋值。 关键字：`False`＝布尔假值；`None`＝空值。 |
| 49 | <code>for addr in range(1, 256):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 50 | <code>rr = cli.read_holding_registers(address=addr, count=1, slave=2)</code> | 给 `rr` 赋值。 |
| 51 | <code>if not rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 53 | <code>if not in_range:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 54 | <code>start = addr; in_range = True</code> | 给 `start` 赋值。 关键字：`True`＝布尔真值。 |
| 55 | <code>else:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`else`＝进入另一条件分支。 |
| 57 | <code>if in_range:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 58 | <code>ok_ranges.append((start, addr-1)); in_range = False</code> | 调用函数或对象方法并传入参数。 关键字：`False`＝布尔假值。 |
| 60 | <code>if in_range: ok_ranges.append((start, 255))</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 61 | <code>w(f"  可读区段: {ok_ranges}")</code> | 调用函数或对象方法并传入参数。 |
| 64 | <code>w("\n[6] 完整读 HR[0..15]")</code> | 调用函数或对象方法并传入参数。 |
| 65 | <code>rr = cli.read_holding_registers(address=0, count=16, slave=2)</code> | 给 `rr` 赋值。 |
| 66 | <code>if not rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 67 | <code>w(f"  raw: {rr.registers}")</code> | 调用函数或对象方法并传入参数。 |
| 69 | <code>nz = [(i, v) for i, v in enumerate(rr.registers) if v != 0]</code> | 给 `nz` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`if`＝按条件分支。 |
| 70 | <code>w(f"  非零: {nz if nz else '(全 0)'}")</code> | 调用函数或对象方法并传入参数。 |
| 74 | <code>w("\n[7] unit=2/3/4/255 在 addr=0 的对比")</code> | 调用函数或对象方法并传入参数。 |
| 75 | <code>for u in [1, 2, 3, 4, 5, 255]:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 76 | <code>rr = cli.read_holding_registers(address=0, count=4, slave=u)</code> | 给 `rr` 赋值。 |
| 77 | <code>w(f"  unit={u}: {'ERR' if rr.isError() else rr.registers}")</code> | 调用函数或对象方法并传入参数。 |
| 80 | <code>cli.close()</code> | 调用函数或对象方法并传入参数。 |
| 81 | <code>w("\n完成")</code> | 调用函数或对象方法并传入参数。 |
| 84 | <code>with open(OUT, "w", encoding="utf-8") as f:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`as`＝为导入或上下文对象命名。 |
| 85 | <code>f.write("\n".join(lines))</code> | 调用函数或对象方法并传入参数。 |
