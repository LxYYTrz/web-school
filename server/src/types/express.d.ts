// 给 Express Request 注入 cookie-session 的 session 字段类型
import 'express';
// 导入或导出模块符号。 关键字：import＝导入模块或符号。
import 'cookie-session';
// 导入或导出模块符号。 关键字：import＝导入模块或符号。

declare module 'express-serve-static-core' {
// 继续当前表达式；这一行的值由外层代码块或调用使用。
  interface Request {
  // 声明 Request 的结构。 关键字：interface＝定义类型接口。
    session?: SessionData | null;
    // 声明 可选字段 session，类型为 SessionData | null。 关键字：null＝空值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

declare module 'cookie-session' {
// 继续当前表达式；这一行的值由外层代码块或调用使用。
  interface SessionData {
  // 声明 SessionData 的结构。 关键字：interface＝定义类型接口。
    username?: string;
    // 声明 可选字段 username，类型为 string。
    level?: number;
    // 声明 可选字段 level，类型为 number。
    loginAt?: number;
    // 声明 可选字段 loginAt，类型为 number。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
