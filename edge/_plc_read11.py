# -*- coding: utf-8 -*-
"""把 11 个 word 全部读出来,按 mapping 表翻译。结果写文件。"""
import json, sys
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

# ---- 现场参数 ----
HOST, PORT, UNIT = "192.168.10.31", 503, 2
# 输出文件
OUT = r"C:\Users\Administrator\deploy_work\plc-read11.out"

def to_signed(u16):
    # >= 0x8000 说明实际是负数，减去 0x10000（65536）还原
    return u16 if u16 < 0x8000 else u16 - 0x10000

# 创建并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
ok = cli.connect()

# 累积输出行
lines = []
def w(s): lines.append(s); print(s, flush=True)

# 打印连接结果
w(f"connect {HOST}:{PORT} unit={UNIT}: {'OK' if ok else 'FAIL'}")
# 连不上直接退出
if not ok: raise SystemExit(1)

# 一次读 11 个 word
rr = cli.read_holding_registers(address=0, count=11, slave=UNIT)
if rr.isError():
    w(f"读取失败: {rr}"); cli.close(); raise SystemExit(2)

# 取出寄存器数组
regs = rr.registers
w(f"\n原始 11 个 word: {regs}")
# 十六进制形式（和 PLC 的 DB 块地址对照时更直观）
w(f"十六进制: {[hex(r) for r in regs]}")

# 按映射表翻译(假设缩放)
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

# 也尝试按 FLOAT32 (大端) 解读看是否有 REAL 数据藏在这里
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
    except: pass

# 关闭连接
cli.close()
w("\n完成")

# 结果落盘
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
