"""plc_collector 解码单元测试(不连 PLC,纯本地验证)

跑法:  cd edge && python _test_decode.py
       或:  PLC_WORD_ORDER=LITTLE python _test_decode.py   # 测西门子 DINT 场景

设计:从 register-mapping.csv 读点位,按点位类型喂入精心构造的寄存器值,
     断言 decode_signal 输出 = plc_val × scale + offset(还原成物理量)。

点位表依据:DB3-Modbus-映射表.xls(2026-10-15)—— 现场 11 word 表
  word 0..5  六轴关节角(INT ×10,÷10 → deg)
  word 6     产线状态(UINT,10 值枚举)
  word 7..10 控制写入点(脉冲/电平,不在主循环读取,单独在 _test_cmd.py 覆盖)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import plc_collector
from plc_collector import _read_csv, decode_signal, STATE_MAP

MAPPING = Path(__file__).with_name("register-mapping.csv")


# 模拟 PLC 寄存器快照(单位:PLC 端实际存储的值,已含 ×10 等缩放因子)
# 只列主循环读取点位(word 0..6);cmd.* 由 _test_cmd.py 覆盖
SIM = {
    # 六轴关节角 deg(PLC ×10 存储,INT16 带符号;正/负/零各覆盖)
    "robot.joints[0]":  450,   # →  45.0°
    "robot.joints[1]":  -350,  # → -35.0°(负数 INT16)
    "robot.joints[2]":  421,   # →  42.1°
    "robot.joints[3]":  0,     # →   0.0°(零值,验证不被 `or` 兜底吞掉)
    "robot.joints[4]":  880,   # →  88.0°
    "robot.joints[5]":  -90,   # →  -9.0°
    # 产线状态(UINT,覆盖全部 10 个枚举 + 边界)
    "line.state":       2,     # → assembling
}

# state 枚举覆盖表:PLC 整数 → 期望契约字符串
STATE_CASES = {
    0:   "waiting_feed",
    1:   "feeding",
    2:   "assembling",
    3:   "unloading",
    4:   "unload_done",
    5:   "waiting_next",
    100: "init_error",
    101: "stopped",
    102: "manual_mode",
}


STATE_FAILURES: list = []
CMD_FAILURES: list = []


def build_regs(value: int, count: int) -> list[int]:
    """把"实际 PLC 值"拆成 Modbus 寄存器 word。"""
    if count == 1:
        return [value & 0xFFFF]
    if count == 2:
        u32 = value & 0xFFFFFFFF
        hi, lo = (u32 >> 16) & 0xFFFF, u32 & 0xFFFF
        return [lo, hi] if plc_collector.PLC_WORD_ORDER == "LITTLE" else [hi, lo]
    raise ValueError(f"count={count} not supported in test")


def test_decode(failures: list) -> None:
    # _read_csv() 只返回主循环读取点位(cmd.* 在模块加载时进 _cmd_signals)
    read_sigs = _read_csv(MAPPING)
    cmd_sigs = plc_collector._cmd_signals
    print(f"loaded {len(read_sigs)} read signals "
          f"+ {len(cmd_sigs)} write signals "
          f"PLC_WORD_ORDER={plc_collector.PLC_WORD_ORDER}\n")

    for sig in read_sigs:
        if sig.name not in SIM:
            failures.append((sig.name, "SIM 缺样本值", "-", "-"))
            print(f"  [FAIL] {sig.name:<22} SIM 表里没有样本值")
            continue
        plc_val = SIM[sig.name]
        regs = build_regs(plc_val, sig.count)
        got = decode_signal(regs, sig)
        expected = plc_val * sig.scale + sig.offset
        ok = abs(got - expected) < 1e-6
        print(f"  [{'OK  ' if ok else 'FAIL'}] {sig.name:<22} "
              f"type={sig.type:<7} regs={regs} -> {got}")
        if not ok:
            failures.append((sig.name, expected, got, regs))


def test_state_map() -> None:
    print("\nstate 枚举覆盖(PLC 整数 → 契约字符串):")
    for plc_int, want in sorted(STATE_CASES.items()):
        got = STATE_MAP.get(plc_int, "offline")
        ok = got == want
        print(f"  [{'OK  ' if ok else 'FAIL'}] {plc_int:>4} -> {got:<14} (期望 {want})")
        if not ok:
            STATE_FAILURES.append((plc_int, want, got))


def test_cmd_points() -> None:
    print("\n控制点位(写命令,不在主循环读取):")
    # cmd.* 由 plc_collector 在模块加载时单独解析进 _cmd_signals,
    # _read_csv() 返回的列表只含主循环读取点位,所以这里查 _cmd_signals。
    expect = {
        "cmd.stop": 7,
        "cmd.modeToggle": 8,
        "cmd.start": 9,
        "cmd.conveyor": 10,
    }
    for name, want_addr in expect.items():
        s = plc_collector._cmd_signals.get(name)
        if s is None:
            print(f"  [FAIL] {name:<22} CSV 里缺失")
            CMD_FAILURES.append((name, want_addr, "缺失"))
            continue
        ok = s.address == want_addr and s.type == "UINT"
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<22} addr={s.address:<4} "
              f"type={s.type:<6} (期望 addr={want_addr}, UINT)")
        if not ok:
            CMD_FAILURES.append((name, want_addr, f"{s.address}/{s.type}"))


def main() -> int:
    failures: list = []
    test_decode(failures)
    test_state_map()
    test_cmd_points()

    all_fail = failures + STATE_FAILURES + CMD_FAILURES
    print()
    if all_fail:
        print(f"!!! {len(all_fail)} failures:")
        for name, exp, got, *rest in all_fail:
            print(f"  {name}: expected {exp}, got {got}")
        return 1
    print("=== ALL PASSED ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
