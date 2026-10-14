import { IsIn, IsNotEmpty, IsString } from 'class-validator';

// 创建用户入参:仅管理员可用
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsIn([1, 2, 3])
  level!: 1 | 2 | 3;
}
