// 全局注入令牌(独立成文件,避免 infra.module ↔ catalog.service 循环引用)
// PostgreSQL 连接池的注入令牌（字符串常量，不是类）
export const PG_POOL = 'PG_POOL';
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
// Redis 客户端的注入令牌
export const REDIS = 'REDIS';
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。
