# db/init/002_app_users.sql 逐行注释

[打开源码](../../../../db/init/002_app_users.sql) · 132 行 · 9 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 81 行**

```text
CREATE SCHEMA IF NOT EXISTS app;
-- 注释：创建数据库模式 app。 关键字：`CREATE`＝创建数据库对象；`SCHEMA`＝数据库模式；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 86 行**

```text
CREATE TABLE IF NOT EXISTS app.app_users (
-- 注释：创建数据库表 app.app_users。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 87 行**

```text
  username   TEXT PRIMARY KEY,
-- 注释：定义字段 `username` 的类型及约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 92 行**

```text
  password   TEXT NOT NULL,
-- 注释：定义字段 `password` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 100 行**

```text
  level      SMALLINT NOT NULL CHECK (level IN (1, 2, 3)),
-- 注释：定义数据库字段 level 的类型、默认值或约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 106 行**

```text
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- 注释：定义字段 `created_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 112 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 120 行**

```text
CREATE INDEX IF NOT EXISTS app_users_level_idx
-- 注释：创建数据库索引 app_users_level_idx。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 121 行**

```text
  ON app.app_users(level);
-- 注释：设置连接或冲突条件。 关键字：`ON`＝指定连接或冲突条件。
```
