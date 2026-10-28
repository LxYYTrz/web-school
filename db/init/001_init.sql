-- 数据库基础初始化：建立产线、设备、历史、事件、控制与审计等结构，按表和约束分段阅读。
-- SQL 定义结构、约束或迁移；应用运行时的具体查询和写入在 server/，不要把存在一张表当作界面已经提供对应功能。

-- ============================================================================
-- 001_init.sql —— 主 DDL：把整个数据库从零建出来
-- 所属目录：db/init/（产线数字孪生平台 · 数据层）
-- ============================================================================
--
-- 【文件作用】
--   整个库的"总纲"。一个文件把库建出来：装扩展 → 建 14 张表 → 建索引 →
--   灌种子数据（4 个角色 / 6 个权限点 / 4 张角色权限矩阵 / 1 个初始管理员 /
--   1 条示例产线 / 2 台示例设备）。
--   后面 002~006 都是**在这个文件之上**叠的增量脚本，不改这里的任何一行。
--
-- 【在数据流中的位置】
--   现场设备 ─▶ MQTT ─▶ server 后端 ─▶ TimescaleDB
--                                  ▲
--                        本文件建的就是这个"账本"
--   本库回答四类问题：谁在用、能看什么（权限）；管着哪几条产线、哪些设备（主数据）；
--   发生过什么（时序流水）；谁动过什么（指令与审计）。
--
-- 【谁执行 / 什么时候执行】
--   1. 全新部署：在工控机本地 PostgreSQL 空库中手工执行，随后按文件名顺序执行迁移。
--        psql -U postgres -d linetwin -f db\init\001_init.sql
--   2. 存量库补结构：**不要重跑本文件**，改走 002~006 里的对应脚本。
--
-- 【幂等性】
--   本脚本**不幂等**（建表语句没有 IF NOT EXISTS），只允许对空库执行一次；
--   重复执行会因"关系已存在"报错中断。需要变更结构请新开迁移脚本。
--
-- 【依赖与版本】
--   PostgreSQL 16 + TimescaleDB 2.x。
--   CREATE EXTENSION 需要建库权限（属主或超级用户）。
--
-- 【14 张表速览】按职责分四组，完整说明见 db/README.md
--   ① 权限与组织(6)：users / roles / permissions / user_roles
--                    / role_permissions / user_line_scope
--   ② 产线与设备(2)：production_lines / devices
--   ③ 时序流水(3) ：robot_joint_states / line_status_history / production_events
--   ④ 业务与审计(3)：line_current_status / control_commands / audit_logs
--   ★ 第 15 张 app.app_users 在 002_app_users.sql 里，放独立 schema（app）。
--
-- 【贯穿全库的三条铁律】后面每个建表语句都在为这三条服务
--   ① code ↔ id 分离：对外用可读的 code，对内用自增 id。
--      production_lines.code ≡ MQTT 主题里的 {lineId}
--      devices.code       ≡ MQTT 主题里的 {deviceId} ≡ 报文里的 deviceId
--      翻译由 server/src/infra/catalog.service.ts 完成（内存 Map，60 秒刷新）。
--   ② 只增不改：已发布的结构永不修改，要改就新开一条迁移脚本往上叠。
--   ③ 规则下沉：业务规则在数据库层也留一道 CHECK 约束，
--      代码里万一漏了校验，脏数据也进不来库。
--
-- 【本文件里出现的 SQL 关键字速查】
--   CREATE EXTENSION  装插件（TimescaleDB / pgcrypto）
--   CREATE TABLE      建表
--   BIGSERIAL         BIGINT + 自增序列 + 默认取 nextval（插入时不用管主键）
--   TEXT              变长字符串
--   TIMESTAMPTZ       带时区的时间戳（跨时区部署不会算错）
--   DOUBLE PRECISION  双精度浮点（8 字节，存关节角够用）
--   REAL              单精度浮点（4 字节，存百分比够用）
--   INTEGER           32 位整数
--   SMALLINT          16 位整数
--   UUID              128 位唯一标识
--   JSONB             二进制 JSON（可建索引、不保留键顺序、重复键只留最后一个）
--   INET              PostgreSQL 的 IP 地址类型（写不进非法 IP）
--   NOT NULL          不允许为 NULL
--   UNIQUE            全表唯一（自动建唯一索引）
--   DEFAULT           插入时若不指定就取这个值
--   CHECK             行级校验，写不进表
--   REFERENCES        外键，指向另一张表的主键/唯一键
--   ON DELETE CASCADE 删被引用行时，自动把引用它的行一起删掉
--   SELECT            查询；本文件里只用于"批量生成"和"调函数"
--   INSERT            插入行
--   CROSS JOIN        笛卡尔积（a×b 行），本文件用它一次性生成权限矩阵
--   VALUES            构造一张临时的行集合
--   ALTER TABLE       修改表结构
--   COMMENT ON        给表/列写数据库注释（psql \d+ 能看到）
-- ============================================================================
--
-- 部署位置：
--   主库在**工控机本地**（Windows 原生安装的 PostgreSQL 16 + TimescaleDB），
--   执行方式：按文件名顺序把 db/init/*.sql 全部跑一遍：
--     psql -U postgres -d linetwin -f db\init\001_init.sql

-- ---------------------------------------------------------------------------
-- 0. 扩展：先给数据库装两个"能力"
-- ---------------------------------------------------------------------------
-- CREATE EXTENSION = 装插件。IF NOT EXISTS = 已装过就跳过，不报错。
-- 机器人遥测 10Hz，一天一台就是 86.4 万行；不自动分区，时间一长查历史会拖垮库。
CREATE EXTENSION IF NOT EXISTS timescaledb;
-- 创建数据库扩展 timescaledb。
-- 口令只存散列、绝不存明文：种子账号用 crypt('明文', gen_salt('bf')) 生成（见文件末尾）。
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- 用于种子账号的口令散列
-- 创建数据库扩展 pgcrypto。

-- ===========================================================================
-- ① 权限与组织（6 张）
--    这一组回答"谁在用这个系统、能看什么、能干什么"。
--    走的是标准 RBAC 五件套：用户 / 角色 / 权限点 + 两张关联表，
--    再加一张"数据权限"表管住"能看到哪条产线"。
-- ===========================================================================

-- 用户表：系统的账号总表（组织与权限模型的这一侧）。
--   ★ password_hash 存 bcrypt 散列，**绝不存明文**。
--     种子账号用 pgcrypto 的 crypt('明文', gen_salt('bf')) 生成（见文件末尾）。
--   【谁写】用户管理页建号时写入（server/src/users/）；本文件末尾灌一个 admin。
--   【谁读】control_commands.user_id / audit_logs.user_id 都外键指向它，
--          用来回答"这条指令/这次操作是谁干的"。
--   ★ 注意：系统里其实有**两张用户表**。本表（public.users）配着完整的角色与
--     权限矩阵；真正用于登录校验的是 002 里 app schema 的 app.app_users
--     （当前登录链路实际在用的那张）。两者靠**用户名**对齐：
--     command.service.ts 的 resolveUserId() 用 session 里的用户名查本表取 id。
--     这是项目从原始版本演进过来的痕迹，不是设计缺陷。
-- 这一段建立早期用户数据表，声明它保存的字段和约束。
CREATE TABLE users (
-- create table 早期用户数据相关的数据结构或记录。
-- users 是保存早期用户数据的数据表
  id            BIGSERIAL PRIMARY KEY,
  -- 定义数据库字段 id 的类型、默认值或约束。
                 -- BIGSERIAL = BIGINT + 自增序列 + 默认 nextval → 插入时不用管主键
                 -- PRIMARY KEY = 主键：唯一 + 非空 + 自动建索引
  username      TEXT NOT NULL UNIQUE,
  -- 定义字段 username 的类型及约束。
  -- username 是账号用户名；TEXT 指定此列的数据类型
                 -- TEXT = 变长字符串（PostgreSQL 的 TEXT 不限长度）
                 -- NOT NULL = 不允许 NULL
                 -- UNIQUE = 全表唯一，自动建唯一索引（登录按名字查就靠它）
  password_hash TEXT NOT NULL,
  -- 定义字段 password_hash 的类型及约束。
  -- password_hash 是当前记录中的业务字段；TEXT 指定此列的数据类型
                 -- TEXT = 口令散列串（bcrypt 固定 60 字符）
                 -- NOT NULL = 必填：没有散列就没法校验口令
  display_name  TEXT,
  -- 定义字段 display_name 的类型及约束。
  -- display_name 是当前记录中的业务字段；TEXT 指定此列的数据类型
                 -- TEXT = 显示名（页面上给人看的名字）
                 -- 可空 = 允许不填
  phone         TEXT,
  -- 定义字段 phone 的类型及约束。
  -- phone 是当前记录中的业务字段；TEXT 指定此列的数据类型
                 -- TEXT = 联系电话；可空
  status        TEXT NOT NULL DEFAULT 'active'
  -- 定义字段 status 的类型及约束。
  -- status 是当前连接、产线、请求或指令的状态字段；TEXT 指定此列的数据类型
                 CHECK (status IN ('active','disabled')),
                 -- TEXT = 账号状态
                 -- DEFAULT 'active' = 插入时不指定就取 active
                 -- CHECK (status IN (...)) = 行级校验，只允许这两个值
                 --   （停用而不是删人，历史审计才不会断）
  last_login_at TIMESTAMPTZ,
  -- 定义字段 last_login_at 的类型及约束。
  -- last_login_at 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
                 -- TIMESTAMPTZ = 带时区的时间戳（跨时区部署不会算错）
                 -- 可空 = 从没登录过就是 NULL
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  -- 定义字段 created_at 的类型及约束。
  -- created_at 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
                 -- DEFAULT now() = 插入时自动取数据库当前时间
                 --   （取库的时间，不依赖应用服务器时钟）
);
-- 这一段完成users表的定义，后续查询和写入依赖这些字段与约束。

-- 角色表：角色的字典。角色是"岗位"，权限点是"能力"，两者解耦。
--   四个内置角色：管理员 / 产线操作员 / 客户 / 数据分析员。
--   新增岗位只需往这里加一行 + 往 role_permissions 灌一次矩阵，不用改代码。
-- 这一段建立操作角色表，声明它保存的字段和约束。
CREATE TABLE roles (
-- create table 操作角色相关的数据结构或记录。
-- roles 是保存操作角色的数据表
  id   BIGSERIAL PRIMARY KEY,
  -- 定义数据库字段 id 的类型、默认值或约束。
       -- BIGSERIAL = 自增大整数（插入时自动赋值）
       -- PRIMARY KEY = 主键
  code TEXT NOT NULL UNIQUE,
  -- 定义字段 code 的类型及约束。
  -- code 是业务编码、状态码或数据库查询字段，结合所在报文解释；TEXT 指定此列的数据类型
       -- TEXT = 角色编码
       -- UNIQUE = 全表唯一：同一个角色编码只能有一条
  name TEXT NOT NULL
  -- 定义字段 name 的类型及约束。
  -- name 是当前对象的名称字段；TEXT 指定此列的数据类型
       -- TEXT = 中文名（页面上给人看的）
);
-- 这一段完成roles表的定义，后续查询和写入依赖这些字段与约束。

-- 权限点表：能力的字典。type 决定这条权限作用在哪一层（RBAC 三级控制的基础）：
--   menu = 菜单权限（前端按它渲染菜单，决定"看得见哪些页面"）
--   api  = 接口权限（后端按它校验请求，决定"调得动哪些接口"）
--   data = 数据权限（后端按它决定返回哪些字段、哪些产线的数据）
--   ★ 分成三层是因为三层的拦截点不同：菜单在前端、接口在后端、数据在查询时。
--     只做一层的话，绕过前端直接调接口就能越权。
-- 这一段建立操作权限表，声明它保存的字段和约束。
CREATE TABLE permissions (
-- 创建数据库表 permissions。
-- permissions 是保存操作权限的数据表
  id   BIGSERIAL PRIMARY KEY,
  -- 定义数据库字段 id 的类型、默认值或约束。
       -- BIGSERIAL = 自增大整数
  code TEXT NOT NULL UNIQUE,
  -- 定义字段 code 的类型及约束。
  -- code 是业务编码、状态码或数据库查询字段，结合所在报文解释；TEXT 指定此列的数据类型
       -- TEXT = 权限编码，命名约定 "类型:名字"（如 menu:twin）
       -- UNIQUE = 全表唯一，代码里按 code 查
  type TEXT NOT NULL CHECK (type IN ('menu','api','data')),
  -- 定义字段 type 的类型及约束。
  -- type 是当前报文、指令或对象的类别字段；TEXT 指定此列的数据类型
       -- TEXT = 权限作用层级
       -- CHECK = 只允许 menu/api/data 三种，防止写进第四种层级
  name TEXT NOT NULL
  -- 定义字段 name 的类型及约束。
  -- name 是当前对象的名称字段；TEXT 指定此列的数据类型
       -- TEXT = 中文名（页面上给人看的）
);
-- 这一段完成permissions表的定义，后续查询和写入依赖这些字段与约束。

-- 用户↔角色 关联表（多对多）：一个人可以同时是"操作员"和"数据分析员"。
-- 这一段建立用户与角色关联表，声明它保存的字段和约束。
CREATE TABLE user_roles (
-- 创建数据库表 user_roles。
-- user_roles 是保存用户与角色关联的数据表
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- 定义字段 user_id 的类型及约束。
  -- users 是保存早期用户数据的数据表；user_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
       -- BIGINT = 64 位大整数（存 users.id）
       -- NOT NULL = 关联表不允许半条关系（少一头就没意义）
       -- REFERENCES users(id) = 外键，必须是 users 里真实存在的 id
       -- ON DELETE CASCADE = 删 user 时自动删掉这行
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  -- 定义字段 role_id 的类型及约束。
  -- roles 是保存操作角色的数据表；role_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
       -- 同上，外键指向 roles.id
  PRIMARY KEY (user_id, role_id)
       -- 复合主键 = 同一个人同一个角色只能绑一次（重复绑定会报错）
);
-- 这一段完成user_roles表的定义，后续查询和写入依赖这些字段与约束。

-- 角色↔权限 关联表（多对多）：一个角色能拿哪些权限。
--   种子数据里那四张"角色权限矩阵"就是往这张表灌的。
-- 这一段建立角色与权限关联表，声明它保存的字段和约束。
CREATE TABLE role_permissions (
-- 创建数据库表 role_permissions。
-- role_permissions 是保存角色与权限关联的数据表
  role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  -- 定义字段 role_id 的类型及约束。
  -- roles 是保存操作角色的数据表；role_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
       -- BIGINT + NOT NULL + REFERENCES roles(id) ON DELETE CASCADE = 同上
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  -- 定义字段 permission_id 的类型及约束。
  -- permissions 是保存操作权限的数据表；permission_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
       -- BIGINT + NOT NULL + REFERENCES permissions(id) ON DELETE CASCADE = 同上
  PRIMARY KEY (role_id, permission_id)
       -- 复合主键 = 同一个角色同一条权限只灌一次（灌重复会报错）
);
-- 这一段完成role_permissions表的定义，后续查询和写入依赖这些字段与约束。

-- ===========================================================================
-- ② 产线与设备（2 张）—— 所有数据的"坐标原点"
--    后面每一笔记录都要挂到某条产线、某台设备上，所以这两张表是全库的地基。
-- ===========================================================================

-- 产线表：一共管着几条产线。
--   ★ code 必须与 MQTT 主题中的 {lineId} 一致（这是 MQTT→数据库的关键锚点）。
--     采集端发的 topic 是 tl/v1/{lineId}/...，后端靠 code 找到这里的 id。
--     现场换产线编号时，只要把两边的 code 对齐即可，不用动数据库主键。
-- 这一段建立产线目录表，声明它保存的字段和约束。

-- production_lines 保存产线整体的基础身份，id 是内部主键，code 是消息与接口使用的业务编码。
-- 设备通过 devices.line_id 关联该产线，历史和控制记录再关联相应对象；产线档案与设备档案不是重复保存同一个对象。
-- CatalogService 读取 code 与 id 的对应关系，所以现场编码需要和数据库档案对齐，内部编号不能由名称猜测。

CREATE TABLE production_lines (
-- 创建数据库表 production_lines。
-- production_lines 是保存产线目录的数据表
  id       BIGSERIAL PRIMARY KEY,
  -- 定义数据库字段 id 的类型、默认值或约束。
           -- BIGSERIAL = 自增大整数（插入时自动赋值）
           -- PRIMARY KEY = 主键：唯一 + 非空
  code     TEXT NOT NULL UNIQUE,
  -- 定义字段 code 的类型及约束。
  -- code 是业务编码、状态码或数据库查询字段，结合所在报文解释；TEXT 指定此列的数据类型
           -- TEXT = 产线编码
           -- NOT NULL = 必填：没有 code 就对不上消息主题
           -- UNIQUE = 全表唯一：一条产线只能有一个编码
  name     TEXT NOT NULL,
  -- 定义字段 name 的类型及约束。
  -- name 是当前对象的名称字段；TEXT 指定此列的数据类型
           -- TEXT = 产线名（页面上显示）
  location TEXT,
  -- 定义字段 location 的类型及约束。
  -- location 是当前记录中的业务字段；TEXT 指定此列的数据类型
           -- TEXT = 车间/位置；可空
  status   TEXT NOT NULL DEFAULT 'idle'
  -- 定义字段 status 的类型及约束。
  -- status 是当前连接、产线、请求或指令的状态字段；TEXT 指定此列的数据类型
           CHECK (status IN ('running','idle','alarm','offline'))
           -- DEFAULT 'idle' = 新建产线默认空闲
           -- CHECK = 只允许这 4 个值。原 4 态；
           --   现场的 10 种工序状态由 004_line_state_stages.sql
           --   以"只增不改"的方式追加（详见那份脚本）
);
-- 这一段完成production_lines表的定义，后续查询和写入依赖这些字段与约束。

-- 数据权限表：用户可见哪些产线。
--   ★ 这张表是"客户角色只能看自己名下产线"的技术实现：
--     后端查询时 JOIN 这张表做过滤，**而不是相信前端传参**。
--   【为什么必须落在后端】前端的过滤只是"界面不显示"，改个 URL 或直接调接口
--     就能看到别人的数据；只有查询语句里带上这张表的约束才是真隔离。
--   【边界】当前代码里这张表**还没接上**（见 server/src/command/command.service.ts
--     WebSocket 订阅的产线范围校验仍需单独处理（见 realtime/telemetry.gateway.ts）。
--     表先建好，权限模型先落地，接口随后接。
-- 这一段建立user_line_scope表，声明它保存的字段和约束。
CREATE TABLE user_line_scope (
-- 创建数据库表 user_line_scope。
-- user_line_scope 是保存该类业务数据的数据表
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- 定义字段 user_id 的类型及约束。
  -- users 是保存早期用户数据的数据表；user_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
       -- BIGINT + NOT NULL + REFERENCES users(id) ON DELETE CASCADE = 同上
  line_id BIGINT NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  -- 定义字段 line_id 的类型及约束。
  -- production_lines 是保存产线目录的数据表；line_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
       -- BIGINT + NOT NULL + REFERENCES production_lines(id) ON DELETE CASCADE = 同上
  PRIMARY KEY (user_id, line_id)
       -- 复合主键 = 同一个用户同一条产线只授权一次
);
-- 这一段完成user_line_scope表的定义，后续查询和写入依赖这些字段与约束。

-- 设备表：这条产线上挂了哪些设备。
--   ★ code 必须与 MQTT 报文里的 deviceId、以及主题里的 {deviceId} 三者一致。
--   增加设备档案只建立数据库身份；现场点表、报文编码与网页选择还需相应配置。
--   不能仅凭数据库中增加一行，就认定当前网页支持任意多设备切换。
--   【现场设备编号很脏很乱】正是靠"code 隔离在数据层"这一招，
--     把现场编号问题挡在了系统之外（翻译见 catalog.service.ts）。
-- 这一段建立设备目录表，声明它保存的字段和约束。

-- devices 保存具体设备的档案，line_id 外键指向它所属的 production_lines.id。
-- 同一条产线可以关联不同设备，机器人历史的 device_id 再引用这里的设备 id，形成归属关系。
-- 增加档案只建立数据库身份；采集点表、消息编码与网页选择还需相应配置，当前网页共享实现并不自动支持任意设备切换。

CREATE TABLE devices (
-- 创建数据库表 devices。
-- devices 是保存设备目录的数据表
  id       BIGSERIAL PRIMARY KEY,
  -- 定义数据库字段 id 的类型、默认值或约束。
           -- BIGSERIAL = 自增大整数
  line_id  BIGINT NOT NULL REFERENCES production_lines(id),
  -- 定义字段 line_id 的类型及约束。
  -- production_lines 是保存产线目录的数据表；line_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
           -- BIGINT = 存 production_lines.id
           -- NOT NULL = 设备必须挂在某条产线下（没有"孤儿设备"）
           -- REFERENCES = 外键，产线不存在就插不进设备
           -- ★ 这里没有 ON DELETE CASCADE：删产线要人工确认，不自动连带删设备
  type     TEXT NOT NULL CHECK (type IN ('plc','robot')),
  -- 定义字段 type 的类型及约束。
  -- type 是当前报文、指令或对象的类别字段；TEXT 指定此列的数据类型
           -- TEXT = 设备类型
           -- CHECK = 只允许 plc（主控 PLC）/ robot（机器人）
           --   相机、视觉工控机这类设备在 006 里被移除了
  code     TEXT NOT NULL UNIQUE,
  -- 定义字段 code 的类型及约束。
  -- code 是业务编码、状态码或数据库查询字段，结合所在报文解释；TEXT 指定此列的数据类型
           -- TEXT = 设备编码
           -- UNIQUE = 全表唯一：MQTT 主题里的 {deviceId} 靠它唯一定位
  name     TEXT NOT NULL,
  -- 定义字段 name 的类型及约束。
  -- name 是当前对象的名称字段；TEXT 指定此列的数据类型
           -- TEXT = 设备名（页面上显示）
  protocol TEXT,
  -- 定义字段 protocol 的类型及约束。
  -- protocol 是当前记录中的业务字段；TEXT 指定此列的数据类型
           -- TEXT = 工业协议：modbus_tcp / opc_ua / s7 / mc / http ...
           -- 可空 = 协议待定的设备也允许先登记
  config   JSONB NOT NULL DEFAULT '{}',
  -- 定义字段 config 的类型及约束。
  -- config 是当前记录中的业务字段；JSONB 指定此列的数据类型
           -- JSONB = 二进制 JSON（可建索引、不保留键顺序）
           -- NOT NULL = 必填（用空对象占位，而不是 NULL）
           -- DEFAULT '{}' = 不填就给一个空对象，避免下游判空
           -- 内容：连接参数(ip/端口/单元号等)，敏感凭据不要明文放这里
  status   TEXT NOT NULL DEFAULT 'unknown'
  -- 定义字段 status 的类型及约束。
  -- status 是当前连接、产线、请求或指令的状态字段；TEXT 指定此列的数据类型
           -- TEXT = 设备状态
           -- DEFAULT 'unknown' = 默认"未知"而不是"正常"——
           --   刚登记还没上报数据时，不该假装它是在线的
);
-- 这一段完成devices表的定义，后续查询和写入依赖这些字段与约束。

-- ===========================================================================
-- ③ 时序流水（3 张，TimescaleDB hypertable）
--    这一组回答"发生过什么"。三张表的共同点：只往里写、不回头改，
--    数据量随时间线性增长，所以必须按时间自动分区。
-- ===========================================================================

-- 机器人六轴遥测（5~10Hz）：整个系统写入量最大的表。
--   实际行数取决于采集与成功写入频率，不能把示例频率当成现场实测。
--   【谁写】server/src/history/history-writer.service.ts —— 内存缓冲攒 1 秒，
--          拼成一条多行 INSERT 批量落库，减少逐帧数据库调用；性能提升需要实际测量。
--   当前首屏与实时姿态通过 Redis 快照和 Socket.IO 提供，历史表不等于页面已实现轨迹回放。
-- 这一段建立robot_joint_states表，声明它保存的字段和约束。

-- robot_joint_states 保存带采集时间与设备内部编号的关节历史，不覆盖成每台设备只剩最后一帧。
-- HistoryWriter 先把多帧放入内存，再批量 INSERT；device_id 指向 devices，设备再关联所属产线。
-- 首屏实时姿态主要经 Redis 快照与 Socket.IO 取得，存在这张历史表不表示当前页面已经实现轨迹回放。

CREATE TABLE robot_joint_states (
-- 创建数据库表 robot_joint_states。
-- robot_joint_states 是保存该类业务数据的数据表
  "time"     TIMESTAMPTZ NOT NULL,
  -- 记录这一帧对应的时间，批量入库时仍保留各帧自己的时间值。
  -- time 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
             -- "time" 加双引号 = 保留字，转义成普通列名（TimescaleDB 时序表惯例）
             -- TIMESTAMPTZ = 带时区时间戳；这列同时是分区键
             -- NOT NULL = 时序表的时间列不能为空（否则没法分区）
  device_id  BIGINT NOT NULL REFERENCES devices(id),
  -- 定义字段 device_id 的类型及约束。
  -- devices 是保存设备目录的数据表；device_id 是pymodbus 当前接口的目标设备站号参数；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
             -- BIGINT = 存 devices.id
             -- NOT NULL = 每帧必须归属某台设备
             -- REFERENCES = 外键，设备不存在就写不进这一帧
             -- ★ 注意：报文里传的是 code（robot-01），由 catalog.service.ts
             --   翻译成 id 后才写进这里
  joints     DOUBLE PRECISION[] NOT NULL,
  -- 定义字段 joints 的类型及约束。
             -- DOUBLE PRECISION = 双精度浮点（8 字节）
             -- [] = 数组类型，存 [j1..j6]
             -- NOT NULL = 六轴角度必填（缺一轴画不出机械臂）
             -- 内容：单位 deg
  tcp_pose   DOUBLE PRECISION[],
  -- 定义字段 tcp_pose 的类型及约束。
             -- DOUBLE PRECISION[] = 6 个浮点的数组
             -- 可空 = 采集端不一定有位姿数据
             -- 内容：[x,y,z,rx,ry,rz]
  speed_pct  REAL,
  -- 定义字段 speed_pct 的类型及约束。
             -- REAL = 单精度浮点（4 字节，存百分比绰绰有余）
             -- 可空 = 采集端没报速度时为 NULL
  mode       TEXT,
  -- 定义字段 mode 的类型及约束。
  -- mode 是机器人或设备运行模式；TEXT 指定此列的数据类型
             -- TEXT = 机器人当前模式（自动/手动等）
             -- 可空
  program    TEXT,
  -- 定义字段 program 的类型及约束。
  -- program 是机器人当前程序名称；TEXT 指定此列的数据类型
             -- TEXT = 当前运行的程序号
             -- 可空
  alarm_code INTEGER NOT NULL DEFAULT 0
  -- 定义字段 alarm_code 的类型及约束。
  -- alarm_code 是当前记录中的业务字段；INTEGER 指定此列的数据类型
             -- INTEGER = 32 位整数
             -- DEFAULT 0 = 没报警也写 0
             -- ★ NOT NULL DEFAULT 0 的意义：没有报警也必须显式写 0，
             --   否则"没报警"和"没采到"就分不清了
);
-- 这一段完成robot_joint_states表的定义，后续查询和写入依赖这些字段与约束。
-- 转成 hypertable：按 "time" 列自动分区。
--   不做自动分区的话，几年之后查任何一段历史都要全表扫。
--   create_hypertable(表名, 分区键列名) = TimescaleDB 的建时序表函数
SELECT create_hypertable('robot_joint_states', 'time');
-- 索引：最常见的查询是"查某台设备最近 N 条" → (device_id, time DESC)。
--   CREATE INDEX = 建普通索引
--   device_id 在前是因为查询总是先按设备过滤；time DESC 因为最新数据读得最多。
CREATE INDEX idx_rjs_device_time ON robot_joint_states (device_id, "time" DESC);
-- 创建数据库索引 idx_rjs_device_time。

-- 产线状态历史（快照序列，1Hz）：产线每次进入新状态就记一笔，用来画趋势曲线。
--   【谁写】history-writer.service.ts 收到状态报文即时写入（频率低，不缓冲）。
--   【与 line_current_status 的区别】这张表是"流水"（append-only），
--     line_current_status 是"快照"（每产线一行，反复覆盖）。
-- 这一段建立产线状态历史表，声明它保存的字段和约束。
CREATE TABLE line_status_history (
-- 创建数据库表 line_status_history。
-- line_status_history 是保存产线状态历史的数据表
  "time"       TIMESTAMPTZ NOT NULL,
  -- line_current_status 是"快照"（每产线一行，反复覆盖）。
  -- time 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
               -- "time" = 时序表分区键（双引号转义保留字）
               -- TIMESTAMPTZ + NOT NULL = 带时区时间戳，不能为空
  line_id      BIGINT NOT NULL REFERENCES production_lines(id),
  -- 定义字段 line_id 的类型及约束。
  -- production_lines 是保存产线目录的数据表；line_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
               -- BIGINT + NOT NULL + REFERENCES = 外键，产线必须存在
  state        TEXT NOT NULL
  -- 定义字段 state 的类型及约束。
  -- state 是当前状态值或实时状态服务实例，以所在对象为准；TEXT 指定此列的数据类型
               CHECK (state IN ('running','idle','alarm','offline')),
               -- TEXT = 状态值
               -- CHECK = 只允许这 4 个值；10 种工序状态由 004 追加（只增不改）
  product_code TEXT,
  -- 定义字段 product_code 的类型及约束。
  -- product_code 是当前记录中的业务字段；TEXT 指定此列的数据类型
               -- TEXT = 当前在产的产品编码；可空
  good_count   INTEGER NOT NULL DEFAULT 0,
  -- 定义字段 good_count 的类型及约束。
  -- good_count 是当前记录中的业务字段；INTEGER 指定此列的数据类型
               -- INTEGER = 32 位整数
               -- NOT NULL + DEFAULT 0 = 没计数时按 0 算
  ng_count     INTEGER NOT NULL DEFAULT 0,
  -- 定义字段 ng_count 的类型及约束。
  -- ng_count 是当前记录中的业务字段；INTEGER 指定此列的数据类型
               -- INTEGER + NOT NULL + DEFAULT 0 = 不良品数，同上
  beat_ms      INTEGER
  -- 定义字段 beat_ms 的类型及约束。
  -- beat_ms 是当前记录中的业务字段；INTEGER 指定此列的数据类型
               -- INTEGER = 节拍（毫秒/件）
               -- 可空 = 采集端没报节拍
);
-- 这一段完成line_status_history表的定义，后续查询和写入依赖这些字段与约束。
-- create_hypertable = 按 "time" 自动分区
SELECT create_hypertable('line_status_history', 'time');
-- CREATE INDEX = 常用查询"某产线最近 N 条状态" → (line_id, time DESC)
CREATE INDEX idx_lsh_line_time ON line_status_history (line_id, "time" DESC);
-- 创建数据库索引 idx_lsh_line_time。

-- 事件/报警流水：启动、停止、报警、单件完成、换型都往这里记，按时间顺序只写不改。
--   【与 line_status_history 的区别】状态流水记的是"现在处于什么状态"，
--     这张表记的是"发生了什么"——一次报警一次事件，各是一条独立记录。
-- 这一段建立生产事件历史表，声明它保存的字段和约束。
CREATE TABLE production_events (
-- 创建数据库表 production_events。
-- production_events 是保存生产事件历史的数据表
  "time"    TIMESTAMPTZ NOT NULL,
  -- 这张表记的是"发生了什么"——一次报警一次事件，各是一条独立记录。
  -- time 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
            -- "time" = 时序表分区键
            -- TIMESTAMPTZ + NOT NULL = 带时区时间戳，不能为空
  line_id   BIGINT NOT NULL REFERENCES production_lines(id),
  -- 定义字段 line_id 的类型及约束。
  -- production_lines 是保存产线目录的数据表；line_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
            -- BIGINT + NOT NULL + REFERENCES = 事件必须归属某条产线
  device_id BIGINT REFERENCES devices(id),
  -- 定义字段 device_id 的类型及约束。
  -- devices 是保存设备目录的数据表；device_id 是pymodbus 当前接口的目标设备站号参数；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
            -- BIGINT + REFERENCES = 外键指向设备
            -- ★ 这里**没有** NOT NULL：产线级事件（如换型）没有具体设备
  type      TEXT NOT NULL,
  -- 定义字段 type 的类型及约束。
  -- type 是当前报文、指令或对象的类别字段；TEXT 指定此列的数据类型
            -- TEXT = 事件类型
            -- 取值：start / stop / alarm / piece_done / changeover / custom
            -- ★ 这里不用 CHECK：事件类型随需求增长，加一种就要改约束；
            --   用 TEXT + 应用层校验更灵活
  level     TEXT NOT NULL DEFAULT 'info'
  -- 定义字段 level 的类型及约束。
            CHECK (level IN ('info','warning','critical')),
            -- TEXT = 事件级别
            -- NOT NULL + DEFAULT 'info' = 默认最普通的一档
            -- CHECK = 只允许三档，页面上按严重程度筛就靠它
  code      TEXT,
  -- 定义字段 code 的类型及约束。
  -- code 是业务编码、状态码或数据库查询字段，结合所在报文解释；TEXT 指定此列的数据类型
            -- TEXT = 厂商报警码（PLC 报上来的原始码，留着对现场有用）
            -- 可空
  message   TEXT,
  -- 定义字段 message 的类型及约束。
  -- message 是消息正文或用于展示的结果说明；TEXT 指定此列的数据类型
            -- TEXT = 人类可读的描述；可空
  payload   JSONB NOT NULL DEFAULT '{}'
  -- 定义字段 payload 的类型及约束。
  -- payload 是消息或事件携带的数据内容；JSONB 指定此列的数据类型
            -- JSONB = 二进制 JSON
            -- NOT NULL + DEFAULT '{}' = 必填，空内容用空对象占位
            -- 内容：事件附带的原始报文快照。JSONB 是为了事件类型不设上限——
            --   不同厂商的附加字段结构不一样，写死列会很别扭
);
-- 这一段完成production_events表的定义，后续查询和写入依赖这些字段与约束。
-- create_hypertable = 按 "time" 自动分区
SELECT create_hypertable('production_events', 'time');
-- CREATE INDEX = 常用查询"某产线最近 N 条事件" → (line_id, time DESC)
CREATE INDEX idx_pe_line_time ON production_events (line_id, "time" DESC);
-- 创建数据库索引 idx_pe_line_time。

-- ===========================================================================
-- ④ 业务与审计（3 张）
--    这一组回答"现在什么情况"和"谁动过什么"，都是低频但必须可靠的数据。
-- ===========================================================================

-- 产线当前状态持久记录；网页首屏的当前实现从 Redis 快照读取。
--   ★ 注意：这是**普通表**（不是 hypertable），因为它只保存"当前"这一行。
--     每条产线就一行（line_id 是主键），后端每次收到产线状态就 UPSERT 覆盖
--     （见 server/src/history/history-writer.service.ts）。
--   【与 Redis 的关系】Redis 里也有一份同样的数据，**前端首屏实际读的是 Redis**
--     （要求低延迟）；这张表主要用于持久化存档和给分析页做交叉校验
--     Redis 失效后不会仅凭存在这张表就自动切换为数据库回退读取。
-- 这一段建立产线当前状态表，声明它保存的字段和约束。

-- line_current_status 对每条产线保留一行当前状态，line_id 主键使新的状态可以更新同一行。
-- line_status_history 另行追加带时间的工序记录；当前表、历史表与 Redis 最新快照分别由对应路径维护。
-- 它们没有被当前代码包成一个保证同时成功的事务，也不能据此假定 Redis 故障后页面会自动改读本表。

CREATE TABLE line_current_status (
-- 创建数据库表 line_current_status。
-- line_current_status 是保存产线当前状态的数据表
  line_id      BIGINT PRIMARY KEY REFERENCES production_lines(id),
  -- 定义字段 line_id 的类型及约束。
  -- production_lines 是保存产线目录的数据表；line_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；PRIMARY KEY 要求主键唯一并用于定位该表记录；REFERENCES 为该列设置对目标表主键的外键约束
               -- BIGINT = 存 production_lines.id
               -- PRIMARY KEY = 主键：结构上就保证"一条产线只有一行当前状态"
               -- REFERENCES = 外键，产线必须存在
  state        TEXT NOT NULL DEFAULT 'offline',
  -- 定义字段 state 的类型及约束。
  -- state 是当前状态值或实时状态服务实例，以所在对象为准；TEXT 指定此列的数据类型
               -- TEXT = 当前状态
               -- DEFAULT 'offline' = 没有数据时先按离线算
               -- ★ 本表在 001 里**没有** CHECK 约束，
               --   004_line_state_stages.sql 会补上（与 line_status_history 保持一致）
  product_code TEXT,
  -- 定义字段 product_code 的类型及约束。
  -- product_code 是当前记录中的业务字段；TEXT 指定此列的数据类型
               -- TEXT = 当前在产的产品编码；可空
  good_count   INTEGER NOT NULL DEFAULT 0,
  -- 定义字段 good_count 的类型及约束。
  -- good_count 是当前记录中的业务字段；INTEGER 指定此列的数据类型
               -- INTEGER + NOT NULL + DEFAULT 0 = 良品数
  ng_count     INTEGER NOT NULL DEFAULT 0,
  -- 定义字段 ng_count 的类型及约束。
  -- ng_count 是当前记录中的业务字段；INTEGER 指定此列的数据类型
               -- INTEGER + NOT NULL + DEFAULT 0 = 不良品数
  beat_ms      INTEGER,
  -- 定义字段 beat_ms 的类型及约束。
  -- beat_ms 是当前记录中的业务字段；INTEGER 指定此列的数据类型
               -- INTEGER = 节拍（毫秒/件）；可空
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  -- 定义字段 updated_at 的类型及约束。
  -- updated_at 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
               -- TIMESTAMPTZ + NOT NULL = 最后更新时间，必填
               -- DEFAULT now() = 每次覆盖写入时自动刷新
               -- 前端用它判断"这份状态是不是已经过期了"
);
-- 这一段完成line_current_status表的定义，后续查询和写入依赖这些字段与约束。

-- 控制指令（全生命周期审计；type 为白名单，不开放任意写寄存器）。
--   ★ 这是"只允许下发白名单指令"的落地：type 列有 CHECK 约束，
--     任何不在清单里的指令类型都写不进库，即使代码漏了校验。
--   ★ idempotency_key 就是 MQTT 报文里的 cmdId —— 它把"云端下发的指令"
--     和"边缘回来的回执"绑定在一起，形成闭环审计与幂等。
--     幂等键由数据库生成（gen_random_uuid()），不让客户端自己编，
--     避免伪造或重复。
--   【谁写】command.service.ts 落一条（status='sent'）；
--          history-writer.service.ts 收到回执后更新状态。
--   【为什么要落这张表】产线上"我以为指令发出去了、其实没执行"是最危险的事。
--     留一张全生命周期表，谁在什么时候对哪台设备下了什么指令、结果如何，
--     事后查得清。
-- 这一段建立控制指令审计记录表，声明它保存的字段和约束。
CREATE TABLE control_commands (
-- 创建数据库表 control_commands。
-- control_commands 是保存控制指令审计记录的数据表
  id              BIGSERIAL PRIMARY KEY,
  -- 定义数据库字段 id 的类型、默认值或约束。
                 -- BIGSERIAL = 自增大整数
  idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  -- 定义字段 idempotency_key 的类型及约束。
  -- idempotency_key 是当前记录中的业务字段；UUID 指定此列的数据类型
                 -- UUID = 128 位唯一标识（16 字节）
                 -- UNIQUE = 全表唯一：这是幂等的根据——同一条指令不会被写两遍
                 -- DEFAULT gen_random_uuid() = 由 pgcrypto 生成，不用应用层造
                 -- ★ 这个 UUID 就是 MQTT 报文里的 cmdId：
                 --   它把"下发的指令"和"回来的回执"绑成一对
  line_id         BIGINT NOT NULL REFERENCES production_lines(id),
  -- 定义字段 line_id 的类型及约束。
  -- production_lines 是保存产线目录的数据表；line_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
                 -- BIGINT + NOT NULL + REFERENCES = 指令必须归属一条产线
  device_id       BIGINT NOT NULL REFERENCES devices(id),
  -- 定义字段 device_id 的类型及约束。
  -- devices 是保存设备目录的数据表；device_id 是pymodbus 当前接口的目标设备站号参数；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
                 -- BIGINT + NOT NULL + REFERENCES = 指令必须落到一台设备上
  user_id         BIGINT NOT NULL REFERENCES users(id),
  -- 定义字段 user_id 的类型及约束。
  -- users 是保存早期用户数据的数据表；user_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
                 -- BIGINT + NOT NULL + REFERENCES = 下发人
                 -- ★ 操作人由 session 里的用户名反查 users.id 得到，
                 --   严禁信客户端传来的操作人（否则谁都能冒充别人下指令）
  type            TEXT NOT NULL
  -- 定义字段 type 的类型及约束。
  -- type 是当前报文、指令或对象的类别字段；TEXT 指定此列的数据类型
                 CHECK (type IN ('start','stop','reset','changeover')),
                 -- TEXT = 指令类型
                 -- CHECK = 白名单，不在清单里的类型写不进库
                 --   原 4 项；003 追加 mode_set/alarm_clear，005 再追加 conveyor
  params          JSONB NOT NULL DEFAULT '{}',
  -- 定义字段 params 的类型及约束。
  -- params 是指令附加参数对象；JSONB 指定此列的数据类型
                 -- JSONB = 二进制 JSON
                 -- NOT NULL + DEFAULT '{}' = 必填，空参数用空对象占位
                 -- 内容：指令参数。不同 type 的参数结构不同
                 --   (如 mode_set 的 action=acquire|release、conveyor 的
                 --   action=forward|stop)，所以用 JSONB 存，不硬编码列
  status          TEXT NOT NULL DEFAULT 'pending'
  -- 定义字段 status 的类型及约束。
  -- status 是当前连接、产线、请求或指令的状态字段；TEXT 指定此列的数据类型
                 CHECK (status IN ('pending','sent','acked','rejected','failed','timeout')),
                 -- TEXT = 指令状态
                 -- DEFAULT 'pending' = 落库时先记 pending，再往下走
                 -- CHECK = 状态机只允许这 6 个值
                 -- 状态机：pending → sent → acked / rejected / failed / timeout
                 --   pending  已落库、还没发出去
                 --   sent     已通过 MQTT 下发
                 --   acked    边缘确认执行成功
                 --   rejected 边缘拒绝执行（如 PLC 联锁不允许）
                 --   failed   执行失败
                 --   timeout  15 秒无回执（超时检测由 command.service.ts 的定时扫描实现）
  ack_payload     JSONB,
  -- 定义字段 ack_payload 的类型及约束。
  -- ack_payload 是当前记录中的业务字段；JSONB 指定此列的数据类型
                 -- JSONB = 边缘回来的原始回执内容
                 -- 可空 = 还没收到回执时就是 NULL
                 -- 原样存档备查
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 定义字段 issued_at 的类型及约束。
  -- issued_at 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
                 -- TIMESTAMPTZ + NOT NULL = 下发时刻，必填
                 -- DEFAULT now() = 插入时自动取当前时间
  acked_at        TIMESTAMPTZ
  -- 定义字段 acked_at 的类型及约束。
  -- acked_at 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
                 -- TIMESTAMPTZ = 回执时刻
                 -- 可空 = 还没收到回执
                 -- 与 issued_at 相减 = 指令实际耗时（做性能监控用）
);
-- 这一段完成control_commands表的定义，后续查询和写入依赖这些字段与约束。
-- 索引：按操作人 + 时间查（"张三今天下了哪些指令"）。
--   CREATE INDEX = 普通索引；user_id 在前，因为这类查询一定先按人过滤，
--   再按时间倒序取。
CREATE INDEX idx_cc_user_time ON control_commands (user_id, issued_at DESC);
-- 创建数据库索引 idx_cc_user_time。

-- 操作审计：所有敏感操作都往这里写一条。
--   ★ 审计必须**独立于**业务表：即使业务表被误改、被误删，审计表还在。
--     这是审计表与业务表分开的唯一理由。
--   【action 取值】command:execute（下发指令）/ command:execute:ai-confirmed
--     （AI 助手二次确认后下发）/ login（登录，待接）/ user:create（建用户，待接）。
--     当前实际写入方：server/src/command/command.service.ts 与
--     server/src/ai/ai.controller.ts；登录与建用户两类已预留但尚未接入。
--   【写入失败不阻断主流程】写审计是 fire-and-forget：审计写失败只记日志，
--     不让用户点按钮失败。
-- 这一段建立用户操作审计日志表，声明它保存的字段和约束。
CREATE TABLE audit_logs (
-- 创建数据库表 audit_logs。
-- audit_logs 是保存用户操作审计日志的数据表
  id         BIGSERIAL PRIMARY KEY,
  -- 定义数据库字段 id 的类型、默认值或约束。
             -- BIGSERIAL = 自增大整数
  user_id    BIGINT REFERENCES users(id),
  -- 定义字段 user_id 的类型及约束。
  -- users 是保存早期用户数据的数据表；user_id 是当前记录中的业务字段；BIGINT 指定此列的数据类型；REFERENCES 为该列设置对目标表主键的外键约束
             -- BIGINT = 存 users.id
             -- REFERENCES = 外键
             -- ★ 这里**没有** NOT NULL：系统自身产生的操作（如定时任务）没有操作人
  action     TEXT NOT NULL,
  -- 定义字段 action 的类型及约束。
  -- action 是当前记录中的业务字段；TEXT 指定此列的数据类型
             -- TEXT = 操作类型
             -- NOT NULL = 必填（action=login / command:execute / user:create ...）
  target     TEXT,
  -- 定义字段 target 的类型及约束。
  -- target 是当前记录中的业务字段；TEXT 指定此列的数据类型
             -- TEXT = 操作对象（人读格式，如 "start @ line-01/robot-01"）
             -- 可空
  detail     JSONB NOT NULL DEFAULT '{}',
  -- 定义字段 detail 的类型及约束。
  -- detail 是当前记录中的业务字段；JSONB 指定此列的数据类型
             -- JSONB = 二进制 JSON
             -- NOT NULL + DEFAULT '{}' = 必填，空细节用空对象占位
             -- 内容：细节快照（cmdId、参数等）。JSONB 便于事后按需加字段，
             --   不必为每种操作改表结构
  ip         INET,
  -- 内容：细节快照（cmdId、参数等）。JSONB 便于事后按需加字段，。
             -- INET = PostgreSQL 的 IP 地址类型（比 TEXT 严谨：写不进非法 IP）
             -- 可空 = 非网页操作可以没有 IP
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- 定义字段 created_at 的类型及约束。
  -- created_at 是当前记录中的业务字段；TIMESTAMPTZ 指定此列的数据类型
             -- TIMESTAMPTZ + NOT NULL = 必填
             -- DEFAULT now() = 插入时自动取当前时间
);
-- 这一段完成audit_logs表的定义，后续查询和写入依赖这些字段与约束。

-- ===========================================================================
-- 种子数据：让空库一建好就能跑起来
-- ===========================================================================

-- 四个内置角色。
--   角色是"岗位"：管理员、产线操作员、客户、数据分析员。
--   INSERT INTO 表 (列...) VALUES (值...),(值...) = 一次插多行
INSERT INTO roles (code, name) VALUES
-- insert into 操作角色相关的数据结构或记录。
-- roles 是保存操作角色的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
  ('admin','管理员'), ('operator','产线操作员'), ('customer','客户'), ('analyst','数据分析员');
  -- INSERT INTO 表 (列...) VALUES (值...),(值...) = 一次插多行。

-- 权限点清单：菜单 4 条 + 接口 1 条 + 数据 1 条。
--   code 用 "类型:名字" 的冒号约定，和 permissions.type 呼应。
INSERT INTO permissions (code, type, name) VALUES
-- insert into 操作权限相关的数据结构或记录。
-- permissions 是保存操作权限的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
  ('menu:dashboard','menu','产线总览'),
  -- code 用 "类型:名字" 的冒号约定，和 permissions.type 呼应。
  ('menu:twin','menu','数字孪生'),
  ('menu:analysis','menu','数据分析'),
  ('menu:admin','menu','系统管理'),
  ('api:command:execute','api','下发控制指令'),
  ('data:telemetry:detail','data','查看详细遥测数据');

-- 权限矩阵：谁 → 拿哪些权限。这四段 INSERT 拼起来就是完整的角色权限矩阵。
--   用 SELECT ... FROM roles JOIN permissions 生成笛卡尔积，
--   而不是手写 4×6=24 行 id —— 角色/权限 id 是自增的，写死就写死了。
--
--   管理员：admin × 全部权限（JOIN ON TRUE = 笛卡尔积）
--   操作员：总览 + 孪生 + 下发指令（不能看分析页）
--   客户：只读（总览 + 孪生），不能控制、不能看详细数据
--     ★ 数据范围（能看哪条产线）由 user_line_scope 表控制，不是这里
--   分析员：总览 + 分析 + 详细数据（不能控制产线）
-- INSERT INTO ... SELECT = 把查询结果当数据插进去
INSERT INTO role_permissions (role_id, permission_id)
-- insert into 角色与权限关联相关的数据结构或记录。
-- role_permissions 是保存角色与权限关联的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  SELECT r.id, p.id FROM roles r JOIN permissions p ON TRUE WHERE r.code = 'admin';
  -- INSERT INTO ... SELECT = 把查询结果当数据插进去。
  -- roles 是保存操作角色的数据表，FROM 指定本次读取的数据来源；WHERE 只处理满足本行或后续条件的记录
-- JOIN ... ON TRUE = 笛卡尔积（每个角色 × 每个权限）
-- WHERE r.code = 'admin' = 只取管理员这一行角色
INSERT INTO role_permissions (role_id, permission_id)
-- insert into 角色与权限关联相关的数据结构或记录。
-- role_permissions 是保存角色与权限关联的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  SELECT r.id, p.id FROM roles r, permissions p
  -- WHERE r.code = 'admin' = 只取管理员这一行角色。
  -- roles 是保存操作角色的数据表，FROM 指定本次读取的数据来源
  WHERE r.code = 'operator' AND p.code IN
  -- WHERE 只处理满足本行或后续条件的记录
    ('menu:dashboard','menu:twin','api:command:execute');
-- 逗号连接 FROM a, b = 隐式 CROSS JOIN（笛卡尔积）
-- IN (...) = 权限编码白名单
INSERT INTO role_permissions (role_id, permission_id)
-- insert into 角色与权限关联相关的数据结构或记录。
-- role_permissions 是保存角色与权限关联的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  SELECT r.id, p.id FROM roles r, permissions p
  -- IN (...) = 权限编码白名单。
  -- roles 是保存操作角色的数据表，FROM 指定本次读取的数据来源
  WHERE r.code = 'customer' AND p.code IN ('menu:dashboard','menu:twin');
  -- WHERE 只处理满足本行或后续条件的记录
-- 客户只给两个只读菜单
INSERT INTO role_permissions (role_id, permission_id)
-- insert into 角色与权限关联相关的数据结构或记录。
-- role_permissions 是保存角色与权限关联的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  SELECT r.id, p.id FROM roles r, permissions p
  -- roles 是保存操作角色的数据表，FROM 指定本次读取的数据来源
  WHERE r.code = 'analyst' AND p.code IN
  -- WHERE 只处理满足本行或后续条件的记录
    ('menu:dashboard','menu:analysis','data:telemetry:detail');
-- 分析员给总览 + 分析 + 详细数据（没有 api:command:execute，所以不能控制产线）

-- 初始管理员：admin / Admin@123  ★首次登录后必须修改
--   crypt('明文', gen_salt('bf'))：pgcrypto 的 bcrypt 口令散列。
--     gen_salt('bf') = 生成 bcrypt 盐；crypt = 用盐把明文散列成串。
--   ★ 库里永远不存明文口令，存的只是散列；即便库被拖走也拿不到密码。
--   ⚠ 生产部署后第一件事就是改掉这个默认口令。
INSERT INTO users (username, password_hash, display_name)
-- insert into 早期用户数据相关的数据结构或记录。
-- users 是保存早期用户数据的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  VALUES ('admin', crypt('Admin@123', gen_salt('bf')), '系统管理员');
  -- 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
  -- VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
-- 把 admin 用户绑定到 admin 角色（拿到全部权限）。
--   SELECT ... FROM users u, roles r WHERE ... = 跨表查出两人的 id 再关联
INSERT INTO user_roles (user_id, role_id)
-- insert into 用户与角色关联相关的数据结构或记录。
-- user_roles 是保存用户与角色关联的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'admin';
  -- SELECT ... FROM users u, roles r WHERE ... = 跨表查出两人的 id 再关联。
  -- users 是保存早期用户数据的数据表，FROM 指定本次读取的数据来源；WHERE 只处理满足本行或后续条件的记录

-- 示例产线与设备（code 与数据契约 / mock 采集器一致）。
--   ★ line-01 必须与 mock_collector.py 的默认 LINE_ID 一致，
--     robot-01 必须与 ROBOT_ID 一致 —— 否则采集上来的数据认不出归属。
--   ★ 这套示例数据的意义：装完库直接就能跑通全链路，
--     不用先去现场点表里登记产线。
INSERT INTO production_lines (code, name, location) VALUES ('line-01','一号产线','示例车间');
-- 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
-- production_lines 是保存产线目录的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
-- 用 CROSS JOIN 一次性插入两台设备（plc-01 主控 PLC、robot-01 六轴机器人）。
--   写成 VALUES 列表 + CROSS JOIN，是为了新增一台设备只要加一行数据，
--   不用再写一条 INSERT。
INSERT INTO devices (line_id, type, code, name, protocol)
-- insert into 设备目录相关的数据结构或记录。
-- devices 是保存设备目录的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  SELECT l.id, d.type, d.code, d.name, d.protocol
  -- 不用再写一条 INSERT。
  FROM production_lines l,
  -- production_lines 是保存产线目录的数据表，FROM 指定本次读取的数据来源
       (VALUES ('plc',   'plc-01',    '主控 PLC',   'modbus_tcp'),
       -- 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
       -- VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
               ('robot', 'robot-01',  '六轴机器人', 'via_plc')
       ) AS d(type, code, name, protocol)
  WHERE l.code = 'line-01';
  -- WHERE 只处理满足本行或后续条件的记录
-- VALUES (...) AS d(列名...) = 构造一张只有两行的临时表，并给它起别名和列名
-- CROSS JOIN = 与 production_lines 笛卡尔积（这里只有 1 条产线，正好 1×2=2 行）
INSERT INTO line_current_status (line_id)
-- insert into 产线当前状态相关的数据结构或记录。
-- line_current_status 是保存产线当前状态的数据表；INSERT 是当前记录中的业务字段；INT 指定此列的数据类型
  SELECT id FROM production_lines WHERE code = 'line-01';
  -- CROSS JOIN = 与 production_lines 笛卡尔积（这里只有 1 条产线，正好 1×2=2 行）。
  -- production_lines 是保存产线目录的数据表，FROM 指定本次读取的数据来源；WHERE 只处理满足本行或后续条件的记录
-- 插入示例产线的初始状态行（line_id 是主键，所以只能有一行）
-- 不预先插这一行的话，前端首屏第一次读会拿到空。

-- ===========================================================================
-- 时序数据生命周期（按需开启，默认全部注释掉）
-- ---------------------------------------------------------------------------
-- 为什么默认关闭：压缩和清理策略一旦开启，历史数据会**真的被删掉**。
--   开发阶段数据量小、还要留着复现问题；等生产环境数据量真的涨上来，
--   由现场按实际磁盘容量决定保留多久，再取消注释。
--
-- ① 压缩：按 device_id 分段，把 7 天前的数据压成紧凑格式（体积能降到零头）
-- ALTER TABLE robot_joint_states SET (timescaledb.compress,
--   timescaledb.compress_segmentby = 'device_id');
-- SELECT add_compression_policy('robot_joint_states', INTERVAL '7 days');
-- ② 保留：30 天前的数据自动清理，防止磁盘被撑爆
-- SELECT add_retention_policy('robot_joint_states', INTERVAL '30 days');
-- 另建议为长期趋势建 1 分钟粒度连续聚合(continuous aggregate),见 TimescaleDB 文档。
-- ===========================================================================
