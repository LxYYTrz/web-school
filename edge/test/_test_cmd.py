"""控制命令 dispatch 单元测试(不连真实 PLC,纯本地)

跑法:  cd edge && python test/_test_cmd.py

测什么:
  1. register-mapping.csv 加载: cmd.* 进 _cmd_signals(写),其余进 sigs(读)
  2. CMD_DISPATCH 覆盖契约 v1.2 全部 7 个 type
  3. 现场只有 4 个可执行指令;reset/changeover/alarm_clear
     必须 rejected(不能假装 acked —— 否则操作员以为生效了)
  4. 真连 PLC: 所有写点都**只写一次**(2026-10-16 现场确认 PLC 侧自行清零脉冲点,
     采集器不再 sleep 后回写 0)
  5. mode_set / conveyor 的 action 枚举校验(合法值通过,非法值 rejected)
  6. 未知 type
  7. PLC 通信异常 → rejected

点位依据:DB3-Modbus-映射表.xls(2026-10-16)
  word 7  停止信号       写 1,PLC 完成后自动置 0
  word 8  手动模式切换   1=获取 2=释放,PLC 切换完成后自动置 0
  word 9  启动信号       写 1,PLC 完成后自动置 0
  word 10 传送带控制     电平,1=正转 0=停止
"""

# 使用模拟 PLC 的离线命令分发验证，属于辅助测试或排查文件，不是正式采集入口。
# 先核对本文件参数与 main/顶层流程，再看它调用的客户端或 plc_collector 辅助函数；输出仅说明该检查的观察结果。

import sys
import threading
import time as _time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# 将本行提供的值插入列表或搜索路径的指定位置。

import plc_collector
from plc_collector import (
    Plc, _read_csv, _cmd_signals, _dispatch_cmd,
    CMD_DISPATCH, MODE_TOGGLE_VALUE, CONVEYOR_VALUE,
)

MAPPING = Path(__file__).resolve().parent.parent / "register-mapping.csv"

# 现场 PLC 没有寄存器的指令 → 必须 rejected
NO_PLC_POINT = ("reset", "changeover", "alarm_clear")


class _FakePlc:
    """模拟 Plc:暴露 _dispatch_cmd 需要的最小接口(.connected / .unit / .cli.write_register)"""

    def __init__(self, connected: bool = True, raise_exc: bool = False):
    # 定义 __init__，用于初始化 _test_cmd 使用的实例状态和依赖。
        self.connected = connected
        self.lock = threading.Lock()
        self.unit = 2
        self.writes: list[tuple[int, int, int]] = []
        self._raise = raise_exc
        outer = self

        class _Rr:
            def __init__(self, err=False):
            # 定义 __init__，用于初始化 _test_cmd 使用的实例状态和依赖。
                self._e = err

            def isError(self):
            # 定义 isError，用于返回模拟 Modbus 响应的错误标记，供测试失败分支。
                return self._e

        class _Cli:
            def write_register(_self, address, value, device_id):
                assert outer.lock.locked(), 'PLC 写操作必须持有连接锁'
                if outer._raise:
                # 检查outer._raise:，按判断结果进入对应的处理分支。
                    raise RuntimeError("mock PLC 故障")
                outer.writes.append((address, value, device_id))
                return _Rr()

        self.cli = _Cli()


def main() -> int:
# 定义 main，用于用模拟客户端检查指令分派、拒绝路径和读写互斥行为。
    sigs = _read_csv(MAPPING)
    read_names = {s.name for s in sigs}
    failures: list[str] = []

    # ---- 1. csv 加载 ----
    for n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):
    # 循环处理n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):，按判断结果进入对应的处理分支。
        if n not in _cmd_signals:
        # 检查n not in _cmd_signals:，按判断结果进入对应的处理分支。
            failures.append(f"csv: {n} 应在 _cmd_signals(实际: {sorted(_cmd_signals)})")
    for n in ("robot.joints[0]", "line.state"):
    # 循环处理n in ("robot.joints[0]", "line.state"):，按判断结果进入对应的处理分支。
        if n not in read_names:
        # 检查n not in read_names:，按判断结果进入对应的处理分支。
            failures.append(f"csv: {n} 应在读 sigs(实际: {sorted(read_names)})")

    # ---- 2. CMD_DISPATCH 覆盖契约 v1.2 全部 7 个 type ----
    expected = {"start", "stop", "reset", "changeover", "mode_set",
                "alarm_clear", "conveyor"}
    if set(CMD_DISPATCH) != expected:
    # 检查set(CMD_DISPATCH) != expected:，按判断结果进入对应的处理分支。
        failures.append(f"CMD_DISPATCH keys={sorted(CMD_DISPATCH)} != {sorted(expected)}")

    # ---- 3. 现场无寄存器的指令 → 必须 rejected ----
    fake = _FakePlc(connected=False)
    for ct in NO_PLC_POINT:
    # 循环处理ct in NO_PLC_POINT:，按判断结果进入对应的处理分支。
        ok, msg = _dispatch_cmd(fake, ct, {})
        if ok:
        # 检查ok:，按判断结果进入对应的处理分支。
            failures.append(f"{ct}: 现场无对应寄存器,应 rejected,却 acked(msg={msg!r})")
        elif "无" not in msg or "寄存器" not in msg:
        # 检查"无" not in msg or "寄存器" not in msg:，按判断结果进入对应的处理分支。
            failures.append(f"{ct}: 拒绝原因应说明无寄存器, got msg={msg!r}")
        if fake.writes:
        # 检查fake.writes:，按判断结果进入对应的处理分支。
            failures.append(f"{ct} 不该写 PLC, got {fake.writes}")
    # ---- 4. 未知 type ----
    ok, msg = _dispatch_cmd(fake, "fly_to_moon", {})
    if ok or "未知" not in msg:
    # 检查ok or "未知" not in msg:，按判断结果进入对应的处理分支。
        failures.append(f"fly_to_moon 应 rejected, got (ok={ok}, msg={msg!r})")

    # ---- 5. mode_set 枚举校验 + 只写一次(不再回写 0) ----
    for act in ("acquire", "release"):
    # 循环处理act in ("acquire", "release"):，按判断结果进入对应的处理分支。
        fake = _FakePlc(connected=True)
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": act})
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
            failures.append(f"mode_set {act} 应 acked, got (ok={ok}, msg={msg!r})")
        elif len(fake.writes) != 1:      # PLC 侧自行清零,采集器只写一次
        # 检查len(fake.writes) != 1: # PLC 侧自行清零,采集器只写一次，按判断结果进入对应的处理分支。
            failures.append(f"mode_set {act} 应只写 1 次, got {len(fake.writes)}")
        elif fake.writes[0][1] != MODE_TOGGLE_VALUE[act]:
        # 检查fake.writes[0][1] != MODE_TOGGLE_VALUE[act]:，按判断结果进入对应的处理分支。
            failures.append(f"mode_set {act} 应写 {MODE_TOGGLE_VALUE[act]}, "
                            f"got {fake.writes}")
        elif fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:
        # 检查fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:，按判断结果进入对应的处理分支。
            failures.append(f"mode_set 写地址错, got {fake.writes[0][0]}")

    for bad in ("auto", "", None, 1):
    # 循环处理bad in ("auto", "", None, 1):，按判断结果进入对应的处理分支。
        fake = _FakePlc(connected=False)
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": bad})
        if ok or "action" not in msg:
        # 检查ok or "action" not in msg:，按判断结果进入对应的处理分支。
            failures.append(f"mode_set action={bad!r} 应 rejected, "
                            f"got (ok={ok}, msg={msg!r})")

    # ---- 6. conveyor 枚举 + 电平型(只写 1 次) ----
    for act in ("forward", "stop"):
    # 循环处理act in ("forward", "stop"):，按判断结果进入对应的处理分支。
        fake = _FakePlc(connected=True)
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": act})
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
            failures.append(f"conveyor {act} 应 acked, got (ok={ok}, msg={msg!r})")
        elif len(fake.writes) != 1:      # 电平型:不自动回 0
        # 检查len(fake.writes) != 1: # 电平型:不自动回 0，按判断结果进入对应的处理分支。
            failures.append(f"conveyor {act} 电平型应只写 1 次, got {len(fake.writes)}")
        elif fake.writes[0][1] != CONVEYOR_VALUE[act]:
        # 检查fake.writes[0][1] != CONVEYOR_VALUE[act]:，按判断结果进入对应的处理分支。
            failures.append(f"conveyor {act} 应写 {CONVEYOR_VALUE[act]}, "
                            f"got {fake.writes[0][1]}")
        elif fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:
        # 检查fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:，按判断结果进入对应的处理分支。
            failures.append(f"conveyor 写地址错, got {fake.writes[0][0]}")

    for bad in ("reverse", "", None):
    # 循环处理bad in ("reverse", "", None):，按判断结果进入对应的处理分支。
        fake = _FakePlc(connected=False)
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": bad})
        if ok or "action" not in msg:
        # 检查ok or "action" not in msg:，按判断结果进入对应的处理分支。
            failures.append(f"conveyor action={bad!r} 应 rejected, "
                            f"got (ok={ok}, msg={msg!r})")

    # ---- 7. start / stop:只写一次(PLC 完成后自行置 0),地址正确、无额外延时 ----
    for ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):
    # 循环处理ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):，按判断结果进入对应的处理分支。
        fake = _FakePlc(connected=True)
        t0 = _time.time()
        ok, msg = _dispatch_cmd(fake, ct, {})
        elapsed_ms = (_time.time() - t0) * 1000
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
            failures.append(f"{ct} 真写应 acked, got (ok={ok}, msg={msg!r})")
        if len(fake.writes) != 1:
        # 检查len(fake.writes) != 1:，按判断结果进入对应的处理分支。
            failures.append(f"{ct} 应只写 1 次(PLC 自行清零), got {fake.writes}")
        elif fake.writes[0][1] != 1:
        # 检查fake.writes[0][1] != 1:，按判断结果进入对应的处理分支。
            failures.append(f"{ct} 应写 1, got {fake.writes[0][1]}")
        elif fake.writes[0][0] != _cmd_signals[sig_name].address:
        # 检查fake.writes[0][0] != _cmd_signals[sig_name].address:，按判断结果进入对应的处理分支。
            failures.append(f"{ct} 写地址错(应 {_cmd_signals[sig_name].address}), "
                            f"got {fake.writes[0][0]}")
        if elapsed_ms > 50:
        # 检查elapsed_ms > 50:，按判断结果进入对应的处理分支。
            failures.append(f"{ct} 不应再有脉冲 sleep 延时, got {elapsed_ms:.1f}ms")

    # ---- 8. PLC 未连接 → 全部 rejected,且一个字节都不写(不假 ack) ----
    fake = _FakePlc(connected=False)
    for ct, params in (("start", {}), ("stop", {}),
    # 循环处理ct, params in (("start", {}), ("stop", {}),，按判断结果进入对应的处理分支。
                       ("mode_set", {"action": "acquire"}),
                       ("conveyor", {"action": "forward"})):
        ok, msg = _dispatch_cmd(fake, ct, params)
        if ok or "PLC 未连接" not in msg:
        # 检查ok or "PLC 未连接" not in msg:，按判断结果进入对应的处理分支。
            failures.append(f"PLC 未连接时 {ct} 应 rejected 且提示未连接, "
                            f"got (ok={ok}, msg={msg!r})")
    if fake.writes:
    # 检查fake.writes:，按判断结果进入对应的处理分支。
        failures.append(f"PLC 未连接时不应写 PLC, got {fake.writes}")

    # ---- 9. PLC 通信异常 → rejected ----
    fake = _FakePlc(connected=True, raise_exc=True)
    ok, msg = _dispatch_cmd(fake, "start", {})
    if ok or "通信异常" not in msg:
    # 检查ok or "通信异常" not in msg:，按判断结果进入对应的处理分支。
        failures.append(f"PLC 异常应 rejected, got (ok={ok}, msg={msg!r})")

    # 同一 Modbus 连接的读和写必须串行，防止采集线程与 MQTT 回调交错收包。
    read_started = threading.Event()
    release_read = threading.Event()
    write_started = threading.Event()

    class _LockedCli:
    # 定义类 _LockedCli。
        def read_holding_registers(self, address, count, device_id):
            read_started.set()
            if not release_read.wait(2):
            # 检查not release_read.wait(2):，按判断结果进入对应的处理分支。
                raise TimeoutError("mock 读超时")
            return type("Reply", (), {"registers": [0] * count, "isError": lambda self: False})()

        def write_register(self, address, value, device_id):
            write_started.set()
            return type("Reply", (), {"isError": lambda self: False})()

    plc = Plc("127.0.0.1", 503, 2)
    plc.cli = _LockedCli()
    plc.connected = True
    reader = threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True)
    writer = threading.Thread(target=_dispatch_cmd, args=(plc, "start", {}), daemon=True)
    reader.start()
    # 启动 Three.js 的连续渲染循环。
    if not read_started.wait(1):
    # 检查not read_started.wait(1):，按判断结果进入对应的处理分支。
        failures.append("读线程未进入 Modbus 调用")
    writer.start()
    # 启动 Three.js 的连续渲染循环。
    if write_started.wait(0.05):
    # 检查write_started.wait(0.05):，按判断结果进入对应的处理分支。
        failures.append("读操作尚未结束时，写操作进入了同一 Modbus 连接")
    release_read.set()
    reader.join(2)
    writer.join(2)
    if not write_started.is_set():
    # 检查not write_started.is_set():，按判断结果进入对应的处理分支。
        failures.append("读操作结束后写操作仍未执行")

    print(f"CMD_DISPATCH types: {sorted(CMD_DISPATCH)}")
    print(f"现场可执行: {sorted(set(CMD_DISPATCH) - set(NO_PLC_POINT))}")
    print(f"现场无寄存器: {sorted(NO_PLC_POINT)}")
    print()
    if failures:
    # 检查failures:，按判断结果进入对应的处理分支。
        print(f"!!! {len(failures)} failures:")
        for f in failures:
        # 循环处理f in failures:，按判断结果进入对应的处理分支。
            print(f"  - {f}")
        return 1
    print(f"=== ALL PASSED ({len(sigs)} read + {len(_cmd_signals)} cmd) ===")
    return 0


if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
    sys.exit(main())
