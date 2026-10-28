/**
 * NestJS 的 账号管理装配模块 UsersModule，由 AppModule 引入。
 * 注册 UsersController 与 UsersService；具体管理权限由服务按操作检查。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
// UsersModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
