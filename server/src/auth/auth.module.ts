import { Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthController } from './auth.controller';
// 从 ./auth.controller 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthService } from './auth.service';
// 从 ./auth.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthGuard } from './auth.guard';
// 从 ./auth.guard 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { UsersBootstrapService } from './users-bootstrap.service';
// 从 ./users-bootstrap.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
  controllers: [AuthController],
  // 设置字段 controllers。
  providers: [AuthService, AuthGuard, UsersBootstrapService],
  // 设置字段 providers。
  exports: [AuthService, AuthGuard],
  // 设置字段 exports。
})
// 继续当前表达式；这一行的值由外层代码块或调用使用。
export class AuthModule {}
// 声明 AuthModule 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
