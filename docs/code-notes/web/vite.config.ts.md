# web/vite.config.ts 逐行说明

[打开源码](../../../web/vite.config.ts) · 56 行 · 12 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 32 | <code>import { defineConfig } from 'vite';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 36 | <code>import vue from '@vitejs/plugin-vue';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 41 | <code>export default defineConfig({</code> | 续写当前表达式、对象、类型或调用。 关键字：`export`＝向其他模块开放符号；`default`＝指定默认导出或默认分支。 |
| 43 | <code>plugins: [vue()],</code> | 设置字段 `plugins`。 |
| 45 | <code>server: {</code> | 设置字段 `server`。 |
| 47 | <code>port: 5173,</code> | 设置字段 `port`。 |
| 49 | <code>proxy: {</code> | 设置字段 `proxy`。 |
| 51 | <code>'/api': { target: 'http://localhost:3000', changeOrigin: true },</code> | 续写当前表达式、对象、类型或调用。 关键字：`true`＝布尔真值。 |
| 53 | <code>'/socket.io': { target: 'http://localhost:3000', ws: true },</code> | 续写当前表达式、对象、类型或调用。 关键字：`true`＝布尔真值。 |
| 54 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 55 | <code>},</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 56 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
