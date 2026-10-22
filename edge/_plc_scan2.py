# -*- coding: utf-8 -*-
"""
===============================================================================
文件作用：PLC 功能码与地址范围全面探测脚本（现场排障用，一次性工具）
所属模块：edge/
===============================================================================

【用途】
    比 _plc_scan.py 更彻底：把 Modbus 的四类数据区、常用诊断地址、
    多个 unit id 一次性全试一遍，结果同时打印并写文件。
    适合"读不到数据、怀疑协议/区段选错了"的场景。

【探测的四类数据区（对应四个功能码）】
    功能码 03  保持寄存器  Holding Registers   ← 最常用，读配置/设定值
    功能码 04  输入寄存器  Input Registers     ← 常放实时测量值
    功能码 01  线圈        Coils               ← 位操作（启停）
    功能码 02  离散输入    Discrete Inputs      ← 位状态（限位/报警）
    ★ 如果 03 读不到但 04 能读到，说明数据在输入区而不是保持区。

【怎么用】
    1. 改 HOST / PORT
    2. python _plc_scan2.py
    3. 结果同时写到 C:\\Users\\Administrator\\deploy_work\\plc-scan2.out

【注意】文件名前缀下划线 `_` 表示"工具，非系统组成部分"。
"""

from pymodbus.client import ModbusTcpClient

# 输出文件路径（同时打印到屏幕 + 存盘，方便回传给开发/电气工程师）
OUT = r"C:\Users\Administrator\deploy_work\plc-scan2.out"
# 累积的输出行
lines = []


def w(*a):
    """写一行到屏幕和文件（flush=True 保证实时刷新，不被缓冲卡住）。"""
    s = " ".join(str(x) for x in a)
    print(s, flush=True)
    lines.append(s)


# ---- 现场参数 ----
HOST = "192.168.10.31"; PORT = 503

# 创建并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
if not cli.connect():
    w("连接失败"); raise SystemExit(1)
w("已连接")

# ---- [1] 标准诊断区 ----
# 0x07D0(2000) 是 Modbus 规定的"诊断保留区"，部分 PLC 在这里放诊断信息
w("\n[1] 读 0x07D0..0x07D3(标准诊断区)")
rr = cli.read_holding_registers(address=0x07D0, count=4, slave=2)
w("  ", "ERR" if rr.isError() else rr.registers)

# ---- [2] 输入寄存器（FC 04）----
w("\n[2] Input Registers (FC 04) addr 0 count 16")
rr = cli.read_input_registers(address=0, count=16, slave=2)
w("  ", "ERR" if rr.isError() else rr.registers)

# ---- [3] 线圈（FC 01）----
w("\n[3] Coils (FC 01) addr 0 count 16")
rr = cli.read_coils(address=0, count=16, slave=2)
# bits 是位数组，只看前 16 个
w("  ", "ERR" if rr.isError() else rr.bits[:16])

# ---- [4] 离散输入（FC 02）----
w("\n[4] Discrete Inputs (FC 02) addr 0 count 16")
rr = cli.read_discrete_inputs(address=0, count=16, slave=2)
w("  ", "ERR" if rr.isError() else rr.bits[:16])

# ---- [5] 扫描保持寄存器的可读区段 ----
# 逐地址读 1 个，把连续的"可读"地址归并成区段
w("\n[5] HR 范围扫描 1..255 step 1 (找可读段)")
ok_ranges = []
in_range = False; start = None
for addr in range(1, 256):
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    if not rr.isError():
        # 可读 —— 若还没进入区段则记录起点
        if not in_range:
            start = addr; in_range = True
    else:
        # 不可读 —— 若之前在区段里则收尾
        if in_range:
            ok_ranges.append((start, addr-1)); in_range = False
# 循环结束时可能还处于区段中（一直到 255 都可读）
if in_range: ok_ranges.append((start, 255))
w(f"  可读区段: {ok_ranges}")

# ---- [6] 完整读 HR[0..15] 并列出非零项 ----
w("\n[6] 完整读 HR[0..15]")
rr = cli.read_holding_registers(address=0, count=16, slave=2)
if not rr.isError():
    w(f"  raw: {rr.registers}")
    # 挑出非零的 (下标, 值) —— 数据通常就藏在这里
    nz = [(i, v) for i, v in enumerate(rr.registers) if v != 0]
    w(f"  非零: {nz if nz else '(全 0)'}")

# ---- [7] 对比不同 unit id 在 addr=0 的表现 ----
# 用来确认"是不是 unit id 选错了"
w("\n[7] unit=2/3/4/255 在 addr=0 的对比")
for u in [1, 2, 3, 4, 5, 255]:
    rr = cli.read_holding_registers(address=0, count=4, slave=u)
    w(f"  unit={u}: {'ERR' if rr.isError() else rr.registers}")

# 关闭连接
cli.close()
w("\n完成")

# 结果落盘
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
