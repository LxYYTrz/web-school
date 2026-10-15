-- =============================================================
-- 003_control_commands_extension.sql
-- 契约 v1.1 扩展:control_commands.type 白名单追加 mode_set / alarm_clear
-- (commit: control_commands_extension)
--
-- 触发场景:
--   1. 全新部署:docker-entrypoint-initdb.d 按字典序执行 001 → 002 → 003
--   2. 已在运行的库:docker exec -i lt-cloud-db psql -U postgres -d line_twin
--                  \i /docker-entrypoint-initdb.d/003_control_commands_extension.sql
--
-- 注意:003 用 ALTER ... DROP/ADD CONSTRAINT,001/002 不动,符合"只增不改"
-- =============================================================

ALTER TABLE control_commands
  DROP CONSTRAINT control_commands_type_check;

ALTER TABLE control_commands
  ADD CONSTRAINT control_commands_type_check
  CHECK (type IN ('start','stop','reset','changeover','mode_set','alarm_clear'));