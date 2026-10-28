/**
 * 后端的全局基础依赖模块，创建 pg.Pool、ioredis 客户端，并提供 CatalogService。
 * PG_POOL、REDIS 是注入令牌；需要数据连接的业务服务复用这里提供的实例。
 * 注册连接对象不代表现场服务已经可用；实际查询、写入和错误在调用路径中处理。
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

  // InfraModule 用注入令牌提供数据库连接池、Redis 客户端与基础目录，供业务服务复用。
  // PG_POOL 对应 pg.Pool，连接串来自 config.pg.connectionString；REDIS 对应 ioredis 实例，目标来自 config.redis.url。
  // 业务服务注入的是现有连接实例，再按各自用途查询、写快照或保存历史，不是每个接口都重新创建一套基础服务。

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
  //   CatalogService 也被导出，是因为 ingest / history / command 都要用它把
  //   MQTT 报文里的 code（如 "line-01"）翻译成数据库主键 id。
  exports: [PG_POOL, REDIS, CatalogService],
})
export class InfraModule {}
// InfraModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
