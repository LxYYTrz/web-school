# web/src/main.ts 逐行说明

[打开源码](../../../../web/src/main.ts) · 52 行 · 14 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 34 | <code>import { createApp } from 'vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 35 | <code>import { createPinia } from 'pinia';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 36 | <code>import ElementPlus from 'element-plus';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 37 | <code>import zhCn from 'element-plus/es/locale/lang/zh-cn';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 38 | <code>import 'element-plus/dist/index.css';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 39 | <code>import 'element-plus/theme-chalk/dark/css-vars.css';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 40 | <code>import App from './App.vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 41 | <code>import { router } from './router';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 42 | <code>import './styles.css';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号。 |
| 45 | <code>const app = createApp(App);</code> | 声明变量 `app` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 46 | <code>app.use(createPinia());</code> | 调用函数、设置值或更新状态。 |
| 48 | <code>app.use(router);</code> | 调用函数、设置值或更新状态。 |
| 50 | <code>app.use(ElementPlus, { locale: zhCn });</code> | 调用函数、设置值或更新状态。 |
| 52 | <code>app.mount('#app');</code> | 调用函数、设置值或更新状态。 |
