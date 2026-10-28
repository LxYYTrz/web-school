/**
 * 声明后端各接口共用的会话用户结构，字段来自成功登录时保存的信息。
 * 这是 TypeScript 类型约定；实际会话内容由 AuthGuard 和具体业务入口检查。
 */
// 经过 AuthGuard 校验后挂在 session 上的最小用户信息
export interface SessionUser {
  username: string;
  level: number;
}
