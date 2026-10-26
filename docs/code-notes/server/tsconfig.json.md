# server/tsconfig.json 逐行注释

[打开源码](../../../server/tsconfig.json) · 41 行 · 19 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
{
/* 注释：开始一个对象或数组；对象按键保存配置，数组按顺序保存条目。 */
```

**源码第 8 行**

```text
  "compilerOptions": {
/* 注释：compilerOptions：TypeScript 编译器选项；当前值为 {。 */
```

**源码第 10 行**

```text
    "module": "commonjs",
/* 注释：module：编译产物的模块格式；当前值为 "commonjs"。 */
```

**源码第 12 行**

```text
    "target": "ES2021",
/* 注释：target：编译后允许使用的 JavaScript 语言版本；当前值为 "ES2021"。 */
```

**源码第 14 行**

```text
    "lib": ["ES2021"],
/* 注释：lib：类型检查时可用的标准库；当前值为 ["ES2021"]。 */
```

**源码第 16 行**

```text
    "moduleResolution": "node",
/* 注释：moduleResolution：导入模块的查找规则；当前值为 "node"。 */
```

**源码第 19 行**

```text
    "emitDecoratorMetadata": true,
/* 注释：emitDecoratorMetadata：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 21 行**

```text
    "experimentalDecorators": true,
/* 注释：experimentalDecorators：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 23 行**

```text
    "esModuleInterop": true,
/* 注释：esModuleInterop：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 25 行**

```text
    "skipLibCheck": true,
/* 注释：skipLibCheck：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 27 行**

```text
    "strict": true,
/* 注释：strict：启用严格类型检查；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 29 行**

```text
    "strictPropertyInitialization": false,
/* 注释：strictPropertyInitialization：指定该项的值；当前值为 false。 关键字：false＝布尔假值。 */
```

**源码第 31 行**

```text
    "outDir": "dist",
/* 注释：outDir：编译产物输出目录；当前值为 "dist"。 */
```

**源码第 33 行**

```text
    "rootDir": "src",
/* 注释：rootDir：源文件根目录；当前值为 "src"。 */
```

**源码第 35 行**

```text
    "resolveJsonModule": true,
/* 注释：resolveJsonModule：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 37 行**

```text
    "forceConsistentCasingInFileNames": true
/* 注释：forceConsistentCasingInFileNames：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 38 行**

```text
  },
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```

**源码第 40 行**

```text
  "include": ["src/**/*"]
/* 注释：include：参与编译的文件范围；当前值为 ["src/**/*"]。 */
```

**源码第 41 行**

```text
}
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```
