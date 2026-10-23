# Output Spec

## File layout

```
codebase-report.md      # the report
demo/                   # only when a demo was produced
  README.md             # how to run it
  <entry file>
```

Write next to the analysed target. If the target is read-only, write to the current working directory and say so.

## Report skeleton

```markdown
# <项目名> 讲解报告

> 目标: <path or url>  ·  扫描范围: <files read / total>  ·  未读部分: <explicit list>

## 假设确认表
| # | 假设 | 依据 | 若假设错误的影响 |
|---|---|---|---|

## 一、一句话结论
<One sentence. Verdict + reason. No hedging.>

## 二、代码架构
- 分层: <layer → layer>
- 模块边界: <module — responsibility — path>
- 依赖方向: <who imports whom>
- 主调用链: `<entry> → <fn:line> → <fn:line> → <exit>`
- 扩展机制: <how a user adds behavior>

## 三、三级能力清单
### 核心
| 能力 | 说明 | 频度 | 位置 |
|---|---|---|---|
### 常用
### 边缘
### 声明但未找到实现
| README 声明 | 检索范围 | 结论 |

## 四、可运行 Demo
<path to demo/, plus the exact install + run commands>

## 五、踩坑点
### 环境坑
### 配置坑
### 使用坑
### 维护坑

## 六、接入成本评估
<only if the user brought a requirement — see analysis-checklist.md §C>

## 附: 风险旗标
<from analysis-checklist.md §D>
```

## Column definitions

**三级能力清单**

| Column | Content | Constraint |
|---|---|---|
| 能力 | Verb phrase, ≤12 chars | No marketing words |
| 说明 | One line, ≤40 chars | Says what it does, not why it is great |
| 频度 | 高 / 中 / 低 | Frequency in the default code path |
| 位置 | `path:line` | Must be a real anchor you opened |

**踩坑点** — four fixed sections, in this order. Each row is:

`现象 → 触发条件 → 规避方式` on one line. If you have no finding for a section, write `未发现` — do not delete the section, and do not invent an entry to fill it.

## Anchoring rules

- `path:line` means a line you actually read in this session. Never reconstruct a line number from memory.
- A claim you inferred rather than read gets the prefix `推测:` and carries no anchor.
- When a file was truncated during reading, mark the affected rows `(部分读取)`.

## Length budget

| Section | Budget |
|---|---|
| 一句话结论 | 1 sentence |
| 代码架构 | ≤25 lines |
| 能力清单 | ≤30 rows total |
| Demo | ≤40 lines of code |
| 踩坑点 | ≤16 lines |
| 接入成本 | ≤30 lines |

If you exceed a budget, cut the weakest rows — not the anchors. A report the user finishes beats a report they abandon.
