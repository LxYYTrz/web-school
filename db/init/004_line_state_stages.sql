-- =============================================================
-- 004_line_state_stages.sql
-- 契约 v1.1 扩展:line_status.state 从 4 态扩为 10 态(工序状态)
-- 依据:DB3-Modbus-映射表.xls「产线状态」枚举
--
-- 背景:
--   原契约 state 为 4 态 running/idle/alarm/offline。现场 PLC 实际工序
--   状态更细,DB[9](state) 上送的是以下 10 个值,若沿用 4 态 CHECK 会
--   导致写入失败(CHECK 违规)。
--
-- 新枚举(PLC 端原值 → 中文):
--      0 = 等待入料        1 = 入料中          2 = 装配中
--      3 = 下料中          4 = 下料完成        5 = 等待后站入料
--    100 = 初始化错误状态 101 = 停止状态      102 = 手动控制模式
--
-- 兼容策略:
--   - 只增不改(契约铁律),保留原 4 态值,新枚举与之并存
--   - 前端 StatusView.vue 增加 10 态中文映射,未知值回退显示原值
--   - plc_collector.py 直接透传 PLC 整数,不做映射
--
-- 触发场景:
--   1. 全新部署:按文件名顺序执行 db/init/*.sql(001 → … → 004)
--   2. 已在运行的库:
--      psql -U postgres -d linetwin -f db/init/004_line_state_stages.sql
--
-- 注意:001/002/003 不动,符合"只增不改"
-- =============================================================

-- 1) 放宽 line_status_history.state 的 CHECK 约束
ALTER TABLE line_status_history
  DROP CONSTRAINT IF EXISTS line_status_history_state_check;

ALTER TABLE line_status_history
  ADD CONSTRAINT line_status_history_state_check
  CHECK (state IN (
    -- 原 4 态(保留,兼容旧数据与 mock 采集器)
    'running','idle','alarm','offline',
    -- 新增 10 态(PLC 工序状态;DB[9] 透传)
    'waiting_feed',   --  0 = 等待入料
    'feeding',        --  1 = 入料中
    'assembling',     --  2 = 装配中
    'unloading',      --  3 = 下料中
    'unload_done',    --  4 = 下料完成
    'waiting_next',   --  5 = 等待后站入料
    'init_error',     -- 100 = 初始化错误状态
    'stopped',        -- 101 = 停止状态
    'manual_mode'     -- 102 = 手动控制模式
  ));

-- 2) 同样的约束也放宽 line_current_status(在线快照表)
ALTER TABLE line_current_status
  DROP CONSTRAINT IF EXISTS line_current_status_state_check;

ALTER TABLE line_current_status
  ADD CONSTRAINT line_current_status_state_check
  CHECK (state IN (
    'running','idle','alarm','offline',
    'waiting_feed','feeding','assembling','unloading','unload_done',
    'waiting_next','init_error','stopped','manual_mode'
  ));

-- 3) 记录本表使用的 PLC 原始数值对照(供采集端/前端查阅)
COMMENT ON TABLE line_status_history IS
  'line_status.state 允许值见 constraint line_status_history_state_check。'
  'PLC 原始整数对照: 0=waiting_feed 1=feeding 2=assembling 3=unloading '
  '4=unload_done 5=waiting_next 100=init_error 101=stopped 102=manual_mode。'
  'edge 采集器负责 PLC 整数 → 契约字符串的映射(plc_collector.py STATE_MAP)。';
