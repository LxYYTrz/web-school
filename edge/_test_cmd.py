"""控制命令 dispatch 单元测试(不连真实 PLC,纯本地)

跑法:  cd edge && python _test_cmd.py

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
import sys
# 从 Python 环境 导入 sys，供后续代码使用。 关键字：import＝导入模块或符号。
import threading
# 从 Python 环境 导入 threading，供后续代码使用。 关键字：import＝导入模块或符号。
import time as _time
# 从 Python 环境 导入 time as _time，供后续代码使用。 关键字：import＝导入模块或符号；as＝为导入或上下文对象命名。
from pathlib import Path
# 从 pathlib 导入 Path，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

sys.path.insert(0, str(Path(__file__).parent))
# 调用函数或对象方法并传入参数。

import plc_collector
# 从 Python 环境 导入 plc_collector，供后续代码使用。 关键字：import＝导入模块或符号。
from plc_collector import (
# 从 plc_collector 导入 (，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
    Plc, _read_csv, _cmd_signals, _dispatch_cmd,
    # 继续当前表达式；这一行的值由外层代码块或调用使用。
    CMD_DISPATCH, MODE_TOGGLE_VALUE, CONVEYOR_VALUE,
    # 继续当前表达式；这一行的值由外层代码块或调用使用。
)
# 结束当前集合、分组或调用参数。

MAPPING = Path(__file__).with_name("register-mapping.csv")
# 给 MAPPING 赋值。

# 现场 PLC 没有寄存器的指令 → 必须 rejected
NO_PLC_POINT = ("reset", "changeover", "alarm_clear")
# 给 NO_PLC_POINT 赋值。


class _FakePlc:
# 定义类 _FakePlc。 关键字：class＝定义类。
    """模拟 Plc:暴露 _dispatch_cmd 需要的最小接口(.connected / .unit / .cli.write_register)"""

    def __init__(self, connected: bool = True, raise_exc: bool = False):
    # 定义函数 __init__。 关键字：def＝定义 Python 函数；self＝当前 Python 实例；True＝布尔真值；False＝布尔假值。
        self.connected = connected
        # 把 connected 的结果赋给 self.connected。 关键字：self＝当前 Python 实例。
        self.lock = threading.Lock()
        # 把 threading.Lock() 的结果赋给 self.lock。 关键字：self＝当前 Python 实例。
        self.unit = 2
        # 把 2 的结果赋给 self.unit。 关键字：self＝当前 Python 实例。
        self.writes: list[tuple[int, int, int]] = []
        # 把 [] 的结果赋给 self.writes: list[tuple[int, int, int]]。 关键字：self＝当前 Python 实例。
        self._raise = raise_exc
        # 把 raise_exc 的结果赋给 self._raise。 关键字：self＝当前 Python 实例。
        outer = self
        # 给 outer 赋值。 关键字：self＝当前 Python 实例。

        class _Rr:
        # 定义类 _Rr。 关键字：class＝定义类。
            def __init__(self, err=False):
            # 定义函数 __init__。 关键字：def＝定义 Python 函数；self＝当前 Python 实例；False＝布尔假值。
                self._e = err
                # 把 err 的结果赋给 self._e。 关键字：self＝当前 Python 实例。

            def isError(self):
            # 定义函数 isError。 关键字：def＝定义 Python 函数；self＝当前 Python 实例。
                return self._e
                # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；self＝当前 Python 实例。

        class _Cli:
        # 定义类 _Cli。 关键字：class＝定义类。
            def write_register(_self, address, value, device_id):
            # 定义函数 write_register。 关键字：def＝定义 Python 函数。
                assert outer.lock.locked(), 'PLC 写操作必须持有连接锁'
                # 调用 outer.lock.locked；括号中的表达式是传入的参数。 关键字：assert＝检查断言条件。
                if outer._raise:
                # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
                    raise RuntimeError("mock PLC 故障")
                    # 把异常交给上层处理。 关键字：raise＝抛出 Python 异常。
                outer.writes.append((address, value, device_id))
                # 调用函数或对象方法并传入参数。
                return _Rr()
                # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。

        self.cli = _Cli()
        # 把 _Cli() 的结果赋给 self.cli。 关键字：self＝当前 Python 实例。


def main() -> int:
# 定义函数 main。 关键字：def＝定义 Python 函数。
    sigs = _read_csv(MAPPING)
    # 给 sigs 赋值。
    read_names = {s.name for s in sigs}
    # 给 read_names 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    failures: list[str] = []
    # 给 failures 赋值。

    # ---- 1. csv 加载 ----
    for n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        if n not in _cmd_signals:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；in＝遍历键或判断成员。
            failures.append(f"csv: {n} 应在 _cmd_signals(实际: {sorted(_cmd_signals)})")
            # 调用函数或对象方法并传入参数。
    for n in ("robot.joints[0]", "line.state"):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        if n not in read_names:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；in＝遍历键或判断成员。
            failures.append(f"csv: {n} 应在读 sigs(实际: {sorted(read_names)})")
            # 调用函数或对象方法并传入参数。

    # ---- 2. CMD_DISPATCH 覆盖契约 v1.2 全部 7 个 type ----
    expected = {"start", "stop", "reset", "changeover", "mode_set",
    # 给 expected 赋值。
                "alarm_clear", "conveyor"}
                # 继续当前表达式；这一行的值由外层代码块或调用使用。
    if set(CMD_DISPATCH) != expected:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        failures.append(f"CMD_DISPATCH keys={sorted(CMD_DISPATCH)} != {sorted(expected)}")
        # 调用函数或对象方法并传入参数。

    # ---- 3. 现场无寄存器的指令 → 必须 rejected ----
    fake = _FakePlc(connected=False)
    # 给 fake 赋值。 关键字：False＝布尔假值。
    for ct in NO_PLC_POINT:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        ok, msg = _dispatch_cmd(fake, ct, {})
        # 把 _dispatch_cmd(fake, ct, {}) 的结果赋给 ok, msg。
        if ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            failures.append(f"{ct}: 现场无对应寄存器,应 rejected,却 acked(msg={msg!r})")
            # 调用函数或对象方法并传入参数。
        elif "无" not in msg or "寄存器" not in msg:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件；not＝逻辑否定；in＝遍历键或判断成员；or＝逻辑或。
            failures.append(f"{ct}: 拒绝原因应说明无寄存器, got msg={msg!r}")
            # 调用函数或对象方法并传入参数。
        if fake.writes:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            failures.append(f"{ct} 不该写 PLC, got {fake.writes}")
            # 调用函数或对象方法并传入参数。
    # ---- 4. 未知 type ----
    ok, msg = _dispatch_cmd(fake, "fly_to_moon", {})
    # 把 _dispatch_cmd(fake, "fly_to_moon", {}) 的结果赋给 ok, msg。
    if ok or "未知" not in msg:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；or＝逻辑或；not＝逻辑否定；in＝遍历键或判断成员。
        failures.append(f"fly_to_moon 应 rejected, got (ok={ok}, msg={msg!r})")
        # 调用函数或对象方法并传入参数。

    # ---- 5. mode_set 枚举校验 + 只写一次(不再回写 0) ----
    for act in ("acquire", "release"):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        fake = _FakePlc(connected=True)
        # 给 fake 赋值。 关键字：True＝布尔真值。
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": act})
        # 把 _dispatch_cmd(fake, "mode_set", {"action": act}) 的结果赋给 ok, msg。
        if not ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            failures.append(f"mode_set {act} 应 acked, got (ok={ok}, msg={msg!r})")
            # 调用函数或对象方法并传入参数。
        elif len(fake.writes) != 1:      # PLC 侧自行清零,采集器只写一次
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"mode_set {act} 应只写 1 次, got {len(fake.writes)}")
            # 调用函数或对象方法并传入参数。
        elif fake.writes[0][1] != MODE_TOGGLE_VALUE[act]:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"mode_set {act} 应写 {MODE_TOGGLE_VALUE[act]}, "
            # 调用函数或对象方法并传入参数。
                            f"got {fake.writes}")
                            # 继续当前表达式；这一行的值由外层代码块或调用使用。
        elif fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"mode_set 写地址错, got {fake.writes[0][0]}")
            # 调用函数或对象方法并传入参数。

    for bad in ("auto", "", None, 1):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员；None＝空值。
        fake = _FakePlc(connected=False)
        # 给 fake 赋值。 关键字：False＝布尔假值。
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": bad})
        # 把 _dispatch_cmd(fake, "mode_set", {"action": bad}) 的结果赋给 ok, msg。
        if ok or "action" not in msg:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；or＝逻辑或；not＝逻辑否定；in＝遍历键或判断成员。
            failures.append(f"mode_set action={bad!r} 应 rejected, "
            # 调用函数或对象方法并传入参数。
                            f"got (ok={ok}, msg={msg!r})")
                            # 调用 got；括号中的表达式是传入的参数。

    # ---- 6. conveyor 枚举 + 电平型(只写 1 次) ----
    for act in ("forward", "stop"):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        fake = _FakePlc(connected=True)
        # 给 fake 赋值。 关键字：True＝布尔真值。
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": act})
        # 把 _dispatch_cmd(fake, "conveyor", {"action": act}) 的结果赋给 ok, msg。
        if not ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            failures.append(f"conveyor {act} 应 acked, got (ok={ok}, msg={msg!r})")
            # 调用函数或对象方法并传入参数。
        elif len(fake.writes) != 1:      # 电平型:不自动回 0
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"conveyor {act} 电平型应只写 1 次, got {len(fake.writes)}")
            # 调用函数或对象方法并传入参数。
        elif fake.writes[0][1] != CONVEYOR_VALUE[act]:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"conveyor {act} 应写 {CONVEYOR_VALUE[act]}, "
            # 调用函数或对象方法并传入参数。
                            f"got {fake.writes[0][1]}")
                            # 继续当前表达式；这一行的值由外层代码块或调用使用。
        elif fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"conveyor 写地址错, got {fake.writes[0][0]}")
            # 调用函数或对象方法并传入参数。

    for bad in ("reverse", "", None):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员；None＝空值。
        fake = _FakePlc(connected=False)
        # 给 fake 赋值。 关键字：False＝布尔假值。
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": bad})
        # 把 _dispatch_cmd(fake, "conveyor", {"action": bad}) 的结果赋给 ok, msg。
        if ok or "action" not in msg:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；or＝逻辑或；not＝逻辑否定；in＝遍历键或判断成员。
            failures.append(f"conveyor action={bad!r} 应 rejected, "
            # 调用函数或对象方法并传入参数。
                            f"got (ok={ok}, msg={msg!r})")
                            # 调用 got；括号中的表达式是传入的参数。

    # ---- 7. start / stop:只写一次(PLC 完成后自行置 0),地址正确、无额外延时 ----
    for ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
        fake = _FakePlc(connected=True)
        # 给 fake 赋值。 关键字：True＝布尔真值。
        t0 = _time.time()
        # 给 t0 赋值。
        ok, msg = _dispatch_cmd(fake, ct, {})
        # 把 _dispatch_cmd(fake, ct, {}) 的结果赋给 ok, msg。
        elapsed_ms = (_time.time() - t0) * 1000
        # 给 elapsed_ms 赋值。
        if not ok:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            failures.append(f"{ct} 真写应 acked, got (ok={ok}, msg={msg!r})")
            # 调用函数或对象方法并传入参数。
        if len(fake.writes) != 1:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            failures.append(f"{ct} 应只写 1 次(PLC 自行清零), got {fake.writes}")
            # 调用函数或对象方法并传入参数。
        elif fake.writes[0][1] != 1:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"{ct} 应写 1, got {fake.writes[0][1]}")
            # 调用函数或对象方法并传入参数。
        elif fake.writes[0][0] != _cmd_signals[sig_name].address:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：elif＝检查下一条件。
            failures.append(f"{ct} 写地址错(应 {_cmd_signals[sig_name].address}), "
            # 调用函数或对象方法并传入参数。
                            f"got {fake.writes[0][0]}")
                            # 继续当前表达式；这一行的值由外层代码块或调用使用。
        if elapsed_ms > 50:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            failures.append(f"{ct} 不应再有脉冲 sleep 延时, got {elapsed_ms:.1f}ms")
            # 调用函数或对象方法并传入参数。

    # ---- 8. PLC 未连接 → 全部 rejected,且一个字节都不写(不假 ack) ----
    fake = _FakePlc(connected=False)
    # 给 fake 赋值。 关键字：False＝布尔假值。
    for ct, params in (("start", {}), ("stop", {}),
    # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
                       ("mode_set", {"action": "acquire"}),
                       # 开始当前表达式的分组或数组内容。
                       ("conveyor", {"action": "forward"})):
                       # 开始当前表达式的分组或数组内容。
        ok, msg = _dispatch_cmd(fake, ct, params)
        # 把 _dispatch_cmd(fake, ct, params) 的结果赋给 ok, msg。
        if ok or "PLC 未连接" not in msg:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；or＝逻辑或；not＝逻辑否定；in＝遍历键或判断成员。
            failures.append(f"PLC 未连接时 {ct} 应 rejected 且提示未连接, "
            # 调用函数或对象方法并传入参数。
                            f"got (ok={ok}, msg={msg!r})")
                            # 调用 got；括号中的表达式是传入的参数。
    if fake.writes:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        failures.append(f"PLC 未连接时不应写 PLC, got {fake.writes}")
        # 调用函数或对象方法并传入参数。

    # ---- 9. PLC 通信异常 → rejected ----
    fake = _FakePlc(connected=True, raise_exc=True)
    # 给 fake 赋值。 关键字：True＝布尔真值。
    ok, msg = _dispatch_cmd(fake, "start", {})
    # 把 _dispatch_cmd(fake, "start", {}) 的结果赋给 ok, msg。
    if ok or "通信异常" not in msg:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；or＝逻辑或；not＝逻辑否定；in＝遍历键或判断成员。
        failures.append(f"PLC 异常应 rejected, got (ok={ok}, msg={msg!r})")
        # 调用函数或对象方法并传入参数。

    # 同一 Modbus 连接的读和写必须串行，防止采集线程与 MQTT 回调交错收包。
    read_started = threading.Event()
    # 给 read_started 赋值。
    release_read = threading.Event()
    # 给 release_read 赋值。
    write_started = threading.Event()
    # 给 write_started 赋值。

    class _LockedCli:
    # 定义类 _LockedCli。 关键字：class＝定义类。
        def read_holding_registers(self, address, count, device_id):
        # 定义函数 read_holding_registers。 关键字：def＝定义 Python 函数；self＝当前 Python 实例。
            read_started.set()
            # 调用函数或对象方法并传入参数。
            if not release_read.wait(2):
            # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
                raise TimeoutError("mock 读超时")
                # 把异常交给上层处理。 关键字：raise＝抛出 Python 异常。
            return type("Reply", (), {"registers": [0] * count, "isError": lambda self: False})()
            # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；lambda＝定义匿名函数；self＝当前 Python 实例；False＝布尔假值。

        def write_register(self, address, value, device_id):
        # 定义函数 write_register。 关键字：def＝定义 Python 函数；self＝当前 Python 实例。
            write_started.set()
            # 调用函数或对象方法并传入参数。
            return type("Reply", (), {"isError": lambda self: False})()
            # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；lambda＝定义匿名函数；self＝当前 Python 实例；False＝布尔假值。

    plc = Plc("127.0.0.1", 503, 2)
    # 给 plc 赋值。
    plc.cli = _LockedCli()
    # 把 _LockedCli() 的结果赋给 plc.cli。
    plc.connected = True
    # 把 True 的结果赋给 plc.connected。 关键字：True＝布尔真值。
    reader = threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True)
    # 给 reader 赋值。 关键字：True＝布尔真值。
    writer = threading.Thread(target=_dispatch_cmd, args=(plc, "start", {}), daemon=True)
    # 给 writer 赋值。 关键字：True＝布尔真值。
    reader.start()
    # 调用函数或对象方法并传入参数。
    if not read_started.wait(1):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        failures.append("读线程未进入 Modbus 调用")
        # 调用函数或对象方法并传入参数。
    writer.start()
    # 调用函数或对象方法并传入参数。
    if write_started.wait(0.05):
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        failures.append("读操作尚未结束时，写操作进入了同一 Modbus 连接")
        # 调用函数或对象方法并传入参数。
    release_read.set()
    # 调用函数或对象方法并传入参数。
    reader.join(2)
    # 调用函数或对象方法并传入参数。
    writer.join(2)
    # 调用函数或对象方法并传入参数。
    if not write_started.is_set():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        failures.append("读操作结束后写操作仍未执行")
        # 调用函数或对象方法并传入参数。

    print(f"CMD_DISPATCH types: {sorted(CMD_DISPATCH)}")
    # 调用函数或对象方法并传入参数。
    print(f"现场可执行: {sorted(set(CMD_DISPATCH) - set(NO_PLC_POINT))}")
    # 调用函数或对象方法并传入参数。
    print(f"现场无寄存器: {sorted(NO_PLC_POINT)}")
    # 调用函数或对象方法并传入参数。
    print()
    # 调用函数或对象方法并传入参数。
    if failures:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        print(f"!!! {len(failures)} failures:")
        # 调用函数或对象方法并传入参数。
        for f in failures:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
            print(f"  - {f}")
            # 调用函数或对象方法并传入参数。
        return 1
        # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。
    print(f"=== ALL PASSED ({len(sigs)} read + {len(_cmd_signals)} cmd) ===")
    # 调用函数或对象方法并传入参数。
    return 0
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数。


if __name__ == "__main__":
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    sys.exit(main())
    # 调用函数或对象方法并传入参数。
