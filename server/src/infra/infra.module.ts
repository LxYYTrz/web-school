/**
 // 这一段负责配置和实现 server/src/infra/infra.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：基础设施模块（全局）—— 提供 PG 连接池 / Redis 客户端 / 编码映射
 * 所属模块：server/src/infra/
 * ============================================================================
 *
 * 【宏观定位】系统的"地基"。它不对外提供业务能力，只提供三个可被任意模块注入的
 *   基础设施实例：
 *     ① PG_POOL    —— PostgreSQL 连接池（历史数据、业务表）
 *     ② REDIS      —— Redis 客户端（实时快照）
 *     ③ CatalogService —— 编码映射缓存（code → 数据库 id）
 *
 * 【为什么是 @Global()】
 *   InfraModule 被标记为 @Global()：只要在根模块 AppModule 里 import 一次，
 *   它导出的 provider 就能被项目里**任何**模块直接 @Inject，不需要每个模块
 *   都写 imports: [InfraModule]。这避免了到处 import 造成的样板代码。
 *
 * 【useFactory 是什么】
 *   provider 可以是三种形式之一：
 *     { provide: X, useClass: X }          用某个类
 *     { provide: X, useValue: 某值 }        用一个现成的值/实例
 *     { provide: X, useFactory: () => 值 }  用工厂函数现场创建
 *   这里用 useFactory，是因为 Pool / Redis 需要在运行时用配置对象创建，
 *   且创建时机由 Nest 的生命周期管理（模块实例化时创建一次）。
 *
 * 【连接池为什么重要】
 *   Pool 是 PostgreSQL 的连接池：预先维护若干条到数据库的 TCP 连接。
 *   机器人帧是 10Hz 高频写入，如果不池化，每次 INSERT 都新建 TCP 连接
 *   （含 TLS 握手、认证），会瞬间耗尽数据库连接数。池化后复用，吞吐提升巨大。
 */
import { Global, Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Global：NestJS 将模块提供者开放给全局依赖注入的装饰器；Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。
// Pool：pg 驱动提供的 PostgreSQL 连接池类
import Redis from 'ioredis';
// 从 ioredis 导入这一行列出的符号，供本文件调用。
// Redis：ioredis 提供的 Redis 客户端类
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值
import { CatalogService } from './catalog.service';
// 从 ./catalog.service 导入这一行列出的符号，供本文件调用。
// CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键
import { PG_POOL, REDIS } from './tokens';
// 从 ./tokens 导入这一行列出的符号，供本文件调用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌；REDIS：infra/tokens 定义的 Redis 客户端注入令牌

// 全局基础设施:PG 连接池 / Redis / 编码映射缓存
/**
 * 基础设施模块。
 */
// 这一段声明 InfraModule，用于InfraModule 的相关数据和行为。
@Global()
// 装饰器 Global：给后面的类、方法或参数附加元数据。
// Global：NestJS 将模块提供者开放给全局依赖注入的装饰器
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器

  // InfraModule 用注入令牌提供数据库连接池、Redis 客户端与基础目录，供业务服务复用。
  // PG_POOL 对应 pg.Pool，连接串来自 config.pg.connectionString；REDIS 对应 ioredis 实例，目标来自 config.redis.url。
  // 业务服务注入的是现有连接实例，再按各自用途查询、写快照或保存历史，不是每个接口都重新创建一套基础服务。

  providers: [
  // 声明或设置 providers，用于当前对象或接口的对应数据。
  // providers 是此处声明的字段，类型或取值约束为 [
    // ① PostgreSQL 连接池：只创建一次，整个进程共享。
    //    connectionString 从配置读取，连接工控机本地 PostgreSQL
    { provide: PG_POOL, useFactory: () => new Pool({ connectionString: config.pg.connectionString }) },
    // 开始对象字面量，并在这一行设置其中列出的字段。
    // PG_POOL：infra/tokens 定义的数据库连接池注入令牌；Pool：pg 驱动提供的 PostgreSQL 连接池类；connectionString：PostgreSQL 的完整连接地址与登录配置；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；pg：config 对象上的字段或操作
    // ② Redis 客户端：同样全局共享一个实例。
    //    ioredis 自带断线重连，连接断开时命令会排队等待重连
    { provide: REDIS, useFactory: () => new Redis(config.redis.url) },
    // 开始对象字面量，并在这一行设置其中列出的字段。
    // REDIS：infra/tokens 定义的 Redis 客户端注入令牌；Redis：ioredis 提供的 Redis 客户端类；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；redis：注入或创建的 Redis 客户端；url：当前服务的连接地址
    // ③ 编码映射服务：普通类，由 Nest 实例化并注入其依赖（内部需要 PG_POOL）
    CatalogService,
    // 把变量 CatalogService 作为同名对象字段加入当前对象。
    // CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键
  ],
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 此处结束当前数组参数，各元素保持上方列出的顺序
  // exports：把上面三个 provider 开放出去。
  //   CatalogService 也被导出，是因为 ingest / history / command 都要用它把
  //   MQTT 报文里的 code（如 "line-01"）翻译成数据库主键 id。
  exports: [PG_POOL, REDIS, CatalogService],
  // 声明或设置 exports，用于当前对象或接口的对应数据。
  // PG_POOL：infra/tokens 定义的数据库连接池注入令牌；REDIS：infra/tokens 定义的 Redis 客户端注入令牌；CatalogService：后端产线和设备目录服务，把字符串编码解析为数据库主键
})
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 本行完成上面一层已说明的函数、分支或对象配置
export class InfraModule {}
// 定义 InfraModule，约束或实现本模块涉及的数据和行为。
// InfraModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/infra/infra.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 InfraModule 的字段或服务能力，供项目其他模块使用。
