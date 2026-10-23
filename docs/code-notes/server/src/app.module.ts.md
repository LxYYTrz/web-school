# server/src/app.module.ts 逐行说明

[打开源码](../../../../server/src/app.module.ts) · 82 行 · 24 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 47 | <code>import { Module } from '@nestjs/common';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 49 | <code>import { InfraModule } from './infra/infra.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 51 | <code>import { StateModule } from './state/state.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 53 | <code>import { HistoryModule } from './history/history.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 55 | <code>import { RealtimeModule } from './realtime/realtime.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 57 | <code>import { IngestModule } from './ingest/ingest.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 59 | <code>import { CommandModule } from './command/command.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 60 | <code>import { AuthModule } from './auth/auth.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 61 | <code>import { UsersModule } from './users/users.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 62 | <code>import { AiModule } from './ai/ai.module';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 69 | <code>@Module({</code> | 使用装饰器声明框架元数据或参数注入。 |
| 70 | <code>imports: [</code> | 设置字段 `imports`。 |
| 71 | <code>InfraModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 72 | <code>StateModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 73 | <code>HistoryModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 74 | <code>RealtimeModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 75 | <code>IngestModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 76 | <code>CommandModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 77 | <code>AuthModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 78 | <code>UsersModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 79 | <code>AiModule,</code> | 续写当前表达式、对象、类型或调用。 |
| 80 | <code>],</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 81 | <code>})</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 82 | <code>export class AppModule {}</code> | 声明 `AppModule` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
