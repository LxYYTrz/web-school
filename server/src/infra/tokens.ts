/**
 * ============================================================================
 * 文件作用：全局注入令牌（Injection Token）定义
 * 所属模块：server/src/infra/
 * ============================================================================
 *
 * 【什么是注入令牌（Token）】
 *   NestJS 的依赖注入基于「类型」识别依赖。但当你要注入的东西不是一个类，
 *   而是一个「实例」（比如数据库连接池 Pool、Redis 客户端）时，没有类型可用。
 *   这时就用一个字符串（或 Symbol）作为「令牌」，在 provider 里用
 *   `provide: TOKEN` 声明「谁提供这个令牌」，在消费方用 `@Inject(TOKEN)` 声明
 *   「我要这个令牌」。
 *
 * 【为什么单独抽成文件】
 *   InfraModule 要 `provide: PG_POOL`（生产者），
 *   而 StateModule / HistoryModule 要 `@Inject(PG_POOL)`（消费者）。
 *   如果两者都写在 infra.module.ts 里，消费方 import infra.module.ts，
 *   而 infra.module.ts 又要 import 消费方（为了导出 CatalogService），
 *   就会形成 **循环依赖**。把常量单独放一个零依赖的文件，
 *   循环就被彻底切断了 —— 这就是本文件存在的唯一理由。
 *
 * 【对应关系】
 *   PG_POOL ──▶ 生产者：infra.module.ts 的 useFactory 创建 `new Pool(...)`
 *   REDIS   ──▶ 生产者：infra.module.ts 的 useFactory 创建 `new Redis(...)`
 */

// PostgreSQL 连接池的注入令牌（字符串常量，不是类）
export const PG_POOL = 'PG_POOL';
// Redis 客户端的注入令牌
export const REDIS = 'REDIS';
