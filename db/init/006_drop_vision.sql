-- =============================================================
-- 006_drop_vision.sql
-- 移除"视觉传照片"整块功能:图片上传链路 + 视觉检测元数据
--
-- 背景:
--   2026-10-22 需求取消机器视觉功能。本迁移一次性清掉:
--     1. vision_images 表(图片元数据;图片二进制原本存在本地文件系统)
--     2. menu:vision / data:vision:all 两条权限及其角色绑定
--     3. 相机/视觉工控机两类设备
--     4. 收紧 devices.type 取值范围(plc|robot)
--
-- 触发场景:
--   1. 全新部署:按文件名顺序执行 db/init/*.sql(001 → … → 006)
--   2. 已在运行的库:
--      psql -U postgres -d linetwin -f db/init/006_drop_vision.sql
--
-- 注意:001 已同步删除 vision 相关 DDL,本脚本保证存量库与新库结构一致。
-- 全脚本幂等:重复执行安全;表不存在时自动跳过,不会中断。
-- =============================================================

-- 1) 视觉图片元数据表
DROP TABLE IF EXISTS vision_images;

-- 2) 视觉相关权限
DO $$
BEGIN
  IF to_regclass('public.permissions') IS NULL THEN
    RETURN;
  END IF;
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
    DELETE FROM role_permissions
      WHERE permission_id IN (
        SELECT id FROM permissions WHERE code IN ('menu:vision', 'data:vision:all')
      );
  END IF;
  DELETE FROM permissions WHERE code IN ('menu:vision', 'data:vision:all');
END $$;

-- 3) 视觉设备 + 4) 收紧 devices.type 约束
DO $$
BEGIN
  IF to_regclass('public.devices') IS NULL THEN
    RETURN;
  END IF;
  DELETE FROM devices WHERE type IN ('camera', 'ipc');

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'devices_type_check' AND conrelid = 'devices'::regclass
  ) THEN
    ALTER TABLE devices DROP CONSTRAINT devices_type_check;
    ALTER TABLE devices ADD CONSTRAINT devices_type_check CHECK (type IN ('plc', 'robot'));
  END IF;
END $$;
