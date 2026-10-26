import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import * as bcrypt from 'bcryptjs';
// 从 bcryptjs 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { CreateUserDto } from './dto/create-user.dto';
// 从 ./dto/create-user.dto 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { UpdateUserDto } from './dto/update-user.dto';
// 从 ./dto/update-user.dto 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 三级权限规则(严格对照 origin/1.0.1 userServer/main.py)
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class UsersService {
// 声明 UsersService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  // GET /api/users —— 按 visible_users 过滤后返回
  async list(me: SessionUser) {
  // 定义方法 list；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    const { rows } = await this.pool.query(
    // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      'SELECT username, level, created_at FROM app.app_users ORDER BY level DESC, username',
      // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
    );
    // 结束当前函数的参数列表并完成调用。
    const all = rows.map((r) => ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date }));
    // 声明 all，初始值由 rows.map((r) => ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date })) 计算得到。 关键字：const＝声明不可重新绑定的变量。
    return { users: this.visibleUsers(me, all) };
    // 返回 { users: this.visibleUsers(me, all) } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  // POST /api/users —— 仅管理员可创建(level=3)
  async create(me: SessionUser, dto: CreateUserDto): Promise<{ success: true; username: string }> {
  // 定义方法 create；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数；true＝布尔真值。
    this.assertAdmin(me);
    // 调用 this.assertAdmin，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    const exists = await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]);
    // 声明 exists，初始值由 await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
    if (exists.rowCount && exists.rowCount > 0) {
    // 判断 if (exists.rowCount && exists.rowCount > 0) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new BadRequestException({ code: 409, msg: '用户名已存在' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    const hash = await bcrypt.hash(dto.password, 10);
    // 声明 hash，初始值由 await bcrypt.hash(dto.password, 10) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    await this.pool.query(
    // 调用 this.pool.query，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成；this＝当前对象实例。
      'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, $3)',
      // 提供 SQL 语句，写入表 app.app_users 中的数据；实际参数由外层查询调用传入。
      [dto.username, hash, dto.level],
      // 开始当前表达式的分组或数组内容。
    );
    // 结束当前函数的参数列表并完成调用。
    return { success: true, username: dto.username };
    // 返回 { success: true, username: dto.username } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。

  // PUT /api/users/:username —— 按 §B 规则校验后改密 / 改级
  async update(me: SessionUser, targetUsername: string, dto: UpdateUserDto) {
  // 定义方法 update；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    if (dto.new_password === undefined && dto.new_level === undefined) {
    // 判断 if (dto.new_password === undefined && dto.new_level === undefined) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值。
      throw new BadRequestException({ code: 400, msg: '至少提供 new_password 或 new_level 其中一项' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    if (dto.new_level !== undefined && me.level !== 3) {
    // 判断 if (dto.new_level !== undefined && me.level !== 3) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值。
      throw new ForbiddenException({ code: 403, msg: '仅管理员可修改用户等级' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    const target = await this.fetchTarget(targetUsername);
    // 声明 target，初始值由 await this.fetchTarget(targetUsername) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
    if (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' });
    // 判断 if (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' }); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。

    if (dto.new_password !== undefined && !this.canChangePwd(me, target)) {
    // 判断 if (dto.new_password !== undefined && !this.canChangePwd(me, target)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值；this＝当前对象实例。
      throw new ForbiddenException({ code: 403, msg: '权限不足,无法修改该用户密码' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。

    const sets: string[] = [];
    // 声明 sets，初始值由 [] 计算得到。 关键字：const＝声明不可重新绑定的变量。
    const args: (string | number)[] = [];
    // 声明 args，初始值由 [] 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (dto.new_password !== undefined) {
    // 判断 if (dto.new_password !== undefined) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值。
      const hash = await bcrypt.hash(dto.new_password, 10);
      // 声明 hash，初始值由 await bcrypt.hash(dto.new_password, 10) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      sets.push('password = $' + (args.length + 1));
      // 调用 sets.push，把括号中的值作为参数传入。
      args.push(hash);
      // 调用 args.push，把括号中的值作为参数传入。
    }
    // 结束当前对象、函数或条件代码块。
    if (dto.new_level !== undefined) {
    // 判断 if (dto.new_level !== undefined) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；undefined＝未定义值。
      sets.push('level = $' + (args.length + 1));
      // 调用 sets.push，把括号中的值作为参数传入。
      args.push(dto.new_level);
      // 调用 args.push，把括号中的值作为参数传入。
    }
    // 结束当前对象、函数或条件代码块。
    args.push(targetUsername);
    // 调用 args.push，把括号中的值作为参数传入。
    const { rowCount } = await this.pool.query(
    // 从右侧结果中取出 rowCount，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      `UPDATE app.app_users SET ${sets.join(', ')} WHERE username = $${args.length}`,
      // 修改数据。
      args,
      // 把变量 args 作为同名对象字段加入当前对象。
    );
    // 结束当前函数的参数列表并完成调用。
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    // 判断 if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' }); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。
    return { success: true };
    // 返回 { success: true } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。

  // DELETE /api/users/:username —— 仅管理员;禁止删除自己
  async remove(me: SessionUser, targetUsername: string) {
  // 定义方法 remove；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    this.assertAdmin(me);
    // 调用 this.assertAdmin，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    if (targetUsername === me.username) {
    // 判断 if (targetUsername === me.username) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new BadRequestException({ code: 400, msg: '不能删除自己的账号' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    const { rowCount } = await this.pool.query(
    // 从右侧结果中取出 rowCount，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      'DELETE FROM app.app_users WHERE username = $1',
      // 提供 SQL 语句，删除表 app.app_users 中的数据；实际参数由外层查询调用传入。
      [targetUsername],
      // 开始当前表达式的分组或数组内容。
    );
    // 结束当前函数的参数列表并完成调用。
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    // 判断 if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' }); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。
    return { success: true };
    // 返回 { success: true } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。

  // ===== 严格对照 1.0.1 can_change_pwd / visible_users =====

  private canChangePwd(me: SessionUser, target: { username: string; level: number }): boolean {
  // 定义方法 canChangePwd；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问。
    if (me.level === 3) return true;
    // 判断 if (me.level === 3) return true; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；true＝布尔真值。
    if (me.level === 2) return target.username === me.username || target.level === 1;
    // 判断 if (me.level === 2) return target.username === me.username || target.level === 1; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    return target.username === me.username;
    // 返回 target.username === me.username 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。

  private visibleUsers<T extends { username: string; level: number }>(me: SessionUser, all: T[]): T[] {
  // 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：private＝限定类内部访问；extends＝继承父类。
    if (me.level === 3) return all;
    // 判断 if (me.level === 3) return all; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    if (me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username);
    // 判断 if (me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    return all.filter((u) => u.username === me.username);
    // 返回 all.filter((u) => u.username === me.username) 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。

  // ===== 工具方法 =====

  private assertAdmin(me: SessionUser) {
  // 定义方法 assertAdmin；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问。
    if (me.level !== 3) {
    // 判断 if (me.level !== 3) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new ForbiddenException({ code: 403, msg: '权限不足,仅管理员可执行此操作' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  private async fetchTarget(username: string): Promise<{ username: string; level: number } | null> {
  // 定义方法 fetchTarget；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问；async＝声明异步函数；null＝空值。
    const { rows } = await this.pool.query(
    // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      'SELECT username, level FROM app.app_users WHERE username = $1 LIMIT 1',
      // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
      [username],
      // 开始当前表达式的分组或数组内容。
    );
    // 结束当前函数的参数列表并完成调用。
    if (rows.length === 0) return null;
    // 判断 if (rows.length === 0) return null; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；null＝空值。
    return { username: rows[0].username as string, level: rows[0].level as number };
    // 返回 { username: rows[0].username as string, level: rows[0].level as number } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
