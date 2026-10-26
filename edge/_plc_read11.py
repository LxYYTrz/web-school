# -*- coding: utf-8 -*-
"""把 11 个 word 全部读出来,按 mapping 表翻译。结果写文件。"""
import json, sys
# 从 Python 环境 导入 json, sys，供后续代码使用。 关键字：import＝导入模块或符号。
from pymodbus.client import ModbusTcpClient
# 从 pymodbus.client 导入 ModbusTcpClient，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pymodbus.payload import BinaryPayloadDecoder
# 从 pymodbus.payload 导入 BinaryPayloadDecoder，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。
from pymodbus.constants import Endian
# 从 pymodbus.constants 导入 Endian，供后续代码使用。 关键字：from＝指定导入来源；import＝导入模块或符号。

# ---- 现场参数 ----
HOST, PORT, UNIT = "192.168.10.31", 503, 2
# 把 "192.168.10.31", 503, 2 的结果赋给 HOST, PORT, UNIT。
# 输出文件
OUT = r"C:\Users\Administrator\deploy_work\plc-read11.out"
# 给 OUT 赋值。

def to_signed(u16):
# 定义函数 to_signed。 关键字：def＝定义 Python 函数。
    # >= 0x8000 说明实际是负数，减去 0x10000（65536）还原
    return u16 if u16 < 0x8000 else u16 - 0x10000
    # 从当前函数返回处理结果。 关键字：return＝返回结果并结束当前函数；if＝按条件分支；else＝进入另一条件分支。

# 创建并连接
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
# 给 cli 赋值。
ok = cli.connect()
# 给 ok 赋值。

# 累积输出行
lines = []
# 给 lines 赋值。
def w(s): lines.append(s); print(s, flush=True)
# 定义函数 w。 关键字：def＝定义 Python 函数；True＝布尔真值。

# 打印连接结果
w(f"connect {HOST}:{PORT} unit={UNIT}: {'OK' if ok else 'FAIL'}")
# 调用函数或对象方法并传入参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
# 连不上直接退出
if not ok: raise SystemExit(1)
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支；not＝逻辑否定；raise＝抛出 Python 异常。

# 一次读 11 个 word
rr = cli.read_holding_registers(address=0, count=11, slave=UNIT)
# 给 rr 赋值。
if rr.isError():
# 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    w(f"读取失败: {rr}"); cli.close(); raise SystemExit(2)
    # 调用函数或对象方法并传入参数。 关键字：raise＝抛出 Python 异常。

# 取出寄存器数组
regs = rr.registers
# 给 regs 赋值。
w(f"\n原始 11 个 word: {regs}")
# 调用函数或对象方法并传入参数。
# 十六进制形式（和 PLC 的 DB 块地址对照时更直观）
w(f"十六进制: {[hex(r) for r in regs]}")
# 调用函数或对象方法并传入参数。 关键字：for＝开始循环。

# 按映射表翻译(假设缩放)
# ---- 按映射表翻译（假设缩放）----
# 候选信号名（现场对照用）
NAMES = ["J1","J2","J3","J4","J5","J6","speedPct","mode","alarmCode","lineState","beatMs(÷10)"]
# 给 NAMES 赋值。
# 缩放系数：物理量 = 原始值 × scale
#   前 6 个是关节角，0.1 表示 PLC 里存的是"度的 10 倍"
#   最后 beatMs 是 ÷10（PLC 存的是 10ms 为单位的节拍）
SCALES= [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 1,    1,    1,          1,        10]
# 给 SCALES 赋值。
# 是否按有符号解释：关节角可以为负 → True；计数/状态 → False
SIGNED = [True,True,True,True,True,True, False, False, False,    False,    False]
# 给 SIGNED 赋值。 关键字：True＝布尔真值；False＝布尔假值。

w(f"\n按 0.1° 缩放翻译:")
# 调用函数或对象方法并传入参数。
# 表头
w(f"{'DB':<5} {'名字':<14} {'原始':>8} {'缩放后':>10} {'物理量':<20}")
# 调用函数或对象方法并传入参数。
# 逐个打印：原始值 → 有符号值 → 乘缩放 → 物理量
for i, r in enumerate(regs):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    v = to_signed(r) if SIGNED[i] else r
    # 给 v 赋值。 关键字：if＝按条件分支；else＝进入另一条件分支。
    phys = v * SCALES[i]
    # 给 phys 赋值。
    w(f"DB[{i}] {NAMES[i]:<14} {r:>6} -> {v:>6} * {SCALES[i]:>5} = {phys:>10.1f}")
    # 调用函数或对象方法并传入参数。

# 也尝试按 FLOAT32 (大端) 解读看是否有 REAL 数据藏在这里
# ---- 也尝试按 FLOAT32 (大端) 解读，看是否有 REAL 数据藏在这里 ----
w(f"\n尝试按 REAL(大端)解读:作为参考(可能无意义)")
# 调用函数或对象方法并传入参数。
# 每 2 个寄存器凑一个 32 位浮点
for i in range(0, 11, 2):
# 控制后续缩进代码块的执行条件或顺序。 关键字：for＝遍历集合或区间；in＝遍历键或判断成员。
    # 需要完整的 2 个寄存器
    if i+1 >= 11: break
    # 控制后续缩进代码块的执行条件或顺序。 关键字：if＝按条件分支。
    pair = regs[i:i+2]
    # 给 pair 赋值。
    try:
    # 控制后续缩进代码块的执行条件或顺序。 关键字：try＝进入异常处理块。
        d = BinaryPayloadDecoder.fromRegisters(pair, byteorder=Endian.BIG, wordorder=Endian.BIG)
        # 给 d 赋值。
        f = d.decode_32bit_float()
        # 给 f 赋值。
        w(f"  [{i},{i+1}] as float = {f}")
        # 调用函数或对象方法并传入参数。
    except: pass
    # 开始异常处理分支，接收前面代码抛出的错误。 关键字：except＝处理指定异常；pass＝保留空语句块。

# 关闭连接
cli.close()
# 调用函数或对象方法并传入参数。
w("\n完成")
# 调用函数或对象方法并传入参数。

# 结果落盘
with open(OUT, "w", encoding="utf-8") as f:
# 控制后续缩进代码块的执行条件或顺序。 关键字：with＝在资源上下文中执行；as＝为导入或上下文对象命名。
    f.write("\n".join(lines))
    # 调用函数或对象方法并传入参数。
