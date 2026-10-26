# -*- coding: utf-8 -*-
"""plc_collector 连通性冒烟测试。
读 Holding Register 0..15(对应前 4 个 FLOAT32 或 16 个 INT16)。
不写主循环,不依赖 MQTT,只验证 Modbus TCP 能不能通。
# -*- coding: utf-8 -*-
"""
import sys
# 从 Python 环境 导入 sys，供后续代码使用。 关键字：import＝导入模块或符号。
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pymodbus.payload import BinaryPayloadDecoder
# 从 pymodbus.payload 导入 BinaryPayloadDecoder，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pymodbus.constants import Endian
# 从 pymodbus.constants 导入 Endian，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

# ---- 待确认的现场参数（按实际情况修改）----
HOST = "192.168.10.31"
# 给 HOST 赋值。
PORT = 503
# 给 PORT 赋值。
UNIT = 2
# 给 UNIT 赋值。
COUNT = 16
# 给 COUNT 赋值。
START = 0
# 给 START 赋值。

# 打印连接信息
print(f"=== 尝试连接 {HOST}:{PORT} unit={UNIT} ===")
# 调用函数或对象方法并传入参数。
# 创建客户端（timeout=3 秒超时）
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=3)
# 给 cli 赋值。
# connect() 返回布尔：True = TCP 握手成功
if not cli.connect():
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定。
    print("连接失败")
    # 调用函数或对象方法并传入参数。
    sys.exit(1)
    # 调用函数或对象方法并传入参数。
print("已连接")
# 调用函数或对象方法并传入参数。

# 读保持寄存器（功能码 0x03）
print(f"\n=== 读 Holding Register [{START}..{START+COUNT-1}] ===")
# 调用函数或对象方法并传入参数。
rr = cli.read_holding_registers(address=START, count=COUNT, slave=UNIT)
# 给 rr 赋值。
# isError()：Modbus 异常响应（地址越界、功能码不支持等）
if rr.isError():
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    print(f"读取失败: {rr}")
    # 调用函数或对象方法并传入参数。
    # 关闭 TCP 连接
    cli.close()
    # 调用函数或对象方法并传入参数。
    sys.exit(2)
    # 调用函数或对象方法并传入参数。

# 打印原始寄存器（每个寄存器是 16 位无符号）
print(f"原始寄存器(INT16, 共 {len(rr.registers)} 个):")
# 调用函数或对象方法并传入参数。
for i, v in enumerate(rr.registers):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    # 同时打出十进制和十六进制（十六进制更容易和 PLC 里的 DB 块对照）
    print(f"  [{START+i:>4}] = {v:>6} (0x{v:04X})")
    # 调用函数或对象方法并传入参数。

# 尝试按大端 FLOAT32 解前 4 个 = 2 个浮点
print("\n=== 按大端 FLOAT32 解读前 8 寄存器(4 浮点) ===")
# 调用函数或对象方法并传入参数。
# fromRegisters：按给定的字节序/字序把寄存器列表拼成字节流
dec = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
# 给 dec 赋值。
                                        byteorder=Endian.BIG,
                                        # 给 byteorder 赋值。
                                        wordorder=Endian.BIG)
                                        # 给 wordorder 赋值。
for i in range(4):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        # 每次调用从当前位置往后读 4 个字节（2 个寄存器）
        f = dec.decode_32bit_float()
        # 给 f 赋值。
        print(f"  float[{i}] = {f}")
        # 调用函数或对象方法并传入参数。
    except Exception as e:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
        print(f"  float[{i}] 解码失败: {e}")
        # 调用函数或对象方法并传入参数。

# 尝试按小端 FLOAT32
print("\n=== 按小端 FLOAT32 解读前 8 寄存器 ===")
# 调用函数或对象方法并传入参数。
dec2 = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
# 给 dec2 赋值。
                                          byteorder=Endian.LITTLE,
                                          # 给 byteorder 赋值。
                                          wordorder=Endian.LITTLE)
                                          # 给 wordorder 赋值。
for i in range(4):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        f = dec2.decode_32bit_float()
        # 给 f 赋值。
        print(f"  float_le[{i}] = {f}")
        # 调用函数或对象方法并传入参数。
    except Exception as e:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：except＝处理指定异常；as＝为导入或上下文对象命名。
        print(f"  float_le[{i}] 解码失败: {e}")
        # 调用函数或对象方法并传入参数。

cli.close()
# 调用函数或对象方法并传入参数。
print("\n=== 关闭连接 ===")
# 调用函数或对象方法并传入参数。
