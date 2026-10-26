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
# 这一段负责验证寄存器解码、工序映射和 IO 报文契约，为后续代码提供当前文件的处理入口。
import sys
# 从 Python 环境 导入 sys，供后续代码使用。
# sys：来自 sys，Python 运行环境与退出状态接口
from pathlib import Path
# 从 pathlib 导入 Path，供后续代码使用。
# Path：来自 pathlib，pathlib 的文件路径类

sys.path.insert(0, str(Path(__file__).parent))
# 将本行提供的值插入列表或搜索路径的指定位置。
# sys：Python 运行环境与退出状态接口；Path：pathlib 的文件路径类

import plc_collector
# 从 Python 环境 导入 plc_collector，供后续代码使用。
# plc_collector：来自 plc_collector，供本文件后续调用的对象
from plc_collector import _read_csv, decode_signal, STATE_MAP
# 从 plc_collector 导入 _read_csv, decode_signal, STATE_MAP，供后续代码使用。
# _read_csv：来自 plc_collector，供本文件后续调用的对象；decode_signal：来自 plc_collector，供本文件后续调用的对象；STATE_MAP：来自 plc_collector，供本文件后续调用的对象

MAPPING = Path(__file__).with_name("register-mapping.csv")
# 将字符串或父路径构造成可操作的文件路径对象，将结果保存或写入 MAPPING。
# MAPPING：保存 Path(__file__).with_name('register-mapping.csv') 的结果；with_name：保留父目录，仅替换路径中的文件名；Path：pathlib 的文件路径类


# 模拟 PLC 寄存器快照(单位:PLC 端实际存储的值,已含 ×10 等缩放因子)
# 只列主循环读取点位(word 0..6 与 11..16);cmd.* 由 _test_cmd.py 覆盖
SIM = {
# 根据 { 设置 SIM，供当前流程后续使用。
# SIM：保存 {'robot.joints[0]': 450, 'robot.joints[1]': -350, 'robot.joints[2]': 4… 的结果
    # 六轴关节角 deg(PLC ×10 存储,INT16 带符号;正/负/零各覆盖)
    "robot.joints[0]":  450,   # →  45.0°
    # 在当前模拟输入或配置映射中，将键 robot.joints[0] 设为 450。
    # robot.joints[0] 是模拟机器人对应关节的 PLC 原始读数；450 是该测试场景给定的寄存器值
    "robot.joints[1]":  -350,  # → -35.0°(负数 INT16)
    # 在当前模拟输入或配置映射中，将键 robot.joints[1] 设为 -350。
    # robot.joints[1] 是模拟机器人对应关节的 PLC 原始读数；-350 是该测试场景给定的寄存器值
    "robot.joints[2]":  421,   # →  42.1°
    # 在当前模拟输入或配置映射中，将键 robot.joints[2] 设为 421。
    # robot.joints[2] 是模拟机器人对应关节的 PLC 原始读数；421 是该测试场景给定的寄存器值
    "robot.joints[3]":  0,     # →   0.0°(零值,验证不被 `or` 兜底吞掉)
    # 在当前模拟输入或配置映射中，将键 robot.joints[3] 设为 0。
    # robot.joints[3] 是模拟机器人对应关节的 PLC 原始读数；0 是该测试场景给定的寄存器值
    "robot.joints[4]":  880,   # →  88.0°
    # 在当前模拟输入或配置映射中，将键 robot.joints[4] 设为 880。
    # robot.joints[4] 是模拟机器人对应关节的 PLC 原始读数；880 是该测试场景给定的寄存器值
    "robot.joints[5]":  -90,   # →  -9.0°
    # 在当前模拟输入或配置映射中，将键 robot.joints[5] 设为 -90。
    # robot.joints[5] 是模拟机器人对应关节的 PLC 原始读数；-90 是该测试场景给定的寄存器值
    # 产线状态(UINT,覆盖全部 10 个枚举 + 边界)
    "line.state":       2,     # → assembling
    # 在当前模拟输入或配置映射中，将键 line.state 设为 2。
    # line.state 是当前映射表的查找键；2 是用该键读取时取得的值
    # 产线 IO 只读点(UINT;覆盖 0 / 1 / 枚举上界)
    "io.sensorIn":      1,     # 1=有料
    # 在当前模拟输入或配置映射中，将键 io.sensorIn 设为 1。
    # io.sensorIn 是模拟 IO 点位的寄存器键；1 是该点位在当前测试中的原始值
    "io.sensorArrive":  0,     # 0=无料(0 是合法值,验证不被 `or` 兜底吞成 None)
    # 在当前模拟输入或配置映射中，将键 io.sensorArrive 设为 0。
    # io.sensorArrive 是模拟 IO 点位的寄存器键；0 是该点位在当前测试中的原始值
    "io.sensorRetreat": 1,     # 1=有料
    # 在当前模拟输入或配置映射中，将键 io.sensorRetreat 设为 1。
    # io.sensorRetreat 是模拟 IO 点位的寄存器键；1 是该点位在当前测试中的原始值
    "io.lightColor":    2,     # 2=红灯
    # 在当前模拟输入或配置映射中，将键 io.lightColor 设为 2。
    # io.lightColor 是模拟 IO 点位的寄存器键；2 是该点位在当前测试中的原始值
    "io.trayUp":        1,     # 1=上升
    # 在当前模拟输入或配置映射中，将键 io.trayUp 设为 1。
    # io.trayUp 是模拟 IO 点位的寄存器键；1 是该点位在当前测试中的原始值
    "io.blockUp":       0,     # 0=下降
    # 在当前模拟输入或配置映射中，将键 io.blockUp 设为 0。
    # io.blockUp 是模拟 IO 点位的寄存器键；0 是该点位在当前测试中的原始值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 本行结束上面最近一层已经介绍的表达式或代码块

# state 枚举覆盖表:PLC 整数 → 期望契约字符串
STATE_CASES = {
# 根据 { 设置 STATE_CASES，供当前流程后续使用。
# STATE_CASES：保存 {0: 'waiting_feed', 1: 'feeding', 2: 'assembling', 3: 'waiting_robot',… 的结果
    0:   "waiting_feed",
    # state 枚举覆盖表:PLC 整数 → 期望契约字符串。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    1:   "feeding",
    # 设置字段 1，值为 "feeding"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    2:   "assembling",
    # 设置字段 2，值为 "assembling"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    3:   "waiting_robot",
    # 设置字段 3，值为 "waiting_robot"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    4:   "unload_done",
    # 设置字段 4，值为 "unload_done"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    5:   "waiting_next",
    # 设置字段 5，值为 "waiting_next"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    100: "init_error",
    # 设置字段 100，值为 "init_error"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    101: "stopped",
    # 设置字段 101，值为 "stopped"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    102: "manual_mode",
    # 设置字段 102，值为 "manual_mode"，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 本行结束上面最近一层已经介绍的表达式或代码块


STATE_FAILURES: list = []
# 给 STATE_FAILURES 赋值，供当前处理流程继续使用。
# STATE_FAILURES：本处声明的局部变量，类型为 list
CMD_FAILURES: list = []
# 给 CMD_FAILURES 赋值，供当前处理流程继续使用。
# CMD_FAILURES：本处声明的局部变量，类型为 list
IO_FAILURES: list = []
# 给 IO_FAILURES 赋值，供当前处理流程继续使用。
# IO_FAILURES：本处声明的局部变量，类型为 list


# 这一段定义 build_regs，用于将测试数值拆分为指定数量的 16 位寄存器。
def build_regs(value: int, count: int) -> list[int]:
# 定义函数 build_regs。
# build_regs：将测试数值拆分为指定数量的 16 位寄存器；value：当前字段或点位的实际取值；count：本次读取或数据结构声明的数量
    """把"实际 PLC 值"拆成 Modbus 寄存器 word。"""
    if count == 1:
    # 检查count == 1:，按判断结果进入对应的处理分支。
    # count：本次读取或数据结构声明的数量，本次传入 = 1:
        return [value & 0xFFFF]
        # 把[value & 0xFFFF]作为当前函数的结果返回。
        # value：当前字段或点位的实际取值
    if count == 2:
    # 检查count == 2:，按判断结果进入对应的处理分支。
    # count：本次读取或数据结构声明的数量，本次传入 = 2:
        u32 = value & 0xFFFFFFFF
        # 根据 value & 0xFFFFFFFF 设置 u32，供当前流程后续使用。
        # u32：保存 value & 4294967295 的结果；value：当前字段或点位的实际取值
        hi, lo = (u32 >> 16) & 0xFFFF, u32 & 0xFFFF
        # 把 (u32 >> 16) & 0xFFFF, u32 & 0xFFFF 的结果赋给 hi, lo。
        # hi：保存 (u32 >> 16 & 65535, u32 & 65535) 的结果；lo：保存 (u32 >> 16 & 65535, u32 & 65535) 的结果；u32：保存 value & 4294967295 的结果
        return [lo, hi] if plc_collector.PLC_WORD_ORDER == "LITTLE" else [hi, lo]
        # 把[lo, hi] if plc_collector.PLC_WORD_ORDER == "LITTLE" else [hi, lo]作为当前函数的结果返回。
        # lo：保存 (u32 >> 16 & 65535, u32 & 65535) 的结果；hi：保存 (u32 >> 16 & 65535, u32 & 65535) 的结果；plc_collector：从 plc_collector 导入的模块，类型为 plc_collector
    raise ValueError(f"count={count} not supported in test")
    # 按本行指定的错误类型或信息终止当前处理并交给上层处理。
    # count：本次读取或数据结构声明的数量，本次传入 {count} not supported in test"
    # 这一段实现了将测试数值拆分为指定数量的 16 位寄存器；返回值或异常由调用方按当前分支处理。


# 这一段定义 test_decode，用于检查各配置点位的寄存器解码结果是否符合预期。
def test_decode(failures: list) -> None:
# 定义函数 test_decode。
# test_decode：检查各配置点位的寄存器解码结果是否符合预期；failures：方法输入参数，类型为 list
    # _read_csv() 只返回主循环读取点位(cmd.* 在模块加载时进 _cmd_signals)
    read_sigs = _read_csv(MAPPING)
    # 读取点位映射表，将可读信号与控制写点分开保存，将结果保存或写入 read_sigs。
    # read_sigs：保存 _read_csv(MAPPING) 的结果；_read_csv：读取点位映射表，将可读信号与控制写点分开保存；MAPPING：保存 Path(__file__).with_name('register-mapping.csv') 的结果
    cmd_sigs = plc_collector._cmd_signals
    # 根据 plc_collector._cmd_signals 设置 cmd_sigs，供当前流程后续使用。
    # cmd_sigs：保存 plc_collector._cmd_signals 的结果；plc_collector：从 plc_collector 导入的模块，类型为 plc_collector
    print(f"loaded {len(read_sigs)} read signals "
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # read_sigs：保存 _read_csv(MAPPING) 的结果；read：读取下一块流数据或当前资源内容
          f"+ {len(cmd_sigs)} write signals "
          # 调用 len；括号中的表达式是传入的参数，供当前处理流程继续使用。
          # cmd_sigs：保存 plc_collector._cmd_signals 的结果
          f"PLC_WORD_ORDER={plc_collector.PLC_WORD_ORDER}\n")
          # 根据 {plc_collector.PLC_WORD_ORDER}\n") 设置 f"PLC_WORD_ORDER，供当前流程后续使用。
          # plc_collector：从 plc_collector 导入的模块，类型为 plc_collector

    for sig in read_sigs:
    # 循环处理sig in read_sigs:，按判断结果进入对应的处理分支。
    # sig：逐项遍历 read_sigs 的当前元素；read_sigs：保存 _read_csv(MAPPING) 的结果
        if sig.name not in SIM:
        # 检查sig.name not in SIM:，按判断结果进入对应的处理分支。
        # sig：逐项遍历 read_sigs 的当前元素；name：当前对象的名称字段；SIM：保存 {'robot.joints[0]': 450, 'robot.joints[1]': -350, 'robot.joints[2]': 4… 的结果
            failures.append((sig.name, "SIM 缺样本值", "-", "-"))
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：方法输入参数，类型为 list；name：当前对象的名称字段；sig：逐项遍历 read_sigs 的当前元素
            print(f"  [FAIL] {sig.name:<22} SIM 表里没有样本值")
            # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
            # name：当前对象的名称字段；sig：逐项遍历 read_sigs 的当前元素
            continue
            # 跳过本轮剩余语句，进入下一次循环。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        plc_val = SIM[sig.name]
        # 根据 SIM[sig.name] 设置 plc_val，供当前流程后续使用。
        # plc_val：保存 SIM[sig.name] 的结果；SIM：保存 {'robot.joints[0]': 450, 'robot.joints[1]': -350, 'robot.joints[2]': 4… 的结果；name：当前对象的名称字段；sig：逐项遍历 read_sigs 的当前元素
        regs = build_regs(plc_val, sig.count)
        # 将测试数值拆分为指定数量的 16 位寄存器，将结果保存或写入 regs。
        # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组；build_regs：将测试数值拆分为指定数量的 16 位寄存器；plc_val：保存 SIM[sig.name] 的结果；count：本次读取或数据结构声明的数量；sig：逐项遍历 read_sigs 的当前元素
        got = decode_signal(regs, sig)
        # 按点位配置把寄存器原始值解码为物理量，将结果保存或写入 got。
        # got：保存 decode_signal(regs, sig) 的结果；decode_signal：按点位类型、偏移和缩放系数把原始寄存器转换为物理量；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组；sig：逐项遍历 read_sigs 的当前元素
        expected = plc_val * sig.scale + sig.offset
        # 根据 plc_val * sig.scale + sig.offset 设置 expected，供当前流程后续使用。
        # expected：保存 plc_val * sig.scale + sig.offset 的结果；offset：点位原始值转换前使用的偏移量；plc_val：保存 SIM[sig.name] 的结果；scale：原始数值转换为实际物理量的缩放系数；sig：逐项遍历 read_sigs 的当前元素
        ok = abs(got - expected) < 1e-6
        # 执行 abs 对应的本地处理，使用本行提供的数据，将结果保存或写入 ok。
        # ok：操作是否成功的布尔结果；got：保存 decode_signal(regs, sig) 的结果；expected：保存 plc_val * sig.scale + sig.offset 的结果
        print(f"  [{'OK  ' if ok else 'FAIL'}] {sig.name:<22} "
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # ok：操作是否成功的布尔结果；sig：逐项遍历 read_sigs 的当前元素；name：当前对象的名称字段
              f"type={sig.type:<7} regs={regs} -> {got}")
              # 根据 {sig.type:<7} regs={regs} -> {got}") 设置 f"type，供当前流程后续使用。
              # sig：逐项遍历 read_sigs 的当前元素；type：当前报文、指令或对象的类别字段，本次传入 {sig.type:<7} regs={regs} -> {got}"；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组，本次传入 {regs} -> {got}"；got：保存 decode_signal(regs, sig) 的结果
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            failures.append((sig.name, expected, got, regs))
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；failures：方法输入参数，类型为 list；name：当前对象的名称字段；expected：保存 plc_val * sig.scale + sig.offset 的结果；got：保存 decode_signal(regs, sig) 的结果；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组；sig：逐项遍历 read_sigs 的当前元素
            # 这一段实现了检查各配置点位的寄存器解码结果是否符合预期；返回值或异常由调用方按当前分支处理。


# 这一段定义 test_state_map，用于核对 PLC 数字状态码到契约状态名的映射。
def test_state_map() -> None:
# 定义函数 test_state_map。
# test_state_map：核对 PLC 数字状态码到契约状态名的映射
    print("\nstate 枚举覆盖(PLC 整数 → 契约字符串):")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    for plc_int, want in sorted(STATE_CASES.items()):
    # 循环处理plc_int, want in sorted(STATE_CASES.items()):，按判断结果进入对应的处理分支。
    # plc_int：逐项遍历 sorted(STATE_CASES.items()) 的当前元素；want：逐项遍历 sorted(STATE_CASES.items()) 的当前元素；STATE_CASES：保存 {0: 'waiting_feed', 1: 'feeding', 2: 'assembling', 3: 'waiting_robot',… 的结果；items：取得字典的键值对迭代器
        got = STATE_MAP.get(plc_int, "offline")
        # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 got。
        # got：保存 STATE_MAP.get(plc_int, 'offline') 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；plc_int：逐项遍历 sorted(STATE_CASES.items()) 的当前元素；STATE_MAP：从 plc_collector 导入的对象，类型为 plc_collector
        ok = got == want
        # 根据 got == want 设置 ok，用于操作是否成功的布尔结果。
        # ok：操作是否成功的布尔结果；got：保存 STATE_MAP.get(plc_int, 'offline') 的结果；want：逐项遍历 sorted(STATE_CASES.items()) 的当前元素
        print(f"  [{'OK  ' if ok else 'FAIL'}] {plc_int:>4} -> {got:<14} (期望 {want})")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # plc_int：逐项遍历 sorted(STATE_CASES.items()) 的当前元素；got：保存 STATE_MAP.get(plc_int, 'offline') 的结果；want：逐项遍历 sorted(STATE_CASES.items()) 的当前元素；ok：操作是否成功的布尔结果
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            STATE_FAILURES.append((plc_int, want, got))
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；STATE_FAILURES：本处声明的局部变量，类型为 list；plc_int：逐项遍历 sorted(STATE_CASES.items()) 的当前元素；want：逐项遍历 sorted(STATE_CASES.items()) 的当前元素；got：保存 STATE_MAP.get(plc_int, 'offline') 的结果
            # 这一段实现了核对 PLC 数字状态码到契约状态名的映射；返回值或异常由调用方按当前分支处理。


# 这一段定义 test_cmd_points，用于核对四个现场控制点的地址和类型。
def test_cmd_points() -> None:
# 定义函数 test_cmd_points。
# test_cmd_points：核对四个现场控制点的地址和类型
    print("\n控制点位(写命令,不在主循环读取):")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    # cmd.* 由 plc_collector 在模块加载时单独解析进 _cmd_signals,
    # _read_csv() 返回的列表只含主循环读取点位,所以这里查 _cmd_signals。
    expect = {
    # 根据 { 设置 expect，供当前流程后续使用。
    # expect：保存 {'cmd.stop': 7, 'cmd.modeToggle': 8, 'cmd.start': 9, 'cmd.conveyor': 1… 的结果
        "cmd.stop": 7,
        # 在当前模拟输入或配置映射中，将键 cmd.stop 设为 7。
        # cmd.stop 是可写控制点位的映射键；7 是它对应的寄存器地址
        "cmd.modeToggle": 8,
        # 在当前模拟输入或配置映射中，将键 cmd.modeToggle 设为 8。
        # cmd.modeToggle 是可写控制点位的映射键；8 是它对应的寄存器地址
        "cmd.start": 9,
        # 在当前模拟输入或配置映射中，将键 cmd.start 设为 9。
        # cmd.start 是可写控制点位的映射键；9 是它对应的寄存器地址
        "cmd.conveyor": 10,
        # 在当前模拟输入或配置映射中，将键 cmd.conveyor 设为 10。
        # cmd.conveyor 是可写控制点位的映射键；10 是它对应的寄存器地址
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 本行结束上面最近一层已经介绍的表达式或代码块
    for name, want_addr in expect.items():
    # 循环处理name, want_addr in expect.items():，按判断结果进入对应的处理分支。
    # name：当前对象的名称字段；want_addr：逐项遍历 expect.items() 的当前元素；expect：保存 {'cmd.stop': 7, 'cmd.modeToggle': 8, 'cmd.start': 9, 'cmd.conveyor': 1… 的结果；items：取得字典的键值对迭代器
        s = plc_collector._cmd_signals.get(name)
        # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 s。
        # s：保存 plc_collector._cmd_signals.get(name) 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；name：当前对象的名称字段；plc_collector：从 plc_collector 导入的模块，类型为 plc_collector
        if s is None:
        # 检查s is None:，按判断结果进入对应的处理分支。
        # s：保存 plc_collector._cmd_signals.get(name) 的结果
            print(f"  [FAIL] {name:<22} CSV 里缺失")
            # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
            # name：当前对象的名称字段
            CMD_FAILURES.append((name, want_addr, "缺失"))
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；CMD_FAILURES：本处声明的局部变量，类型为 list；name：当前对象的名称字段；want_addr：逐项遍历 expect.items() 的当前元素
            continue
            # 跳过本轮剩余语句，进入下一次循环。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        ok = s.address == want_addr and s.type == "UINT"
        # 根据 s.address == want_addr and s.type == "UINT" 设置 ok，用于操作是否成功的布尔结果。
        # ok：操作是否成功的布尔结果；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 = want_addr and s.type == "UINT"；want_addr：逐项遍历 expect.items() 的当前元素；type：当前报文、指令或对象的类别字段，本次传入 = "UINT"；s：保存 plc_collector._cmd_signals.get(name) 的结果
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<22} addr={s.address:<4} "
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # ok：操作是否成功的布尔结果；name：当前对象的名称字段；s：保存 plc_collector._cmd_signals.get(name) 的结果；address：Modbus 寄存器起始地址，使用从 0 开始的编号
              f"type={s.type:<6} (期望 addr={want_addr}, UINT)")
              # 根据 {s.type:<6} (期望 addr={want_addr}, UINT)") 设置 f"type，供当前流程后续使用。
              # s：保存 plc_collector._cmd_signals.get(name) 的结果；type：当前报文、指令或对象的类别字段，本次传入 {s.type:<6} (期望 addr={want_addr}；want_addr：逐项遍历 expect.items() 的当前元素
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            CMD_FAILURES.append((name, want_addr, f"{s.address}/{s.type}"))
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；CMD_FAILURES：本处声明的局部变量，类型为 list；name：当前对象的名称字段；want_addr：逐项遍历 expect.items() 的当前元素；address：Modbus 寄存器起始地址，使用从 0 开始的编号；type：当前报文、指令或对象的类别字段；s：保存 plc_collector._cmd_signals.get(name) 的结果
            # 这一段实现了核对四个现场控制点的地址和类型；返回值或异常由调用方按当前分支处理。


# 这一段定义 test_io_points，用于核对六个只读 IO 点位的名称、地址和缩放配置。
def test_io_points() -> None:
# 定义函数 test_io_points。
# test_io_points：核对六个只读 IO 点位的名称、地址和缩放配置
    """io.* 点位的地址与类型:地址写错 = 读到别的寄存器,线上不会报错但值是错的。"""
    print("\n产线 IO 只读点位(写 io_state 报文):")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    expect = {
    # 根据 { 设置 expect，供当前流程后续使用。
    # expect：保存 {'io.sensorIn': 11, 'io.sensorArrive': 12, 'io.sensorRetreat': 13, 'io… 的结果
        "io.sensorIn":      11,
        # 在当前模拟输入或配置映射中，将键 io.sensorIn 设为 11。
        # io.sensorIn 是模拟 IO 点位的寄存器键；11 是该点位在当前测试中的原始值
        "io.sensorArrive":  12,
        # 在当前模拟输入或配置映射中，将键 io.sensorArrive 设为 12。
        # io.sensorArrive 是模拟 IO 点位的寄存器键；12 是该点位在当前测试中的原始值
        "io.sensorRetreat": 13,
        # 在当前模拟输入或配置映射中，将键 io.sensorRetreat 设为 13。
        # io.sensorRetreat 是模拟 IO 点位的寄存器键；13 是该点位在当前测试中的原始值
        "io.lightColor":    14,
        # 在当前模拟输入或配置映射中，将键 io.lightColor 设为 14。
        # io.lightColor 是模拟 IO 点位的寄存器键；14 是该点位在当前测试中的原始值
        "io.trayUp":        15,
        # 在当前模拟输入或配置映射中，将键 io.trayUp 设为 15。
        # io.trayUp 是模拟 IO 点位的寄存器键；15 是该点位在当前测试中的原始值
        "io.blockUp":       16,
        # 在当前模拟输入或配置映射中，将键 io.blockUp 设为 16。
        # io.blockUp 是模拟 IO 点位的寄存器键；16 是该点位在当前测试中的原始值
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 本行结束上面最近一层已经介绍的表达式或代码块
    read_sigs = {s.name: s for s in _read_csv(MAPPING)}
    # 读取点位映射表，将可读信号与控制写点分开保存，将结果保存或写入 read_sigs。
    # read_sigs：保存 {s.name: s for s in _read_csv(MAPPING)} 的结果；name：当前对象的名称字段；_read_csv：读取点位映射表，将可读信号与控制写点分开保存；MAPPING：保存 Path(__file__).with_name('register-mapping.csv') 的结果
    for name, want_addr in expect.items():
    # 循环处理name, want_addr in expect.items():，按判断结果进入对应的处理分支。
    # name：当前对象的名称字段；want_addr：逐项遍历 expect.items() 的当前元素；expect：保存 {'io.sensorIn': 11, 'io.sensorArrive': 12, 'io.sensorRetreat': 13, 'io… 的结果；items：取得字典的键值对迭代器
        s = read_sigs.get(name)
        # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 s。
        # s：保存 read_sigs.get(name) 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；name：当前对象的名称字段；read_sigs：保存 {s.name: s for s in _read_csv(MAPPING)} 的结果
        if s is None:
        # 检查s is None:，按判断结果进入对应的处理分支。
        # s：保存 read_sigs.get(name) 的结果
            print(f"  [FAIL] {name:<20} CSV 里缺失")
            # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
            # name：当前对象的名称字段
            IO_FAILURES.append((name, want_addr, "缺失"))
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；IO_FAILURES：本处声明的局部变量，类型为 list；name：当前对象的名称字段；want_addr：逐项遍历 expect.items() 的当前元素
            continue
            # 跳过本轮剩余语句，进入下一次循环。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        ok = s.address == want_addr and s.type == "UINT" and s.scale == 1.0
        # 根据 s.address == want_addr and s.type == "UINT" and s.scale == 1.0 设置 ok，用于操作是否成功的布尔结果。
        # ok：操作是否成功的布尔结果；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 = want_addr and s.type == "UINT" an…；want_addr：逐项遍历 expect.items() 的当前元素；type：当前报文、指令或对象的类别字段，本次传入 = "UINT" and s.scale == 1.0；scale：原始数值转换为实际物理量的缩放系数，本次传入 = 1.0；s：保存 read_sigs.get(name) 的结果
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<20} addr={s.address:<4} "
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # ok：操作是否成功的布尔结果；name：当前对象的名称字段；s：保存 read_sigs.get(name) 的结果；address：Modbus 寄存器起始地址，使用从 0 开始的编号
              f"type={s.type:<6} scale={s.scale} (期望 addr={want_addr}, UINT, ×1)")
              # 根据 {s.type:<6} scale={s.scale} (期望 addr={want_addr}, UINT, ×1)") 设置 f"type，供当前流程后续使用。
              # s：保存 read_sigs.get(name) 的结果；type：当前报文、指令或对象的类别字段，本次传入 {s.type:<6} scale={s.scale} (期望 add…；scale：原始数值转换为实际物理量的缩放系数，本次传入 {s.scale} (期望 addr={want_addr}；want_addr：逐项遍历 expect.items() 的当前元素
        if not ok:
        # 检查not ok:，按判断结果进入对应的处理分支。
        # ok：操作是否成功的布尔结果
            IO_FAILURES.append((name, want_addr, f"{s.address}/{s.type}/{s.scale}"))
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；IO_FAILURES：本处声明的局部变量，类型为 list；name：当前对象的名称字段；want_addr：逐项遍历 expect.items() 的当前元素；address：Modbus 寄存器起始地址，使用从 0 开始的编号；type：当前报文、指令或对象的类别字段；scale：原始数值转换为实际物理量的缩放系数；s：保存 read_sigs.get(name) 的结果
            # 这一段实现了核对六个只读 IO 点位的名称、地址和缩放配置；返回值或异常由调用方按当前分支处理。


# 这一段定义 test_io_payload，用于检查 IO 报文组装时的字段和读失败空值处理。
def test_io_payload() -> None:
# 定义函数 test_io_payload。
# test_io_payload：检查 IO 报文组装时的字段和读失败空值处理
    """io_payload:只透传 io.* 点位;读失败的点保留 None 而不是被 0 兜底。"""
    print("\nio_payload 组装(契约 §3.8):")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    signals = [s for s in _read_csv(MAPPING)]
    # 读取点位映射表，将可读信号与控制写点分开保存，将结果保存或写入 signals。
    # signals：保存 [s for s in _read_csv(MAPPING)] 的结果；_read_csv：读取点位映射表，将可读信号与控制写点分开保存；MAPPING：保存 Path(__file__).with_name('register-mapping.csv') 的结果
    values = {s.name: 1 for s in signals}
    # 根据 {s.name: 1 for s in signals} 设置 values，供当前流程后续使用。
    # values：取得字典或映射中的所有值；name：当前对象的名称字段；signals：保存 [s for s in _read_csv(MAPPING)] 的结果
    for s in signals:
    # 循环处理s in signals:，按判断结果进入对应的处理分支。
    # s：逐项遍历 signals 的当前元素；signals：保存 [s for s in _read_csv(MAPPING)] 的结果
        if s.name == "io.sensorArrive":
        # 检查s.name == "io.sensorArrive":，按判断结果进入对应的处理分支。
        # s：逐项遍历 signals 的当前元素；name：当前对象的名称字段，本次传入 = "io.sensorArrive":
            values[s.name] = None          # 模拟该点读失败
            # 把 None          # 模拟该点读失败 的结果赋给 values[s.name]。
            # values：取得字典或映射中的所有值；name：当前对象的名称字段；s：保存 None 的结果
    msg = plc_collector.io_payload(signals, values)
    # 把采集值整理成契约报文，将结果保存或写入 msg。
    # msg：当前收到的消息或提示文字；io_payload：把已采集的六个 IO 点位组装为契约规定的信号帧；signals：保存 [s for s in _read_csv(MAPPING)] 的结果；values：取得字典或映射中的所有值；plc_collector：从 plc_collector 导入的模块，类型为 plc_collector
    if msg is None:
    # 检查msg is None:，按判断结果进入对应的处理分支。
    # msg：当前收到的消息或提示文字
        IO_FAILURES.append(("io_payload", "dict", "None"))
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；IO_FAILURES：本处声明的局部变量，类型为 list
        print("  [FAIL] 返回 None")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        return
        # 从当前函数返回处理结果，供当前处理流程继续使用。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    keys = set(msg["io"])
    # 按键写入当前映射、缓存或对象的值，将结果保存或写入 keys。
    # keys：取得字典或对象中的所有键；set：按键写入当前映射、缓存或对象的值；msg：当前收到的消息或提示文字
    want = {n.split(".", 1)[1] for n in expect_io_names()}
    # 按分隔符拆分字符串，将结果保存或写入 want。
    # want：保存 {n.split('.', 1)[1] for n in expect_io_names()} 的结果；split：按分隔符拆分字符串；expect_io_names：返回契约要求的六个 IO 信号名称
    ok_keys = keys == want
    # 根据 keys == want 设置 ok_keys，供当前流程后续使用。
    # ok_keys：保存 keys == want 的结果；keys：取得字典或对象中的所有键；want：保存 {n.split('.', 1)[1] for n in expect_io_names()} 的结果
    ok_none = msg["io"].get("sensorArrive", "missing") is None
    # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 ok_none。
    # ok_none：保存 msg['io'].get('sensorArrive', 'missing') is None 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；msg：当前收到的消息或提示文字
    print(f"  [{'OK  ' if ok_keys else 'FAIL'}] 字段集合 = {sorted(keys)}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # ok_keys：保存 keys == want 的结果；keys：取得字典或对象中的所有键
    print(f"  [{'OK  ' if ok_none else 'FAIL'}] 读失败的点保留 None(不兜底成 0): "
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # ok_none：保存 msg['io'].get('sensorArrive', 'missing') is None 的结果
          f"sensorArrive={msg['io'].get('sensorArrive')!r}")
          # 根据 {msg['io'].get('sensorArrive')!r}") 设置 f"sensorArrive，供当前流程后续使用。
          # msg：当前收到的消息或提示文字；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定
    if not ok_keys:
    # 检查not ok_keys:，按判断结果进入对应的处理分支。
    # ok_keys：保存 keys == want 的结果
        IO_FAILURES.append(("io_payload keys", sorted(want), sorted(keys)))
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；IO_FAILURES：本处声明的局部变量，类型为 list；want：保存 {n.split('.', 1)[1] for n in expect_io_names()} 的结果；keys：取得字典或对象中的所有键
    if not ok_none:
    # 检查not ok_none:，按判断结果进入对应的处理分支。
    # ok_none：保存 msg['io'].get('sensorArrive', 'missing') is None 的结果
        IO_FAILURES.append(("io_payload None", None, msg["io"].get("sensorArrive")))
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；IO_FAILURES：本处声明的局部变量，类型为 list；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；msg：当前收到的消息或提示文字

    # 一个 io.* 都没配时应返回 None,而不是发空报文
    if plc_collector.io_payload([], {}) is not None:
    # 检查plc_collector.io_payload([], {}) is not None:，按判断结果进入对应的处理分支。
    # plc_collector：从 plc_collector 导入的模块，类型为 plc_collector；io_payload：把已采集的六个 IO 点位组装为契约规定的信号帧
        IO_FAILURES.append(("io_payload 空点位表", None, "应返回 None"))
        # 把一个元素追加到 Python 列表末尾。
        # append：把一个元素追加到 Python 列表末尾；IO_FAILURES：本处声明的局部变量，类型为 list
        # 这一段实现了检查 IO 报文组装时的字段和读失败空值处理；返回值或异常由调用方按当前分支处理。


# 这一段定义 expect_io_names，用于返回契约要求的六个 IO 信号名称。
def expect_io_names() -> list[str]:
# 定义函数 expect_io_names。
# expect_io_names：返回契约要求的六个 IO 信号名称
    return ["io.sensorIn", "io.sensorArrive", "io.sensorRetreat",
    # 把["io.sensorIn", "io.sensorArrive", "io.sensorRetreat",作为当前函数的结果返回。
    # io：现场 IO 信号对象或当前 IO 状态帧；sensorIn：word 11 的入料传感器读数；sensorArrive：word 12 的到料传感器读数；sensorRetreat：word 13 的退料传感器读数
            "io.lightColor", "io.trayUp", "io.blockUp"]
            # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            # 这一段实现了返回契约要求的六个 IO 信号名称；返回值或异常由调用方按当前分支处理。


# 这一段定义 main，用于运行寄存器解码、状态映射和 IO 点位契约检查。
def main() -> int:
# 定义 main，用于运行寄存器解码、状态映射和 IO 点位契约检查。
# main：本文件定义的函数，用于运行  的入口流程
    failures: list = []
    # 给 failures 赋值，供当前处理流程继续使用。
    # failures：本处声明的局部变量，类型为 list
    test_decode(failures)
    # 检查各配置点位的寄存器解码结果是否符合预期。
    # test_decode：检查各配置点位的寄存器解码结果是否符合预期；failures：本处声明的局部变量，类型为 list
    test_state_map()
    # 核对 PLC 数字状态码到契约状态名的映射。
    # test_state_map：核对 PLC 数字状态码到契约状态名的映射
    test_cmd_points()
    # 核对四个现场控制点的地址和类型。
    # test_cmd_points：核对四个现场控制点的地址和类型
    test_io_points()
    # 核对六个只读 IO 点位的名称、地址和缩放配置。
    # test_io_points：核对六个只读 IO 点位的名称、地址和缩放配置
    test_io_payload()
    # 检查 IO 报文组装时的字段和读失败空值处理。
    # test_io_payload：检查 IO 报文组装时的字段和读失败空值处理

    all_fail = failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES
    # 根据 failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES 设置 all_fail，供当前流程后续使用。
    # all_fail：保存 failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES 的结果；IO_FAILURES：本处声明的局部变量，类型为 list；CMD_FAILURES：本处声明的局部变量，类型为 list；failures：本处声明的局部变量，类型为 list；STATE_FAILURES：本处声明的局部变量，类型为 list
    print()
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    if all_fail:
    # 检查all_fail:，按判断结果进入对应的处理分支。
    # all_fail：保存 failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES 的结果
        print(f"!!! {len(all_fail)} failures:")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # all_fail：保存 failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES 的结果
        for name, exp, got, *rest in all_fail:
        # 循环处理name, exp, got, *rest in all_fail:，按判断结果进入对应的处理分支。
        # name：当前对象的名称字段；exp：逐项遍历 all_fail 的当前元素；got：逐项遍历 all_fail 的当前元素；rest：逐项遍历 all_fail 的当前元素；all_fail：保存 failures + STATE_FAILURES + CMD_FAILURES + IO_FAILURES 的结果
            print(f"  {name}: expected {exp}, got {got}")
            # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
            # name：当前对象的名称字段；exp：逐项遍历 all_fail 的当前元素；got：逐项遍历 all_fail 的当前元素
        return 1
        # 把1作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    print("=== ALL PASSED ===")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    return 0
    # 把0作为当前函数的结果返回。
    # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    # 这一段实现了运行寄存器解码、状态映射和 IO 点位契约检查；返回值或异常由调用方按当前分支处理。


if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    sys.exit(main())
    # 以指定状态码结束当前进程或处理流程。
    # sys：Python 运行环境与退出状态接口；main：本文件定义的函数，用于运行  的入口流程
    # 这一段提供了验证寄存器解码、工序映射和 IO 报文契约所需的定义和处理逻辑，结果交由调用方或运行环境使用。
