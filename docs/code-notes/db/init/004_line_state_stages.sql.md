# db/init/004_line_state_stages.sql 逐行注释

[打开源码](../../../../db/init/004_line_state_stages.sql) · 151 行 · 30 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 96 行**

```text
ALTER TABLE line_status_history
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 97 行**

```text
  DROP CONSTRAINT IF EXISTS line_status_history_state_check;
-- 注释：删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 101 行**

```text
ALTER TABLE line_status_history
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 102 行**

```text
  ADD CONSTRAINT line_status_history_state_check
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`CONSTRAINT`＝命名约束。
```

**源码第 103 行**

```text
  CHECK (state IN (
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 105 行**

```text
    'running','idle','alarm','offline',
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 107 行**

```text
    'waiting_feed',   --  0 = 等待入料
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 108 行**

```text
    'feeding',        --  1 = 入料中
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 109 行**

```text
    'assembling',     --  2 = 装配中
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 110 行**

```text
    'unloading',      --  3 = 下料中
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 111 行**

```text
    'unload_done',    --  4 = 下料完成
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 112 行**

```text
    'waiting_next',   --  5 = 等待后站入料
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 113 行**

```text
    'init_error',     -- 100 = 初始化错误状态
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 114 行**

```text
    'stopped',        -- 101 = 停止状态
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 115 行**

```text
    'manual_mode'     -- 102 = 手动控制模式
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 116 行**

```text
  ));
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 126 行**

```text
ALTER TABLE line_current_status
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 127 行**

```text
  DROP CONSTRAINT IF EXISTS line_current_status_state_check;
-- 注释：删除数据库对象。 关键字：`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 129 行**

```text
ALTER TABLE line_current_status
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表。
```

**源码第 130 行**

```text
  ADD CONSTRAINT line_current_status_state_check
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`CONSTRAINT`＝命名约束。
```

**源码第 131 行**

```text
  CHECK (state IN (
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 132 行**

```text
    'running','idle','alarm','offline',
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 133 行**

```text
    'waiting_feed','feeding','assembling','unloading','unload_done',
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 134 行**

```text
    'waiting_next','init_error','stopped','manual_mode'
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 135 行**

```text
  ));
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 147 行**

```text
COMMENT ON TABLE line_status_history IS
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`ON`＝指定连接或冲突条件；`TABLE`＝数据库表；`IS`＝检查空值或布尔值。
```

**源码第 148 行**

```text
  'line_status.state 允许值见 constraint line_status_history_state_check。'
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 149 行**

```text
  'PLC 原始整数对照: 0=waiting_feed 1=feeding 2=assembling 3=unloading '
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 150 行**

```text
  '4=unload_done 5=waiting_next 100=init_error 101=stopped 102=manual_mode。'
-- 注释：把这一段文字作为当前调用、数组或对象的值。
```

**源码第 151 行**

```text
  'edge 采集器负责 PLC 整数 → 契约字符串的映射(plc_collector.py STATE_MAP)。';
-- 注释：调用 契约字符串的映射；括号中的表达式是传入的参数。
```
