"""PLC 数据位置扫描:试不同 unit 和地址范围,找能读出非零数据的位置。"""
import sys
from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian

HOST = "192.168.10.31"
PORT = 503

cli = ModbusTcpClient(host=HOST, port=PORT, timeout=2)
if not cli.connect():
    print("连接失败")
    sys.exit(1)
print("已连接")

# 1) 试不同 unit_id 的 address 0
print("\n=== [1] 试 unit_id 1/2/255 × address 0, count 4 ===")
for unit in [1, 2, 255]:
    rr = cli.read_holding_registers(address=0, count=4, slave=unit)
    if rr.isError():
        print(f"  unit={unit}: 错误 {rr}")
    else:
        print(f"  unit={unit}: OK -> {rr.registers}")

# 2) 用 unit=2 在不同地址范围扫描
print("\n=== [2] unit=2, scan address 0..400 step 20, count 4 ===")
for addr in range(0, 400, 20):
    rr = cli.read_holding_registers(address=addr, count=4, slave=2)
    if rr.isError():
        print(f"  addr {addr:>4}: ERR")
    else:
        vals = rr.registers
        print(f"  addr {addr:>4}: {vals}")

# 3) 找一段有非零数据的连续区
print("\n=== [3] unit=2, 找首段非零数据 (addr 0..100 step 1) ===")
for addr in range(0, 100):
    rr = cli.read_holding_registers(address=addr, count=1, slave=2)
    if not rr.isError() and rr.registers and rr.registers[0] != 0:
        # 再读 4 个确认
        rr2 = cli.read_holding_registers(address=addr, count=4, slave=2)
        if not rr2.isError():
            print(f"  addr {addr:>4}: {rr2.registers}")
        break

cli.close()
print("\n=== 完成 ===")
