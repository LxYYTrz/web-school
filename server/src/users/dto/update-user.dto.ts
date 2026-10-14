import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

// 修改用户入参:new_password / new_level 至少一个;按 §B 权限规则
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  new_password?: string;

  @IsOptional()
  @IsIn([1, 2, 3])
  new_level?: 1 | 2 | 3;
}
