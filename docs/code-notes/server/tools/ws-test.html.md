# server/tools/ws-test.html 逐行说明

[打开源码](../../../../server/tools/ws-test.html) · 77 行 · 32 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>&lt;!doctype html&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 25 | <code>&lt;html lang="zh-CN"&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 26 | <code>&lt;head&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 27 | <code>&lt;meta charset="utf-8"&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 28 | <code>&lt;title&gt;line-twin WebSocket 联调&lt;/title&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 29 | <code>&lt;style&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 31 | <code>body { font-family: monospace; margin: 16px; }</code> | 设置页面文本、样式或脚本语句。 |
| 34 | <code>&lt;/style&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 35 | <code>&lt;/head&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 36 | <code>&lt;body&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 37 | <code>&lt;h3&gt;实时数据测试(line-01)&lt;/h3&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 38 | <code>&lt;p&gt;连接 http://localhost:3000,订阅 robot_state / line_status / event&lt;/p&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 40 | <code>&lt;div id="log"&gt;&lt;/div&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 43 | <code>&lt;script src="https://unpkg.com/socket.io-client@4.8.1/dist/socket.io.min.js"&gt;&lt;/script&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 44 | <code>&lt;script&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 46 | <code>const logEl = document.getElementById('log');</code> | 设置页面文本、样式或脚本语句。 |
| 48 | <code>const log = (m) =&gt; { logEl.textContent = m + '\n' + logEl.textContent; };</code> | 设置页面文本、样式或脚本语句。 |
| 51 | <code>const socket = io('http://localhost:3000');</code> | 设置页面文本、样式或脚本语句。 |
| 54 | <code>socket.on('connect', () =&gt; {</code> | 设置页面文本、样式或脚本语句。 |
| 55 | <code>log('connected: ' + socket.id);</code> | 设置页面文本、样式或脚本语句。 |
| 57 | <code>socket.emit('subscribe', { lineId: 'line-01' }, (ack) =&gt; log('subscribe ack: ' + JSON.stringify(ack)));</code> | 设置页面文本、样式或脚本语句。 |
| 58 | <code>});</code> | 设置页面文本、样式或脚本语句。 |
| 61 | <code>let robotCount = 0;</code> | 设置页面文本、样式或脚本语句。 |
| 62 | <code>socket.on('robot_state', (m) =&gt; {</code> | 设置页面文本、样式或脚本语句。 |
| 64 | <code>if (++robotCount % 10 === 0) log(`robot_state x${robotCount}  joints=${JSON.stringify(m.joints)}`);</code> | 设置页面文本、样式或脚本语句。 |
| 65 | <code>});</code> | 设置页面文本、样式或脚本语句。 |
| 68 | <code>socket.on('line_status', (m) =&gt; log('line_status: ' + JSON.stringify(m)));</code> | 设置页面文本、样式或脚本语句。 |
| 71 | <code>socket.on('event', (m) =&gt; log('event: ' + JSON.stringify(m)));</code> | 设置页面文本、样式或脚本语句。 |
| 74 | <code>socket.on('connect_error', (e) =&gt; log('connect_error: ' + e.message));</code> | 设置页面文本、样式或脚本语句。 |
| 75 | <code>&lt;/script&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 76 | <code>&lt;/body&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
| 77 | <code>&lt;/html&gt;</code> | 声明或结束一个 HTML 标签及其属性。 |
