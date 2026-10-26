// 这一段负责配置和实现 server/src/users/dto/update-user.dto.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
// 从 class-validator 导入这一行列出的符号，供本文件调用。
// IsIn：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器；IsOptional：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器；IsString：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器；MinLength：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器

// 修改用户入参:new_password / new_level 至少一个;按 §B 权限规则
// 这一段声明 UpdateUserDto，用于UpdateUserDto 的相关数据和行为。
export class UpdateUserDto {
// 定义 UpdateUserDto，约束或实现本模块涉及的数据和行为。
// UpdateUserDto 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  @IsOptional()
  // 装饰器 IsOptional：给后面的类、方法或参数附加元数据。
  // IsOptional：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  @IsString()
  // 装饰器 IsString：给后面的类、方法或参数附加元数据。
  // IsString：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  @MinLength(1)
  // 装饰器 MinLength：给后面的类、方法或参数附加元数据。
  // MinLength：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  new_password?: string;
  // 声明 可选字段 new_password，类型为 string，供当前处理流程继续使用。
  // new_password：本处声明的字段或类型，类型为 string

  @IsOptional()
  // 装饰器 IsOptional：给后面的类、方法或参数附加元数据。
  // IsOptional：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  @IsIn([1, 2, 3])
  // 装饰器 IsIn：给后面的类、方法或参数附加元数据。
  // IsIn：从 class-validator 导入的对象，用于本文件的请求字段校验装饰器
  new_level?: 1 | 2 | 3;
  // 声明 可选字段 new_level，类型为 1 | 2 | 3，供当前处理流程继续使用。
  // new_level：本处声明的字段或类型，类型为 1 | 2 | 3
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/users/dto/update-user.dto.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 UpdateUserDto 的字段或服务能力，供项目其他模块使用。
