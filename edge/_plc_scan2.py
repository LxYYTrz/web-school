"""探 Modbus 功能码 + 地址范围,把结果直接写文件。"""
from pymodbus.client import ModbusTcpClient

OUT = r"C:\Users\Administrator\deploy_work\plc-scan2.out"
lines = []
def w(*a):
    s = " ".join(str(x) for x in a)
    print(s, flush=True)
    lines.append(s)

HOST = "192.168.10.31"; PORT = 503
cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
if not cli.connect():
    w("连接失败"); raise SystemExit(1)
w("已连接")

w("\n[1] 读 0x07D0..0x07D3(标准诊断区)")
rr = cli.read_holding_registers(address=0x07D0, count=4, slave=2)
w("  ", "ERR" if rr.isError() else rr.registers)

w("\n[2] Input Registers (FC 04) addr 0 count 16")
rr = cli.read_input_registers(address=0, count=16, slave=2)
w("  ", "ERR" if rr.isError() else rr.registers)

w("\n[3] Coils (FC 01) addr 0 count 16")
rr = cli.read_coils(address=0, count=16, slave=2)
w("  ", "ERR" if rr.isError() else rr.bits[:16])

w("\n[4] Discrete Inputs (FC 02) addr 0 count 16")
rr = cli.read_discrete_inputs(address=0, count=16, slave=2)
w("  ", "ERR" if rr.isError() else rr.bits[:16])

w("\n[5] HR 范围扫描 1..255 step 1 (找可读段)")
ok_ranges = []
in_range = False; start = None
for addr in range(1, 256):
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    if not rr.isError():
        if not in_range:
            start = addr; in_range = True
    else:
        if in_range:
            ok_ranges.append((start, addr-1)); in_range = False
if in_range: ok_ranges.append((start, 255))
w(f"  可读区段: {ok_ranges}")

w("\n[6] 完整读 HR[0..15]")
rr = cli.read_holding_registers(address=0, count=16, slave=2)
if not rr.isError():
    w(f"  raw: {rr.registers}")
    nz = [(i, v) for i, v in enumerate(rr.registers) if v != 0]
    w(f"  非零: {nz if nz else '(全 0)'}")

w("\n[7] unit=2/3/4/255 在 addr=0 的对比")
for u in [1, 2, 3, 4, 5, 255]:
    rr = cli.read_holding_registers(address=0, count=4, slave=u)
    w(f"  unit={u}: {'ERR' if rr.isError() else rr.registers}")

cli.close()
w("\n完成")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
