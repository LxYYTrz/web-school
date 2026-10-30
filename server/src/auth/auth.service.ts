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
    // 1. pool 是通过 PG_POOL 注入的 pg 连接池，query 是库提供的参数化查询方法。
    // 2. SQL 选择 app.app_users 的 password 和 level，WHERE username=$1 限定这次输入的账号。
    // 3. [username] 单独提供 $1 的值，不把输入直接拼进 SQL 文本。
    // 4. 左侧 { rows } 从查询结果取记录数组，没有记录时后面按登录失败处理。
      'SELECT password, level FROM app.app_users WHERE username = $1 LIMIT 1',
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [username],
    );
    if (rows.length === 0) throw new BadCredentials();
    // 没有查到账号就终止登录，不继续读取摘要或建立会话。
    // rows.length 是匹配的账号记录数；BadCredentials 是项目定义的 HTTP 401 异常。
    // 【调用各部分：部分 / 作用】
    // 部分 | 作用
    // bcrypt | 从 bcryptjs 导入的密码摘要工具。
    // password | 用户本次输入的密码。
    // rows[0].password | 数据库保存的摘要，不需要还原原始密码。
    // as string | TypeScript 类型断言，不会解密或执行运行时转换。
    // await、ok | 等待匹配结果并取得布尔值，后面据此允许或拒绝登录。
    const ok = await bcrypt.compare(password, rows[0].password as string);
    // 1. bcrypt 从 bcryptjs 导入；compare() 是专门的密码匹配方法。
    // 2. 第一个参数 password 是用户这次输入，第二个参数是数据库已有的密码摘要。
    // 3. 方法返回布尔结果，await 等它完成，再由下一条 if 决定是否拒绝登录。
    // 4. as string 是编译期类型声明，不会解密数据库内容，也不会把任意值真正转换成字符串。
    // 5. 项目不需要把摘要还原成原密码；成功后只返回用户名和级别。
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
