# server/src/infra/catalog.service.ts 逐行注释

[打开源码](../../../../../server/src/infra/catalog.service.ts) · 112 行 · 38 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 30 行**

```text
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 31 行**

```text
import { Pool } from 'pg';
// 注释：从 pg 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 32 行**

```text
import { PG_POOL } from './tokens';
// 注释：从 ./tokens 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 41 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 42 行**

```text
export class CatalogService implements OnModuleInit, OnModuleDestroy {
// 注释：声明 `CatalogService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。
```

**源码第 44 行**

```text
  private readonly logger = new Logger(CatalogService.name);
// 注释：调用 Logger；括号中的表达式是传入的参数。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。
```

**源码第 46 行**

```text
  private lines = new Map<string, number>();
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问；`new`＝创建对象实例。
```

**源码第 48 行**

```text
  private devices = new Map<string, number>();
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问；`new`＝创建对象实例。
```

**源码第 51 行**

```text
  private timer?: NodeJS.Timeout;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问。
```

**源码第 57 行**

```text
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
// 注释：定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 59 行**

```text
  async onModuleInit() {
// 注释：定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 61 行**

```text
    await this.reload();
// 注释：调用 this.reload，把括号中的值作为参数传入。 关键字：`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 65 行**

```text
    this.timer = setInterval(() => {
// 注释：把右侧表达式的结果写入 this.timer。 关键字：`this`＝当前对象实例。
```

**源码第 66 行**

```text
      this.reload().catch((e: Error) => this.logger.error(`映射刷新失败: ${e.message}`));
// 注释：调用 this.reload，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例；`catch`＝捕获异常。
```

**源码第 67 行**

```text
    }, 60_000);
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 70 行**

```text
    this.timer.unref();
// 注释：调用 this.timer.unref，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 71 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 76 行**

```text
  onModuleDestroy() {
// 注释：定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
```

**源码第 77 行**

```text
    if (this.timer) clearInterval(this.timer);
// 注释：判断 if (this.timer) clearInterval(this.timer); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例。
```

**源码第 78 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 80 行**

```text
  async reload() {
// 注释：定义方法 reload；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 82 行**

```text
    const lines = await this.pool.query('SELECT id, code FROM production_lines');
// 注释：声明 lines，初始值由 await this.pool.query('SELECT id, code FROM production_lines') 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 84 行**

```text
    const devices = await this.pool.query('SELECT id, code FROM devices');
// 注释：声明 devices，初始值由 await this.pool.query('SELECT id, code FROM devices') 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 87 行**

```text
    this.lines = new Map(lines.rows.map((r) => [String(r.code), Number(r.id)]));
// 注释：把右侧表达式的结果写入 this.lines。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。
```

**源码第 88 行**

```text
    this.devices = new Map(devices.rows.map((r) => [String(r.code), Number(r.id)]));
// 注释：把右侧表达式的结果写入 this.devices。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。
```

**源码第 90 行**

```text
    this.logger.log(`编码映射已加载:${this.lines.size} 条产线 / ${this.devices.size} 台设备`);
// 注释：调用 this.logger.log，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 91 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 97 行**

```text
  lineId(code: string): number | undefined {
// 注释：定义方法 lineId；括号中声明参数，花括号内实现逻辑。 关键字：`undefined`＝未定义值。
```

**源码第 98 行**

```text
    const id = this.lines.get(code);
// 注释：声明 id，初始值由 this.lines.get(code) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 100 行**

```text
    if (id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`);
// 注释：判断 if (id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`this`＝当前对象实例。
```

**源码第 101 行**

```text
    return id;
// 注释：返回 id 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 102 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 107 行**

```text
  deviceId(code: string): number | undefined {
// 注释：定义方法 deviceId；括号中声明参数，花括号内实现逻辑。 关键字：`undefined`＝未定义值。
```

**源码第 108 行**

```text
    const id = this.devices.get(code);
// 注释：声明 id，初始值由 this.devices.get(code) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 109 行**

```text
    if (id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`);
// 注释：判断 if (id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`this`＝当前对象实例。
```

**源码第 110 行**

```text
    return id;
// 注释：返回 id 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 111 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 112 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
