// 这一段负责后端登录认证服务，查询用户并比对口令摘要，为后续代码提供当前文件的处理入口。
import { Inject, Injectable } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Inject：NestJS 按指定令牌注入依赖的装饰器；Injectable：NestJS 把类注册为可注入服务的装饰器
import * as bcrypt from 'bcryptjs';
// 从 bcryptjs 导入这一行列出的符号，供本文件调用。
// bcrypt：从 bcryptjs 导入的口令摘要与验证 API
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。
// Pool：pg 驱动提供的 PostgreSQL 连接池类
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌

// 登录鉴权:bcryptjs 校验口令,通过则返回 session 字段;失败抛 401
// 这一段声明 AuthService，用于后端登录认证服务，查询用户并比对口令摘要。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class AuthService {
// 定义 AuthService，约束或实现本模块涉及的数据和行为。
// AuthService：后端登录认证服务，查询用户并比对口令摘要
  // 这一段定义 constructor，用于初始化 auth.service 使用的实例状态和依赖。
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // Inject：NestJS 按指定令牌注入依赖的装饰器；PG_POOL：infra/tokens 定义的数据库连接池注入令牌；pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类
  // 这一段提供了初始化 auth.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 verifyCredentials，用于查询账号并校验口令摘要，返回可写入登录会话的用户信息。

  // 这是登录凭据验证：按 username 查询 app.app_users，得到数据库保存的密码摘要和操作级别。
  // bcrypt.compare() 将本次输入密码与摘要匹配，不需要把摘要还原成原密码；账号不存在或不匹配都返回登录失败。
  // 验证成功返回 username、level，AuthController 才据此建立会话。这里不把数据库密码摘要回传给浏览器。

  async verifyCredentials(username: string, password: string): Promise<{ username: string; level: number }> {
  // 按用户名查询账号并验证输入密码，成功后返回可建立会话的用户名与级别。
  // username、password 来自登录请求；pool 查询 app.app_users；bcrypt.compare() 将输入密码与数据库摘要匹配，不还原原密码。
    if (!username || !password) {
    // 检查(!username || !password)，按判断结果进入对应的处理分支。
    // username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象
      throw new BadCredentials();
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // BadCredentials：本文件定义的登录失败异常，向调用方返回 HTTP 401
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const { rows } = await this.pool.query(
    // 通过数据库连接池执行参数化查询。
    // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      'SELECT password, level FROM app.app_users WHERE username = $1 LIMIT 1',
      // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [username],
      // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
      // username：账号用户名
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (rows.length === 0) throw new BadCredentials();
    // 条件 (rows.length === 0) throw new BadCredentials(); 成立时按本行给出的错误终止处理。
    // rows：数据库查询结果中的记录数组；length：本处声明的字段或类型，类型为 number；BadCredentials：本文件定义的登录失败异常，向调用方返回 HTTP 401
    const ok = await bcrypt.compare(password, rows[0].password as string);
    // 比对明文口令和数据库摘要，将结果保存或写入 ok。
    // ok：操作是否成功的布尔结果；bcrypt：从 bcryptjs 导入的口令摘要与验证 API；compare：使用 bcrypt 验证明文口令与已保存摘要是否匹配；password：登录口令或数据库保存的口令摘要，具体取决于所在对象；rows：数据库查询结果中的记录数组
    if (!ok) throw new BadCredentials();
    // 条件 (!ok) throw new BadCredentials(); 成立时按本行给出的错误终止处理。
    // ok：操作是否成功的布尔结果；BadCredentials：本文件定义的登录失败异常，向调用方返回 HTTP 401
    return { username, level: rows[0].level as number };
    // 把{ username, level: rows[0].level as number }作为当前函数的结果返回。
    // username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分；rows：数据库查询结果中的记录数组
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了查询账号并校验口令摘要，返回可写入登录会话的用户信息的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 AuthService 的字段或服务能力，供项目其他模块使用。

import { UnauthorizedException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// UnauthorizedException：NestJS 表示未登录或凭据错误的 HTTP 401 异常
// 这一段声明 BadCredentials，用于本文件定义的登录失败异常，向调用方返回 HTTP 401。
class BadCredentials extends UnauthorizedException {
// 定义 BadCredentials，约束或实现本模块涉及的数据和行为。
// BadCredentials：本文件定义的登录失败异常，向调用方返回 HTTP 401；UnauthorizedException：NestJS 表示未登录或凭据错误的 HTTP 401 异常
  // 这一段定义 constructor，用于初始化 auth.service 使用的实例状态和依赖。
  constructor() {
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // constructor 是类实例创建时执行的初始化方法；括号内声明构造参数
    super({ code: 401, msg: '用户名或密码错误' });
    // 调用父类构造函数，完成继承类的基础初始化。
    // code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了初始化 auth.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端登录认证服务，查询用户并比对口令摘要所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 BadCredentials 的字段或服务能力，供项目其他模块使用。
