// 给 Express Request 注入 cookie-session 的 session 字段类型
// 这一段负责配置和实现 server/src/types/express.d.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import 'express';
// 从 express 加载本文件需要的对象，供后续处理使用。
// express 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
import 'cookie-session';
// 从 cookie-session 加载本文件需要的对象，供后续处理使用。
// cookie-session 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用

declare module 'express-serve-static-core' {
// 扩展指定依赖包的 TypeScript 模块声明，使项目字段获得类型检查。
// express-serve-static-core 是要扩展类型定义的现有模块；下面追加它的请求或会话字段
  // 这一段声明 Request，用于Request 的相关数据和行为。
  interface Request {
  // 定义 Request，约束或实现本模块涉及的数据和行为。
  // Request 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
    session?: SessionData | null;
    // 声明或设置 session，用于HTTP 登录会话对象。
    // session：HTTP 登录会话对象
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段定义了 Request 的字段或服务能力，供项目其他模块使用。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

declare module 'cookie-session' {
// 扩展指定依赖包的 TypeScript 模块声明，使项目字段获得类型检查。
// cookie-session 是要扩展类型定义的现有模块；下面追加它的请求或会话字段
  // 这一段声明 SessionData，用于SessionData 的相关数据和行为。
  interface SessionData {
  // 定义 SessionData，约束或实现本模块涉及的数据和行为。
  // SessionData 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
    username?: string;
    // 声明或设置 username，用于账号用户名。
    // username：账号用户名
    level?: number;
    // 声明或设置 level，用于用户操作级别或事件严重级别，依据当前接口结构区分。
    // level：用户操作级别或事件严重级别，依据当前接口结构区分
    loginAt?: number;
    // 声明或设置 loginAt，用于当前对象或接口的对应数据。
    // loginAt：本处声明的字段或类型，类型为 number
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段定义了 SessionData 的字段或服务能力，供项目其他模块使用。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/types/express.d.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
