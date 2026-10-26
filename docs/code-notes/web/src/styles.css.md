# web/src/styles.css 逐行注释

[打开源码](../../../../web/src/styles.css) · 120 行 · 84 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 2 行**

```text
:root {
/* 注释：对选择器 :root 匹配的元素应用后续声明。 */
```

**源码第 4 行**

```text
  --bg: #0b0f14;
/* 注释：--bg=#0b0f14：设置该样式属性。 */
```

**源码第 6 行**

```text
  --panel: rgba(18, 24, 32, 0.82);
/* 注释：--panel=rgba(18, 24, 32, 0.82)：设置该样式属性。 */
```

**源码第 8 行**

```text
  --panel-border: rgba(120, 160, 200, 0.18);
/* 注释：--panel-border=rgba(120, 160, 200, 0.18)：设置该样式属性。 */
```

**源码第 10 行**

```text
  --text: #d7e1ea;
/* 注释：--text=#d7e1ea：设置该样式属性。 */
```

**源码第 11 行**

```text
  --text-dim: #7f8c99;
/* 注释：--text-dim=#7f8c99：设置该样式属性。 */
```

**源码第 13 行**

```text
  --accent: #ff8c42;
/* 注释：--accent=#ff8c42：设置该样式属性。 */
```

**源码第 15 行**

```text
  --ok: #2ecc71;
/* 注释：--ok=#2ecc71：设置该样式属性。 */
```

**源码第 16 行**

```text
  --ng: #ff5c5c;
/* 注释：--ng=#ff5c5c：设置该样式属性。 */
```

**源码第 17 行**

```text
  --warn: #f5b041;
/* 注释：--warn=#f5b041：设置该样式属性。 */
```

**源码第 18 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 24 行**

```text
html, body, #app {
/* 注释：对选择器 html, body, #app 匹配的元素应用后续声明。 */
```

**源码第 25 行**

```text
  height: 100%;
/* 注释：height=100%：设置高度。 */
```

**源码第 26 行**

```text
  margin: 0;
/* 注释：margin=0：设置外边距。 */
```

**源码第 27 行**

```text
  background: var(--bg);
/* 注释：background=var(--bg)：设置背景。 */
```

**源码第 28 行**

```text
  color: var(--text);
/* 注释：color=var(--text)：设置文字颜色。 */
```

**源码第 29 行**

```text
  font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
/* 注释：font-family='PingFang SC', 'Microsoft YaHei', system-ui, sans-serif：设置该样式属性。 */
```

**源码第 30 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 33 行**

```text
.layout { height: 100%; }
/* 注释：height=100%：设置高度。 */
```

**源码第 36 行**

```text
.topbar {
/* 注释：对选择器 .topbar 匹配的元素应用后续声明。 */
```

**源码第 37 行**

```text
  display: flex;
/* 注释：display=flex：决定元素如何布局或显示。 */
```

**源码第 38 行**

```text
  align-items: center;
/* 注释：align-items=center：控制交叉轴上的对齐方式。 */
```

**源码第 39 行**

```text
  gap: 24px;
/* 注释：gap=24px：设置子元素间距。 */
```

**源码第 40 行**

```text
  border-bottom: 1px solid var(--panel-border);
/* 注释：border-bottom=1px solid var(--panel-border)：设置该样式属性。 */
```

**源码第 41 行**

```text
  background: rgba(10, 14, 19, 0.95);
/* 注释：background=rgba(10, 14, 19, 0.95)：设置背景。 */
```

**源码第 42 行**

```text
  padding: 0 20px;
/* 注释：padding=0 20px：设置内边距。 */
```

**源码第 43 行**

```text
  height: 52px;
/* 注释：height=52px：设置高度。 */
```

**源码第 44 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 47 行**

```text
.brand { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
/* 注释：display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=10px：设置子元素间距；white-space=nowrap：设置该样式属性。 */
```

**源码第 49 行**

```text
.brand-dot {
/* 注释：对选择器 .brand-dot 匹配的元素应用后续声明。 */
```

**源码第 50 行**

```text
  width: 10px; height: 10px; border-radius: 50%;
/* 注释：width=10px：设置宽度；height=10px：设置高度；border-radius=50%：设置圆角。 */
```

**源码第 51 行**

```text
  background: var(--accent);
/* 注释：background=var(--accent)：设置背景。 */
```

**源码第 52 行**

```text
  box-shadow: 0 0 10px var(--accent);
/* 注释：box-shadow=0 0 10px var(--accent)：设置阴影。 */
```

**源码第 53 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 54 行**

```text
.brand-name { font-weight: 600; letter-spacing: 1px; }
/* 注释：font-weight=600：设置字重；letter-spacing=1px：设置该样式属性。 */
```

**源码第 57 行**

```text
.nav { flex: 1; background: transparent; border-bottom: none; }
/* 注释：flex=1：设置弹性项的伸缩比例；background=transparent：设置背景；border-bottom=none：设置该样式属性。 */
```

**源码第 58 行**

```text
.nav .el-menu-item { color: var(--text-dim); }
/* 注释：color=var(--text-dim)：设置文字颜色。 */
```

**源码第 59 行**

```text
.nav .el-menu-item.is-active { color: var(--accent); }
/* 注释：color=var(--accent)：设置文字颜色。 */
```

**源码第 62 行**

```text
.badges { display: flex; align-items: center; gap: 14px; white-space: nowrap; }
/* 注释：display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=14px：设置子元素间距；white-space=nowrap：设置该样式属性。 */
```

**源码第 63 行**

```text
.badge {
/* 注释：对选择器 .badge 匹配的元素应用后续声明。 */
```

**源码第 64 行**

```text
  display: inline-flex; align-items: center; gap: 6px;
/* 注释：display=inline-flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=6px：设置子元素间距。 */
```

**源码第 65 行**

```text
  font-size: 12px; color: var(--text-dim);
/* 注释：font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
```

**源码第 66 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 68 行**

```text
.dot {
/* 注释：对选择器 .dot 匹配的元素应用后续声明。 */
```

**源码第 69 行**

```text
  width: 8px; height: 8px; border-radius: 50%; display: inline-block;
/* 注释：width=8px：设置宽度；height=8px：设置高度；border-radius=50%：设置圆角；display=inline-block：决定元素如何布局或显示。 */
```

**源码第 70 行**

```text
  background: #555;
/* 注释：background=#555：设置背景。 */
```

**源码第 71 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 72 行**

```text
.dot.ok { background: var(--ok); box-shadow: 0 0 8px var(--ok); }
/* 注释：background=var(--ok)：设置背景；box-shadow=0 0 8px var(--ok)：设置阴影。 */
```

**源码第 73 行**

```text
.dot.off { background: var(--ng); box-shadow: 0 0 8px var(--ng); }
/* 注释：background=var(--ng)：设置背景；box-shadow=0 0 8px var(--ng)：设置阴影。 */
```

**源码第 74 行**

```text
.alarm { color: var(--ng); }
/* 注释：color=var(--ng)：设置文字颜色。 */
```

**源码第 76 行**

```text
.alarm-dot { background: var(--ng); box-shadow: 0 0 8px var(--ng); animation: blink 1s infinite; }
/* 注释：background=var(--ng)：设置背景；box-shadow=0 0 8px var(--ng)：设置阴影；animation=blink 1s infinite：设置该样式属性。 */
```

**源码第 77 行**

```text
@keyframes blink { 50% { opacity: 0.3; } }
/* 注释：opacity=0.3：设置透明度。 */
```

**源码第 81 行**

```text
.st-running, .st-feeding, .st-assembling, .st-waiting_robot, .st-unload_done,
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 82 行**

```text
.st-unloading {
/* 注释：对选择器 .st-unloading 匹配的元素应用后续声明。 */
```

**源码第 83 行**

```text
  color: var(--ok);           /* 产线在动 */
/* 注释：color=var(--ok)：设置文字颜色。 */
```

**源码第 84 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 85 行**

```text
.st-waiting_feed, .st-waiting_next, .st-idle {
/* 注释：对选择器 .st-waiting_feed, .st-waiting_next, .st-idle 匹配的元素应用后续声明。 */
```

**源码第 86 行**

```text
  color: var(--accent);       /* 等待下一动作 */
/* 注释：color=var(--accent)：设置文字颜色。 */
```

**源码第 87 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 88 行**

```text
.st-stopped, .st-manual_mode {
/* 注释：对选择器 .st-stopped, .st-manual_mode 匹配的元素应用后续声明。 */
```

**源码第 89 行**

```text
  color: var(--text-dim);     /* 停止 / 手动接管 */
/* 注释：color=var(--text-dim)：设置文字颜色。 */
```

**源码第 90 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 91 行**

```text
.st-init_error, .st-alarm {
/* 注释：对选择器 .st-init_error, .st-alarm 匹配的元素应用后续声明。 */
```

**源码第 92 行**

```text
  color: var(--ng);           /* 异常 */
/* 注释：color=var(--ng)：设置文字颜色。 */
```

**源码第 93 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 94 行**

```text
.st-offline {
/* 注释：对选择器 .st-offline 匹配的元素应用后续声明。 */
```

**源码第 95 行**

```text
  color: var(--text-dim);
/* 注释：color=var(--text-dim)：设置文字颜色。 */
```

**源码第 96 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 100 行**

```text
.body { padding: 14px; height: calc(100% - 52px); overflow: auto; }
/* 注释：padding=14px：设置内边距；height=calc(100% - 52px)：设置高度；overflow=auto：决定溢出内容如何处理。 */
```

**源码第 103 行**

```text
.panel {
/* 注释：对选择器 .panel 匹配的元素应用后续声明。 */
```

**源码第 104 行**

```text
  background: var(--panel);
/* 注释：background=var(--panel)：设置背景。 */
```

**源码第 105 行**

```text
  border: 1px solid var(--panel-border);
/* 注释：border=1px solid var(--panel-border)：设置边框。 */
```

**源码第 106 行**

```text
  border-radius: 10px;
/* 注释：border-radius=10px：设置圆角。 */
```

**源码第 107 行**

```text
  padding: 12px 14px;
/* 注释：padding=12px 14px：设置内边距。 */
```

**源码第 108 行**

```text
  backdrop-filter: blur(6px);
/* 注释：backdrop-filter=blur(6px)：设置该样式属性。 */
```

**源码第 109 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 111 行**

```text
.panel-title {
/* 注释：对选择器 .panel-title 匹配的元素应用后续声明。 */
```

**源码第 112 行**

```text
  font-size: 12px; color: var(--text-dim);
/* 注释：font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
```

**源码第 113 行**

```text
  letter-spacing: 2px; margin-bottom: 10px;
/* 注释：letter-spacing=2px：设置该样式属性；margin-bottom=10px：设置该样式属性。 */
```

**源码第 114 行**

```text
  display: flex; align-items: center; justify-content: space-between;
/* 注释：display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=space-between：控制主轴上的分布方式。 */
```

**源码第 115 行**

```text
}
/* 注释：结束样式块或续写样式声明。 */
```

**源码第 118 行**

```text
::-webkit-scrollbar { width: 8px; height: 8px; }
/* 注释：width=8px：设置宽度；height=8px：设置高度。 */
```

**源码第 119 行**

```text
::-webkit-scrollbar-thumb { background: #2a3442; border-radius: 4px; }
/* 注释：background=#2a3442：设置背景；border-radius=4px：设置圆角。 */
```

**源码第 120 行**

```text
::-webkit-scrollbar-track { background: transparent; }
/* 注释：background=transparent：设置背景。 */
```
