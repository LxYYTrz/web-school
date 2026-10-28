-- 扩展传送带控制相关的数据库约束，实际下发仍经 CommandService、MQTT 与采集器。
-- SQL 定义结构、约束或迁移；应用运行时的具体查询和写入在 server/，不要把存在一张表当作界面已经提供对应功能。

-- ============================================================================
-- 005_control_commands_conveyor.sql
--   契约 v1.2 扩展：control_commands.type 白名单追加 conveyor（传送带）
-- 所属目录：db/init/（产线数字孪生平台 · 数据层 · 增量迁移）
-- ============================================================================
--
-- 【文件作用】
--   又一次小步扩权：往控制指令的允许清单里加"传送带"(conveyor)这一项。
--   依据是现场点位表里多开放了一个传送带控制点。
--
-- 【背景：现场 PLC 到底开放了几个写入点】
--   现场 11 word 表一共开放 4 个控制写入点（DB3-Modbus-映射表.xls）：
--     word 7   停止信号输入      脉冲型，写 1
--     word 8   手动模式切换输入  脉冲型，1=获取手动 2=释放手动
--     word 9   启动信号输入      脉冲型，写 1
--     word 10  写入传送带控制    电平型，1=正转 0=停止
--   契约 v1.1 的白名单里没有"传送带"，edge 也没有对应的指令类型，
--   所以追加 conveyor，让契约、数据库、后端、采集器四边对得上。
--
-- 【★ 白名单 ≠ 能执行：这是本脚本最要紧的一句】
--   指令清单里有 7 项，但现场 PLC 实际只开放了上面 4 个写入点。
--   剩下 3 项（reset 复位 / changeover 换型 / alarm_clear 清报警）
--   现场没有对应的寄存器，**保留在清单里是为了契约的完整性**——
--   将来现场加了寄存器，不用再动数据库就能直接用。
--   但现在点下去，采集器会明确回 "rejected" 并说明原因，
--   绝不假装成功（edge/plc_collector.py 的 CMD_DISPATCH 里这三个的 sig_name 是 None，
--   kind 是 noop）。
--   ★ 为什么必须这样：否则操作员会以为指令生效了，实际上什么都没发生。
--     在产线上，"以为停了其实没停"是会出事的。
--   代码里的权威清单：server/src/command/command-contract.ts
--     （allowedTypes = 契约白名单，executableTypes = 现场真能执行的）。
--     后端与 AI 的只读 MCP server 共读同一份 command-contract.json，
--     避免"AI 建议的白名单"和"真实下发的白名单"两边漂移。
--
-- 【两种指令的语义差别：脉冲 vs 电平】
--   · 脉冲型（start / stop / mode_set）：写进去一个动作信号，PLC 做完自己清零。
--     写一次就够，不用再写第二次。
--   · 电平型（conveyor）：写正转就一直转，得再写一次才停。
--     ★ 这个区别在采集器那一层处理（edge/plc_collector.py 的 CONVEYOR_VALUE
--       = {'stop': 0, 'forward': 1}），数据库这边**只管把参数原样存下来备查**，
--       不理解、也不执行任何控制语义。
--
-- 【前提：传送带必须在手动模式下才能用】
--   产线状态必须是「手动控制模式」(state = manual_mode，即 PLC 的 102) 才可用。
--   PLC 侧的联锁负责否决（契约 §5 第 3 条），本系统不做这个判断；
--   前端只做按钮置灰提示（web/src/components/ControlButtons.vue）。
--   ★ 数据库同样不判断——它只是"白名单里有 conveyor 就允许写进来"，
--     至于这条指令在当前产线状态下合不合法，由 PLC 和前端各管一段。
--
-- 【执行方式】
--   全新部署按文件名顺序执行；存量库只执行尚未应用的迁移：
--        psql -U postgres -d linetwin -f db\init\005_control_commands_conveyor.sql
--
-- 【幂等性与执行注意事项】
--   · 本脚本**幂等**：DROP CONSTRAINT 带 IF EXISTS，重复执行安全。
--   · ADD CONSTRAINT 会对存量行做一次全表校验。本次是"放宽"（新集合是旧集合的
--     超集），存量行一定还能通过。
--   · ALTER TABLE 会拿 ACCESS EXCLUSIVE 锁，事务期间 control_commands 不能读写。
--     在线上的库里执行时挑个业务低峰。
--
-- 【注意】001~004 不动，符合"只增不改"
--
-- 【本文件用到的 SQL 关键字】
--   ALTER TABLE        改表结构
--   DROP CONSTRAINT    删掉一条约束
--   IF EXISTS          存在才执行（不存在就跳过，不报错）—— 幂等的关键
--   ADD CONSTRAINT     加一条约束
--   CHECK              行级校验，写不进表
--   IN (...)           枚举白名单，配合 CHECK 使用
--   COMMENT ON COLUMN  给某一列写数据库注释（psql \d+ 能看到）
-- ============================================================================
--
-- 【契约与来源】
--   契约 v1.2 扩展：control_commands.type 白名单追加 conveyor。
--   依据：DB3-Modbus-映射表.xls（2026-10-15）—— dataDB[10]「写入传送带控制」。
--
-- 【前提】
--   产线状态必须为「手动控制模式」（state=102）才可使用传送带。
--   PLC 侧联锁负责否决（契约 §5 第 3 条），本系统不做此判断。
--
-- 【触发场景】
--   1. 全新部署：按文件名顺序执行 db/init/*.sql（001 → … → 005）
--   2. 已在运行的库：
--      psql -U postgres -d linetwin -f db/init/005_control_commands_conveyor.sql
--
-- 【注意】
--   001~004 不动，符合"只增不改"。

-- ① 换掉上一版白名单约束（6 项 → 7 项）。
--    ALTER TABLE = 改表结构；DROP CONSTRAINT = 删掉一条约束。
--    003 加的这条约束名同样是 PostgreSQL 自动生成的 control_commands_type_check。
--    IF EXISTS = 不存在也不报错，重复执行安全。
ALTER TABLE control_commands
-- alter table 控制指令审计记录相关的数据结构或记录。
-- control_commands 是保存控制指令审计记录的数据表
  DROP CONSTRAINT IF EXISTS control_commands_type_check;
  -- IF EXISTS = 不存在也不报错，重复执行安全。

-- ② 加回新约束（7 项白名单）。
--    ADD CONSTRAINT = 加一条约束；CHECK = 行级校验条件。
--    ★ 仍然是"只增不改"：v1.0/v1.1 的 6 项一个没删，conveyor 追加在最后。
ALTER TABLE control_commands
-- alter table 控制指令审计记录相关的数据结构或记录。
-- control_commands 是保存控制指令审计记录的数据表
  ADD CONSTRAINT control_commands_type_check
  -- ★ 仍然是"只增不改"：v1.0/v1.1 的 6 项一个没删，conveyor 追加在最后。
  CHECK (type IN (
    -- v1.0/v1.1
    'start', 'stop', 'reset', 'changeover', 'mode_set', 'alarm_clear',
    -- v1.2(现场 11 word 表新增传送带控制点)
    'conveyor'
  ));
  -- v1.2(现场 11 word 表新增传送带控制点)。

-- ---------------------------------------------------------------------------
-- 3) 把"清单上有的"和"现场真能执行的"分开写进数据库
-- ---------------------------------------------------------------------------
-- 为什么这段注释重要：
--   以后有人只查数据库，看到白名单里有 7 项，会以为 7 种指令都能用。
--   把两件事分开写清楚写在列注释里，查库的人一眼就能看到边界，
--   不用去翻 edge 代码才知道哪几项是"点了会回 rejected"的。
-- COMMENT ON COLUMN = 给指定的列写一段数据库注释
-- 相邻字面量拼接（'...' '...'）= PostgreSQL 里相邻字符串会拼成一段
COMMENT ON COLUMN control_commands.type IS
-- COMMENT ON COLUMN = 给指定的列写一段数据库注释。
  '指令白名单。现场 PLC 11 word 表(dataDB-Modbus-映射表.xls)实际可执行: '
  'start(word9 脉冲) / stop(word7 脉冲) / mode_set(word8 脉冲,action=acquire|release) / '
  'conveyor(word10 电平,action=forward|stop)。'
  'reset / changeover / alarm_clear 保留在白名单但现场无对应寄存器,edge 回 rejected。';
