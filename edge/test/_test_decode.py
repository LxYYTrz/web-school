"""plc_collector 解码单元测试(不连 PLC,纯本地验证)

跑法:  cd edge && python test/_test_decode.py
       或:  PLC_WORD_ORDER=LITTLE python test/_test_decode.py   # 测西门子 DINT 场景

设计:从 register-mapping.csv 读点位,按点位类型喂入精心构造的寄存器值,
     断言 decode_signal 输出 = plc_val × scale + offset(还原成物理量)。

点位表依据:DB3-Modbus-映射表.xls(2026-10-16)—— 现场 17 word 表
  word 0..5  六轴关节角(INT ×10,÷10 → deg)
  word 6     产线状态(UINT,10 值枚举)
  word 11..16 产线 IO 只读点(UINT)
  word 7..10 控制写入点(不在主循环读取,单独在 _test_cmd.py 覆盖)
"""

# 点表解码的离线验证，属于辅助测试或排查文件，不是正式采集入口。
# 先核对本文件参数与 main/顶层流程，再看它调用的客户端或 plc_collector 辅助函数；输出仅说明该检查的观察结果。

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# 将本行提供的值插入列表或搜索路径的指定位置。

import plc_collector
from plc_collector import _read_csv, decode_signal, STATE_MAP

MAPPING = Path(__file__).resolve().parent.parent / "register-mapping.csv"


# 模拟 PLC 寄存器快照(单位:PLC 端实际存储的值,已含 ×10 等缩放因子)
# 只列主循环读取点位(word 0..6 与 11..16);cmd.* 由 _test_cmd.py 覆盖
SIM = {
    # 六轴关节角 deg(PLC ×10 存储,INT16 带符号;正/负/零各覆盖)
    "robot.joints[0]":  450,   # →  45.0°
    # robot.joints[0] 是模拟机器人对应关节的 PLC 原始读数；450 是该测试场景给定的寄存器值
    "robot.joints[1]":  -350,  # → -35.0°(负数 INT16)
    # robot.joints[1] 是模拟机器人对应关节的 PLC 原始读数；-350 是该测试场景给定的寄存器值
    "robot.joints[2]":  421,   # →  42.1°
    # robot.joints[2] 是模拟机器人对应关节的 PLC 原始读数；421 是该测试场景给定的寄存器值
    "robot.joints[3]":  0,     # →   0.0°(零值,验证不被 `or` 兜底吞掉)
    # robot.joints[3] 是模拟机器人对应关节的 PLC 原始读数；0 是该测试场景给定的寄存器值
    "robot.joints[4]":  880,   # →  88.0°
    # robot.joints[4] 是模拟机器人对应关节的 PLC 原始读数；880 是该测试场景给定的寄存器值
    "robot.joints[5]":  -90,   # →  -9.0°
    # robot.joints[5] 是模拟机器人对应关节的 PLC 原始读数；-90 是该测试场景给定的寄存器值
    # 产线状态(UINT,覆盖全部 10 个枚举 + 边界)
    "line.state":       2,     # → assembling
    # 产线 IO 只读点(UINT;覆盖 0 / 1 / 枚举上界)
    "io.sensorIn":      1,     # 1=有料
    # io.sensorIn 是模拟 IO 点位的寄存器键；1 是该点位在当前测试中的原始值
    "io.sensorArrive":  0,     # 0=无料(0 是合法值,验证不被 `or` 兜底吞成 None)
    # io.sensorArrive 是模拟 IO 点位的寄存器键；0 是该点位在当前测试中的原始值
    "io.sensorRetreat": 1,     # 1=有料
    # io.sensorRetreat 是模拟 IO 点位的寄存器键；1 是该点位在当前测试中的原始值
    "io.lightColor":    2,     # 2=红灯
    # io.lightColor 是模拟 IO 点位的寄存器键；2 是该点位在当前测试中的原始值
    "io.trayUp":        1,     # 1=上升
    # io.trayUp 是模拟 IO 点位的寄存器键；1 是该点位在当前测试中的原始值
    "io.blockUp":       0,     # 0=下降
    # io.blockUp 是模拟 IO 点位的寄存器键；0 是该点位在当前测试中的原始值
}

# state 枚举覆盖表:PLC 整数 → 期望契约字符串
STATE_CASES = {
    0:   "waiting_feed",
    # state 枚举覆盖表:PLC 整数 → 期望契约字符串。
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
    # 检查count == 1:，按判断结果进入对应的处理分支。
        return [value & 0xFFFF]
    if count == 2:
    # 检查count == 2:，按判断结果进入对应的处理分支。
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
    # 循环处理sig in read_sigs:，按判断结果进入对应的处理分支。
        if sig.name not in SIM:
        # 检查sig.name not in SIM:，按判断结果进入对应的处理分支。
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
        # 检查not ok:，按判断结果进入对应的处理分支。
            failures.append((sig.name, expected, got, regs))


def test_state_map() -> None:
    print("\nstate 枚举覆盖(PLC 整数 → 契约字符串):")
    for plc_int, want in sorted(STATE_CASES.items()):
    # 循环处理plc_int, want in sorted(STATE_CASES.items()):，按判断结果进入对应的处理分支。
        got = STATE_MAP.get(plc_int, "offline")
        ok = got == want
        print(f"  [{'OK  ' if ok else 'FAIL'}] {plc_int:>4} -> {got:<14} (期望 {want})")
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
            STATE_FAILURES.append((plc_int, want, got))


def test_cmd_points() -> None:
    print("\n控制点位(写命令,不在主循环读取):")
    # cmd.* 由 plc_collector 在模块加载时单独解析进 _cmd_signals,
    # _read_csv() 返回的列表只含主循环读取点位,所以这里查 _cmd_signals。
    expect = {
        "cmd.stop": 7,
        # cmd.stop 是可写控制点位的映射键；7 是它对应的寄存器地址
        "cmd.modeToggle": 8,
        # cmd.modeToggle 是可写控制点位的映射键；8 是它对应的寄存器地址
        "cmd.start": 9,
        # cmd.start 是可写控制点位的映射键；9 是它对应的寄存器地址
        "cmd.conveyor": 10,
        # cmd.conveyor 是可写控制点位的映射键；10 是它对应的寄存器地址
    }
    for name, want_addr in expect.items():
    # 循环处理name, want_addr in expect.items():，按判断结果进入对应的处理分支。
        s = plc_collector._cmd_signals.get(name)
        if s is None:
        # 检查s is None:，按判断结果进入对应的处理分支。
            print(f"  [FAIL] {name:<22} CSV 里缺失")
            CMD_FAILURES.append((name, want_addr, "缺失"))
            continue
        ok = s.address == want_addr and s.type == "UINT"
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<22} addr={s.address:<4} "
              f"type={s.type:<6} (期望 addr={want_addr}, UINT)")
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
            CMD_FAILURES.append((name, want_addr, f"{s.address}/{s.type}"))


def test_io_points() -> None:
    """io.* 点位的地址与类型:地址写错 = 读到别的寄存器,线上不会报错但值是错的。"""
    print("\n产线 IO 只读点位(写 io_state 报文):")
    expect = {
        "io.sensorIn":      11,
        # io.sensorIn 是模拟 IO 点位的寄存器键；11 是该点位在当前测试中的原始值
        "io.sensorArrive":  12,
        # io.sensorArrive 是模拟 IO 点位的寄存器键；12 是该点位在当前测试中的原始值
        "io.sensorRetreat": 13,
        # io.sensorRetreat 是模拟 IO 点位的寄存器键；13 是该点位在当前测试中的原始值
        "io.lightColor":    14,
        # io.lightColor 是模拟 IO 点位的寄存器键；14 是该点位在当前测试中的原始值
        "io.trayUp":        15,
        # io.trayUp 是模拟 IO 点位的寄存器键；15 是该点位在当前测试中的原始值
        "io.blockUp":       16,
        # io.blockUp 是模拟 IO 点位的寄存器键；16 是该点位在当前测试中的原始值
    }
    read_sigs = {s.name: s for s in _read_csv(MAPPING)}
    for name, want_addr in expect.items():
    # 循环处理name, want_addr in expect.items():，按判断结果进入对应的处理分支。
        s = read_sigs.get(name)
        if s is None:
        # 检查s is None:，按判断结果进入对应的处理分支。
            print(f"  [FAIL] {name:<20} CSV 里缺失")
            IO_FAILURES.append((name, want_addr, "缺失"))
            continue
        ok = s.address == want_addr and s.type == "UINT" and s.scale == 1.0
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<20} addr={s.address:<4} "
              f"type={s.type:<6} scale={s.scale} (期望 addr={want_addr}, UINT, ×1)")
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
            IO_FAILURES.append((name, want_addr, f"{s.address}/{s.type}/{s.scale}"))


def test_io_payload() -> None:
    """io_payload:只透传 io.* 点位;读失败的点保留 None 而不是被 0 兜底。"""
    print("\nio_payload 组装(契约 §3.8):")
    signals = [s for s in _read_csv(MAPPING)]
    values = {s.name: 1 for s in signals}
    for s in signals:
    # 循环处理s in signals:，按判断结果进入对应的处理分支。
        if s.name == "io.sensorArrive":
        # 检查s.name == "io.sensorArrive":，按判断结果进入对应的处理分支。
            values[s.name] = None          # 模拟该点读失败
    msg = plc_collector.io_payload(signals, values)
    if msg is None:
    # 检查msg is None:，按判断结果进入对应的处理分支。
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
    # 检查not ok_keys:，按判断结果进入对应的处理分支。
        IO_FAILURES.append(("io_payload keys", sorted(want), sorted(keys)))
    if not ok_none:
    # 检查not ok_none:，按判断结果进入对应的处理分支。
        IO_FAILURES.append(("io_payload None", None, msg["io"].get("sensorArrive")))

    # 一个 io.* 都没配时应返回 None,而不是发空报文
    if plc_collector.io_payload([], {}) is not None:
    # 检查plc_collector.io_payload([], {}) is not None:，按判断结果进入对应的处理分支。
        IO_FAILURES.append(("io_payload 空点位表", None, "应返回 None"))


def expect_io_names() -> list[str]:
    return ["io.sensorIn", "io.sensorArrive", "io.sensorRetreat",
            "io.lightColor", "io.trayUp", "io.blockUp"]


def main() -> int:
# 定义 main，用于运行寄存器解码、状态映射和 IO 点位契约检查。
    failures: list = []
    test_decode(failures)
    # 检查各配置点位的寄存器解码结果是否符合预期。
    test_state_map()
    # 核对 PLC 数字状态码到契约状态名的映射。
    test_cmd_points()
    # 核对四个现场控制点的地址和类型。
    test_io_points()
    # 核对六个只读 IO 点位的名称、地址和缩放配置。
    test_io_payload()
    # 检查 IO 报文组装时的字段和读失败空值处理。

    all_fail = failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES
    print()
    if all_fail:
    # 检查all_fail:，按判断结果进入对应的处理分支。
        print(f"!!! {len(all_fail)} failures:")
        for name, exp, got, *rest in all_fail:
        # 循环处理name, exp, got, *rest in all_fail:，按判断结果进入对应的处理分支。
            print(f"  {name}: expected {exp}, got {got}")
        return 1
    print("=== ALL PASSED ===")
    return 0


if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
    sys.exit(main())
