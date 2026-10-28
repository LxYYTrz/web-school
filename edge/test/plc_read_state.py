"""只读状态探针:读一次 PLC,打印产线状态 / IO / 关节角。

用途:工控机上做验收(状态是不是 stopped?IO 是否对得上?),不写任何寄存器。
本文件**只调用 read_holding_registers**,不存在任何写调用。

用法:
    python edge/test/plc_read_state.py
    python edge/test/plc_read_state.py --host 192.168.10.31 --port 503 --unit 2
退出码:0=读成功;1=读失败
"""

# 工序状态寄存器读取探针，属于辅助测试或排查文件，不是正式采集入口。
# 先核对本文件参数与 main/顶层流程，再看它调用的客户端或 plc_collector 辅助函数；输出仅说明该检查的观察结果。

import argparse
import os
import sys

from pymodbus.client import ModbusTcpClient

# 与 plc_collector.py 保持一致(契约 v1.1 §3.8 / db/init/004+005_line_state_stages.sql)
STATE_MAP = {
    0: "waiting_feed",   # 等待入料
    # 与 plc_collector.py 保持一致(契约 v1.1 §3.8 / db/init/004+005_line_state_stages.sql)。
    1: "feeding",        # 入料中
    2: "assembling",     # 装配中
    3: "waiting_robot",  # 等待机器人完成
    4: "unload_done",    # 下料完成
    5: "waiting_next",   # 等待后站入料
    100: "init_error",   # 初始化错误状态
    101: "stopped",      # 停止状态
    102: "manual_mode",  # 手动控制模式
}
IO_NAMES = ["sensorIn", "sensorArrive", "sensorRetreat", "lightColor", "trayUp", "blockUp"]
IO_DESC = {
    "lightColor": {0: "绿灯", 1: "黄灯", 2: "红灯"},
}


def to_signed(u16: int) -> int:
    return u16 if u16 < 0x8000 else u16 - 0x10000


def main() -> int:
# 定义 main，用于连接现场 PLC 并读取、显示原始状态寄存器。
    ap = argparse.ArgumentParser(description="只读读一次 PLC 状态")
    ap.add_argument("--host", default=os.getenv("PLC_HOST", "192.168.10.31"))
    # 给命令行解析器添加一项可接受的启动参数。
    ap.add_argument("--port", type=int, default=int(os.getenv("PLC_PORT", "503")))
    # 给命令行解析器添加一项可接受的启动参数。
    ap.add_argument("--unit", type=int, default=int(os.getenv("PLC_UNIT_ID", "2")))
    # 给命令行解析器添加一项可接受的启动参数。
    args = ap.parse_args()

    cli = ModbusTcpClient(host=args.host, port=args.port, timeout=3)
    if not cli.connect():
    # 检查not cli.connect():，按判断结果进入对应的处理分支。
        print(f"[FAIL] 连不上 PLC {args.host}:{args.port} —— 检查网线/路由/PLC 是否上电")
        return 1
    try:
        # 逐点读(与 plc_collector.read_all 同策略:一次读一段,失败不影响其它点)
        regs = []
        for addr in range(17):
        # 循环处理addr in range(17):，按判断结果进入对应的处理分支。
            try:
                rr = cli.read_holding_registers(address=addr, count=1, device_id=args.unit)
            except Exception as exc:
                regs.append(None)
                print(f"  word {addr:2d} 读取异常: {exc}")
                continue
            if rr.isError():
            # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
                regs.append(None)
                print(f"  word {addr:2d} 读失败: {rr}")
                continue
            regs.append(rr.registers[0])
    except Exception as exc:
        print(f"[FAIL] 读 PLC 异常: {exc}")
        return 1
    finally:
    # 执行无论上面操作成功还是失败都需要的清理步骤。
        cli.close()

    if regs[6] is None:
    # 检查regs[6] is None:，按判断结果进入对应的处理分支。
        print("[FAIL] 产线状态点(word 6)读不到,无法判定状态")
        return 1

    joints = [to_signed(regs[i]) / 10 for i in range(6)]
    state_raw = regs[6]
    state = STATE_MAP.get(state_raw, f"unknown({state_raw})")

    print(f"[OK] PLC {args.host}:{args.port} unit={args.unit}")
    print(f"  产线状态 word6 = {state_raw} -> {state}")
    print(f"  关节角 word0..5 = {joints}")
    io = {IO_NAMES[i]: regs[11 + i] for i in range(6)}
    for k, v in io.items():
    # 循环处理k, v in io.items():，按判断结果进入对应的处理分支。
        extra = IO_DESC.get(k, {}).get(v, "")
        print(f"  IO {k:<14} = {v} {extra}")
    print(f"  写点 word7..10 (stop/mode/start/conveyor) = {regs[7:11]}")

    if state_raw == 101:
    # 检查state_raw == 101:，按判断结果进入对应的处理分支。
        print("  → 产线处于 stopped,可执行控制指令验证步骤 2(获取手动模式)")
    elif state_raw == 102:
    # 检查state_raw == 102:，按判断结果进入对应的处理分支。
        print("  → 产线处于 manual_mode,可执行传送带/启动验证")
    return 0


if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
    sys.exit(main())
