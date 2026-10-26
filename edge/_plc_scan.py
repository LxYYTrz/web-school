# -*- coding: utf-8 -*-
"""PLC 数据位置扫描:试不同 unit 和地址范围,找能读出非零数据的位置。"""
# 这一段负责扫描 PLC 寄存器地址以辅助核对现场映射，为后续代码提供当前文件的处理入口。
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

# ---- 现场参数（按实际修改）----
HOST = "192.168.10.31"
# 根据 "192.168.10.31" 设置 HOST，用于现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31。
# HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31
PORT = 503
# 根据 503 设置 PORT，用于现场 PLC 的 Modbus TCP 端口，当前配置为 503。
# PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503

# 创建客户端并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 创建或使用pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器，将结果保存或写入 cli。
# cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；ModbusTcpClient：pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器；host：网络连接的目标主机地址，本次传入 HOST；port：网络连接的目标端口，本次传入 PORT；timeout：操作的最长等待时间，本处客户端以秒为单位，本次传入 2；HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503
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

# 1) 试不同 unit_id 的 address 0
# ---- 1) 试不同 unit_id 的 address 0 ----
# 为什么先试 unit：S7 的 unit id 一般是 2，试错 unit 会全部返回异常码，
# 容易误判成"地址不对"。先锁定 unit 再谈地址。
print("\n=== [1] 试 unit_id 1/2/255 × address 0, count 4 ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
for unit in [1, 2, 255]:
# 循环处理unit in [1, 2, 255]:，按判断结果进入对应的处理分支。
# unit：设备站号或点位物理单位，依据所在对象区分
    rr = cli.read_holding_registers(address=0, count=4, slave=unit)
    # 通过 PLC 客户端从寄存器地址 0 起读取 4 个保持寄存器，目标站号取 unit，响应保存到 rr。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0；count：本次读取或数据结构声明的数量，本次传入 4；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 unit；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；unit：设备站号或点位物理单位，依据所在对象区分
    if rr.isError():
    # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
        print(f"  unit={unit}: 错误 {rr}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # unit：设备站号或点位物理单位，依据所在对象区分，本次传入 {unit}: 错误 {rr}"；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
    else:
    # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        print(f"  unit={unit}: OK -> {rr.registers}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # unit：设备站号或点位物理单位，依据所在对象区分，本次传入 {unit}: OK -> {rr.registers}"；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组

# 2) 用 unit=2 在不同地址范围扫描
# ---- 2) 用 unit=2 在不同地址范围扫描 ----
# 步长 20 是为了快；找到大致范围后再用 _plc_read11.py 精读
print("\n=== [2] unit=2, scan address 0..400 step 20, count 4 ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
for addr in range(0, 400, 20):
# 循环处理addr in range(0, 400, 20):，按判断结果进入对应的处理分支。
# addr：逐项遍历 range(0, 400, 20) 的当前元素
    rr = cli.read_holding_registers(address=addr, count=4, slave=2)
    # 通过 PLC 客户端从寄存器地址 addr 起读取 4 个保持寄存器，目标站号取 2，响应保存到 rr。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 addr；count：本次读取或数据结构声明的数量，本次传入 4；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；addr：逐项遍历 range(0, 400, 20) 的当前元素
    if rr.isError():
    # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
        print(f"  addr {addr:>4}: ERR")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # addr：逐项遍历 range(0, 400, 20) 的当前元素
    else:
    # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        vals = rr.registers
        # 根据 rr.registers 设置 vals，供当前流程后续使用。
        # vals：保存 rr.registers 的结果；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
        print(f"  addr {addr:>4}: {vals}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # addr：逐项遍历 range(0, 400, 20) 的当前元素；vals：保存 rr.registers 的结果

# 3) 找一段有非零数据的连续区
# ---- 3) 找一段有非零数据的连续区 ----
# 逐地址找第一个非零值 —— 数据区通常从那里开始
print("\n=== [3] unit=2, 找首段非零数据 (addr 0..100 step 1) ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
for addr in range(0, 100):
# 循环处理addr in range(0, 100):，按判断结果进入对应的处理分支。
# addr：逐项遍历 range(0, 100) 的当前元素
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    # 通过 PLC 客户端从寄存器地址 addr 起读取 1 个保持寄存器，目标站号取 2，响应保存到 rr。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 addr；count：本次读取或数据结构声明的数量，本次传入 1；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；addr：逐项遍历 range(0, 100) 的当前元素
    # 不报错 且 寄存器非 0 → 命中
    if not rr.isError() and rr.registers and rr.registers[0] != 0:
    # 检查not rr.isError() and rr.registers and rr.registers[0] != 0:，按判断结果进入对应的处理分支。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表
        # 再读 4 个确认
        # 再读 4 个确认（看看是不是连续的一段）
        rr2 = cli.read_holding_registers(address=addr, count=4, slave=2)
        # 通过 PLC 客户端从寄存器地址 addr 起读取 4 个保持寄存器，目标站号取 2，响应保存到 rr。
        # rr2：保存 cli.read_holding_registers(address=addr, count=4, slave=2) 的结果；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 addr；count：本次读取或数据结构声明的数量，本次传入 4；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；addr：逐项遍历 range(0, 100) 的当前元素
        if not rr2.isError():
        # 检查not rr2.isError():，按判断结果进入对应的处理分支。
        # rr2：保存 cli.read_holding_registers(address=addr, count=4, slave=2) 的结果；isError：判断 Modbus 响应是否携带协议错误
            print(f"  addr {addr:>4}: {rr2.registers}")
            # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
            # addr：逐项遍历 range(0, 100) 的当前元素；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr2：保存 cli.read_holding_registers(address=addr, count=4, slave=2) 的结果
        # 找到第一段就停
        break
        # 立即结束当前循环或分支，供当前处理流程继续使用。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定

# 关闭连接
cli.close()
# 关闭当前通信连接。
# close：关闭连接或释放当前打开的资源；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
print("\n=== 完成 ===")
# 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
# 这一段提供了扫描 PLC 寄存器地址以辅助核对现场映射所需的定义和处理逻辑，结果交由调用方或运行环境使用。
