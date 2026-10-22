# -*- coding: utf-8 -*-
"""
===============================================================================
文件作用：PLC 寄存器地址扫描脚本（现场找点位用，一次性工具）
所属模块：edge/
===============================================================================

【用途】
    现场不知道数据在哪个地址时，用这个脚本"盲扫"：
    ① 试不同的 unit id（从站号），确认哪个能通
    ② 在保持寄存器区按步长扫描，找出哪些地址段可读
    ③ 找出第一段非零数据的位置 —— 那大概率就是数据的起点
    找到之后，把结论填进 register-mapping.csv，采集器就能正常工作了。

【扫描原理】
    Modbus 读到一个"没被使用"的地址时，PLC 通常返回异常码
    （Illegal Data Address 0x02），pymodbus 会把它包装成 isError() == True。
    所以"可读地址段" = PLC 实际开放了映射的那一段。

【怎么用】
    1. 改 HOST / PORT
    2. python _plc_scan.py
    3. 看输出：
       - [1] 里哪个 unit 不报错 → 把它填进 register-mapping.csv 的采集配置
       - [2]/[3] 找到非零地址 → 就是数据区，把地址填进点位表

【注意】文件名前缀下划线 `_` 表示"工具，非系统组成部分"。
"""

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
    print("连接失败")
    sys.exit(1)
print("已连接")

# ---- 1) 试不同 unit_id 的 address 0 ----
# 为什么先试 unit：S7 的 unit id 一般是 2，试错 unit 会全部返回异常码，
# 容易误判成"地址不对"。先锁定 unit 再谈地址。
print("\n=== [1] 试 unit_id 1/2/255 × address 0, count 4 ===")
for unit in [1, 2, 255]:
    rr = cli.read_holding_registers(address=0, count=4, slave=unit)
    if rr.isError():
        print(f"  unit={unit}: 错误 {rr}")
    else:
        print(f"  unit={unit}: OK -> {rr.registers}")

# ---- 2) 用 unit=2 在不同地址范围扫描 ----
# 步长 20 是为了快；找到大致范围后再用 _plc_read11.py 精读
print("\n=== [2] unit=2, scan address 0..400 step 20, count 4 ===")
for addr in range(0, 400, 20):
    rr = cli.read_holding_registers(address=addr, count=4, slave=2)
    if rr.isError():
        print(f"  addr {addr:>4}: ERR")
    else:
        vals = rr.registers
        print(f"  addr {addr:>4}: {vals}")

# ---- 3) 找一段有非零数据的连续区 ----
# 逐地址找第一个非零值 —— 数据区通常从那里开始
print("\n=== [3] unit=2, 找首段非零数据 (addr 0..100 step 1) ===")
for addr in range(0, 100):
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    # 不报错 且 寄存器非 0 → 命中
    if not rr.isError() and rr.registers and rr.registers[0] != 0:
        # 再读 4 个确认（看看是不是连续的一段）
        rr2 = cli.read_holding_registers(address=addr, count=4, slave=2)
        if not rr2.isError():
            print(f"  addr {addr:>4}: {rr2.registers}")
        # 找到第一段就停
        break

# 关闭连接
cli.close()
print("\n=== 完成 ===")
