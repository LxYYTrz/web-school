# edge/plc_read_state.py 逐行注释

[打开源码](../../../edge/plc_read_state.py) · 96 行 · 71 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 11 行**

```text
import argparse
# 注释：从 Python 环境 导入 argparse，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 12 行**

```text
import os
# 注释：从 Python 环境 导入 os，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 13 行**

```text
import sys
# 注释：从 Python 环境 导入 sys，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 15 行**

```text
from pymodbus.client import ModbusTcpClient
# 注释：从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 18 行**

```text
STATE_MAP = {
# 注释：给 `STATE_MAP` 赋值。
```

**源码第 19 行**

```text
    0: "waiting_feed",   # 等待入料
# 注释：设置字段 0，值为 "waiting_feed",   # 等待入料。
```

**源码第 20 行**

```text
    1: "feeding",        # 入料中
# 注释：设置字段 1，值为 "feeding",        # 入料中。
```

**源码第 21 行**

```text
    2: "assembling",     # 装配中
# 注释：设置字段 2，值为 "assembling",     # 装配中。
```

**源码第 22 行**

```text
    3: "waiting_robot",  # 等待机器人完成
# 注释：设置字段 3，值为 "waiting_robot",  # 等待机器人完成。
```

**源码第 23 行**

```text
    4: "unload_done",    # 下料完成
# 注释：设置字段 4，值为 "unload_done",    # 下料完成。
```

**源码第 24 行**

```text
    5: "waiting_next",   # 等待后站入料
# 注释：设置字段 5，值为 "waiting_next",   # 等待后站入料。
```

**源码第 25 行**

```text
    100: "init_error",   # 初始化错误状态
# 注释：设置字段 100，值为 "init_error",   # 初始化错误状态。
```

**源码第 26 行**

```text
    101: "stopped",      # 停止状态
# 注释：设置字段 101，值为 "stopped",      # 停止状态。
```

**源码第 27 行**

```text
    102: "manual_mode",  # 手动控制模式
# 注释：设置字段 102，值为 "manual_mode",  # 手动控制模式。
```

**源码第 28 行**

```text
}
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 29 行**

```text
IO_NAMES = ["sensorIn", "sensorArrive", "sensorRetreat", "lightColor", "trayUp", "blockUp"]
# 注释：给 `IO_NAMES` 赋值。
```

**源码第 30 行**

```text
IO_DESC = {
# 注释：给 `IO_DESC` 赋值。
```

**源码第 31 行**

```text
    "lightColor": {0: "绿灯", 1: "黄灯", 2: "红灯"},
# 注释：设置字段 lightColor，值为 {0: "绿灯", 1: "黄灯", 2: "红灯"}。
```

**源码第 32 行**

```text
}
# 注释：结束当前对象、函数或条件代码块。
```

**源码第 35 行**

```text
def to_signed(u16: int) -> int:
# 注释：定义函数 `to_signed`。 关键字：`def`＝定义 Python 函数。
```

**源码第 36 行**

```text
    return u16 if u16 < 0x8000 else u16 - 0x10000
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`if`＝按条件分支；`else`＝进入另一条件分支。
```

**源码第 39 行**

```text
def main() -> int:
# 注释：定义函数 `main`。 关键字：`def`＝定义 Python 函数。
```

**源码第 40 行**

```text
    ap = argparse.ArgumentParser(description="只读读一次 PLC 状态")
# 注释：给 `ap` 赋值。
```

**源码第 41 行**

```text
    ap.add_argument("--host", default=os.getenv("PLC_HOST", "192.168.10.31"))
# 注释：调用函数或对象方法并传入参数。
```

**源码第 42 行**

```text
    ap.add_argument("--port", type=int, default=int(os.getenv("PLC_PORT", "503")))
# 注释：调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
```

**源码第 43 行**

```text
    ap.add_argument("--unit", type=int, default=int(os.getenv("PLC_UNIT_ID", "2")))
# 注释：调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
```

**源码第 44 行**

```text
    args = ap.parse_args()
# 注释：给 `args` 赋值。
```

**源码第 46 行**

```text
    cli = ModbusTcpClient(host=args.host, port=args.port, timeout=3)
# 注释：给 `cli` 赋值。
```

**源码第 47 行**

```text
    if not cli.connect():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 48 行**

```text
        print(f"[FAIL] 连不上 PLC {args.host}:{args.port} —— 检查网线/路由/PLC 是否上电")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 49 行**

```text
        return 1
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 50 行**

```text
    try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 52 行**

```text
        regs = []
# 注释：给 `regs` 赋值。
```

**源码第 53 行**

```text
        for addr in range(17):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 54 行**

```text
            try:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`try`＝进入异常处理块。
```

**源码第 55 行**

```text
                rr = cli.read_holding_registers(address=addr, count=1, device_id=args.unit)
# 注释：给 `rr` 赋值。
```

**源码第 56 行**

```text
            except Exception as exc:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 57 行**

```text
                regs.append(None)
# 注释：调用函数或对象方法并传入参数。 关键字：`None`＝空值。
```

**源码第 58 行**

```text
                print(f"  word {addr:2d} 读取异常: {exc}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 59 行**

```text
                continue
# 注释：跳过本轮剩余语句，进入下一次循环。
```

**源码第 60 行**

```text
            if rr.isError():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 61 行**

```text
                regs.append(None)
# 注释：调用函数或对象方法并传入参数。 关键字：`None`＝空值。
```

**源码第 62 行**

```text
                print(f"  word {addr:2d} 读失败: {rr}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 63 行**

```text
                continue
# 注释：跳过本轮剩余语句，进入下一次循环。
```

**源码第 64 行**

```text
            regs.append(rr.registers[0])
# 注释：调用函数或对象方法并传入参数。
```

**源码第 65 行**

```text
    except Exception as exc:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`except`＝处理指定异常；`as`＝为导入或上下文对象命名。
```

**源码第 66 行**

```text
        print(f"[FAIL] 读 PLC 异常: {exc}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 67 行**

```text
        return 1
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 68 行**

```text
    finally:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`finally`＝执行收尾逻辑。
```

**源码第 69 行**

```text
        cli.close()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 71 行**

```text
    if regs[6] is None:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。
```

**源码第 72 行**

```text
        print("[FAIL] 产线状态点(word 6)读不到,无法判定状态")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 73 行**

```text
        return 1
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 75 行**

```text
    joints = [to_signed(regs[i]) / 10 for i in range(6)]
# 注释：给 `joints` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 76 行**

```text
    state_raw = regs[6]
# 注释：给 `state_raw` 赋值。
```

**源码第 77 行**

```text
    state = STATE_MAP.get(state_raw, f"unknown({state_raw})")
# 注释：给 `state` 赋值。
```

**源码第 79 行**

```text
    print(f"[OK] PLC {args.host}:{args.port} unit={args.unit}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 80 行**

```text
    print(f"  产线状态 word6 = {state_raw} -> {state}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 81 行**

```text
    print(f"  关节角 word0..5 = {joints}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 82 行**

```text
    io = {IO_NAMES[i]: regs[11 + i] for i in range(6)}
# 注释：给 `io` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 83 行**

```text
    for k, v in io.items():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 84 行**

```text
        extra = IO_DESC.get(k, {}).get(v, "")
# 注释：给 `extra` 赋值。
```

**源码第 85 行**

```text
        print(f"  IO {k:<14} = {v} {extra}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 86 行**

```text
    print(f"  写点 word7..10 (stop/mode/start/conveyor) = {regs[7:11]}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 88 行**

```text
    if state_raw == 101:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 89 行**

```text
        print("  → 产线处于 stopped,可执行控制指令验证步骤 2(获取手动模式)")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 90 行**

```text
    elif state_raw == 102:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 91 行**

```text
        print("  → 产线处于 manual_mode,可执行传送带/启动验证")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 92 行**

```text
    return 0
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 95 行**

```text
if __name__ == "__main__":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 96 行**

```text
    sys.exit(main())
# 注释：调用函数或对象方法并传入参数。
```
