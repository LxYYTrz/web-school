"""plc_collector 解码单元测试(不连 PLC,纯本地验证)

跑法:  cd edge && python _test_decode.py
       或:  PLC_WORD_ORDER=LITTLE python _test_decode.py   # 测西门子 DINT 场景

设计:从 register-mapping.csv 读 21 个点位,按点位类型喂入精心构造的寄存器值,
     断言 decode_signal 输出能对得上契约字段(关节角°、TCP mm、节拍 ms、计数 pcs...)。
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, r"C:\Users\25837\AppData\Roaming\Python\Python312\site-packages")
sys.path.insert(0, str(Path(__file__).parent))

import plc_collector
from plc_collector import _read_csv, decode_signal

MAPPING = Path(__file__).with_name("register-mapping.csv")


# 模拟 PLC 寄存器快照(单位:PLC 端实际存储的值,已含 ×10 等缩放因子)
# 设计原则:每种类型至少覆盖一次(正/负/零/边界)
SIM = {
    # 关节角 deg(PLC ×10 存储,INT16,带符号)
    "robot.joints[0]":  450,    # → 45.0°
    "robot.joints[1]":  -350,   # → -35.0°(负数 INT16)
    "robot.joints[2]":  421,    # → 42.1°
    "robot.joints[3]":  5,      # → 0.5°
    "robot.joints[4]":  880,    # → 88.0°
    "robot.joints[5]":  123,    # → 12.3°
    # 运行状态(UINT16)
    "robot.speedPct":   80,
    "robot.mode":       2,      # remote
    "robot.alarmCode":  0,      # 无报警
    "robot.program":    100,
    # 产线状态
    "line.state":       2,      # running
    "line.beatMs":      8500,   # PLC×10 → ÷10 = 850.0 ms(8.5 秒节拍)
    "line.productCode": 1001,
    # TCP 位姿(INT16 ×10)
    "robot.tcp[0]":     5123,   # 512.3 mm
    "robot.tcp[1]":     -1205,  # -120.5 mm
    "robot.tcp[2]":     3880,   # 388.0 mm
    "robot.tcp[3]":     1799,   # 179.9°
    "robot.tcp[4]":     2,      # 0.2°
    "robot.tcp[5]":     450,    # 45.0°
    # 计数(DINT/INT32,2 word,无缩放)
    "line.goodCount":   1024,   # pcs
    "line.ngCount":     3,      # pcs
}


def build_regs(value: int, count: int) -> list[int]:
    """把"实际 PLC 值"拆成 Modbus 寄存器 word。
    count=1:处理 INT16 负数(取低 16 位二进制补码)。
    count=2:按当前 PLC_WORD_ORDER 把 32 位拆成 2 个 word。
    """
    if count == 1:
        return [value & 0xFFFF]
    if count == 2:
        u32 = value & 0xFFFFFFFF
        hi = (u32 >> 16) & 0xFFFF
        lo = u32 & 0xFFFF
        if plc_collector.PLC_WORD_ORDER == "LITTLE":
            return [lo, hi]
        return [hi, lo]
    raise ValueError(f"count={count} not supported in test")


def main() -> int:
    sigs = _read_csv(MAPPING)
    print(f"loaded {len(sigs)} signals  PLC_WORD_ORDER={plc_collector.PLC_WORD_ORDER}")

    failures = []
    for sig in sigs:
        plc_val = SIM[sig.name]
        regs = build_regs(plc_val, sig.count)
        got = decode_signal(regs, sig)
        # decode_signal 输出 = plc_val × scale + offset(已还原成物理量)
        expected = plc_val * sig.scale + sig.offset
        # 浮点比较允许 1e-6 误差(Python IEEE 754 累加误差)
        if isinstance(got, float) or isinstance(expected, float):
            ok = abs(got - expected) < 1e-6
        else:
            ok = got == expected
        mark = "OK  " if ok else "FAIL"
        print(f"  [{mark}] {sig.name:<22} type={sig.type:<7} regs={regs} -> {got}")
        if not ok:
            failures.append((sig.name, expected, got, regs))

    print()
    if failures:
        print(f"!!! {len(failures)} failures:")
        for name, exp, got, regs in failures:
            print(f"  {name}: expected {exp}, got {got} (regs={regs})")
        return 1
    print("=== ALL PASSED ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
