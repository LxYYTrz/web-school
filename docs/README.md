# docs/ — 文档索引

> **一句话定位**：这里放**给人看**的文档 —— 讲解材料、部署手册、数据契约、运维手册。
> 给 AI 看的项目上下文在仓库根目录的 `CLAUDE.md`。

---

## 1. 这份索引

| 路径 | 给谁看 | 什么时候更新 |
|---|---|---|
| [`walkthrough/`](walkthrough/) | 汇报现场（讲解者 + 听众） | 讲完一个模块就补一篇；代码结构变了就同步 |
| `contract/README.md` | **边缘 / 后端 / 前端三方**（唯一约定） | 契约升版本时（只增字段，不改名不删） |
| `contract/register-mapping.template.csv` | 现场电气工程师 | 新增产线点位时复制一份 |
| `deployment.md` | 运维 / 接手的工程师 | 架构或部署步骤变了 |
| `deploy-guide.md` | 运维 | 照做即可的部署手册 |
| `feishu-hermes.md` | 运维 | hermes / 飞书通道相关 |
| `产线数字孪生平台-技术设计文档.md` | 评审 / 立项 | 设计取舍与背景 |
| `工控机部署手册-U盘版.md` | 现场人员 | 不装 Docker 的那套流程 |

---

## 2. `walkthrough/` —— 汇报讲解材料

| 文件 | 定位 | 飞书版（投屏用） |
|---|---|---|
| [`代码讲解.md`](walkthrough/代码讲解.md) | **展示用** —— 投屏给听众看的结构事实 | [wiki/K1ruwhmumi…](https://bcnvmiga7m0x.feishu.cn/wiki/K1ruwhmumiHABTkQqW2cEbw3nTf) |
| [`讲稿.md`](walkthrough/讲稿.md) | **演讲者自用** —— 「屏幕显示 \| 你说」对照表 | [wiki/VwDawXJURi…](https://bcnvmiga7m0x.feishu.cn/wiki/VwDawXJURiVEAtkmnvQcFbLdnCg) |

**写作规范**：[`.claude/skills/code-walkthrough-script/SKILL.md`](../.claude/skills/code-walkthrough-script/SKILL.md)
（产线讲解稿写作规范 —— 两栏对照表、记忆锚点、防串台、主动抢话……）

---

## 3. 与 `CLAUDE.md` 的分工

这两份东西**不是一回事，别混**：

| | `CLAUDE.md`（仓库根） | `docs/`（本目录） |
|---|---|---|
| 读者 | **AI session** —— 让新 session 快速接上下文 | **人** —— 讲解、部署、评审 |
| 内容 | 关键决策、踩坑、当前状态、待办、文件指引 | 完整方案、步骤、清单、讲解稿 |
| 写法 | 密集、条目化、只记"不能忘的" | 完整、可独立阅读 |
| 冲突时 | — | **`docs/` 是详细版**，CLAUDE.md 指向它 |

> 写了一条新决策 → 记 `CLAUDE.md`；要给人讲清楚 → 写 `docs/` 对应那份，并在 CLAUDE.md 里留一行指路。
