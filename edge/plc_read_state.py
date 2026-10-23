"""只读状态探针:读一次 PLC,打印产线状态 / IO / 关节角。

用途:工控机上做验收(状态是不是 stopped?IO 是否对得上?),不写任何寄存器。
本文件**只调用 read_holding_registers**,不存在任何写调用。

用法:
    python edge/plc_read_state.py
    python edge/plc_read_state.py --host 192.168.10.31 --port 503 --unit 2
退出码:0=读成功;1=读失败
"""
import argparse
import os
import sys

from pymodbus.client import ModbusTcpClient

# 与 plc_collector.py 保持一致(契约 v1.1 §3.8 / db/init/004_line_state_stages.sql)
STATE_MAP = {
    0: "waiting_feed",   # 等待入料
    1: "feeding",        # 入料中
    2: "assembling",     # 装配中
    3: "unloading",      # 下料中
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
    ap = argparse.ArgumentParser(description="只读读一次 PLC 状态")
    ap.add_argument("--host", default=os.getenv("PLC_HOST", "192.168.10.31"))
    ap.add_argument("--port", type=int, default=int(os.getenv("PLC_PORT", "503")))
    ap.add_argument("--unit", type=int, default=int(os.getenv("PLC_UNIT_ID", "2")))
    args = ap.parse_args()

    cli = ModbusTcpClient(host=args.host, port=args.port, timeout=3)
    if not cli.connect():
        print(f"[FAIL] 连不上 PLC {args.host}:{args.port} —— 检查网线/路由/PLC 是否上电")
        return 1
    try:
        # 逐点读(与 plc_collector.read_all 同策略:一次读一段,失败不影响其它点)
        regs = []
        for addr in range(17):
            try:
                rr = cli.read_holding_registers(address=addr, count=1, device_id=args.unit)
            except Exception as exc:
                regs.append(None)
                print(f"  word {addr:2d} 读取异常: {exc}")
                continue
            if rr.isError():
                regs.append(None)
                print(f"  word {addr:2d} 读失败: {rr}")
                continue
            regs.append(rr.registers[0])
    except Exception as exc:
        print(f"[FAIL] 读 PLC 异常: {exc}")
        return 1
    finally:
        cli.close()

    if regs[6] is None:
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
        extra = IO_DESC.get(k, {}).get(v, "")
        print(f"  IO {k:<14} = {v} {extra}")
    print(f"  写点 word7..10 (stop/mode/start/conveyor) = {regs[7:11]}")

    if state_raw == 101:
        print("  → 产线处于 stopped,可执行控制指令验证步骤 2(获取手动模式)")
    elif state_raw == 102:
        print("  → 产线处于 manual_mode,可执行传送带/启动验证")
    return 0


if __name__ == "__main__":
    sys.exit(main())
