-- =============================================================
-- 产线数字孪生平台 初始化 DDL(PostgreSQL 16 + TimescaleDB)
-- 首次启动 timescaledb 容器时自动执行(docker-entrypoint-initdb.d)
-- =============================================================

-- 启用 TimescaleDB 扩展：提供 hypertable（自动分区）、压缩、连续聚合等能力
CREATE EXTENSION IF NOT EXISTS timescaledb;
-- 启用 pgcrypto 扩展：提供 gen_random_uuid()（指令幂等键）和 crypt()/gen_salt()（口令散列）
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- 用于种子账号的口令散列

-- ---------------- 权限与组织 ----------------

-- 用户表。
--   ★ password_hash 存 bcrypt 散列，**绝不存明文**。
--     种子账号用 pgcrypto 的 crypt('明文', gen_salt('bf')) 生成（见文件末尾）。
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,             -- bcrypt
  display_name  TEXT,
  phone         TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 角色表。四个内置角色：管理员/产线操作员/客户/数据分析员
CREATE TABLE roles (
  id   BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,   -- admin / operator / customer / analyst
  name TEXT NOT NULL
);

-- 权限点表。type 决定权限作用在哪一层（这是 RBAC 三级控制的基础）：
--   menu = 菜单权限（前端按它渲染菜单）
--   api  = 接口权限（后端按它校验请求）
--   data = 数据权限（后端按它决定返回哪些字段/哪些产线）
CREATE TABLE permissions (
  id   BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,   -- 如 menu:twin / api:command:execute / data:telemetry:detail
  type TEXT NOT NULL CHECK (type IN ('menu','api','data')),
  name TEXT NOT NULL
);

-- 用户↔角色 关联表（多对多）
CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 角色↔权限 关联表（多对多）
CREATE TABLE role_permissions (
  role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 产线表。
--   ★ code 必须与 MQTT 主题中的 {lineId} 一致（这是 MQTT→数据库的关键锚点）
CREATE TABLE production_lines (
  id       BIGSERIAL PRIMARY KEY,
  code     TEXT NOT NULL UNIQUE,   -- 与 MQTT 主题中的 {lineId} 一致
  name     TEXT NOT NULL,
  location TEXT,
  status   TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('running','idle','alarm','offline'))
);

-- 数据权限:用户可见哪些产线(客户只能看名下产线)
--   ★ 这张表是"客户角色只能看自己产线"的技术实现：
--     后端查询时 JOIN 这张表做过滤，而不是相信前端传参。
CREATE TABLE user_line_scope (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  line_id BIGINT NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, line_id)
);

-- 设备表。
--   ★ code 必须与 MQTT 报文里的 deviceId 和主题里的 {deviceId} 一致
CREATE TABLE devices (
  id       BIGSERIAL PRIMARY KEY,
  line_id  BIGINT NOT NULL REFERENCES production_lines(id),
  type     TEXT NOT NULL CHECK (type IN ('plc','robot')),
  code     TEXT NOT NULL UNIQUE,   -- 与 MQTT 主题中的 {deviceId} 一致
  name     TEXT NOT NULL,
  protocol TEXT,                   -- modbus_tcp / opc_ua / s7 / mc / http ...
  config   JSONB NOT NULL DEFAULT '{}',  -- 连接参数(ip/端口/单元号等),敏感凭据不要明文放这里
  status   TEXT NOT NULL DEFAULT 'unknown'
);

-- ---------------- 时序数据(TimescaleDB hypertable) ----------------

-- 机器人六轴遥测,5~10Hz
--   这是本系统写入量最大的表：10Hz × 86400 秒 × N 台机器人 = 86.4 万行/台/天
CREATE TABLE robot_joint_states (
  "time"     TIMESTAMPTZ NOT NULL,
  device_id  BIGINT NOT NULL REFERENCES devices(id),
  joints     DOUBLE PRECISION[] NOT NULL,        -- [j1..j6],单位 deg
  tcp_pose   DOUBLE PRECISION[],                 -- [x,y,z,rx,ry,rz],可空
  speed_pct  REAL,
  mode       TEXT,
  program    TEXT,
  alarm_code INTEGER NOT NULL DEFAULT 0
);
-- 转成 hypertable：按 "time" 列自动分区
SELECT create_hypertable('robot_joint_states', 'time');
-- 索引：最常见的查询是"查某台设备最近 N 条" → (device_id, time DESC)
CREATE INDEX idx_rjs_device_time ON robot_joint_states (device_id, "time" DESC);

-- 产线状态历史(快照序列)
CREATE TABLE line_status_history (
  "time"       TIMESTAMPTZ NOT NULL,
  line_id      BIGINT NOT NULL REFERENCES production_lines(id),
  state        TEXT NOT NULL CHECK (state IN ('running','idle','alarm','offline')),
  product_code TEXT,
  good_count   INTEGER NOT NULL DEFAULT 0,
  ng_count     INTEGER NOT NULL DEFAULT 0,
  beat_ms      INTEGER
);
SELECT create_hypertable('line_status_history', 'time');
CREATE INDEX idx_lsh_line_time ON line_status_history (line_id, "time" DESC);

-- 事件/报警流
CREATE TABLE production_events (
  "time"    TIMESTAMPTZ NOT NULL,
  line_id   BIGINT NOT NULL REFERENCES production_lines(id),
  device_id BIGINT REFERENCES devices(id),
  type      TEXT NOT NULL,          -- start / stop / alarm / piece_done / changeover / custom
  level     TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info','warning','critical')),
  code      TEXT,                   -- 厂商报警码
  message   TEXT,
  payload   JSONB NOT NULL DEFAULT '{}'
);
SELECT create_hypertable('production_events', 'time');
CREATE INDEX idx_pe_line_time ON production_events (line_id, "time" DESC);

-- ---------------- 业务与审计 ----------------

-- 产线当前状态(单行快照,与 Redis 同步;前端首屏读这里)
--   ★ 注意：这是**普通表**（不是 hypertable），因为它只保存"当前"这一行。
--     后端每次收到产线状态就 UPSERT 覆盖（见 history-writer.service.ts）。
--     Redis 里也有一份同样的数据（后端的前端首屏实际读的是 Redis，
--     这张表主要用于持久化存档和给分析页做交叉校验）。
CREATE TABLE line_current_status (
  line_id      BIGINT PRIMARY KEY REFERENCES production_lines(id),
  state        TEXT NOT NULL DEFAULT 'offline',
  product_code TEXT,
  good_count   INTEGER NOT NULL DEFAULT 0,
  ng_count     INTEGER NOT NULL DEFAULT 0,
  beat_ms      INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 控制指令(全生命周期审计;type 为白名单,不开放任意写寄存器)
--   ★ idempotency_key 就是 MQTT 报文里的 cmdId —— 它把"云端下发的指令"
--     和"边缘回来的回执"绑定在一起，形成闭环审计与幂等。
CREATE TABLE control_commands (
  id              BIGSERIAL PRIMARY KEY,
  idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- 即 MQTT 报文中的 cmdId
  line_id         BIGINT NOT NULL REFERENCES production_lines(id),
  device_id       BIGINT NOT NULL REFERENCES devices(id),
  user_id         BIGINT NOT NULL REFERENCES users(id),
  type            TEXT NOT NULL CHECK (type IN ('start','stop','reset','changeover')),
  params          JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','acked','rejected','failed','timeout')),
  -- 状态机：pending → sent → acked / rejected / failed / timeout
  --   pending  已落库、还没发出去
  --   sent     已通过 MQTT 下发
  --   acked    边缘确认执行成功
  --   rejected 边缘拒绝执行（如 PLC 联锁不允许）
  --   failed   执行失败
  --   timeout  15 秒无回执（超时检测待实现，见 server/README.md TODO）
  ack_payload     JSONB,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  acked_at        TIMESTAMPTZ
);
-- 索引：按操作人 + 时间查（"张三今天下了哪些指令"）
CREATE INDEX idx_cc_user_time ON control_commands (user_id, issued_at DESC);

-- 操作审计
--   所有敏感操作（登录、下发指令、建用户）都往这里写一条。
--   ★ 审计必须**独立于**业务表：即使业务表被误改，审计表还在。
CREATE TABLE audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id),
  action     TEXT NOT NULL,        -- login / command:execute / user:create ...
  target     TEXT,
  detail     JSONB NOT NULL DEFAULT '{}',
  ip         INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- 种子数据 ----------------

-- 四个内置角色
INSERT INTO roles (code, name) VALUES
  ('admin','管理员'), ('operator','产线操作员'), ('customer','客户'), ('analyst','数据分析员');

-- 权限点清单
INSERT INTO permissions (code, type, name) VALUES
  ('menu:dashboard','menu','产线总览'),
  ('menu:twin','menu','数字孪生'),
  ('menu:analysis','menu','数据分析'),
  ('menu:admin','menu','系统管理'),
  ('api:command:execute','api','下发控制指令'),
  ('data:telemetry:detail','data','查看详细遥测数据');

-- 权限矩阵：管理员拥有全部权限
--   CROSS JOIN（笛卡尔积）= 每个角色 × 每个权限
-- 操作员：总览 + 孪生 + 下发指令（不能看分析页）
-- 客户：只读（总览 + 孪生），不能控制、不能看详细数据
--   ★ 数据范围（能看哪条产线）由 user_line_scope 表控制，不是这里
-- 分析员：总览 + 分析 + 详细数据（不能控制产线）
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE WHERE r.code = 'admin';
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'operator' AND p.code IN
    ('menu:dashboard','menu:twin','api:command:execute');
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'customer' AND p.code IN ('menu:dashboard','menu:twin');
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'analyst' AND p.code IN
    ('menu:dashboard','menu:analysis','data:telemetry:detail');

-- 初始管理员:admin / Admin@123  ★首次登录后必须修改
--   crypt('明文', gen_salt('bf'))：pgcrypto 的 bcrypt 口令散列
INSERT INTO users (username, password_hash, display_name)
  VALUES ('admin', crypt('Admin@123', gen_salt('bf')), '系统管理员');
-- 把 admin 用户绑定到 admin 角色
INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'admin';

-- 示例产线与设备(code 与数据契约 / mock 采集器一致)
--   ★ line-01 必须与 mock_collector.py 的默认 LINE_ID 一致！
INSERT INTO production_lines (code, name, location) VALUES ('line-01','一号产线','示例车间');
-- 用 CROSS JOIN 一次性插入两台设备（plc-01 主控 PLC、robot-01 六轴机器人）
INSERT INTO devices (line_id, type, code, name, protocol)
  SELECT l.id, d.type, d.code, d.name, d.protocol
  FROM production_lines l,
       (VALUES ('plc',   'plc-01',    '主控 PLC',   'modbus_tcp'),
               ('robot', 'robot-01',  '六轴机器人', 'via_plc')
       ) AS d(type, code, name, protocol)
  WHERE l.code = 'line-01';
-- 为示例产线初始化一行"当前状态"
INSERT INTO line_current_status (line_id)
  SELECT id FROM production_lines WHERE code = 'line-01';

-- ---------------- 时序数据生命周期(按需开启,默认注释) ----------------
-- ALTER TABLE robot_joint_states SET (timescaledb.compress,
--   timescaledb.compress_segmentby = 'device_id');
-- SELECT add_compression_policy('robot_joint_states', INTERVAL '7 days');
-- SELECT add_retention_policy('robot_joint_states', INTERVAL '30 days');
-- 另建议为长期趋势建 1 分钟粒度连续聚合(continuous aggregate),见 TimescaleDB 文档。
