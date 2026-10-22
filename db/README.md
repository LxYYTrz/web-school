# db/ — 数据库结构

> **一句话定位**：整张系统的"账本"。历史时序数据 + 业务主数据 + 权限 + 审计。

---

## 1. 文件说明

| 文件 | 作用 |
|---|---|
| `init/001_init.sql` | ★ **主 DDL**：建扩展 → 建 12 张表 → 建索引 → 灌种子数据（角色/权限矩阵/管理员/示例产线设备） |
| `init/002_drop_vision.sql` | 一次性迁移：移除已取消的"机器视觉/图片链路"相关表、权限、设备类型。**全脚本幂等** |

---

## 2. 执行时机

| 场景 | 怎么执行 |
|---|---|
| Docker（首次初始化） | 容器首次启动自动执行 `docker-entrypoint-initdb.d/` 下的 `.sql`（按文件名顺序）。**只在空库时执行一次** |
| Windows 原生（工控机 U 盘部署） | 手动执行：`psql -U postgres -d linetwin -f db\init\001_init.sql`（见 docs/工控机部署手册-U盘版.md 3.2） |
| 存量环境补执行 002 | `psql -U postgres -d linetwin -f db\init\002_drop_vision.sql` |

---

## 3. 表结构总览

```
① 权限与组织域（RBAC）
   users · roles · permissions · user_roles · role_permissions
   ★ user_line_scope  ← 数据权限：用户能看哪些产线

② 产线与设备域
   production_lines · devices

③ 时序数据域（TimescaleDB hypertable，按时间自动分区）
   robot_joint_states  机器人六轴遥测（10Hz）
   line_status_history  产线状态历史（1Hz）
   production_events    生产事件 / 报警

④ 业务与审计域
   line_current_status  产线当前状态（每产线一行，UPSERT 覆盖）
   control_commands     控制指令（白名单 + 全生命周期审计）
   audit_logs           操作审计日志
```

---

## 4. ★ 最需要理解的一点：code 与 id

| 侧 | 用什么 | 例子 |
|---|---|---|
| MQTT 主题 / 报文 | **可读编码**（code） | `tl/v1/line-01/telemetry/robot/robot-01`、`"deviceId":"robot-01"` |
| 数据库外键 | **自增主键**（id） | `device_id = 2` |

翻译由后端 `server/src/infra/catalog.service.ts` 完成（内存 Map，每 60 秒刷新）。

**所以：新增设备时，只要 `devices.code` 和采集器发的 `deviceId` 一致即可，
不需要关心数据库主键是多少。**

对应约束：
- `production_lines.code` ≡ MQTT 主题里的 `{lineId}` ≡ 采集器的 `LINE_ID`
- `devices.code` ≡ MQTT 主题里的 `{deviceId}` ≡ 报文里的 `deviceId`

---

## 5. 种子数据

| 内容 | 说明 |
|---|---|
| 4 个角色 | admin / operator / customer / analyst |
| 7 个权限点 | 菜单(menu) / 接口(api) / 数据(data) 三类 |
| 权限矩阵 | admin 全量；operator 有下发指令；customer 只读；analyst 有详细数据 |
| 初始管理员 | `admin` / `Admin@123` ★ **首次登录后必须修改** |
| 示例产线设备 | `line-01`（一号产线）、`plc-01`、`robot-01` |

---

## 6. 生产注意事项

1. **必须设置数据保留策略**（001 文件末尾有注释掉的语句，取消注释即可）：
   ```sql
   SELECT add_compression_policy('robot_joint_states', INTERVAL '7 days');
   SELECT add_retention_policy('robot_joint_states', INTERVAL '30 days');
   ```
   否则 10Hz × 多台机器人 × 每天 = 磁盘很快被撑爆。
2. **必须定期备份**：`pg_dump` 到异地。
3. **不要改列名**：代码里用的是双引号包裹的 `"time"`（TimescaleDB 的时序列名）。
