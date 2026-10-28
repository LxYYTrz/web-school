/**
 * 给 Express Request 补充项目使用的会话类型，使控制器和守卫可读取 username、level 等字段。
 * 类型扩展只服务编译检查；运行时 session 对象由 main.ts 中间件提供。
 */
// 给 Express Request 注入 cookie-session 的 session 字段类型
import 'express';
// 从 express 加载本文件需要的对象，供后续处理使用。
// express 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用
import 'cookie-session';
// 从 cookie-session 加载本文件需要的对象，供后续处理使用。
// cookie-session 在导入时执行自身初始化；本行只需要其全局样式、元数据或配置副作用

declare module 'express-serve-static-core' {
// 扩展指定依赖包的 TypeScript 模块声明，使项目字段获得类型检查。
// express-serve-static-core 是要扩展类型定义的现有模块；下面追加它的请求或会话字段
  interface Request {
  // Request 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
    session?: SessionData | null;
  }
}

declare module 'cookie-session' {
// 扩展指定依赖包的 TypeScript 模块声明，使项目字段获得类型检查。
// cookie-session 是要扩展类型定义的现有模块；下面追加它的请求或会话字段
  interface SessionData {
  // SessionData 是本文件定义的数据契约名称；下方字段或联合类型约束可用值
    username?: string;
    level?: number;
    loginAt?: number;
  }
}
