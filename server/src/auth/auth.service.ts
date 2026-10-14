import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';

// 登录鉴权:bcryptjs 校验口令,通过则返回 session 字段;失败抛 401
@Injectable()
export class AuthService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async verifyCredentials(username: string, password: string): Promise<{ username: string; level: number }> {
    if (!username || !password) {
      throw new BadCredentials();
    }
    const { rows } = await this.pool.query(
      'SELECT password, level FROM app.app_users WHERE username = $1 LIMIT 1',
      [username],
    );
    if (rows.length === 0) throw new BadCredentials();
    const ok = await bcrypt.compare(password, rows[0].password as string);
    if (!ok) throw new BadCredentials();
    return { username, level: rows[0].level as number };
  }
}

import { UnauthorizedException } from '@nestjs/common';
class BadCredentials extends UnauthorizedException {
  constructor() {
    super({ code: 401, msg: '用户名或密码错误' });
  }
}
