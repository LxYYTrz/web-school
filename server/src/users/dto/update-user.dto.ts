/**
 * 声明账号更新的可选密码与级别字段，供用户管理入口接收。
 * UsersService.update 根据实际提供的字段检查权限并构造 UPDATE；只声明字段不会执行修改。
 */
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

// 修改用户入参:new_password / new_level 至少一个;按 §B 权限规则
export class UpdateUserDto {
// UpdateUserDto 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  @IsOptional()
  @IsString()
  @MinLength(1)
  new_password?: string;

  @IsOptional()
  @IsIn([1, 2, 3])
  new_level?: 1 | 2 | 3;
}
