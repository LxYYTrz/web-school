// 这一段负责配置和实现 server/src/auth/users-bootstrap.service.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Inject：NestJS 按指定令牌注入依赖的装饰器；Injectable：NestJS 把类注册为可注入服务的装饰器；Logger：NestJS 按模块名称记录日志的工具类；OnApplicationBootstrap：NestJS 应用启动完成回调接口
import * as bcrypt from 'bcryptjs';
// 从 bcryptjs 导入这一行列出的符号，供本文件调用。
// bcrypt：从 bcryptjs 导入的口令摘要与验证 API
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。
// Pool：pg 驱动提供的 PostgreSQL 连接池类
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。
// config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值

// 首次启动自检:若 app.app_users 表为空且 ADMIN_PASSWORD 已配置,
// 自动创建一个 admin(level=3)账号,初始口令 = ADMIN_PASSWORD。
// 仅创建一次,生产部署后必须立即修改默认口令。
// 这一段声明 UsersBootstrapService，用于UsersBootstrapService 的相关数据和行为。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class UsersBootstrapService implements OnApplicationBootstrap {
// 定义 UsersBootstrapService，约束或实现本模块涉及的数据和行为。
// OnApplicationBootstrap：NestJS 应用启动完成回调接口
  private readonly logger = new Logger(UsersBootstrapService.name);
  // 创建或使用NestJS 按模块名称记录日志的工具类。
  // logger：当前模块的日志记录器；Logger：NestJS 按模块名称记录日志的工具类；name：当前对象的名称字段

  // 这一段定义 constructor，用于初始化 users-bootstrap.service 使用的实例状态和依赖。
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // Inject：NestJS 按指定令牌注入依赖的装饰器；PG_POOL：infra/tokens 定义的数据库连接池注入令牌；pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类
  // 这一段提供了初始化 users-bootstrap.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 onApplicationBootstrap，用于在应用启动后检查初始管理员账号并按配置补建。
  async onApplicationBootstrap(): Promise<void> {
  // 定义方法 onApplicationBootstrap；括号中声明参数，花括号内实现逻辑。
  // onApplicationBootstrap：在应用启动后检查初始管理员账号并按配置补建；Promise：JavaScript 异步结果类型，表示操作将来完成或失败
    const initialPwd = config.app.adminPassword;
    // 根据 config.app.adminPassword 设置 initialPwd，供当前流程后续使用。
    // initialPwd：本处保存 config.app.adminPassword 的结果；config：configuration 模块导出的统一配置对象，读取环境变量并提供默认值；app：config 对象上的字段或操作；adminPassword：config.app 对象上的字段或操作
    if (initialPwd === null || initialPwd === '') {
    // 检查(initialPwd === null || initialPwd === '')，按判断结果进入对应的处理分支。
    // initialPwd：本处保存 config.app.adminPassword 的结果
      this.logger.warn('未配置 ADMIN_PASSWORD,跳过默认 admin 引导;请手动创建首个管理员账号');
      // 记录警告日志或显示警告提示，以接收对象为准。
      // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准
      return;
      // 立即结束当前函数，不返回具体值。
      // 当前函数在此处结束，调用方不会从这条路径收到业务数据
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    try {
    // 开始执行可能失败的操作，错误由后续异常分支处理。
    // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
      const { rows } = await this.pool.query(
      // 通过数据库连接池执行参数化查询。
      // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        "SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1",
        // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
        // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
        ['admin'],
        // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
        // admin 是默认管理员账号名，此数组作为查询或写入的参数列表
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      if (rows.length > 0) {
      // 检查(rows.length > 0)，按判断结果进入对应的处理分支。
      // rows：数据库查询结果中的记录数组；length：本处声明的字段或类型，类型为 number
        this.logger.log('默认 admin 已存在,跳过初始化');
        // 输出调试或运行日志。
        // logger：当前模块的日志记录器；log：输出调试或运行日志
        return;
        // 立即结束当前函数，不返回具体值。
        // 当前函数在此处结束，调用方不会从这条路径收到业务数据
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

      // 初始化管理员时，将配置提供的初始密码交给 bcrypt.hash()，生成将来用于比对的密码摘要。
      // 10 是本次 hash 的工作因子，hash 才写入 app.app_users.password；登录时使用 bcrypt.compare() 验证输入。
      // 这段处于账号初始化分支，不表示每次启动都无条件覆盖已有账号或重设密码。

      const hash = await bcrypt.hash(initialPwd, 10);
      // 使用 bcrypt 为口令生成摘要，将结果保存或写入 hash。
      // hash：本处保存 await bcrypt.hash(initialPwd, 10) 的结果；bcrypt：从 bcryptjs 导入的口令摘要与验证 API；initialPwd：本处保存 config.app.adminPassword 的结果
      await this.pool.query(
      // 通过数据库连接池执行参数化查询。
      // pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
        'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, 3)',
        // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
        // app.app_users 是保存应用登录账号的数据表；$1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
        ['admin', hash],
        // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
        // hash：本处保存 await bcrypt.hash(initialPwd, 10) 的结果
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      this.logger.warn(
      // 记录警告日志或显示警告提示，以接收对象为准。
      // logger：当前模块的日志记录器；warn：记录警告日志或显示警告提示，以接收对象为准
        `已自动创建默认管理员 username=admin,初始口令来自 ADMIN_PASSWORD 环境变量;生产环境请立即通过用户管理页修改。`,
        // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        // 这一行提供给外层调用的字符串参数或模板文本，其含义由所在函数及相邻参数确定
      );
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    } catch (e) {
    // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
    // e：本处保存的局部数据
      const err = e as Error;
      // 根据 e as Error 设置 err，供当前流程后续使用。
      // err：本处保存 e as Error 的结果；e：本处保存的局部数据；Error：标准错误对象类型
      this.logger.error(`admin 引导失败:${err.message}`);
      // 记录错误日志或显示失败提示，以接收对象为准。
      // logger：当前模块的日志记录器；error：记录错误日志或显示失败提示，以接收对象为准；err：本处保存 e as Error 的结果；message：消息正文或用于展示的结果说明
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了在应用启动后检查初始管理员账号并按配置补建的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/auth/users-bootstrap.service.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 UsersBootstrapService 的字段或服务能力，供项目其他模块使用。
