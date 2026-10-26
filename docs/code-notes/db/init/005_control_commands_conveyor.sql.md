# db/init/005_control_commands_conveyor.sql 逐行注释

[打开源码](../../../../db/init/005_control_commands_conveyor.sql) · 121 行 · 13 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 93 行**

```text
ALTER TABLE control_commands
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 94 行**

```text
  DROP CONSTRAINT IF EXISTS control_commands_type_check;
-- 注释：删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 99 行**

```text
ALTER TABLE control_commands
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 100 行**

```text
  ADD CONSTRAINT control_commands_type_check
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`CONSTRAINT`＝命名约束。
```

**源码第 101 行**

```text
  CHECK (type IN (
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 103 行**

```text
    'start', 'stop', 'reset', 'changeover', 'mode_set', 'alarm_clear',
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 105 行**

```text
    'conveyor'
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 106 行**

```text
  ));
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 117 行**

```text
COMMENT ON COLUMN control_commands.type IS
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`ON`＝指定连接或冲突条件；`IS`＝检查空值或布尔值。
```

**源码第 118 行**

```text
  '指令白名单。现场 PLC 11 word 表(dataDB-Modbus-映射表.xls)实际可执行: '
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 119 行**

```text
  'start(word9 脉冲) / stop(word7 脉冲) / mode_set(word8 脉冲,action=acquire|release) / '
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 120 行**

```text
  'conveyor(word10 电平,action=forward|stop)。'
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 121 行**

```text
  'reset / changeover / alarm_clear 保留在白名单但现场无对应寄存器,edge 回 rejected。';
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```
