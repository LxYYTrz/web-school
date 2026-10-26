import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
// 从 class-validator 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 修改用户入参:new_password / new_level 至少一个;按 §B 权限规则
export class UpdateUserDto {
// 声明 UpdateUserDto 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  @IsOptional()
  // 装饰器 IsOptional：给后面的类、方法或参数附加元数据。
  @IsString()
  // 装饰器 IsString：给后面的类、方法或参数附加元数据。
  @MinLength(1)
  // 装饰器 MinLength：给后面的类、方法或参数附加元数据。
  new_password?: string;
  // 声明 可选字段 new_password，类型为 string。

  @IsOptional()
  // 装饰器 IsOptional：给后面的类、方法或参数附加元数据。
  @IsIn([1, 2, 3])
  // 装饰器 IsIn：给后面的类、方法或参数附加元数据。
  new_level?: 1 | 2 | 3;
  // 声明 可选字段 new_level，类型为 1 | 2 | 3。
}
// 结束当前对象、函数或条件代码块。
