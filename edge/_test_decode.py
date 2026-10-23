"""plc_collector 解码单元测试(不连 PLC,纯本地验证)

跑法:  cd edge && python _test_decode.py
       或:  PLC_WORD_ORDER=LITTLE python _test_decode.py   # 测西门子 DINT 场景

设计:从 register-mapping.csv 读点位,按点位类型喂入精心构造的寄存器值,
     断言 decode_signal 输出 = plc_val × scale + offset(还原成物理量)。

点位表依据:DB3-Modbus-映射表.xls(2026-10-16)—— 现场 17 word 表
  word 0..5  六轴关节角(INT ×10,÷10 → deg)
  word 6     产线状态(UINT,10 值枚举)
  word 11..16 产线 IO 只读点(UINT)
  word 7..10 控制写入点(不在主循环读取,单独在 _test_cmd.py 覆盖)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import plc_collector
from plc_collector import _read_csv, decode_signal, STATE_MAP

MAPPING = Path(__file__).with_name("register-mapping.csv")


# 模拟 PLC 寄存器快照(单位:PLC 端实际存储的值,已含 ×10 等缩放因子)
# 只列主循环读取点位(word 0..6 与 11..16);cmd.* 由 _test_cmd.py 覆盖
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
    # 产线 IO 只读点(UINT;覆盖 0 / 1 / 枚举上界)
    "io.sensorIn":      1,     # 1=有料
    "io.sensorArrive":  0,     # 0=无料(0 是合法值,验证不被 `or` 兜底吞成 None)
    "io.sensorRetreat": 1,     # 1=有料
    "io.lightColor":    2,     # 2=红灯
    "io.trayUp":        1,     # 1=上升
    "io.blockUp":       0,     # 0=下降
}

# state 枚举覆盖表:PLC 整数 → 期望契约字符串
STATE_CASES = {
    0:   "waiting_feed",
    1:   "feeding",
    2:   "assembling",
    3:   "waiting_robot",
    4:   "unload_done",
    5:   "waiting_next",
    100: "init_error",
    101: "stopped",
    102: "manual_mode",
}


STATE_FAILURES: list = []
CMD_FAILURES: list = []
IO_FAILURES: list = []


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


def test_io_points() -> None:
    """io.* 点位的地址与类型:地址写错 = 读到别的寄存器,线上不会报错但值是错的。"""
    print("\n产线 IO 只读点位(写 io_state 报文):")
    expect = {
        "io.sensorIn":      11,
        "io.sensorArrive":  12,
        "io.sensorRetreat": 13,
        "io.lightColor":    14,
        "io.trayUp":        15,
        "io.blockUp":       16,
    }
    read_sigs = {s.name: s for s in _read_csv(MAPPING)}
    for name, want_addr in expect.items():
        s = read_sigs.get(name)
        if s is None:
            print(f"  [FAIL] {name:<20} CSV 里缺失")
            IO_FAILURES.append((name, want_addr, "缺失"))
            continue
        ok = s.address == want_addr and s.type == "UINT" and s.scale == 1.0
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<20} addr={s.address:<4} "
              f"type={s.type:<6} scale={s.scale} (期望 addr={want_addr}, UINT, ×1)")
        if not ok:
            IO_FAILURES.append((name, want_addr, f"{s.address}/{s.type}/{s.scale}"))


def test_io_payload() -> None:
    """io_payload:只透传 io.* 点位;读失败的点保留 None 而不是被 0 兜底。"""
    print("\nio_payload 组装(契约 §3.8):")
    signals = [s for s in _read_csv(MAPPING)]
    values = {s.name: 1 for s in signals}
    for s in signals:
        if s.name == "io.sensorArrive":
            values[s.name] = None          # 模拟该点读失败
    msg = plc_collector.io_payload(signals, values)
    if msg is None:
        IO_FAILURES.append(("io_payload", "dict", "None"))
        print("  [FAIL] 返回 None")
        return
    keys = set(msg["io"])
    want = {n.split(".", 1)[1] for n in expect_io_names()}
    ok_keys = keys == want
    ok_none = msg["io"].get("sensorArrive", "missing") is None
    print(f"  [{'OK  ' if ok_keys else 'FAIL'}] 字段集合 = {sorted(keys)}")
    print(f"  [{'OK  ' if ok_none else 'FAIL'}] 读失败的点保留 None(不兜底成 0): "
          f"sensorArrive={msg['io'].get('sensorArrive')!r}")
    if not ok_keys:
        IO_FAILURES.append(("io_payload keys", sorted(want), sorted(keys)))
    if not ok_none:
        IO_FAILURES.append(("io_payload None", None, msg["io"].get("sensorArrive")))

    # 一个 io.* 都没配时应返回 None,而不是发空报文
    if plc_collector.io_payload([], {}) is not None:
        IO_FAILURES.append(("io_payload 空点位表", None, "应返回 None"))


def expect_io_names() -> list[str]:
    return ["io.sensorIn", "io.sensorArrive", "io.sensorRetreat",
            "io.lightColor", "io.trayUp", "io.blockUp"]


def main() -> int:
    failures: list = []
    test_decode(failures)
    test_state_map()
    test_cmd_points()
    test_io_points()
    test_io_payload()

    all_fail = failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES
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
