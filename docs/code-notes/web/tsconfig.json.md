# web/tsconfig.json 逐行注释

[打开源码](../../../web/tsconfig.json) · 38 行 · 18 行代码说明

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
    "target": "ES2020",
/* 注释：target：编译后允许使用的 JavaScript 语言版本；当前值为 "ES2020"。 */
```

**源码第 12 行**

```text
    "module": "ESNext",
/* 注释：module：编译产物的模块格式；当前值为 "ESNext"。 */
```

**源码第 14 行**

```text
    "moduleResolution": "bundler",
/* 注释：moduleResolution：导入模块的查找规则；当前值为 "bundler"。 */
```

**源码第 16 行**

```text
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
/* 注释：lib：类型检查时可用的标准库；当前值为 ["ES2020", "DOM", "DOM.Iterable"]。 */
```

**源码第 18 行**

```text
    "strict": true,
/* 注释：strict：启用严格类型检查；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 20 行**

```text
    "skipLibCheck": true,
/* 注释：skipLibCheck：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 22 行**

```text
    "esModuleInterop": true,
/* 注释：esModuleInterop：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 24 行**

```text
    "allowSyntheticDefaultImports": true,
/* 注释：allowSyntheticDefaultImports：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 26 行**

```text
    "resolveJsonModule": true,
/* 注释：resolveJsonModule：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 28 行**

```text
    "isolatedModules": true,
/* 注释：isolatedModules：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 30 行**

```text
    "useDefineForClassFields": true,
/* 注释：useDefineForClassFields：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 32 行**

```text
    "noEmit": true,
/* 注释：noEmit：指定该项的值；当前值为 true。 关键字：true＝布尔真值。 */
```

**源码第 34 行**

```text
    "types": ["vite/client"]
/* 注释：types：指定该项的值；当前值为 ["vite/client"]。 */
```

**源码第 35 行**

```text
  },
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```

**源码第 37 行**

```text
  "include": ["src/**/*.ts", "src/**/*.vue"]
/* 注释：include：参与编译的文件范围；当前值为 ["src/**/*.ts", "src/**/*.vue"]。 */
```

**源码第 38 行**

```text
}
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```
