---
name: codebase-explainer
slug: codebase-explainer
version: "1.0.2"
displayName: 昆仑增长 · 代码讲解
summary: 给一个本地代码目录或仓库地址，产出能不能用的一句话结论、分层架构与主调用链、三级能力清单、可运行带注释 Demo 与四类踩坑点，每条结论挂 路径:行号。
description: Explains an unfamiliar codebase or open-source repo end to end — whether it is worth adopting, how it is architected, what it can actually do, and how to run it. Produces a written report plus a runnable annotated demo and a pitfall list, with every conclusion anchored to path:line. Use when the user asks 讲解这个项目, 解读这个仓库, 这个代码是干嘛的, 看看这个项目, 快速上手, 看源码, 代码架构, 项目结构, 核心功能, 能力清单, 生成 demo, 写个示例, 踩坑点, 上手指南, 源码分析, 开源项目选型, 能不能用, 二次开发, 接入成本, or says explain this repo, walk me through this codebase, code review of a project, is this library worth using, how do I integrate this, onboarding to a new repo.
license: MIT
allowed-tools: Read, Write, Bash, Glob, Grep
tags: [代码阅读, 开源选型, 架构分析, 源码解读, 二次开发, 接入评估, 快速上手, 项目讲解]
---

# Codebase Explainer

Take a repository the user has never seen and produce the report they would have written after a week of reading it — in one pass, without blocking on questions.

## When to use

Apply this skill when the user:

- Points at a local directory, a git URL, or a zip and asks what it is / whether it is worth using
- Needs to onboard onto an inherited or unfamiliar codebase
- Is evaluating an open-source dependency before adopting it
- Wants an architecture summary, a capability inventory, or a runnable example
- Asks for 二次开发评估 / 接入成本评估 / 能否实现某个需求

Do not use this skill to *write* a new feature or fix a bug in the target repo — that is normal development work.

## What this skill does not do

State these limits when relevant. They are the reason the output is trustworthy.

- **It does not execute untrusted code by default.** Static reading first. Running install scripts or binaries happens only when the user explicitly asks, and never with network write access.
- **It does not verify the project's marketing claims.** README claims are reported *as claims*. Only what is visible in code is reported as fact.
- **It does not audit security.** It flags obvious risks (hardcoded secrets, `eval`, unpinned dependencies, postinstall scripts) but it is not a security review and must not be described as one.
- **It does not guess at private context.** If a module is a closed binary, a stub, or a submodule that is absent, say so — do not invent its behavior.
- **It does not promise the demo runs.** The demo is generated and syntax-checked; if the dependency set is unavailable, deliver the demo with the exact install commands and mark it unverified.

## Workflow

### 1. Minimum scan (30 seconds, never blocks)

Before asking anything: detect language mix, entry points, manifest files, test setup, license, and directory depth. Never open with a clarifying question — scan first, assume, and let the user correct.

### 2. Answer five questions, in this order

1. **一句话结论** — is this worth the user's time? One sentence, with the reason.
2. **代码架构** — layers, module boundaries, dependency direction, main call chain, extension points.
3. **三级能力清单** — what it can do, split into:
   - **核心** — the reason the project exists; high frequency
   - **常用** — supporting capabilities a normal user hits weekly
   - **边缘** — present but rarely used, or half-finished
   Each entry carries a frequency estimate and a `path:line` anchor.
4. **可运行 Demo** — the smallest annotated example that exercises the core path.
5. **踩坑点** — four sections: 环境坑 / 配置坑 / 使用坑 / 维护坑.

### 3. Only then, if the user brought a requirement

Run the **接入成本评估** branch (see `references/analysis-checklist.md` §C): what would have to change, at which `file:line`, at what effort tier, and what is explicitly out of scope.

### 4. Emit

Write the report to `codebase-report.md` next to the target, plus `demo/` if a demo was produced. Print the one-line conclusion and the report path. Do not paste the whole report into chat.

## Rules that keep the output honest

- **Every non-obvious claim carries `path:line`.** A claim without an anchor is a guess — mark it as a guess or drop it.
- **Say "not found" rather than "none".** Absence of evidence in a partial read is not absence in the project.
- **Separate observation from inference.** Use "代码显示…" for facts, "推测…" for inference.
- **Cap the report at what the user will read.** Long is not thorough. The 能力清单 is a table, not prose.
- **Assume-and-proceed beats asking.** Write your assumptions into a short 假设确认表 at the top; continue regardless of whether the user replies.

## Failure and degradation

| Situation | Response |
|---|---|
| Path missing / unreadable | Report the exact path tried. Offer to take a git URL instead. Do not scan the parent directory. |
| Repo too large to read fully | Read manifests + entry points + the 3 largest modules. State explicitly which parts were **not** read. |
| Binary-only or minified | Say so. Report file names, sizes, and any embedded strings — nothing more. |
| No tests, no manifest | Treat as a script collection. Report the entry points you found and say the structure is undocumented. |
| Demo dependencies unavailable | Ship the demo with install commands, mark it **未验证**, and say why. |
| User's requirement clearly out of scope | Say so in the first line of the 接入成本评估, then give the nearest in-scope alternative. |

## Reference files

- `references/analysis-checklist.md` — the full scan checklist, the 能力清单 rubric, and the 接入成本评估 method
- `references/output-spec.md` — exact report skeleton, table columns, and the 踩坑点 four-section format
