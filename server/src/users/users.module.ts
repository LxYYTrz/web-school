// 这一段负责配置和实现 server/src/users/users.module.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
import { UsersController } from './users.controller';
// 从 ./users.controller 导入这一行列出的符号，供本文件调用。
// UsersController：从 ./users.controller 导入的对象，用于本文件的调用或类型约束
import { UsersService } from './users.service';
// 从 ./users.service 导入这一行列出的符号，供本文件调用。
// UsersService：后端用户管理服务，执行账号权限校验与增删改查
import { AuthModule } from '../auth/auth.module';
// 从 ../auth/auth.module 导入这一行列出的符号，供本文件调用。
// AuthModule：从 ../auth/auth.module 导入的对象，用于本文件的调用或类型约束

// 这一段声明 UsersModule，用于UsersModule 的相关数据和行为。
@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
// Module：NestJS 声明模块依赖、提供者和导出的装饰器
  imports: [AuthModule],
  // 声明或设置 imports，用于当前对象或接口的对应数据。
  // AuthModule：从 ../auth/auth.module 导入的对象，用于本文件的调用或类型约束
  controllers: [UsersController],
  // 声明或设置 controllers，用于当前对象或接口的对应数据。
  // UsersController：从 ./users.controller 导入的对象，用于本文件的调用或类型约束
  providers: [UsersService],
  // 声明或设置 providers，用于当前对象或接口的对应数据。
  // UsersService：后端用户管理服务，执行账号权限校验与增删改查
  exports: [UsersService],
  // 声明或设置 exports，用于当前对象或接口的对应数据。
  // UsersService：后端用户管理服务，执行账号权限校验与增删改查
})
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 本行完成上面一层已说明的函数、分支或对象配置
export class UsersModule {}
// 定义 UsersModule，约束或实现本模块涉及的数据和行为。
// UsersModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
// 这一段提供了配置和实现 server/src/users/users.module.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 UsersModule 的字段或服务能力，供项目其他模块使用。
