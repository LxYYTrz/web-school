# edge/_test_cmd.py 逐行注释

[打开源码](../../../edge/_test_cmd.py) · 229 行 · 166 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 22 行**

```text
import sys
# 注释：从 Python 环境 导入 sys，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 23 行**

```text
import threading
# 注释：从 Python 环境 导入 threading，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 24 行**

```text
import time as _time
# 注释：从 Python 环境 导入 time as _time，供后续代码使用。 关键字：`import`＝导入模块或符号；`as`＝为导入或上下文对象命名。
```

**源码第 25 行**

```text
from pathlib import Path
# 注释：从 pathlib 导入 Path，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 27 行**

```text
sys.path.insert(0, str(Path(__file__).parent))
# 注释：调用函数或对象方法并传入参数。
```

**源码第 29 行**

```text
import plc_collector
# 注释：从 Python 环境 导入 plc_collector，供后续代码使用。 关键字：`import`＝导入模块或符号。
```

**源码第 30 行**

```text
from plc_collector import (
# 注释：从 plc_collector 导入 (，供后续代码使用。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。
```

**源码第 31 行**

```text
    Plc, _read_csv, _cmd_signals, _dispatch_cmd,
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 32 行**

```text
    CMD_DISPATCH, MODE_TOGGLE_VALUE, CONVEYOR_VALUE,
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 33 行**

```text
)
# 注释：结束当前集合、分组或调用参数。
```

**源码第 35 行**

```text
MAPPING = Path(__file__).with_name("register-mapping.csv")
# 注释：给 `MAPPING` 赋值。
```

**源码第 38 行**

```text
NO_PLC_POINT = ("reset", "changeover", "alarm_clear")
# 注释：给 `NO_PLC_POINT` 赋值。
```

**源码第 41 行**

```text
class _FakePlc:
# 注释：定义类 `_FakePlc`。 关键字：`class`＝定义类。
```

**源码第 44 行**

```text
    def __init__(self, connected: bool = True, raise_exc: bool = False):
# 注释：定义函数 `__init__`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例；`True`＝布尔真值；`False`＝布尔假值。
```

**源码第 45 行**

```text
        self.connected = connected
# 注释：把 connected 的结果赋给 self.connected。 关键字：`self`＝当前 Python 实例。
```

**源码第 46 行**

```text
        self.lock = threading.Lock()
# 注释：把 threading.Lock() 的结果赋给 self.lock。 关键字：`self`＝当前 Python 实例。
```

**源码第 47 行**

```text
        self.unit = 2
# 注释：把 2 的结果赋给 self.unit。 关键字：`self`＝当前 Python 实例。
```

**源码第 48 行**

```text
        self.writes: list[tuple[int, int, int]] = []
# 注释：把 [] 的结果赋给 self.writes: list[tuple[int, int, int]]。 关键字：`self`＝当前 Python 实例。
```

**源码第 49 行**

```text
        self._raise = raise_exc
# 注释：把 raise_exc 的结果赋给 self._raise。 关键字：`self`＝当前 Python 实例。
```

**源码第 50 行**

```text
        outer = self
# 注释：给 `outer` 赋值。 关键字：`self`＝当前 Python 实例。
```

**源码第 52 行**

```text
        class _Rr:
# 注释：定义类 `_Rr`。 关键字：`class`＝定义类。
```

**源码第 53 行**

```text
            def __init__(self, err=False):
# 注释：定义函数 `__init__`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例；`False`＝布尔假值。
```

**源码第 54 行**

```text
                self._e = err
# 注释：把 err 的结果赋给 self._e。 关键字：`self`＝当前 Python 实例。
```

**源码第 56 行**

```text
            def isError(self):
# 注释：定义函数 `isError`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。
```

**源码第 57 行**

```text
                return self._e
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`self`＝当前 Python 实例。
```

**源码第 59 行**

```text
        class _Cli:
# 注释：定义类 `_Cli`。 关键字：`class`＝定义类。
```

**源码第 60 行**

```text
            def write_register(_self, address, value, device_id):
# 注释：定义函数 `write_register`。 关键字：`def`＝定义 Python 函数。
```

**源码第 61 行**

```text
                assert outer.lock.locked(), 'PLC 写操作必须持有连接锁'
# 注释：调用 outer.lock.locked；括号中的表达式是传入的参数。 关键字：`assert`＝检查断言条件。
```

**源码第 62 行**

```text
                if outer._raise:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 63 行**

```text
                    raise RuntimeError("mock PLC 故障")
# 注释：把异常交给上层处理。 关键字：`raise`＝抛出 Python 异常。
```

**源码第 64 行**

```text
                outer.writes.append((address, value, device_id))
# 注释：调用函数或对象方法并传入参数。
```

**源码第 65 行**

```text
                return _Rr()
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 67 行**

```text
        self.cli = _Cli()
# 注释：把 _Cli() 的结果赋给 self.cli。 关键字：`self`＝当前 Python 实例。
```

**源码第 70 行**

```text
def main() -> int:
# 注释：定义函数 `main`。 关键字：`def`＝定义 Python 函数。
```

**源码第 71 行**

```text
    sigs = _read_csv(MAPPING)
# 注释：给 `sigs` 赋值。
```

**源码第 72 行**

```text
    read_names = {s.name for s in sigs}
# 注释：给 `read_names` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 73 行**

```text
    failures: list[str] = []
# 注释：给 `failures` 赋值。
```

**源码第 76 行**

```text
    for n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 77 行**

```text
        if n not in _cmd_signals:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 78 行**

```text
            failures.append(f"csv: {n} 应在 _cmd_signals(实际: {sorted(_cmd_signals)})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 79 行**

```text
    for n in ("robot.joints[0]", "line.state"):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 80 行**

```text
        if n not in read_names:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 81 行**

```text
            failures.append(f"csv: {n} 应在读 sigs(实际: {sorted(read_names)})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 84 行**

```text
    expected = {"start", "stop", "reset", "changeover", "mode_set",
# 注释：给 `expected` 赋值。
```

**源码第 85 行**

```text
                "alarm_clear", "conveyor"}
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 86 行**

```text
    if set(CMD_DISPATCH) != expected:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 87 行**

```text
        failures.append(f"CMD_DISPATCH keys={sorted(CMD_DISPATCH)} != {sorted(expected)}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 90 行**

```text
    fake = _FakePlc(connected=False)
# 注释：给 `fake` 赋值。 关键字：`False`＝布尔假值。
```

**源码第 91 行**

```text
    for ct in NO_PLC_POINT:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 92 行**

```text
        ok, msg = _dispatch_cmd(fake, ct, {})
# 注释：把 _dispatch_cmd(fake, ct, {}) 的结果赋给 ok, msg。
```

**源码第 93 行**

```text
        if ok:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 94 行**

```text
            failures.append(f"{ct}: 现场无对应寄存器,应 rejected,却 acked(msg={msg!r})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 95 行**

```text
        elif "无" not in msg or "寄存器" not in msg:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件；`not`＝逻辑否定；`in`＝遍历键或判断成员；`or`＝逻辑或。
```

**源码第 96 行**

```text
            failures.append(f"{ct}: 拒绝原因应说明无寄存器, got msg={msg!r}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 97 行**

```text
        if fake.writes:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 98 行**

```text
            failures.append(f"{ct} 不该写 PLC, got {fake.writes}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 100 行**

```text
    ok, msg = _dispatch_cmd(fake, "fly_to_moon", {})
# 注释：把 _dispatch_cmd(fake, "fly_to_moon", {}) 的结果赋给 ok, msg。
```

**源码第 101 行**

```text
    if ok or "未知" not in msg:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 102 行**

```text
        failures.append(f"fly_to_moon 应 rejected, got (ok={ok}, msg={msg!r})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 105 行**

```text
    for act in ("acquire", "release"):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 106 行**

```text
        fake = _FakePlc(connected=True)
# 注释：给 `fake` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 107 行**

```text
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": act})
# 注释：把 _dispatch_cmd(fake, "mode_set", {"action": act}) 的结果赋给 ok, msg。
```

**源码第 108 行**

```text
        if not ok:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 109 行**

```text
            failures.append(f"mode_set {act} 应 acked, got (ok={ok}, msg={msg!r})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 110 行**

```text
        elif len(fake.writes) != 1:      # PLC 侧自行清零,采集器只写一次
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 111 行**

```text
            failures.append(f"mode_set {act} 应只写 1 次, got {len(fake.writes)}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 112 行**

```text
        elif fake.writes[0][1] != MODE_TOGGLE_VALUE[act]:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 113 行**

```text
            failures.append(f"mode_set {act} 应写 {MODE_TOGGLE_VALUE[act]}, "
# 注释：调用函数或对象方法并传入参数。
```

**源码第 114 行**

```text
                            f"got {fake.writes}")
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 115 行**

```text
        elif fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 116 行**

```text
            failures.append(f"mode_set 写地址错, got {fake.writes[0][0]}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 118 行**

```text
    for bad in ("auto", "", None, 1):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`None`＝空值。
```

**源码第 119 行**

```text
        fake = _FakePlc(connected=False)
# 注释：给 `fake` 赋值。 关键字：`False`＝布尔假值。
```

**源码第 120 行**

```text
        ok, msg = _dispatch_cmd(fake, "mode_set", {"action": bad})
# 注释：把 _dispatch_cmd(fake, "mode_set", {"action": bad}) 的结果赋给 ok, msg。
```

**源码第 121 行**

```text
        if ok or "action" not in msg:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 122 行**

```text
            failures.append(f"mode_set action={bad!r} 应 rejected, "
# 注释：调用函数或对象方法并传入参数。
```

**源码第 123 行**

```text
                            f"got (ok={ok}, msg={msg!r})")
# 注释：调用 got；括号中的表达式是传入的参数。
```

**源码第 126 行**

```text
    for act in ("forward", "stop"):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 127 行**

```text
        fake = _FakePlc(connected=True)
# 注释：给 `fake` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 128 行**

```text
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": act})
# 注释：把 _dispatch_cmd(fake, "conveyor", {"action": act}) 的结果赋给 ok, msg。
```

**源码第 129 行**

```text
        if not ok:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 130 行**

```text
            failures.append(f"conveyor {act} 应 acked, got (ok={ok}, msg={msg!r})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 131 行**

```text
        elif len(fake.writes) != 1:      # 电平型:不自动回 0
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 132 行**

```text
            failures.append(f"conveyor {act} 电平型应只写 1 次, got {len(fake.writes)}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 133 行**

```text
        elif fake.writes[0][1] != CONVEYOR_VALUE[act]:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 134 行**

```text
            failures.append(f"conveyor {act} 应写 {CONVEYOR_VALUE[act]}, "
# 注释：调用函数或对象方法并传入参数。
```

**源码第 135 行**

```text
                            f"got {fake.writes[0][1]}")
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 136 行**

```text
        elif fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 137 行**

```text
            failures.append(f"conveyor 写地址错, got {fake.writes[0][0]}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 139 行**

```text
    for bad in ("reverse", "", None):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`None`＝空值。
```

**源码第 140 行**

```text
        fake = _FakePlc(connected=False)
# 注释：给 `fake` 赋值。 关键字：`False`＝布尔假值。
```

**源码第 141 行**

```text
        ok, msg = _dispatch_cmd(fake, "conveyor", {"action": bad})
# 注释：把 _dispatch_cmd(fake, "conveyor", {"action": bad}) 的结果赋给 ok, msg。
```

**源码第 142 行**

```text
        if ok or "action" not in msg:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 143 行**

```text
            failures.append(f"conveyor action={bad!r} 应 rejected, "
# 注释：调用函数或对象方法并传入参数。
```

**源码第 144 行**

```text
                            f"got (ok={ok}, msg={msg!r})")
# 注释：调用 got；括号中的表达式是传入的参数。
```

**源码第 147 行**

```text
    for ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 148 行**

```text
        fake = _FakePlc(connected=True)
# 注释：给 `fake` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 149 行**

```text
        t0 = _time.time()
# 注释：给 `t0` 赋值。
```

**源码第 150 行**

```text
        ok, msg = _dispatch_cmd(fake, ct, {})
# 注释：把 _dispatch_cmd(fake, ct, {}) 的结果赋给 ok, msg。
```

**源码第 151 行**

```text
        elapsed_ms = (_time.time() - t0) * 1000
# 注释：给 `elapsed_ms` 赋值。
```

**源码第 152 行**

```text
        if not ok:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 153 行**

```text
            failures.append(f"{ct} 真写应 acked, got (ok={ok}, msg={msg!r})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 154 行**

```text
        if len(fake.writes) != 1:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 155 行**

```text
            failures.append(f"{ct} 应只写 1 次(PLC 自行清零), got {fake.writes}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 156 行**

```text
        elif fake.writes[0][1] != 1:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 157 行**

```text
            failures.append(f"{ct} 应写 1, got {fake.writes[0][1]}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 158 行**

```text
        elif fake.writes[0][0] != _cmd_signals[sig_name].address:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。
```

**源码第 159 行**

```text
            failures.append(f"{ct} 写地址错(应 {_cmd_signals[sig_name].address}), "
# 注释：调用函数或对象方法并传入参数。
```

**源码第 160 行**

```text
                            f"got {fake.writes[0][0]}")
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 161 行**

```text
        if elapsed_ms > 50:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 162 行**

```text
            failures.append(f"{ct} 不应再有脉冲 sleep 延时, got {elapsed_ms:.1f}ms")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 165 行**

```text
    fake = _FakePlc(connected=False)
# 注释：给 `fake` 赋值。 关键字：`False`＝布尔假值。
```

**源码第 166 行**

```text
    for ct, params in (("start", {}), ("stop", {}),
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 167 行**

```text
                       ("mode_set", {"action": "acquire"}),
# 注释：开始当前表达式的分组或数组内容。
```

**源码第 168 行**

```text
                       ("conveyor", {"action": "forward"})):
# 注释：开始当前表达式的分组或数组内容。
```

**源码第 169 行**

```text
        ok, msg = _dispatch_cmd(fake, ct, params)
# 注释：把 _dispatch_cmd(fake, ct, params) 的结果赋给 ok, msg。
```

**源码第 170 行**

```text
        if ok or "PLC 未连接" not in msg:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 171 行**

```text
            failures.append(f"PLC 未连接时 {ct} 应 rejected 且提示未连接, "
# 注释：调用函数或对象方法并传入参数。
```

**源码第 172 行**

```text
                            f"got (ok={ok}, msg={msg!r})")
# 注释：调用 got；括号中的表达式是传入的参数。
```

**源码第 173 行**

```text
    if fake.writes:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 174 行**

```text
        failures.append(f"PLC 未连接时不应写 PLC, got {fake.writes}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 177 行**

```text
    fake = _FakePlc(connected=True, raise_exc=True)
# 注释：给 `fake` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 178 行**

```text
    ok, msg = _dispatch_cmd(fake, "start", {})
# 注释：把 _dispatch_cmd(fake, "start", {}) 的结果赋给 ok, msg。
```

**源码第 179 行**

```text
    if ok or "通信异常" not in msg:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。
```

**源码第 180 行**

```text
        failures.append(f"PLC 异常应 rejected, got (ok={ok}, msg={msg!r})")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 183 行**

```text
    read_started = threading.Event()
# 注释：给 `read_started` 赋值。
```

**源码第 184 行**

```text
    release_read = threading.Event()
# 注释：给 `release_read` 赋值。
```

**源码第 185 行**

```text
    write_started = threading.Event()
# 注释：给 `write_started` 赋值。
```

**源码第 187 行**

```text
    class _LockedCli:
# 注释：定义类 `_LockedCli`。 关键字：`class`＝定义类。
```

**源码第 188 行**

```text
        def read_holding_registers(self, address, count, device_id):
# 注释：定义函数 `read_holding_registers`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。
```

**源码第 189 行**

```text
            read_started.set()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 190 行**

```text
            if not release_read.wait(2):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 191 行**

```text
                raise TimeoutError("mock 读超时")
# 注释：把异常交给上层处理。 关键字：`raise`＝抛出 Python 异常。
```

**源码第 192 行**

```text
            return type("Reply", (), {"registers": [0] * count, "isError": lambda self: False})()
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`lambda`＝定义匿名函数；`self`＝当前 Python 实例；`False`＝布尔假值。
```

**源码第 194 行**

```text
        def write_register(self, address, value, device_id):
# 注释：定义函数 `write_register`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。
```

**源码第 195 行**

```text
            write_started.set()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 196 行**

```text
            return type("Reply", (), {"isError": lambda self: False})()
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`lambda`＝定义匿名函数；`self`＝当前 Python 实例；`False`＝布尔假值。
```

**源码第 198 行**

```text
    plc = Plc("127.0.0.1", 503, 2)
# 注释：给 `plc` 赋值。
```

**源码第 199 行**

```text
    plc.cli = _LockedCli()
# 注释：把 _LockedCli() 的结果赋给 plc.cli。
```

**源码第 200 行**

```text
    plc.connected = True
# 注释：把 True 的结果赋给 plc.connected。 关键字：`True`＝布尔真值。
```

**源码第 201 行**

```text
    reader = threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True)
# 注释：给 `reader` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 202 行**

```text
    writer = threading.Thread(target=_dispatch_cmd, args=(plc, "start", {}), daemon=True)
# 注释：给 `writer` 赋值。 关键字：`True`＝布尔真值。
```

**源码第 203 行**

```text
    reader.start()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 204 行**

```text
    if not read_started.wait(1):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 205 行**

```text
        failures.append("读线程未进入 Modbus 调用")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 206 行**

```text
    writer.start()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 207 行**

```text
    if write_started.wait(0.05):
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 208 行**

```text
        failures.append("读操作尚未结束时，写操作进入了同一 Modbus 连接")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 209 行**

```text
    release_read.set()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 210 行**

```text
    reader.join(2)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 211 行**

```text
    writer.join(2)
# 注释：调用函数或对象方法并传入参数。
```

**源码第 212 行**

```text
    if not write_started.is_set():
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。
```

**源码第 213 行**

```text
        failures.append("读操作结束后写操作仍未执行")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 215 行**

```text
    print(f"CMD_DISPATCH types: {sorted(CMD_DISPATCH)}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 216 行**

```text
    print(f"现场可执行: {sorted(set(CMD_DISPATCH) - set(NO_PLC_POINT))}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 217 行**

```text
    print(f"现场无寄存器: {sorted(NO_PLC_POINT)}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 218 行**

```text
    print()
# 注释：调用函数或对象方法并传入参数。
```

**源码第 219 行**

```text
    if failures:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 220 行**

```text
        print(f"!!! {len(failures)} failures:")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 221 行**

```text
        for f in failures:
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。
```

**源码第 222 行**

```text
            print(f"  - {f}")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 223 行**

```text
        return 1
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 224 行**

```text
    print(f"=== ALL PASSED ({len(sigs)} read + {len(_cmd_signals)} cmd) ===")
# 注释：调用函数或对象方法并传入参数。
```

**源码第 225 行**

```text
    return 0
# 注释：从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 228 行**

```text
if __name__ == "__main__":
# 注释：控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。
```

**源码第 229 行**

```text
    sys.exit(main())
# 注释：调用函数或对象方法并传入参数。
```
