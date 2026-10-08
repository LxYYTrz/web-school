-- =============================================================
-- 产线数字孪生平台 初始化 DDL(PostgreSQL 16 + TimescaleDB)
-- 首次启动 timescaledb 容器时自动执行(docker-entrypoint-initdb.d)
-- =============================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- 用于种子账号的口令散列

-- ---------------- 权限与组织 ----------------

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

CREATE TABLE roles (
  id   BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,   -- admin / operator / customer / analyst
  name TEXT NOT NULL
);

CREATE TABLE permissions (
  id   BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,   -- 如 menu:twin / api:command:execute / data:telemetry:detail
  type TEXT NOT NULL CHECK (type IN ('menu','api','data')),
  name TEXT NOT NULL
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
  role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE production_lines (
  id       BIGSERIAL PRIMARY KEY,
  code     TEXT NOT NULL UNIQUE,   -- 与 MQTT 主题中的 {lineId} 一致
  name     TEXT NOT NULL,
  location TEXT,
  status   TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('running','idle','alarm','offline'))
);

-- 数据权限:用户可见哪些产线(客户只能看名下产线)
CREATE TABLE user_line_scope (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  line_id BIGINT NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, line_id)
);

CREATE TABLE devices (
  id       BIGSERIAL PRIMARY KEY,
  line_id  BIGINT NOT NULL REFERENCES production_lines(id),
  type     TEXT NOT NULL CHECK (type IN ('plc','robot','camera','ipc')),
  code     TEXT NOT NULL UNIQUE,   -- 与 MQTT 主题中的 {deviceId} 一致
  name     TEXT NOT NULL,
  protocol TEXT,                   -- modbus_tcp / opc_ua / s7 / mc / http ...
  config   JSONB NOT NULL DEFAULT '{}',  -- 连接参数(ip/端口/单元号等),敏感凭据不要明文放这里
  status   TEXT NOT NULL DEFAULT 'unknown'
);

-- ---------------- 时序数据(TimescaleDB hypertable) ----------------

-- 机器人六轴遥测,5~10Hz
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
SELECT create_hypertable('robot_joint_states', 'time');
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
CREATE TABLE line_current_status (
  line_id      BIGINT PRIMARY KEY REFERENCES production_lines(id),
  state        TEXT NOT NULL DEFAULT 'offline',
  product_code TEXT,
  good_count   INTEGER NOT NULL DEFAULT 0,
  ng_count     INTEGER NOT NULL DEFAULT 0,
  beat_ms      INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 视觉图片元数据(图片二进制在对象存储 MinIO/OSS)
CREATE TABLE vision_images (
  id          BIGSERIAL PRIMARY KEY,
  line_id     BIGINT NOT NULL REFERENCES production_lines(id),
  camera_id   BIGINT REFERENCES devices(id),
  sn          TEXT,                       -- 工件序列号/条码,追溯键
  result      TEXT NOT NULL CHECK (result IN ('ok','ng')),
  defects     JSONB NOT NULL DEFAULT '[]',
  object_key  TEXT,                       -- 原图在对象存储中的 key
  thumb_key   TEXT,                       -- 缩略图 key
  captured_at TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vi_line_time ON vision_images (line_id, captured_at DESC);
CREATE INDEX idx_vi_sn ON vision_images (sn);

-- 控制指令(全生命周期审计;type 为白名单,不开放任意写寄存器)
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
  ack_payload     JSONB,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  acked_at        TIMESTAMPTZ
);
CREATE INDEX idx_cc_user_time ON control_commands (user_id, issued_at DESC);

-- 操作审计
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

INSERT INTO roles (code, name) VALUES
  ('admin','管理员'), ('operator','产线操作员'), ('customer','客户'), ('analyst','数据分析员');

INSERT INTO permissions (code, type, name) VALUES
  ('menu:dashboard','menu','产线总览'),
  ('menu:twin','menu','数字孪生'),
  ('menu:vision','menu','视觉检测'),
  ('menu:analysis','menu','数据分析'),
  ('menu:admin','menu','系统管理'),
  ('api:command:execute','api','下发控制指令'),
  ('data:telemetry:detail','data','查看详细遥测数据'),
  ('data:vision:all','data','查看全部视觉结果(含 NG 明细)');

INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE WHERE r.code = 'admin';
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'operator' AND p.code IN
    ('menu:dashboard','menu:twin','menu:vision','api:command:execute');
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'customer' AND p.code IN ('menu:dashboard','menu:twin');
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'analyst' AND p.code IN
    ('menu:dashboard','menu:vision','menu:analysis','data:telemetry:detail','data:vision:all');

-- 初始管理员:admin / Admin@123  ★首次登录后必须修改
INSERT INTO users (username, password_hash, display_name)
  VALUES ('admin', crypt('Admin@123', gen_salt('bf')), '系统管理员');
INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'admin';

-- 示例产线与设备(code 与数据契约 / mock 采集器一致)
INSERT INTO production_lines (code, name, location) VALUES ('line-01','一号产线','示例车间');
INSERT INTO devices (line_id, type, code, name, protocol)
  SELECT l.id, d.type, d.code, d.name, d.protocol
  FROM production_lines l,
       (VALUES ('plc',   'plc-01',    '主控 PLC',   'modbus_tcp'),
               ('robot', 'robot-01',  '六轴机器人', 'via_plc'),
               ('camera','cam-01',    '视觉相机',   'gige'),
               ('ipc',   'ipc-vision','视觉工控机', 'http')
       ) AS d(type, code, name, protocol)
  WHERE l.code = 'line-01';
INSERT INTO line_current_status (line_id)
  SELECT id FROM production_lines WHERE code = 'line-01';

-- ---------------- 时序数据生命周期(按需开启,默认注释) ----------------
-- ALTER TABLE robot_joint_states SET (timescaledb.compress,
--   timescaledb.compress_segmentby = 'device_id');
-- SELECT add_compression_policy('robot_joint_states', INTERVAL '7 days');
-- SELECT add_retention_policy('robot_joint_states', INTERVAL '30 days');
-- 另建议为长期趋势建 1 分钟粒度连续聚合(continuous aggregate),见 TimescaleDB 文档。
