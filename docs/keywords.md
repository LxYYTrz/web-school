# 代码关键字与符号速查

手写源码中，代码行下方的注释解释该行作用与关键语法。本页集中解释语法词和常见符号。标识符（例如 `status`、`pool`）是项目自己取的名字，不是语言关键字，其具体作用看对应源码行。严格 JSON、CSV 和自动生成的构建产物保持原有格式，不向数据行硬插注释。

## 语言关键字

| 关键字 | 含义 |
|---|---|
| `!` | 逻辑取反 |
| `!==` | 严格不等比较 |
| `#` | 命名插槽的简写 |
| `$1` | PostgreSQL 参数占位符；实际值单独传入，避免拼接 SQL |
| `%` | 相对父元素或相关参考值的百分比 |
| `&#124;` | TypeScript 联合类型中的或 |
| `&#124;&#124;` | 逻辑或；左侧为真时不执行右侧 |
| `&&` | 逻辑与；左侧为假时不执行右侧 |
| `...` | 展开数组/对象或收集剩余参数 |
| `:` | 属性动态绑定的简写 |
| `<T>` | 泛型参数，让类型随调用处确定 |
| `<template` | 仅用于组织模板，不生成额外 DOM 节点 |
| `=` | 赋值；把右边结果存入左边变量或属性 |
| `===` | 严格相等比较，不转换类型 |
| `=>` | 箭头函数，左边是参数、右边是结果或函数体 |
| `? :` | 三元条件表达式 |
| `?.` | 可选链；左侧为空时停止读取并返回 undefined |
| `??` | 空值合并；左侧为 null/undefined 时用右侧 |
| `@` | 事件监听的简写 |
| `@Decorator` | TypeScript/NestJS 装饰器，用元数据标记类或方法 |
| `[a, b]` | 数组或数组类型 |
| `align-items` | 控制交叉轴上的对齐方式 |
| `ALTER` | 修改数据库对象 |
| `AND` | 逻辑与 |
| `and` | 逻辑与 |
| `any` | 跳过静态类型检查 |
| `AS` | 为字段或表设置别名 |
| `as` | 为导入或上下文对象命名 |
| `assert` | 检查断言条件 |
| `async` | 声明异步函数 |
| `auto` | 由浏览器自动计算 |
| `await` | 等待异步结果 |
| `background` | 设置背景 |
| `background-color` | 设置背景颜色 |
| `BEGIN` | 开始事务或代码块 |
| `border` | 设置边框 |
| `border-radius` | 设置圆角 |
| `box-shadow` | 设置阴影 |
| `break` | 结束当前循环或分支 |
| `BY` | 指定分组或排序字段 |
| `calc(...)` | 在 CSS 中计算长度或其他值 |
| `CASCADE` | 级联处理依赖对象 |
| `case` | 匹配一个分支 |
| `catch` | 处理异常 |
| `CHECK` | 校验数据约束 |
| `class` | 定义类 |
| `color` | 设置文字颜色 |
| `const` | 声明不可重新绑定的变量 |
| `CONSTRAINT` | 命名约束 |
| `continue` | 跳过本轮继续循环 |
| `CREATE` | 创建数据库对象 |
| `cursor` | 设置鼠标指针样式 |
| `def` | 定义 Python 函数 |
| `DEFAULT` | 默认值 |
| `default` | 指定默认导出或默认分支 |
| `DELETE` | 删除匹配行 |
| `display` | 决定元素如何布局或显示 |
| `DO` | 执行匿名 SQL 代码块 |
| `DROP` | 删除数据库对象 |
| `elif` | 检查下一条件 |
| `else` | 条件不满足时的分支 |
| `END` | 结束代码块 |
| `enum` | 定义枚举 |
| `except` | 处理指定异常 |
| `EXISTS` | 检查对象或查询结果存在 |
| `export` | 导出给其他模块 |
| `extends` | 继承父类 |
| `EXTENSION` | 数据库扩展 |
| `False` | Python 假值 |
| `false` | 布尔假值 |
| `finally` | 执行收尾逻辑 |
| `flex` | 弹性盒布局 |
| `font-size` | 设置字号 |
| `font-weight` | 设置字重 |
| `for` | 开始循环 |
| `FROM` | 指定查询来源表 |
| `from` | 指定导入来源 |
| `function` | 定义函数 |
| `gap` | 设置子元素间距 |
| `grid` | 网格布局 |
| `grid-template-columns` | 定义网格列布局 |
| `height` | 设置高度 |
| `IF` | 按条件执行 SQL |
| `if` | 条件判断 |
| `implements` | 实现接口 |
| `import` | 导入模块 |
| `IN` | 检查是否属于集合 |
| `in` | 遍历键或判断成员 |
| `INDEX` | 数据库索引 |
| `INSERT` | 写入新行 |
| `interface` | 定义对象形状 |
| `INTO` | 指定写入目标 |
| `IS` | 检查空值或布尔值 |
| `is` | 比较对象身份或空值 |
| `JOIN` | 连接另一数据表 |
| `JSON` | 用对象、数组和基本值保存结构化配置；标准 JSON 不能写注释 |
| `JSONC` | 支持注释的 JSON 配置格式，TypeScript tsconfig 使用它 |
| `justify-content` | 控制主轴上的分布方式 |
| `KEY` | 键定义 |
| `lambda` | 定义匿名函数 |
| `let` | 声明可重新赋值的变量 |
| `LIMIT` | 限制返回行数 |
| `line-height` | 设置行高 |
| `location` | Nginx 请求路径匹配块 |
| `margin` | 设置外边距 |
| `max-height` | 限制最大高度 |
| `max-width` | 限制最大宽度 |
| `min-height` | 设置最小高度 |
| `min-width` | 设置最小宽度 |
| `MQTT topic` | 消息分类路径，发布者与订阅者按它交换数据 |
| `new` | 创建对象实例 |
| `None` | Python 空值 |
| `none` | 关闭当前属性对应的效果 |
| `NOT` | 逻辑否定 |
| `not` | 逻辑否定 |
| `npm scripts` | package.json 中可通过 npm run 调用的命令 |
| `NULL` | 数据库空值 |
| `null` | 空值 |
| `of` | 遍历可迭代值 |
| `ON` | 指定连接或冲突条件 |
| `opacity` | 设置透明度 |
| `or` | 逻辑或 |
| `OR` | 逻辑或 |
| `ORDER` | 指定排序 |
| `overflow` | 决定溢出内容如何处理 |
| `padding` | 设置内边距 |
| `pass` | 保留空语句块 |
| `PLC word` | PLC 寄存器中的一个 16 位字 |
| `position` | 设置定位方式 |
| `PRIMARY` | 主键约束 |
| `private` | 限定类内部访问 |
| `proxy_pass` | Nginx 把请求转发到上游服务 |
| `public` | 公开成员 |
| `px` | 像素长度 |
| `raise` | 抛出 Python 异常 |
| `readonly` | 禁止重新赋值 |
| `REFERENCES` | 引用关联表 |
| `rem` | 相对根元素字号的长度 |
| `RETURN` | 结束函数并返回 |
| `return` | 结束函数并返回结果 |
| `RETURNING` | 返回变更后的字段 |
| `rgba(...)` | 带透明度的颜色 |
| `SCHEMA` | 数据库模式 |
| `SELECT` | 读取指定列 |
| `self` | 当前 Python 实例 |
| `SET` | 指定更新字段或配置值 |
| `super` | 父类实现 |
| `switch` | 按值分派分支 |
| `TABLE` | 数据库表 |
| `THEN` | 满足条件时的结果 |
| `this` | 当前实例 |
| `throw` | 抛出异常 |
| `transform` | 变换元素位置或形状 |
| `transition` | 设置状态变化时的过渡 |
| `True` | Python 真值 |
| `true` | 布尔真值 |
| `try` | 开始异常捕获范围 |
| `try_files` | Nginx 依序尝试文件，常用于前端路由回退 |
| `type` | 定义类型别名 |
| `typeof` | 读取值的运行时类型 |
| `undefined` | 未定义值 |
| `UNIQUE` | 保证值唯一 |
| `unknown` | 需检查后才能使用的类型 |
| `UPDATE` | 修改已有行 |
| `v-bind` | 将表达式结果绑定到属性 |
| `v-else` | 前面条件不成立时渲染 |
| `v-else-if` | 前面条件不成立时再判断 |
| `v-for` | 按集合重复渲染 |
| `v-if` | 条件为真时才渲染 |
| `v-model` | 让输入值和状态双向同步 |
| `v-on` | 监听浏览器或组件事件 |
| `v-show` | 按条件切换元素可见性 |
| `VALUES` | 给出插入值 |
| `var(--x)` | 读取 CSS 自定义属性 |
| `vh` | 视口高度的百分之一 |
| `void` | 表示没有返回值 |
| `WHERE` | 限定目标行 |
| `while` | 条件循环 |
| `width` | 设置宽度 |
| `with` | 在资源上下文中执行 |
| `{ a } = object` | 解构赋值，从对象取出同名字段 |
| `{{` | 插入表达式计算后的文本 |

## 常见运算与声明符号

| 符号 | 含义 |
|---|---|
| `=` | 赋值；把右边结果存入左边变量或属性 |
| `===` | 严格相等比较，不转换类型 |
| `!==` | 严格不等比较 |
| `=>` | 箭头函数，左边是参数、右边是结果或函数体 |
| `?.` | 可选链；左侧为空时停止读取并返回 undefined |
| `??` | 空值合并；左侧为 null/undefined 时用右侧 |
| `&&` | 逻辑与；左侧为假时不执行右侧 |
| `&#124;&#124;` | 逻辑或；左侧为真时不执行右侧 |
| `!` | 逻辑取反 |
| `? :` | 三元条件表达式 |
| `...` | 展开数组/对象或收集剩余参数 |
| ``...${x}...`` | 模板字符串，把表达式结果插入文字 |
| `@Decorator` | TypeScript/NestJS 装饰器，用元数据标记类或方法 |
| `{ a } = object` | 解构赋值，从对象取出同名字段 |
| `[a, b]` | 数组或数组类型 |
| `<T>` | 泛型参数，让类型随调用处确定 |
| `&#124;` | TypeScript 联合类型中的或 |
| `$1` | PostgreSQL 参数占位符；实际值单独传入，避免拼接 SQL |

## Vue 模板

| 写法 | 含义 |
|---|---|
| `v-if` | 条件为真时才渲染 |
| `v-else-if` | 前面条件不成立时再判断 |
| `v-else` | 前面条件不成立时渲染 |
| `v-for` | 按集合重复渲染 |
| `v-model` | 让输入值和状态双向同步 |
| `v-show` | 按条件切换元素可见性 |
| `v-bind` | 将表达式结果绑定到属性 |
| `v-on` | 监听浏览器或组件事件 |
| `:` | 属性动态绑定的简写 |
| `@` | 事件监听的简写 |
| `{{` | 插入表达式计算后的文本 |
| `#` | 命名插槽的简写 |
| `<template` | 仅用于组织模板，不生成额外 DOM 节点 |

## CSS 常用属性和单位

| 名称 | 含义 |
|---|---|
| `align-items` | 控制交叉轴上的对齐方式 |
| `background` | 设置背景 |
| `background-color` | 设置背景颜色 |
| `border` | 设置边框 |
| `border-radius` | 设置圆角 |
| `box-shadow` | 设置阴影 |
| `color` | 设置文字颜色 |
| `cursor` | 设置鼠标指针样式 |
| `display` | 决定元素如何布局或显示 |
| `flex` | 设置弹性项的伸缩比例 |
| `font-size` | 设置字号 |
| `font-weight` | 设置字重 |
| `gap` | 设置子元素间距 |
| `grid-template-columns` | 定义网格列布局 |
| `height` | 设置高度 |
| `justify-content` | 控制主轴上的分布方式 |
| `line-height` | 设置行高 |
| `margin` | 设置外边距 |
| `max-height` | 限制最大高度 |
| `max-width` | 限制最大宽度 |
| `min-height` | 设置最小高度 |
| `min-width` | 设置最小宽度 |
| `opacity` | 设置透明度 |
| `overflow` | 决定溢出内容如何处理 |
| `padding` | 设置内边距 |
| `position` | 设置定位方式 |
| `transform` | 变换元素位置或形状 |
| `transition` | 设置状态变化时的过渡 |
| `width` | 设置宽度 |
| `px` | 像素长度 |
| `%` | 相对父元素或相关参考值的百分比 |
| `rem` | 相对根元素字号的长度 |
| `vh` | 视口高度的百分之一 |
| `var(--x)` | 读取 CSS 自定义属性 |
| `calc(...)` | 在 CSS 中计算长度或其他值 |
| `rgba(...)` | 带透明度的颜色 |
| `flex` | 弹性盒布局 |
| `grid` | 网格布局 |
| `auto` | 由浏览器自动计算 |
| `none` | 关闭当前属性对应的效果 |

## 配置与部署

| 名称 | 含义 |
|---|---|
| `JSON` | 用对象、数组和基本值保存结构化配置；标准 JSON 不能写注释 |
| `JSONC` | 支持注释的 JSON 配置格式，TypeScript tsconfig 使用它 |
| `npm scripts` | package.json 中可通过 npm run 调用的命令 |
| `location` | Nginx 请求路径匹配块 |
| `proxy_pass` | Nginx 把请求转发到上游服务 |
| `try_files` | Nginx 依序尝试文件，常用于前端路由回退 |
| `MQTT topic` | 消息分类路径，发布者与订阅者按它交换数据 |
| `PLC word` | PLC 寄存器中的一个 16 位字 |
