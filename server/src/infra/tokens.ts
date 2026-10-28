/**
 * 定义后端依赖注入令牌 PG_POOL、REDIS，供 InfraModule 注册及业务服务 @Inject 使用。
 * 令牌用于区分依赖，实际数据库与 Redis 连接由 infra.module.ts 的工厂创建。
 */
// 全局注入令牌(独立成文件,避免 infra.module ↔ catalog.service 循环引用)
// PostgreSQL 连接池的注入令牌（字符串常量，不是类）
export const PG_POOL = 'PG_POOL';
// Redis 客户端的注入令牌
export const REDIS = 'REDIS';
