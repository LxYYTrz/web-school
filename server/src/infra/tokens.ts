// 全局注入令牌(独立成文件,避免 infra.module ↔ catalog.service 循环引用)
// PostgreSQL 连接池的注入令牌（字符串常量，不是类）
export const PG_POOL = 'PG_POOL';
// Redis 客户端的注入令牌
export const REDIS = 'REDIS';
