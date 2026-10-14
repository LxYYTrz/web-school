// 给 Express Request 注入 cookie-session 的 session 字段类型
import 'express';
import 'cookie-session';

declare module 'express-serve-static-core' {
  interface Request {
    session?: SessionData | null;
  }
}

declare module 'cookie-session' {
  interface SessionData {
    username?: string;
    level?: number;
    loginAt?: number;
  }
}
