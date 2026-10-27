# 启动与检查脚本

| 脚本 | 用途 |
|---|---|
| `start-local.bat` | 本机同时打开后端、采集器和 Vite 开发页面；基础服务需预先运行。 |
| `start-ipc.bat` | 调用 `ipc-recover.ps1` 的批处理入口。 |
| `ipc-recover.ps1` | 检查本机 MQTT/Redis/PostgreSQL，按需启动 SSH 隧道、后端和 PLC 采集器，再执行体检。 |
| `tunnel-keepalive.ps1` | 保持云端 `127.0.0.1:3300` 到工控机 `3000` 的 SSH 反向隧道，可注册计划任务。 |
| `test/verify-line.ps1` | 只读检查本机端口、隧道、后端、公网 API 和快照中的 PLC 数据新鲜度。 |

工控机已安装并运行 MQTT Broker（`1883`）、Redis 兼容服务（`6379`）、PostgreSQL/TimescaleDB（`5432`）后，在仓库根目录运行：

```powershell
.\scripts\ipc-recover.ps1
.\scripts\test\verify-line.ps1
```

开发机没有 PLC 时，可用 `$env:COLLECTOR = 'mock'`，再运行 `.\scripts\start-local.bat` 启动模拟采集器。正式环境使用 `edge/plc_collector.py`。`edge/test/plc_read_state.py` 可单独读取 PLC 状态，但现场 PLC 的 Modbus 服务只接受一个客户端；使用前先停采集器，完成后再恢复。

`ipc-recover.ps1` 不负责安装或启动基础服务；端口未就绪时会停止并报错。它写日志到仓库的 `logs/`，该目录已被 `.gitignore` 中的 `*.log` 规则覆盖。
