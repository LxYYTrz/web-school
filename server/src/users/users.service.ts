/**
 * app.app_users 的查询、创建、修改和删除业务，由 UsersController 调用。
 * 创建和删除要求管理员；改级别、改密码、列表可见范围由不同方法判断，不能复用一种权限结论。
 * 密码先经 bcryptjs.hash 再写库；修改账号档案与当前浏览器已保存的 Cookie 会话是不同存储。
 */
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PG_POOL } from '../infra/tokens';
import type { SessionUser } from '../auth/session-user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// 三级权限规则(严格对照 origin/1.0.1 userServer/main.py)
@Injectable()
export class UsersService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // 查询账号列表后交 visibleUsers 按当前操作者过滤，再返回可见用户。
  // 返回用户名、级别和创建时间，不返回密码摘要。
  async list(me: SessionUser) {
    const { rows } = await this.pool.query(
      'SELECT username, level, created_at FROM app.app_users ORDER BY level DESC, username',
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源
    );
    const all = rows.map((r) => ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date }));
    return { users: this.visibleUsers(me, all) };
  }

  // 创建前先确认管理员与用户名未重复，再生成密码摘要并写入 app.app_users。
  // me 来自会话，dto 是新账号资料；成功只表示账号建立，不自动替新用户登录。
  async create(me: SessionUser, dto: CreateUserDto): Promise<{ success: true; username: string }> {
    this.assertAdmin(me);
    // 检查操作人是否达到用户管理所需的管理员级别。
    const exists = await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]);
    if (exists.rowCount && exists.rowCount > 0) {
      throw new BadRequestException({ code: 409, msg: '用户名已存在' });
    }
    const hash = await bcrypt.hash(dto.password, 10);
    // 1. dto.password 是创建表单提交的新账号密码，hash() 来自 bcryptjs。
    // 2. 第二个参数 10 是工作因子，影响摘要计算成本；返回的 hash 才写入账号表。
    // 3. 将来 AuthService 用 compare() 匹配输入与摘要，不需要还原密码。
    // 4. 管理员检查和重复账号检查已经在本方法前面执行，密码摘要不负责判断操作权限。
    await this.pool.query(
      'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, $3)',
      // app.app_users 是保存应用登录账号的数据表；$1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
      [dto.username, hash, dto.level],
    );
    return { success: true, username: dto.username };
  }

  // 按实际提供的新密码或新级别分别校验权限，检查目标存在后构造参数化 UPDATE。
  // sets 保存待更新的列与占位符，args 单独保存值；新增参数时按数组长度计算编号。
  async update(me: SessionUser, targetUsername: string, dto: UpdateUserDto) {
    if (dto.new_password === undefined && dto.new_level === undefined) {
      throw new BadRequestException({ code: 400, msg: '至少提供 new_password 或 new_level 其中一项' });
    }
    if (dto.new_level !== undefined && me.level !== 3) {
      throw new ForbiddenException({ code: 403, msg: '仅管理员可修改用户等级' });
    }
    const target = await this.fetchTarget(targetUsername);
    if (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' });

    if (dto.new_password !== undefined && !this.canChangePwd(me, target)) {
      throw new ForbiddenException({ code: 403, msg: '权限不足,无法修改该用户密码' });
    }

    const sets: string[] = [];
    const args: (string | number)[] = [];
    if (dto.new_password !== undefined) {
      const hash = await bcrypt.hash(dto.new_password, 10);
      sets.push('password = $' + (args.length + 1));
      args.push(hash);
    }
    if (dto.new_level !== undefined) {
      sets.push('level = $' + (args.length + 1));
      args.push(dto.new_level);
    }
    args.push(targetUsername);
    // 1. sets 已收集要更新的列和占位符，args 已按相同顺序收集对应的新值。
    // 2. 最后把目标用户名追加到 args，SQL 的最后一个占位符定位 WHERE username。
    // 3. 例如只改密码：$1 是新摘要，$2 是目标用户名；同时改级别时占位序号随数组长度变化。
    // 4. 参数值与 SQL 结构分别组织，不把用户名直接拼进 WHERE 文本。
    const { rowCount } = await this.pool.query(
      `UPDATE app.app_users SET ${sets.join(', ')} WHERE username = $${args.length}`,
      args,
    );
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    return { success: true };
  }

  // 删除账号要求管理员，同时拒绝删除操作者本人；找不到目标时返回错误。
  async remove(me: SessionUser, targetUsername: string) {
    this.assertAdmin(me);
    // 检查操作人是否达到用户管理所需的管理员级别。
    if (targetUsername === me.username) {
      throw new BadRequestException({ code: 400, msg: '不能删除自己的账号' });
    }
    const { rowCount } = await this.pool.query(
      'DELETE FROM app.app_users WHERE username = $1',
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；app.app_users 是保存应用登录账号的数据表；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [targetUsername],
    );
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    return { success: true };
  }

  // 只判断改密码范围：管理员可操作；level 2 可改自己或 level 1；其他仅改自己。
  // 这个结果不等于改级别、删除或列表可见权限，那些规则在各自方法中。
  private canChangePwd(me: SessionUser, target: { username: string; level: number }): boolean {
    if (me.level === 3) return true;
    if (me.level === 2) return target.username === me.username || target.level === 1;
    return target.username === me.username;
  }

  // 按操作者级别过滤显示范围；不修改数据库账号，也不调整当前会话级别。
  private visibleUsers<T extends { username: string; level: number }>(me: SessionUser, all: T[]): T[] {
    if (me.level === 3) return all;
    if (me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username);
    return all.filter((u) => u.username === me.username);
  }

  // 创建、删除等管理员操作在这里统一检查 me.level 是否为 3，不满足抛 403。
  private assertAdmin(me: SessionUser) {
    if (me.level !== 3) {
      throw new ForbiddenException({ code: 403, msg: '权限不足,仅管理员可执行此操作' });
    }
  }

  // 按用户名读取待修改账号的用户名和级别，未找到返回 null 供上层报告 404。
  private async fetchTarget(username: string): Promise<{ username: string; level: number } | null> {
    const { rows } = await this.pool.query(
      'SELECT username, level FROM app.app_users WHERE username = $1 LIMIT 1',
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [username],
    );
    if (rows.length === 0) return null;
    return { username: rows[0].username as string, level: rows[0].level as number };
  }
}
