"""把 11 个 word 全部读出来,按 mapping 表翻译。结果写文件。"""
import json, sys
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

HOST, PORT, UNIT = "192.168.10.31", 503, 2
OUT = r"C:\Users\Administrator\deploy_work\plc-read11.out"

def to_signed(u16):
    return u16 if u16 < 0x8000 else u16 - 0x10000

cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
ok = cli.connect()

lines = []
def w(s): lines.append(s); print(s, flush=True)

w(f"connect {HOST}:{PORT} unit={UNIT}: {'OK' if ok else 'FAIL'}")
if not ok: raise SystemExit(1)

# 一次读 11 个 word
rr = cli.read_holding_registers(address=0, count=11, slave=UNIT)
if rr.isError():
    w(f"读取失败: {rr}"); cli.close(); raise SystemExit(2)

regs = rr.registers
w(f"\n原始 11 个 word: {regs}")
w(f"十六进制: {[hex(r) for r in regs]}")

# 按映射表翻译(假设缩放)
NAMES = ["J1","J2","J3","J4","J5","J6","speedPct","mode","alarmCode","lineState","beatMs(÷10)"]
SCALES= [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1,    1,    1,          1,        10]
SIGNED = [True,True,True,True,True,True, False, False, False,    False,    False]

w(f"\n按 0.1° 缩放翻译:")
w(f"{'DB':<5} {'名字':<14} {'原始':>8} {'缩放后':>10} {'物理量':<20}")
for i, r in enumerate(regs):
    v = to_signed(r) if SIGNED[i] else r
    phys = v * SCALES[i]
    w(f"DB[{i}] {NAMES[i]:<14} {r:>6} -> {v:>6} * {SCALES[i]:>5} = {phys:>10.1f}")

# 也尝试按 FLOAT32 (大端) 解读看是否有 REAL 数据藏在这里
w(f"\n尝试按 REAL(大端)解读:作为参考(可能无意义)")
for i in range(0, 11, 2):
    if i+1 >= 11: break
    pair = regs[i:i+2]
    try:
        d = BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordorder=Endian.BIG)
        f = d.decode_32bit_float()
        w(f"  [{i},{i+1}] as float = {f}")
    except: pass

cli.close()
w("\n完成")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
