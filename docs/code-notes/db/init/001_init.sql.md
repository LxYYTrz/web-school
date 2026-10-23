# db/init/001_init.sql 逐行说明

[打开源码](../../../../db/init/001_init.sql) · 658 行 · 164 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 88 | <code>CREATE EXTENSION IF NOT EXISTS timescaledb;</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`EXTENSION`＝数据库扩展；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。 |
| 91 | <code>CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- 用于种子账号的口令散列</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`EXTENSION`＝数据库扩展；`IF`＝按条件执行 SQL；`NOT`＝逻辑否定；`EXISTS`＝检查对象或查询结果存在。 |
| 111 | <code>CREATE TABLE users (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 112 | <code>id            BIGSERIAL PRIMARY KEY,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 115 | <code>username      TEXT NOT NULL UNIQUE,</code> | 定义字段 `username` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。 |
| 119 | <code>password_hash TEXT NOT NULL,</code> | 定义字段 `password_hash` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 122 | <code>display_name  TEXT,</code> | 定义字段 `display_name` 的类型及约束。 |
| 125 | <code>phone         TEXT,</code> | 定义字段 `phone` 的类型及约束。 |
| 127 | <code>status        TEXT NOT NULL DEFAULT 'active'</code> | 定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 128 | <code>CHECK (status IN ('active','disabled')),</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 134 | <code>last_login_at TIMESTAMPTZ,</code> | 定义字段 `last_login_at` 的类型及约束。 |
| 137 | <code>created_at    TIMESTAMPTZ NOT NULL DEFAULT now()</code> | 定义字段 `created_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 141 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 146 | <code>CREATE TABLE roles (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 147 | <code>id   BIGSERIAL PRIMARY KEY,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 150 | <code>code TEXT NOT NULL UNIQUE,</code> | 定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。 |
| 154 | <code>name TEXT NOT NULL</code> | 定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 157 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 165 | <code>CREATE TABLE permissions (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 166 | <code>id   BIGSERIAL PRIMARY KEY,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 168 | <code>code TEXT NOT NULL UNIQUE,</code> | 定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。 |
| 171 | <code>type TEXT NOT NULL CHECK (type IN ('menu','api','data')),</code> | 定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 174 | <code>name TEXT NOT NULL</code> | 定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 176 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 180 | <code>CREATE TABLE user_roles (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 181 | <code>user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,</code> | 定义字段 `user_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。 |
| 186 | <code>role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,</code> | 定义字段 `role_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。 |
| 188 | <code>PRIMARY KEY (user_id, role_id)</code> | 定义主键。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 190 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 194 | <code>CREATE TABLE role_permissions (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 195 | <code>role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,</code> | 定义字段 `role_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。 |
| 197 | <code>permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,</code> | 定义字段 `permission_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。 |
| 199 | <code>PRIMARY KEY (role_id, permission_id)</code> | 定义主键。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 201 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 212 | <code>CREATE TABLE production_lines (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 213 | <code>id       BIGSERIAL PRIMARY KEY,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 216 | <code>code     TEXT NOT NULL UNIQUE,</code> | 定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。 |
| 220 | <code>name     TEXT NOT NULL,</code> | 定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 222 | <code>location TEXT,</code> | 定义字段 `location` 的类型及约束。 |
| 224 | <code>status   TEXT NOT NULL DEFAULT 'idle'</code> | 定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 225 | <code>CHECK (status IN ('running','idle','alarm','offline'))</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 231 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 241 | <code>CREATE TABLE user_line_scope (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 242 | <code>user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,</code> | 定义字段 `user_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。 |
| 244 | <code>line_id BIGINT NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,</code> | 定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表；`ON`＝指定连接或冲突条件；`DELETE`＝删除匹配行；`CASCADE`＝级联处理依赖对象。 |
| 246 | <code>PRIMARY KEY (user_id, line_id)</code> | 定义主键。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 248 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 256 | <code>CREATE TABLE devices (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 257 | <code>id       BIGSERIAL PRIMARY KEY,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 259 | <code>line_id  BIGINT NOT NULL REFERENCES production_lines(id),</code> | 定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。 |
| 264 | <code>type     TEXT NOT NULL CHECK (type IN ('plc','robot')),</code> | 定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 268 | <code>code     TEXT NOT NULL UNIQUE,</code> | 定义字段 `code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一。 |
| 272 | <code>name     TEXT NOT NULL,</code> | 定义字段 `name` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 274 | <code>protocol TEXT,</code> | 定义字段 `protocol` 的类型及约束。 |
| 277 | <code>config   JSONB NOT NULL DEFAULT '{}',</code> | 定义字段 `config` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 282 | <code>status   TEXT NOT NULL DEFAULT 'unknown'</code> | 定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 287 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 300 | <code>CREATE TABLE robot_joint_states (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 301 | <code>"time"     TIMESTAMPTZ NOT NULL,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 305 | <code>device_id  BIGINT NOT NULL REFERENCES devices(id),</code> | 定义字段 `device_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。 |
| 311 | <code>joints     DOUBLE PRECISION[] NOT NULL,</code> | 定义字段 `joints` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 316 | <code>tcp_pose   DOUBLE PRECISION[],</code> | 定义字段 `tcp_pose` 的类型及约束。 |
| 320 | <code>speed_pct  REAL,</code> | 定义字段 `speed_pct` 的类型及约束。 |
| 323 | <code>mode       TEXT,</code> | 定义字段 `mode` 的类型及约束。 |
| 326 | <code>program    TEXT,</code> | 定义字段 `program` 的类型及约束。 |
| 329 | <code>alarm_code INTEGER NOT NULL DEFAULT 0</code> | 定义字段 `alarm_code` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 335 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 339 | <code>SELECT create_hypertable('robot_joint_states', 'time');</code> | 读取数据。 关键字：`SELECT`＝读取指定列。 |
| 343 | <code>CREATE INDEX idx_rjs_device_time ON robot_joint_states (device_id, "time" DESC);</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。 |
| 349 | <code>CREATE TABLE line_status_history (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 350 | <code>"time"       TIMESTAMPTZ NOT NULL,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 353 | <code>line_id      BIGINT NOT NULL REFERENCES production_lines(id),</code> | 定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。 |
| 355 | <code>state        TEXT NOT NULL</code> | 定义字段 `state` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 356 | <code>CHECK (state IN ('running','idle','alarm','offline')),</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 360 | <code>product_code TEXT,</code> | 定义字段 `product_code` 的类型及约束。 |
| 362 | <code>good_count   INTEGER NOT NULL DEFAULT 0,</code> | 定义字段 `good_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 365 | <code>ng_count     INTEGER NOT NULL DEFAULT 0,</code> | 定义字段 `ng_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 367 | <code>beat_ms      INTEGER</code> | 定义字段 `beat_ms` 的类型及约束。 |
| 370 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 372 | <code>SELECT create_hypertable('line_status_history', 'time');</code> | 读取数据。 关键字：`SELECT`＝读取指定列。 |
| 374 | <code>CREATE INDEX idx_lsh_line_time ON line_status_history (line_id, "time" DESC);</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。 |
| 379 | <code>CREATE TABLE production_events (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 380 | <code>"time"    TIMESTAMPTZ NOT NULL,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 383 | <code>line_id   BIGINT NOT NULL REFERENCES production_lines(id),</code> | 定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。 |
| 385 | <code>device_id BIGINT REFERENCES devices(id),</code> | 定义字段 `device_id` 的类型及约束。 关键字：`REFERENCES`＝引用关联表。 |
| 388 | <code>type      TEXT NOT NULL,</code> | 定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 394 | <code>level     TEXT NOT NULL DEFAULT 'info'</code> | 定义字段 `level` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 395 | <code>CHECK (level IN ('info','warning','critical')),</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 399 | <code>code      TEXT,</code> | 定义字段 `code` 的类型及约束。 |
| 402 | <code>message   TEXT,</code> | 定义字段 `message` 的类型及约束。 |
| 404 | <code>payload   JSONB NOT NULL DEFAULT '{}'</code> | 定义字段 `payload` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 409 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 411 | <code>SELECT create_hypertable('production_events', 'time');</code> | 读取数据。 关键字：`SELECT`＝读取指定列。 |
| 413 | <code>CREATE INDEX idx_pe_line_time ON production_events (line_id, "time" DESC);</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。 |
| 427 | <code>CREATE TABLE line_current_status (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 428 | <code>line_id      BIGINT PRIMARY KEY REFERENCES production_lines(id),</code> | 定义字段 `line_id` 的类型及约束。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义；`REFERENCES`＝引用关联表。 |
| 432 | <code>state        TEXT NOT NULL DEFAULT 'offline',</code> | 定义字段 `state` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 438 | <code>product_code TEXT,</code> | 定义字段 `product_code` 的类型及约束。 |
| 440 | <code>good_count   INTEGER NOT NULL DEFAULT 0,</code> | 定义字段 `good_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 442 | <code>ng_count     INTEGER NOT NULL DEFAULT 0,</code> | 定义字段 `ng_count` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 444 | <code>beat_ms      INTEGER,</code> | 定义字段 `beat_ms` 的类型及约束。 |
| 446 | <code>updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()</code> | 定义字段 `updated_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 450 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 464 | <code>CREATE TABLE control_commands (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 465 | <code>id              BIGSERIAL PRIMARY KEY,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 467 | <code>idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),</code> | 定义字段 `idempotency_key` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`UNIQUE`＝保证值唯一；`DEFAULT`＝默认值。 |
| 474 | <code>line_id         BIGINT NOT NULL REFERENCES production_lines(id),</code> | 定义字段 `line_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。 |
| 476 | <code>device_id       BIGINT NOT NULL REFERENCES devices(id),</code> | 定义字段 `device_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。 |
| 478 | <code>user_id         BIGINT NOT NULL REFERENCES users(id),</code> | 定义字段 `user_id` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`REFERENCES`＝引用关联表。 |
| 482 | <code>type            TEXT NOT NULL</code> | 定义字段 `type` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 483 | <code>CHECK (type IN ('start','stop','reset','changeover')),</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 488 | <code>params          JSONB NOT NULL DEFAULT '{}',</code> | 定义字段 `params` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 494 | <code>status          TEXT NOT NULL DEFAULT 'pending'</code> | 定义字段 `status` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 495 | <code>CHECK (status IN ('pending','sent','acked','rejected','failed','timeout')),</code> | 检查字段取值。 关键字：`CHECK`＝校验数据约束；`IN`＝检查是否属于集合。 |
| 507 | <code>ack_payload     JSONB,</code> | 定义字段 `ack_payload` 的类型及约束。 |
| 511 | <code>issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),</code> | 定义字段 `issued_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 514 | <code>acked_at        TIMESTAMPTZ</code> | 定义字段 `acked_at` 的类型及约束。 |
| 518 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 522 | <code>CREATE INDEX idx_cc_user_time ON control_commands (user_id, issued_at DESC);</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`INDEX`＝数据库索引；`ON`＝指定连接或冲突条件。 |
| 533 | <code>CREATE TABLE audit_logs (</code> | 创建数据库对象。 关键字：`CREATE`＝创建数据库对象；`TABLE`＝数据库表。 |
| 534 | <code>id         BIGSERIAL PRIMARY KEY,</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`PRIMARY`＝主键约束；`KEY`＝键定义。 |
| 536 | <code>user_id    BIGINT REFERENCES users(id),</code> | 定义字段 `user_id` 的类型及约束。 关键字：`REFERENCES`＝引用关联表。 |
| 540 | <code>action     TEXT NOT NULL,</code> | 定义字段 `action` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值。 |
| 543 | <code>target     TEXT,</code> | 定义字段 `target` 的类型及约束。 |
| 546 | <code>detail     JSONB NOT NULL DEFAULT '{}',</code> | 定义字段 `detail` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 551 | <code>ip         INET,</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 554 | <code>created_at TIMESTAMPTZ NOT NULL DEFAULT now()</code> | 定义字段 `created_at` 的类型及约束。 关键字：`NOT`＝逻辑否定；`NULL`＝数据库空值；`DEFAULT`＝默认值。 |
| 557 | <code>);</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 566 | <code>INSERT INTO roles (code, name) VALUES</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标；`VALUES`＝给出插入值。 |
| 567 | <code>('admin','管理员'), ('operator','产线操作员'), ('customer','客户'), ('analyst','数据分析员');</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 571 | <code>INSERT INTO permissions (code, type, name) VALUES</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标；`VALUES`＝给出插入值。 |
| 572 | <code>('menu:dashboard','menu','产线总览'),</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 573 | <code>('menu:twin','menu','数字孪生'),</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 574 | <code>('menu:analysis','menu','数据分析'),</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 575 | <code>('menu:admin','menu','系统管理'),</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 576 | <code>('api:command:execute','api','下发控制指令'),</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 577 | <code>('data:telemetry:detail','data','查看详细遥测数据');</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 589 | <code>INSERT INTO role_permissions (role_id, permission_id)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 590 | <code>SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE WHERE r.code = 'admin';</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`JOIN`＝连接另一数据表；`ON`＝指定连接或冲突条件；`WHERE`＝限定目标行。 |
| 593 | <code>INSERT INTO role_permissions (role_id, permission_id)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 594 | <code>SELECT r.id, p.id FROM roles r, permissions p</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。 |
| 595 | <code>WHERE r.code = 'operator' AND p.code IN</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。 |
| 596 | <code>('menu:dashboard','menu:twin','api:command:execute');</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 599 | <code>INSERT INTO role_permissions (role_id, permission_id)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 600 | <code>SELECT r.id, p.id FROM roles r, permissions p</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。 |
| 601 | <code>WHERE r.code = 'customer' AND p.code IN ('menu:dashboard','menu:twin');</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。 |
| 603 | <code>INSERT INTO role_permissions (role_id, permission_id)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 604 | <code>SELECT r.id, p.id FROM roles r, permissions p</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表。 |
| 605 | <code>WHERE r.code = 'analyst' AND p.code IN</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。 |
| 606 | <code>('menu:dashboard','menu:analysis','data:telemetry:detail');</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 614 | <code>INSERT INTO users (username, password_hash, display_name)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 615 | <code>VALUES ('admin', crypt('Admin@123', gen_salt('bf')), '系统管理员');</code> | 列出待写入的值。 关键字：`VALUES`＝给出插入值。 |
| 618 | <code>INSERT INTO user_roles (user_id, role_id)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 619 | <code>SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'admin';</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`WHERE`＝限定目标行；`AND`＝逻辑与。 |
| 626 | <code>INSERT INTO production_lines (code, name, location) VALUES ('line-01','一号产线','示例车间');</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标；`VALUES`＝给出插入值。 |
| 630 | <code>INSERT INTO devices (line_id, type, code, name, protocol)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 631 | <code>SELECT l.id, d.type, d.code, d.name, d.protocol</code> | 读取数据。 关键字：`SELECT`＝读取指定列。 |
| 632 | <code>FROM production_lines l,</code> | 指定读取来源表。 关键字：`FROM`＝指定查询来源表。 |
| 633 | <code>(VALUES ('plc',   'plc-01',    '主控 PLC',   'modbus_tcp'),</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`VALUES`＝给出插入值。 |
| 634 | <code>('robot', 'robot-01',  '六轴机器人', 'via_plc')</code> | 补全当前 SQL 语句的列、约束、值或参数。 |
| 635 | <code>) AS d(type, code, name, protocol)</code> | 补全当前 SQL 语句的列、约束、值或参数。 关键字：`AS`＝为字段或表设置别名。 |
| 636 | <code>WHERE l.code = 'line-01';</code> | 限定处理范围。 关键字：`WHERE`＝限定目标行。 |
| 639 | <code>INSERT INTO line_current_status (line_id)</code> | 写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。 |
| 640 | <code>SELECT id FROM production_lines WHERE code = 'line-01';</code> | 读取数据。 关键字：`SELECT`＝读取指定列；`FROM`＝指定查询来源表；`WHERE`＝限定目标行。 |
