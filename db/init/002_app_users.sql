-- =============================================================
-- 002_app_users.sql
-- 应用层账号表(与 linetwin 业务数据隔离;放独立 schema)
-- 密码:bcryptjs hash($2a$10$...);level:1=普通 2=二级 3=管理员
-- 三级权限规则严格对照 origin/1.0.1 的 userServer/main.py
-- 详见 server/src/users/users.service.ts 与 docs/deployment.md
-- =============================================================
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.app_users (
  username   TEXT PRIMARY KEY,
  password   TEXT NOT NULL,                      -- bcryptjs 哈希串
  level      SMALLINT NOT NULL CHECK (level IN (1, 2, 3)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_users_level_idx
  ON app.app_users(level);

-- 不预置默认账号;首次启动时由 server(UsersBootstrapService)在空表时
-- 自动插入 username=admin(level=3),初始密码取自环境变量 ADMIN_PASSWORD(默认 admin123)。
-- 生产部署后必须立即通过用户管理页修改默认密码。
