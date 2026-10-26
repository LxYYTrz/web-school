# server/src/command/command.service.ts 逐行注释

[打开源码](../../../../../server/src/command/command.service.ts) · 180 行 · 94 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 47 行**

```text
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 48 行**

```text
import { Pool } from 'pg';
// 注释：从 pg 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 49 行**

```text
import { PG_POOL } from '../infra/tokens';
// 注释：从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 50 行**

```text
import { CatalogService } from '../infra/catalog.service';
// 注释：从 ../infra/catalog.service 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 51 行**

```text
import { MqttIngestService } from '../ingest/mqtt-ingest.service';
// 注释：从 ../ingest/mqtt-ingest.service 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 52 行**

```text
import type { SessionUser } from '../auth/session-user';
// 注释：从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 53 行**

```text
import { ALLOWED_TYPES, validateParams } from './command-contract';
// 注释：从 ./command-contract 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 59 行**

```text
const CMD_TIMEOUT_SEC = 15;
// 注释：声明 CMD_TIMEOUT_SEC，初始值由 15 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 64 行**

```text
export interface CommandBody {
// 注释：声明 `CommandBody` 的结构。 关键字：`export`＝向其他模块开放符号；`interface`＝定义类型接口。
```

**源码第 65 行**

```text
  deviceId?: string;
// 注释：声明 可选字段 deviceId，类型为 string。
```

**源码第 66 行**

```text
  type?: string;
// 注释：声明 可选字段 type，类型为 string。 关键字：type＝定义类型别名。
```

**源码第 67 行**

```text
  params?: Record<string, unknown>;
// 注释：声明 可选字段 params，类型为 Record<string, unknown>。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 68 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 70 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 71 行**

```text
export class CommandService implements OnModuleInit, OnModuleDestroy {
// 注释：声明 `CommandService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。
```

**源码第 72 行**

```text
  private readonly logger = new Logger(CommandService.name);
// 注释：调用 Logger；括号中的表达式是传入的参数。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。
```

**源码第 73 行**

```text
  private timer?: NodeJS.Timeout;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问。
```

**源码第 75 行**

```text
  constructor(
// 注释：调用 constructor，把括号中的值作为参数传入。
```

**源码第 76 行**

```text
    @Inject(PG_POOL) private readonly pool: Pool,
// 注释：装饰器 Inject：按令牌注入指定依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 77 行**

```text
    private readonly catalog: CatalogService,
// 注释：声明类属性或构造参数 catalog，类型为 CatalogService。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 78 行**

```text
    private readonly mqtt: MqttIngestService,
// 注释：声明类属性或构造参数 mqtt，类型为 MqttIngestService。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 79 行**

```text
  ) {}
// 注释：结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
```

**源码第 81 行**

```text
  onModuleInit() {
// 注释：定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
```

**源码第 82 行**

```text
    this.timer = setInterval(() => this.sweepTimeout(), 1000);
// 注释：把右侧表达式的结果写入 this.timer。 关键字：`this`＝当前对象实例。
```

**源码第 83 行**

```text
    this.timer.unref();
// 注释：调用 this.timer.unref，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 84 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 86 行**

```text
  onModuleDestroy() {
// 注释：定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
```

**源码第 87 行**

```text
    if (this.timer) clearInterval(this.timer);
// 注释：判断 if (this.timer) clearInterval(this.timer); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例。
```

**源码第 88 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 91 行**

```text
  private async sweepTimeout() {
// 注释：定义方法 sweepTimeout；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数。
```

**源码第 92 行**

```text
    try {
// 注释：开始可能抛出异常的操作区域。 关键字：`try`＝进入异常处理块。
```

**源码第 96 行**

```text
      const r = await this.pool.query(
// 注释：声明 r，初始值由 await this.pool.query( 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 97 行**

```text
        `UPDATE control_commands
// 注释：修改数据。 关键字：`UPDATE`＝修改已有行。
```

**源码第 98 行**

```text
            SET status = 'timeout'
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 99 行**

```text
          WHERE status = 'sent'
// 注释：限定处理范围。 关键字：`WHERE`＝限定目标行。
```

**源码第 100 行**

```text
            AND issued_at < now() - ($1 || ' seconds')::interval
// 注释：叠加筛选条件。 关键字：`AND`＝逻辑与。
```

**源码第 101 行**

```text
            RETURNING id`,
// 注释：返回变更结果。 关键字：`RETURNING`＝返回变更后的字段。
```

**源码第 102 行**

```text
        [String(CMD_TIMEOUT_SEC)],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 103 行**

```text
      );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 104 行**

```text
      if (r.rowCount) {
// 注释：判断 if (r.rowCount) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 105 行**

```text
        this.logger.warn(`超时 ${r.rowCount} 条 sent 命令 → timeout`);
// 注释：调用 this.logger.warn，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 106 行**

```text
      }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 107 行**

```text
    } catch (e) {
// 注释：开始异常处理分支，接收前面代码抛出的错误。 关键字：`catch`＝捕获异常。
```

**源码第 108 行**

```text
      this.logger.error(`sweepTimeout 失败: ${(e as Error).message}`);
// 注释：调用 this.logger.error，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 109 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 110 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 112 行**

```text
  async issue(lineCode: string, body: CommandBody, user: SessionUser) {
// 注释：定义方法 issue；括号中声明参数，花括号内实现逻辑。 关键字：`async`＝声明异步函数。
```

**源码第 115 行**

```text
    if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) {
// 注释：判断 if (!body?.deviceId || !body?.type || !ALLOWED_TYPES.has(body.type)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 116 行**

```text
      return {
// 注释：返回 { 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 117 行**

```text
        ok: false,
// 注释：设置字段 `ok`。 关键字：`false`＝布尔假值。
```

**源码第 118 行**

```text
        error: `deviceId/type 非法;type 白名单: ${[...ALLOWED_TYPES].join('|')}`,
// 注释：设置字段 `error`。 关键字：type＝定义类型别名。
```

**源码第 119 行**

```text
      };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 120 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 123 行**

```text
    const lineId = this.catalog.lineId(lineCode);
// 注释：声明 lineId，初始值由 this.catalog.lineId(lineCode) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 124 行**

```text
    const deviceId = this.catalog.deviceId(body.deviceId);
// 注释：声明 deviceId，初始值由 this.catalog.deviceId(body.deviceId) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 125 行**

```text
    if (lineId === undefined || deviceId === undefined) {
// 注释：判断 if (lineId === undefined || deviceId === undefined) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值。
```

**源码第 126 行**

```text
      return { ok: false, error: '未知产线或设备编码' };
// 注释：返回 { ok: false, error: '未知产线或设备编码' } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 127 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 130 行**

```text
    const pv = validateParams(body.type, body.params);
// 注释：声明 pv，初始值由 validateParams(body.type, body.params) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 131 行**

```text
    if (!pv.ok) return { ok: false, error: pv.error };
// 注释：判断 if (!pv.ok) return { ok: false, error: pv.error }; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 134 行**

```text
    const operator = user?.username || 'unknown';
// 注释：声明 operator，初始值由 user?.username || 'unknown' 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 135 行**

```text
    const userId = await this.resolveUserId(operator);
// 注释：声明 userId，初始值由 await this.resolveUserId(operator) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 137 行**

```text
    const r = await this.pool.query(
// 注释：声明 r，初始值由 await this.pool.query( 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 138 行**

```text
      `INSERT INTO control_commands (line_id, device_id, user_id, type, params, status)
// 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 139 行**

```text
       VALUES ($1,$2,$3,$4,$5,'sent') RETURNING idempotency_key`,
// 注释：列出待写入的值。 关键字：`VALUES`＝给出插入值；`RETURNING`＝返回变更后的字段。
```

**源码第 140 行**

```text
      [lineId, deviceId, userId, body.type, JSON.stringify(body.params ?? {})],
// 注释：开始当前表达式的分组或数组内容。 关键字：type＝定义类型别名。
```

**源码第 141 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 143 行**

```text
    const cmdId = String(r.rows[0].idempotency_key);
// 注释：声明 cmdId，初始值由 String(r.rows[0].idempotency_key) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 148 行**

```text
    this.pool
// 注释：读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：`this`＝当前对象实例。
```

**源码第 149 行**

```text
      .query(
// 注释：调用 .query，把括号中的值作为参数传入。
```

**源码第 150 行**

```text
        `INSERT INTO audit_logs (user_id, action, target, detail)
// 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 151 行**

```text
         VALUES ($1, 'command:execute', $2, $3::jsonb)`,
// 注释：列出待写入的值。 关键字：`VALUES`＝给出插入值。
```

**源码第 152 行**

```text
        [userId, `${body.type} @ ${lineCode}/${body.deviceId}`,
// 注释：开始当前表达式的分组或数组内容。 关键字：type＝定义类型别名。
```

**源码第 153 行**

```text
         JSON.stringify({ cmdId, params: body.params ?? {}, operator })],
// 注释：调用 JSON.stringify，把括号中的值作为参数传入。
```

**源码第 154 行**

```text
      )
// 注释：结束当前集合、分组或调用参数。
```

**源码第 155 行**

```text
      .catch((e) => this.logger.error(`写 audit_logs 失败: ${e.message}`));
// 注释：调用 .catch，把括号中的值作为参数传入。 关键字：`catch`＝捕获异常；`this`＝当前对象实例。
```

**源码第 158 行**

```text
    this.mqtt.publishCommand(lineCode, body.deviceId, {
// 注释：调用 this.mqtt.publishCommand，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 159 行**

```text
      cmdId,
// 注释：把变量 cmdId 作为同名对象字段加入当前对象。
```

**源码第 160 行**

```text
      ts: Date.now(),
// 注释：设置字段 `ts`。
```

**源码第 161 行**

```text
      lineId: lineCode,
// 注释：设置字段 `lineId`。
```

**源码第 162 行**

```text
      deviceId: body.deviceId,
// 注释：设置字段 `deviceId`。
```

**源码第 163 行**

```text
      type: body.type,
// 注释：设置字段 `type`。 关键字：type＝定义类型别名。
```

**源码第 164 行**

```text
      params: body.params ?? {},
// 注释：设置字段 `params`。
```

**源码第 165 行**

```text
      operator,
// 注释：把变量 operator 作为同名对象字段加入当前对象。
```

**源码第 166 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 169 行**

```text
    return { ok: true, cmdId };
// 注释：返回 { ok: true, cmdId } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 170 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 172 行**

```text
  private async resolveUserId(username: string): Promise<number> {
// 注释：定义方法 resolveUserId；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问；`async`＝声明异步函数。
```

**源码第 173 行**

```text
    const r = await this.pool.query('SELECT id FROM users WHERE username = $1', [username]);
// 注释：声明 r，初始值由 await this.pool.query('SELECT id FROM users WHERE username = $1', [username]) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 175 行**

```text
    if (r.rows[0]) return Number(r.rows[0].id);
// 注释：判断 if (r.rows[0]) return Number(r.rows[0].id); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 177 行**

```text
    const a = await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`);
// 注释：声明 a，初始值由 await this.pool.query(`SELECT id FROM users WHERE username = 'admin'`) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`await`＝等待异步操作完成；`this`＝当前对象实例。
```

**源码第 178 行**

```text
    return Number(a.rows[0].id);
// 注释：返回 Number(a.rows[0].id) 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 179 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 180 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
