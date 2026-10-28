/**
 * 声明登录正文的 username、password 字段，供 AuthController 接收数据。
 * 类型/装饰器描述输入约定；实际账号与密码核对在 AuthService.verifyCredentials 中。
 */
import { IsNotEmpty, IsString } from 'class-validator';

// 登录入参(账号 + 口令)
export class LoginDto {
// LoginDto 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
