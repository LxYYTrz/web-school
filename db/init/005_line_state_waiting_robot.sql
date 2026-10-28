-- 补充等待机器人完成的工序状态值，需与现场整数到契约字符串的映射一致。
-- SQL 定义结构、约束或迁移；应用运行时的具体查询和写入在 server/，不要把存在一张表当作界面已经提供对应功能。

-- =============================================================
-- 005_line_state_waiting_robot.sql
-- 契约 v1.1 校正:PLC 状态 3 的真实语义是「等待机器人完成」
--
-- 背景:
--   2026-10-23 现场提供 DB3-Modbus-映射表1.csv(GBK 编码)原件,
--   「产线状态」枚举原文为:
--       0 = 等待入料   1 = 入料中   2 = 装配中
--       3 = 等待机器人  4 = 下料完成  5 = 等待后站入料
--       100 = 初始化错误状态  101 = 停止状态  102 = 手动控制模式
--   之前 004 把 3 写成了 unloading(下料中),与现场表不符。
--
-- 兼容策略(遵守"只增不改"铁律):
--   - **不删** 'unloading':历史数据(line_status_history / line_current_status
--     里已有 2.8 万行 'unloading')仍然合法,约束里继续保留。
--   - **新增** 'waiting_robot' 作为状态 3 的契约值,采集端开始产出它。
--   - 前端两个文案都能显示:'unloading' → 下料中(旧数据),
--     'waiting_robot' → 等待机器人完成(现场口径)。
--
-- 触发场景:
--   1. 全新部署:按文件名顺序执行 db/init/*.sql(001 → … → 005)
--   2. 已在运行的库:
--      psql -U postgres -d linetwin -f db/init/005_line_state_waiting_robot.sql
--
-- 注意:001/002/003/004 不动,符合"只增不改"
-- =============================================================

-- 1) 放宽 line_status_history.state 的 CHECK 约束
ALTER TABLE line_status_history
-- alter table 产线状态历史相关的数据结构或记录。
-- line_status_history 是保存产线状态历史的数据表
  DROP CONSTRAINT IF EXISTS line_status_history_state_check;
  -- 1) 放宽 line_status_history.state 的 CHECK 约束。

ALTER TABLE line_status_history
-- alter table 产线状态历史相关的数据结构或记录。
-- line_status_history 是保存产线状态历史的数据表
  ADD CONSTRAINT line_status_history_state_check
  CHECK (state IN (
    -- 原 4 态(保留,兼容旧数据与 mock 采集器)
    'running','idle','alarm','offline',
    -- PLC 工序状态(DB[6] 透传)
    'waiting_feed',   --  0 = 等待入料
    'feeding',        --  1 = 入料中
    -- PLC 工序状态(DB[6] 透传)。
    'assembling',     --  2 = 装配中
    'waiting_robot',  --  3 = 等待机器人完成  ★ 新增(现场口径)
    'unloading',      --  3 = 下料中(旧口径,仅历史数据)
    'unload_done',    --  4 = 下料完成
    'waiting_next',   --  5 = 等待后站入料
    'init_error',     -- 100 = 初始化错误状态
    'stopped',        -- 101 = 停止状态
    'manual_mode'     -- 102 = 手动控制模式
  ));

-- 2) 同样的约束也放宽 line_current_status(在线快照表)
ALTER TABLE line_current_status
-- alter table 产线当前状态相关的数据结构或记录。
-- line_current_status 是保存产线当前状态的数据表
  DROP CONSTRAINT IF EXISTS line_current_status_state_check;
  -- 2) 同样的约束也放宽 line_current_status(在线快照表)。

ALTER TABLE line_current_status
-- alter table 产线当前状态相关的数据结构或记录。
-- line_current_status 是保存产线当前状态的数据表
  ADD CONSTRAINT line_current_status_state_check
  CHECK (state IN (
    'running','idle','alarm','offline',
    'waiting_feed','feeding','assembling','waiting_robot','unloading',
    'unload_done','waiting_next','init_error','stopped','manual_mode'
  ));

-- 3) 记录本表使用的 PLC 原始数值对照(供采集端/前端查阅)
COMMENT ON TABLE line_status_history IS
  'line_status.state 允许值见 constraint line_status_history_state_check。'
  'PLC 原始整数对照: 0=waiting_feed 1=feeding 2=assembling 3=waiting_robot '
  '4=unload_done 5=waiting_next 100=init_error 101=stopped 102=manual_mode。'
  '注:unloading 为 3 的旧口径(下料中),只保留给历史数据。'
  'edge 采集器负责 PLC 整数 → 契约字符串的映射(plc_collector.py STATE_MAP)。';
