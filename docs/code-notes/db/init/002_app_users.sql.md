# db/init/002_app_users.sql 逐行说明

[打开源码](../../../../db/init/002_app_users.sql) · 132 行 · 9 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 81 | <code>CREATE SCHEMA IF NOT EXISTS app;</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`SCHEMA`＝数据库模式；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。 |
| 86 | <code>CREATE TABLE IF NOT EXISTS app.app_users (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。 |
| 87 | <code>username   TEXT PRIMARY KEY,</code> | 定义字段 `username` 的类型及约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 92 | <code>password   TEXT NOT NULL,</code> | 定义字段 `password` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 100 | <code>level      SMALLINT NOT NULL CHECK (level IN (1, 2, 3)),</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 106 | <code>created_at TIMESTAMPTZ NOT NULL DEFAULT now()</code> | 定义字段 `created_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 112 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 120 | <code>CREATE INDEX IF NOT EXISTS app_users_level_idx</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。 |
| 121 | <code>ON app.app_users(level);</code> | 设置连接或冲突条件。 关键字：`ON`＝指定连接或冲突条件。 |
