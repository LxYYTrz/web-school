# -*- coding: utf-8 -*-
"""把 11 个 word 全部读出来,按 mapping 表翻译。结果写文件。"""
# 这一段负责现场读取前 11 个寄存器并输出原始值和解码结果，为后续代码提供当前文件的处理入口。
import json, sys
# 从 Python 环境 导入 json, sys，供后续代码使用。
# json：来自 json，Python JSON 编解码库；sys：来自 sys，Python 运行环境与退出状态接口
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。
# ModbusTcpClient：来自 pymodbus.client，pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器
from pymodbus.payload import BinaryPayloadDecoder
# 从 pymodbus.payload 导入 BinaryPayloadDecoder，供后续代码使用。
# BinaryPayloadDecoder：来自 pymodbus.payload，旧版 pymodbus 的二进制寄存器解码器
from pymodbus.constants import Endian
# 从 pymodbus.constants 导入 Endian，供后续代码使用。
# Endian：来自 pymodbus.constants，旧版 pymodbus 表示字节顺序的枚举

# ---- 现场参数 ----
HOST, PORT, UNIT = "192.168.10.31", 503, 2
# 设置 PLC 地址为 192.168.10.31、端口为 503、设备站号为 2，供后续建立连接和读取使用。
# HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503；UNIT：本次 Modbus 请求的目标设备站号，当前配置为 2，本次传入 "192.168.10.31"
# 输出文件
OUT = r"C:\Users\Administrator\deploy_work\plc-read11.out"
# 根据 r"C:\Users\Administrator\deploy_work\plc-read11.out" 设置 OUT，用于保存寄存器读取和解码结果的本地文件路径。
# OUT：保存寄存器读取和解码结果的本地文件路径

# 这一段定义 to_signed，用于把 16 位无符号寄存器值转换为有符号整数。
def to_signed(u16):
# 定义函数 to_signed。
# to_signed：把 16 位无符号寄存器值转换为有符号整数；u16：方法输入参数
    # >= 0x8000 说明实际是负数，减去 0x10000（65536）还原
    return u16 if u16 < 0x8000 else u16 - 0x10000
    # 把u16 if u16 < 0x8000 else u16 - 0x10000作为当前函数的结果返回。
    # u16：方法输入参数
    # 这一段实现了把 16 位无符号寄存器值转换为有符号整数；返回值或异常由调用方按当前分支处理。

# 创建并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 创建或使用pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器，将结果保存或写入 cli。
# cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；ModbusTcpClient：pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器；host：网络连接的目标主机地址，本次传入 HOST；port：网络连接的目标端口，本次传入 PORT；timeout：操作的最长等待时间，本处客户端以秒为单位，本次传入 2；HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503
ok = cli.connect()
# 尝试建立网络连接，将结果保存或写入 ok。
# ok：操作是否成功的布尔结果；connect：尝试建立网络连接；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求

# 累积输出行
lines = []
# 根据 [] 设置 lines，供当前流程后续使用。
# lines：保存 [] 的结果
# 这一段定义 w，用于将调试信息写入输出列表并同步打印到控制台。
def w(s): lines.append(s); print(s, flush=True)
# 定义 w，用于将调试信息写入输出列表并同步打印到控制台。
# append：把一个元素追加到 Python 列表末尾；s：方法输入参数；lines：保存 [] 的结果
# 这一段实现了将调试信息写入输出列表并同步打印到控制台；返回值或异常由调用方按当前分支处理。

# 打印连接结果
w(f"connect {HOST}:{PORT} unit={UNIT}: {'OK' if ok else 'FAIL'}")
# 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503；UNIT：本次 Modbus 请求的目标设备站号，当前配置为 2；ok：操作是否成功的布尔结果
# 连不上直接退出
if not ok: raise SystemExit(1)
# 连接未成功时立即以失败状态退出脚本，避免继续读取 PLC。
# ok：操作是否成功的布尔结果

# 一次读 11 个 word
rr = cli.read_holding_registers(address=0, count=11, slave=UNIT)
# 通过 PLC 客户端从寄存器地址 0 起读取 11 个保持寄存器，目标站号取 UNIT，响应保存到 rr。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0；count：本次读取或数据结构声明的数量，本次传入 11；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 UNIT；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；UNIT：本次 Modbus 请求的目标设备站号，当前配置为 2
if rr.isError():
# 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
    w(f"读取失败: {rr}"); cli.close(); raise SystemExit(2)
    # 打印本次寄存器读取错误，关闭 PLC 客户端，再以失败状态退出脚本。
    # w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；close：关闭连接或释放当前打开的资源；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组

# 取出寄存器数组
regs = rr.registers
# 根据 rr.registers 设置 regs，用于从 Modbus 响应 rr 取得的 16 位寄存器值数组。
# regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
w(f"\n原始 11 个 word: {regs}")
# 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
# 十六进制形式（和 PLC 的 DB 块地址对照时更直观）
w(f"十六进制: {[hex(r) for r in regs]}")
# 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组

# 按映射表翻译(假设缩放)
# ---- 按映射表翻译（假设缩放）----
# 候选信号名（现场对照用）
NAMES = ["J1","J2","J3","J4","J5","J6","speedPct","mode","alarmCode","lineState","beatMs(÷10)"]
# 根据 ["J1","J2","J3","J4","J5","J6","speedPct","mode","alarmCode","lineState","beatMs(÷10)… 设置 NAMES，用于与读取的寄存器顺序对应的现场信号名称列表。
# NAMES：与读取的寄存器顺序对应的现场信号名称列表
# 缩放系数：物理量 = 原始值 × scale
#   前 6 个是关节角，0.1 表示 PLC 里存的是"度的 10 倍"
#   最后 beatMs 是 ÷10（PLC 存的是 10ms 为单位的节拍）
SCALES= [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1,    1,    1,          1,        10]
# 根据 [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1, 1, 1, 1, 10] 设置 SCALES，用于各寄存器原始值转换为物理量所用的缩放系数列表。
# SCALES：各寄存器原始值转换为物理量所用的缩放系数列表
# 是否按有符号解释：关节角可以为负 → True；计数/状态 → False
SIGNED = [True,True,True,True,True,True, False, False, False,    False,    False]
# 根据 [True,True,True,True,True,True, False, False, False, False, False] 设置 SIGNED，用于标记各寄存器是否按 16 位有符号整数解释的列表。
# SIGNED：标记各寄存器是否按 16 位有符号整数解释的列表

w(f"\n按 0.1° 缩放翻译:")
# 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
# 表头
w(f"{'DB':<5} {'名字':<14} {'原始':>8} {'缩放后':>10} {'物理量':<20}")
# 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
# 逐个打印：原始值 → 有符号值 → 乘缩放 → 物理量
for i, r in enumerate(regs):
# 循环处理i, r in enumerate(regs):，按判断结果进入对应的处理分支。
# i：逐项遍历 enumerate(regs) 的当前元素；r：逐项遍历 enumerate(regs) 的当前元素；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    v = to_signed(r) if SIGNED[i] else r
    # 把 16 位无符号寄存器值转换为有符号整数，将结果保存或写入 v。
    # v：保存 to_signed(r) if SIGNED[i] else r 的结果；r：逐项遍历 enumerate(regs) 的当前元素；SIGNED：标记各寄存器是否按 16 位有符号整数解释的列表；i：逐项遍历 enumerate(regs) 的当前元素；to_signed：把 16 位无符号寄存器值转换为有符号整数
    phys = v * SCALES[i]
    # 根据 v * SCALES[i] 设置 phys，供当前流程后续使用。
    # phys：保存 v * SCALES[i] 的结果；v：保存 to_signed(r) if SIGNED[i] else r 的结果；SCALES：各寄存器原始值转换为物理量所用的缩放系数列表；i：逐项遍历 enumerate(regs) 的当前元素
    w(f"DB[{i}] {NAMES[i]:<14} {r:>6} -> {v:>6} * {SCALES[i]:>5} = {phys:>10.1f}")
    # 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
    # w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；i：逐项遍历 enumerate(regs) 的当前元素；r：逐项遍历 enumerate(regs) 的当前元素；v：保存 to_signed(r) if SIGNED[i] else r 的结果；phys：保存 v * SCALES[i] 的结果；NAMES：与读取的寄存器顺序对应的现场信号名称列表；SCALES：各寄存器原始值转换为物理量所用的缩放系数列表

# 也尝试按 FLOAT32 (大端) 解读看是否有 REAL 数据藏在这里
# ---- 也尝试按 FLOAT32 (大端) 解读，看是否有 REAL 数据藏在这里 ----
w(f"\n尝试按 REAL(大端)解读:作为参考(可能无意义)")
# 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
# 每 2 个寄存器凑一个 32 位浮点
for i in range(0, 11, 2):
# 循环处理i in range(0, 11, 2):，按判断结果进入对应的处理分支。
# i：逐项遍历 range(0, 11, 2) 的当前元素
    # 需要完整的 2 个寄存器
    if i+1 >= 11: break
    # 检查i+1 >= 11: break，按判断结果进入对应的处理分支。
    # i：逐项遍历 range(0, 11, 2) 的当前元素
    pair = regs[i:i+2]
    # 根据 regs[i:i+2] 设置 pair，供当前流程后续使用。
    # pair：保存 regs[i:i + 2] 的结果；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组；i：逐项遍历 range(0, 11, 2) 的当前元素
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        d = BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordorder=Endian.BIG)
        # 从 Modbus 寄存器数组创建二进制载荷解码器，将结果保存或写入 d。
        # d：保存 BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordord… 的结果；pair：保存 regs[i:i + 2] 的结果；BinaryPayloadDecoder：旧版 pymodbus 的二进制寄存器解码器；Endian：旧版 pymodbus 表示字节顺序的枚举
        f = d.decode_32bit_float()
        # 执行 decode_32bit_float 对应的本地处理，使用本行提供的数据，将结果保存或写入 f。
        # f：保存 d.decode_32bit_float() 的结果；d：保存 BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordord… 的结果
        w(f"  [{i},{i+1}] as float = {f}")
        # 把本行格式化的寄存器读取信息写入输出列表，并同步显示在控制台。
        # w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；i：逐项遍历 range(0, 11, 2) 的当前元素；f：保存 d.decode_32bit_float() 的结果
    except: pass
    # 开始异常处理分支，接收前面代码抛出的错误。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定

# 关闭连接
cli.close()
# 关闭当前通信连接。
# close：关闭连接或释放当前打开的资源；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
w("\n完成")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台

# 结果落盘
with open(OUT, "w", encoding="utf-8") as f:
# 按指定模式打开文件。
# open：按指定模式打开文件；OUT：保存寄存器读取和解码结果的本地文件路径；f：保存 d.decode_32bit_float() 的结果
    f.write("\n".join(lines))
    # 把本行提供的内容写到已打开的文件或通信目标。
    # f：保存 d.decode_32bit_float() 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；lines：保存 [] 的结果
    # 这一段提供了现场读取前 11 个寄存器并输出原始值和解码结果所需的定义和处理逻辑，结果交由调用方或运行环境使用。
