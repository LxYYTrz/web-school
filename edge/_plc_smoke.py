# -*- coding: utf-8 -*-
"""plc_collector 连通性冒烟测试。
读 Holding Register 0..15(对应前 4 个 FLOAT32 或 16 个 INT16)。
不写主循环,不依赖 MQTT,只验证 Modbus TCP 能不能通。
# -*- coding: utf-8 -*-
"""
# 这一段负责对现场 PLC 连接和寄存器读取进行基础检查，为后续代码提供当前文件的处理入口。
import sys
# 从 Python 环境 导入 sys，供后续代码使用。
# sys：来自 sys，Python 运行环境与退出状态接口
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。
# ModbusTcpClient：来自 pymodbus.client，pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器
from pymodbus.payload import BinaryPayloadDecoder
# 从 pymodbus.payload 导入 BinaryPayloadDecoder，供后续代码使用。
# BinaryPayloadDecoder：来自 pymodbus.payload，旧版 pymodbus 的二进制寄存器解码器
from pymodbus.constants import Endian
# 从 pymodbus.constants 导入 Endian，供后续代码使用。
# Endian：来自 pymodbus.constants，旧版 pymodbus 表示字节顺序的枚举

# ---- 待确认的现场参数（按实际情况修改）----
HOST = "192.168.10.31"
# 根据 "192.168.10.31" 设置 HOST，用于现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31。
# HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31
PORT = 503
# 根据 503 设置 PORT，用于现场 PLC 的 Modbus TCP 端口，当前配置为 503。
# PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503
UNIT = 2
# 根据 2 设置 UNIT，用于本次 Modbus 请求的目标设备站号，当前配置为 2。
# UNIT：本次 Modbus 请求的目标设备站号，当前配置为 2
COUNT = 16
# 根据 16 设置 COUNT，供当前流程后续使用。
# COUNT：保存 16 的结果
START = 0
# 根据 0 设置 START，供当前流程后续使用。
# START：保存 0 的结果

# 打印连接信息
print(f"=== 尝试连接 {HOST}:{PORT} unit={UNIT} ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503；UNIT：本次 Modbus 请求的目标设备站号，当前配置为 2
# 创建客户端（timeout=3 秒超时）
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=3)
# 创建或使用pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器，将结果保存或写入 cli。
# cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；ModbusTcpClient：pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器；host：网络连接的目标主机地址，本次传入 HOST；port：网络连接的目标端口，本次传入 PORT；timeout：操作的最长等待时间，本处客户端以秒为单位，本次传入 3；HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503
# connect() 返回布尔：True = TCP 握手成功
if not cli.connect():
# 检查not cli.connect():，按判断结果进入对应的处理分支。
# cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；connect：尝试建立网络连接
    print("连接失败")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    sys.exit(1)
    # 以指定状态码结束当前进程或处理流程。
    # sys：Python 运行环境与退出状态接口
print("已连接")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定

# 读保持寄存器（功能码 0x03）
print(f"\n=== 读 Holding Register [{START}..{START+COUNT-1}] ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# START：保存 0 的结果；COUNT：保存 16 的结果
rr = cli.read_holding_registers(address=START, count=COUNT, slave=UNIT)
# 通过 PLC 客户端从寄存器地址 START 起读取 COUNT 个保持寄存器，目标站号取 UNIT，响应保存到 rr。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 START；count：本次读取或数据结构声明的数量，本次传入 COUNT；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 UNIT；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；START：保存 0 的结果；COUNT：保存 16 的结果；UNIT：本次 Modbus 请求的目标设备站号，当前配置为 2
# isError()：Modbus 异常响应（地址越界、功能码不支持等）
if rr.isError():
# 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
    print(f"读取失败: {rr}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
    # 关闭 TCP 连接
    cli.close()
    # 关闭当前通信连接。
    # close：关闭连接或释放当前打开的资源；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
    sys.exit(2)
    # 以指定状态码结束当前进程或处理流程。
    # sys：Python 运行环境与退出状态接口

# 打印原始寄存器（每个寄存器是 16 位无符号）
print(f"原始寄存器(INT16, 共 {len(rr.registers)} 个):")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
for i, v in enumerate(rr.registers):
# 循环处理i, v in enumerate(rr.registers):，按判断结果进入对应的处理分支。
# i：逐项遍历 enumerate(rr.registers) 的当前元素；v：逐项遍历 enumerate(rr.registers) 的当前元素；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表
    # 同时打出十进制和十六进制（十六进制更容易和 PLC 里的 DB 块对照）
    print(f"  [{START+i:>4}] = {v:>6} (0x{v:04X})")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # v：逐项遍历 enumerate(rr.registers) 的当前元素；START：保存 0 的结果；i：逐项遍历 enumerate(rr.registers) 的当前元素

# 尝试按大端 FLOAT32 解前 4 个 = 2 个浮点
print("\n=== 按大端 FLOAT32 解读前 8 寄存器(4 浮点) ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
# fromRegisters：按给定的字节序/字序把寄存器列表拼成字节流
dec = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
# 从 Modbus 寄存器数组创建二进制载荷解码器，将结果保存或写入 dec。
# dec：保存 BinaryPayloadDecoder.fromRegisters(rr.registers[:8], byteorder=Endian.… 的结果；BinaryPayloadDecoder：旧版 pymodbus 的二进制寄存器解码器；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表
                                        byteorder=Endian.BIG,
                                        # 根据 Endian.BIG, 设置 byteorder，供当前流程后续使用。
                                        # Endian：旧版 pymodbus 表示字节顺序的枚举
                                        wordorder=Endian.BIG)
                                        # 根据 Endian.BIG) 设置 wordorder，供当前流程后续使用。
                                        # Endian：旧版 pymodbus 表示字节顺序的枚举
for i in range(4):
# 循环处理i in range(4):，按判断结果进入对应的处理分支。
# i：逐项遍历 range(4) 的当前元素
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 每次调用从当前位置往后读 4 个字节（2 个寄存器）
        f = dec.decode_32bit_float()
        # 执行 decode_32bit_float 对应的本地处理，使用本行提供的数据，将结果保存或写入 f。
        # f：保存 dec.decode_32bit_float() 的结果；dec：保存 BinaryPayloadDecoder.fromRegisters(rr.registers[:8], byteorder=Endian.… 的结果
        print(f"  float[{i}] = {f}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # i：逐项遍历 range(4) 的当前元素；f：保存 dec.decode_32bit_float() 的结果
    except Exception as e:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        print(f"  float[{i}] 解码失败: {e}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # i：逐项遍历 range(4) 的当前元素

# 尝试按小端 FLOAT32
print("\n=== 按小端 FLOAT32 解读前 8 寄存器 ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
dec2 = BinaryPayloadDecoder.fromRegisters(rr.registers[:8],
# 从 Modbus 寄存器数组创建二进制载荷解码器，将结果保存或写入 dec2。
# dec2：保存 BinaryPayloadDecoder.fromRegisters(rr.registers[:8], byteorder=Endian.… 的结果；BinaryPayloadDecoder：旧版 pymodbus 的二进制寄存器解码器；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表
                                          byteorder=Endian.LITTLE,
                                          # 根据 Endian.LITTLE, 设置 byteorder，供当前流程后续使用。
                                          # Endian：旧版 pymodbus 表示字节顺序的枚举
                                          wordorder=Endian.LITTLE)
                                          # 根据 Endian.LITTLE) 设置 wordorder，供当前流程后续使用。
                                          # Endian：旧版 pymodbus 表示字节顺序的枚举
for i in range(4):
# 循环处理i in range(4):，按判断结果进入对应的处理分支。
# i：逐项遍历 range(4) 的当前元素
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        f = dec2.decode_32bit_float()
        # 执行 decode_32bit_float 对应的本地处理，使用本行提供的数据，将结果保存或写入 f。
        # f：保存 dec2.decode_32bit_float() 的结果；dec2：保存 BinaryPayloadDecoder.fromRegisters(rr.registers[:8], byteorder=Endian.… 的结果
        print(f"  float_le[{i}] = {f}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # i：逐项遍历 range(4) 的当前元素；f：保存 dec2.decode_32bit_float() 的结果
    except Exception as e:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        print(f"  float_le[{i}] 解码失败: {e}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # i：逐项遍历 range(4) 的当前元素

cli.close()
# 关闭当前通信连接。
# close：关闭连接或释放当前打开的资源；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
print("\n=== 关闭连接 ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
# 这一段提供了对现场 PLC 连接和寄存器读取进行基础检查所需的定义和处理逻辑，结果交由调用方或运行环境使用。
