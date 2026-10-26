// 全局注入令牌(独立成文件,避免 infra.module ↔ catalog.service 循环引用)
// PostgreSQL 连接池的注入令牌（字符串常量，不是类）
// 这一段负责配置和实现 server/src/infra/tokens.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
export const PG_POOL = 'PG_POOL';
// 导出这一行声明的符号，供项目其他模块使用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌
// Redis 客户端的注入令牌
export const REDIS = 'REDIS';
// 导出这一行声明的符号，供项目其他模块使用。
// REDIS：infra/tokens 定义的 Redis 客户端注入令牌
// 这一段提供了配置和实现 server/src/infra/tokens.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
