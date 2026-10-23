# edge/_test_decode.py 逐行说明

[打开源码](../../../edge/_test_decode.py) · 214 行 · 158 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 15 | <code>import sys</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 16 | <code>from pathlib import Path</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 18 | <code>sys.path.insert(0, str(Path(__file__).parent))</code> | 调用函数或对象方法并传入参数。 |
| 20 | <code>import plc_collector</code> | 加载后续代码需要的模块或符号。 关键字：`import`＝导入模块或符号。 |
| 21 | <code>from plc_collector import _read_csv, decode_signal, STATE_MAP</code> | 加载后续代码需要的模块或符号。 关键字：`from`＝指定导入来源；`import`＝导入模块或符号。 |
| 23 | <code>MAPPING = Path(__file__).with_name("register-mapping.csv")</code> | 给 `MAPPING` 赋值。 |
| 28 | <code>SIM = {</code> | 给 `SIM` 赋值。 |
| 30 | <code>"robot.joints[0]":  450,   # →  45.0°</code> | 续写当前表达式、集合或调用。 |
| 31 | <code>"robot.joints[1]":  -350,  # → -35.0°(负数 INT16)</code> | 续写当前表达式、集合或调用。 |
| 32 | <code>"robot.joints[2]":  421,   # →  42.1°</code> | 续写当前表达式、集合或调用。 |
| 33 | <code>"robot.joints[3]":  0,     # →   0.0°(零值,验证不被 `or` 兜底吞掉)</code> | 续写当前表达式、集合或调用。 |
| 34 | <code>"robot.joints[4]":  880,   # →  88.0°</code> | 续写当前表达式、集合或调用。 |
| 35 | <code>"robot.joints[5]":  -90,   # →  -9.0°</code> | 续写当前表达式、集合或调用。 |
| 37 | <code>"line.state":       2,     # → assembling</code> | 续写当前表达式、集合或调用。 |
| 39 | <code>"io.sensorIn":      1,     # 1=有料</code> | 续写当前表达式、集合或调用。 |
| 40 | <code>"io.sensorArrive":  0,     # 0=无料(0 是合法值,验证不被 `or` 兜底吞成 None)</code> | 续写当前表达式、集合或调用。 |
| 41 | <code>"io.sensorRetreat": 1,     # 1=有料</code> | 续写当前表达式、集合或调用。 |
| 42 | <code>"io.lightColor":    2,     # 2=红灯</code> | 续写当前表达式、集合或调用。 |
| 43 | <code>"io.trayUp":        1,     # 1=上升</code> | 续写当前表达式、集合或调用。 |
| 44 | <code>"io.blockUp":       0,     # 0=下降</code> | 续写当前表达式、集合或调用。 |
| 45 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 48 | <code>STATE_CASES = {</code> | 给 `STATE_CASES` 赋值。 |
| 49 | <code>0:   "waiting_feed",</code> | 续写当前表达式、集合或调用。 |
| 50 | <code>1:   "feeding",</code> | 续写当前表达式、集合或调用。 |
| 51 | <code>2:   "assembling",</code> | 续写当前表达式、集合或调用。 |
| 52 | <code>3:   "waiting_robot",</code> | 续写当前表达式、集合或调用。 |
| 53 | <code>4:   "unload_done",</code> | 续写当前表达式、集合或调用。 |
| 54 | <code>5:   "waiting_next",</code> | 续写当前表达式、集合或调用。 |
| 55 | <code>100: "init_error",</code> | 续写当前表达式、集合或调用。 |
| 56 | <code>101: "stopped",</code> | 续写当前表达式、集合或调用。 |
| 57 | <code>102: "manual_mode",</code> | 续写当前表达式、集合或调用。 |
| 58 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 61 | <code>STATE_FAILURES: list = []</code> | 给 `STATE_FAILURES` 赋值。 |
| 62 | <code>CMD_FAILURES: list = []</code> | 给 `CMD_FAILURES` 赋值。 |
| 63 | <code>IO_FAILURES: list = []</code> | 给 `IO_FAILURES` 赋值。 |
| 66 | <code>def build_regs(value: int, count: int) -&gt; list[int]:</code> | 定义函数 `build_regs`。 关键字：`def`＝定义 Python 函数。 |
| 68 | <code>if count == 1:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 69 | <code>return [value &amp; 0xFFFF]</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 70 | <code>if count == 2:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 71 | <code>u32 = value &amp; 0xFFFFFFFF</code> | 给 `u32` 赋值。 |
| 72 | <code>hi, lo = (u32 &gt;&gt; 16) &amp; 0xFFFF, u32 &amp; 0xFFFF</code> | 续写当前表达式、集合或调用。 |
| 73 | <code>return [lo, hi] if plc_collector.PLC_WORD_ORDER == "LITTLE" else [hi, lo]</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数；`if`＝按条件分支；`else`＝进入另一条件分支。 |
| 74 | <code>raise ValueError(f"count={count} not supported in test")</code> | 把异常交给上层处理。 关键字：`raise`＝抛出 Python 异常。 |
| 77 | <code>def test_decode(failures: list) -&gt; None:</code> | 定义函数 `test_decode`。 关键字：`def`＝定义 Python 函数；`None`＝空值。 |
| 79 | <code>read_sigs = _read_csv(MAPPING)</code> | 给 `read_sigs` 赋值。 |
| 80 | <code>cmd_sigs = plc_collector._cmd_signals</code> | 给 `cmd_sigs` 赋值。 |
| 81 | <code>print(f"loaded {len(read_sigs)} read signals "</code> | 调用函数或对象方法并传入参数。 |
| 82 | <code>f"+ {len(cmd_sigs)} write signals "</code> | 续写当前表达式、集合或调用。 |
| 83 | <code>f"PLC_WORD_ORDER={plc_collector.PLC_WORD_ORDER}\n")</code> | 续写当前表达式、集合或调用。 |
| 85 | <code>for sig in read_sigs:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 86 | <code>if sig.name not in SIM:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定；`in`＝遍历键或判断成员。 |
| 87 | <code>failures.append((sig.name, "SIM 缺样本值", "-", "-"))</code> | 调用函数或对象方法并传入参数。 |
| 88 | <code>print(f"  [FAIL] {sig.name:&lt;22} SIM 表里没有样本值")</code> | 调用函数或对象方法并传入参数。 |
| 89 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 90 | <code>plc_val = SIM[sig.name]</code> | 给 `plc_val` 赋值。 |
| 91 | <code>regs = build_regs(plc_val, sig.count)</code> | 给 `regs` 赋值。 |
| 92 | <code>got = decode_signal(regs, sig)</code> | 给 `got` 赋值。 |
| 93 | <code>expected = plc_val * sig.scale + sig.offset</code> | 给 `expected` 赋值。 |
| 94 | <code>ok = abs(got - expected) &lt; 1e-6</code> | 给 `ok` 赋值。 |
| 95 | <code>print(f"  [{'OK  ' if ok else 'FAIL'}] {sig.name:&lt;22} "</code> | 调用函数或对象方法并传入参数。 |
| 96 | <code>f"type={sig.type:&lt;7} regs={regs} -&gt; {got}")</code> | 续写当前表达式、集合或调用。 |
| 97 | <code>if not ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 98 | <code>failures.append((sig.name, expected, got, regs))</code> | 调用函数或对象方法并传入参数。 |
| 101 | <code>def test_state_map() -&gt; None:</code> | 定义函数 `test_state_map`。 关键字：`def`＝定义 Python 函数；`None`＝空值。 |
| 102 | <code>print("\nstate 枚举覆盖(PLC 整数 → 契约字符串):")</code> | 调用函数或对象方法并传入参数。 |
| 103 | <code>for plc_int, want in sorted(STATE_CASES.items()):</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 104 | <code>got = STATE_MAP.get(plc_int, "offline")</code> | 给 `got` 赋值。 |
| 105 | <code>ok = got == want</code> | 给 `ok` 赋值。 |
| 106 | <code>print(f"  [{'OK  ' if ok else 'FAIL'}] {plc_int:&gt;4} -&gt; {got:&lt;14} (期望 {want})")</code> | 调用函数或对象方法并传入参数。 |
| 107 | <code>if not ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 108 | <code>STATE_FAILURES.append((plc_int, want, got))</code> | 调用函数或对象方法并传入参数。 |
| 111 | <code>def test_cmd_points() -&gt; None:</code> | 定义函数 `test_cmd_points`。 关键字：`def`＝定义 Python 函数；`None`＝空值。 |
| 112 | <code>print("\n控制点位(写命令,不在主循环读取):")</code> | 调用函数或对象方法并传入参数。 |
| 115 | <code>expect = {</code> | 给 `expect` 赋值。 |
| 116 | <code>"cmd.stop": 7,</code> | 续写当前表达式、集合或调用。 |
| 117 | <code>"cmd.modeToggle": 8,</code> | 续写当前表达式、集合或调用。 |
| 118 | <code>"cmd.start": 9,</code> | 续写当前表达式、集合或调用。 |
| 119 | <code>"cmd.conveyor": 10,</code> | 续写当前表达式、集合或调用。 |
| 120 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 121 | <code>for name, want_addr in expect.items():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 122 | <code>s = plc_collector._cmd_signals.get(name)</code> | 给 `s` 赋值。 |
| 123 | <code>if s is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 124 | <code>print(f"  [FAIL] {name:&lt;22} CSV 里缺失")</code> | 调用函数或对象方法并传入参数。 |
| 125 | <code>CMD_FAILURES.append((name, want_addr, "缺失"))</code> | 调用函数或对象方法并传入参数。 |
| 126 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 127 | <code>ok = s.address == want_addr and s.type == "UINT"</code> | 给 `ok` 赋值。 关键字：`and`＝逻辑与。 |
| 128 | <code>print(f"  [{'OK  ' if ok else 'FAIL'}] {name:&lt;22} addr={s.address:&lt;4} "</code> | 调用函数或对象方法并传入参数。 |
| 129 | <code>f"type={s.type:&lt;6} (期望 addr={want_addr}, UINT)")</code> | 续写当前表达式、集合或调用。 |
| 130 | <code>if not ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 131 | <code>CMD_FAILURES.append((name, want_addr, f"{s.address}/{s.type}"))</code> | 调用函数或对象方法并传入参数。 |
| 134 | <code>def test_io_points() -&gt; None:</code> | 定义函数 `test_io_points`。 关键字：`def`＝定义 Python 函数；`None`＝空值。 |
| 136 | <code>print("\n产线 IO 只读点位(写 io_state 报文):")</code> | 调用函数或对象方法并传入参数。 |
| 137 | <code>expect = {</code> | 给 `expect` 赋值。 |
| 138 | <code>"io.sensorIn":      11,</code> | 续写当前表达式、集合或调用。 |
| 139 | <code>"io.sensorArrive":  12,</code> | 续写当前表达式、集合或调用。 |
| 140 | <code>"io.sensorRetreat": 13,</code> | 续写当前表达式、集合或调用。 |
| 141 | <code>"io.lightColor":    14,</code> | 续写当前表达式、集合或调用。 |
| 142 | <code>"io.trayUp":        15,</code> | 续写当前表达式、集合或调用。 |
| 143 | <code>"io.blockUp":       16,</code> | 续写当前表达式、集合或调用。 |
| 144 | <code>}</code> | 续写当前表达式、集合或调用。 |
| 145 | <code>read_sigs = {s.name: s for s in _read_csv(MAPPING)}</code> | 给 `read_sigs` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 146 | <code>for name, want_addr in expect.items():</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 147 | <code>s = read_sigs.get(name)</code> | 给 `s` 赋值。 |
| 148 | <code>if s is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 149 | <code>print(f"  [FAIL] {name:&lt;20} CSV 里缺失")</code> | 调用函数或对象方法并传入参数。 |
| 150 | <code>IO_FAILURES.append((name, want_addr, "缺失"))</code> | 调用函数或对象方法并传入参数。 |
| 151 | <code>continue</code> | 续写当前表达式、集合或调用。 |
| 152 | <code>ok = s.address == want_addr and s.type == "UINT" and s.scale == 1.0</code> | 给 `ok` 赋值。 关键字：`and`＝逻辑与。 |
| 153 | <code>print(f"  [{'OK  ' if ok else 'FAIL'}] {name:&lt;20} addr={s.address:&lt;4} "</code> | 调用函数或对象方法并传入参数。 |
| 154 | <code>f"type={s.type:&lt;6} scale={s.scale} (期望 addr={want_addr}, UINT, ×1)")</code> | 续写当前表达式、集合或调用。 |
| 155 | <code>if not ok:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 156 | <code>IO_FAILURES.append((name, want_addr, f"{s.address}/{s.type}/{s.scale}"))</code> | 调用函数或对象方法并传入参数。 |
| 159 | <code>def test_io_payload() -&gt; None:</code> | 定义函数 `test_io_payload`。 关键字：`def`＝定义 Python 函数；`None`＝空值。 |
| 161 | <code>print("\nio_payload 组装(契约 §3.8):")</code> | 调用函数或对象方法并传入参数。 |
| 162 | <code>signals = [s for s in _read_csv(MAPPING)]</code> | 给 `signals` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 163 | <code>values = {s.name: 1 for s in signals}</code> | 给 `values` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 164 | <code>for s in signals:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 165 | <code>if s.name == "io.sensorArrive":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 166 | <code>values[s.name] = None          # 模拟该点读失败</code> | 续写当前表达式、集合或调用。 关键字：`None`＝空值。 |
| 167 | <code>msg = plc_collector.io_payload(signals, values)</code> | 给 `msg` 赋值。 |
| 168 | <code>if msg is None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`None`＝空值。 |
| 169 | <code>IO_FAILURES.append(("io_payload", "dict", "None"))</code> | 调用函数或对象方法并传入参数。 |
| 170 | <code>print("  [FAIL] 返回 None")</code> | 调用函数或对象方法并传入参数。 |
| 171 | <code>return</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 172 | <code>keys = set(msg["io"])</code> | 给 `keys` 赋值。 |
| 173 | <code>want = {n.split(".", 1)[1] for n in expect_io_names()}</code> | 给 `want` 赋值。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 174 | <code>ok_keys = keys == want</code> | 给 `ok_keys` 赋值。 |
| 175 | <code>ok_none = msg["io"].get("sensorArrive", "missing") is None</code> | 给 `ok_none` 赋值。 关键字：`is`＝比较对象身份或空值；`None`＝空值。 |
| 176 | <code>print(f"  [{'OK  ' if ok_keys else 'FAIL'}] 字段集合 = {sorted(keys)}")</code> | 调用函数或对象方法并传入参数。 |
| 177 | <code>print(f"  [{'OK  ' if ok_none else 'FAIL'}] 读失败的点保留 None(不兜底成 0): "</code> | 调用函数或对象方法并传入参数。 |
| 178 | <code>f"sensorArrive={msg['io'].get('sensorArrive')!r}")</code> | 续写当前表达式、集合或调用。 |
| 179 | <code>if not ok_keys:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 180 | <code>IO_FAILURES.append(("io_payload keys", sorted(want), sorted(keys)))</code> | 调用函数或对象方法并传入参数。 |
| 181 | <code>if not ok_none:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`not`＝逻辑否定。 |
| 182 | <code>IO_FAILURES.append(("io_payload None", None, msg["io"].get("sensorArrive")))</code> | 调用函数或对象方法并传入参数。 关键字：`None`＝空值。 |
| 185 | <code>if plc_collector.io_payload([], {}) is not None:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支；`is`＝比较对象身份或空值；`not`＝逻辑否定；`None`＝空值。 |
| 186 | <code>IO_FAILURES.append(("io_payload 空点位表", None, "应返回 None"))</code> | 调用函数或对象方法并传入参数。 关键字：`None`＝空值。 |
| 189 | <code>def expect_io_names() -&gt; list[str]:</code> | 定义函数 `expect_io_names`。 关键字：`def`＝定义 Python 函数。 |
| 190 | <code>return ["io.sensorIn", "io.sensorArrive", "io.sensorRetreat",</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 191 | <code>"io.lightColor", "io.trayUp", "io.blockUp"]</code> | 续写当前表达式、集合或调用。 |
| 194 | <code>def main() -&gt; int:</code> | 定义函数 `main`。 关键字：`def`＝定义 Python 函数。 |
| 195 | <code>failures: list = []</code> | 给 `failures` 赋值。 |
| 196 | <code>test_decode(failures)</code> | 调用函数或对象方法并传入参数。 |
| 197 | <code>test_state_map()</code> | 调用函数或对象方法并传入参数。 |
| 198 | <code>test_cmd_points()</code> | 调用函数或对象方法并传入参数。 |
| 199 | <code>test_io_points()</code> | 调用函数或对象方法并传入参数。 |
| 200 | <code>test_io_payload()</code> | 调用函数或对象方法并传入参数。 |
| 202 | <code>all_fail = failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES</code> | 给 `all_fail` 赋值。 |
| 203 | <code>print()</code> | 调用函数或对象方法并传入参数。 |
| 204 | <code>if all_fail:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 205 | <code>print(f"!!! {len(all_fail)} failures:")</code> | 调用函数或对象方法并传入参数。 |
| 206 | <code>for name, exp, got, *rest in all_fail:</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`for`＝遍历集合或区间；`in`＝遍历键或判断成员。 |
| 207 | <code>print(f"  {name}: expected {exp}, got {got}")</code> | 调用函数或对象方法并传入参数。 |
| 208 | <code>return 1</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 209 | <code>print("=== ALL PASSED ===")</code> | 调用函数或对象方法并传入参数。 |
| 210 | <code>return 0</code> | 从当前函数返回处理结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 213 | <code>if __name__ == "__main__":</code> | 控制后续缩进代码块的执行条件或顺序。 关键字：`if`＝按条件分支。 |
| 214 | <code>sys.exit(main())</code> | 调用函数或对象方法并传入参数。 |
