# -*- coding: utf-8 -*-
"""探 Modbus 功能码 + 地址范围,把结果直接写文件。"""
# 这一段负责按候选地址和读取范围检查现场 PLC 寄存器可达性，为后续代码提供当前文件的处理入口。
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。
# ModbusTcpClient：来自 pymodbus.client，pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器

# 输出文件路径（同时打印到屏幕 + 存盘，方便回传给开发/电气工程师）
OUT = r"C:\Users\Administrator\deploy_work\plc-scan2.out"
# 根据 r"C:\Users\Administrator\deploy_work\plc-scan2.out" 设置 OUT，用于保存寄存器读取和解码结果的本地文件路径。
# OUT：保存寄存器读取和解码结果的本地文件路径
# 累积的输出行
lines = []
# 根据 [] 设置 lines，供当前流程后续使用。
# lines：保存 [] 的结果
# 这一段定义 w，用于将调试信息写入输出列表并同步打印到控制台。
def w(*a):
# 定义 w，用于将调试信息写入输出列表并同步打印到控制台。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
    s = " ".join(str(x) for x in a)
    # 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准，将结果保存或写入 s。
    # s：保存 ' '.join((str(x) for x in a)) 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准
    print(s, flush=True)
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # s：保存 ' '.join((str(x) for x in a)) 的结果
    lines.append(s)
    # 把一个元素追加到 Python 列表末尾。
    # append：把一个元素追加到 Python 列表末尾；s：保存 ' '.join((str(x) for x in a)) 的结果；lines：保存 [] 的结果
    # 这一段实现了将调试信息写入输出列表并同步打印到控制台；返回值或异常由调用方按当前分支处理。

# ---- 现场参数 ----
HOST = "192.168.10.31"; PORT = 503
# 根据 "192.168.10.31"; PORT = 503 设置 HOST，用于现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31。
# HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503，本次传入 503
# 创建并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 创建或使用pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器，将结果保存或写入 cli。
# cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；ModbusTcpClient：pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器；host：网络连接的目标主机地址，本次传入 HOST；port：网络连接的目标端口，本次传入 PORT；timeout：操作的最长等待时间，本处客户端以秒为单位，本次传入 2；HOST：现场 PLC 的目标 IP 地址，当前配置为 192.168.10.31；PORT：现场 PLC 的 Modbus TCP 端口，当前配置为 503
if not cli.connect():
# 检查not cli.connect():，按判断结果进入对应的处理分支。
# cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；connect：尝试建立网络连接
    w("连接失败"); raise SystemExit(1)
    # 把本行信息写入调试输出列表并同步打印到终端。
    # w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
w("已连接")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台

# ---- [1] 标准诊断区 ----
# 0x07D0(2000) 是 Modbus 规定的"诊断保留区"，部分 PLC 在这里放诊断信息
w("\n[1] 读 0x07D0..0x07D3(标准诊断区)")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
rr = cli.read_holding_registers(address=0x07D0, count=4, slave=2)
# 通过 PLC 客户端从寄存器地址 0x07D0 起读取 4 个保持寄存器，目标站号取 2，响应保存到 rr。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0x07D0；count：本次读取或数据结构声明的数量，本次传入 4；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
w("  ", "ERR" if rr.isError() else rr.registers)
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；isError：判断 Modbus 响应是否携带协议错误；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组

# ---- [2] 输入寄存器（FC 04）----
w("\n[2] Input Registers (FC 04) addr 0 count 16")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
rr = cli.read_input_registers(address=0, count=16, slave=2)
# 从 PLC 读取指定范围的输入寄存器，将结果保存或写入 rr。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0；count：本次读取或数据结构声明的数量，本次传入 16；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
w("  ", "ERR" if rr.isError() else rr.registers)
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；isError：判断 Modbus 响应是否携带协议错误；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组

# ---- [3] 线圈（FC 01）----
w("\n[3] Coils (FC 01) addr 0 count 16")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
rr = cli.read_coils(address=0, count=16, slave=2)
# 读取 PLC 线圈位状态，将结果保存或写入 rr。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0；count：本次读取或数据结构声明的数量，本次传入 16；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
# bits 是位数组，只看前 16 个
w("  ", "ERR" if rr.isError() else rr.bits[:16])
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；isError：判断 Modbus 响应是否携带协议错误；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组

# ---- [4] 离散输入（FC 02）----
w("\n[4] Discrete Inputs (FC 02) addr 0 count 16")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
rr = cli.read_discrete_inputs(address=0, count=16, slave=2)
# 读取 PLC 离散输入位状态，将结果保存或写入 rr。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0；count：本次读取或数据结构声明的数量，本次传入 16；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
w("  ", "ERR" if rr.isError() else rr.bits[:16])
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；isError：判断 Modbus 响应是否携带协议错误；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组

# ---- [5] 扫描保持寄存器的可读区段 ----
# 逐地址读 1 个，把连续的"可读"地址归并成区段
w("\n[5] HR 范围扫描 1..255 step 1 (找可读段)")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
ok_ranges = []
# 根据 [] 设置 ok_ranges，供当前流程后续使用。
# ok_ranges：保存 [] 的结果
in_range = False; start = None
# 根据 False; start = None 设置 in_range，供当前流程后续使用。
# in_range：保存 False 的结果；start：启动 Three.js 的连续渲染循环
for addr in range(1, 256):
# 循环处理addr in range(1, 256):，按判断结果进入对应的处理分支。
# addr：逐项遍历 range(1, 256) 的当前元素
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    # 通过 PLC 客户端从寄存器地址 addr 起读取 1 个保持寄存器，目标站号取 2，响应保存到 rr。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 addr；count：本次读取或数据结构声明的数量，本次传入 1；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；addr：逐项遍历 range(1, 256) 的当前元素
    if not rr.isError():
    # 检查not rr.isError():，按判断结果进入对应的处理分支。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
        # 可读 —— 若还没进入区段则记录起点
        if not in_range:
        # 检查not in_range:，按判断结果进入对应的处理分支。
        # in_range：保存 False 的结果
            start = addr; in_range = True
            # 根据 addr; in_range = True 设置 start，供当前流程后续使用。
            # start：启动 Three.js 的连续渲染循环；addr：逐项遍历 range(1, 256) 的当前元素；in_range：保存 True 的结果
    else:
    # 控制后续缩进代码块的执行条件或顺序，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 不可读 —— 若之前在区段里则收尾
        if in_range:
        # 检查in_range:，按判断结果进入对应的处理分支。
        # in_range：保存 True 的结果
            ok_ranges.append((start, addr-1)); in_range = False
            # 把一个元素追加到 Python 列表末尾。
            # in_range：保存 False 的结果；append：把一个元素追加到 Python 列表末尾；ok_ranges：保存 [] 的结果；start：启动 Three.js 的连续渲染循环；addr：逐项遍历 range(1, 256) 的当前元素
# 循环结束时可能还处于区段中（一直到 255 都可读）
if in_range: ok_ranges.append((start, 255))
# 检查in_range: ok_ranges.append((start, 255))，按判断结果进入对应的处理分支。
# in_range：保存 False 的结果；append：把一个元素追加到 Python 列表末尾；ok_ranges：保存 [] 的结果；start：启动 Three.js 的连续渲染循环
w(f"  可读区段: {ok_ranges}")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；ok_ranges：保存 [] 的结果

# ---- [6] 完整读 HR[0..15] 并列出非零项 ----
w("\n[6] 完整读 HR[0..15]")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
rr = cli.read_holding_registers(address=0, count=16, slave=2)
# 通过 PLC 客户端从寄存器地址 0 起读取 16 个保持寄存器，目标站号取 2，响应保存到 rr。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0；count：本次读取或数据结构声明的数量，本次传入 16；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 2；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求
if not rr.isError():
# 检查not rr.isError():，按判断结果进入对应的处理分支。
# rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
    w(f"  raw: {rr.registers}")
    # 把本行信息写入调试输出列表并同步打印到终端。
    # w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
    # 挑出非零的 (下标, 值) —— 数据通常就藏在这里
    nz = [(i, v) for i, v in enumerate(rr.registers) if v != 0]
    # 执行 enumerate 对应的本地处理，使用本行提供的数据，将结果保存或写入 nz。
    # nz：保存 [(i, v) for i, v in enumerate(rr.registers) if v != 0] 的结果；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
    w(f"  非零: {nz if nz else '(全 0)'}")
    # 把本行信息写入调试输出列表并同步打印到终端。
    # w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；nz：保存 [(i, v) for i, v in enumerate(rr.registers) if v != 0] 的结果

# ---- [7] 对比不同 unit id 在 addr=0 的表现 ----
# 用来确认"是不是 unit id 选错了"
w("\n[7] unit=2/3/4/255 在 addr=0 的对比")
# 把本行信息写入调试输出列表并同步打印到终端。
# w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台
for u in [1, 2, 3, 4, 5, 255]:
# 循环处理u in [1, 2, 3, 4, 5, 255]:，按判断结果进入对应的处理分支。
# u：逐项遍历 [1, 2, 3, 4, 5, 255] 的当前元素
    rr = cli.read_holding_registers(address=0, count=4, slave=u)
    # 通过 PLC 客户端从寄存器地址 0 起读取 4 个保持寄存器，目标站号取 u，响应保存到 rr。
    # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 0；count：本次读取或数据结构声明的数量，本次传入 4；slave：旧版 pymodbus 的目标设备站号参数名，本次传入 u；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；u：逐项遍历 [1, 2, 3, 4, 5, 255] 的当前元素
    w(f"  unit={u}: {'ERR' if rr.isError() else rr.registers}")
    # 把本行信息写入调试输出列表并同步打印到终端。
    # w：本文件定义的函数，用于将调试信息写入输出列表并同步打印到控制台；u：逐项遍历 [1, 2, 3, 4, 5, 255] 的当前元素；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；isError：判断 Modbus 响应是否携带协议错误；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组

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
# open：按指定模式打开文件；OUT：保存寄存器读取和解码结果的本地文件路径
    f.write("\n".join(lines))
    # 把本行提供的内容写到已打开的文件或通信目标。
    # join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；lines：保存 [] 的结果
    # 这一段提供了按候选地址和读取范围检查现场 PLC 寄存器可达性所需的定义和处理逻辑，结果交由调用方或运行环境使用。
