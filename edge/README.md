# 边缘采集器

`plc_collector.py` 读取 S7-1200 的 Modbus TCP 保持寄存器，并按 `docs/contract/README.md` 发送 MQTT 报文；`mock_collector.py` 用于没有 PLC 的开发环境。两者不可同时占用同一个采集器身份。现场点位在 `register-mapping.csv`：word 0–5 六轴角度、6 产线状态、7–10 控制写点、11–16 六路只读 IO。

```powershell
py -3 -m pip install -r requirements.txt
py -3 plc_collector.py
```

开发机改用 `py -3 mock_collector.py`。断网时采集器、Broker 和后端仍在工控机本地运行；云端只影响远程查看。`plc_collector.py` 订阅命令主题、按 `CMD_DISPATCH` 写寄存器并发回 `cmd_ack`。收到回执表示写入请求得到响应，物理动作仍需现场确认。

`register-mapping.README.md` 解释点位表格式。`plc_read_state.py` 只读探测 PLC；现场 Modbus 服务只接受一个客户端，运行探针前先停采集器，结束后恢复。`_test_decode.py` 和 `_test_cmd.py` 可验证解码与命令映射，无需真实 PLC。
