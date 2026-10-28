/**
 * 应用启动完成时可选的初始管理员引导，由 NestJS 调 onApplicationBootstrap。
 * 读取配置中的初始密码；未配置或 admin 已存在就跳过，首次创建时用 bcryptjs.hash 写入 app.app_users，级别为 3。
 * 这一步只建立账号档案，不登录任何浏览器；初始化失败记录日志。
 */
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';
import { config } from '../config/configuration';

// 首次启动自检:若 app.app_users 表为空且 ADMIN_PASSWORD 已配置,
// 自动创建一个 admin(level=3)账号,初始口令 = ADMIN_PASSWORD。
// 仅创建一次,生产部署后必须立即修改默认口令。
@Injectable()
export class UsersBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersBootstrapService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // 应用启动完成后检查是否需要创建初始 admin；没有配置密码或账号已存在就结束。
  // 真正创建时用 bcryptjs.hash 生成摘要，再 INSERT app.app_users；该账号尚未建立浏览器会话。
  async onApplicationBootstrap(): Promise<void> {
    const initialPwd = config.app.adminPassword;
    if (initialPwd === null || initialPwd === '') {
      this.logger.warn('未配置 ADMIN_PASSWORD,跳过默认 admin 引导;请手动创建首个管理员账号');
      return;
    }
    try {
      const { rows } = await this.pool.query(
        "SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1",
        // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
        ['admin'],
        // admin 是默认管理员账号名，此数组作为查询或写入的参数列表
      );
      if (rows.length > 0) {
        this.logger.log('默认 admin 已存在,跳过初始化');
        return;
      }

      // 初始化管理员时，将配置提供的初始密码交给 bcrypt.hash()，生成将来用于比对的密码摘要。
      // 10 是本次 hash 的工作因子，hash 才写入 app.app_users.password；登录时使用 bcrypt.compare() 验证输入。
      // 这段处于账号初始化分支，不表示每次启动都无条件覆盖已有账号或重设密码。

      const hash = await bcrypt.hash(initialPwd, 10);
      // 为初始管理员密码生成摘要，再由后续 SQL 保存到账号表，供登录时 bcrypt.compare 比对。
      // initialPwd 来自项目初始管理员密码配置；hash 是 bcryptjs 的库方法；10 是工作因子；数据库保存的是生成结果 hash。
      await this.pool.query(
        'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, 3)',
        // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
        // app.app_users 是保存应用登录账号的数据表；$1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
        ['admin', hash],
      );
      this.logger.warn(
        `已自动创建默认管理员 username=admin,初始口令来自 ADMIN_PASSWORD 环境变量;生产环境请立即通过用户管理页修改。`,
      );
    } catch (e) {
      const err = e as Error;
      this.logger.error(`admin 引导失败:${err.message}`);
    }
  }
}
