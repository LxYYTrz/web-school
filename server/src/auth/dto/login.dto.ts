import { IsNotEmpty, IsString } from 'class-validator';

// 登录入参(账号 + 口令)
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
