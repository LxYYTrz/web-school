import { Inject, Injectable } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import * as bcrypt from 'bcryptjs';
// 从 bcryptjs 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 登录鉴权:bcryptjs 校验口令,通过则返回 session 字段;失败抛 401
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class AuthService {
// 声明 AuthService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  async verifyCredentials(username: string, password: string): Promise<{ username: string; level: number }> {
  // 定义方法 verifyCredentials；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数。
    if (!username || !password) {
    // 判断 if (!username || !password) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new BadCredentials();
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    const { rows } = await this.pool.query(
    // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
      'SELECT password, level FROM app.app_users WHERE username = $1 LIMIT 1',
      // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
      [username],
      // 开始当前表达式的分组或数组内容。
    );
    // 结束当前函数的参数列表并完成调用。
    if (rows.length === 0) throw new BadCredentials();
    // 判断 if (rows.length === 0) throw new BadCredentials(); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。
    const ok = await bcrypt.compare(password, rows[0].password as string);
    // 声明 ok，初始值由 await bcrypt.compare(password, rows[0].password as string) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    if (!ok) throw new BadCredentials();
    // 判断 if (!ok) throw new BadCredentials(); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；throw＝抛出错误；new＝创建对象实例。
    return { username, level: rows[0].level as number };
    // 返回 { username, level: rows[0].level as number } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

import { UnauthorizedException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
class BadCredentials extends UnauthorizedException {
// 声明 BadCredentials 的结构。 关键字：class＝定义类；extends＝继承父类。
  constructor() {
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。
    super({ code: 401, msg: '用户名或密码错误' });
    // 调用 super；括号中的表达式是传入的参数。 关键字：super＝父类实现。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
