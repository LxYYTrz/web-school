import { Module } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { UsersController } from './users.controller';
// 从 ./users.controller 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { UsersService } from './users.service';
// 从 ./users.service 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { AuthModule } from '../auth/auth.module';
// 从 ../auth/auth.module 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

@Module({
// 装饰器 Module：声明 NestJS 模块的依赖和导出。
  imports: [AuthModule],
  // 设置字段 imports。
  controllers: [UsersController],
  // 设置字段 controllers。
  providers: [UsersService],
  // 设置字段 providers。
  exports: [UsersService],
  // 设置字段 exports。
})
// 继续当前表达式；这一行的值由外层代码块或调用使用。
export class UsersModule {}
// 声明 UsersModule 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
