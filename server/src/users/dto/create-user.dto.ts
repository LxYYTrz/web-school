/**
 * 声明待创建账号的用户名、密码与级别，供用户管理入口接收。
 * 管理员权限、用户名重复检查与密码摘要生成在 UsersService.create 中完成。
 */
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

// 创建用户入参:仅管理员可用
export class CreateUserDto {
// CreateUserDto 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsIn([1, 2, 3])
  level!: 1 | 2 | 3;
}
