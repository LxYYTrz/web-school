// 这一段负责配置和实现 server/src/auth/dto/login.dto.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { IsNotEmpty, IsString } from 'class-validator';
// 从 class-validator 导入这一行列出的符号，供本文件调用。
// IsNotEmpty：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器；IsString：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器

// 登录入参(账号 + 口令)
// 这一段声明 LoginDto，用于LoginDto 的相关数据和行为。
export class LoginDto {
// 定义 LoginDto，约束或实现本模块涉及的数据和行为。
// LoginDto 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  @IsString()
  // 装饰器 IsString：给后面的类、方法或参数附加元数据。
  // IsString：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  @IsNotEmpty()
  // 装饰器 IsNotEmpty：给后面的类、方法或参数附加元数据。
  // IsNotEmpty：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  username!: string;
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // username：账号用户名

  @IsString()
  // 装饰器 IsString：给后面的类、方法或参数附加元数据。
  // IsString：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  @IsNotEmpty()
  // 装饰器 IsNotEmpty：给后面的类、方法或参数附加元数据。
  // IsNotEmpty：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  password!: string;
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // password：登录口令或数据库保存的口令摘要，具体取决于所在对象
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/auth/dto/login.dto.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 LoginDto 的字段或服务能力，供项目其他模块使用。
