// 全局注入令牌(独立成文件,避免 infra.module ↔ catalog.service 循环引用)
export const PG_POOL = 'PG_POOL';
export const REDIS = 'REDIS';
