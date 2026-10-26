# -*- coding: utf-8 -*-
"""探 Modbus 功能码 + 地址范围,把结果直接写文件。"""
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

# 输出文件路径（同时打印到屏幕 + 存盘，方便回传给开发/电气工程师）
OUT = r"C:\Users\Administrator\deploy_work\plc-scan2.out"
# 给 OUT 赋值。
# 累积的输出行
lines = []
# 给 lines 赋值。
def w(*a):
# 定义函数 w。 关键字：def＝定义 Python 函数。
    s = " ".join(str(x) for x in a)
    # 给 s 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    print(s, flush=True)
    # 调用函数或对象方法并传入参数。 关键字：True＝布尔真值。
    lines.append(s)
    # 调用函数或对象方法并传入参数。

# ---- 现场参数 ----
HOST = "192.168.10.31"; PORT = 503
# 给 HOST 赋值。
# 创建并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 给 cli 赋值。
if not cli.connect():
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
    w("连接失败"); raise SystemExit(1)
    # 调用函数或对象方法并传入参数。 关键字：raise＝抛出 Python 异常。
w("已连接")
# 调用函数或对象方法并传入参数。

# ---- [1] 标准诊断区 ----
# 0x07D0(2000) 是 Modbus 规定的"诊断保留区"，部分 PLC 在这里放诊断信息
w("\n[1] 读 0x07D0..0x07D3(标准诊断区)")
# 调用函数或对象方法并传入参数。
rr = cli.read_holding_registers(address=0x07D0, count=4, slave=2)
# 给 rr 赋值。
w("  ", "ERR" if rr.isError() else rr.registers)
# 调用函数或对象方法并传入参数。 关键字：if＝按条件分支；else＝进入另一条件分支。

# ---- [2] 输入寄存器（FC 04）----
w("\n[2] Input Registers (FC 04) addr 0 count 16")
# 调用函数或对象方法并传入参数。
rr = cli.read_input_registers(address=0, count=16, slave=2)
# 给 rr 赋值。
w("  ", "ERR" if rr.isError() else rr.registers)
# 调用函数或对象方法并传入参数。 关键字：if＝按条件分支；else＝进入另一条件分支。

# ---- [3] 线圈（FC 01）----
w("\n[3] Coils (FC 01) addr 0 count 16")
# 调用函数或对象方法并传入参数。
rr = cli.read_coils(address=0, count=16, slave=2)
# 给 rr 赋值。
# bits 是位数组，只看前 16 个
w("  ", "ERR" if rr.isError() else rr.bits[:16])
# 调用函数或对象方法并传入参数。 关键字：if＝按条件分支；else＝进入另一条件分支。

# ---- [4] 离散输入（FC 02）----
w("\n[4] Discrete Inputs (FC 02) addr 0 count 16")
# 调用函数或对象方法并传入参数。
rr = cli.read_discrete_inputs(address=0, count=16, slave=2)
# 给 rr 赋值。
w("  ", "ERR" if rr.isError() else rr.bits[:16])
# 调用函数或对象方法并传入参数。 关键字：if＝按条件分支；else＝进入另一条件分支。

# ---- [5] 扫描保持寄存器的可读区段 ----
# 逐地址读 1 个，把连续的"可读"地址归并成区段
w("\n[5] HR 范围扫描 1..255 step 1 (找可读段)")
# 调用函数或对象方法并传入参数。
ok_ranges = []
# 给 ok_ranges 赋值。
in_range = False; start = None
# 给 in_range 赋值。 关键字：False＝布尔假值；None＝空值。
for addr in range(1, 256):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    # 给 rr 赋值。
    if not rr.isError():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
        # 可读 —— 若还没进入区段则记录起点
        if not in_range:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            start = addr; in_range = True
            # 给 start 赋值。 关键字：True＝布尔真值。
    else:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
        # 不可读 —— 若之前在区段里则收尾
        if in_range:
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
            ok_ranges.append((start, addr-1)); in_range = False
            # 调用函数或对象方法并传入参数。 关键字：False＝布尔假值。
# 循环结束时可能还处于区段中（一直到 255 都可读）
if in_range: ok_ranges.append((start, 255))
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
w(f"  可读区段: {ok_ranges}")
# 调用函数或对象方法并传入参数。

# ---- [6] 完整读 HR[0..15] 并列出非零项 ----
w("\n[6] 完整读 HR[0..15]")
# 调用函数或对象方法并传入参数。
rr = cli.read_holding_registers(address=0, count=16, slave=2)
# 给 rr 赋值。
if not rr.isError():
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
    w(f"  raw: {rr.registers}")
    # 调用函数或对象方法并传入参数。
    # 挑出非零的 (下标, 值) —— 数据通常就藏在这里
    nz = [(i, v) for i, v in enumerate(rr.registers) if v != 0]
    # 给 nz 赋值。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员；if＝按条件分支。
    w(f"  非零: {nz if nz else '(全 0)'}")
    # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。

# ---- [7] 对比不同 unit id 在 addr=0 的表现 ----
# 用来确认"是不是 unit id 选错了"
w("\n[7] unit=2/3/4/255 在 addr=0 的对比")
# 调用函数或对象方法并传入参数。
for u in [1, 2, 3, 4, 5, 255]:
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    rr = cli.read_holding_registers(address=0, count=4, slave=u)
    # 给 rr 赋值。
    w(f"  unit={u}: {'ERR' if rr.isError() else rr.registers}")
    # 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。

# 关闭连接
cli.close()
# 调用函数或对象方法并传入参数。
w("\n完成")
# 调用函数或对象方法并传入参数。

# 结果落盘
with open(OUT, "w", encoding="utf-8") as f:
# 控制后续缩进代码块的执行条件或顺序。 关键字：with＝在资源上下文中执行；as＝为导入或上下文对象命名。
    f.write("\n".join(lines))
    # 调用函数或对象方法并传入参数。
