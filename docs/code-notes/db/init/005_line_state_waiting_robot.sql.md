# db/init/005_line_state_waiting_robot.sql 逐行说明

[打开源码](../../../../db/init/005_line_state_waiting_robot.sql) · 68 行 · 32 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 29 | <code>ALTER TABLE line_status_history</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 30 | <code>DROP CONSTRAINT IF EXISTS line_status_history_state_check;</code> | 删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。 |
| 32 | <code>ALTER TABLE line_status_history</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 33 | <code>ADD CONSTRAINT line_status_history_state_check</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`CONSTRAINT`＝命名约束。 |
| 34 | <code>CHECK (state IN (</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 36 | <code>'running','idle','alarm','offline',</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 38 | <code>'waiting_feed',   --  0 = 等待入料</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 39 | <code>'feeding',        --  1 = 入料中</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 40 | <code>'assembling',     --  2 = 装配中</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 41 | <code>'waiting_robot',  --  3 = 等待机器人完成  ★ 新增(现场口径)</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 42 | <code>'unloading',      --  3 = 下料中(旧口径,仅历史数据)</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 43 | <code>'unload_done',    --  4 = 下料完成</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 44 | <code>'waiting_next',   --  5 = 等待后站入料</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 45 | <code>'init_error',     -- 100 = 初始化错误状态</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 46 | <code>'stopped',        -- 101 = 停止状态</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 47 | <code>'manual_mode'     -- 102 = 手动控制模式</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 48 | <code>));</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 51 | <code>ALTER TABLE line_current_status</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 52 | <code>DROP CONSTRAINT IF EXISTS line_current_status_state_check;</code> | 删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。 |
| 54 | <code>ALTER TABLE line_current_status</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 55 | <code>ADD CONSTRAINT line_current_status_state_check</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`CONSTRAINT`＝命名约束。 |
| 56 | <code>CHECK (state IN (</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 57 | <code>'running','idle','alarm','offline',</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 58 | <code>'waiting_feed','feeding','assembling','waiting_robot','unloading',</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 59 | <code>'unload_done','waiting_next','init_error','stopped','manual_mode'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 60 | <code>));</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 63 | <code>COMMENT ON TABLE line_status_history IS</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`ON`＝指定连接或冲突条件；`TABLE`＝数据库表；`IS`＝检查空值或布尔值。 |
| 64 | <code>'line_status.state 允许值见 constraint line_status_history_state_check。'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 65 | <code>'PLC 原始整数对照: 0=waiting_feed 1=feeding 2=assembling 3=waiting_robot '</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 66 | <code>'4=unload_done 5=waiting_next 100=init_error 101=stopped 102=manual_mode。'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 67 | <code>'注:unloading 为 3 的旧口径(下料中),只保留给历史数据。'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 68 | <code>'edge 采集器负责 PLC 整数 → 契约字符串的映射(plc_collector.py STATE_MAP)。';</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
