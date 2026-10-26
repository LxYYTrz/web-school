// 经过 AuthGuard 校验后挂在 session 上的最小用户信息
export interface SessionUser {
// 声明 SessionUser 的结构。 关键字：export＝向其他模块开放符号；interface＝定义类型接口。
  username: string;
  // 设置字段 username。
  level: number;
  // 设置字段 level。
}
// 结束当前对象、函数或条件代码块。
