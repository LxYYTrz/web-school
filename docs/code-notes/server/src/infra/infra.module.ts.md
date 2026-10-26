# server/src/infra/infra.module.ts 逐行注释

[打开源码](../../../../../server/src/infra/infra.module.ts) · 59 行 · 16 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 31 行**

```text
import { Global, Module } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 32 行**

```text
import { Pool } from 'pg';
// 注释：从 pg 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 33 行**

```text
import Redis from 'ioredis';
// 注释：从 ioredis 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 34 行**

```text
import { config } from '../config/configuration';
// 注释：从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 35 行**

```text
import { CatalogService } from './catalog.service';
// 注释：从 ./catalog.service 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 36 行**

```text
import { PG_POOL, REDIS } from './tokens';
// 注释：从 ./tokens 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 42 行**

```text
@Global()
// 注释：装饰器 Global：给后面的类、方法或参数附加元数据。
```

**源码第 43 行**

```text
@Module({
// 注释：装饰器 Module：声明 NestJS 模块的依赖和导出。
```

**源码第 44 行**

```text
  providers: [
// 注释：设置字段 `providers`。
```

**源码第 47 行**

```text
    { provide: PG_POOL, useFactory: () => new Pool({ connectionString: config.pg.connectionString }) },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：`new`＝创建对象实例。
```

**源码第 50 行**

```text
    { provide: REDIS, useFactory: () => new Redis(config.redis.url) },
// 注释：开始对象字面量，并在这一行设置其中列出的字段。 关键字：`new`＝创建对象实例。
```

**源码第 52 行**

```text
    CatalogService,
// 注释：把变量 CatalogService 作为同名对象字段加入当前对象。
```

**源码第 53 行**

```text
  ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 57 行**

```text
  exports: [PG_POOL, REDIS, CatalogService],
// 注释：设置字段 `exports`。
```

**源码第 58 行**

```text
})
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 59 行**

```text
export class InfraModule {}
// 注释：声明 `InfraModule` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```
