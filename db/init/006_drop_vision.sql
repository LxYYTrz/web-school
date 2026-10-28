-- 移除已退出当前项目的视觉检测相关数据库对象；这是迁移脚本，阅读它不会执行迁移。
-- SQL 定义结构、约束或迁移；应用运行时的具体查询和写入在 server/，不要把存在一张表当作界面已经提供对应功能。

-- ============================================================================
-- 006_drop_vision.sql
--   迁移：整体移除"视觉传照片"链路（图片元数据表 + 权限 + 设备类型）
-- 所属目录：db/init/（产线数字孪生平台 · 数据层 · 增量迁移）
-- ============================================================================
--
-- 【文件作用】
--   一次**功能下线**：把"机器视觉检测"这整块功能从库里干净摘掉。
--   下线一个功能，数据库里往往留了四种痕迹，本脚本四样一起清：
--     1. 图片的元数据表（vision_images）
--     2. 相关的菜单权限与数据权限，以及它们在角色上的绑定
--     3. 相机 / 视觉工控机这两类设备记录
--     4. 设备类型取值范围里的两个选项（把 devices.type 收紧回 plc|robot）
--   只清前三样、表上留着两个死选项的话，后端做类型校验时还得特判，
--   前端下拉框里也会出现选不上的设备类型。
--
-- 【背景】
--   2026-10-22 需求取消机器视觉功能。
--   ★ 这是需求方主动决定的，不是做不出来。数据库里留着这条迁移脚本，
--     本身就是项目演进过程的一个记录——讲解时可以如实说明。
--
-- 【为什么"只删功能"要留一条脚本】
--   新装库不需要这条脚本（001 里已经没有视觉相关的 DDL 了）。
--   但**存量库**必须靠它才能拉齐到同一个状态。两边保持一致，
--   新装和老装出来的库结构完全一样——做交付、排查问题时能省很多事。
--
-- 【★ 本脚本幂等：靠的是 DO $$ ... $$ 代码块】
--   为什么要写成一堆 DO 代码块，而不是朴素的 DROP / DELETE：
--     · 对着一个全新库执行时，vision_images、permissions 这些表根本不存在，
--       直接 DELETE 会报"表不存在"而中断；
--     · 对着一个跑了很久的库补执行时，这些表可能早就被人手工删过一半。
--   所以这里的做法是：**先判断在不在，再决定做不做**。
--     to_regclass('public.permissions') 返回该表的 regclass，不存在时返回 NULL，
--     判 NULL 就直接 RETURN，整块跳过。
--   ★ DO $$ ... $$ 是**一次性匿名代码块**（PL/pgSQL），当场执行完就丢，
--     不会留在库里。里面的 RETURN 等同于"这段结束，什么也不做"。
--
-- 【★ 不可逆性（执行前务必确认）】
--   DROP TABLE vision_images 是**真的删表**，删掉的数据不会留在任何地方。
--   执行前请确认：
--     · 该库已有备份（pg_dump），或者
--     · 确认图片元数据已无留存价值
--   另注：图片的**二进制**原本存在本地文件系统里，库里只存元数据。
--   所以删表不会删掉磁盘上的照片文件，那些文件需要人工另行清理。
--
-- 【执行方式】
--   全新部署按文件名顺序执行；存量库只执行尚未应用的迁移：
--        psql -U postgres -d linetwin -f db\init\006_drop_vision.sql
--
-- 【幂等性与执行注意事项】
--   · 本脚本**全脚本幂等**：重复执行安全，不会在中途报错断在那里。
--     对着新库跑、对着老库补跑，结果都一样。
--   · ALTER TABLE devices 的那段在 DO 块里，且先查 pg_constraint 确认约束存在
--     才动它——同样是为了"能反复执行"。
--   · 本脚本涉及 DROP TABLE，会拿 ACCESS EXCLUSIVE 锁；
--     在线上的库执行时挑个业务低峰。
--
-- 【注意】001 已同步删除 vision 相关 DDL，本脚本保证存量库与新库结构一致
--
-- 【本文件用到的 SQL 关键字】
--   DROP TABLE        删表（连同里面的数据）
--   IF EXISTS         存在才执行（不存在就跳过，不报错）—— 幂等的关键
--   DO $$ ... $$      一次性匿名 PL/pgSQL 代码块，当场执行完就丢
--   BEGIN / END       代码块边界
--   RETURN            提前结束当前代码块（后面什么都不做）
--   to_regclass(...)  把表名转成 regclass；表不存在时返回 NULL（不报错）
--   DELETE FROM       删除行
--   WHERE             过滤条件
--   IN (...)          枚举白名单
--   SELECT 1          取一个常量值，用在 EXISTS 里做"有没有"的判断
--   EXISTS (...)      判断子查询有没有结果（只关心真假，不取值）
--   conname           约束名；conrelid = 约束所属表的 oid
--   regclass          表的类型化名字，可参与比较
--   ALTER TABLE       改表结构
--   DROP/ADD CONSTRAINT  删/加一条约束
--   CHECK             行级校验，写不进表
-- ============================================================================
--
-- 【契约与来源】
--   移除"视觉传照片"整块功能：图片上传链路 + 视觉检测元数据。
--
-- 【本脚本一次性清掉】
--     1. vision_images 表（图片元数据；图片二进制原本存在本地文件系统）
--     2. menu:vision / data:vision:all 两条权限及其角色绑定
--     3. 相机/视觉工控机两类设备
--     4. 收紧 devices.type 取值范围（plc|robot）
--
-- 【触发场景】
--   1. 全新部署：按文件名顺序执行 db/init/*.sql（001 → … → 006）
--   2. 已在运行的库：
--      psql -U postgres -d linetwin -f db/init/006_drop_vision.sql
--
-- 【注意】
--   001 已同步删除 vision 相关 DDL，本脚本保证存量库与新库结构一致。
--   全脚本幂等：重复执行安全；表不存在时自动跳过，不会中断。

-- ---------------------------------------------------------------------------
-- 1) 视觉图片元数据表
-- ---------------------------------------------------------------------------
-- DROP TABLE = 删表（数据一起没了，不可逆）
-- IF EXISTS = 表不存在就跳过，不报错（幂等的关键）
-- 表名写全（不带 schema）时按 search_path 找，这里就是 public。
DROP TABLE IF EXISTS vision_images;
-- 删除数据库表 vision_images。
-- vision_images 是保存已移除的旧视觉图片记录的数据表

-- ---------------------------------------------------------------------------
-- 2) 视觉相关权限：先解绑角色，再删权限点
-- ---------------------------------------------------------------------------
-- 为什么必须先删 role_permissions 再删 permissions：
--   role_permissions.permission_id 上有外键指向 permissions.id。
--   直接删 permissions 会被外键拒绝（除非级联删），所以顺序不能反。
-- 为什么还要单独判断 role_permissions 在不在：
--   万一有人只删了 permissions 没删关联表，这里就不会因找不到表而中断。
-- DO $$ ... $$ = 一次性匿名 PL/pgSQL 代码块（当场执行完就丢，不留在库里）
-- BEGIN / END = 代码块边界
DO $$
-- 执行下面的匿名 PL/pgSQL 迁移代码块。
-- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
BEGIN
-- BEGIN / END = 代码块边界。
-- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  -- to_regclass('public.permissions') = 把表名转成 regclass；
  --   表不存在时返回 NULL（而不是报错）—— 这是"判断在不在"的标准写法。
  -- IS NULL = 判断是不是空值（NULL 表示"没有"）
  -- RETURN = 提前结束这个代码块，后面什么都不做
  IF to_regclass('public.permissions') IS NULL THEN
  -- 执行 to_regclass 对应的本地处理，使用本行提供的数据。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
    RETURN;
    -- RETURN = 提前结束这个代码块，后面什么都不做。
    -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  END IF;
  -- 结束 SQL 块，供当前处理流程继续使用。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  -- 先解绑：把引用这两条权限的角色绑定清掉
  --   IS NOT NULL = 判断不是空值（表存在）
  --   DELETE FROM = 删除行；WHERE = 过滤条件
  --   IN (SELECT ...) = 用子查询给出的 id 集合做过滤
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
  -- 执行 to_regclass 对应的本地处理，使用本行提供的数据。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
    DELETE FROM role_permissions
    -- delete from 角色与权限关联相关的数据结构或记录。
    -- role_permissions 是保存角色与权限关联的数据表，FROM 指定本次读取的数据来源；role_permissions 是保存角色与权限关联的数据表
      WHERE permission_id IN (
      -- 执行 IN 对应的本地处理，使用本行提供的数据。
      -- WHERE 只处理满足本行或后续条件的记录
        SELECT id FROM permissions WHERE code IN ('menu:vision', 'data:vision:all')
        -- 执行 IN 对应的本地处理，使用本行提供的数据。
        -- permissions 是保存操作权限的数据表，FROM 指定本次读取的数据来源；WHERE 只处理满足本行或后续条件的记录
      );
      -- 结束当前函数、分支或对象配置，返回上一层处理流程。
      -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  END IF;
  -- 结束 SQL 块，供当前处理流程继续使用。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  -- 再删权限点本身：menu:vision（视觉菜单）、data:vision:all（视觉数据权限）
  DELETE FROM permissions WHERE code IN ('menu:vision', 'data:vision:all');
  -- delete from 操作权限相关的数据结构或记录。
  -- permissions 是保存操作权限的数据表，FROM 指定本次读取的数据来源；permissions 是保存操作权限的数据表；WHERE 只处理满足本行或后续条件的记录
END $$;
-- 结束本次匿名数据库迁移代码块。

-- ---------------------------------------------------------------------------
-- 3) 视觉设备 + 4) 收紧 devices.type 约束
-- ---------------------------------------------------------------------------
-- 为什么把这两件事放在同一个 DO 块里：
--   它们都作用在 devices 这一张表上，放一起逻辑完整：
--   先删掉不该存在的设备行，再把"允许哪些设备类型"这个规则收紧。
DO $$
-- 执行下面的匿名 PL/pgSQL 迁移代码块。
-- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
BEGIN
-- 先删掉不该存在的设备行，再把"允许哪些设备类型"这个规则收紧。
-- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  -- devices 表不存在（全新库上 001 建的是干净的表，但保险起见判一下）
  IF to_regclass('public.devices') IS NULL THEN
  -- 执行 to_regclass 对应的本地处理，使用本行提供的数据。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
    RETURN;
    -- devices 表不存在（全新库上 001 建的是干净的表，但保险起见判一下）。
    -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  END IF;
  -- 结束 SQL 块，供当前处理流程继续使用。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
  -- 删掉相机、视觉工控机两类设备记录
  --   DELETE FROM = 删除行；WHERE type IN (...) = 按设备类型过滤
  DELETE FROM devices WHERE type IN ('camera', 'ipc');
  -- delete from 设备目录相关的数据结构或记录。
  -- devices 是保存设备目录的数据表，FROM 指定本次读取的数据来源；devices 是保存设备目录的数据表；WHERE 只处理满足本行或后续条件的记录

  -- 把设备类型取值范围收紧回 plc | robot。
  --   EXISTS (SELECT 1 FROM ...) = 判断有没有符合条件的行（只取真假，不取值）
  --   pg_constraint = PostgreSQL 的系统目录表，所有约束都登记在这里
  --   conname = 约束名；conrelid = 约束所属表的 oid
  --   'devices'::regclass = 把表名字面量转成 regclass，才能和 conrelid 比较
  -- 约束名 devices_type_check 是 PostgreSQL 给内联 CHECK 自动起的名字。
  -- 先查 pg_constraint 确认它还在，避免重复执行时报"约束不存在"。
  IF EXISTS (
  -- 执行 EXISTS 对应的本地处理，使用本行提供的数据。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
    SELECT 1 FROM pg_constraint
    -- 先查 pg_constraint 确认它还在，避免重复执行时报"约束不存在"。
    -- pg_constraint 是保存该类业务数据的数据表，FROM 指定本次读取的数据来源
    WHERE conname = 'devices_type_check' AND conrelid = 'devices'::regclass
    -- 限定处理范围，供当前处理流程继续使用。
    -- WHERE 只处理满足本行或后续条件的记录
  ) THEN
  -- 继续当前 SQL 语句的字段、约束、参数或查询子句，供当前处理流程继续使用。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
    -- ALTER TABLE = 改表结构；DROP CONSTRAINT = 删约束；ADD CONSTRAINT = 加约束
    -- CHECK (type IN ('plc','robot')) = 设备类型只允许这两种
    ALTER TABLE devices DROP CONSTRAINT devices_type_check;
    -- alter table 设备目录相关的数据结构或记录。
    -- devices 是保存设备目录的数据表
    ALTER TABLE devices ADD CONSTRAINT devices_type_check CHECK (type IN ('plc', 'robot'));
    -- alter table 设备目录相关的数据结构或记录。
    -- devices 是保存设备目录的数据表
  END IF;
  -- 结束 SQL 块，供当前处理流程继续使用。
  -- 这一行继续约束当前数据库对象或语句的字段、条件与处理方式
END $$;
-- 结束本次匿名数据库迁移代码块。
