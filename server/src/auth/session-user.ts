// 经过 AuthGuard 校验后挂在 session 上的最小用户信息
// 这一段负责配置和实现 server/src/auth/session-user.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
// 这一段声明 SessionUser，用于项目定义的登录用户结构，保存用户名和操作级别。
export interface SessionUser {
// 定义 SessionUser，约束或实现本模块涉及的数据和行为。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别
  username: string;
  // 声明或设置 username，用于账号用户名。
  // username：账号用户名
  level: number;
  // 声明或设置 level，用于用户操作级别或事件严重级别，依据当前接口结构区分。
  // level：用户操作级别或事件严重级别，依据当前接口结构区分
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/auth/session-user.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 SessionUser 的字段或服务能力，供项目其他模块使用。
