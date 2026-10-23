# edge/plc_read_state.py 逐行说明

[打开源码](../../../edge/plc_read_state.py) · 96 行 · 71 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 11 | <code>import argparse</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 12 | <code>import os</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 13 | <code>import sys</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 15 | <code>from pymodbus.client import ModbusTcpClient</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 18 | <code>STATE_MAP = {</code> | 给 `STATE_MAP` 赋值。 |
| 19 | <code>0: "waiting_feed",   # 等待入料</code> | 续写当前表达式、集合或调用。 |
| 20 | <code>1: "feeding",        # 入料中</code> | 续写当前表达式、集合或调用。 |
| 21 | <code>2: "assembling",     # 装配中</code> | 续写当前表达式、集合或调用。 |
| 22 | <code>3: "waiting_robot",  # 等待机器人完成</code> | 续写当前表达式、集合或调用。 |
| 23 | <code>4: "unload_done",    # 下料完成</code> | 续写当前表达式、集合或调用。 |
| 24 | <code>5: "waiting_next",   # 等待后站入料</code> | 续写当前表达式、集合或调用。 |
| 25 | <code>100: "init_error",   # 初始化错误状态</code> | 续写当前表达式、集合或调用。 |
| 26 | <code>101: "stopped",      # 停止状态</code> | 续写当前表达式、集合或调用。 |
| 27 | <code>102: "manual_mode",  # 手动控制模式</code> | 续写当前表达式、集合或调用。 |
| 28 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 29 | <code>IO_NAMES = ["sensorIn", "sensorArrive", "sensorRetreat", "lightColor", "trayUp", "blockUp"]</code> | 给 `IO_NAMES` 赋值。 |
| 30 | <code>IO_DESC = {</code> | 给 `IO_DESC` 赋值。 |
| 31 | <code>"lightColor": {0: "绿灯", 1: "黄灯", 2: "红灯"},</code> | 续写当前表达式、集合或调用。 |
| 32 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 35 | <code>def to_signed(u16: int) -&gt; int:</code> | 定义函数 `to_signed`。 关键字：`def`＝定义 Python 函数。 |
| 36 | <code>return u16 if u16 &lt; 0x8000 else u16 - 0x10000</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 39 | <code>def main() -&gt; int:</code> | 定义函数 `main`。 关键字：`def`＝定义 Python 函数。 |
| 40 | <code>ap = argparse.ArgumentParser(description="只读读一次 PLC 状态")</code> | 给 `ap` 赋值。 |
| 41 | <code>ap.add_argument("--host", default=os.getenv("PLC_HOST", "192.168.10.31"))</code> | 调用函数或对象方法并传入参数。 |
| 42 | <code>ap.add_argument("--port", type=int, default=int(os.getenv("PLC_PORT", "503")))</code> | 调用函数或对象方法并传入参数。 |
| 43 | <code>ap.add_argument("--unit", type=int, default=int(os.getenv("PLC_UNIT_ID", "2")))</code> | 调用函数或对象方法并传入参数。 |
| 44 | <code>args = ap.parse_args()</code> | 给 `args` 赋值。 |
| 46 | <code>cli = ModbusTcpClient(host=args.host, port=args.port, timeout=3)</code> | 给 `cli` 赋值。 |
| 47 | <code>if not cli.connect():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 48 | <code>print(f"[FAIL] 连不上 PLC {args.host}:{args.port} —— 检查网线/路由/PLC 是否上电")</code> | 调用函数或对象方法并传入参数。 |
| 49 | <code>return 1</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 50 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 52 | <code>regs = []</code> | 给 `regs` 赋值。 |
| 53 | <code>for addr in range(17):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 54 | <code>try:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。 |
| 55 | <code>rr = cli.read_holding_registers(address=addr, count=1, device_id=args.unit)</code> | 给 `rr` 赋值。 |
| 56 | <code>except Exception as exc:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 57 | <code>regs.append(None)</code> | 调用函数或对象方法并传入参数。 关键字：`None`＝空值。 |
| 58 | <code>print(f"  word {addr:2d} 读取异常: {exc}")</code> | 调用函数或对象方法并传入参数。 |
| 59 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 60 | <code>if rr.isError():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 61 | <code>regs.append(None)</code> | 调用函数或对象方法并传入参数。 关键字：`None`＝空值。 |
| 62 | <code>print(f"  word {addr:2d} 读失败: {rr}")</code> | 调用函数或对象方法并传入参数。 |
| 63 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 64 | <code>regs.append(rr.registers[0])</code> | 调用函数或对象方法并传入参数。 |
| 65 | <code>except Exception as exc:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。 |
| 66 | <code>print(f"[FAIL] 读 PLC 异常: {exc}")</code> | 调用函数或对象方法并传入参数。 |
| 67 | <code>return 1</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 68 | <code>finally:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`finally`＝执行收尾逻辑。 |
| 69 | <code>cli.close()</code> | 调用函数或对象方法并传入参数。 |
| 71 | <code>if regs[6] is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 72 | <code>print("[FAIL] 产线状态点(word 6)读不到,无法判定状态")</code> | 调用函数或对象方法并传入参数。 |
| 73 | <code>return 1</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 75 | <code>joints = [to_signed(regs[i]) / 10 for i in range(6)]</code> | 给 `joints` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 76 | <code>state_raw = regs[6]</code> | 给 `state_raw` 赋值。 |
| 77 | <code>state = STATE_MAP.get(state_raw, f"unknown({state_raw})")</code> | 给 `state` 赋值。 |
| 79 | <code>print(f"[OK] PLC {args.host}:{args.port} unit={args.unit}")</code> | 调用函数或对象方法并传入参数。 |
| 80 | <code>print(f"  产线状态 word6 = {state_raw} -&gt; {state}")</code> | 调用函数或对象方法并传入参数。 |
| 81 | <code>print(f"  关节角 word0..5 = {joints}")</code> | 调用函数或对象方法并传入参数。 |
| 82 | <code>io = {IO_NAMES[i]: regs[11 + i] for i in range(6)}</code> | 给 `io` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 83 | <code>for k, v in io.items():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 84 | <code>extra = IO_DESC.get(k, {}).get(v, "")</code> | 给 `extra` 赋值。 |
| 85 | <code>print(f"  IO {k:&lt;14} = {v} {extra}")</code> | 调用函数或对象方法并传入参数。 |
| 86 | <code>print(f"  写点 word7..10 (stop/mode/start/conveyor) = {regs[7:11]}")</code> | 调用函数或对象方法并传入参数。 |
| 88 | <code>if state_raw == 101:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 89 | <code>print("  → 产线处于 stopped,可执行控制指令验证步骤 2(获取手动模式)")</code> | 调用函数或对象方法并传入参数。 |
| 90 | <code>elif state_raw == 102:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 91 | <code>print("  → 产线处于 manual_mode,可执行传送带/启动验证")</code> | 调用函数或对象方法并传入参数。 |
| 92 | <code>return 0</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 95 | <code>if __name__ == "__main__":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 96 | <code>sys.exit(main())</code> | 调用函数或对象方法并传入参数。 |
