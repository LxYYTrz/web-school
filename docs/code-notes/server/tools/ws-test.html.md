# server/tools/ws-test.html 逐行注释

[打开源码](../../../../server/tools/ws-test.html) · 77 行 · 33 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
<!doctype html>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 25 行**

```text
<html lang="zh-CN">
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 26 行**

```text
<head>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 27 行**

```text
  <meta charset="utf-8">
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 28 行**

```text
  <title>line-twin WebSocket 联调</title>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 29 行**

```text
  <style>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 31 行**

```text
    body { font-family: monospace; margin: 16px; }
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 33 行**

```text
    #log { height: 78vh; overflow: auto; background: #111; color: #0f0; padding: 8px; white-space: pre-wrap; }
<!-- 注释：定义当前文件中的这一项配置或结构。 -->
```

**源码第 34 行**

```text
  </style>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 35 行**

```text
</head>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 36 行**

```text
<body>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 37 行**

```text
  <h3>实时数据测试(line-01)</h3>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 38 行**

```text
  <p>连接 http://localhost:3000,订阅 robot_state / line_status / event</p>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 40 行**

```text
  <div id="log"></div>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 43 行**

```text
  <script src="https://unpkg.com/socket.io-client@4.8.1/dist/socket.io.min.js"></script>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 44 行**

```text
  <script>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 46 行**

```text
    const logEl = document.getElementById('log');
<!-- 注释：设置页面文本、样式或脚本语句。 关键字：const＝声明不可重新绑定的变量。 -->
```

**源码第 48 行**

```text
    const log = (m) => { logEl.textContent = m + '\n' + logEl.textContent; };
<!-- 注释：设置页面文本、样式或脚本语句。 关键字：const＝声明不可重新绑定的变量。 -->
```

**源码第 51 行**

```text
    const socket = io('http://localhost:3000');
<!-- 注释：设置页面文本、样式或脚本语句。 关键字：const＝声明不可重新绑定的变量。 -->
```

**源码第 54 行**

```text
    socket.on('connect', () => {
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 55 行**

```text
      log('connected: ' + socket.id);
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 57 行**

```text
      socket.emit('subscribe', { lineId: 'line-01' }, (ack) => log('subscribe ack: ' + JSON.stringify(ack)));
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 58 行**

```text
    });
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 61 行**

```text
    let robotCount = 0;
<!-- 注释：设置页面文本、样式或脚本语句。 关键字：let＝声明可重新赋值的变量。 -->
```

**源码第 62 行**

```text
    socket.on('robot_state', (m) => {
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 64 行**

```text
      if (++robotCount % 10 === 0) log(`robot_state x${robotCount}  joints=${JSON.stringify(m.joints)}`);
<!-- 注释：设置页面文本、样式或脚本语句。 关键字：if＝条件判断。 -->
```

**源码第 65 行**

```text
    });
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 68 行**

```text
    socket.on('line_status', (m) => log('line_status: ' + JSON.stringify(m)));
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 71 行**

```text
    socket.on('event', (m) => log('event: ' + JSON.stringify(m)));
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 74 行**

```text
    socket.on('connect_error', (e) => log('connect_error: ' + e.message));
<!-- 注释：设置页面文本、样式或脚本语句。 -->
```

**源码第 75 行**

```text
  </script>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 76 行**

```text
</body>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```

**源码第 77 行**

```text
</html>
<!-- 注释：声明或结束一个 HTML 标签及其属性。 -->
```
