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

  async onApplicationBootstrap(): Promise<void> {
    const initialPwd = config.app.adminPassword;
    if (initialPwd === null || initialPwd === '') {
      this.logger.warn('未配置 ADMIN_PASSWORD,跳过默认 admin 引导;请手动创建首个管理员账号');
      return;
    }
    try {
      const { rows } = await this.pool.query(
        "SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1",
        ['admin'],
      );
      if (rows.length > 0) {
        this.logger.log('默认 admin 已存在,跳过初始化');
        return;
      }
      const hash = await bcrypt.hash(initialPwd, 10);
      await this.pool.query(
        'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, 3)',
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
