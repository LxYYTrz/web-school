/**
 * ============================================================================
 * 文件作用：产线/设备「编码 → 数据库主键」映射缓存服务
 * 所属模块：server/src/infra/
 * ============================================================================
 *
 * 【它解决什么问题】
 *   数据契约规定：MQTT 报文和主题里用的是**人类可读的编码**（code）：
 *       主题  tl/v1/line-01/telemetry/robot/robot-01
 *       报文  { "deviceId": "robot-01" }
 *   而数据库表用的是**自增主键**（id）：
 *       production_lines(id=1, code='line-01')
 *       devices(id=2, code='robot-01', line_id=1)
 *   写入时必须把 code 换成 id（外键约束要求），所以需要一张映射表。
 *
 * 【为什么用内存 Map 缓存，而不是每次查库】
 *   机器人帧是 10Hz，每一帧都要查一次设备表的话，就是每秒 10 次 × N 个设备的
 *   无意义数据库查询。映射关系几乎不变（产线/设备很少增删），
 *   所以缓存在内存里，每 60 秒刷新一次即可 —— 新增产线无需重启服务。
 *
 * 【生命周期】
 *   onModuleInit   ：服务启动时立即加载一次（避免第一条消息查库）
 *   onModuleDestroy：服务关闭时清掉定时器，防止进程无法退出
 *
 * 【在数据流中的位置】
 *   MQTT 报文 ──(dispatch)──▶ ingest ──▶ history.insertLineStatus()
 *                                            │
 *                                            └──▶ catalog.lineId('line-01') ──▶ 1
 */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from './tokens';

// 产线/设备编码 → 数据库 id 的映射缓存。
// MQTT 报文里只有 code(见数据契约),入库前需要解析为外键 id。
/**
 * 编码映射服务。
 * OnModuleInit / OnModuleDestroy 是 NestJS 的生命周期钩子接口，
 * Nest 会在模块初始化/销毁时自动调用对应方法。
 */
@Injectable()
export class CatalogService implements OnModuleInit, OnModuleDestroy {
  // NestJS 日志器：会自动带上类名前缀，如 [CatalogService]
  private readonly logger = new Logger(CatalogService.name);
  // 产线映射：Map<code, id>，例如 'line-01' → 1
  private lines = new Map<string, number>();
  // 设备映射：Map<code, id>，例如 'robot-01' → 2
  private devices = new Map<string, number>();
  // 定时刷新句柄。类型 NodeJS.Timeout 是因为 setInterval 在 Node 环境下返回它
  // （在浏览器里返回 number，这是 TS 的 lib 差异）
  private timer?: NodeJS.Timeout;

  /**
   * 构造函数：由 Nest 注入 PG 连接池。
   * @Inject(PG_POOL) 显式指定令牌（因为 Pool 是类实例而非注入类）
   */
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    // 先加载一次：保证服务刚起来就能处理报文，不会因为映射空而丢数据
    await this.reload();
    // 每分钟刷新一次;新增产线/设备无需重启服务
    // 定时刷新：每 60 秒重载一次映射。
    // .catch 兜住异常，避免定时器里的 Promise 变成 unhandled rejection 导致进程崩溃
    this.timer = setInterval(() => {
      this.reload().catch((e: Error) => this.logger.error(`映射刷新失败: ${e.message}`));
    }, 60_000);
    // unref()：告诉 Node「这个定时器不算活跃句柄」。
    // 好处：即使忘了 clearInterval，进程也能正常退出（不会被定时器吊住）
    this.timer.unref();
  }

  /**
   * 模块销毁钩子：进程退出时调用，清理定时器。
   */
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async reload() {
    // 查产线表：只取 id 和 code 两列
    const lines = await this.pool.query('SELECT id, code FROM production_lines');
    // 查设备表：只取 id 和 code 两列
    const devices = await this.pool.query('SELECT id, code FROM devices');
    // 把查询结果转成 Map：rows.map(r => [String(r.code), Number(r.id)])
    // String/Number 强制转型 —— pg 返回的 bigint 是字符串，id 是 number
    this.lines = new Map(lines.rows.map((r) => [String(r.code), Number(r.id)]));
    this.devices = new Map(devices.rows.map((r) => [String(r.code), Number(r.id)]));
    // 打印加载结果，方便运维确认种子数据是否正确
    this.logger.log(`编码映射已加载:${this.lines.size} 条产线 / ${this.devices.size} 台设备`);
  }

  /**
   * 产线编码 → 数据库主键。
   * 找不到时打 warn 并返回 undefined（调用方负责放弃这条数据，而不是写脏数据）
   */
  lineId(code: string): number | undefined {
    const id = this.lines.get(code);
    // 找不到编码通常意味着：① 种子数据没执行；② 现场新增了产线但没同步数据库
    if (id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`);
    return id;
  }

  /**
   * 设备编码 → 数据库主键。逻辑同 lineId。
   */
  deviceId(code: string): number | undefined {
    const id = this.devices.get(code);
    if (id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`);
    return id;
  }
}
