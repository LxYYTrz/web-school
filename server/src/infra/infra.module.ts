import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config } from '../config/configuration';
import { CatalogService } from './catalog.service';
import { PG_POOL, REDIS } from './tokens';

// 全局基础设施:PG 连接池 / Redis / 编码映射缓存
@Global()
@Module({
  providers: [
    { provide: PG_POOL, useFactory: () => new Pool({ connectionString: config.pg.connectionString }) },
    { provide: REDIS, useFactory: () => new Redis(config.redis.url) },
    CatalogService,
  ],
  exports: [PG_POOL, REDIS, CatalogService],
})
export class InfraModule {}
