# db/init/001_init.sql 逐行注释

[打开源码](../../../../db/init/001_init.sql) · 658 行 · 164 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 88 行**

```text
CREATE EXTENSION IF NOT EXISTS timescaledb;
-- 注释：创建数据库扩展 timescaledb。 关键字：`CREATE`＝创建数据库对象；`EXTENSION`＝数据库扩展；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 91 行**

```text
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- 用于种子账号的口令散列
-- 注释：创建数据库扩展 pgcrypto。 关键字：`CREATE`＝创建数据库对象；`EXTENSION`＝数据库扩展；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。
```

**源码第 111 行**

```text
CREATE TABLE users (
-- 注释：创建数据库表 users。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 112 行**

```text
  id            BIGSERIAL PRIMARY KEY,
-- 注释：定义数据库字段 id 的类型、默认值或约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 115 行**

```text
  username      TEXT NOT NULL UNIQUE,
-- 注释：定义字段 `username` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。
```

**源码第 119 行**

```text
  password_hash TEXT NOT NULL,
-- 注释：定义字段 `password_hash` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 122 行**

```text
  display_name  TEXT,
-- 注释：定义字段 `display_name` 的类型及约束。
```

**源码第 125 行**

```text
  phone         TEXT,
-- 注释：定义字段 `phone` 的类型及约束。
```

**源码第 127 行**

```text
  status        TEXT NOT NULL DEFAULT 'active'
-- 注释：定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 128 行**

```text
                 CHECK (status IN ('active','disabled')),
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 134 行**

```text
  last_login_at TIMESTAMPTZ,
-- 注释：定义字段 `last_login_at` 的类型及约束。
```

**源码第 137 行**

```text
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
-- 注释：定义字段 `created_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 141 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 146 行**

```text
CREATE TABLE roles (
-- 注释：创建数据库表 roles。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 147 行**

```text
  id   BIGSERIAL PRIMARY KEY,
-- 注释：定义数据库字段 id 的类型、默认值或约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 150 行**

```text
  code TEXT NOT NULL UNIQUE,
-- 注释：定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。
```

**源码第 154 行**

```text
  name TEXT NOT NULL
-- 注释：定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 157 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 165 行**

```text
CREATE TABLE permissions (
-- 注释：创建数据库表 permissions。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 166 行**

```text
  id   BIGSERIAL PRIMARY KEY,
-- 注释：定义数据库字段 id 的类型、默认值或约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 168 行**

```text
  code TEXT NOT NULL UNIQUE,
-- 注释：定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。
```

**源码第 171 行**

```text
  type TEXT NOT NULL CHECK (type IN ('menu','api','data')),
-- 注释：定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 174 行**

```text
  name TEXT NOT NULL
-- 注释：定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 176 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 180 行**

```text
CREATE TABLE user_roles (
-- 注释：创建数据库表 user_roles。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 181 行**

```text
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
-- 注释：定义字段 `user_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。
```

**源码第 186 行**

```text
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
-- 注释：定义字段 `role_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。
```

**源码第 188 行**

```text
  PRIMARY KEY (user_id, role_id)
-- 注释：定义主键。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 190 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 194 行**

```text
CREATE TABLE role_permissions (
-- 注释：创建数据库表 role_permissions。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 195 行**

```text
  role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
-- 注释：定义字段 `role_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。
```

**源码第 197 行**

```text
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
-- 注释：定义字段 `permission_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。
```

**源码第 199 行**

```text
  PRIMARY KEY (role_id, permission_id)
-- 注释：定义主键。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 201 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 212 行**

```text
CREATE TABLE production_lines (
-- 注释：创建数据库表 production_lines。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 213 行**

```text
  id       BIGSERIAL PRIMARY KEY,
-- 注释：定义数据库字段 id 的类型、默认值或约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 216 行**

```text
  code     TEXT NOT NULL UNIQUE,
-- 注释：定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。
```

**源码第 220 行**

```text
  name     TEXT NOT NULL,
-- 注释：定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 222 行**

```text
  location TEXT,
-- 注释：定义字段 `location` 的类型及约束。
```

**源码第 224 行**

```text
  status   TEXT NOT NULL DEFAULT 'idle'
-- 注释：定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 225 行**

```text
           CHECK (status IN ('running','idle','alarm','offline'))
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 231 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 241 行**

```text
CREATE TABLE user_line_scope (
-- 注释：创建数据库表 user_line_scope。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 242 行**

```text
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
-- 注释：定义字段 `user_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。
```

**源码第 244 行**

```text
  line_id BIGINT NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
-- 注释：定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。
```

**源码第 246 行**

```text
  PRIMARY KEY (user_id, line_id)
-- 注释：定义主键。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 248 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 256 行**

```text
CREATE TABLE devices (
-- 注释：创建数据库表 devices。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 257 行**

```text
  id       BIGSERIAL PRIMARY KEY,
-- 注释：定义数据库字段 id 的类型、默认值或约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 259 行**

```text
  line_id  BIGINT NOT NULL REFERENCES production_lines(id),
-- 注释：定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。
```

**源码第 264 行**

```text
  type     TEXT NOT NULL CHECK (type IN ('plc','robot')),
-- 注释：定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 268 行**

```text
  code     TEXT NOT NULL UNIQUE,
-- 注释：定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。
```

**源码第 272 行**

```text
  name     TEXT NOT NULL,
-- 注释：定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 274 行**

```text
  protocol TEXT,
-- 注释：定义字段 `protocol` 的类型及约束。
```

**源码第 277 行**

```text
  config   JSONB NOT NULL DEFAULT '{}',
-- 注释：定义字段 `config` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 282 行**

```text
  status   TEXT NOT NULL DEFAULT 'unknown'
-- 注释：定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 287 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 300 行**

```text
CREATE TABLE robot_joint_states (
-- 注释：创建数据库表 robot_joint_states。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 301 行**

```text
  "time"     TIMESTAMPTZ NOT NULL,
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 305 行**

```text
  device_id  BIGINT NOT NULL REFERENCES devices(id),
-- 注释：定义字段 `device_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。
```

**源码第 311 行**

```text
  joints     DOUBLE PRECISION[] NOT NULL,
-- 注释：定义字段 `joints` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 316 行**

```text
  tcp_pose   DOUBLE PRECISION[],
-- 注释：定义字段 `tcp_pose` 的类型及约束。
```

**源码第 320 行**

```text
  speed_pct  REAL,
-- 注释：定义字段 `speed_pct` 的类型及约束。
```

**源码第 323 行**

```text
  mode       TEXT,
-- 注释：定义字段 `mode` 的类型及约束。
```

**源码第 326 行**

```text
  program    TEXT,
-- 注释：定义字段 `program` 的类型及约束。
```

**源码第 329 行**

```text
  alarm_code INTEGER NOT NULL DEFAULT 0
-- 注释：定义字段 `alarm_code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 335 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 339 行**

```text
SELECT create_hypertable('robot_joint_states', 'time');
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列。
```

**源码第 343 行**

```text
CREATE INDEX idx_rjs_device_time ON robot_joint_states (device_id, "time" DESC);
-- 注释：创建数据库索引 idx_rjs_device_time。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。
```

**源码第 349 行**

```text
CREATE TABLE line_status_history (
-- 注释：创建数据库表 line_status_history。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 350 行**

```text
  "time"       TIMESTAMPTZ NOT NULL,
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 353 行**

```text
  line_id      BIGINT NOT NULL REFERENCES production_lines(id),
-- 注释：定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。
```

**源码第 355 行**

```text
  state        TEXT NOT NULL
-- 注释：定义字段 `state` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 356 行**

```text
               CHECK (state IN ('running','idle','alarm','offline')),
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 360 行**

```text
  product_code TEXT,
-- 注释：定义字段 `product_code` 的类型及约束。
```

**源码第 362 行**

```text
  good_count   INTEGER NOT NULL DEFAULT 0,
-- 注释：定义字段 `good_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 365 行**

```text
  ng_count     INTEGER NOT NULL DEFAULT 0,
-- 注释：定义字段 `ng_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 367 行**

```text
  beat_ms      INTEGER
-- 注释：定义字段 `beat_ms` 的类型及约束。
```

**源码第 370 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 372 行**

```text
SELECT create_hypertable('line_status_history', 'time');
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列。
```

**源码第 374 行**

```text
CREATE INDEX idx_lsh_line_time ON line_status_history (line_id, "time" DESC);
-- 注释：创建数据库索引 idx_lsh_line_time。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。
```

**源码第 379 行**

```text
CREATE TABLE production_events (
-- 注释：创建数据库表 production_events。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 380 行**

```text
  "time"    TIMESTAMPTZ NOT NULL,
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 383 行**

```text
  line_id   BIGINT NOT NULL REFERENCES production_lines(id),
-- 注释：定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。
```

**源码第 385 行**

```text
  device_id BIGINT REFERENCES devices(id),
-- 注释：定义字段 `device_id` 的类型及约束。 关键字：`REFERENCES`＝引用关联表。
```

**源码第 388 行**

```text
  type      TEXT NOT NULL,
-- 注释：定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 394 行**

```text
  level     TEXT NOT NULL DEFAULT 'info'
-- 注释：定义字段 `level` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 395 行**

```text
            CHECK (level IN ('info','warning','critical')),
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 399 行**

```text
  code      TEXT,
-- 注释：定义字段 `code` 的类型及约束。
```

**源码第 402 行**

```text
  message   TEXT,
-- 注释：定义字段 `message` 的类型及约束。
```

**源码第 404 行**

```text
  payload   JSONB NOT NULL DEFAULT '{}'
-- 注释：定义字段 `payload` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 409 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 411 行**

```text
SELECT create_hypertable('production_events', 'time');
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列。
```

**源码第 413 行**

```text
CREATE INDEX idx_pe_line_time ON production_events (line_id, "time" DESC);
-- 注释：创建数据库索引 idx_pe_line_time。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。
```

**源码第 427 行**

```text
CREATE TABLE line_current_status (
-- 注释：创建数据库表 line_current_status。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 428 行**

```text
  line_id      BIGINT PRIMARY KEY REFERENCES production_lines(id),
-- 注释：定义字段 `line_id` 的类型及约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义；`REFERENCES`＝引用关联表。
```

**源码第 432 行**

```text
  state        TEXT NOT NULL DEFAULT 'offline',
-- 注释：定义字段 `state` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 438 行**

```text
  product_code TEXT,
-- 注释：定义字段 `product_code` 的类型及约束。
```

**源码第 440 行**

```text
  good_count   INTEGER NOT NULL DEFAULT 0,
-- 注释：定义字段 `good_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 442 行**

```text
  ng_count     INTEGER NOT NULL DEFAULT 0,
-- 注释：定义字段 `ng_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 444 行**

```text
  beat_ms      INTEGER,
-- 注释：定义字段 `beat_ms` 的类型及约束。
```

**源码第 446 行**

```text
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
-- 注释：定义字段 `updated_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 450 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 464 行**

```text
CREATE TABLE control_commands (
-- 注释：创建数据库表 control_commands。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 465 行**

```text
  id              BIGSERIAL PRIMARY KEY,
-- 注释：定义数据库字段 id 的类型、默认值或约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 467 行**

```text
  idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
-- 注释：定义字段 `idempotency_key` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一；`DEFAULT`＝默认值。
```

**源码第 474 行**

```text
  line_id         BIGINT NOT NULL REFERENCES production_lines(id),
-- 注释：定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。
```

**源码第 476 行**

```text
  device_id       BIGINT NOT NULL REFERENCES devices(id),
-- 注释：定义字段 `device_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。
```

**源码第 478 行**

```text
  user_id         BIGINT NOT NULL REFERENCES users(id),
-- 注释：定义字段 `user_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。
```

**源码第 482 行**

```text
  type            TEXT NOT NULL
-- 注释：定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 483 行**

```text
                 CHECK (type IN ('start','stop','reset','changeover')),
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 488 行**

```text
  params          JSONB NOT NULL DEFAULT '{}',
-- 注释：定义字段 `params` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 494 行**

```text
  status          TEXT NOT NULL DEFAULT 'pending'
-- 注释：定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 495 行**

```text
                 CHECK (status IN ('pending','sent','acked','rejected','failed','timeout')),
-- 注释：检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。
```

**源码第 507 行**

```text
  ack_payload     JSONB,
-- 注释：定义字段 `ack_payload` 的类型及约束。
```

**源码第 511 行**

```text
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
-- 注释：定义字段 `issued_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 514 行**

```text
  acked_at        TIMESTAMPTZ
-- 注释：定义字段 `acked_at` 的类型及约束。
```

**源码第 518 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 522 行**

```text
CREATE INDEX idx_cc_user_time ON control_commands (user_id, issued_at DESC);
-- 注释：创建数据库索引 idx_cc_user_time。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。
```

**源码第 533 行**

```text
CREATE TABLE audit_logs (
-- 注释：创建数据库表 audit_logs。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。
```

**源码第 534 行**

```text
  id         BIGSERIAL PRIMARY KEY,
-- 注释：定义数据库字段 id 的类型、默认值或约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。
```

**源码第 536 行**

```text
  user_id    BIGINT REFERENCES users(id),
-- 注释：定义字段 `user_id` 的类型及约束。 关键字：`REFERENCES`＝引用关联表。
```

**源码第 540 行**

```text
  action     TEXT NOT NULL,
-- 注释：定义字段 `action` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。
```

**源码第 543 行**

```text
  target     TEXT,
-- 注释：定义字段 `target` 的类型及约束。
```

**源码第 546 行**

```text
  detail     JSONB NOT NULL DEFAULT '{}',
-- 注释：定义字段 `detail` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 551 行**

```text
  ip         INET,
-- 注释：继续当前 SQL 语句的字段、约束、参数或查询子句。
```

**源码第 554 行**

```text
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- 注释：定义字段 `created_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。
```

**源码第 557 行**

```text
);
-- 注释：结束当前 SQL 表或函数定义。
```

**源码第 566 行**

```text
INSERT INTO roles (code, name) VALUES
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标；`VALUES`＝给出插入值。
```

**源码第 567 行**

```text
  ('admin','管理员'), ('operator','产线操作员'), ('customer','客户'), ('analyst','数据分析员');
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 571 行**

```text
INSERT INTO permissions (code, type, name) VALUES
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标；`VALUES`＝给出插入值。
```

**源码第 572 行**

```text
  ('menu:dashboard','menu','产线总览'),
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 573 行**

```text
  ('menu:twin','menu','数字孪生'),
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 574 行**

```text
  ('menu:analysis','menu','数据分析'),
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 575 行**

```text
  ('menu:admin','menu','系统管理'),
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 576 行**

```text
  ('api:command:execute','api','下发控制指令'),
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 577 行**

```text
  ('data:telemetry:detail','data','查看详细遥测数据');
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 589 行**

```text
INSERT INTO role_permissions (role_id, permission_id)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 590 行**

```text
  SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE WHERE r.code = 'admin';
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`JOIN`＝连接另一数据表；`ON`＝指定连接或冲突条件；`WHERE`＝限定目标行。
```

**源码第 593 行**

```text
INSERT INTO role_permissions (role_id, permission_id)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 594 行**

```text
  SELECT r.id, p.id FROM roles r, permissions p
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。
```

**源码第 595 行**

```text
  WHERE r.code = 'operator' AND p.code IN
-- 注释：限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。
```

**源码第 596 行**

```text
    ('menu:dashboard','menu:twin','api:command:execute');
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 599 行**

```text
INSERT INTO role_permissions (role_id, permission_id)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 600 行**

```text
  SELECT r.id, p.id FROM roles r, permissions p
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。
```

**源码第 601 行**

```text
  WHERE r.code = 'customer' AND p.code IN ('menu:dashboard','menu:twin');
-- 注释：限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。
```

**源码第 603 行**

```text
INSERT INTO role_permissions (role_id, permission_id)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 604 行**

```text
  SELECT r.id, p.id FROM roles r, permissions p
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。
```

**源码第 605 行**

```text
  WHERE r.code = 'analyst' AND p.code IN
-- 注释：限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。
```

**源码第 606 行**

```text
    ('menu:dashboard','menu:analysis','data:telemetry:detail');
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 614 行**

```text
INSERT INTO users (username, password_hash, display_name)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 615 行**

```text
  VALUES ('admin', crypt('Admin@123', gen_salt('bf')), '系统管理员');
-- 注释：列出待写入的值。 关键字：`VALUES`＝给出插入值。
```

**源码第 618 行**

```text
INSERT INTO user_roles (user_id, role_id)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 619 行**

```text
  SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'admin';
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`AND`＝逻辑与。
```

**源码第 626 行**

```text
INSERT INTO production_lines (code, name, location) VALUES ('line-01','一号产线','示例车间');
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标；`VALUES`＝给出插入值。
```

**源码第 630 行**

```text
INSERT INTO devices (line_id, type, code, name, protocol)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 631 行**

```text
  SELECT l.id, d.type, d.code, d.name, d.protocol
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列。
```

**源码第 632 行**

```text
  FROM production_lines l,
-- 注释：指定读取来源表。 关键字：`FROM`＝指定查询来源表。
```

**源码第 633 行**

```text
       (VALUES ('plc',   'plc-01',    '主控 PLC',   'modbus_tcp'),
-- 注释：开始当前表达式的分组或数组内容。 关键字：`VALUES`＝给出插入值。
```

**源码第 634 行**

```text
               ('robot', 'robot-01',  '六轴机器人', 'via_plc')
-- 注释：开始当前表达式的分组或数组内容。
```

**源码第 635 行**

```text
       ) AS d(type, code, name, protocol)
-- 注释：调用 d；括号中的表达式是传入的参数。 关键字：`AS`＝为字段或表设置别名。
```

**源码第 636 行**

```text
  WHERE l.code = 'line-01';
-- 注释：限定处理范围。 关键字：`WHERE`＝限定目标行。
```

**源码第 639 行**

```text
INSERT INTO line_current_status (line_id)
-- 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 640 行**

```text
  SELECT id FROM production_lines WHERE code = 'line-01';
-- 注释：读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`WHERE`＝限定目标行。
```
