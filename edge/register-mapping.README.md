# PLC 点位表

`register-mapping.csv` 是当前现场 S7-1200 的 Modbus TCP 映射。采集器读取 DB3 `MB_SERVER` HOLD 区的 word 0–16，共 17 个 word；实际 PLC 映射与此不一致时，以电气工程师给出的现场表为准，先核对再修改 CSV。

| word | 用途 |
|---|---|
| 0–5 | `robot.joints[0..5]`，有符号整数除以 10 得到角度。 |
| 6 | `line.state`，由 `STATE_MAP` 转成契约字符串。 |
| 7–10 | `cmd.stop`、`cmd.modeToggle`、`cmd.start`、`cmd.conveyor` 写入点。 |
| 11–16 | `io.sensorIn`、`io.sensorArrive`、`io.sensorRetreat`、`io.lightColor`、`io.trayUp`、`io.blockUp`，只读。 |

CSV 中的 `address` 是 Modbus word 地址，`scale` 用于换算工程量。`cmd.*` 行只能由控制命令分发逻辑使用，不能放进周期读数展示。新增读取点位通常只需更新 CSV；新增写入点还需核对 `plc_collector.py` 的 `CMD_DISPATCH`、后端白名单和数据契约。

PLC 的 `MB_SERVER` 必须覆盖 word 0–16。现场只允许一个客户端连接；运行 `test/plc_read_state.py` 或扫描工具前先停正在运行的采集器，结束后恢复。可先运行 `test/_test_decode.py` 和 `test/_test_cmd.py` 检查解码与命令映射。
