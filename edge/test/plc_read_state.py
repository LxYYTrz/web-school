"""只读状态探针:读一次 PLC,打印产线状态 / IO / 关节角。

用途:工控机上做验收(状态是不是 stopped?IO 是否对得上?),不写任何寄存器。
本文件**只调用 read_holding_registers**,不存在任何写调用。

用法:
    python edge/test/plc_read_state.py
    python edge/test/plc_read_state.py --host 192.168.10.31 --port 503 --unit 2
退出码:0=读成功;1=读失败
"""
# 这一段负责读取并显示现场 PLC 的状态寄存器，为后续代码提供当前文件的处理入口。
import argparse
# 从 Python 环境 导入 argparse，供后续代码使用。
# argparse：来自 argparse，供本文件后续调用的对象
import os
# 从 Python 环境 导入 os，供后续代码使用。
# os：来自 os，Python 操作系统环境变量接口
import sys
# 从 Python 环境 导入 sys，供后续代码使用。
# sys：来自 sys，Python 运行环境与退出状态接口

from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。
# ModbusTcpClient：来自 pymodbus.client，pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器

# 与 plc_collector.py 保持一致(契约 v1.1 §3.8 / db/init/004+005_line_state_stages.sql)
STATE_MAP = {
# 根据 { 设置 STATE_MAP，供当前流程后续使用。
# STATE_MAP：保存 {0: 'waiting_feed', 1: 'feeding', 2: 'assembling', 3: 'waiting_robot',… 的结果
    0: "waiting_feed",   # 等待入料
    # 与 plc_collector.py 保持一致(契约 v1.1 §3.8 / db/init/004+005_line_state_stages.sql)。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    1: "feeding",        # 入料中
    # 设置字段 1，值为 "feeding",        # 入料中，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    2: "assembling",     # 装配中
    # 设置字段 2，值为 "assembling",     # 装配中，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    3: "waiting_robot",  # 等待机器人完成
    # 设置字段 3，值为 "waiting_robot",  # 等待机器人完成，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    4: "unload_done",    # 下料完成
    # 设置字段 4，值为 "unload_done",    # 下料完成，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    5: "waiting_next",   # 等待后站入料
    # 设置字段 5，值为 "waiting_next",   # 等待后站入料，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    100: "init_error",   # 初始化错误状态
    # 设置字段 100，值为 "init_error",   # 初始化错误状态，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    101: "stopped",      # 停止状态
    # 设置字段 101，值为 "stopped",      # 停止状态，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    102: "manual_mode",  # 手动控制模式
    # 设置字段 102，值为 "manual_mode",  # 手动控制模式，供当前处理流程继续使用。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 本行结束上面最近一层已经介绍的表达式或代码块
IO_NAMES = ["sensorIn", "sensorArrive", "sensorRetreat", "lightColor", "trayUp", "blockUp"]
# 根据 ["sensorIn", "sensorArrive", "sensorRetreat", "lightColor", "trayUp", "blockUp"] 设置 IO_NAMES，供当前流程后续使用。
# IO_NAMES：保存 ['sensorIn', 'sensorArrive', 'sensorRetreat', 'lightColor', 'trayUp', … 的结果
IO_DESC = {
# 根据 { 设置 IO_DESC，供当前流程后续使用。
# IO_DESC：保存 {'lightColor': {0: '绿灯', 1: '黄灯', 2: '红灯'}} 的结果
    "lightColor": {0: "绿灯", 1: "黄灯", 2: "红灯"},
    # 在当前模拟输入或配置映射中，将键 lightColor 设为 {0: "绿灯"。
    # lightColor 是当前映射表的查找键；{0: "绿灯" 是用该键读取时取得的值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 本行结束上面最近一层已经介绍的表达式或代码块


# 这一段定义 to_signed，用于把 16 位无符号寄存器值转换为有符号整数。
def to_signed(u16: int) -> int:
# 定义函数 to_signed。
# to_signed：把 16 位无符号寄存器值转换为有符号整数；u16：方法输入参数，类型为 int
    return u16 if u16 < 0x8000 else u16 - 0x10000
    # 把u16 if u16 < 0x8000 else u16 - 0x10000作为当前函数的结果返回。
    # u16：方法输入参数，类型为 int
    # 这一段实现了把 16 位无符号寄存器值转换为有符号整数；返回值或异常由调用方按当前分支处理。


# 这一段定义 main，用于连接现场 PLC 并读取、显示原始状态寄存器。
def main() -> int:
# 定义 main，用于连接现场 PLC 并读取、显示原始状态寄存器。
# main：本文件定义的函数，用于运行  的入口流程
    ap = argparse.ArgumentParser(description="只读读一次 PLC 状态")
    # 执行 ArgumentParser 对应的本地处理，使用本行提供的数据，将结果保存或写入 ap。
    # ap：保存 argparse.ArgumentParser(description='只读读一次 PLC 状态') 的结果；argparse：从 argparse 导入的模块，类型为 argparse
    ap.add_argument("--host", default=os.getenv("PLC_HOST", "192.168.10.31"))
    # 给命令行解析器添加一项可接受的启动参数。
    # ap：保存 argparse.ArgumentParser(description='只读读一次 PLC 状态') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
    ap.add_argument("--port", type=int, default=int(os.getenv("PLC_PORT", "503")))
    # 给命令行解析器添加一项可接受的启动参数。
    # type：当前报文、指令或对象的类别字段，本次传入 int；ap：保存 argparse.ArgumentParser(description='只读读一次 PLC 状态') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
    ap.add_argument("--unit", type=int, default=int(os.getenv("PLC_UNIT_ID", "2")))
    # 给命令行解析器添加一项可接受的启动参数。
    # type：当前报文、指令或对象的类别字段，本次传入 int；ap：保存 argparse.ArgumentParser(description='只读读一次 PLC 状态') 的结果；getenv：读取操作系统环境变量，未设置时使用指定默认值；os：Python 操作系统环境变量接口
    args = ap.parse_args()
    # 解析启动时传入的命令行选项，将结果保存或写入 args。
    # args：保存 ap.parse_args() 的结果；ap：保存 argparse.ArgumentParser(description='只读读一次 PLC 状态') 的结果

    cli = ModbusTcpClient(host=args.host, port=args.port, timeout=3)
    # 创建或使用pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器，将结果保存或写入 cli。
    # cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；ModbusTcpClient：pymodbus 提供的 Modbus TCP 客户端类，用于连接 PLC 并读写寄存器；host：网络连接的目标主机地址，本次传入 args.host；port：网络连接的目标端口，本次传入 args.port；timeout：操作的最长等待时间，本处客户端以秒为单位，本次传入 3；args：保存 ap.parse_args() 的结果
    if not cli.connect():
    # 检查not cli.connect():，按判断结果进入对应的处理分支。
    # cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；connect：尝试建立网络连接
        print(f"[FAIL] 连不上 PLC {args.host}:{args.port} —— 检查网线/路由/PLC 是否上电")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # host：网络连接的目标主机地址；port：网络连接的目标端口；args：保存 ap.parse_args() 的结果
        return 1
        # 把1作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    try:
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        # 逐点读(与 plc_collector.read_all 同策略:一次读一段,失败不影响其它点)
        regs = []
        # 根据 [] 设置 regs，用于从 Modbus 响应 rr 取得的 16 位寄存器值数组。
        # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
        for addr in range(17):
        # 循环处理addr in range(17):，按判断结果进入对应的处理分支。
        # addr：逐项遍历 range(17) 的当前元素
            try:
            # 开始执行可能失败的操作，错误由后续异常分支处理。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
                rr = cli.read_holding_registers(address=addr, count=1, device_id=args.unit)
                # 向 PLC 读取指定寄存器，将结果保存或写入 rr。
                # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；read_holding_registers：通过 Modbus 功能码 0x03 读取连续保持寄存器，返回响应对象；address：Modbus 寄存器起始地址，使用从 0 开始的编号，本次传入 addr；count：本次读取或数据结构声明的数量，本次传入 1；device_id：pymodbus 当前接口的目标设备站号参数，本次传入 args.unit；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求；addr：逐项遍历 range(17) 的当前元素；unit：设备站号或点位物理单位，依据所在对象区分；args：保存 ap.parse_args() 的结果
            except Exception as exc:
            # 接收并处理上一段操作产生的异常。
            # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
                regs.append(None)
                # 把一个元素追加到 Python 列表末尾。
                # append：把一个元素追加到 Python 列表末尾；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
                print(f"  word {addr:2d} 读取异常: {exc}")
                # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
                # addr：逐项遍历 range(17) 的当前元素
                continue
                # 跳过本轮剩余语句，进入下一次循环。
                # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            if rr.isError():
            # 检查本次 Modbus 响应是否报错；若报错则进入读取失败分支。
            # rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组；isError：判断 Modbus 响应是否携带协议错误
                regs.append(None)
                # 把一个元素追加到 Python 列表末尾。
                # append：把一个元素追加到 Python 列表末尾；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
                print(f"  word {addr:2d} 读失败: {rr}")
                # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
                # addr：逐项遍历 range(17) 的当前元素；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
                continue
                # 跳过本轮剩余语句，进入下一次循环。
                # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
            regs.append(rr.registers[0])
            # 把一个元素追加到 Python 列表末尾。
            # append：把一个元素追加到 Python 列表末尾；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组；registers：Modbus 读取响应中按地址顺序排列的 16 位寄存器数值列表；rr：本次 read_holding_registers 调用返回的 Modbus 响应，包含错误标记与寄存器数组
    except Exception as exc:
    # 接收并处理上一段操作产生的异常。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        print(f"[FAIL] 读 PLC 异常: {exc}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        return 1
        # 把1作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    finally:
    # 执行无论上面操作成功还是失败都需要的清理步骤。
    # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        cli.close()
        # 关闭当前通信连接。
        # close：关闭连接或释放当前打开的资源；cli：在本文件创建的 Modbus TCP 通信客户端，用于连接 PLC 并发送寄存器请求

    if regs[6] is None:
    # 检查regs[6] is None:，按判断结果进入对应的处理分支。
    # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
        print("[FAIL] 产线状态点(word 6)读不到,无法判定状态")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
        return 1
        # 把1作为当前函数的结果返回。
        # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理

    joints = [to_signed(regs[i]) / 10 for i in range(6)]
    # 把 16 位无符号寄存器值转换为有符号整数，将结果保存或写入 joints。
    # joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；to_signed：把 16 位无符号寄存器值转换为有符号整数；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    state_raw = regs[6]
    # 根据 regs[6] 设置 state_raw，供当前流程后续使用。
    # state_raw：保存 regs[6] 的结果；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    state = STATE_MAP.get(state_raw, f"unknown({state_raw})")
    # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 state。
    # state：当前状态值或实时状态服务实例，以所在对象为准；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；state_raw：保存 regs[6] 的结果；STATE_MAP：保存 {0: 'waiting_feed', 1: 'feeding', 2: 'assembling', 3: 'waiting_robot',… 的结果

    print(f"[OK] PLC {args.host}:{args.port} unit={args.unit}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # host：网络连接的目标主机地址；port：网络连接的目标端口；unit：设备站号或点位物理单位，依据所在对象区分，本次传入 {args.unit}"；args：保存 ap.parse_args() 的结果
    print(f"  产线状态 word6 = {state_raw} -> {state}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # state_raw：保存 regs[6] 的结果；state：当前状态值或实时状态服务实例，以所在对象为准
    print(f"  关节角 word0..5 = {joints}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度
    io = {IO_NAMES[i]: regs[11 + i] for i in range(6)}
    # 执行 range 对应的本地处理，使用本行提供的数据，将结果保存或写入 io。
    # io：现场 IO 信号对象或当前 IO 状态帧；IO_NAMES：保存 ['sensorIn', 'sensorArrive', 'sensorRetreat', 'lightColor', 'trayUp', … 的结果；regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组
    for k, v in io.items():
    # 循环处理k, v in io.items():，按判断结果进入对应的处理分支。
    # k：逐项遍历 io.items() 的当前元素；v：逐项遍历 io.items() 的当前元素；io：现场 IO 信号对象或当前 IO 状态帧；items：取得字典的键值对迭代器
        extra = IO_DESC.get(k, {}).get(v, "")
        # 按键读取缓存、映射、字典或状态中的值，具体由接收对象决定，将结果保存或写入 extra。
        # extra：保存 IO_DESC.get(k, {}).get(v, '') 的结果；get：按键读取缓存、映射、字典或状态中的值，具体由接收对象决定；v：逐项遍历 io.items() 的当前元素；k：逐项遍历 io.items() 的当前元素；IO_DESC：保存 {'lightColor': {0: '绿灯', 1: '黄灯', 2: '红灯'}} 的结果
        print(f"  IO {k:<14} = {v} {extra}")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # k：逐项遍历 io.items() 的当前元素；v：逐项遍历 io.items() 的当前元素；extra：保存 IO_DESC.get(k, {}).get(v, '') 的结果
    print(f"  写点 word7..10 (stop/mode/start/conveyor) = {regs[7:11]}")
    # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
    # regs：从 Modbus 响应 rr 取得的 16 位寄存器值数组

    if state_raw == 101:
    # 检查state_raw == 101:，按判断结果进入对应的处理分支。
    # state_raw：保存 regs[6] 的结果
        print("  → 产线处于 stopped,可执行控制指令验证步骤 2(获取手动模式)")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    elif state_raw == 102:
    # 检查state_raw == 102:，按判断结果进入对应的处理分支。
    # state_raw：保存 regs[6] 的结果
        print("  → 产线处于 manual_mode,可执行传送带/启动验证")
        # 把本行计算或格式化的内容输出到终端，供检查采集或测试结果。
        # 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    return 0
    # 把0作为当前函数的结果返回。
    # 返回值或异常使用上方流程得到的数据，由当前函数的调用方处理
    # 这一段实现了连接现场 PLC 并读取、显示原始状态寄存器；返回值或异常由调用方按当前分支处理。


if __name__ == "__main__":
# 检查__name__ == "__main__":，按判断结果进入对应的处理分支。
# 本行使用当前函数或配置段中已经定义的名称，具体取值由相邻的定义和数据契约确定
    sys.exit(main())
    # 以指定状态码结束当前进程或处理流程。
    # sys：Python 运行环境与退出状态接口；main：本文件定义的函数，用于运行  的入口流程
    # 这一段提供了读取并显示现场 PLC 的状态寄存器所需的定义和处理逻辑，结果交由调用方或运行环境使用。
