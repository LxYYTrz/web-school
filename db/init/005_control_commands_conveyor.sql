-- =============================================================
-- 005_control_commands_conveyor.sql
-- 契约 v1.2 扩展:control_commands.type 白名单追加 conveyor
-- 依据:DB3-Modbus-映射表.xls(2026-10-15)—— dataDB[10]「写入传送带控制」
--
-- 背景:
--   现场 PLC 的 11 word 表开放了 4 个控制写入点:
--     word 7  停止信号输入      脉冲,写 1
--     word 8  手动模式切换输入  脉冲,1=获取 2=释放
--     word 9  启动信号输入      脉冲,写 1
--     word 10 写入传送带控制    电平,1=正转 0=停止
--   契约 v1.1 的白名单里没有"传送带",edge 无对应指令类型,故追加 conveyor。
--
-- 语义(电平型,区别于其它三个脉冲型):
--   params.action = 'forward' → 写 1(正转),持续有效
--   params.action = 'stop'    → 写 0(停止)
--
-- 前提:产线状态必须为「手动控制模式」(state=102)才可使用传送带。
--   PLC 侧联锁负责否决(契约 §5 第 3 条),本系统不做此判断。
--
-- 触发场景:
--   1. 全新部署:docker-entrypoint-initdb.d 按字典序执行 001 → 002 → 003 → 004 → 005
--   2. 已在运行的库:
--      psql -U postgres -d linetwin -f db/init/005_control_commands_conveyor.sql
--
-- 注意:001~004 不动,符合"只增不改"
-- =============================================================

ALTER TABLE control_commands
  DROP CONSTRAINT IF EXISTS control_commands_type_check;

ALTER TABLE control_commands
  ADD CONSTRAINT control_commands_type_check
  CHECK (type IN (
    -- v1.0/v1.1
    'start', 'stop', 'reset', 'changeover', 'mode_set', 'alarm_clear',
    -- v1.2(现场 11 word 表新增传送带控制点)
    'conveyor'
  ));

COMMENT ON COLUMN control_commands.type IS
  '指令白名单。现场 PLC 11 word 表(dataDB-Modbus-映射表.xls)实际可执行: '
  'start(word9 脉冲) / stop(word7 脉冲) / mode_set(word8 脉冲,action=acquire|release) / '
  'conveyor(word10 电平,action=forward|stop)。'
  'reset / changeover / alarm_clear 保留在白名单但现场无对应寄存器,edge 回 rejected。';
