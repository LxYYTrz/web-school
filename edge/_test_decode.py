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
# 从 Python 环境 导入 sys，供后续代码使用。 关键字：import＝导入模块或符号。
from pathlib import Path
# 从 pathlib 导入 Path，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

sys.path.insert(0, str(Path(__file__).parent))
# 调用函数或对象方法并传入参数。

import plc_collector
# 从 Python 环境 导入 plc_collector，供后续代码使用。 关键字：import＝导入模块或符号。
from plc_collector import _read_csv, decode_signal, STATE_MAP
# 从 plc_collector 导入 _read_csv, decode_signal, STATE_MAP，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

MAPPING = Path(__file__).with_name("register-mapping.csv")
# 给 MAPPING 赋值。


# 模拟 PLC 寄存器快照(单位:PLC 端实际存储的值,已含 ×10 等缩放因子)
# 只列主循环读取点位(word 0..6 与 11..16);cmd.* 由 _test_cmd.py 覆盖
SIM = {
# 给 SIM 赋值。
    # 六轴关节角 deg(PLC ×10 存储,INT16 带符号;正/负/零各覆盖)
    "robot.joints[0]":  450,   # →  45.0°
    # 设置字段 robot.joints[0]，值为 450,   # →  45.0°。
    "robot.joints[1]":  -350,  # → -35.0°(负数 INT16)
    # 设置字段 robot.joints[1]，值为 -350,  # → -35.0°(负数 INT16)。
    "robot.joints[2]":  421,   # →  42.1°
    # 设置字段 robot.joints[2]，值为 421,   # →  42.1°。
    "robot.joints[3]":  0,     # →   0.0°(零值,验证不被 `or` 兜底吞掉)
    # 设置字段 robot.joints[3]，值为 0,     # →   0.0°(零值,验证不被 or 兜底吞掉)。
    "robot.joints[4]":  880,   # →  88.0°
    # 设置字段 robot.joints[4]，值为 880,   # →  88.0°。
    "robot.joints[5]":  -90,   # →  -9.0°
    # 设置字段 robot.joints[5]，值为 -90,   # →  -9.0°。
    # 产线状态(UINT,覆盖全部 10 个枚举 + 边界)
    "line.state":       2,     # → assembling
    # 设置字段 line.state，值为 2,     # → assembling。
    # 产线 IO 只读点(UINT;覆盖 0 / 1 / 枚举上界)
    "io.sensorIn":      1,     # 1=有料
    # 设置字段 io.sensorIn，值为 1,     # 1=有料。
    "io.sensorArrive":  0,     # 0=无料(0 是合法值,验证不被 `or` 兜底吞成 None)
    # 设置字段 io.sensorArrive，值为 0,     # 0=无料(0 是合法值,验证不被 or 兜底吞成 None)。 关键字：None＝Python 空值。
    "io.sensorRetreat": 1,     # 1=有料
    # 设置字段 io.sensorRetreat，值为 1,     # 1=有料。
    "io.lightColor":    2,     # 2=红灯
    # 设置字段 io.lightColor，值为 2,     # 2=红灯。
    "io.trayUp":        1,     # 1=上升
    # 设置字段 io.trayUp，值为 1,     # 1=上升。
    "io.blockUp":       0,     # 0=下降
    # 设置字段 io.blockUp，值为 0,     # 0=下降。
}
# 结束当前对象、函数或条件代码块。

# state 枚举覆盖表:PLC 整数 → 期望契约字符串
STATE_CASES = {
# 给 STATE_CASES 赋值。
    0:   "waiting_feed",
    # 设置字段 0，值为 "waiting_feed"。
    1:   "feeding",
    # 设置字段 1，值为 "feeding"。
    2:   "assembling",
    # 设置字段 2，值为 "assembling"。
    3:   "waiting_robot",
    # 设置字段 3，值为 "waiting_robot"。
    4:   "unload_done",
    # 设置字段 4，值为 "unload_done"。
    5:   "waiting_next",
    # 设置字段 5，值为 "waiting_next"。
    100: "init_error",
    # 设置字段 100，值为 "init_error"。
    101: "stopped",
    # 设置字段 101，值为 "stopped"。
    102: "manual_mode",
    # 设置字段 102，值为 "manual_mode"。
}
# 结束当前对象、函数或条件代码块。


STATE_FAILURES: list = []
# 给 STATE_FAILURES 赋值。
CMD_FAILURES: list = []
# 给 CMD_FAILURES 赋值。
IO_FAILURES: list = []
# 给 IO_FAILURES 赋值。


def build_regs(value: int, count: int) -> list[int]:
# 定义函数 build_regs。 关键字：def＝定义 Python 函数。
    """把"实际 PLC 值"拆成 Modbus 寄存器 word。"""
    if count == 1:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        return [value & 0xFFFF]
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    if count == 2:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        u32 = value & 0xFFFFFFFF
        # 给 u32 赋值。
        hi, lo = (u32 >> 16) & 0xFFFF, u32 & 0xFFFF
        # 把 (u32 >> 16) & 0xFFFF, u32 & 0xFFFF 的结果赋给 hi, lo。
        return [lo, hi] if plc_collector.PLC_WORD_ORDER == "LITTLE" else [hi, lo]
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；if＝按条件分支；else＝进入另一条件分支。
    raise ValueError(f"count={count} not supported in test")
    # 把异常交给上层处理。 关键字：raise＝抛出 Python 异常。


def test_decode(failures: list) -> None:
# 定义函数 test_decode。 关键字：def＝定义 Python 函数；None＝空值。
    # _read_csv() 只返回主循环读取点位(cmd.* 在模块加载时进 _cmd_signals)
    read_sigs = _read_csv(MAPPING)
    # 给 read_sigs 赋值。
    cmd_sigs = plc_collector._cmd_signals
    # 给 cmd_sigs 赋值。
    print(f"loaded {len(read_sigs)} read signals "
    # 调用函数或对象方法并传入参数。
          f"+ {len(cmd_sigs)} write signals "
          # 调用 len；括号中的表达式是传入的参数。
          f"PLC_WORD_ORDER={plc_collector.PLC_WORD_ORDER}\n")
          # 继续当前表达式；这一行的值由外层代码块或调用使用。

    for sig in read_sigs:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        if sig.name not in SIM:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；in＝遍历键或判断成员。
            failures.append((sig.name, "SIM 缺样本值", "-", "-"))
            # 调用函数或对象方法并传入参数。
            print(f"  [FAIL] {sig.name:<22} SIM 表里没有样本值")
            # 调用函数或对象方法并传入参数。
            continue
            # 跳过本轮剩余语句，进入下一次循环。
        plc_val = SIM[sig.name]
        # 给 plc_val 赋值。
        regs = build_regs(plc_val, sig.count)
        # 给 regs 赋值。
        got = decode_signal(regs, sig)
        # 给 got 赋值。
        expected = plc_val * sig.scale + sig.offset
        # 给 expected 赋值。
        ok = abs(got - expected) < 1e-6
        # 给 ok 赋值。
        print(f"  [{'OK  ' if ok else 'FAIL'}] {sig.name:<22} "
        # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
              f"type={sig.type:<7} regs={regs} -> {got}")
              # 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：type＝定义类型别名。
        if not ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            failures.append((sig.name, expected, got, regs))
            # 调用函数或对象方法并传入参数。


def test_state_map() -> None:
# 定义函数 test_state_map。 关键字：def＝定义 Python 函数；None＝空值。
    print("\nstate 枚举覆盖(PLC 整数 → 契约字符串):")
    # 调用函数或对象方法并传入参数。
    for plc_int, want in sorted(STATE_CASES.items()):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        got = STATE_MAP.get(plc_int, "offline")
        # 给 got 赋值。
        ok = got == want
        # 给 ok 赋值。
        print(f"  [{'OK  ' if ok else 'FAIL'}] {plc_int:>4} -> {got:<14} (期望 {want})")
        # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
        if not ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            STATE_FAILURES.append((plc_int, want, got))
            # 调用函数或对象方法并传入参数。


def test_cmd_points() -> None:
# 定义函数 test_cmd_points。 关键字：def＝定义 Python 函数；None＝空值。
    print("\n控制点位(写命令,不在主循环读取):")
    # 调用函数或对象方法并传入参数。
    # cmd.* 由 plc_collector 在模块加载时单独解析进 _cmd_signals,
    # _read_csv() 返回的列表只含主循环读取点位,所以这里查 _cmd_signals。
    expect = {
    # 给 expect 赋值。
        "cmd.stop": 7,
        # 设置字段 cmd.stop，值为 7。
        "cmd.modeToggle": 8,
        # 设置字段 cmd.modeToggle，值为 8。
        "cmd.start": 9,
        # 设置字段 cmd.start，值为 9。
        "cmd.conveyor": 10,
        # 设置字段 cmd.conveyor，值为 10。
    }
    # 结束当前对象、函数或条件代码块。
    for name, want_addr in expect.items():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        s = plc_collector._cmd_signals.get(name)
        # 给 s 赋值。
        if s is None:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
            print(f"  [FAIL] {name:<22} CSV 里缺失")
            # 调用函数或对象方法并传入参数。
            CMD_FAILURES.append((name, want_addr, "缺失"))
            # 调用函数或对象方法并传入参数。
            continue
            # 跳过本轮剩余语句，进入下一次循环。
        ok = s.address == want_addr and s.type == "UINT"
        # 给 ok 赋值。 关键字：and＝逻辑与。
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<22} addr={s.address:<4} "
        # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
              f"type={s.type:<6} (期望 addr={want_addr}, UINT)")
              # 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：type＝定义类型别名。
        if not ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            CMD_FAILURES.append((name, want_addr, f"{s.address}/{s.type}"))
            # 调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。


def test_io_points() -> None:
# 定义函数 test_io_points。 关键字：def＝定义 Python 函数；None＝空值。
    """io.* 点位的地址与类型:地址写错 = 读到别的寄存器,线上不会报错但值是错的。"""
    print("\n产线 IO 只读点位(写 io_state 报文):")
    # 调用函数或对象方法并传入参数。
    expect = {
    # 给 expect 赋值。
        "io.sensorIn":      11,
        # 设置字段 io.sensorIn，值为 11。
        "io.sensorArrive":  12,
        # 设置字段 io.sensorArrive，值为 12。
        "io.sensorRetreat": 13,
        # 设置字段 io.sensorRetreat，值为 13。
        "io.lightColor":    14,
        # 设置字段 io.lightColor，值为 14。
        "io.trayUp":        15,
        # 设置字段 io.trayUp，值为 15。
        "io.blockUp":       16,
        # 设置字段 io.blockUp，值为 16。
    }
    # 结束当前对象、函数或条件代码块。
    read_sigs = {s.name: s for s in _read_csv(MAPPING)}
    # 给 read_sigs 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    for name, want_addr in expect.items():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        s = read_sigs.get(name)
        # 给 s 赋值。
        if s is None:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
            print(f"  [FAIL] {name:<20} CSV 里缺失")
            # 调用函数或对象方法并传入参数。
            IO_FAILURES.append((name, want_addr, "缺失"))
            # 调用函数或对象方法并传入参数。
            continue
            # 跳过本轮剩余语句，进入下一次循环。
        ok = s.address == want_addr and s.type == "UINT" and s.scale == 1.0
        # 给 ok 赋值。 关键字：and＝逻辑与。
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<20} addr={s.address:<4} "
        # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
              f"type={s.type:<6} scale={s.scale} (期望 addr={want_addr}, UINT, ×1)")
              # 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：type＝定义类型别名。
        if not ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            IO_FAILURES.append((name, want_addr, f"{s.address}/{s.type}/{s.scale}"))
            # 调用函数或对象方法并传入参数。 关键字：type＝定义类型别名。


def test_io_payload() -> None:
# 定义函数 test_io_payload。 关键字：def＝定义 Python 函数；None＝空值。
    """io_payload:只透传 io.* 点位;读失败的点保留 None 而不是被 0 兜底。"""
    print("\nio_payload 组装(契约 §3.8):")
    # 调用函数或对象方法并传入参数。
    signals = [s for s in _read_csv(MAPPING)]
    # 给 signals 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    values = {s.name: 1 for s in signals}
    # 给 values 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    for s in signals:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        if s.name == "io.sensorArrive":
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            values[s.name] = None          # 模拟该点读失败
            # 把 None          # 模拟该点读失败 的结果赋给 values[s.name]。 关键字：None＝空值。
    msg = plc_collector.io_payload(signals, values)
    # 给 msg 赋值。
    if msg is None:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；None＝空值。
        IO_FAILURES.append(("io_payload", "dict", "None"))
        # 调用函数或对象方法并传入参数。 关键字：None＝Python 空值。
        print("  [FAIL] 返回 None")
        # 调用函数或对象方法并传入参数。 关键字：None＝Python 空值。
        return
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    keys = set(msg["io"])
    # 给 keys 赋值。
    want = {n.split(".", 1)[1] for n in expect_io_names()}
    # 给 want 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    ok_keys = keys == want
    # 给 ok_keys 赋值。
    ok_none = msg["io"].get("sensorArrive", "missing") is None
    # 给 ok_none 赋值。 关键字：is＝比较对象身份或空值；None＝空值。
    print(f"  [{'OK  ' if ok_keys else 'FAIL'}] 字段集合 = {sorted(keys)}")
    # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
    print(f"  [{'OK  ' if ok_none else 'FAIL'}] 读失败的点保留 None(不兜底成 0): "
    # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支；None＝Python 空值。
          f"sensorArrive={msg['io'].get('sensorArrive')!r}")
          # 调用 .get；括号中的表达式是传入的参数。
    if not ok_keys:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        IO_FAILURES.append(("io_payload keys", sorted(want), sorted(keys)))
        # 调用函数或对象方法并传入参数。
    if not ok_none:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        IO_FAILURES.append(("io_payload None", None, msg["io"].get("sensorArrive")))
        # 调用函数或对象方法并传入参数。 关键字：None＝空值。

    # 一个 io.* 都没配时应返回 None,而不是发空报文
    if plc_collector.io_payload([], {}) is not None:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；is＝比较对象身份或空值；not＝逻辑否定；None＝空值。
        IO_FAILURES.append(("io_payload 空点位表", None, "应返回 None"))
        # 调用函数或对象方法并传入参数。 关键字：None＝空值。


def expect_io_names() -> list[str]:
# 定义函数 expect_io_names。 关键字：def＝定义 Python 函数。
    return ["io.sensorIn", "io.sensorArrive", "io.sensorRetreat",
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
            "io.lightColor", "io.trayUp", "io.blockUp"]
            # 继续当前表达式；这一行的值由外层代码块或调用使用。


def main() -> int:
# 定义函数 main。 关键字：def＝定义 Python 函数。
    failures: list = []
    # 给 failures 赋值。
    test_decode(failures)
    # 调用函数或对象方法并传入参数。
    test_state_map()
    # 调用函数或对象方法并传入参数。
    test_cmd_points()
    # 调用函数或对象方法并传入参数。
    test_io_points()
    # 调用函数或对象方法并传入参数。
    test_io_payload()
    # 调用函数或对象方法并传入参数。

    all_fail = failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES
    # 给 all_fail 赋值。
    print()
    # 调用函数或对象方法并传入参数。
    if all_fail:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        print(f"!!! {len(all_fail)} failures:")
        # 调用函数或对象方法并传入参数。
        for name, exp, got, *rest in all_fail:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
            print(f"  {name}: expected {exp}, got {got}")
            # 调用函数或对象方法并传入参数。
        return 1
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    print("=== ALL PASSED ===")
    # 调用函数或对象方法并传入参数。
    return 0
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


if __name__ == "__main__":
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    sys.exit(main())
    # 调用函数或对象方法并传入参数。
