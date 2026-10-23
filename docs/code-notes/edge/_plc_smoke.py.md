# edge/_plc_smoke.py 逐行说明

[打开源码](../../../edge/_plc_smoke.py) · 72 行 · 46 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 7 | <code>import sys</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 8 | <code>from pymodbus.client import ModbusTcpClient</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 9 | <code>from pymodbus.payload import BinaryPayloadDecoder</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 10 | <code>from pymodbus.constants import Endian</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 13 | <code>HOST = "192.168.10.31"</code> | 给 `HOST` 赋值。 |
| 14 | <code>PORT = 503</code> | 给 `PORT` 赋值。 |
| 15 | <code>UNIT = 2</code> | 给 `UNIT` 赋值。 |
| 16 | <code>COUNT = 16</code> | 给 `COUNT` 赋值。 |
| 17 | <code>START = 0</code> | 给 `START` 赋值。 |
| 20 | <code>print(f"=== 尝试连接 {HOST}:{PORT} unit={UNIT} ===")</code> | 调用函数或对象方法并传入参数。 |
| 22 | <code>cli = ModbusTcpClient(host=HOST, port=PORT, timeout=3)</code> | 给 `cli` 赋值。 |
| 24 | <code>if not cli.connect():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 25 | <code>print("连接失败")</code> | 调用函数或对象方法并传入参数。 |
| 26 | <code>sys.exit(1)</code> | 调用函数或对象方法并传入参数。 |
| 27 | <code>print("已连接")</code> | 调用函数或对象方法并传入参数。 |
| 30 | <code>print(f"\n=== 读 Holding Register [{START}..{START+COUNT-1}] ===")</code> | 调用函数或对象方法并传入参数。 |
| 31 | <code>rr = cli.read_holding_registers(address=START, count=COUNT, slave=UNIT)</code> | 给 `rr` 赋值。 |
| 33 | <code>if rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 34 | <code>print(f"读取失败: {rr}")</code> | 调用函数或对象方法并传入参数。 |
| 36 | <code>cli.close()</code> | 调用函数或对象方法并传入参数。 |
| 37 | <code>sys.exit(2)</code> | 调用函数或对象方法并传入参数。 |
| 40 | <code>print(f"原始寄存器(INT16, 共 {len(rr.registers)} 个):")</code> | 调用函数或对象方法并传入参数。 |
| 41 | <code>for i, v in enumerate(rr.registers):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 43 | <code>print(f"  [{START+i:&gt;4}] = {v:&gt;6} (0x{v:04X})")</code> | 调用函数或对象方法并传入参数。 |
| 46 | <code>print("\n=== 按大端 FLOAT32 解读前 8 寄存器(4 浮点) ===")</code> | 调用函数或对象方法并传入参数。 |
| 48 | <code>dec = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],</code> | 给 `dec` 赋值。 |
| 49 | <code>byteorder=Endian.BIG,</code> | 给 `byteorder` 赋值。 |
| 50 | <code>wordorder=Endian.BIG)</code> | 给 `wordorder` 赋值。 |
| 51 | <code>for i in range(4):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 52 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 54 | <code>f = dec.decode_32bit_float()</code> | 给 `f` 赋值。 |
| 55 | <code>print(f"  float[{i}] = {f}")</code> | 调用函数或对象方法并传入参数。 |
| 56 | <code>except Exception as e:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 57 | <code>print(f"  float[{i}] 解码失败: {e}")</code> | 调用函数或对象方法并传入参数。 |
| 60 | <code>print("\n=== 按小端 FLOAT32 解读前 8 寄存器 ===")</code> | 调用函数或对象方法并传入参数。 |
| 61 | <code>dec2 = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],</code> | 给 `dec2` 赋值。 |
| 62 | <code>byteorder=Endian.LITTLE,</code> | 给 `byteorder` 赋值。 |
| 63 | <code>wordorder=Endian.LITTLE)</code> | 给 `wordorder` 赋值。 |
| 64 | <code>for i in range(4):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 65 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 66 | <code>f = dec2.decode_32bit_float()</code> | 给 `f` 赋值。 |
| 67 | <code>print(f"  float_le[{i}] = {f}")</code> | 调用函数或对象方法并传入参数。 |
| 68 | <code>except Exception as e:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 69 | <code>print(f"  float_le[{i}] 解码失败: {e}")</code> | 调用函数或对象方法并传入参数。 |
| 71 | <code>cli.close()</code> | 调用函数或对象方法并传入参数。 |
| 72 | <code>print("\n=== 关闭连接 ===")</code> | 调用函数或对象方法并传入参数。 |
