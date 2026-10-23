# edge/_test_cmd.py 逐行说明

[打开源码](../../../edge/_test_cmd.py) · 229 行 · 166 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 22 | <code>import sys</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 23 | <code>import threading</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 24 | <code>import time as _time</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号；`as`＝为导入或上下文对象命名。 |
| 25 | <code>from pathlib import Path</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 27 | <code>sys.path.insert(0, str(Path(__file__).parent))</code> | 调用函数或对象方法并传入参数。 |
| 29 | <code>import plc_collector</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 30 | <code>from plc_collector import (</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 31 | <code>Plc, _read_csv, _cmd_signals, _dispatch_cmd,</code> | 续写当前表达式、集合或调用。 |
| 32 | <code>CMD_DISPATCH, MODE_TOGGLE_VALUE, CONVEYOR_VALUE,</code> | 续写当前表达式、集合或调用。 |
| 33 | <code>)</code> | 续写当前表达式、集合或调用。 |
| 35 | <code>MAPPING = Path(__file__).with_name("register-mapping.csv")</code> | 给 `MAPPING` 赋值。 |
| 38 | <code>NO_PLC_POINT = ("reset", "changeover", "alarm_clear")</code> | 给 `NO_PLC_POINT` 赋值。 |
| 41 | <code>class _FakePlc:</code> | 定义类 `_FakePlc`。 关键字：`class`＝定义类。 |
| 44 | <code>def __init__(self, connected: bool = True, raise_exc: bool = False):</code> | 定义函数 `__init__`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例；`True`＝布尔真值；`False`＝布尔假值。 |
| 45 | <code>self.connected = connected</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 46 | <code>self.lock = threading.Lock()</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 47 | <code>self.unit = 2</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 48 | <code>self.writes: list[tuple[int, int, int]] = []</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 49 | <code>self._raise = raise_exc</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 50 | <code>outer = self</code> | 给 `outer` 赋值。 关键字：`self`＝当前 Python 实例。 |
| 52 | <code>class _Rr:</code> | 定义类 `_Rr`。 关键字：`class`＝定义类。 |
| 53 | <code>def __init__(self, err=False):</code> | 定义函数 `__init__`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例；`False`＝布尔假值。 |
| 54 | <code>self._e = err</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 56 | <code>def isError(self):</code> | 定义函数 `isError`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。 |
| 57 | <code>return self._e</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`self`＝当前 Python 实例。 |
| 59 | <code>class _Cli:</code> | 定义类 `_Cli`。 关键字：`class`＝定义类。 |
| 60 | <code>def write_register(_self, address, value, device_id):</code> | 定义函数 `write_register`。 关键字：`def`＝定义 Python 函数。 |
| 61 | <code>assert outer.lock.locked(), 'PLC 写操作必须持有连接锁'</code> | 续写当前表达式、集合或调用。 关键字：`assert`＝检查断言条件。 |
| 62 | <code>if outer._raise:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 63 | <code>raise RuntimeError("mock PLC 故障")</code> | 把异常交给上层处理。 关键字：`raise`＝抛出 Python 异常。 |
| 64 | <code>outer.writes.append((address, value, device_id))</code> | 调用函数或对象方法并传入参数。 |
| 65 | <code>return _Rr()</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 67 | <code>self.cli = _Cli()</code> | 续写当前表达式、集合或调用。 关键字：`self`＝当前 Python 实例。 |
| 70 | <code>def main() -&gt; int:</code> | 定义函数 `main`。 关键字：`def`＝定义 Python 函数。 |
| 71 | <code>sigs = _read_csv(MAPPING)</code> | 给 `sigs` 赋值。 |
| 72 | <code>read_names = {s.name for s in sigs}</code> | 给 `read_names` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 73 | <code>failures: list[str] = []</code> | 给 `failures` 赋值。 |
| 76 | <code>for n in ("cmd.stop", "cmd.modeToggle", "cmd.start", "cmd.conveyor"):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 77 | <code>if n not in _cmd_signals:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 78 | <code>failures.append(f"csv: {n} 应在 _cmd_signals(实际: {sorted(_cmd_signals)})")</code> | 调用函数或对象方法并传入参数。 |
| 79 | <code>for n in ("robot.joints[0]", "line.state"):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 80 | <code>if n not in read_names:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 81 | <code>failures.append(f"csv: {n} 应在读 sigs(实际: {sorted(read_names)})")</code> | 调用函数或对象方法并传入参数。 |
| 84 | <code>expected = {"start", "stop", "reset", "changeover", "mode_set",</code> | 给 `expected` 赋值。 |
| 85 | <code>"alarm_clear", "conveyor"}</code> | 续写当前表达式、集合或调用。 |
| 86 | <code>if set(CMD_DISPATCH) != expected:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 87 | <code>failures.append(f"CMD_DISPATCH keys={sorted(CMD_DISPATCH)} != {sorted(expected)}")</code> | 调用函数或对象方法并传入参数。 |
| 90 | <code>fake = _FakePlc(connected=False)</code> | 给 `fake` 赋值。 关键字：`False`＝布尔假值。 |
| 91 | <code>for ct in NO_PLC_POINT:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 92 | <code>ok, msg = _dispatch_cmd(fake, ct, {})</code> | 续写当前表达式、集合或调用。 |
| 93 | <code>if ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 94 | <code>failures.append(f"{ct}: 现场无对应寄存器,应 rejected,却 acked(msg={msg!r})")</code> | 调用函数或对象方法并传入参数。 |
| 95 | <code>elif "无" not in msg or "寄存器" not in msg:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件；`not`＝逻辑否定；`in`＝遍历键或判断成员；`or`＝逻辑或。 |
| 96 | <code>failures.append(f"{ct}: 拒绝原因应说明无寄存器, got msg={msg!r}")</code> | 调用函数或对象方法并传入参数。 |
| 97 | <code>if fake.writes:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 98 | <code>failures.append(f"{ct} 不该写 PLC, got {fake.writes}")</code> | 调用函数或对象方法并传入参数。 |
| 100 | <code>ok, msg = _dispatch_cmd(fake, "fly_to_moon", {})</code> | 续写当前表达式、集合或调用。 |
| 101 | <code>if ok or "未知" not in msg:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 102 | <code>failures.append(f"fly_to_moon 应 rejected, got (ok={ok}, msg={msg!r})")</code> | 调用函数或对象方法并传入参数。 |
| 105 | <code>for act in ("acquire", "release"):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 106 | <code>fake = _FakePlc(connected=True)</code> | 给 `fake` 赋值。 关键字：`True`＝布尔真值。 |
| 107 | <code>ok, msg = _dispatch_cmd(fake, "mode_set", {"action": act})</code> | 续写当前表达式、集合或调用。 |
| 108 | <code>if not ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 109 | <code>failures.append(f"mode_set {act} 应 acked, got (ok={ok}, msg={msg!r})")</code> | 调用函数或对象方法并传入参数。 |
| 110 | <code>elif len(fake.writes) != 1:      # PLC 侧自行清零,采集器只写一次</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 111 | <code>failures.append(f"mode_set {act} 应只写 1 次, got {len(fake.writes)}")</code> | 调用函数或对象方法并传入参数。 |
| 112 | <code>elif fake.writes[0][1] != MODE_TOGGLE_VALUE[act]:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 113 | <code>failures.append(f"mode_set {act} 应写 {MODE_TOGGLE_VALUE[act]}, "</code> | 调用函数或对象方法并传入参数。 |
| 114 | <code>f"got {fake.writes}")</code> | 续写当前表达式、集合或调用。 |
| 115 | <code>elif fake.writes[0][0] != _cmd_signals["cmd.modeToggle"].address:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 116 | <code>failures.append(f"mode_set 写地址错, got {fake.writes[0][0]}")</code> | 调用函数或对象方法并传入参数。 |
| 118 | <code>for bad in ("auto", "", None, 1):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`None`＝空值。 |
| 119 | <code>fake = _FakePlc(connected=False)</code> | 给 `fake` 赋值。 关键字：`False`＝布尔假值。 |
| 120 | <code>ok, msg = _dispatch_cmd(fake, "mode_set", {"action": bad})</code> | 续写当前表达式、集合或调用。 |
| 121 | <code>if ok or "action" not in msg:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 122 | <code>failures.append(f"mode_set action={bad!r} 应 rejected, "</code> | 调用函数或对象方法并传入参数。 |
| 123 | <code>f"got (ok={ok}, msg={msg!r})")</code> | 续写当前表达式、集合或调用。 |
| 126 | <code>for act in ("forward", "stop"):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 127 | <code>fake = _FakePlc(connected=True)</code> | 给 `fake` 赋值。 关键字：`True`＝布尔真值。 |
| 128 | <code>ok, msg = _dispatch_cmd(fake, "conveyor", {"action": act})</code> | 续写当前表达式、集合或调用。 |
| 129 | <code>if not ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 130 | <code>failures.append(f"conveyor {act} 应 acked, got (ok={ok}, msg={msg!r})")</code> | 调用函数或对象方法并传入参数。 |
| 131 | <code>elif len(fake.writes) != 1:      # 电平型:不自动回 0</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 132 | <code>failures.append(f"conveyor {act} 电平型应只写 1 次, got {len(fake.writes)}")</code> | 调用函数或对象方法并传入参数。 |
| 133 | <code>elif fake.writes[0][1] != CONVEYOR_VALUE[act]:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 134 | <code>failures.append(f"conveyor {act} 应写 {CONVEYOR_VALUE[act]}, "</code> | 调用函数或对象方法并传入参数。 |
| 135 | <code>f"got {fake.writes[0][1]}")</code> | 续写当前表达式、集合或调用。 |
| 136 | <code>elif fake.writes[0][0] != _cmd_signals["cmd.conveyor"].address:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 137 | <code>failures.append(f"conveyor 写地址错, got {fake.writes[0][0]}")</code> | 调用函数或对象方法并传入参数。 |
| 139 | <code>for bad in ("reverse", "", None):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员；`None`＝空值。 |
| 140 | <code>fake = _FakePlc(connected=False)</code> | 给 `fake` 赋值。 关键字：`False`＝布尔假值。 |
| 141 | <code>ok, msg = _dispatch_cmd(fake, "conveyor", {"action": bad})</code> | 续写当前表达式、集合或调用。 |
| 142 | <code>if ok or "action" not in msg:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 143 | <code>failures.append(f"conveyor action={bad!r} 应 rejected, "</code> | 调用函数或对象方法并传入参数。 |
| 144 | <code>f"got (ok={ok}, msg={msg!r})")</code> | 续写当前表达式、集合或调用。 |
| 147 | <code>for ct, sig_name in (("start", "cmd.start"), ("stop", "cmd.stop")):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 148 | <code>fake = _FakePlc(connected=True)</code> | 给 `fake` 赋值。 关键字：`True`＝布尔真值。 |
| 149 | <code>t0 = _time.time()</code> | 给 `t0` 赋值。 |
| 150 | <code>ok, msg = _dispatch_cmd(fake, ct, {})</code> | 续写当前表达式、集合或调用。 |
| 151 | <code>elapsed_ms = (_time.time() - t0) * 1000</code> | 给 `elapsed_ms` 赋值。 |
| 152 | <code>if not ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 153 | <code>failures.append(f"{ct} 真写应 acked, got (ok={ok}, msg={msg!r})")</code> | 调用函数或对象方法并传入参数。 |
| 154 | <code>if len(fake.writes) != 1:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 155 | <code>failures.append(f"{ct} 应只写 1 次(PLC 自行清零), got {fake.writes}")</code> | 调用函数或对象方法并传入参数。 |
| 156 | <code>elif fake.writes[0][1] != 1:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 157 | <code>failures.append(f"{ct} 应写 1, got {fake.writes[0][1]}")</code> | 调用函数或对象方法并传入参数。 |
| 158 | <code>elif fake.writes[0][0] != _cmd_signals[sig_name].address:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`elif`＝检查下一条件。 |
| 159 | <code>failures.append(f"{ct} 写地址错(应 {_cmd_signals[sig_name].address}), "</code> | 调用函数或对象方法并传入参数。 |
| 160 | <code>f"got {fake.writes[0][0]}")</code> | 续写当前表达式、集合或调用。 |
| 161 | <code>if elapsed_ms &gt; 50:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 162 | <code>failures.append(f"{ct} 不应再有脉冲 sleep 延时, got {elapsed_ms:.1f}ms")</code> | 调用函数或对象方法并传入参数。 |
| 165 | <code>fake = _FakePlc(connected=False)</code> | 给 `fake` 赋值。 关键字：`False`＝布尔假值。 |
| 166 | <code>for ct, params in (("start", {}), ("stop", {}),</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 167 | <code>("mode_set", {"action": "acquire"}),</code> | 续写当前表达式、集合或调用。 |
| 168 | <code>("conveyor", {"action": "forward"})):</code> | 续写当前表达式、集合或调用。 |
| 169 | <code>ok, msg = _dispatch_cmd(fake, ct, params)</code> | 续写当前表达式、集合或调用。 |
| 170 | <code>if ok or "PLC 未连接" not in msg:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 171 | <code>failures.append(f"PLC 未连接时 {ct} 应 rejected 且提示未连接, "</code> | 调用函数或对象方法并传入参数。 |
| 172 | <code>f"got (ok={ok}, msg={msg!r})")</code> | 续写当前表达式、集合或调用。 |
| 173 | <code>if fake.writes:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 174 | <code>failures.append(f"PLC 未连接时不应写 PLC, got {fake.writes}")</code> | 调用函数或对象方法并传入参数。 |
| 177 | <code>fake = _FakePlc(connected=True, raise_exc=True)</code> | 给 `fake` 赋值。 关键字：`True`＝布尔真值。 |
| 178 | <code>ok, msg = _dispatch_cmd(fake, "start", {})</code> | 续写当前表达式、集合或调用。 |
| 179 | <code>if ok or "通信异常" not in msg:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`or`＝逻辑或；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 180 | <code>failures.append(f"PLC 异常应 rejected, got (ok={ok}, msg={msg!r})")</code> | 调用函数或对象方法并传入参数。 |
| 183 | <code>read_started = threading.Event()</code> | 给 `read_started` 赋值。 |
| 184 | <code>release_read = threading.Event()</code> | 给 `release_read` 赋值。 |
| 185 | <code>write_started = threading.Event()</code> | 给 `write_started` 赋值。 |
| 187 | <code>class _LockedCli:</code> | 定义类 `_LockedCli`。 关键字：`class`＝定义类。 |
| 188 | <code>def read_holding_registers(self, address, count, device_id):</code> | 定义函数 `read_holding_registers`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。 |
| 189 | <code>read_started.set()</code> | 调用函数或对象方法并传入参数。 |
| 190 | <code>if not release_read.wait(2):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 191 | <code>raise TimeoutError("mock 读超时")</code> | 把异常交给上层处理。 关键字：`raise`＝抛出 Python 异常。 |
| 192 | <code>return type("Reply", (), {"registers": [0] * count, "isError": lambda self: False})()</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`lambda`＝定义匿名函数；`self`＝当前 Python 实例；`False`＝布尔假值。 |
| 194 | <code>def write_register(self, address, value, device_id):</code> | 定义函数 `write_register`。 关键字：`def`＝定义 Python 函数；`self`＝当前 Python 实例。 |
| 195 | <code>write_started.set()</code> | 调用函数或对象方法并传入参数。 |
| 196 | <code>return type("Reply", (), {"isError": lambda self: False})()</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`lambda`＝定义匿名函数；`self`＝当前 Python 实例；`False`＝布尔假值。 |
| 198 | <code>plc = Plc("127.0.0.1", 503, 2)</code> | 给 `plc` 赋值。 |
| 199 | <code>plc.cli = _LockedCli()</code> | 续写当前表达式、集合或调用。 |
| 200 | <code>plc.connected = True</code> | 续写当前表达式、集合或调用。 关键字：`True`＝布尔真值。 |
| 201 | <code>reader = threading.Thread(target=plc.read_all, args=([sigs[0]],), daemon=True)</code> | 给 `reader` 赋值。 关键字：`True`＝布尔真值。 |
| 202 | <code>writer = threading.Thread(target=_dispatch_cmd, args=(plc, "start", {}), daemon=True)</code> | 给 `writer` 赋值。 关键字：`True`＝布尔真值。 |
| 203 | <code>reader.start()</code> | 调用函数或对象方法并传入参数。 |
| 204 | <code>if not read_started.wait(1):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 205 | <code>failures.append("读线程未进入 Modbus 调用")</code> | 调用函数或对象方法并传入参数。 |
| 206 | <code>writer.start()</code> | 调用函数或对象方法并传入参数。 |
| 207 | <code>if write_started.wait(0.05):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 208 | <code>failures.append("读操作尚未结束时，写操作进入了同一 Modbus 连接")</code> | 调用函数或对象方法并传入参数。 |
| 209 | <code>release_read.set()</code> | 调用函数或对象方法并传入参数。 |
| 210 | <code>reader.join(2)</code> | 调用函数或对象方法并传入参数。 |
| 211 | <code>writer.join(2)</code> | 调用函数或对象方法并传入参数。 |
| 212 | <code>if not write_started.is_set():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 213 | <code>failures.append("读操作结束后写操作仍未执行")</code> | 调用函数或对象方法并传入参数。 |
| 215 | <code>print(f"CMD_DISPATCH types: {sorted(CMD_DISPATCH)}")</code> | 调用函数或对象方法并传入参数。 |
| 216 | <code>print(f"现场可执行: {sorted(set(CMD_DISPATCH) - set(NO_PLC_POINT))}")</code> | 调用函数或对象方法并传入参数。 |
| 217 | <code>print(f"现场无寄存器: {sorted(NO_PLC_POINT)}")</code> | 调用函数或对象方法并传入参数。 |
| 218 | <code>print()</code> | 调用函数或对象方法并传入参数。 |
| 219 | <code>if failures:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 220 | <code>print(f"!!! {len(failures)} failures:")</code> | 调用函数或对象方法并传入参数。 |
| 221 | <code>for f in failures:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 222 | <code>print(f"  - {f}")</code> | 调用函数或对象方法并传入参数。 |
| 223 | <code>return 1</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 224 | <code>print(f"=== ALL PASSED ({len(sigs)} read + {len(_cmd_signals)} cmd) ===")</code> | 调用函数或对象方法并传入参数。 |
| 225 | <code>return 0</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 228 | <code>if __name__ == "__main__":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 229 | <code>sys.exit(main())</code> | 调用函数或对象方法并传入参数。 |
