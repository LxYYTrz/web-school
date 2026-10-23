# server/src/types/express.d.ts 逐行说明

[打开源码](../../../../../server/src/types/express.d.ts) · 17 行 · 14 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 2 | <code>import 'express';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 3 | <code>import 'cookie-session';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 5 | <code>declare module 'express-serve-static-core' {</code> | 续写当前表达式、对象、类型或调用。 |
| 6 | <code>interface Request {</code> | 声明 `Request` 的结构。 关键字：`interface`＝定义类型接口。 |
| 7 | <code>session?: SessionData &#124; null;</code> | 续写当前表达式、对象、类型或调用。 关键字：`null`＝空值。 |
| 8 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 9 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 11 | <code>declare module 'cookie-session' {</code> | 续写当前表达式、对象、类型或调用。 |
| 12 | <code>interface SessionData {</code> | 声明 `SessionData` 的结构。 关键字：`interface`＝定义类型接口。 |
| 13 | <code>username?: string;</code> | 续写当前表达式、对象、类型或调用。 |
| 14 | <code>level?: number;</code> | 续写当前表达式、对象、类型或调用。 |
| 15 | <code>loginAt?: number;</code> | 续写当前表达式、对象、类型或调用。 |
| 16 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 17 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
