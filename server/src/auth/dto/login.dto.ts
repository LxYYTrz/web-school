import { IsNotEmpty, IsString } from 'class-validator';
// 从 class-validator 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 登录入参(账号 + 口令)
export class LoginDto {
// 声明 LoginDto 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  @IsString()
  // 装饰器 IsString：给后面的类、方法或参数附加元数据。
  @IsNotEmpty()
  // 装饰器 IsNotEmpty：给后面的类、方法或参数附加元数据。
  username!: string;
  // 继续当前表达式；这一行的值由外层代码块或调用使用。

  @IsString()
  // 装饰器 IsString：给后面的类、方法或参数附加元数据。
  @IsNotEmpty()
  // 装饰器 IsNotEmpty：给后面的类、方法或参数附加元数据。
  password!: string;
  // 继续当前表达式；这一行的值由外层代码块或调用使用。
}
// 结束当前对象、函数或条件代码块。
