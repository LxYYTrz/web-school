"""Refresh source-line explanations without changing executable project files."""

from __future__ import annotations

import html
import re
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NOTES = ROOT / "docs" / "code-notes"
CODE_SUFFIXES = {".bat", ".conf", ".css", ".csv", ".html", ".js", ".json", ".ps1", ".py", ".sh", ".sql", ".ts", ".txt", ".vue"}
ROW = re.compile(r"^\| (\d+) \| <code>(.*?)</code> \| (.*?) \|$")
NEW_ENTRY = re.compile(r"^\*\*源码第 (\d+) 行\*\*$")
GENERIC = (
    "续写当前表达式", "结束或开始当前代码块", "调用函数、设置值或更新状态",
    "控制分支、循环或异常处理流程", "开始一个选择器或媒体规则", "结束样式块",
    "导入或导出模块符号", "设置样式属性", "补全当前 SQL 语句",
)
STYLE_MEANINGS = {
    "display": "决定元素如何布局或显示", "align-items": "控制交叉轴上的对齐方式",
    "justify-content": "控制主轴上的分布方式", "gap": "设置子元素间距",
    "color": "设置文字颜色", "background": "设置背景", "background-color": "设置背景颜色",
    "width": "设置宽度", "height": "设置高度", "min-width": "设置最小宽度",
    "min-height": "设置最小高度", "max-width": "限制最大宽度", "max-height": "限制最大高度",
    "padding": "设置内边距", "margin": "设置外边距", "border": "设置边框",
    "border-radius": "设置圆角", "font-size": "设置字号", "font-weight": "设置字重",
    "line-height": "设置行高", "overflow": "决定溢出内容如何处理",
    "position": "设置定位方式", "cursor": "设置鼠标指针样式",
    "opacity": "设置透明度", "transform": "变换元素位置或形状",
    "transition": "设置状态变化时的过渡", "box-shadow": "设置阴影",
    "flex": "设置弹性项的伸缩比例", "grid-template-columns": "定义网格列布局",
}
VUE_MEANINGS = {
    "v-if": "条件为真时才渲染", "v-else-if": "前面条件不成立时再判断",
    "v-else": "前面条件不成立时渲染", "v-for": "按集合重复渲染",
    "v-model": "让输入值和状态双向同步", "v-show": "按条件切换元素可见性",
    "v-bind": "将表达式结果绑定到属性", "v-on": "监听浏览器或组件事件",
    ":": "属性动态绑定的简写", "@": "事件监听的简写", "{{": "插入表达式计算后的文本",
    "#": "命名插槽的简写", "<template": "仅用于组织模板，不生成额外 DOM 节点",
}
HTML_ELEMENTS = {
    "el-container": "页面布局容器", "el-header": "页面顶栏", "el-main": "页面主体",
    "el-menu": "导航菜单", "el-menu-item": "导航项", "el-tag": "状态标签",
    "el-tooltip": "悬停提示", "el-icon": "图标容器", "el-button": "操作按钮",
    "el-card": "卡片", "el-table": "表格", "el-table-column": "表格列",
    "el-form": "表单", "el-form-item": "表单字段", "el-input": "输入框",
    "el-select": "选择框", "el-option": "选择项", "el-dialog": "弹窗",
    "router-view": "当前路由对应的页面", "RouterView": "当前路由对应的页面",
    "div": "容器", "span": "行内文字", "i": "图标或状态点",
    "p": "段落", "label": "表单标签", "button": "按钮",
}
ATTRIBUTE_MEANINGS = {
    "class": "指定 CSS 样式类", "style": "设置行内样式", "router": "点击菜单项时交给路由跳转",
    "mode": "设置菜单布局方向", "index": "指定菜单项的路由或编号",
    "type": "选择组件外观或字段类型", "size": "设置组件尺寸",
    "effect": "设置组件视觉效果", "placement": "决定弹出层位置",
    "content": "指定提示内容", "disabled": "控制是否禁用",
    "key": "标识循环项，帮助 Vue 复用节点", "ref": "保存元素或组件引用",
}
JSON_KEY_MEANINGS = {
    "name": "包名，用于标识当前 Node.js 项目", "version": "项目版本号",
    "private": "禁止误将项目发布到 npm", "description": "项目用途说明",
    "type": "指定 JavaScript 模块格式", "scripts": "给 npm 命令定义快捷脚本",
    "dependencies": "运行时需要安装的依赖包", "devDependencies": "仅开发和构建时使用的依赖包",
    "engines": "要求的运行时版本范围", "node": "要求的 Node.js 版本",
    "compilerOptions": "TypeScript 编译器选项", "module": "编译产物的模块格式",
    "target": "编译后允许使用的 JavaScript 语言版本", "lib": "类型检查时可用的标准库",
    "moduleResolution": "导入模块的查找规则", "strict": "启用严格类型检查",
    "outDir": "编译产物输出目录", "rootDir": "源文件根目录",
    "include": "参与编译的文件范围", "allowedTypes": "可被系统识别的控制指令类型",
    "executableTypes": "现场有 PLC 写点、允许执行的指令类型",
    "paramEnums": "控制参数到 PLC 数值的枚举映射", "notes": "控制类型的现场语义说明",
}
DECORATOR_MEANINGS = {
    "Injectable": "标记为可由 NestJS 依赖注入的服务", "Controller": "声明 HTTP 控制器及路由前缀",
    "Module": "声明 NestJS 模块的依赖和导出", "Get": "把方法绑定到 GET 路由",
    "Post": "把方法绑定到 POST 路由", "Patch": "把方法绑定到 PATCH 路由",
    "Delete": "把方法绑定到 DELETE 路由", "UseGuards": "执行路由前先应用权限守卫",
    "Inject": "按令牌注入指定依赖", "Param": "读取 URL 路径参数",
    "Body": "读取请求体", "Query": "读取 URL 查询参数",
    "Req": "读取原始请求对象", "Res": "读取原始响应对象",
    "WebSocketGateway": "声明 WebSocket 网关", "SubscribeMessage": "订阅指定 WebSocket 消息",
}
KEYWORDS = {
    "true": "布尔真值", "false": "布尔假值", "null": "空值", "undefined": "未定义值",
    "import": "导入模块", "from": "指定导入来源", "export": "导出给其他模块",
    "const": "声明不可重新绑定的变量", "let": "声明可重新赋值的变量",
    "if": "条件判断", "else": "条件不满足时的分支", "return": "结束函数并返回结果",
    "async": "声明异步函数", "await": "等待异步结果", "function": "定义函数",
    "class": "定义类", "interface": "定义对象形状", "type": "定义类型别名",
    "new": "创建对象实例", "this": "当前实例", "try": "开始异常捕获范围",
    "catch": "处理异常", "throw": "抛出异常", "for": "开始循环",
    "while": "条件循环", "def": "定义 Python 函数", "self": "当前 Python 实例",
    "None": "Python 空值", "True": "Python 真值", "False": "Python 假值",
}


def tracked_sources() -> list[Path]:
    git = shutil.which("git") or r"C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe"
    result = subprocess.run(
        [git, "ls-files", "-z"], cwd=ROOT, check=True, capture_output=True
    )
    paths = []
    for name in result.stdout.decode("utf-8").split("\0"):
        if not name or name.startswith("docs/code-notes/") or "package-lock" in name:
            continue
        path = ROOT / name
        if not path.is_file() or path.suffix not in CODE_SUFFIXES:
            if path.name not in {".gitignore", ".env.example", ".env.production"}:
                continue
        paths.append(path)
    paths.append(Path(__file__).resolve())
    return sorted(set(paths))


def old_notes(path: Path) -> dict[int, str]:
    if not path.exists():
        return {}
    git = shutil.which("git") or r"C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe"
    relative = path.relative_to(ROOT).as_posix()
    original = subprocess.run([git, "show", f"HEAD:{relative}"], cwd=ROOT, capture_output=True)
    baseline = original.stdout.decode("utf-8").splitlines() if original.returncode == 0 else []
    lines = baseline if any(ROW.match(line) for line in baseline) else path.read_text(encoding="utf-8").splitlines()
    notes: dict[int, str] = {}
    for i, line in enumerate(lines):
        match = ROW.match(line)
        if match:
            notes[int(match[1])] = html.unescape(match[3].replace("&#124;", "|"))
        match = NEW_ENTRY.match(line)
        if match and i + 4 < len(lines):
            note = lines[i + 4].strip()
            if note.startswith("// 注释：") or note.startswith("# 注释："):
                notes[int(match[1])] = note.split("注释：", 1)[1]
            elif "注释：" in note:
                notes[int(match[1])] = note.split("注释：", 1)[1].removesuffix(" */").removesuffix(" -->")
    return notes


def vue_template_lines(lines: list[str]) -> set[int]:
    if not any(line.strip() == "<template>" for line in lines):
        return set()
    result = set()
    in_template = False
    in_comment = False
    for number, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped == "<template>":
            in_template = True
        if "<!--" in stripped:
            in_comment = True
        if in_template and stripped and not in_comment:
            result.add(number)
        if "-->" in stripped:
            in_comment = False
        if in_template and stripped == "</template>":
            in_template = False
    return result


def is_code_line(path: Path, line: str) -> bool:
    text = line.strip()
    if not text:
        return False
    if path.suffix in {".py", ".ps1", ".sh", ".conf", ".txt"} and text.startswith("#") and not text.startswith("#!"):
        return False
    if (path.name.startswith(".env") or path.name == ".gitignore" or path.suffix == ".csv") and text.startswith("#"):
        return False
    if path.suffix == ".bat" and (text.lower().startswith("rem ") or text.startswith("::")):
        return False
    if path.suffix in {".ts", ".js", ".css", ".json", ".vue", ".html"} and text.startswith(("//", "/*", "*", "*/")) and not text.startswith("/// <reference"):
        return False
    if path.suffix == ".html" and text.startswith(("<!--", "-->")):
        return False
    if path.suffix == ".sql" and text.startswith(("--", "/*", "*", "*/")):
        return False
    return True


def syntax_keywords(line: str) -> str:
    found = []
    for keyword, meaning in KEYWORDS.items():
        if re.search(r"(?<![\w-])" + re.escape(keyword) + r"(?![\w-])", line):
            found.append(f"{keyword}＝{meaning}")
    return "；".join(found)


def explain_template(line: str) -> str:
    text = line.strip()
    if text == "<template>":
        return "开始 Vue 模板，定义组件渲染的内容。"
    if text == "</template>":
        return "结束当前模板或插槽内容。"
    tags = re.findall(r"</?([\w-]+)", text)
    if text.startswith("</") and tags:
        description = f"结束 {tags[0]} 元素及其中的内容。"
    elif tags:
        description = f"渲染{HTML_ELEMENTS.get(tags[0], tags[0] + ' 元素或组件')}"
        if 'class="' in text:
            style_class = re.search(r'class="([^\"]+)"', text)
            if style_class:
                description += f"，应用 {style_class[1]} 样式类"
        for directive, action in (("v-for", "按集合重复生成"), ("v-if", "条件成立时显示"), ("v-model", "与状态双向同步"), ("v-show", "按条件切换可见性")):
            bound = re.search(re.escape(directive) + r'="([^\"]+)"', text)
            if bound:
                description += f"，{action}（{bound[1]}）"
        if "{{" in text:
            expression = re.search(r"\{\{\s*(.*?)\s*\}\}", text)
            if expression:
                description += f"，其中显示 {expression[1]} 的计算结果"
        description += "。"
    elif "{{" in text:
        description = "显示花括号中表达式的结果。"
    elif text.startswith("/>") or text.startswith(">"):
        description = "结束当前元素的属性列表或自闭合标签。"
    elif "=" in text:
        match = re.match(r"([:@#]?[\w.:-]+)\s*=\s*[\"']([^\"']*)[\"']", text)
        if match:
            attribute, value = match.groups()
            plain = attribute.lstrip(":@#")
            meaning = ATTRIBUTE_MEANINGS.get(plain, "将表达式结果传给组件" if attribute.startswith(":") else "设置该属性")
            description = f"设置 {attribute}={value}：{meaning}。"
        else:
            description = "继续设置当前元素的属性。"
    elif re.match(r"[\w-]+$", text):
        description = f"启用当前元素的 {text} 布尔属性。"
    else:
        description = "显示该行文本内容或结束当前元素。"
    parts = [f"{symbol}＝{meaning}" for symbol, meaning in VUE_MEANINGS.items() if symbol in text and symbol not in {"<template", ":", "@", "#"}]
    for prefix in (":", "@", "#"):
        if re.search(r"(?<![\w])" + re.escape(prefix) + r"[\w-]+", text):
            parts.append(f"{prefix}＝{VUE_MEANINGS[prefix]}")
    if parts:
        description += " 关键字：" + "；".join(parts) + "。"
    return description


def explain_json(line: str, context: str = "") -> str:
    text = line.strip()
    match = re.match(r'"([^\"]+)"\s*:\s*(.*)', text)
    if match:
        key, value = match.groups()
        meaning = JSON_KEY_MEANINGS.get(key, "指定该项的值")
        result = f"{key}：{meaning}；当前值为 {value.rstrip(',')}。"
        if "true" in value or "false" in value or "null" in value:
            result += " 关键字：" + syntax_keywords(value) + "。"
        return result
    if text in {"{", "["}:
        return "开始一个对象或数组；对象按键保存配置，数组按顺序保存条目。"
    if text in {"}", "},", "]", "],"}:
        return "结束当前对象或数组；末尾逗号表示后面还有同级条目。"
    if re.match(r'^"[^\"]+"\s*,?$', text):
        return f"在 {context or '当前数组'} 中加入值 {text.rstrip(',')}。"
    return "继续当前 JSON 对象或数组中的值。"


def explain_csv(line: str, headers: list[str], first: bool) -> str:
    cells = [cell.strip() for cell in line.split(",")]
    if first:
        return "声明 CSV 列名；后续每行按这些列的顺序解释。"
    fields = [f"{key}={value}" for key, value in zip(headers, cells) if value]
    return "定义一条映射记录：" + "；".join(fields) + "。"


def explain_fragment(text: str, suffix: str) -> str:
    if text.startswith("lineId, deviceId,"):
        return "组装控制指令参数：指定产线、设备、指令类型、动作参数和操作人。"
    if text.startswith("regs, ModbusClientMixin"):
        return "向 Modbus 解码器传入寄存器原值、FLOAT32 类型和字序。"
    if text.startswith('"重复起采集器'):
        return "把重复启动采集器的错误提示和锁文件路径传给日志或异常。"
    if text.startswith(": '') +"):
        return "条件不满足时拼接空字符串，然后继续组装提示文本。"
    if text.startswith("`$"):
        return "构造模板字符串；${...} 插入变量，路径中的 + 在 MQTT 主题里匹配单个层级。" if "/+/" in text else "构造模板字符串，把 ${...} 中的值插入目标路径或文本。"
    if text.startswith("|"):
        return "给当前 TypeScript 联合类型增加这一行列出的允许值；竖线表示“或者”。"
    if text == "return;":
        return "立即结束当前函数，不返回具体值。"
    modifier_field = re.match(r"(?:(?:private|public|protected|readonly|static)\s+)+([\w$]+)\s*:\s*([^,;]+)[,;]?$", text)
    if modifier_field:
        return f"声明类属性或构造参数 {modifier_field[1]}，类型为 {modifier_field[2]}。"
    typed_variable = re.match(r"(?:let|const|var)\s+([\w$]+)\s*:\s*([^=;]+);?$", text)
    if typed_variable:
        return f"声明变量 {typed_variable[1]}，类型为 {typed_variable[2]}；其值稍后赋入。"
    if text == ") {}" or text == ") { }":
        return "结束构造函数参数列表；空函数体表示仅使用参数属性注入依赖。"
    decorator = re.match(r"@([A-Za-z_$][\w$]*)", text)
    if decorator:
        meaning = DECORATOR_MEANINGS.get(decorator[1], "给后面的类、方法或参数附加元数据")
        return f"装饰器 {decorator[1]}：{meaning}。"
    if text == "'use strict';" or text == '"use strict";':
        return "启用 JavaScript 严格模式，让部分隐式错误直接抛异常。"
    if text in {"{", "({"}:
        return "开始一个对象字面量，后续行逐项填写字段。"
    if text in {"};", "},", "};,"}:
        return "结束当前对象或代码块，并完成这条语句。"
    if re.match(r"^[A-Za-z_$][\w$]*,$", text):
        return f"把变量 {text[:-1]} 作为同名对象字段加入当前对象。"
    if re.match(r"^let\s+[A-Za-z_$][\w$]*;?$", text):
        return f"声明可重新赋值的变量 {text.split()[1].rstrip(';')}，稍后再赋值。"
    if re.match(r"^['\"](?:SELECT|UPDATE|DELETE|INSERT)\s", text, re.I):
        verb = re.match(r"^['\"](SELECT|UPDATE|DELETE|INSERT)", text, re.I)[1].upper()
        table = re.search(r"\b(?:FROM|INTO|UPDATE)\s+([\w.]+)", text, re.I)
        action = {"SELECT": "读取", "UPDATE": "更新", "DELETE": "删除", "INSERT": "写入"}[verb]
        return f"提供 SQL 语句，{action}{'表 ' + table[1] + ' 中的' if table else ''}数据；实际参数由外层查询调用传入。"
    if re.match(r"^['\"].*['\"]\s*\+?[,]?$", text):
        return "把这一段文字与下一段拼接。" if text.rstrip(",").endswith("+") else "把这一段文字作为当前调用、数组或对象的值。"
    if text.startswith("process.env."):
        return "读取指定环境变量；若未设置则使用右侧默认值。" if "||" in text else "读取进程环境变量中的配置值。"
    if text.startswith("{") and ":" in text:
        return "开始对象字面量，并在这一行设置其中列出的字段。"
    if text.startswith("export default "):
        return "把后面的配置或实现作为当前模块的默认导出，供其他文件直接导入。"
    if text.startswith("export "):
        return "导出这一行声明的符号，供项目其他模块使用。"
    destructured = re.match(r"(?:const|let)\s+\{([^}]+)\}\s*=\s*(.*)", text)
    if destructured:
        return f"从右侧结果中取出 {destructured[1].strip()}，分别赋给同名变量。"
    variable = re.match(r"(?:const|let|var)\s+([\w$]+)(?:\s*:[^=]+)?\s*=\s*(.*)", text)
    if variable:
        return f"声明 {variable[1]}，初始值由 {variable[2].rstrip(';')} 计算得到。"
    if re.match(r"(?:async\s+)?function\s+([\w$]+)", text):
        name = re.match(r"(?:async\s+)?function\s+([\w$]+)", text)[1]
        return f"定义函数 {name}，后续花括号内实现它的处理步骤。"
    python_function = re.match(r"(?:async\s+)?def\s+([\w_]+)\s*\(", text)
    if python_function:
        return f"定义 Python 函数 {python_function[1]}；冒号后缩进的代码是函数体。"
    python_class = re.match(r"class\s+([\w_]+)", text)
    if python_class:
        return f"定义 Python 类 {python_class[1]}，封装相关状态与方法。"
    if text.startswith("constructor("):
        return "定义类的构造函数；创建实例时接收参数并初始化依赖。"
    method = re.match(r"(?:(?:public|private|protected|async|static|readonly|override)\s+)*([A-Za-z_$][\w$]*)\s*\(.*\)\s*(?::[^{}]+)?\s*\{", text)
    if method:
        return f"定义方法 {method[1]}；括号中声明参数，花括号内实现逻辑。"
    if text.startswith("return "):
        return f"返回 {text[7:].rstrip(';')} 的值，结束当前函数。"
    if text == "continue" or text == "continue;":
        return "跳过本轮剩余语句，进入下一次循环。"
    if text == "break" or text == "break;":
        return "立即结束当前循环或分支。"
    if text == "pass":
        return "保留空代码块；这里暂时不执行操作。"
    if text.startswith("elif "):
        return f"前面的条件不成立时再判断 {text[5:].rstrip(':')}。"
    if text.startswith("raise "):
        return "抛出这一行构造的异常，由调用方或外层捕获。"
    if text.startswith("with "):
        return "在资源上下文中执行后续缩进语句，结束时自动收尾。"
    if text.startswith("throw "):
        return f"抛出 {text[6:].rstrip(';')}，交给上层错误处理。"
    if text.startswith("} catch") or text.startswith("catch") or text.startswith("except"):
        return "开始异常处理分支，接收前面代码抛出的错误。"
    if text.startswith("} finally") or text.startswith("finally"):
        return "开始收尾分支，无论前面的操作成功或失败都执行。"
    if text.startswith("} else") or text.startswith("else"):
        return "开始前一条件不满足时的分支。"
    if text.startswith("if"):
        return f"判断 {text} 中的条件，只在成立时执行对应分支。"
    if text.startswith("for") or text.startswith("while"):
        return "按照本行的遍历对象或条件重复执行后面的代码。"
    field = re.match(r"(?:['\"]([^'\"]+)['\"]|([\w$]+))\s*:\s*(.+)", text)
    if field:
        return f"设置字段 {field[1] or field[2]}，值为 {field[3].rstrip(',')}。"
    python_assignment = re.match(r"([A-Za-z_]\w*)\s*=\s*(.+)", text)
    if suffix == ".py" and python_assignment:
        return f"将 {python_assignment[2]} 的结果赋给 {python_assignment[1]}。"
    if suffix == ".py" and " = " in text:
        target, value = text.split(" = ", 1)
        return f"把 {value} 的结果赋给 {target}。"
    augmented = re.match(r"([\w.\[\]]+)\s*([+\-*/])=\s*(.+)", text)
    if augmented:
        return f"用 {augmented[3]} 更新 {augmented[1]}；{augmented[2]}= 表示先计算再赋回。"
    attribute_assignment = re.match(r"([\w.\[\]]+)\s*=\s*(.+)", text)
    if attribute_assignment:
        return f"将 {attribute_assignment[2].rstrip(';')} 的结果写入 {attribute_assignment[1]}。"
    type_field = re.match(r"([\w$]+)(\?)?\s*:\s*([^;]+);$", text)
    if suffix in {".ts", ".js"} and type_field:
        optional = "可选" if type_field[2] else "必需"
        return f"声明 {optional}字段 {type_field[1]}，类型为 {type_field[3]}。"
    if text.startswith("});") or text.startswith("}),"):
        return "结束当前回调或对象，并完成外层函数调用。"
    if text.startswith("},") or text == "}":
        return "结束当前对象、函数或条件代码块；逗号表示后面仍有同级内容。" if text.endswith(",") else "结束当前对象、函数或条件代码块。"
    if text.startswith("],") or text.startswith("]; ") or text == "]":
        return "结束当前数组，继续外层表达式。"
    if text.startswith(");") or text.startswith("),"):
        return "结束当前函数的参数列表并完成调用。"
    if text.startswith("(") or text.startswith("["):
        return "开始当前表达式的分组或数组内容。"
    if re.match(r"^this\.[\w.]+$", text):
        return f"读取 {text}，作为下一行链式方法调用的接收对象。"
    if text in {"}", "]", ")", "},", "],", "),"}:
        return "结束当前集合、分组或调用参数。"
    call = re.search(r"([\w.$]+)\s*\(", text)
    if call:
        return f"调用 {call[1]}；括号中的表达式是传入的参数。"
    if suffix == ".sql":
        return "继续当前 SQL 语句的字段、约束、参数或查询子句。"
    return "继续当前表达式；这一行的值由外层代码块或调用使用。"


def enrich(existing: str, line: str, suffix: str) -> str:
    text = line.strip()
    main, separator, keypart = existing.partition(" 关键字：")
    if text.startswith("@") and suffix in {".ts", ".js"}:
        main = explain_fragment(text, suffix)
    if main.startswith("加载后续代码需要的模块") and suffix == ".py":
        module = re.match(r"(?:from\s+([\w.]+)\s+)?import\s+(.+)", text)
        if module:
            main = f"从 {module[1] or 'Python 环境'} 导入 {module[2]}，供后续代码使用。"
    if main.startswith("创建数据库对象"):
        created = re.match(r"CREATE\s+(?:OR\s+REPLACE\s+)?(TABLE|EXTENSION|INDEX|SCHEMA|FUNCTION|TYPE)\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.]+)", text, re.I)
        if created:
            kind = {"TABLE": "表", "EXTENSION": "扩展", "INDEX": "索引", "SCHEMA": "模式", "FUNCTION": "函数", "TYPE": "类型"}[created[1].upper()]
            main = f"创建数据库{kind} {created[2]}。"
    if main.startswith("删除数据库对象"):
        dropped = re.match(r"DROP\s+(TABLE|INDEX|SCHEMA|FUNCTION|TYPE)\s+(?:IF\s+EXISTS\s+)?([\w.]+)", text, re.I)
        if dropped:
            kind = {"TABLE": "表", "INDEX": "索引", "SCHEMA": "模式", "FUNCTION": "函数", "TYPE": "类型"}[dropped[1].upper()]
            main = f"删除数据库{kind} {dropped[2]}。"
    if suffix == ".txt" and ">=" in text:
        package, limits = text.split(">=", 1)
        main = f"安装 Python 包 {package}；允许版本范围为大于等于 {limits.split(',')[0]} 且小于 {limits.split('<')[-1]}。"
    if suffix == ".css":
        declarations = re.findall(r"([\w-]+)\s*:\s*([^;]+)", text)
        if declarations:
            details = [f"{name}={value.strip()}：{STYLE_MEANINGS.get(name, '设置该样式属性')}" for name, value in declarations]
            main = "；".join(details) + "。"
    if main.startswith("导入或导出模块符号"):
        match = re.search(r"\bfrom\s+['\"]([^'\"]+)", text)
        if match:
            main = f"从 {match[1]} 导入这一行列出的符号，供本文件调用。"
    elif main.startswith("调用函数、设置值或更新状态"):
        assign = re.match(r"([\w.$?\[\]]+)\s*=\s*(.+?);?$", text)
        call = re.search(r"([\w.]+)\s*\(", text)
        if assign:
            main = f"把右侧表达式的结果写入 {assign[1]}。"
        elif call:
            main = f"调用 {call[1]}，把括号中的值作为参数传入。"
    elif main.startswith("控制分支、循环或异常处理流程"):
        if text.startswith("if"):
            main = f"判断 {text} 中的条件，成立时执行对应分支。"
        elif text.startswith("else"):
            main = "前一条件不成立时，改为执行这一分支。"
        elif text.startswith("for"):
            main = "按这一行指定的集合或范围逐个执行循环体。"
        elif text.startswith("try"):
            main = "开始可能抛出异常的操作区域。"
        elif text.startswith("catch") or text.startswith("except"):
            main = "捕获并处理前面操作抛出的异常。"
    elif main.startswith("开始一个选择器或媒体规则"):
        main = f"对选择器 {text.removesuffix('{').strip()} 匹配的元素应用后续声明。"
    elif main.startswith("设置样式属性"):
        name = text.split(":", 1)[0].strip()
        main = f"{STYLE_MEANINGS.get(name, '设置样式属性')}：{text}。"
    elif main.startswith("补全当前 SQL 语句"):
        if re.match(r"[\w_]+\s+(BIGSERIAL|SMALLINT|INTEGER|INT|TEXT|TIMESTAMPTZ|BOOLEAN|JSONB)", text, re.I):
            main = f"定义数据库字段 {text.split()[0]} 的类型、默认值或约束。"
        elif text.startswith(");"):
            main = "结束当前 SQL 表或函数定义。"
        else:
            main = explain_fragment(text, suffix)
    elif main.startswith("续写当前表达式") or main.startswith("继续当前表达式") or main.startswith("结束或开始当前代码块"):
        main = explain_fragment(text, suffix)
    elif main.startswith("声明变量") or main.startswith("返回当前函数的结果") or main.startswith("定义或调用"):
        main = explain_fragment(text, suffix)
    if separator:
        if not re.search(r"(?:^|\b)(?:export\s+)?type\s+[A-Za-z_$]|\bimport\s*\{[^}]*\btype\b", text):
            keypart = "；".join(part for part in keypart.rstrip("。").split("；") if not part.startswith(("`type`＝", "type＝")))
            if keypart:
                keypart += "。"
            else:
                separator = ""
    if separator:
        return main + " 关键字：" + keypart
    keywords = syntax_keywords(text)
    return main + (" 关键字：" + keywords + "。" if keywords else "")


def explain_new(path: Path, line: str, number: int, headers: list[str]) -> str:
    text = line.strip()
    if text.startswith("/// <reference"):
        return "引入 vite/client 的全局类型声明，让 TypeScript 识别 Vite 提供的环境类型。"
    if path.suffix == ".vue":
        return explain_template(line)
    if path.suffix == ".json":
        return explain_json(line)
    if path.suffix == ".csv":
        return explain_csv(line, headers, number == 1)
    if path.suffix in {".css", ".conf"} and ":" in text and ";" in text:
        return enrich("设置样式属性。", line, path.suffix)
    if path.suffix in {".ts", ".js", ".py", ".ps1", ".sh", ".bat"}:
        if re.match(r"(?:async\s+)?def\s+|class\s+", text):
            return explain_fragment(text, path.suffix) + (" 关键字：" + syntax_keywords(text) + "。" if syntax_keywords(text) else "")
        if text.startswith(("import ", "from ")):
            return enrich("导入或导出模块符号。", line, path.suffix)
        if text.startswith(("if ", "if(", "for ", "while ", "try", "catch", "except")):
            return enrich("控制分支、循环或异常处理流程。", line, path.suffix)
        call = re.search(r"([\w.]+)\s*\(", text)
        if call:
            return enrich("调用函数、设置值或更新状态。", line, path.suffix)
        meaning = explain_fragment(text, path.suffix)
        return meaning + (" 关键字：" + syntax_keywords(text) + "。" if syntax_keywords(text) else "")
    return "定义当前文件中的这一项配置或结构。" + (" 关键字：" + syntax_keywords(text) + "。" if syntax_keywords(text) else "")


def marker(path: Path, note: str, vue_section: str = "") -> str:
    if path.suffix == ".html" or (path.suffix == ".vue" and vue_section == "template"):
        return f"<!-- 注释：{note} -->"
    if path.suffix in {".css", ".json", ".csv"} or (path.suffix == ".vue" and vue_section == "style"):
        return f"/* 注释：{note} */"
    if path.suffix in {".py", ".ps1", ".sh", ".conf", ".bat", ".txt"} or path.name.startswith(".env"):
        return f"# 注释：{note}"
    if path.suffix == ".sql":
        return f"-- 注释：{note}"
    return f"// 注释：{note}"


def build_one(path: Path) -> int:
    relative = path.relative_to(ROOT).as_posix()
    output = NOTES / (relative + ".md")
    prior = old_notes(output)
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    template = vue_template_lines(lines) if path.suffix == ".vue" else set()
    csv_header_number = next((i for i, line in enumerate(lines, 1) if line.strip() and not line.lstrip().startswith("#")), 0) if path.suffix == ".csv" else 0
    headers = lines[csv_header_number - 1].split(",") if csv_header_number else []
    entries = []
    vue_section = ""
    json_context = ""
    in_block_comment = False
    block_end = ""
    in_docstring = False
    docstring_end = ""
    for number, line in enumerate(lines, 1):
        stripped = line.strip()
        if path.suffix == ".py":
            if in_docstring:
                if docstring_end in stripped:
                    in_docstring = False
                continue
            if stripped.startswith(('"""', "'''")):
                docstring_end = stripped[:3]
                if docstring_end not in stripped[3:]:
                    in_docstring = True
                continue
        if path.suffix == ".json":
            context_match = re.match(r'\s*"([^\"]+)"\s*:\s*\[', line)
            if context_match:
                json_context = context_match[1]
        if path.suffix == ".vue":
            if line.lstrip().startswith("<template"):
                vue_section = "template"
            elif line.lstrip().startswith("<script"):
                vue_section = "script"
            elif line.lstrip().startswith("<style"):
                vue_section = "style"
        if in_block_comment:
            if block_end in stripped:
                in_block_comment = False
            continue
        if stripped.startswith(("/*", "<!--")) or (stripped.startswith("*") and path.suffix in {".ts", ".js", ".vue", ".css"}):
            ending = "-->" if stripped.startswith("<!--") else "*/"
            if ending not in stripped:
                in_block_comment = True
                block_end = ending
            continue
        if not is_code_line(path, line):
            continue
        if number in template:
            note = explain_template(line)
        elif path.suffix == ".csv":
            note = explain_csv(line, headers, number == csv_header_number)
        elif path.suffix == ".json":
            note = explain_json(line, json_context)
        elif number in prior and path.resolve() != Path(__file__).resolve():
            language = ".css" if vue_section == "style" else ".ts" if vue_section == "script" else path.suffix
            note = enrich(prior[number], line, language)
        else:
            language_path = path.with_suffix(".ts") if vue_section == "script" else path.with_suffix(".css") if vue_section == "style" else path
            note = explain_new(language_path, line, number, headers)
        entries.append((number, line, note, vue_section))
    source_link = "../" * (len(output.relative_to(NOTES).parts) + 1) + relative
    content = [
        f"# {relative} 逐行注释", "", f"[打开源码]({source_link}) · {len(lines)} 行 · {len(entries)} 行代码说明", "",
        "以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。", "",
    ]
    for number, line, note, section in entries:
        content.extend([f"**源码第 {number} 行**", "", "```text", line, marker(path, note, section), "```", ""])
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(content), encoding="utf-8")
    return len(entries)


def verify_one(path: Path) -> int:
    relative = path.relative_to(ROOT).as_posix()
    output = NOTES / (relative + ".md")
    source = path.read_text(encoding="utf-8-sig").splitlines()
    rendered = output.read_text(encoding="utf-8").splitlines()
    previous = 0
    count = 0
    for index, line in enumerate(rendered):
        match = NEW_ENTRY.match(line)
        if not match:
            continue
        number = int(match[1])
        if number <= previous or number > len(source):
            raise ValueError(f"行号无效：{relative}:{number}")
        if rendered[index + 2] != "```text" or rendered[index + 3] != source[number - 1]:
            raise ValueError(f"源码与说明不一致：{relative}:{number}")
        if "注释：" not in rendered[index + 4] or rendered[index + 5] != "```":
            raise ValueError(f"代码下一行缺少注释：{relative}:{number}")
        previous = number
        count += 1
    return count


def build_glossary() -> None:
    path = NOTES / "keywords.md"
    words = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\| `([^`]+)` \| ([^|]+) \|", line)
        if match:
            words[match[1]] = match[2].strip()
    words.update(KEYWORDS)
    content = [
        "# 代码关键字与符号速查", "",
        "逐行注释解释代码作用；本页解释语法词和常见符号。标识符（例如 `status`、`pool`）是项目自己取的名字，不是语言关键字，其具体作用看对应源码行。", "",
        "## 语言关键字", "", "| 关键字 | 含义 |", "|---|---|",
    ]
    for word, meaning in sorted(words.items(), key=lambda item: item[0].lower()):
        content.append(f"| `{word}` | {meaning} |")
    content.extend(["", "## 常见运算与声明符号", "", "| 符号 | 含义 |", "|---|---|"])
    symbols = {
        "=": "赋值；把右边结果存入左边变量或属性", "===": "严格相等比较，不转换类型",
        "!==": "严格不等比较", "=>": "箭头函数，左边是参数、右边是结果或函数体",
        "?.": "可选链；左侧为空时停止读取并返回 undefined", "??": "空值合并；左侧为 null/undefined 时用右侧",
        "&&": "逻辑与；左侧为假时不执行右侧", "||": "逻辑或；左侧为真时不执行右侧",
        "!": "逻辑取反", "? :": "三元条件表达式", "...": "展开数组/对象或收集剩余参数",
        "`...${x}...`": "模板字符串，把表达式结果插入文字", "@Decorator": "TypeScript/NestJS 装饰器，用元数据标记类或方法",
        "{ a } = object": "解构赋值，从对象取出同名字段", "[a, b]": "数组或数组类型",
        "<T>": "泛型参数，让类型随调用处确定", "|": "TypeScript 联合类型中的或",
        "$1": "PostgreSQL 参数占位符；实际值单独传入，避免拼接 SQL",
    }
    for symbol, meaning in symbols.items():
        content.append(f"| `{symbol.replace('|', '&#124;')}` | {meaning} |")
    content.extend(["", "## Vue 模板", "", "| 写法 | 含义 |", "|---|---|"])
    for symbol, meaning in VUE_MEANINGS.items():
        content.append(f"| `{symbol}` | {meaning} |")
    content.extend(["", "## CSS 常用属性和单位", "", "| 名称 | 含义 |", "|---|---|"])
    for symbol, meaning in sorted(STYLE_MEANINGS.items()):
        content.append(f"| `{symbol}` | {meaning} |")
    for symbol, meaning in {"px": "像素长度", "%": "相对父元素或相关参考值的百分比", "rem": "相对根元素字号的长度", "vh": "视口高度的百分之一", "var(--x)": "读取 CSS 自定义属性", "calc(...)": "在 CSS 中计算长度或其他值", "rgba(...)": "带透明度的颜色", "flex": "弹性盒布局", "grid": "网格布局", "auto": "由浏览器自动计算", "none": "关闭当前属性对应的效果"}.items():
        content.append(f"| `{symbol}` | {meaning} |")
    content.extend(["", "## 配置与部署", "", "| 名称 | 含义 |", "|---|---|"])
    for symbol, meaning in {"JSON": "用对象、数组和基本值保存结构化配置；标准 JSON 不能写注释", "JSONC": "支持注释的 JSON 配置格式，TypeScript tsconfig 使用它", "npm scripts": "package.json 中可通过 npm run 调用的命令", "location": "Nginx 请求路径匹配块", "proxy_pass": "Nginx 把请求转发到上游服务", "try_files": "Nginx 依序尝试文件，常用于前端路由回退", "MQTT topic": "消息分类路径，发布者与订阅者按它交换数据", "PLC word": "PLC 寄存器中的一个 16 位字"}.items():
        content.append(f"| `{symbol}` | {meaning} |")
    path.write_text("\n".join(content) + "\n", encoding="utf-8")


def main() -> None:
    grouped: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for path in tracked_sources():
        count = build_one(path)
        if verify_one(path) != count:
            raise ValueError(f"注释数量不一致：{path}")
        relative = path.relative_to(ROOT).as_posix()
        grouped[relative.split("/", 1)[0]].append((relative, count))
    total_files = sum(map(len, grouped.values()))
    total_lines = sum(count for values in grouped.values() for _, count in values)
    build_glossary()
    glossary = NOTES / "keywords.md"
    index = [
        "# 项目源码逐行注释", "",
        "每个文件的说明按原始行号排列：**一行代码，下一行注释**。注释解释该行作用，并就出现的语法关键字写出含义；",
        "全局术语另见[编程关键字速查](keywords.md)。说明文件独立于运行代码，因此 JSON、Vue 模板和构建流程保持有效。", "",
        f"当前覆盖 {total_files} 个手写文本文件、{total_lines} 行代码。排除 Markdown 文档、依赖锁文件、第三方 wheel、node_modules 和构建产物 dist。", "",
        "源码变化后运行 `py -3.13 scripts/generate-code-notes.py` 更新行号和说明，再检查具体解释是否准确。", "",
    ]
    for section, files in sorted(grouped.items()):
        index.extend([f"## {section}", ""])
        for relative, count in files:
            index.append(f"- [{relative}]({relative}.md)：{count} 行")
        index.append("")
    (NOTES / "README.md").write_text("\n".join(index), encoding="utf-8")
    print(f"生成 {total_files} 个文件、{total_lines} 行代码注释；关键字表：{glossary}")


if __name__ == "__main__":
    main()
