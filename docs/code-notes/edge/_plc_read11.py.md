# edge/_plc_read11.py 逐行说明

[打开源码](../../../edge/_plc_read11.py) · 81 行 · 42 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 3 | <code>import json, sys</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 4 | <code>from pymodbus.client import ModbusTcpClient</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 5 | <code>from pymodbus.payload import BinaryPayloadDecoder</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 6 | <code>from pymodbus.constants import Endian</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 9 | <code>HOST, PORT, UNIT = "192.168.10.31", 503, 2</code> | 续写当前表达式、集合或调用。 |
| 11 | <code>OUT = r"C:\Users\Administrator\deploy_work\plc-read11.out"</code> | 给 `OUT` 赋值。 |
| 13 | <code>def to_signed(u16):</code> | 定义函数 `to_signed`。 关键字：`def`＝定义 Python 函数。 |
| 15 | <code>return u16 if u16 &lt; 0x8000 else u16 - 0x10000</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 18 | <code>cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)</code> | 给 `cli` 赋值。 |
| 19 | <code>ok = cli.connect()</code> | 给 `ok` 赋值。 |
| 22 | <code>lines = []</code> | 给 `lines` 赋值。 |
| 23 | <code>def w(s): lines.append(s); print(s, flush=True)</code> | 定义函数 `w`。 关键字：`def`＝定义 Python 函数；`True`＝布尔真值。 |
| 26 | <code>w(f"connect {HOST}:{PORT} unit={UNIT}: {'OK' if ok else 'FAIL'}")</code> | 调用函数或对象方法并传入参数。 |
| 28 | <code>if not ok: raise SystemExit(1)</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`raise`＝抛出 Python 异常。 |
| 31 | <code>rr = cli.read_holding_registers(address=0, count=11, slave=UNIT)</code> | 给 `rr` 赋值。 |
| 32 | <code>if rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 33 | <code>w(f"读取失败: {rr}"); cli.close(); raise SystemExit(2)</code> | 调用函数或对象方法并传入参数。 关键字：`raise`＝抛出 Python 异常。 |
| 36 | <code>regs = rr.registers</code> | 给 `regs` 赋值。 |
| 37 | <code>w(f"\n原始 11 个 word: {regs}")</code> | 调用函数或对象方法并传入参数。 |
| 39 | <code>w(f"十六进制: {[hex(r) for r in regs]}")</code> | 调用函数或对象方法并传入参数。 |
| 44 | <code>NAMES = ["J1","J2","J3","J4","J5","J6","speedPct","mode","alarmCode","lineState","beatMs(÷10)"]</code> | 给 `NAMES` 赋值。 |
| 48 | <code>SCALES= [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1,    1,    1,          1,        10]</code> | 给 `SCALES` 赋值。 |
| 50 | <code>SIGNED = [True,True,True,True,True,True, False, False, False,    False,    False]</code> | 给 `SIGNED` 赋值。 关键字：`True`＝布尔真值；`False`＝布尔假值。 |
| 52 | <code>w(f"\n按 0.1° 缩放翻译:")</code> | 调用函数或对象方法并传入参数。 |
| 54 | <code>w(f"{'DB':&lt;5} {'名字':&lt;14} {'原始':&gt;8} {'缩放后':&gt;10} {'物理量':&lt;20}")</code> | 调用函数或对象方法并传入参数。 |
| 56 | <code>for i, r in enumerate(regs):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 57 | <code>v = to_signed(r) if SIGNED[i] else r</code> | 给 `v` 赋值。 关键字：`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 58 | <code>phys = v * SCALES[i]</code> | 给 `phys` 赋值。 |
| 59 | <code>w(f"DB[{i}] {NAMES[i]:&lt;14} {r:&gt;6} -&gt; {v:&gt;6} * {SCALES[i]:&gt;5} = {phys:&gt;10.1f}")</code> | 调用函数或对象方法并传入参数。 |
| 63 | <code>w(f"\n尝试按 REAL(大端)解读:作为参考(可能无意义)")</code> | 调用函数或对象方法并传入参数。 |
| 65 | <code>for i in range(0, 11, 2):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 67 | <code>if i+1 &gt;= 11: break</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 68 | <code>pair = regs[i:i+2]</code> | 给 `pair` 赋值。 |
| 69 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 70 | <code>d = BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordorder=Endian.BIG)</code> | 给 `d` 赋值。 |
| 71 | <code>f = d.decode_32bit_float()</code> | 给 `f` 赋值。 |
| 72 | <code>w(f"  [{i},{i+1}] as float = {f}")</code> | 调用函数或对象方法并传入参数。 |
| 73 | <code>except: pass</code> | 续写当前表达式、集合或调用。 关键字：`except`＝处理指定异常；`pass`＝保留空语句块。 |
| 76 | <code>cli.close()</code> | 调用函数或对象方法并传入参数。 |
| 77 | <code>w("\n完成")</code> | 调用函数或对象方法并传入参数。 |
| 80 | <code>with open(OUT, "w", encoding="utf-8") as f:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`with`＝在资源上下文中执行；`as`＝为导入或上下文对象命名。 |
| 81 | <code>f.write("\n".join(lines))</code> | 调用函数或对象方法并传入参数。 |
