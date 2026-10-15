"""控制命令 dispatch 单元测试(不连真实 PLC,纯本地)

跑法:  cd edge && python _test_cmd.py

测什么:
  1. register-mapping.csv 加载: cmd.* 进 _cmd_signals(写),其余进 sigs(读)
  2. CMD_DISPATCH 覆盖契约 v1.2 全部 7 个 type
  3. 现场 11 word 表只有 4 个可执行指令;reset/changeover/alarm_clear
     必须 rejected(不能假装 acked —— 否则操作员以为生效了)
  4. 真连 PLC: pulse 写 1 → sleep 100ms → 写 0
                 conveyor 电平只写 1 次
  5. mode_set / conveyor 的 action 枚举校验(合法值通过,非法值 rejected)
  6. 未知 type
  7. PLC 通信异常 → rejected

点位依据:DB3-Modbus-映射表.xls(2026-10-15)
  word 7  停止信号       脉冲,写 1
  word 8  手动模式切换   脉冲,1=获取 2=释放
  word 9  启动信号       脉冲,写 1
  word 10 传送带控制     电平,1=正转 0=停止
"""
import sys
import time as _time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import plc_collector
from plc_collector import (
    _read_csv, _cmd_signals, _dispatch_cmd,
    CMD_DISPATCH, MODE_TOGGLE_VALUE, CONVEYOR_VALUE, CMD_PULSE_MS,
)

MAPPING = Path(__file__).with_name("register-mapping.csv")

# 现场 PLC 11 word 表里没有寄存器的指令 → 必须 rejected
NO_PLC_POINT = ("reset", "changeover", "alarm_clear")


class _FakePlc:
    """模拟 Plc:暴露 _dispatch_cmd 需要的最小接口(.connected / .unit / .cli.write_register)"""

    def __init__(self, connected: bool = True, raise_exc: bool = False):
        self.connected = connected
        self.unit = 2
        self.writes: list[tuple[int, int, int]] = []
        self._raise = raise_exc
        outer = self

        class _Rr:
            def __init__(self, err=False):
                self._e = err

            def isError(self):
                return self._e

        class _Cli:
            def write_register(_self, address, value, device_id):
                if outer._raise:
                    raise RuntimeError("mock PLC 故障")
                outer.writes.append((address, value, device_id))
                return _Rr()

        self.cli = _Cli()


def main() -> int:
    sigs = _read_csv(MAPPING)
    read_names = {s.name for s in sigs}
    failures: list[str] = []

    # ---- 1. csv 加载 ----
    for n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):
        if n not in _cmd_signals:
            failures.append(f"csv: {n} 应在 _cmd_signals(实际: {sorted(_cmd_signals)})")
    for n in ("robot.joints[0]", "line.state"):
        if n not in read_names:
            failures.append(f"csv: {n} 应在读 sigs(实际: {sorted(read_names)})")

    # ---- 2. CMD_DISPATCH 覆盖契约 v1.2 全部 7 个 type ----
    expected = {"start", "stop", "reset", "changeover", "mode_set",
                "alarm_clear", "conveyor"}
    if set(CMD_DISPATCH) != expected:
        failures.append(f"CMD_DISPATCH keys={sorted(CMD_DISPATCH)} != {sorted(expected)}")

    # ---- 3. 现场无寄存器的指令 → 必须 rejected ----
    fake = _FakePlc(connected=False)
    for ct in NO_PLC_POINT:
        ok, msg = _dispatch_cmd(fake, ct, {})
        if ok:
            failures.append(f"{ct}: 现场无对应寄存器,应 rejected,却 acked(msg={msg!r})")
        elif "无" not in msg or "寄存器" not in msg:
            failures.append(f"{ct}: 拒绝原因应说明无寄存器, got msg={msg!r}")
        if fake.writes:
            failures.append(f"{ct} 不该写 PLC, got {fake.writes}")

    # ---- 4. 未知 type ----
    ok, msg = _dispatch_cmd(fake, "fly_to_moon", {})
    if ok or "未知" not in msg:
        failures.append(f"fly_to_moon 应 rejected, got (ok={ok}, msg={msg!r})")

    # ---- 5. mode_set 枚举校验 ----
    for act in ("acquire", "release"):
        fake = _FakePlc(connected=True)
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": act})
        if not ok:
            failures.append(f"mode_set {act} 应 acked, got (ok={ok}, msg={msg!r})")
        elif len(fake.writes) != 2:      # 脉冲型:1 → 0
            failures.append(f"mode_set {act} pulse 应 2 次写, got {len(fake.writes)}")
        elif fake.writes[0][1] != MODE_TOGGLE_VALUE[act] or fake.writes[1][1] != 0:
            failures.append(f"mode_set {act} 应写 "
                            f"{MODE_TOGGLE_VALUE[act]}→0, got {fake.writes}")
        elif fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:
            failures.append(f"mode_set 写地址错, got {fake.writes[0][0]}")

    for bad in ("auto", "", None, 1):
        fake = _FakePlc(connected=False)
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": bad})
        if ok or "action" not in msg:
            failures.append(f"mode_set action={bad!r} 应 rejected, "
                            f"got (ok={ok}, msg={msg!r})")

    # ---- 6. conveyor 枚举 + 电平型(只写 1 次,不回写 0) ----
    for act in ("forward", "stop"):
        fake = _FakePlc(connected=True)
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": act})
        if not ok:
            failures.append(f"conveyor {act} 应 acked, got (ok={ok}, msg={msg!r})")
        elif len(fake.writes) != 1:      # 电平型:不自动回 0
            failures.append(f"conveyor {act} 电平型应只写 1 次, got {len(fake.writes)}")
        elif fake.writes[0][1] != CONVEYOR_VALUE[act]:
            failures.append(f"conveyor {act} 应写 {CONVEYOR_VALUE[act]}, "
                            f"got {fake.writes[0][1]}")
        elif fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:
            failures.append(f"conveyor 写地址错, got {fake.writes[0][0]}")

    for bad in ("reverse", "", None):
        fake = _FakePlc(connected=False)
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": bad})
        if ok or "action" not in msg:
            failures.append(f"conveyor action={bad!r} 应 rejected, "
                            f"got (ok={ok}, msg={msg!r})")

    # ---- 7. start / stop 脉冲:写 1 → sleep → 写 0,地址正确 ----
    for ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):
        fake = _FakePlc(connected=True)
        t0 = _time.time()
        ok, msg = _dispatch_cmd(fake, ct, {})
        elapsed_ms = (_time.time() - t0) * 1000
        if not ok:
            failures.append(f"{ct} 真写应 acked, got (ok={ok}, msg={msg!r})")
        if len(fake.writes) != 2:
            failures.append(f"{ct} pulse 应 2 次写, got {len(fake.writes)}")
        else:
            if (fake.writes[0][1], fake.writes[1][1]) != (1, 0):
                failures.append(f"{ct} 应写 1→0, got {fake.writes}")
            if fake.writes[0][0] != _cmd_signals[sig_name].address:
                failures.append(f"{ct} 写地址错(应 {_cmd_signals[sig_name].address}), "
                                f"got {fake.writes[0][0]}")
        if elapsed_ms < CMD_PULSE_MS * 0.9:
            failures.append(f"{ct} pulse 应 ~{CMD_PULSE_MS}ms, got {elapsed_ms:.1f}ms")

    # ---- 8. PLC 未连接(调试模式)→ 已配点位仍 acked 但不写 ----
    fake = _FakePlc(connected=False)
    for ct, params in (("start", {}), ("stop", {}),
                       ("mode_set", {"action": "acquire"}),
                       ("conveyor", {"action": "forward"})):
        ok, msg = _dispatch_cmd(fake, ct, params)
        if not ok or "PLC 未连接" not in msg:
            failures.append(f"调试 {ct} 应 acked 且提示未连接, "
                            f"got (ok={ok}, msg={msg!r})")
    if fake.writes:
        failures.append(f"调试模式不应写 PLC, got {fake.writes}")

    # ---- 9. PLC 通信异常 → rejected ----
    fake = _FakePlc(connected=True, raise_exc=True)
    ok, msg = _dispatch_cmd(fake, "start", {})
    if ok or "通信异常" not in msg:
        failures.append(f"PLC 异常应 rejected, got (ok={ok}, msg={msg!r})")

    print(f"CMD_DISPATCH types: {sorted(CMD_DISPATCH)}")
    print(f"现场可执行: {sorted(set(CMD_DISPATCH) - set(NO_PLC_POINT))}")
    print(f"现场无寄存器: {sorted(NO_PLC_POINT)}")
    print()
    if failures:
        print(f"!!! {len(failures)} failures:")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"=== ALL PASSED ({len(sigs)} read + {len(_cmd_signals)} cmd) ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
