/**
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
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config } from '../config/configuration';
import { CatalogService } from './catalog.service';
import { PG_POOL, REDIS } from './tokens';

// 全局基础设施:PG 连接池 / Redis / 编码映射缓存
/**
 * 基础设施模块。
 */
@Global()
@Module({
  providers: [
    // ① PostgreSQL 连接池：只创建一次，整个进程共享。
    //    connectionString 从配置读取，连接工控机本地 PostgreSQL
    { provide: PG_POOL, useFactory: () => new Pool({ connectionString: config.pg.connectionString }) },
    // ② Redis 客户端：同样全局共享一个实例。
    //    ioredis 自带断线重连，连接断开时命令会排队等待重连
    { provide: REDIS, useFactory: () => new Redis(config.redis.url) },
    // ③ 编码映射服务：普通类，由 Nest 实例化并注入其依赖（内部需要 PG_POOL）
    CatalogService,
  ],
  // exports：把上面三个 provider 开放出去。
  //   CatalogService 也被导出，是因为 ingest / history / command 都要用它把
  //   MQTT 报文里的 code（如 "line-01"）翻译成数据库主键 id。
  exports: [PG_POOL, REDIS, CatalogService],
})
export class InfraModule {}
