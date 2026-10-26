# -*- coding: utf-8 -*-
"""PLC 数据位置扫描:试不同 unit 和地址范围,找能读出非零数据的位置。"""
import sys
# 从 Python 环境 导入 sys，供后续代码使用。 关键字：import＝导入模块或符号。
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pymodbus.payload import BinaryPayloadDecoder
# 从 pymodbus.payload 导入 BinaryPayloadDecoder，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pymodbus.constants import Endian
# 从 pymodbus.constants 导入 Endian，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

# ---- 现场参数（按实际修改）----
HOST = "192.168.10.31"
# 给 HOST 赋值。
PORT = 503
# 给 PORT 赋值。

# 创建客户端并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 给 cli 赋值。
if not cli.connect():
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
    print("连接失败")
    # 调用函数或对象方法并传入参数。
    sys.exit(1)
    # 调用函数或对象方法并传入参数。
print("已连接")
# 调用函数或对象方法并传入参数。

# 1) 试不同 unit_id 的 address 0
# ---- 1) 试不同 unit_id 的 address 0 ----
# 为什么先试 unit：S7 的 unit id 一般是 2，试错 unit 会全部返回异常码，
# 容易误判成"地址不对"。先锁定 unit 再谈地址。
print("\n=== [1] 试 unit_id 1/2/255 × address 0, count 4 ===")
# 调用函数或对象方法并传入参数。
for unit in [1, 2, 255]:
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    rr = cli.read_holding_registers(address=0, count=4, slave=unit)
    # 给 rr 赋值。
    if rr.isError():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        print(f"  unit={unit}: 错误 {rr}")
        # 调用函数或对象方法并传入参数。
    else:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
        print(f"  unit={unit}: OK -> {rr.registers}")
        # 调用函数或对象方法并传入参数。

# 2) 用 unit=2 在不同地址范围扫描
# ---- 2) 用 unit=2 在不同地址范围扫描 ----
# 步长 20 是为了快；找到大致范围后再用 _plc_read11.py 精读
print("\n=== [2] unit=2, scan address 0..400 step 20, count 4 ===")
# 调用函数或对象方法并传入参数。
for addr in range(0, 400, 20):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    rr = cli.read_holding_registers(address=addr, count=4, slave=2)
    # 给 rr 赋值。
    if rr.isError():
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
        print(f"  addr {addr:>4}: ERR")
        # 调用函数或对象方法并传入参数。
    else:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：else＝进入另一条件分支。
        vals = rr.registers
        # 给 vals 赋值。
        print(f"  addr {addr:>4}: {vals}")
        # 调用函数或对象方法并传入参数。

# 3) 找一段有非零数据的连续区
# ---- 3) 找一段有非零数据的连续区 ----
# 逐地址找第一个非零值 —— 数据区通常从那里开始
print("\n=== [3] unit=2, 找首段非零数据 (addr 0..100 step 1) ===")
# 调用函数或对象方法并传入参数。
for addr in range(0, 100):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    # 给 rr 赋值。
    # 不报错 且 寄存器非 0 → 命中
    if not rr.isError() and rr.registers and rr.registers[0] != 0:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；and＝逻辑与。
        # 再读 4 个确认
        # 再读 4 个确认（看看是不是连续的一段）
        rr2 = cli.read_holding_registers(address=addr, count=4, slave=2)
        # 给 rr2 赋值。
        if not rr2.isError():
        # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
            print(f"  addr {addr:>4}: {rr2.registers}")
            # 调用函数或对象方法并传入参数。
        # 找到第一段就停
        break
        # 立即结束当前循环或分支。

# 关闭连接
cli.close()
# 调用函数或对象方法并传入参数。
print("\n=== 完成 ===")
# 调用函数或对象方法并传入参数。
