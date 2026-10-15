"""控制命令 dispatch 单元测试(不连真实 PLC,纯本地)

跑法:  cd edge && python _test_cmd.py

测什么:
  1. register-mapping.csv 加载: cmd.* 进 _cmd_signals(写),其余进 sigs(读)
  2. CMD_DISPATCH 覆盖契约 v1.1 全部 6 个 type
  3. 调试模式(plc.connected=False):所有写命令都 acked,不打 PLC
  4. 真连 PLC:pulse 写 1 → sleep 100ms → 写 0;level 只写 1 次
  5. mode_set 合法/非法 mode 校验
  6. 未知 type / 契约预留 changeover 的处理
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import plc_collector
from plc_collector import (
    _read_csv, _cmd_signals, _dispatch_cmd,
    CMD_DISPATCH, MODE_VALUE, CMD_PULSE_MS,
)

MAPPING = Path(__file__).with_name("register-mapping.csv")


class _FakePlc:
    """模拟 Plc:暴露 on_command 需要的最小接口(.connected / .cli.write_register)"""

    def __init__(self, connected: bool = True, raise_exc: bool = False):
        self.connected = connected
        self.unit = 2
        self.writes: list[tuple[int, int, int]] = []
        self._raise = raise_exc
        outer = self

        class _Cli:
            def write_register(_self, address, value, device_id):
                if outer._raise:
                    raise RuntimeError("mock PLC 故障")
                outer.writes.append((address, value, device_id))

                class _Rr:
                    def isError(_s): return False
                return _Rr()
        self.cli = _Cli()


def main() -> int:
    sigs = _read_csv(MAPPING)
    failures: list[str] = []

    # ---- 1. csv 加载:cmd.* 点位进 _cmd_signals,其余进 sigs ----
    for n in ("cmd.start", "cmd.stop", "cmd.reset", "cmd.modeSet", "cmd.alarmClear"):
        if n not in _cmd_signals:
            failures.append(f"csv: {n} 应在 _cmd_signals(实际: {list(_cmd_signals)})")
    if "robot.joints[0]" not in [s.name for s in sigs]:
        failures.append("csv: robot.joints[0] 应在读 sigs")
    if "line.goodCount" not in [s.name for s in sigs]:
        failures.append("csv: line.goodCount 应在读 sigs")

    # ---- 2. CMD_DISPATCH 白名单覆盖契约 v1.1 全部 6 个 type ----
    expected = {"start", "stop", "reset", "changeover", "mode_set", "alarm_clear"}
    if set(CMD_DISPATCH.keys()) != expected:
        failures.append(f"CMD_DISPATCH keys={set(CMD_DISPATCH.keys())} != {expected}")

    # ---- 3. 调试模式:plc.connected=False → 全 acked ----
    fake = _FakePlc(connected=False)
    for ct in ("start", "stop", "reset", "alarm_clear"):
        ok, msg = _dispatch_cmd(fake, ct, {})
        if not ok or "PLC 未连接" not in msg:
            failures.append(f"调试 {ct} 应 acked, got (ok={ok}, msg={msg!r})")
        if fake.writes:
            failures.append(f"调试模式不应写 PLC, got {fake.writes}")

    # ---- 4. mode_set 校验 ---
    fake = _FakePlc(connected=False)
    ok, _ = _dispatch_cmd(fake, "mode_set", {"mode": "auto"})
    if not ok:
        failures.append("mode_set auto 应 acked")
    ok, msg = _dispatch_cmd(fake, "mode_set", {"mode": "super-auto"})
    if ok or "必须是" not in msg:
        failures.append(f"mode_set 非法 mode 应 rejected, got (ok={ok}, msg={msg!r})")

    # ---- 5. 未知 type / 契约预留 ----
    ok, msg = _dispatch_cmd(fake, "fly_to_moon", {})
    if ok or "未知" not in msg:
        failures.append(f"fly_to_moon 应 rejected, got (ok={ok}, msg={msg!r})")
    ok, msg = _dispatch_cmd(fake, "changeover", {})
    if not ok or "已接受" not in msg:
        failures.append(f"changeover 应 acked, got (ok={ok}, msg={msg!r})")

    # ---- 6. 真连 PLC:pulse 写 1 + sleep 100ms + 写 0 ----
    import time as _time
    fake = _FakePlc(connected=True)
    t0 = _time.time()
    ok, msg = _dispatch_cmd(fake, "start", {})
    elapsed_ms = (_time.time() - t0) * 1000
    if not ok:
        failures.append(f"start 真写应 acked, got (ok={ok}, msg={msg!r})")
    if len(fake.writes) != 2:
        failures.append(f"start pulse 应 2 次 write_register, got {len(fake.writes)}")
    elif fake.writes[0][1] != 1 or fake.writes[1][1] != 0:
        failures.append(f"start 写顺序错误(应 1→0), got {fake.writes}")
    elif fake.writes[0][0] != _cmd_signals["cmd.start"].address:
        failures.append(f"start 写地址错(应 {_cmd_signals['cmd.start'].address}), got {fake.writes[0]}")
    if not (elapsed_ms >= CMD_PULSE_MS * 0.9):
        failures.append(f"start pulse 应 ~{CMD_PULSE_MS}ms, got {elapsed_ms:.1f}ms")

    # ---- 7. 真连 PLC:mode_set 电平(写 1 次) ----
    fake = _FakePlc(connected=True)
    ok, msg = _dispatch_cmd(fake, "mode_set", {"mode": "auto"})
    if not ok:
        failures.append(f"mode_set 真写应 acked, got (ok={ok}, msg={msg!r})")
    if len(fake.writes) != 1:
        failures.append(f"mode_set 应只写 1 次, got {len(fake.writes)}")
    elif fake.writes[0][1] != MODE_VALUE["auto"]:
        failures.append(f"mode_set auto 应写 {MODE_VALUE['auto']}, got {fake.writes[0][1]}")

    # ---- 8. PLC 通信异常 → rejected ----
    fake = _FakePlc(connected=True, raise_exc=True)
    ok, msg = _dispatch_cmd(fake, "start", {})
    if ok or "通信异常" not in msg:
        failures.append(f"PLC 异常应 rejected, got (ok={ok}, msg={msg!r})")

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