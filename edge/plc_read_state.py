"""只读状态探针:读一次 PLC,打印产线状态 / IO / 关节角。

用途:工控机上做验收(状态是不是 stopped?IO 是否对得上?),不写任何寄存器。
本文件**只调用 read_holding_registers**,不存在任何写调用。

用法:
    python edge/plc_read_state.py
    python edge/plc_read_state.py --host 192.168.10.31 --port 503 --unit 2
退出码:0=读成功;1=读失败
"""
import argparse
# 从 Python 环境 导入 argparse，供后续代码使用。 关键字：import＝导入模块或符号。
import os
# 从 Python 环境 导入 os，供后续代码使用。 关键字：import＝导入模块或符号。
import sys
# 从 Python 环境 导入 sys，供后续代码使用。 关键字：import＝导入模块或符号。

from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

# 与 plc_collector.py 保持一致(契约 v1.1 §3.8 / db/init/004+005_line_state_stages.sql)
STATE_MAP = {
# 给 STATE_MAP 赋值。
    0: "waiting_feed",   # 等待入料
    # 设置字段 0，值为 "waiting_feed",   # 等待入料。
    1: "feeding",        # 入料中
    # 设置字段 1，值为 "feeding",        # 入料中。
    2: "assembling",     # 装配中
    # 设置字段 2，值为 "assembling",     # 装配中。
    3: "waiting_robot",  # 等待机器人完成
    # 设置字段 3，值为 "waiting_robot",  # 等待机器人完成。
    4: "unload_done",    # 下料完成
    # 设置字段 4，值为 "unload_done",    # 下料完成。
    5: "waiting_next",   # 等待后站入料
    # 设置字段 5，值为 "waiting_next",   # 等待后站入料。
    100: "init_error",   # 初始化错误状态
    # 设置字段 100，值为 "init_error",   # 初始化错误状态。
    101: "stopped",      # 停止状态
    # 设置字段 101，值为 "stopped",      # 停止状态。
    102: "manual_mode",  # 手动控制模式
    # 设置字段 102，值为 "manual_mode",  # 手动控制模式。
}
# 结束当前对象、函数或条件代码块。
IO_NAMES = ["sensorIn", "sensorArrive", "sensorRetreat", "lightColor", "trayUp", "blockUp"]
# 给 IO_NAMES 赋值。
IO_DESC = {
# 给 IO_DESC 赋值。
    "lightColor": {0: "绿灯", 1: "黄灯", 2: "红灯"},
    # 设置字段 lightColor，值为 {0: "绿灯", 1: "黄灯", 2: "红灯"}。
}
# 结束当前对象、函数或条件代码块。


def to_signed(u16: int) -> int:
# 定义函数 to_signed。 关键字：def＝定义 Python 函数。
    return u16 if u16 < 0x8000 else u16 - 0x10000
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；if＝按条件分支；else＝进入另一条件分支。


def main() -> int:
# 定义函数 main。 关键字：def＝定义 Python 函数。
    ap = argparse.ArgumentParser(description="只读读一次 PLC 状态")
    # 给 ap 赋值。
    ap.add_argument("--host", default=os.getenv("PLC_HOST", "192.168.10.31"))
    # 调用函数或对象方法并传入参数。
    ap.add_argument("--port", type=int, default=int(os.getenv("PLC_PORT", "503")))
    # 调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
    ap.add_argument("--unit", type=int, default=int(os.getenv("PLC_UNIT_ID", "2")))
    # 调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。
    args = ap.parse_args()
    # 给 args 赋值。

    cli = ModbusTcpClient(host=args.host, port=args.port, timeout=3)
    # 给 cli 赋值。
    if not cli.connect():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        print(f"[FAIL] 连不上 PLC {args.host}:{args.port} —— 检查网线/路由/PLC 是否上电")
        # 调用函数或对象方法并传入参数。
        return 1
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        # 逐点读(与 plc_collector.read_all 同策略:一次读一段,失败不影响其它点)
        regs = []
        # 给 regs 赋值。
        for addr in range(17):
        # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
            try:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
                rr = cli.read_holding_registers(address=addr, count=1, device_id=args.unit)
                # 给 rr 赋值。
            except Exception as exc:
            # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
                regs.append(None)
                # 调用函数或对象方法并传入参数。 关键字：None＝空值。
                print(f"  word {addr:2d} 读取异常: {exc}")
                # 调用函数或对象方法并传入参数。
                continue
                # 跳过本轮剩余语句，进入下一次循环。
            if rr.isError():
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                regs.append(None)
                # 调用函数或对象方法并传入参数。 关键字：None＝空值。
                print(f"  word {addr:2d} 读失败: {rr}")
                # 调用函数或对象方法并传入参数。
                continue
                # 跳过本轮剩余语句，进入下一次循环。
            regs.append(rr.registers[0])
            # 调用函数或对象方法并传入参数。
    except Exception as exc:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
        print(f"[FAIL] 读 PLC 异常: {exc}")
        # 调用函数或对象方法并传入参数。
        return 1
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    finally:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：finally＝执行收尾逻辑。
        cli.close()
        # 调用函数或对象方法并传入参数。

    if regs[6] is None:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
        print("[FAIL] 产线状态点(word 6)读不到,无法判定状态")
        # 调用函数或对象方法并传入参数。
        return 1
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。

    joints = [to_signed(regs[i]) / 10 for i in range(6)]
    # 给 joints 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    state_raw = regs[6]
    # 给 state_raw 赋值。
    state = STATE_MAP.get(state_raw, f"unknown({state_raw})")
    # 给 state 赋值。

    print(f"[OK] PLC {args.host}:{args.port} unit={args.unit}")
    # 调用函数或对象方法并传入参数。
    print(f"  产线状态 word6 = {state_raw} -> {state}")
    # 调用函数或对象方法并传入参数。
    print(f"  关节角 word0..5 = {joints}")
    # 调用函数或对象方法并传入参数。
    io = {IO_NAMES[i]: regs[11 + i] for i in range(6)}
    # 给 io 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    for k, v in io.items():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        extra = IO_DESC.get(k, {}).get(v, "")
        # 给 extra 赋值。
        print(f"  IO {k:<14} = {v} {extra}")
        # 调用函数或对象方法并传入参数。
    print(f"  写点 word7..10 (stop/mode/start/conveyor) = {regs[7:11]}")
    # 调用函数或对象方法并传入参数。

    if state_raw == 101:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        print("  → 产线处于 stopped,可执行控制指令验证步骤 2(获取手动模式)")
        # 调用函数或对象方法并传入参数。
    elif state_raw == 102:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
        print("  → 产线处于 manual_mode,可执行传送带/启动验证")
        # 调用函数或对象方法并传入参数。
    return 0
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


if __name__ == "__main__":
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    sys.exit(main())
    # 调用函数或对象方法并传入参数。
