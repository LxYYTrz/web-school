# db/init/004_line_state_stages.sql 逐行说明

[打开源码](../../../../db/init/004_line_state_stages.sql) · 151 行 · 30 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 96 | <code>ALTER TABLE line_status_history</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 97 | <code>DROP CONSTRAINT IF EXISTS line_status_history_state_check;</code> | 删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。 |
| 101 | <code>ALTER TABLE line_status_history</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 102 | <code>ADD CONSTRAINT line_status_history_state_check</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`CONSTRAINT`＝命名约束。 |
| 103 | <code>CHECK (state IN (</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 105 | <code>'running','idle','alarm','offline',</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 107 | <code>'waiting_feed',   --  0 = 等待入料</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 108 | <code>'feeding',        --  1 = 入料中</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 109 | <code>'assembling',     --  2 = 装配中</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 110 | <code>'unloading',      --  3 = 下料中</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 111 | <code>'unload_done',    --  4 = 下料完成</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 112 | <code>'waiting_next',   --  5 = 等待后站入料</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 113 | <code>'init_error',     -- 100 = 初始化错误状态</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 114 | <code>'stopped',        -- 101 = 停止状态</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 115 | <code>'manual_mode'     -- 102 = 手动控制模式</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 116 | <code>));</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 126 | <code>ALTER TABLE line_current_status</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 127 | <code>DROP CONSTRAINT IF EXISTS line_current_status_state_check;</code> | 删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。 |
| 129 | <code>ALTER TABLE line_current_status</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 130 | <code>ADD CONSTRAINT line_current_status_state_check</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`CONSTRAINT`＝命名约束。 |
| 131 | <code>CHECK (state IN (</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 132 | <code>'running','idle','alarm','offline',</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 133 | <code>'waiting_feed','feeding','assembling','unloading','unload_done',</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 134 | <code>'waiting_next','init_error','stopped','manual_mode'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 135 | <code>));</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 147 | <code>COMMENT ON TABLE line_status_history IS</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`ON`＝指定连接或冲突条件；`TABLE`＝数据库表；`IS`＝检查空值或布尔值。 |
| 148 | <code>'line_status.state 允许值见 constraint line_status_history_state_check。'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 149 | <code>'PLC 原始整数对照: 0=waiting_feed 1=feeding 2=assembling 3=unloading '</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 150 | <code>'4=unload_done 5=waiting_next 100=init_error 101=stopped 102=manual_mode。'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 151 | <code>'edge 采集器负责 PLC 整数 → 契约字符串的映射(plc_collector.py STATE_MAP)。';</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
