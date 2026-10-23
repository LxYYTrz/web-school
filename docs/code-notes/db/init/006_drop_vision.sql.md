# db/init/006_drop_vision.sql 逐行说明

[打开源码](../../../../db/init/006_drop_vision.sql) · 171 行 · 28 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 104 | <code>DROP TABLE IF EXISTS vision_images;</code> | 删除数据库对象。 关键字：`DROP`＝删除数据库对象；`TABLE`＝数据库表；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。 |
| 116 | <code>DO $$</code> | 开始匿名 SQL 代码块。 关键字：`DO`＝执行匿名 SQL 代码块。 |
| 117 | <code>BEGIN</code> | 开始事务或函数体。 关键字：`BEGIN`＝开始事务或代码块。 |
| 122 | <code>IF to_regclass('public.permissions') IS NULL THEN</code> | 按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`IS`＝检查空值或布尔值；`NULL`＝数据库空值；`THEN`＝满足条件时的结果。 |
| 123 | <code>RETURN;</code> | 结束函数或代码块并返回。 关键字：`RETURN`＝结束函数并返回。 |
| 124 | <code>END IF;</code> | 结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。 |
| 129 | <code>IF to_regclass('public.role_permissions') IS NOT NULL THEN</code> | 按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`IS`＝检查空值或布尔值；`NOT`＝逻辑否定；`NULL`＝数据库空值；`THEN`＝满足条件时的结果。 |
| 130 | <code>DELETE FROM role_permissions</code> | 删除数据。 关键字：`DELETE`＝删除匹配行；`FROM`＝指定查询来源表。 |
| 131 | <code>WHERE permission_id IN (</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行；`IN`＝检查是否属于集合。 |
| 132 | <code>SELECT id FROM permissions WHERE code IN ('menu:vision', 'data:vision:all')</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`IN`＝检查是否属于集合。 |
| 133 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 134 | <code>END IF;</code> | 结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。 |
| 136 | <code>DELETE FROM permissions WHERE code IN ('menu:vision', 'data:vision:all');</code> | 删除数据。 关键字：`DELETE`＝删除匹配行；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`IN`＝检查是否属于集合。 |
| 137 | <code>END $$;</code> | 结束 SQL 块。 关键字：`END`＝结束代码块。 |
| 145 | <code>DO $$</code> | 开始匿名 SQL 代码块。 关键字：`DO`＝执行匿名 SQL 代码块。 |
| 146 | <code>BEGIN</code> | 开始事务或函数体。 关键字：`BEGIN`＝开始事务或代码块。 |
| 148 | <code>IF to_regclass('public.devices') IS NULL THEN</code> | 按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`IS`＝检查空值或布尔值；`NULL`＝数据库空值；`THEN`＝满足条件时的结果。 |
| 149 | <code>RETURN;</code> | 结束函数或代码块并返回。 关键字：`RETURN`＝结束函数并返回。 |
| 150 | <code>END IF;</code> | 结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。 |
| 153 | <code>DELETE FROM devices WHERE type IN ('camera', 'ipc');</code> | 删除数据。 关键字：`DELETE`＝删除匹配行；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`IN`＝检查是否属于集合。 |
| 162 | <code>IF EXISTS (</code> | 按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。 |
| 163 | <code>SELECT 1 FROM pg_constraint</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。 |
| 164 | <code>WHERE conname = 'devices_type_check' AND conrelid = 'devices'::regclass</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与。 |
| 165 | <code>) THEN</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`THEN`＝满足条件时的结果。 |
| 168 | <code>ALTER TABLE devices DROP CONSTRAINT devices_type_check;</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表；`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束。 |
| 169 | <code>ALTER TABLE devices ADD CONSTRAINT devices_type_check CHECK (type IN ('plc', 'robot'));</code> | 修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表；`CONSTRAINT`＝命名约束；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 170 | <code>END IF;</code> | 结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。 |
| 171 | <code>END $$;</code> | 结束 SQL 块。 关键字：`END`＝结束代码块。 |
