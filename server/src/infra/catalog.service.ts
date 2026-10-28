/**
 * 后端进程内的基础目录，将 production_lines/devices 的业务 code 对应到数据库内部 id。
 * 启动 onModuleInit 先 reload，再每 60 秒刷新；lineId/deviceId 方法供历史与控制路径查编号。
 * Map 属于后端进程内存，与 Redis 最新快照不同；未找到编码返回 undefined，由调用方决定如何结束该路径。
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

  // NestJS 启动时先完整加载编码目录，再建立 60 秒刷新计时器。
  // 首次加载失败会影响初始化；后续定时刷新失败记录错误，不能把旧目录视为数据库实时内容。
  async onModuleInit() {
    // 先加载一次：保证服务刚起来就能处理报文，不会因为映射空而丢数据

    // 模块启动时先等待 reload() 载入数据库基础档案，再每 60 秒重新加载映射。
    // 这份目录用于把消息中的 line-01、robot-01 等业务编码对应到数据库内部 id，避免每帧都重复查相同档案。
    // 目录保存在 NestJS 进程的 Map 中，和 Redis 的现场快照是不同位置、不同用途的缓存。

    await this.reload();
    // 重新加载产线和设备编码到主键的目录映射。
    // 每分钟刷新一次;新增产线/设备无需重启服务
    // 定时刷新：每 60 秒重载一次映射。
    // .catch 兜住异常，避免定时器里的 Promise 变成 unhandled rejection 导致进程崩溃
    this.timer = setInterval(() => {
      this.reload().catch((e: Error) => this.logger.error(`映射刷新失败: ${e.message}`));
      // 重新加载产线和设备编码到主键的目录映射。
    }, 60_000);
    // 好处：即使忘了 clearInterval，进程也能正常退出（不会被定时器吊住）
    this.timer.unref();
    // 使计时器不再单独阻止 Node.js 进程退出。
  }

  /**
   * 模块销毁钩子：进程退出时调用，清理定时器。
   */
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // 查询产线和设备基础表的 id、code，重新建立两份 code → 内部 id 的 Map。
  // Map 是本进程中的目录，供历史写入与控制校验复用，不是 Redis 的现场状态。
  async reload() {
    // 查产线表：只取 id 和 code 两列

    // 从 production_lines 和 devices 读取 id、code，分别重建产线与设备的 code → id 映射。
    // 例如教学数据 line-01 → 1、robot-01 → 2；实际编号取决于数据库记录，不能根据编码末尾数字推算。
    // 历史写入和命令服务使用这份目录进行关联；调用方遇到查不到的编码时按各自分支返回或放弃该条处理。

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

  // 按产线业务编码查内部主键，未知编码记录警告并返回 undefined。
  lineId(code: string): number | undefined {
    const id = this.lines.get(code);
    // 找不到编码通常意味着：① 种子数据没执行；② 现场新增了产线但没同步数据库
    if (id === undefined) this.logger.warn(`未知产线编码: ${code}(检查 production_lines 种子数据)`);
    return id;
  }

  // 按设备业务编码查内部主键，未知编码记录警告并返回 undefined。
  deviceId(code: string): number | undefined {
    const id = this.devices.get(code);
    if (id === undefined) this.logger.warn(`未知设备编码: ${code}(检查 devices 种子数据)`);
    return id;
  }
}
