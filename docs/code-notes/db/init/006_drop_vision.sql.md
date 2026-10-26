# db/init/006_drop_vision.sql 逐行注释

[打开源码](../../../../db/init/006_drop_vision.sql) · 171 行 · 28 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 104 行**

```text
DROP TABLE IF EXISTS vision_images;
-- 注释：删除数据库表 vision_images。 关键字：`DROP`＝删除数据库对象；`TABLE`＝数据库表；`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 116 行**

```text
DO $$
-- 注释：开始匿名 SQL 代码块。 关键字：`DO`＝执行匿名 SQL 代码块。
```

**源码第 117 行**

```text
BEGIN
-- 注释：开始事务或函数体。 关键字：`BEGIN`＝开始事务或代码块。
```

**源码第 122 行**

```text
  IF to_regclass('public.permissions') IS NULL THEN
-- 注释：按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`IS`＝检查空值或布尔值；`NULL`＝数据库空值；`THEN`＝满足条件时的结果。
```

**源码第 123 行**

```text
    RETURN;
-- 注释：结束函数或代码块并返回。 关键字：`RETURN`＝结束函数并返回。
```

**源码第 124 行**

```text
  END IF;
-- 注释：结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。
```

**源码第 129 行**

```text
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
-- 注释：按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`IS`＝检查空值或布尔值；`NOT`＝逻辑否定；`NULL`＝数据库空值；`THEN`＝满足条件时的结果。
```

**源码第 130 行**

```text
    DELETE FROM role_permissions
-- 注释：删除数据。 关键字：`DELETE`＝删除匹配行；`FROM`＝指定查询来源表。
```

**源码第 131 行**

```text
      WHERE permission_id IN (
-- 注释：限定处理范围。 关键字：`WHERE`＝限定目标行；`IN`＝检查是否属于集合。
```

**源码第 132 行**

```text
        SELECT id FROM permissions WHERE code IN ('menu:vision', 'data:vision:all')
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`IN`＝检查是否属于集合。
```

**源码第 133 行**

```text
      );
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 134 行**

```text
  END IF;
-- 注释：结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。
```

**源码第 136 行**

```text
  DELETE FROM permissions WHERE code IN ('menu:vision', 'data:vision:all');
-- 注释：删除数据。 关键字：`DELETE`＝删除匹配行；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`IN`＝检查是否属于集合。
```

**源码第 137 行**

```text
END $$;
-- 注释：结束 SQL 块。 关键字：`END`＝结束代码块。
```

**源码第 145 行**

```text
DO $$
-- 注释：开始匿名 SQL 代码块。 关键字：`DO`＝执行匿名 SQL 代码块。
```

**源码第 146 行**

```text
BEGIN
-- 注释：开始事务或函数体。 关键字：`BEGIN`＝开始事务或代码块。
```

**源码第 148 行**

```text
  IF to_regclass('public.devices') IS NULL THEN
-- 注释：按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`IS`＝检查空值或布尔值；`NULL`＝数据库空值；`THEN`＝满足条件时的结果。
```

**源码第 149 行**

```text
    RETURN;
-- 注释：结束函数或代码块并返回。 关键字：`RETURN`＝结束函数并返回。
```

**源码第 150 行**

```text
  END IF;
-- 注释：结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。
```

**源码第 153 行**

```text
  DELETE FROM devices WHERE type IN ('camera', 'ipc');
-- 注释：删除数据。 关键字：`DELETE`＝删除匹配行；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`IN`＝检查是否属于集合。
```

**源码第 162 行**

```text
  IF EXISTS (
-- 注释：按条件执行后续语句。 关键字：`IF`＝按条件执行 SQL；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 163 行**

```text
    SELECT 1 FROM pg_constraint
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。
```

**源码第 164 行**

```text
    WHERE conname = 'devices_type_check' AND conrelid = 'devices'::regclass
-- 注释：限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与。
```

**源码第 165 行**

```text
  ) THEN
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`THEN`＝满足条件时的结果。
```

**源码第 168 行**

```text
    ALTER TABLE devices DROP CONSTRAINT devices_type_check;
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表；`DROP`＝删除数据库对象；`CONSTRAINT`＝命名约束。
```

**源码第 169 行**

```text
    ALTER TABLE devices ADD CONSTRAINT devices_type_check CHECK (type IN ('plc', 'robot'));
-- 注释：修改数据库结构。 关键字：`ALTER`＝修改数据库对象；`TABLE`＝数据库表；`CONSTRAINT`＝命名约束；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 170 行**

```text
  END IF;
-- 注释：结束 SQL 块。 关键字：`END`＝结束代码块；`IF`＝按条件执行 SQL。
```

**源码第 171 行**

```text
END $$;
-- 注释：结束 SQL 块。 关键字：`END`＝结束代码块。
```
