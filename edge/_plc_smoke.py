# -*- coding: utf-8 -*-
"""
===============================================================================
文件作用：PLC 连通性冒烟测试脚本（现场排障用，一次性工具）
所属模块：edge/
===============================================================================

【用途】
    到现场第一件事：确认 "Modbus TCP 到底能不能通"。
    本脚本只做一件事 —— 连上 PLC，读 Holding Register 0..15，
    然后用多种字节序解读，把原始值和十六进制都打出来，
    **不写主循环、不连 MQTT、不发布任何数据**。

【为什么要多种字节序都试一遍】
    ★ 这是现场最容易踩的坑：明明读到了数据，但解出来的值是乱的。
      原因通常是字节序不对：
        - Modbus 协议规定"大端字序"（高字在前）
        - 但西门子 S7 的 MB_SERVER 默认也是大端，
          而某些第三方 PLC / 组态软件会用小端或"字内大端、字间小端"
    所以这里把大端、小端都解一遍，看哪一组合出来是合理值
    （比如关节角应该在 ±180 度之间、speedPct 应该在 0~100）。

【怎么用】
    1. 改下面的 HOST / PORT / UNIT 为现场 PLC 的实际值
    2. python _plc_smoke.py
    3. 看输出：
       - "连接失败"       → 网络/端口/防火墙问题
       - "读取失败"       → unit id 或地址不对
       - 读出全 0        → 地址段错了，需要用 _plc_scan.py 扫描
       - 读出乱码浮点    → 字节序不对，对照两种解读结果判断

【注意】文件名前缀下划线 `_` 表示"这是工具，不是系统的一部分"。
"""

import sys
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

# ---- 待确认的现场参数（按实际情况修改）----
HOST = "192.168.10.31"   # PLC 的 IP
PORT = 503                # Modbus TCP 端口（S7 的 MB_SERVER 一般是 503，不是标准 502）
UNIT = 2                  # 从站号（unit id）
COUNT = 16                # 读 16 个寄存器
START = 0                 # 起始地址

# 打印连接信息
print(f"=== 尝试连接 {HOST}:{PORT} unit={UNIT} ===")
# 创建客户端（timeout=3 秒超时）
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=3)
# connect() 返回布尔：True = TCP 握手成功
if not cli.connect():
    print("连接失败")
    sys.exit(1)
print("已连接")

# 读保持寄存器（功能码 0x03）
print(f"\n=== 读 Holding Register [{START}..{START+COUNT-1}] ===")
rr = cli.read_holding_registers(address=START, count=COUNT, slave=UNIT)
# isError()：Modbus 异常响应（地址越界、功能码不支持等）
if rr.isError():
    print(f"读取失败: {rr}")
    cli.close()
    sys.exit(2)

# 打印原始寄存器（每个寄存器是 16 位无符号）
print(f"原始寄存器(INT16, 共 {len(rr.registers)} 个):")
for i, v in enumerate(rr.registers):
    # 同时打出十进制和十六进制（十六进制更容易和 PLC 里的 DB 块对照）
    print(f"  [{START+i:>4}] = {v:>6} (0x{v:04X})")

# 尝试按大端 FLOAT32 解前 4 个 = 2 个浮点
print("\n=== 按大端 FLOAT32 解读前 8 寄存器(4 浮点) ===")
# fromRegisters：按给定的字节序/字序把寄存器列表拼成字节流
dec = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
                                        byteorder=Endian.BIG,
                                        wordorder=Endian.BIG)
for i in range(4):
    try:
        # 每次调用从当前位置往后读 4 个字节（2 个寄存器）
        f = dec.decode_32bit_float()
        print(f"  float[{i}] = {f}")
    except Exception as e:
        print(f"  float[{i}] 解码失败: {e}")

# 尝试按小端 FLOAT32
print("\n=== 按小端 FLOAT32 解读前 8 寄存器 ===")
dec2 = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
                                          byteorder=Endian.LITTLE,
                                          wordorder=Endian.LITTLE)
for i in range(4):
    try:
        f = dec2.decode_32bit_float()
        print(f"  float_le[{i}] = {f}")
    except Exception as e:
        print(f"  float_le[{i}] 解码失败: {e}")

# 关闭 TCP 连接
cli.close()
print("\n=== 关闭连接 ===")
