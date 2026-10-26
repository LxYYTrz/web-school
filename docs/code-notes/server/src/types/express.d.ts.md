# server/src/types/express.d.ts 逐行注释

[打开源码](../../../../../server/src/types/express.d.ts) · 17 行 · 14 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 2 行**

```text
import 'express';
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 3 行**

```text
import 'cookie-session';
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 5 行**

```text
declare module 'express-serve-static-core' {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 6 行**

```text
  interface Request {
// 注释：声明 `Request` 的结构。 关键字：`interface`＝定义类型接口。
```

**源码第 7 行**

```text
    session?: SessionData | null;
// 注释：声明 可选字段 session，类型为 SessionData | null。 关键字：`null`＝空值。
```

**源码第 8 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 9 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 11 行**

```text
declare module 'cookie-session' {
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 12 行**

```text
  interface SessionData {
// 注释：声明 `SessionData` 的结构。 关键字：`interface`＝定义类型接口。
```

**源码第 13 行**

```text
    username?: string;
// 注释：声明 可选字段 username，类型为 string。
```

**源码第 14 行**

```text
    level?: number;
// 注释：声明 可选字段 level，类型为 number。
```

**源码第 15 行**

```text
    loginAt?: number;
// 注释：声明 可选字段 loginAt，类型为 number。
```

**源码第 16 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 17 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
