/**
 * NestJS 的 登录与会话检查装配模块 AuthModule，由 AppModule 引入。
 * AuthController、AuthService、AuthGuard 和管理员引导；导出账号服务与登录守卫供其他模块使用。
 * 这里声明可注入依赖和 HTTP 入口，具体处理在对应 Controller/Service 中，不把模块文件顺序当成消息执行顺序。
 */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UsersBootstrapService } from './users-bootstrap.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, UsersBootstrapService],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
// AuthModule 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
