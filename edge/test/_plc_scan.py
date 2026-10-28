# -*- coding: utf-8 -*-
"""PLC 数据位置扫描:试不同 unit 和地址范围,找能读出非零数据的位置。"""

# PLC 寄存器范围扫描探针，属于辅助测试或排查文件，不是正式采集入口。
# 先核对本文件参数与 main/顶层流程，再看它调用的客户端或 plc_collector 辅助函数；输出仅说明该检查的观察结果。

import sys
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

# ---- 现场参数（按实际修改）----
HOST = "192.168.10.31"
PORT = 503

# 创建客户端并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
if not cli.connect():
# 检查not cli.connect():，按判断结果进入对应的处理分支。
    print("连接失败")
    sys.exit(1)
print("已连接")

# 1) 试不同 unit_id 的 address 0
# ---- 1) 试不同 unit_id 的 address 0 ----
# 为什么先试 unit：S7 的 unit id 一般是 2，试错 unit 会全部返回异常码，
# 容易误判成"地址不对"。先锁定 unit 再谈地址。
print("\n=== [1] 试 unit_id 1/2/255 × address 0, count 4 ===")
for unit in [1, 2, 255]:
# 循环处理unit in [1, 2, 255]:，按判断结果进入对应的处理分支。
    rr = cli.read_holding_registers(address=0, count=4, slave=unit)
    # 通过 PLC 客户端从寄存器地址 0 起读取 4 个保持寄存器，目标站号取 unit，响应保存到 rr。
    if rr.isError():
    # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
        print(f"  unit={unit}: 错误 {rr}")
    else:
        print(f"  unit={unit}: OK -> {rr.registers}")

# 2) 用 unit=2 在不同地址范围扫描
# ---- 2) 用 unit=2 在不同地址范围扫描 ----
# 步长 20 是为了快；找到大致范围后再用 _plc_read11.py 精读
print("\n=== [2] unit=2, scan address 0..400 step 20, count 4 ===")
for addr in range(0, 400, 20):
# 循环处理addr in range(0, 400, 20):，按判断结果进入对应的处理分支。
    rr = cli.read_holding_registers(address=addr, count=4, slave=2)
    # 通过 PLC 客户端从寄存器地址 addr 起读取 4 个保持寄存器，目标站号取 2，响应保存到 rr。
    if rr.isError():
    # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
        print(f"  addr {addr:>4}: ERR")
    else:
        vals = rr.registers
        print(f"  addr {addr:>4}: {vals}")

# 3) 找一段有非零数据的连续区
# ---- 3) 找一段有非零数据的连续区 ----
# 逐地址找第一个非零值 —— 数据区通常从那里开始
print("\n=== [3] unit=2, 找首段非零数据 (addr 0..100 step 1) ===")
for addr in range(0, 100):
# 循环处理addr in range(0, 100):，按判断结果进入对应的处理分支。
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    # 通过 PLC 客户端从寄存器地址 addr 起读取 1 个保持寄存器，目标站号取 2，响应保存到 rr。
    # 不报错 且 寄存器非 0 → 命中
    if not rr.isError() and rr.registers and rr.registers[0] != 0:
    # 检查not rr.isError() and rr.registers and rr.registers[0] != 0:，按判断结果进入对应的处理分支。
        # 再读 4 个确认
        # 再读 4 个确认（看看是不是连续的一段）
        rr2 = cli.read_holding_registers(address=addr, count=4, slave=2)
        # 通过 PLC 客户端从寄存器地址 addr 起读取 4 个保持寄存器，目标站号取 2，响应保存到 rr。
        if not rr2.isError():
        # 检查not rr2.isError():，按判断结果进入对应的处理分支。
            print(f"  addr {addr:>4}: {rr2.registers}")
        # 找到第一段就停
        break

# 关闭连接
cli.close()
print("\n=== 完成 ===")
