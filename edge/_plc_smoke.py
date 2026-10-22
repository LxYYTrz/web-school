# -*- coding: utf-8 -*-
"""plc_collector 连通性冒烟测试。
读 Holding Register 0..15(对应前 4 个 FLOAT32 或 16 个 INT16)。
不写主循环,不依赖 MQTT,只验证 Modbus TCP 能不能通。
# -*- coding: utf-8 -*-
"""
import sys
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

# ---- 待确认的现场参数（按实际情况修改）----
HOST = "192.168.10.31"
PORT = 503
UNIT = 2
COUNT = 16
START = 0

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
    # 关闭 TCP 连接
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

cli.close()
print("\n=== 关闭连接 ===")
