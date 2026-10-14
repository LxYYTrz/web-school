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

  // GET /api/users —— 按 visible_users 过滤后返回
  async list(me: SessionUser) {
    const { rows } = await this.pool.query(
      'SELECT username, level, created_at FROM app.app_users ORDER BY level DESC, username',
    );
    const all = rows.map((r) => ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date }));
    return { users: this.visibleUsers(me, all) };
  }

  // POST /api/users —— 仅管理员可创建(level=3)
  async create(me: SessionUser, dto: CreateUserDto): Promise<{ success: true; username: string }> {
    this.assertAdmin(me);
    const exists = await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]);
    if (exists.rowCount && exists.rowCount > 0) {
      throw new BadRequestException({ code: 409, msg: '用户名已存在' });
    }
    const hash = await bcrypt.hash(dto.password, 10);
    await this.pool.query(
      'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, $3)',
      [dto.username, hash, dto.level],
    );
    return { success: true, username: dto.username };
  }

  // PUT /api/users/:username —— 按 §B 规则校验后改密 / 改级
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
    const { rowCount } = await this.pool.query(
      `UPDATE app.app_users SET ${sets.join(', ')} WHERE username = $${args.length}`,
      args,
    );
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    return { success: true };
  }

  // DELETE /api/users/:username —— 仅管理员;禁止删除自己
  async remove(me: SessionUser, targetUsername: string) {
    this.assertAdmin(me);
    if (targetUsername === me.username) {
      throw new BadRequestException({ code: 400, msg: '不能删除自己的账号' });
    }
    const { rowCount } = await this.pool.query(
      'DELETE FROM app.app_users WHERE username = $1',
      [targetUsername],
    );
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    return { success: true };
  }

  // ===== 严格对照 1.0.1 can_change_pwd / visible_users =====

  private canChangePwd(me: SessionUser, target: { username: string; level: number }): boolean {
    if (me.level === 3) return true;
    if (me.level === 2) return target.username === me.username || target.level === 1;
    return target.username === me.username;
  }

  private visibleUsers<T extends { username: string; level: number }>(me: SessionUser, all: T[]): T[] {
    if (me.level === 3) return all;
    if (me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username);
    return all.filter((u) => u.username === me.username);
  }

  // ===== 工具方法 =====

  private assertAdmin(me: SessionUser) {
    if (me.level !== 3) {
      throw new ForbiddenException({ code: 403, msg: '权限不足,仅管理员可执行此操作' });
    }
  }

  private async fetchTarget(username: string): Promise<{ username: string; level: number } | null> {
    const { rows } = await this.pool.query(
      'SELECT username, level FROM app.app_users WHERE username = $1 LIMIT 1',
      [username],
    );
    if (rows.length === 0) return null;
    return { username: rows[0].username as string, level: rows[0].level as number };
  }
}
