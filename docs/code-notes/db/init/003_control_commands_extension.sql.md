# db/init/003_control_commands_extension.sql 逐行说明

[打开源码](../../../../db/init/003_control_commands_extension.sql) · 94 行 · 5 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 80 | <code>ALTER TABLE control_commands</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 81 | <code>DROP CONSTRAINT control_commands_type_check;</code> | 删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束。 |
| 92 | <code>ALTER TABLE control_commands</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。 |
| 93 | <code>ADD CONSTRAINT control_commands_type_check</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`CONSTRAINT`＝命名约束。 |
| 94 | <code>CHECK (type IN ('start','stop','reset','changeover','mode_set','alarm_clear'));</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
