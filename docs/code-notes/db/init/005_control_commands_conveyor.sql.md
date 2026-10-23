# db/init/005_control_commands_conveyor.sql 逐行说明

[打开源码](../../../../db/init/005_control_commands_conveyor.sql) · 121 行 · 13 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 93 | <code>ALTER TABLE control_commands</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 94 | <code>DROP CONSTRAINT IF EXISTS control_commands_type_check;</code> | 删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。 |
| 99 | <code>ALTER TABLE control_commands</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 100 | <code>ADD CONSTRAINT control_commands_type_check</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`CONSTRAINT`＝命名约束。 |
| 101 | <code>CHECK (type IN (</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 103 | <code>'start', 'stop', 'reset', 'changeover', 'mode_set', 'alarm_clear',</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 105 | <code>'conveyor'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 106 | <code>));</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 117 | <code>COMMENT ON COLUMN control_commands.type IS</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`ON`＝指定连接或冲突条件；`IS`＝检查空值或布尔值。 |
| 118 | <code>'指令白名单。现场 PLC 11 word 表(dataDB-Modbus-映射表.xls)实际可执行: '</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 119 | <code>'start(word9 脉冲) / stop(word7 脉冲) / mode_set(word8 脉冲,action=acquire&#124;release) / '</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 120 | <code>'conveyor(word10 电平,action=forward&#124;stop)。'</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 121 | <code>'reset / changeover / alarm_clear 保留在白名单但现场无对应寄存器,edge 回 rejected。';</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
