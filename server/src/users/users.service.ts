// 这一段负责后端用户管理服务，执行账号权限校验与增删改查，为后续代码提供当前文件的处理入口。
import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Inject：NestJS 按指定令牌注入依赖的装饰器；Injectable：NestJS 把类注册为可注入服务的装饰器；NotFoundException：NestJS 表示目标不存在的 HTTP 404 异常；ForbiddenException：NestJS 表示操作权限不足的 HTTP 403 异常；BadRequestException：NestJS 表示请求参数错误的 HTTP 400 异常
import * as bcrypt from 'bcryptjs';
// 从 bcryptjs 导入这一行列出的符号，供本文件调用。
// bcrypt：从 bcryptjs 导入的口令摘要与验证 API
import { Pool } from 'pg';
// 从 pg 导入这一行列出的符号，供本文件调用。
// Pool：pg 驱动提供的 PostgreSQL 连接池类
import { PG_POOL } from '../infra/tokens';
// 从 ../infra/tokens 导入这一行列出的符号，供本文件调用。
// PG_POOL：infra/tokens 定义的数据库连接池注入令牌
import type { SessionUser } from '../auth/session-user';
// 从 ../auth/session-user 导入这一行列出的符号，供本文件调用。
// SessionUser：项目定义的登录用户结构，保存用户名和操作级别
import { CreateUserDto } from './dto/create-user.dto';
// 从 ./dto/create-user.dto 导入这一行列出的符号，供本文件调用。
// CreateUserDto：从 ./dto/create-user.dto 导入的对象，用于本文件的调用或类型约束
import { UpdateUserDto } from './dto/update-user.dto';
// 从 ./dto/update-user.dto 导入这一行列出的符号，供本文件调用。
// UpdateUserDto：从 ./dto/update-user.dto 导入的对象，用于本文件的调用或类型约束

// 三级权限规则(严格对照 origin/1.0.1 userServer/main.py)
// 这一段声明 UsersService，用于后端用户管理服务，执行账号权限校验与增删改查。
@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
// Injectable：NestJS 把类注册为可注入服务的装饰器
export class UsersService {
// 定义 UsersService，约束或实现本模块涉及的数据和行为。
// UsersService：后端用户管理服务，执行账号权限校验与增删改查
  // 这一段定义 constructor，用于初始化 users.service 使用的实例状态和依赖。
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // Inject：NestJS 按指定令牌注入依赖的装饰器；PG_POOL：infra/tokens 定义的数据库连接池注入令牌；pool：注入或创建的 PostgreSQL 连接池；Pool：pg 驱动提供的 PostgreSQL 连接池类
  // 这一段提供了初始化 users.service 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // GET /api/users —— 按 visible_users 过滤后返回
  // 这一段定义 list，用于按操作人权限读取可见的用户账号列表。
  async list(me: SessionUser) {
  // 定义方法 list；括号中声明参数，花括号内实现逻辑。
  // list：按操作人权限读取可见的用户账号列表；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    const { rows } = await this.pool.query(
    // 通过数据库连接池执行参数化查询。
    // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      'SELECT username, level, created_at FROM app.app_users ORDER BY level DESC, username',
      // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const all = rows.map((r) => ({ username: r.username as string, level: r.level as number, created_at: r.created_at as Date }));
    // 将集合中的每个元素转换为新值，返回新的数组或迭代结果，将结果保存或写入 all。
    // all：本处保存 rows.map((r) => ({ username: r.username as string, level: r.… 的结果；rows：数据库查询结果中的记录数组；map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；r：当前方法接收的参数；username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分；Date：JavaScript 日期与当前时间 API
    return { users: this.visibleUsers(me, all) };
    // 把{ users: this.visibleUsers(me, all) }作为当前函数的结果返回。
    // visibleUsers：按照当前用户级别筛选可见账号；me：当前方法接收的参数，类型为 SessionUser；all：本处保存 rows.map((r) => ({ username: r.username as string, level: r.… 的结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了按操作人权限读取可见的用户账号列表的实现；实际结果由运行时输入和执行分支决定。

  // POST /api/users —— 仅管理员可创建(level=3)
  // 这一段定义 create，用于校验账号与权限、生成口令摘要并创建新账号。
  async create(me: SessionUser, dto: CreateUserDto): Promise<{ success: true; username: string }> {
  // 定义方法 create；括号中声明参数，花括号内实现逻辑。
  // create：校验账号与权限、生成口令摘要并创建新账号；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；dto：当前方法接收的参数，类型为 CreateUserDto；CreateUserDto：从 ./dto/create-user.dto 导入的对象，用于本文件的调用或类型约束；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；success：本处声明的字段或类型，类型为 true；username：账号用户名
    this.assertAdmin(me);
    // 检查操作人是否达到用户管理所需的管理员级别。
    // assertAdmin：检查操作人是否达到用户管理所需的管理员级别；me：当前方法接收的参数，类型为 SessionUser
    const exists = await this.pool.query('SELECT 1 FROM app.app_users WHERE username = $1 LIMIT 1', [dto.username]);
    // 通过数据库连接池执行参数化查询，将结果保存或写入 exists。
    // exists：本处保存 await this.pool.query('SELECT 1 FROM app.app_users WHERE use… 的结果；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果；dto：当前方法接收的参数，类型为 CreateUserDto；username：账号用户名
    if (exists.rowCount && exists.rowCount > 0) {
    // 检查(exists.rowCount && exists.rowCount > 0)，按判断结果进入对应的处理分支。
    // exists：本处保存 await this.pool.query('SELECT 1 FROM app.app_users WHERE use… 的结果；rowCount：数据库报告的匹配或变更记录数
      throw new BadRequestException({ code: 409, msg: '用户名已存在' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // BadRequestException：NestJS 表示请求参数错误的 HTTP 400 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const hash = await bcrypt.hash(dto.password, 10);
    // 使用 bcrypt 为口令生成摘要，将结果保存或写入 hash。
    // hash：本处保存 await bcrypt.hash(dto.password, 10) 的结果；bcrypt：从 bcryptjs 导入的口令摘要与验证 API；dto：当前方法接收的参数，类型为 CreateUserDto；password：登录口令或数据库保存的口令摘要，具体取决于所在对象
    await this.pool.query(
    // 通过数据库连接池执行参数化查询。
    // pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      'INSERT INTO app.app_users(username, password, level) VALUES ($1, $2, $3)',
      // 按前面声明的列顺序提供 SQL 插入值，参数占位符由查询调用传入。
      // app.app_users 是保存应用登录账号的数据表；$1 是数据库参数占位符，实际值由查询调用另外传入；VALUES 按前面 INSERT 列出的字段顺序提供要写入的数据，$n 占位符由查询参数数组填入
      [dto.username, hash, dto.level],
      // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
      // dto：当前方法接收的参数，类型为 CreateUserDto；username：账号用户名；hash：本处保存 await bcrypt.hash(dto.password, 10) 的结果；level：用户操作级别或事件严重级别，依据当前接口结构区分
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    return { success: true, username: dto.username };
    // 把{ success: true, username: dto.username }作为当前函数的结果返回。
    // username：账号用户名；dto：当前方法接收的参数，类型为 CreateUserDto
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了校验账号与权限、生成口令摘要并创建新账号的实现；实际结果由运行时输入和执行分支决定。

  // PUT /api/users/:username —— 按 §B 规则校验后改密 / 改级
  // 这一段定义 update，用于校验管理权限后修改目标账号的密码或级别。
  async update(me: SessionUser, targetUsername: string, dto: UpdateUserDto) {
  // 定义方法 update；括号中声明参数，花括号内实现逻辑。
  // update：校验管理权限后修改目标账号的密码或级别；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；targetUsername：当前方法接收的参数，类型为 string；dto：当前方法接收的参数，类型为 UpdateUserDto；UpdateUserDto：从 ./dto/update-user.dto 导入的对象，用于本文件的调用或类型约束
    if (dto.new_password === undefined && dto.new_level === undefined) {
    // 检查(dto.new_password === undefined && dto.new_level === undefined)，按判断结果进入对应的处理分支。
    // dto：当前方法接收的参数，类型为 UpdateUserDto；new_password：本处声明的字段或类型，类型为 string；new_level：本处声明的字段或类型，类型为 1 | 2 | 3
      throw new BadRequestException({ code: 400, msg: '至少提供 new_password 或 new_level 其中一项' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // BadRequestException：NestJS 表示请求参数错误的 HTTP 400 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (dto.new_level !== undefined && me.level !== 3) {
    // 检查(dto.new_level !== undefined && me.level !== 3)，按判断结果进入对应的处理分支。
    // dto：当前方法接收的参数，类型为 UpdateUserDto；new_level：本处声明的字段或类型，类型为 1 | 2 | 3；me：当前方法接收的参数，类型为 SessionUser；level：用户操作级别或事件严重级别，依据当前接口结构区分
      throw new ForbiddenException({ code: 403, msg: '仅管理员可修改用户等级' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // ForbiddenException：NestJS 表示操作权限不足的 HTTP 403 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const target = await this.fetchTarget(targetUsername);
    // 读取待管理的目标账号并检查其是否存在，将结果保存或写入 target。
    // target：本处保存 await this.fetchTarget(targetUsername) 的结果；fetchTarget：读取待管理的目标账号并检查其是否存在；targetUsername：当前方法接收的参数，类型为 string
    if (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' });
    // 条件 (!target) throw new NotFoundException({ code: 404, msg: '目标用户不存在' }); 成立时按本行给出的错误终止处理。
    // target：本处保存 await this.fetchTarget(targetUsername) 的结果；NotFoundException：NestJS 表示目标不存在的 HTTP 404 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字

    if (dto.new_password !== undefined && !this.canChangePwd(me, target)) {
    // 检查(dto.new_password !== undefined && !this.canChangePwd(me, target))，按判断结果进入对应的处理分支。
    // dto：当前方法接收的参数，类型为 UpdateUserDto；new_password：本处声明的字段或类型，类型为 string；canChangePwd：判断操作人是否有权修改目标用户的密码；me：当前方法接收的参数，类型为 SessionUser；target：本处保存 await this.fetchTarget(targetUsername) 的结果
      throw new ForbiddenException({ code: 403, msg: '权限不足,无法修改该用户密码' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // ForbiddenException：NestJS 表示操作权限不足的 HTTP 403 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

    const sets: string[] = [];
    // 声明 sets，初始值由 [] 计算得到，供当前处理流程继续使用。
    // sets：本处保存 [] 的结果，类型为 string[]
    const args: (string | number)[] = [];
    // 声明 args，初始值由 [] 计算得到，供当前处理流程继续使用。
    // args：本处保存 [] 的结果，类型为 (string | number)[]
    if (dto.new_password !== undefined) {
    // 检查(dto.new_password !== undefined)，按判断结果进入对应的处理分支。
    // dto：当前方法接收的参数，类型为 UpdateUserDto；new_password：本处声明的字段或类型，类型为 string
      const hash = await bcrypt.hash(dto.new_password, 10);
      // 使用 bcrypt 为口令生成摘要，将结果保存或写入 hash。
      // hash：本处保存 await bcrypt.hash(dto.new_password, 10) 的结果；bcrypt：从 bcryptjs 导入的口令摘要与验证 API；dto：当前方法接收的参数，类型为 UpdateUserDto；new_password：本处声明的字段或类型，类型为 string
      sets.push('password = $' + (args.length + 1));
      // 向数组末尾追加元素。
      // sets：本处保存 [] 的结果，类型为 string[]；push：向数组末尾追加元素；args：本处保存 [] 的结果，类型为 (string | number)[]；length：本处声明的字段或类型，类型为 number
      args.push(hash);
      // 向数组末尾追加元素。
      // args：本处保存 [] 的结果，类型为 (string | number)[]；push：向数组末尾追加元素；hash：本处保存 await bcrypt.hash(dto.new_password, 10) 的结果
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (dto.new_level !== undefined) {
    // 检查(dto.new_level !== undefined)，按判断结果进入对应的处理分支。
    // dto：当前方法接收的参数，类型为 UpdateUserDto；new_level：本处声明的字段或类型，类型为 1 | 2 | 3
      sets.push('level = $' + (args.length + 1));
      // 向数组末尾追加元素。
      // sets：本处保存 [] 的结果，类型为 string[]；push：向数组末尾追加元素；args：本处保存 [] 的结果，类型为 (string | number)[]；length：本处声明的字段或类型，类型为 number
      args.push(dto.new_level);
      // 向数组末尾追加元素。
      // args：本处保存 [] 的结果，类型为 (string | number)[]；push：向数组末尾追加元素；dto：当前方法接收的参数，类型为 UpdateUserDto；new_level：本处声明的字段或类型，类型为 1 | 2 | 3
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    args.push(targetUsername);
    // 向数组末尾追加元素。
    // args：本处保存 [] 的结果，类型为 (string | number)[]；push：向数组末尾追加元素；targetUsername：当前方法接收的参数，类型为 string
    const { rowCount } = await this.pool.query(
    // 通过数据库连接池执行参数化查询。
    // rowCount：数据库报告的匹配或变更记录数；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      `UPDATE app.app_users SET ${sets.join(', ')} WHERE username = $${args.length}`,
      // 把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准。
      // sets：本处保存 [] 的结果，类型为 string[]；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；args：本处保存 [] 的结果，类型为 (string | number)[]；length：本处声明的字段或类型，类型为 number
      args,
      // 把变量 args 作为同名对象字段加入当前对象。
      // args：本处保存 [] 的结果，类型为 (string | number)[]
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    // 条件 (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' }); 成立时按本行给出的错误终止处理。
    // rowCount：数据库报告的匹配或变更记录数；NotFoundException：NestJS 表示目标不存在的 HTTP 404 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    return { success: true };
    // 把{ success: true }作为当前函数的结果返回。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了校验管理权限后修改目标账号的密码或级别的实现；实际结果由运行时输入和执行分支决定。

  // DELETE /api/users/:username —— 仅管理员;禁止删除自己
  // 这一段定义 remove，用于校验管理权限和目标用户限制后删除账号。
  async remove(me: SessionUser, targetUsername: string) {
  // 定义方法 remove；括号中声明参数，花括号内实现逻辑。
  // remove：校验管理权限和目标用户限制后删除账号；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；targetUsername：当前方法接收的参数，类型为 string
    this.assertAdmin(me);
    // 检查操作人是否达到用户管理所需的管理员级别。
    // assertAdmin：检查操作人是否达到用户管理所需的管理员级别；me：当前方法接收的参数，类型为 SessionUser
    if (targetUsername === me.username) {
    // 检查(targetUsername === me.username)，按判断结果进入对应的处理分支。
    // targetUsername：当前方法接收的参数，类型为 string；me：当前方法接收的参数，类型为 SessionUser；username：账号用户名
      throw new BadRequestException({ code: 400, msg: '不能删除自己的账号' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // BadRequestException：NestJS 表示请求参数错误的 HTTP 400 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    const { rowCount } = await this.pool.query(
    // 通过数据库连接池执行参数化查询。
    // rowCount：数据库报告的匹配或变更记录数；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      'DELETE FROM app.app_users WHERE username = $1',
      // 提供 SQL 语句，删除表 app.app_users 中的数据；实际参数由外层查询调用传入。
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；app.app_users 是保存应用登录账号的数据表；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [targetUsername],
      // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
      // targetUsername：当前方法接收的参数，类型为 string
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' });
    // 条件 (!rowCount) throw new NotFoundException({ code: 404, msg: '用户不存在' }); 成立时按本行给出的错误终止处理。
    // rowCount：数据库报告的匹配或变更记录数；NotFoundException：NestJS 表示目标不存在的 HTTP 404 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    return { success: true };
    // 把{ success: true }作为当前函数的结果返回。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了校验管理权限和目标用户限制后删除账号的实现；实际结果由运行时输入和执行分支决定。

  // ===== 严格对照 1.0.1 can_change_pwd / visible_users =====

  // 这一段定义 canChangePwd，用于判断操作人是否有权修改目标用户的密码。
  private canChangePwd(me: SessionUser, target: { username: string; level: number }): boolean {
  // 定义方法 canChangePwd；括号中声明参数，花括号内实现逻辑。
  // canChangePwd：判断操作人是否有权修改目标用户的密码；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；target：当前方法接收的参数，类型为 { username: string; level: number }；username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分
    if (me.level === 3) return true;
    // 检查(me.level === 3) return true;，按判断结果进入对应的处理分支。
    // me：当前方法接收的参数，类型为 SessionUser；level：用户操作级别或事件严重级别，依据当前接口结构区分
    if (me.level === 2) return target.username === me.username || target.level === 1;
    // 检查(me.level === 2) return target.username === me.username || target.level === 1;，按判断结果进入对应的处理分支。
    // me：当前方法接收的参数，类型为 SessionUser；level：用户操作级别或事件严重级别，依据当前接口结构区分；target：当前方法接收的参数，类型为 { username: string; level: number }；username：账号用户名
    return target.username === me.username;
    // 把target.username === me.username作为当前函数的结果返回。
    // target：当前方法接收的参数，类型为 { username: string; level: number }；username：账号用户名；me：当前方法接收的参数，类型为 SessionUser
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了判断操作人是否有权修改目标用户的密码的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 visibleUsers，用于按照当前用户级别筛选可见账号。
  private visibleUsers<T extends { username: string; level: number }>(me: SessionUser, all: T[]): T[] {
  // 声明或设置 username，用于账号用户名。
  // visibleUsers：按照当前用户级别筛选可见账号；username：账号用户名；level：用户操作级别或事件严重级别，依据当前接口结构区分；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别；all：当前方法接收的参数，类型为 T[]
    if (me.level === 3) return all;
    // 检查(me.level === 3) return all;，按判断结果进入对应的处理分支。
    // me：当前方法接收的参数，类型为 SessionUser；level：用户操作级别或事件严重级别，依据当前接口结构区分；all：当前方法接收的参数，类型为 T[]
    if (me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username);
    // 检查(me.level === 2) return all.filter((u) => u.level === 1 || u.username === me.username);，按判断结果进入对应的处理分支。
    // me：当前方法接收的参数，类型为 SessionUser；level：用户操作级别或事件严重级别，依据当前接口结构区分；all：当前方法接收的参数，类型为 T[]；filter：保留满足条件的集合元素；u：当前方法接收的参数；username：账号用户名
    return all.filter((u) => u.username === me.username);
    // 把all.filter((u) => u.username === me.username)作为当前函数的结果返回。
    // all：当前方法接收的参数，类型为 T[]；filter：保留满足条件的集合元素；u：当前方法接收的参数；username：账号用户名；me：当前方法接收的参数，类型为 SessionUser
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了按照当前用户级别筛选可见账号的实现；实际结果由运行时输入和执行分支决定。

  // ===== 工具方法 =====

  // 这一段定义 assertAdmin，用于检查操作人是否达到用户管理所需的管理员级别。
  private assertAdmin(me: SessionUser) {
  // 定义方法 assertAdmin；括号中声明参数，花括号内实现逻辑。
  // assertAdmin：检查操作人是否达到用户管理所需的管理员级别；me：当前方法接收的参数，类型为 SessionUser；SessionUser：项目定义的登录用户结构，保存用户名和操作级别
    if (me.level !== 3) {
    // 检查(me.level !== 3)，按判断结果进入对应的处理分支。
    // me：当前方法接收的参数，类型为 SessionUser；level：用户操作级别或事件严重级别，依据当前接口结构区分
      throw new ForbiddenException({ code: 403, msg: '权限不足,仅管理员可执行此操作' });
      // 按本行指定的错误类型或信息终止当前处理并交给上层处理。
      // ForbiddenException：NestJS 表示操作权限不足的 HTTP 403 异常；code：业务编码、状态码或数据库查询字段，结合所在报文解释；msg：当前收到的消息或提示文字
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了检查操作人是否达到用户管理所需的管理员级别的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 fetchTarget，用于读取待管理的目标账号并检查其是否存在。
  private async fetchTarget(username: string): Promise<{ username: string; level: number } | null> {
  // 定义方法 fetchTarget；括号中声明参数，花括号内实现逻辑。
  // fetchTarget：读取待管理的目标账号并检查其是否存在；username：账号用户名；Promise：JavaScript 异步结果类型，表示操作将来完成或失败；level：用户操作级别或事件严重级别，依据当前接口结构区分
    const { rows } = await this.pool.query(
    // 通过数据库连接池执行参数化查询。
    // rows：数据库查询结果中的记录数组；pool：注入或创建的 PostgreSQL 连接池；query：通过 PostgreSQL 连接池执行参数化 SQL，返回 rows 与 rowCount 等结果
      'SELECT username, level FROM app.app_users WHERE username = $1 LIMIT 1',
      // 提供 SQL 语句，读取表 app.app_users 中的数据；实际参数由外层查询调用传入。
      // app.app_users 是保存应用登录账号的数据表，FROM 指定本次读取的数据来源；$1 是数据库参数占位符，实际值由查询调用另外传入；WHERE 只处理满足本行或后续条件的记录
      [username],
      // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
      // username：账号用户名
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    if (rows.length === 0) return null;
    // 检查(rows.length === 0) return null;，按判断结果进入对应的处理分支。
    // rows：数据库查询结果中的记录数组；length：本处声明的字段或类型，类型为 number
    return { username: rows[0].username as string, level: rows[0].level as number };
    // 把{ username: rows[0].username as string, level: rows[0].level as number }作为当前函数的结果返回。
    // username：账号用户名；rows：数据库查询结果中的记录数组；level：用户操作级别或事件严重级别，依据当前接口结构区分
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了读取待管理的目标账号并检查其是否存在的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了后端用户管理服务，执行账号权限校验与增删改查所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 UsersService 的字段或服务能力，供项目其他模块使用。
