import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import * as bcrypt from 'bcryptjs';
// 从 bcryptjs 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 首次启动自检:若 app.app_users 表为空且 ADMIN_PASSWORD 已配置,
// 自动创建一个 admin(level=3)账号,初始口令 = ADMIN_PASSWORD。
// 仅创建一次,生产部署后必须立即修改默认口令。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class UsersBootstrapService implements OnApplicationBootstrap {
// 声明 UsersBootstrapService 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  private readonly logger = new Logger(UsersBootstrapService.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  async onApplicationBootstrap(): Promise<void> {
  // 定义方法 onApplicationBootstrap；括号中声明参数，花括号内实现逻辑。 关键字：async＝声明异步函数；void＝表示没有返回值。
    const initialPwd = config.app.adminPassword;
    // 声明 initialPwd，初始值由 config.app.adminPassword 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (initialPwd === null || initialPwd === '') {
    // 判断 if (initialPwd === null || initialPwd === '') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；null＝空值。
      this.logger.warn('未配置 ADMIN_PASSWORD,跳过默认 admin 引导;请手动创建首个管理员账号');
      // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      return;
      // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。
    try {
    // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
      const { rows } = await this.pool.query(
      // 从右侧结果中取出 rows，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；this＝当前对象实例。
        "SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1",
        // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
        ['admin'],
        // 开始当前表达式的分组或数组内容。
      );
      // 结束当前函数的参数列表并完成调用。
      if (rows.length > 0) {
      // 判断 if (rows.length > 0) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        this.logger.log('默认 admin 已存在,跳过初始化');
        // 调用 this.logger.log，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        return;
        // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
      }
      // 结束当前对象、函数或条件代码块。
      const hash = await bcrypt.hash(initialPwd, 10);
      // 声明 hash，初始值由 await bcrypt.hash(initialPwd, 10) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
      await this.pool.query(
      // 调用 this.pool.query，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成；this＝当前对象实例。
        'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, 3)',
        // 提供 SQL 语句，写入表 app.app_users 中的数据；实际参数由外层查询调用传入。
        ['admin', hash],
        // 开始当前表达式的分组或数组内容。
      );
      // 结束当前函数的参数列表并完成调用。
      this.logger.warn(
      // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
        `已自动创建默认管理员 username=admin,初始口令来自 ADMIN_PASSWORD 环境变量;生产环境请立即通过用户管理页修改。`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用。
      );
      // 结束当前函数的参数列表并完成调用。
    } catch (e) {
    // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
      const err = e as Error;
      // 声明 err，初始值由 e as Error 计算得到。 关键字：const＝声明不可重新绑定的变量。
      this.logger.error(`admin 引导失败:${err.message}`);
      // 调用 this.logger.error，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
