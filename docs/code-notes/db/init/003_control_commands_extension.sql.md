# db/init/003_control_commands_extension.sql 逐行注释

[打开源码](../../../../db/init/003_control_commands_extension.sql) · 94 行 · 5 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 80 行**

```text
ALTER TABLE control_commands
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 81 行**

```text
  DROP CONSTRAINT control_commands_type_check;
-- 注释：删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束。
```

**源码第 92 行**

```text
ALTER TABLE control_commands
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 93 行**

```text
  ADD CONSTRAINT control_commands_type_check
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`CONSTRAINT`＝命名约束。
```

**源码第 94 行**

```text
  CHECK (type IN ('start','stop','reset','changeover','mode_set','alarm_clear'));
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```
