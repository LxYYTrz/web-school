# server/src/infra/infra.module.ts 逐行说明

[打开源码](../../../../../server/src/infra/infra.module.ts) · 59 行 · 16 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 31 | <code>import { Global, Module } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 32 | <code>import { Pool } from 'pg';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 33 | <code>import Redis from 'ioredis';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 34 | <code>import { config } from '../config/configuration';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 35 | <code>import { CatalogService } from './catalog.service';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 36 | <code>import { PG_POOL, REDIS } from './tokens';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 42 | <code>@Global()</code> | 使用装饰器声明框架元数据或参数注入。 |
| 43 | <code>@Module({</code> | 使用装饰器声明框架元数据或参数注入。 |
| 44 | <code>providers: [</code> | 设置字段 `providers`。 |
| 47 | <code>{ provide: PG_POOL, useFactory: () =&gt; new Pool({ connectionString: config.pg.connectionString }) },</code> | 续写当前表达式、对象、类型或调用。 关键字：`new`＝创建对象实例。 |
| 50 | <code>{ provide: REDIS, useFactory: () =&gt; new Redis(config.redis.url) },</code> | 续写当前表达式、对象、类型或调用。 关键字：`new`＝创建对象实例。 |
| 52 | <code>CatalogService,</code> | 续写当前表达式、对象、类型或调用。 |
| 53 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 57 | <code>exports: [PG_POOL, REDIS, CatalogService],</code> | 设置字段 `exports`。 |
| 58 | <code>})</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 59 | <code>export class InfraModule {}</code> | 声明 `InfraModule` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
