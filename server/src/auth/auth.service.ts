/**
 * 由 AuthController.login 调用，核对本次用户名和密码。
 * verifyCredentials 按用户名查 app.app_users，用 bcryptjs.compare 比较输入密码与数据库摘要，再返回 username、level。
 * 缺少输入、账号不存在和比对失败都会抛 BadCredentials；数据库摘要不会回传给网页。
 */
import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';

// 登录鉴权:bcryptjs 校验口令,通过则返回 session 字段;失败抛 401
@Injectable()
export class AuthService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // 按 username 查 app.app_users，取出密码摘要和操作级别，再用 bcryptjs.compare 验证本次输入。
  // 成功只返回用户名和级别；输入缺失、无账号、密码不匹配都以 BadCredentials 结束，不还原数据库摘要。
  async verifyCredentials(username: string, password: string): Promise<{ username: string; level: number }> {
    if (!username || !password) {
      throw new BadCredentials();
    }
    const { rows } = await this.pool.query(
    // 按本次输入的用户名查询登录账号，取回密码摘要和级别，为下一步比对准备数据。
    // pool 是注入的 PostgreSQL 连接池；query 来自数据库客户端；rows 是查询结果数组，参数 username 通过下方 $1 占位符传入。
      'SELECT password, level FROM app.app_users WHERE username = $1 LIMIT 1',
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [username],
    );
    if (rows.length === 0) throw new BadCredentials();
    // 没有查到账号就终止登录，不继续读取摘要或建立会话。
    // rows.length 是匹配的账号记录数；BadCredentials 是项目定义的 HTTP 401 异常。
    const ok = await bcrypt.compare(password, rows[0].password as string);
    // 比较用户本次输入的密码与数据库保存的摘要，把匹配结果保存到 ok。
    // bcrypt 从 bcryptjs 导入，compare 是库方法；password 是本次输入，rows[0].password 是数据库摘要；as string 仅是 TypeScript 类型声明，不会解密或还原密码。
    if (!ok) throw new BadCredentials();
    // 密码比对不通过就终止登录，与账号不存在一样返回登录失败。
    // ok 是 bcrypt.compare 返回的布尔结果；只有它为 true，才会走到后面返回用户名与级别的语句。
    return { username, level: rows[0].level as number };
    // 把通过校验的用户名和数据库级别返回登录控制器，供它写入会话。
    // username 对应刚才查询的账号；level 来自数据库；返回值不含原始密码或密码摘要。
  }
}

import { UnauthorizedException } from '@nestjs/common';
class BadCredentials extends UnauthorizedException {
  constructor() {
    super({ code: 401, msg: '用户名或密码错误' });
  }
}
