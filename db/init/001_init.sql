-- ============================================================================
-- 文件作用：数据库初始化 DDL（建库建表 + 索引 + 种子数据）
-- 所属模块：db/init/
-- ============================================================================
--
-- 【何时被执行】
--   ① Docker 场景：timescaledb 容器首次启动（数据目录为空）时，
--      会自动按文件名顺序执行挂载到 /docker-entrypoint-initdb.d/ 下的所有 .sql。
--      注意：**只在首次初始化时执行一次**，容器重启不会再跑。
--   ② Windows 原生场景（工控机 U 盘部署）：手动用 psql 执行
--      psql -U postgres -d linetwin -f 001_init.sql
--      见 docs/工控机部署手册-U盘版.md 第 3.2 节。
--
-- 【表结构总览（九张表，分四个域）】
--
--   ① 权限与组织域（RBAC）
--      users              用户
--      roles              角色（admin/operator/customer/analyst）
--      permissions        权限点（菜单/接口/数据三类）
--      user_roles         用户↔角色 多对多
--      role_permissions   角色↔权限 多对多
--      user_line_scope    ★数据权限★：用户能看哪些产线
--
--   ② 产线与设备域
--      production_lines   产线
--      devices            设备（PLC / 机器人）
--
--   ③ 时序数据域（TimescaleDB hypertable，按时间自动分区）
--      robot_joint_states 机器人六轴遥测（10Hz）
--      line_status_history 产线状态历史（1Hz）
--      production_events   生产事件/报警
--
--   ④ 业务与审计域
--      line_current_status 产线当前状态（每产线一行，UPSERT）
--      control_commands    控制指令（白名单 + 全生命周期审计）
--      audit_logs          操作审计日志
--
-- 【★ code 与 id 的关系（理解本文件最关键的一点）】
--   MQTT 报文和主题里用的是**可读编码**（code）：'line-01'、'robot-01'
--   数据库表里用的是**自增主键**（id）：1、2、3
--   两者通过 code ↔ id 映射对应，由后端 CatalogService 负责翻译（见 server/src/infra/）。
--   所以：
--     production_lines.code 必须与 MQTT 主题里的 {lineId} 一致
--     devices.code       必须与报文里的 deviceId 和主题里的 {deviceId} 一致
--   ★ 这一层"翻译"是故意设计的：MQTT 侧用可读编码（现场改设备名不用动数据库主键、
--     排查问题时看主题就知道是哪台设备），数据库侧用数字主键（外键高效、索引紧凑）。
-- ============================================================================

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
  id            BIGSERIAL PRIMARY KEY,      -- 自增主键
  username      TEXT NOT NULL UNIQUE,       -- 登录名，唯一
  password_hash TEXT NOT NULL,             -- bcrypt
  display_name  TEXT,                       -- 显示名
  phone         TEXT,                       -- 联系电话
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')), -- 启用/禁用
  last_login_at TIMESTAMPTZ,                -- 最后登录时间
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
  PRIMARY KEY (user_id, role_id)   -- 联合主键：同一个人不能有重复角色
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
  name     TEXT NOT NULL,          -- 显示名
  location TEXT,                   -- 车间位置
  status   TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('running','idle','alarm','offline')) -- 产线状态
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
  line_id  BIGINT NOT NULL REFERENCES production_lines(id),  -- 归属产线
  type     TEXT NOT NULL CHECK (type IN ('plc','robot')),      -- 设备类型
  code     TEXT NOT NULL UNIQUE,   -- 与 MQTT 主题中的 {deviceId} 一致
  name     TEXT NOT NULL,          -- 显示名
  protocol TEXT,                   -- modbus_tcp / opc_ua / s7 / mc / http ...
  config   JSONB NOT NULL DEFAULT '{}',  -- 连接参数(ip/端口/单元号等),敏感凭据不要明文放这里
  status   TEXT NOT NULL DEFAULT 'unknown'  -- 设备状态
);

-- ---------------- 时序数据(TimescaleDB hypertable) ----------------
-- 什么是 hypertable：把一张大表按时间自动拆成多个"块"(chunk)。
--   查询只扫相关的时间块 → 即使存了几亿行，查询依然很快；
--   还能对老数据做压缩、按时间自动删除（retention policy）。
--   ★ 表结构上 hypertable 和普通表没区别，区别在于 create_hypertable 之后。

-- 机器人六轴遥测,5~10Hz
--   这是本系统写入量最大的表：10Hz × 86400 秒 × N 台机器人 = 86.4 万行/台/天
CREATE TABLE robot_joint_states (
  "time"     TIMESTAMPTZ NOT NULL,                          -- 采集时刻（时序表主键的一部分）
  device_id  BIGINT NOT NULL REFERENCES devices(id),         -- 设备外键
  joints     DOUBLE PRECISION[] NOT NULL,        -- [j1..j6],单位 deg
  tcp_pose   DOUBLE PRECISION[],                 -- [x,y,z,rx,ry,rz],可空
  speed_pct  REAL,                               -- 速度倍率
  mode       TEXT,                               -- 运行模式
  program    TEXT,                               -- 程序名
  alarm_code INTEGER NOT NULL DEFAULT 0         -- 报警码，0=无
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
  product_code TEXT,                       -- 产品型号
  good_count   INTEGER NOT NULL DEFAULT 0, -- 良品累计
  ng_count     INTEGER NOT NULL DEFAULT 0, -- 不良累计
  beat_ms      INTEGER                     -- 节拍（毫秒）
);
SELECT create_hypertable('line_status_history', 'time');
CREATE INDEX idx_lsh_line_time ON line_status_history (line_id, "time" DESC);

-- 事件/报警流
CREATE TABLE production_events (
  "time"    TIMESTAMPTZ NOT NULL,
  line_id   BIGINT NOT NULL REFERENCES production_lines(id),
  device_id BIGINT REFERENCES devices(id),          -- 可空（产线级事件没有设备）
  type      TEXT NOT NULL,          -- start / stop / alarm / piece_done / changeover / custom
  level     TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info','warning','critical')),
  code      TEXT,                   -- 厂商报警码
  message   TEXT,                   -- 描述
  payload   JSONB NOT NULL DEFAULT '{}'  -- 自定义负载
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
  line_id      BIGINT PRIMARY KEY REFERENCES production_lines(id),  -- 主键 = 产线 id，每产线一行
  state        TEXT NOT NULL DEFAULT 'offline',
  product_code TEXT,
  good_count   INTEGER NOT NULL DEFAULT 0,
  ng_count     INTEGER NOT NULL DEFAULT 0,
  beat_ms      INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()   -- 最后更新时间
);

-- 控制指令(全生命周期审计;type 为白名单,不开放任意写寄存器)
--   ★ idempotency_key 就是 MQTT 报文里的 cmdId —— 它把"云端下发的指令"
--     和"边缘回来的回执"绑定在一起，形成闭环审计与幂等。
CREATE TABLE control_commands (
  id              BIGSERIAL PRIMARY KEY,
  idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- 即 MQTT 报文中的 cmdId
  line_id         BIGINT NOT NULL REFERENCES production_lines(id),
  device_id       BIGINT NOT NULL REFERENCES devices(id),
  user_id         BIGINT NOT NULL REFERENCES users(id),   -- 谁下的指令（审计）
  type            TEXT NOT NULL CHECK (type IN ('start','stop','reset','changeover')),  -- ★ 白名单
  params          JSONB NOT NULL DEFAULT '{}',            -- 指令参数
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','acked','rejected','failed','timeout')),
  -- 状态机：pending → sent → acked / rejected / failed / timeout
  --   pending  已落库、还没发出去
  --   sent     已通过 MQTT 下发
  --   acked    边缘确认执行成功
  --   rejected 边缘拒绝执行（如 PLC 联锁不允许）
  --   failed   执行失败
  --   timeout  15 秒无回执（超时检测待实现，见 server/README.md TODO）
  ack_payload     JSONB,                    -- 回执原始报文
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),  -- 下发时间
  acked_at        TIMESTAMPTZ                -- 回执时间
);
-- 索引：按操作人 + 时间查（"张三今天下了哪些指令"）
CREATE INDEX idx_cc_user_time ON control_commands (user_id, issued_at DESC);

-- 操作审计
--   所有敏感操作（登录、下发指令、建用户）都往这里写一条。
--   ★ 审计必须**独立于**业务表：即使业务表被误改，审计表还在。
CREATE TABLE audit_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id),   -- 操作人（可空 = 系统操作）
  action     TEXT NOT NULL,        -- login / command:execute / user:create ...
  target     TEXT,                 -- 操作对象，如 'line-01/robot-01'
  detail     JSONB NOT NULL DEFAULT '{}',  -- 详情
  ip         INET,                 -- 来源 IP（INET 是 PostgreSQL 的 IP 类型）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- 种子数据 ----------------
-- 种子数据的作用：让系统"装完就能用"。
--   里面定义了四个角色及其权限矩阵，并创建了一个初始管理员。

-- 四个内置角色
INSERT INTO roles (code, name) VALUES
  ('admin','管理员'), ('operator','产线操作员'), ('customer','客户'), ('analyst','数据分析员');

-- 权限点清单
INSERT INTO permissions (code, type, name) VALUES
  ('menu:dashboard','menu','产线总览'),
  ('menu:twin','menu','数字孪生'),
  ('menu:analysis','menu','数据分析'),
  ('menu:admin','menu','系统管理'),
  ('api:command:execute','api','下发控制指令'),      -- ★ 操作员的核心权限
  ('data:telemetry:detail','data','查看详细遥测数据');  -- ★ 分析员的核心权限

-- 权限矩阵：管理员拥有全部权限
--   CROSS JOIN（笛卡尔积）= 每个角色 × 每个权限
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE WHERE r.code = 'admin';

-- 操作员：总览 + 孪生 + 下发指令（不能看分析页）
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'operator' AND p.code IN
    ('menu:dashboard','menu:twin','api:command:execute');

-- 客户：只读（总览 + 孪生），不能控制、不能看详细数据
--   ★ 数据范围（能看哪条产线）由 user_line_scope 表控制，不是这里
INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id FROM roles r, permissions p
  WHERE r.code = 'customer' AND p.code IN ('menu:dashboard','menu:twin');

-- 分析员：总览 + 分析 + 详细数据（不能控制产线）
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
-- 开启压缩：7 天后开始压缩老数据块，体积可降到 1/10 左右
-- ALTER TABLE robot_joint_states SET (timescaledb.compress,
--   timescaledb.compress_segmentby = 'device_id');
-- 自动压缩策略：每 7 天压缩一次
-- SELECT add_compression_policy('robot_joint_states', INTERVAL '7 days');
-- 自动删除策略：只保留 30 天（★ 生产必须设置，否则磁盘会被撑爆）
-- SELECT add_retention_policy('robot_joint_states', INTERVAL '30 days');
-- 另建议为长期趋势建 1 分钟粒度连续聚合(continuous aggregate),见 TimescaleDB 文档。
