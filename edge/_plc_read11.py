# -*- coding: utf-8 -*-
"""
===============================================================================
文件作用：按映射表精读 11 个 word 并翻译成物理量（现场对点位用，一次性工具）
所属模块：edge/
===============================================================================

【用途】
    扫描脚本（_plc_scan.py）找到了"数据在哪"之后，用这个脚本把
    那几个寄存器按候选的名字/缩放翻译成人能看懂的工程量，
    跟现场 PLC 程序里的变量对照，确认哪个寄存器对应哪个信号。
    结果写入文件，方便和电气工程师一起核对。

【它输出的三种对照】
    ① 原始 11 个 word 的十进制 + 十六进制
    ② 按候选缩放系数翻译后的物理量（度、%、个、毫秒）
    ③ 再按 FLOAT32 解读一遍 —— 作为"这里会不会其实是 REAL 数据"的参考

【★ 注意 ③ 很可能解出无意义的小数】
    如果 PLC 里存的是 INT16（0.1° 的整数倍），强行按 FLOAT32 解会得到
    0.0 / 1e-42 之类的垃圾值。看到这种值就说明"这里是整数不是浮点"，
    应该用 ② 的翻译方式。

【怎么用】
    1. 改 HOST / PORT / UNIT
    2. 如果点位名/缩放系数变了，改下面的 NAMES / SCALES / SIGNED 三个数组
       ★ 三个数组长度必须一致，且与点位表 register-mapping.csv 保持一致
    3. python _plc_read11.py

【注意】文件名前缀下划线 `_` 表示"工具，非系统组成部分"。
"""

import json, sys
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

# ---- 现场参数 ----
HOST, PORT, UNIT = "192.168.10.31", 503, 2
# 输出文件
OUT = r"C:\Users\Administrator\deploy_work\plc-read11.out"


def to_signed(u16):
    """把 Modbus 的 16 位无符号寄存器转成有符号整数。"""
    # >= 0x8000 说明实际是负数，减去 0x10000（65536）还原
    return u16 if u16 < 0x8000 else u16 - 0x10000


# 创建并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
ok = cli.connect()

# 累积输出行
lines = []


def w(s):
    """写一行到屏幕和文件。flush=True 保证实时刷新。"""
    lines.append(s); print(s, flush=True)


# 打印连接结果
w(f"connect {HOST}:{PORT} unit={UNIT}: {'OK' if ok else 'FAIL'}")
# 连不上直接退出
if not ok: raise SystemExit(1)

# ---- 一次读 11 个 word ----
w("")
rr = cli.read_holding_registers(address=0, count=11, slave=UNIT)
if rr.isError():
    w(f"读取失败: {rr}"); cli.close(); raise SystemExit(2)

# 取出寄存器数组
regs = rr.registers
w(f"\n原始 11 个 word: {regs}")
# 十六进制形式（和 PLC 的 DB 块地址对照时更直观）
w(f"十六进制: {[hex(r) for r in regs]}")

# ---- 按映射表翻译（假设缩放）----
# 候选信号名（现场对照用）
NAMES = ["J1","J2","J3","J4","J5","J6","speedPct","mode","alarmCode","lineState","beatMs(÷10)"]
# 缩放系数：物理量 = 原始值 × scale
#   前 6 个是关节角，0.1 表示 PLC 里存的是"度的 10 倍"
#   最后 beatMs 是 ÷10（PLC 存的是 10ms 为单位的节拍）
SCALES= [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1,    1,    1,          1,        10]
# 是否按有符号解释：关节角可以为负 → True；计数/状态 → False
SIGNED = [True,True,True,True,True,True, False, False, False,    False,    False]

w(f"\n按 0.1° 缩放翻译:")
# 表头
w(f"{'DB':<5} {'名字':<14} {'原始':>8} {'缩放后':>10} {'物理量':<20}")
# 逐个打印：原始值 → 有符号值 → 乘缩放 → 物理量
for i, r in enumerate(regs):
    v = to_signed(r) if SIGNED[i] else r
    phys = v * SCALES[i]
    w(f"DB[{i}] {NAMES[i]:<14} {r:>6} -> {v:>6} * {SCALES[i]:>5} = {phys:>10.1f}")

# ---- 也尝试按 FLOAT32 (大端) 解读，看是否有 REAL 数据藏在这里 ----
w(f"\n尝试按 REAL(大端)解读:作为参考(可能无意义)")
# 每 2 个寄存器凑一个 32 位浮点
for i in range(0, 11, 2):
    # 需要完整的 2 个寄存器
    if i+1 >= 11: break
    pair = regs[i:i+2]
    try:
        d = BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordorder=Endian.BIG)
        f = d.decode_32bit_float()
        w(f"  [{i},{i+1}] as float = {f}")
    except: pass   # 解不出来就跳过（不影响其它）

# 关闭连接
cli.close()
w("\n完成")

# 结果落盘
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
