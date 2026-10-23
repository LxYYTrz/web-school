# web/src/styles.css 逐行说明

[打开源码](../../../../web/src/styles.css) · 120 行 · 75 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 2 | <code>:root {</code> | 开始一个选择器或媒体规则的样式块。 |
| 18 | <code>}</code> | 结束样式块或续写样式声明。 |
| 24 | <code>html, body, #app {</code> | 开始一个选择器或媒体规则的样式块。 |
| 25 | <code>height: 100%;</code> | 设置样式属性 `height`。 |
| 26 | <code>margin: 0;</code> | 设置样式属性 `margin`。 |
| 27 | <code>background: var(--bg);</code> | 设置样式属性 `background`。 |
| 28 | <code>color: var(--text);</code> | 设置样式属性 `color`。 |
| 29 | <code>font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;</code> | 设置样式属性 `font-family`。 |
| 30 | <code>}</code> | 结束样式块或续写样式声明。 |
| 33 | <code>.layout { height: 100%; }</code> | 为选择器 `.layout` 设置同一行列出的样式属性。 |
| 36 | <code>.topbar {</code> | 开始一个选择器或媒体规则的样式块。 |
| 37 | <code>display: flex;</code> | 设置样式属性 `display`。 |
| 38 | <code>align-items: center;</code> | 设置样式属性 `align-items`。 |
| 39 | <code>gap: 24px;</code> | 设置样式属性 `gap`。 |
| 40 | <code>border-bottom: 1px solid var(--panel-border);</code> | 设置样式属性 `border-bottom`。 |
| 41 | <code>background: rgba(10, 14, 19, 0.95);</code> | 设置样式属性 `background`。 |
| 42 | <code>padding: 0 20px;</code> | 设置样式属性 `padding`。 |
| 43 | <code>height: 52px;</code> | 设置样式属性 `height`。 |
| 44 | <code>}</code> | 结束样式块或续写样式声明。 |
| 47 | <code>.brand { display: flex; align-items: center; gap: 10px; white-space: nowrap; }</code> | 为选择器 `.brand` 设置同一行列出的样式属性。 |
| 49 | <code>.brand-dot {</code> | 开始一个选择器或媒体规则的样式块。 |
| 50 | <code>width: 10px; height: 10px; border-radius: 50%;</code> | 设置样式属性 `width`。 |
| 51 | <code>background: var(--accent);</code> | 设置样式属性 `background`。 |
| 52 | <code>box-shadow: 0 0 10px var(--accent);</code> | 设置样式属性 `box-shadow`。 |
| 53 | <code>}</code> | 结束样式块或续写样式声明。 |
| 54 | <code>.brand-name { font-weight: 600; letter-spacing: 1px; }</code> | 为选择器 `.brand-name` 设置同一行列出的样式属性。 |
| 57 | <code>.nav { flex: 1; background: transparent; border-bottom: none; }</code> | 为选择器 `.nav` 设置同一行列出的样式属性。 |
| 58 | <code>.nav .el-menu-item { color: var(--text-dim); }</code> | 为选择器 `.nav .el-menu-item` 设置同一行列出的样式属性。 |
| 59 | <code>.nav .el-menu-item.is-active { color: var(--accent); }</code> | 为选择器 `.nav .el-menu-item.is-active` 设置同一行列出的样式属性。 |
| 62 | <code>.badges { display: flex; align-items: center; gap: 14px; white-space: nowrap; }</code> | 为选择器 `.badges` 设置同一行列出的样式属性。 |
| 63 | <code>.badge {</code> | 开始一个选择器或媒体规则的样式块。 |
| 64 | <code>display: inline-flex; align-items: center; gap: 6px;</code> | 设置样式属性 `display`。 |
| 65 | <code>font-size: 12px; color: var(--text-dim);</code> | 设置样式属性 `font-size`。 |
| 66 | <code>}</code> | 结束样式块或续写样式声明。 |
| 68 | <code>.dot {</code> | 开始一个选择器或媒体规则的样式块。 |
| 69 | <code>width: 8px; height: 8px; border-radius: 50%; display: inline-block;</code> | 设置样式属性 `width`。 |
| 70 | <code>background: #555;</code> | 设置样式属性 `background`。 |
| 71 | <code>}</code> | 结束样式块或续写样式声明。 |
| 72 | <code>.dot.ok { background: var(--ok); box-shadow: 0 0 8px var(--ok); }</code> | 为选择器 `.dot.ok` 设置同一行列出的样式属性。 |
| 73 | <code>.dot.off { background: var(--ng); box-shadow: 0 0 8px var(--ng); }</code> | 为选择器 `.dot.off` 设置同一行列出的样式属性。 |
| 74 | <code>.alarm { color: var(--ng); }</code> | 为选择器 `.alarm` 设置同一行列出的样式属性。 |
| 76 | <code>.alarm-dot { background: var(--ng); box-shadow: 0 0 8px var(--ng); animation: blink 1s infinite; }</code> | 为选择器 `.alarm-dot` 设置同一行列出的样式属性。 |
| 77 | <code>@keyframes blink { 50% { opacity: 0.3; } }</code> | 为选择器 `@keyframes blink` 设置同一行列出的样式属性。 |
| 81 | <code>.st-running, .st-feeding, .st-assembling, .st-waiting_robot, .st-unload_done,</code> | 结束样式块或续写样式声明。 |
| 82 | <code>.st-unloading {</code> | 开始一个选择器或媒体规则的样式块。 |
| 83 | <code>color: var(--ok);           /* 产线在动 */</code> | 设置样式属性 `color`。 |
| 84 | <code>}</code> | 结束样式块或续写样式声明。 |
| 85 | <code>.st-waiting_feed, .st-waiting_next, .st-idle {</code> | 开始一个选择器或媒体规则的样式块。 |
| 86 | <code>color: var(--accent);       /* 等待下一动作 */</code> | 设置样式属性 `color`。 |
| 87 | <code>}</code> | 结束样式块或续写样式声明。 |
| 88 | <code>.st-stopped, .st-manual_mode {</code> | 开始一个选择器或媒体规则的样式块。 |
| 89 | <code>color: var(--text-dim);     /* 停止 / 手动接管 */</code> | 设置样式属性 `color`。 |
| 90 | <code>}</code> | 结束样式块或续写样式声明。 |
| 91 | <code>.st-init_error, .st-alarm {</code> | 开始一个选择器或媒体规则的样式块。 |
| 92 | <code>color: var(--ng);           /* 异常 */</code> | 设置样式属性 `color`。 |
| 93 | <code>}</code> | 结束样式块或续写样式声明。 |
| 94 | <code>.st-offline {</code> | 开始一个选择器或媒体规则的样式块。 |
| 95 | <code>color: var(--text-dim);</code> | 设置样式属性 `color`。 |
| 96 | <code>}</code> | 结束样式块或续写样式声明。 |
| 100 | <code>.body { padding: 14px; height: calc(100% - 52px); overflow: auto; }</code> | 为选择器 `.body` 设置同一行列出的样式属性。 |
| 103 | <code>.panel {</code> | 开始一个选择器或媒体规则的样式块。 |
| 104 | <code>background: var(--panel);</code> | 设置样式属性 `background`。 |
| 105 | <code>border: 1px solid var(--panel-border);</code> | 设置样式属性 `border`。 |
| 106 | <code>border-radius: 10px;</code> | 设置样式属性 `border-radius`。 |
| 107 | <code>padding: 12px 14px;</code> | 设置样式属性 `padding`。 |
| 108 | <code>backdrop-filter: blur(6px);</code> | 设置样式属性 `backdrop-filter`。 |
| 109 | <code>}</code> | 结束样式块或续写样式声明。 |
| 111 | <code>.panel-title {</code> | 开始一个选择器或媒体规则的样式块。 |
| 112 | <code>font-size: 12px; color: var(--text-dim);</code> | 设置样式属性 `font-size`。 |
| 113 | <code>letter-spacing: 2px; margin-bottom: 10px;</code> | 设置样式属性 `letter-spacing`。 |
| 114 | <code>display: flex; align-items: center; justify-content: space-between;</code> | 设置样式属性 `display`。 |
| 115 | <code>}</code> | 结束样式块或续写样式声明。 |
| 118 | <code>::-webkit-scrollbar { width: 8px; height: 8px; }</code> | 为选择器 `::-webkit-scrollbar` 设置同一行列出的样式属性。 |
| 119 | <code>::-webkit-scrollbar-thumb { background: #2a3442; border-radius: 4px; }</code> | 为选择器 `::-webkit-scrollbar-thumb` 设置同一行列出的样式属性。 |
| 120 | <code>::-webkit-scrollbar-track { background: transparent; }</code> | 为选择器 `::-webkit-scrollbar-track` 设置同一行列出的样式属性。 |
