# 数据库

PostgreSQL 16 + TimescaleDB 运行在工控机本地。`robot_joint_states`、`line_status_history`、`production_events` 是时序表；`control_commands` 和 `audit_logs` 记录控制与审计。

`init/001_init.sql` 建立基础表和示例产线；`init/002_app_users.sql` 建立当前登录系统使用的 `app.app_users`。后续 `003`、`004`、两个 `005` 文件扩充控制类型与产线状态；`006_drop_vision.sql` 清理已移除的视觉检测域。初次建库时按文件名顺序执行所有 `.sql`，存量库只执行尚未应用的迁移。不要对已有数据的库重跑 `001_init.sql`。

```powershell
psql -U postgres -c "CREATE DATABASE linetwin;"
Get-ChildItem db\init\*.sql | Sort-Object Name | ForEach-Object { psql -v ON_ERROR_STOP=1 -U postgres -d linetwin -f $_.FullName }
```

MQTT 报文里的产线和设备使用字符串 `code`；数据库外键使用数值 `id`。后端 `CatalogService` 负责映射，新增设备时应让 `devices.code` 与采集器的 `deviceId` 一致。

生产环境应配置 `pg_dump` 定期备份，并按数据量设置 TimescaleDB 的保留策略。工控机只有这一份历史数据，备份应保存在另一台机器或离线介质。
