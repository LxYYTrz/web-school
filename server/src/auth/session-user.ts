// 经过 AuthGuard 校验后挂在 session 上的最小用户信息
export interface SessionUser {
  username: string;
  level: number;
}
