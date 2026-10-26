# server/src/history/history-writer.service.ts 逐行注释

[打开源码](../../../../../server/src/history/history-writer.service.ts) · 266 行 · 135 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 37 行**

```text
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// 注释：从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 38 行**

```text
import { Pool } from 'pg';
// 注释：从 pg 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 39 行**

```text
import { PG_POOL } from '../infra/tokens';
// 注释：从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 40 行**

```text
import { CatalogService } from '../infra/catalog.service';
// 注释：从 ../infra/catalog.service 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 46 行**

```text
interface RobotRow {
// 注释：声明 `RobotRow` 的结构。 关键字：`interface`＝定义类型接口。
```

**源码第 47 行**

```text
  time: Date;
// 注释：设置字段 `time`。
```

**源码第 48 行**

```text
  deviceId: number;
// 注释：设置字段 `deviceId`。
```

**源码第 49 行**

```text
  joints: number[];
// 注释：设置字段 `joints`。
```

**源码第 50 行**

```text
  tcp: number[] | null;
// 注释：设置字段 `tcp`。 关键字：`null`＝空值。
```

**源码第 51 行**

```text
  speedPct: number | null;
// 注释：设置字段 `speedPct`。 关键字：`null`＝空值。
```

**源码第 52 行**

```text
  mode: string | null;
// 注释：设置字段 `mode`。 关键字：`null`＝空值。
```

**源码第 53 行**

```text
  program: string | null;
// 注释：设置字段 `program`。 关键字：`null`＝空值。
```

**源码第 54 行**

```text
  alarmCode: number;
// 注释：设置字段 `alarmCode`。
```

**源码第 55 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 62 行**

```text
@Injectable()
// 注释：装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
```

**源码第 63 行**

```text
export class HistoryWriterService implements OnModuleInit, OnModuleDestroy {
// 注释：声明 `HistoryWriterService` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类；`implements`＝实现接口。
```

**源码第 64 行**

```text
  private readonly logger = new Logger(HistoryWriterService.name);
// 注释：调用 Logger；括号中的表达式是传入的参数。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值；`new`＝创建对象实例。
```

**源码第 66 行**

```text
  private robotBuffer: RobotRow[] = [];
// 注释：声明类属性或构造参数 robotBuffer，类型为 RobotRow[] = []。 关键字：`private`＝限定类内部访问。
```

**源码第 68 行**

```text
  private timer?: NodeJS.Timeout;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问。
```

**源码第 73 行**

```text
  constructor(
// 注释：调用 constructor，把括号中的值作为参数传入。
```

**源码第 74 行**

```text
    @Inject(PG_POOL) private readonly pool: Pool,
// 注释：装饰器 Inject：按令牌注入指定依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 75 行**

```text
    private readonly catalog: CatalogService,
// 注释：声明类属性或构造参数 catalog，类型为 CatalogService。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 76 行**

```text
  ) {}
// 注释：结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。
```

**源码第 78 行**

```text
  onModuleInit() {
// 注释：定义方法 onModuleInit；括号中声明参数，花括号内实现逻辑。
```

**源码第 80 行**

```text
    this.timer = setInterval(() => this.flushRobots(), 1000);
// 注释：把右侧表达式的结果写入 this.timer。 关键字：`this`＝当前对象实例。
```

**源码第 82 行**

```text
    this.timer.unref();
// 注释：调用 this.timer.unref，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 83 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 90 行**

```text
  onModuleDestroy() {
// 注释：定义方法 onModuleDestroy；括号中声明参数，花括号内实现逻辑。
```

**源码第 91 行**

```text
    if (this.timer) clearInterval(this.timer);
// 注释：判断 if (this.timer) clearInterval(this.timer); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例。
```

**源码第 92 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 94 行**

```text
  bufferRobotFrame(deviceCode: string, msg: any) {
// 注释：定义方法 bufferRobotFrame；括号中声明参数，花括号内实现逻辑。 关键字：`any`＝跳过静态类型检查。
```

**源码第 96 行**

```text
    const deviceId = this.catalog.deviceId(deviceCode);
// 注释：声明 deviceId，初始值由 this.catalog.deviceId(deviceCode) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 97 行**

```text
    if (deviceId === undefined) return;
// 注释：判断 if (deviceId === undefined) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。
```

**源码第 102 行**

```text
    if (this.robotBuffer.length >= 10000) {
// 注释：判断 if (this.robotBuffer.length >= 10000) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例。
```

**源码第 104 行**

```text
      this.robotBuffer.shift();
// 注释：调用 this.robotBuffer.shift，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 105 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 107 行**

```text
    this.robotBuffer.push({
// 注释：调用 this.robotBuffer.push，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 108 行**

```text
      time: toTime(msg),
// 注释：设置字段 `time`。
```

**源码第 109 行**

```text
      deviceId,
// 注释：把变量 deviceId 作为同名对象字段加入当前对象。
```

**源码第 110 行**

```text
      joints: msg.joints,
// 注释：设置字段 `joints`。
```

**源码第 111 行**

```text
      tcp: Array.isArray(msg.tcp) ? msg.tcp : null,
// 注释：设置字段 `tcp`。 关键字：`null`＝空值。
```

**源码第 112 行**

```text
      speedPct: msg.speedPct ?? null,
// 注释：设置字段 `speedPct`。 关键字：`null`＝空值。
```

**源码第 113 行**

```text
      mode: msg.mode ?? null,
// 注释：设置字段 `mode`。 关键字：`null`＝空值。
```

**源码第 114 行**

```text
      program: msg.program ?? null,
// 注释：设置字段 `program`。 关键字：`null`＝空值。
```

**源码第 115 行**

```text
      alarmCode: typeof msg.alarmCode === 'number' ? msg.alarmCode : 0,
// 注释：设置字段 `alarmCode`。 关键字：`typeof`＝读取值的运行时类型。
```

**源码第 116 行**

```text
    });
// 注释：结束当前回调或对象，并完成外层函数调用。
```

**源码第 117 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 123 行**

```text
  private flushRobots() {
// 注释：定义方法 flushRobots；括号中声明参数，花括号内实现逻辑。 关键字：`private`＝限定类内部访问。
```

**源码第 127 行**

```text
    const rows = this.robotBuffer.splice(0, this.robotBuffer.length);
// 注释：声明 rows，初始值由 this.robotBuffer.splice(0, this.robotBuffer.length) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 129 行**

```text
    if (rows.length === 0) return;
// 注释：判断 if (rows.length === 0) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 131 行**

```text
    const values: any[] = [];
// 注释：声明 values，初始值由 [] 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`any`＝跳过静态类型检查。
```

**源码第 133 行**

```text
    const tuple = rows
// 注释：声明 tuple，初始值由 rows 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 134 行**

```text
      .map((r, i) => {
// 注释：调用 .map，把括号中的值作为参数传入。
```

**源码第 135 行**

```text
        const o = i * 8;
// 注释：声明 o，初始值由 i * 8 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 137 行**

```text
        values.push(r.time, r.deviceId, r.joints, r.tcp, r.speedPct, r.mode, r.program, r.alarmCode);
// 注释：调用 values.push，把括号中的值作为参数传入。
```

**源码第 139 行**

```text
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})`;
// 注释：返回 `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8})` 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 140 行**

```text
      })
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 141 行**

```text
      .join(',');
// 注释：调用 .join，把括号中的值作为参数传入。
```

**源码第 146 行**

```text
    this.pool
// 注释：读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：`this`＝当前对象实例。
```

**源码第 147 行**

```text
      .query(
// 注释：调用 .query，把括号中的值作为参数传入。
```

**源码第 148 行**

```text
        `INSERT INTO robot_joint_states
// 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 149 行**

```text
           ("time", device_id, joints, tcp_pose, speed_pct, mode, program, alarm_code)
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 150 行**

```text
         VALUES ${tuple}`,
// 注释：列出待写入的值。 关键字：`VALUES`＝给出插入值。
```

**源码第 151 行**

```text
        values,
// 注释：把变量 values 作为同名对象字段加入当前对象。
```

**源码第 152 行**

```text
      )
// 注释：结束当前集合、分组或调用参数。
```

**源码第 155 行**

```text
      .catch((e: Error) =>
// 注释：调用 .catch，把括号中的值作为参数传入。 关键字：`catch`＝捕获异常。
```

**源码第 156 行**

```text
        this.logger.error(`批量写 robot_joint_states 失败,${rows.length} 行丢弃: ${e.message}`),
// 注释：调用 this.logger.error，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 157 行**

```text
      );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 158 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 165 行**

```text
  insertLineStatus(lineCode: string, msg: any) {
// 注释：定义方法 insertLineStatus；括号中声明参数，花括号内实现逻辑。 关键字：`any`＝跳过静态类型检查。
```

**源码第 167 行**

```text
    const lineId = this.catalog.lineId(lineCode);
// 注释：声明 lineId，初始值由 this.catalog.lineId(lineCode) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 168 行**

```text
    if (lineId === undefined) return;
// 注释：判断 if (lineId === undefined) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。
```

**源码第 170 行**

```text
    const t = toTime(msg);
// 注释：声明 t，初始值由 toTime(msg) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 174 行**

```text
    const args = [
// 注释：声明 args，初始值由 [ 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 175 行**

```text
      lineId, msg.state ?? 'idle', msg.productCode ?? null,
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`null`＝空值。
```

**源码第 176 行**

```text
      num(msg.goodCount), num(msg.ngCount), msg.beatMs ?? null, t,
// 注释：调用 num；括号中的表达式是传入的参数。 关键字：`null`＝空值。
```

**源码第 177 行**

```text
    ];
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 181 行**

```text
    const upsert = this.pool.query(
// 注释：声明 upsert，初始值由 this.pool.query( 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 182 行**

```text
      `INSERT INTO line_current_status (line_id, state, product_code, good_count, ng_count, beat_ms, updated_at)
// 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 183 行**

```text
       VALUES ($1,$2,$3,$4,$5,$6,$7)
// 注释：列出待写入的值。 关键字：`VALUES`＝给出插入值。
```

**源码第 184 行**

```text
       ON CONFLICT (line_id) DO UPDATE SET
// 注释：设置连接或冲突条件。 关键字：`ON`＝指定连接或冲突条件；`DO`＝执行匿名 SQL 代码块；`UPDATE`＝修改已有行；`SET`＝指定更新字段或配置值。
```

**源码第 185 行**

```text
         state = EXCLUDED.state, product_code = EXCLUDED.product_code,
// 注释：把右侧表达式的结果写入 state。
```

**源码第 186 行**

```text
         good_count = EXCLUDED.good_count, ng_count = EXCLUDED.ng_count,
// 注释：把右侧表达式的结果写入 good_count。
```

**源码第 187 行**

```text
         beat_ms = EXCLUDED.beat_ms, updated_at = EXCLUDED.updated_at`,
// 注释：把右侧表达式的结果写入 beat_ms。
```

**源码第 188 行**

```text
      args,
// 注释：把变量 args 作为同名对象字段加入当前对象。
```

**源码第 189 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 194 行**

```text
    const history = this.pool.query(
// 注释：声明 history，初始值由 this.pool.query( 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 195 行**

```text
      `INSERT INTO line_status_history ("time", line_id, state, product_code, good_count, ng_count, beat_ms)
// 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 196 行**

```text
       VALUES ($7,$1,$2,$3,$4,$5,$6)`,
// 注释：列出待写入的值。 关键字：`VALUES`＝给出插入值。
```

**源码第 197 行**

```text
      args,
// 注释：把变量 args 作为同名对象字段加入当前对象。
```

**源码第 198 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 200 行**

```text
    Promise.all([upsert, history]).catch((e: Error) =>
// 注释：调用 Promise.all，把括号中的值作为参数传入。 关键字：`catch`＝捕获异常。
```

**源码第 201 行**

```text
      this.logger.error(`写产线状态失败: ${e.message}`),
// 注释：调用 this.logger.error，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 202 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 203 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 210 行**

```text
  insertEvent(lineCode: string, msg: any) {
// 注释：定义方法 insertEvent；括号中声明参数，花括号内实现逻辑。 关键字：`any`＝跳过静态类型检查。
```

**源码第 211 行**

```text
    const lineId = this.catalog.lineId(lineCode);
// 注释：声明 lineId，初始值由 this.catalog.lineId(lineCode) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 212 行**

```text
    if (lineId === undefined) return;
// 注释：判断 if (lineId === undefined) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`undefined`＝未定义值；`return`＝返回结果并结束当前函数。
```

**源码第 214 行**

```text
    const deviceId = msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined;
// 注释：声明 deviceId，初始值由 msg.deviceId ? this.catalog.deviceId(msg.deviceId) : undefined 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例；`undefined`＝未定义值。
```

**源码第 215 行**

```text
    this.pool
// 注释：读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：`this`＝当前对象实例。
```

**源码第 216 行**

```text
      .query(
// 注释：调用 .query，把括号中的值作为参数传入。
```

**源码第 217 行**

```text
        `INSERT INTO production_events ("time", line_id, device_id, type, level, code, message, payload)
// 注释：写入数据。 关键字：`INSERT`＝写入新行；`INTO`＝指定写入目标。
```

**源码第 218 行**

```text
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
// 注释：列出待写入的值。 关键字：`VALUES`＝给出插入值。
```

**源码第 219 行**

```text
        [
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 220 行**

```text
          toTime(msg), lineId, deviceId ?? null, msg.type ?? 'custom', msg.level ?? 'info',
// 注释：调用 toTime；括号中的表达式是传入的参数。 关键字：`null`＝空值。
```

**源码第 221 行**

```text
          msg.code ?? null, msg.message ?? null, JSON.stringify(msg.payload ?? {}),
// 注释：调用 JSON.stringify；括号中的表达式是传入的参数。 关键字：`null`＝空值。
```

**源码第 222 行**

```text
        ],
// 注释：结束当前数组，继续外层表达式。
```

**源码第 223 行**

```text
      )
// 注释：结束当前集合、分组或调用参数。
```

**源码第 224 行**

```text
      .catch((e: Error) => this.logger.error(`写事件失败: ${e.message}`));
// 注释：调用 .catch，把括号中的值作为参数传入。 关键字：`catch`＝捕获异常；`this`＝当前对象实例。
```

**源码第 225 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 231 行**

```text
  ackCommand(msg: any) {
// 注释：定义方法 ackCommand；括号中声明参数，花括号内实现逻辑。 关键字：`any`＝跳过静态类型检查。
```

**源码第 233 行**

```text
    if (!msg.cmdId) return;
// 注释：判断 if (!msg.cmdId) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数。
```

**源码第 235 行**

```text
    if (!['acked', 'rejected', 'failed'].includes(msg.status)) {
// 注释：判断 if (!['acked', 'rejected', 'failed'].includes(msg.status)) { 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支。
```

**源码第 236 行**

```text
      this.logger.warn(`忽略非法指令回执状态: ${String(msg.status)}`);
// 注释：调用 this.logger.warn，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 237 行**

```text
      return;
// 注释：立即结束当前函数，不返回具体值。 关键字：`return`＝返回结果并结束当前函数。
```

**源码第 238 行**

```text
    }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 239 行**

```text
    this.pool
// 注释：读取 this.pool，作为下一行链式方法调用的接收对象。 关键字：`this`＝当前对象实例。
```

**源码第 240 行**

```text
      .query(
// 注释：调用 .query，把括号中的值作为参数传入。
```

**源码第 241 行**

```text
        `UPDATE control_commands
// 注释：修改数据。 关键字：`UPDATE`＝修改已有行。
```

**源码第 242 行**

```text
           SET status = $2, ack_payload = $3, acked_at = now()
// 注释：调用 now；括号中的表达式是传入的参数。
```

**源码第 243 行**

```text
         WHERE idempotency_key = $1 AND status IN ('pending','sent')`,
// 注释：限定处理范围。 关键字：`WHERE`＝限定目标行；`AND`＝逻辑与；`IN`＝检查是否属于集合。
```

**源码第 244 行**

```text
        [String(msg.cmdId), msg.status, JSON.stringify(msg)],
// 注释：开始当前表达式的分组或数组内容。
```

**源码第 245 行**

```text
      )
// 注释：结束当前集合、分组或调用参数。
```

**源码第 246 行**

```text
      .then((r) => {
// 注释：调用 .then，把括号中的值作为参数传入。
```

**源码第 248 行**

```text
        if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`);
// 注释：判断 if (r.rowCount === 0) this.logger.warn(`收到未知 cmdId 的 ack: ${msg.cmdId}`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例。
```

**源码第 249 行**

```text
      })
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 250 行**

```text
      .catch((e: Error) => this.logger.error(`更新指令回执失败: ${e.message}`));
// 注释：调用 .catch，把括号中的值作为参数传入。 关键字：`catch`＝捕获异常；`this`＝当前对象实例。
```

**源码第 251 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 252 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 260 行**

```text
function toTime(msg: any): Date {
// 注释：定义函数 `toTime`。 关键字：`function`＝定义函数；`any`＝跳过静态类型检查。
```

**源码第 261 行**

```text
  return typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date();
// 注释：返回 typeof msg?.ts === 'number' ? new Date(msg.ts) : new Date() 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`typeof`＝读取值的运行时类型；`new`＝创建对象实例。
```

**源码第 262 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 264 行**

```text
function num(v: any): number {
// 注释：定义函数 `num`。 关键字：`function`＝定义函数；`any`＝跳过静态类型检查。
```

**源码第 265 行**

```text
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
// 注释：返回 typeof v === 'number' && Number.isFinite(v) ? v : 0 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`typeof`＝读取值的运行时类型。
```

**源码第 266 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
