# web/src/main.ts 逐行注释

[打开源码](../../../../web/src/main.ts) · 52 行 · 14 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 34 行**

```text
import { createApp } from 'vue';
// 注释：从 vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 35 行**

```text
import { createPinia } from 'pinia';
// 注释：从 pinia 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 36 行**

```text
import ElementPlus from 'element-plus';
// 注释：从 element-plus 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 37 行**

```text
import zhCn from 'element-plus/es/locale/lang/zh-cn';
// 注释：从 element-plus/es/locale/lang/zh-cn 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 38 行**

```text
import 'element-plus/dist/index.css';
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 39 行**

```text
import 'element-plus/theme-chalk/dark/css-vars.css';
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 40 行**

```text
import App from './App.vue';
// 注释：从 ./App.vue 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 41 行**

```text
import { router } from './router';
// 注释：从 ./router 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 42 行**

```text
import './styles.css';
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 45 行**

```text
const app = createApp(App);
// 注释：声明 app，初始值由 createApp(App) 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 46 行**

```text
app.use(createPinia());
// 注释：调用 app.use，把括号中的值作为参数传入。
```

**源码第 48 行**

```text
app.use(router);
// 注释：调用 app.use，把括号中的值作为参数传入。
```

**源码第 50 行**

```text
app.use(ElementPlus, { locale: zhCn });
// 注释：调用 app.use，把括号中的值作为参数传入。
```

**源码第 52 行**

```text
app.mount('#app');
// 注释：调用 app.mount，把括号中的值作为参数传入。
```
