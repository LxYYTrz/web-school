-- ============================================================================
-- 文件作用：移除"视觉检测域"（图片链路）的一次性迁移脚本
-- 所属模块：db/init/
-- ============================================================================
--
-- 【背景】
--   早期需求包含"机器视觉拍照上传"。后来需求取消（见技术设计文档 v1.1 变更记录），
--   相关的表 / 权限 / 设备类型都要清掉。
--
-- 【什么时候会执行】
--   ① 新环境：initdb 会按文件名顺序执行 001 → 002。此时 002 是**幂等空操作**
--      （因为 001 里根本没有视觉相关的表/权限/设备，脚本执行了也不影响任何东西）。
--   ② 存量环境（库里已经有数据）：手动执行本文件一次：
--        psql -h <host> -p <port> -U postgres -d linetwin -f 002_drop_vision.sql
--
-- 【幂等性保证】
--   本脚本**全脚本幂等**：重复执行安全；表不存在时自动跳过，不会中断。
--   手法：先判断表/约束是否存在（to_regclass / pg_constraint），再决定做不做。
--
-- 【做的是什么】
--   1) 删表：vision_images（图片元数据表，图片二进制原存在 MinIO，已随 compose 移除）
--   2) 删权限：menu:vision、data:vision:all
--   3) 删设备：type 为 camera / ipc 的设备
--   4) 收紧约束：devices.type 只允许 'plc' / 'robot'
-- ============================================================================

-- =============================================================
-- 002:移除视觉检测域(图片链路)
-- -------------------------------------------------------------
-- 用途:把"视觉传照片"相关的表 / 权限 / 设备一次性清掉。
-- 新环境:initdb 按文件名顺序执行 001 → 002,此时 002 是幂等空操作。
-- 存量环境(库里已有数据):手动执行本文件一次:
--   psql -h <host> -p <port> -U postgres -d linetwin -f 002_drop_vision.sql
--
-- 全脚本幂等:重复执行安全;表不存在时自动跳过,不会中断。
-- =============================================================

-- 1) 视觉图片元数据表(图片二进制原存在 MinIO,已随 compose 移除)
--    IF EXISTS 语义：表不存在也不报错
DROP TABLE IF EXISTS vision_images;

-- 2) 视觉相关权限(menu:vision / data:vision:all)
--    用 DO $$ ... $$ 匿名代码块：里面可以写 IF/RETURN 等流程控制
DO $$
BEGIN
  -- 表不存在就直接返回（不做任何操作）
  IF to_regclass('public.permissions') IS NULL THEN
    RETURN;
  END IF;

  -- 先删关联关系（role_permissions 里有外键指向 permissions，必须先删关联）
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
    DELETE FROM role_permissions
      WHERE permission_id IN (
        SELECT id FROM permissions WHERE code IN ('menu:vision', 'data:vision:all')
      );
  END IF;

  -- 再删权限点本身
  DELETE FROM permissions WHERE code IN ('menu:vision', 'data:vision:all');
END $$;

-- 3) 视觉设备(相机 / 视觉工控机)
DO $$
BEGIN
  -- devices 表不存在就跳过
  IF to_regclass('public.devices') IS NULL THEN
    RETURN;
  END IF;

  -- 删除相机类设备
  DELETE FROM devices WHERE type IN ('camera', 'ipc');

  -- 4) 收紧 devices.type 取值范围(先删数据再改约束,否则会被旧行卡住)
  --    ★ 顺序很重要：CHECK 约束是立即校验的，如果还有 type='camera' 的行，
  --      直接加新约束会报错。所以必须先 DELETE 再 ALTER。
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'devices_type_check' AND conrelid = 'devices'::regclass
  ) THEN
    -- 删掉旧约束
    ALTER TABLE devices DROP CONSTRAINT devices_type_check;
    -- 加新约束：只允许 plc 和 robot
    ALTER TABLE devices ADD CONSTRAINT devices_type_check CHECK (type IN ('plc', 'robot'));
  END IF;
END $$;
