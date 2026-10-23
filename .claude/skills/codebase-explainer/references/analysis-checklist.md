# Analysis Checklist

## A. Minimum scan (run before anything else)

Read in this order. Stop as soon as you can answer "what is this".

| Order | Target | Why |
|---|---|---|
| 1 | `README*`, `LICENSE*` | Stated purpose and legal usability |
| 2 | Manifests: `package.json`, `pyproject.toml`, `requirements*.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `Gemfile` | Language, deps, entry points, scripts |
| 3 | Top-level directory names + depth-2 tree | Layer boundaries |
| 4 | Entry files: `main.*`, `index.*`, `app.*`, `cli.*`, `__main__.py`, `cmd/` | Where execution starts |
| 5 | Test layout: `tests/`, `*_test.*`, `spec/` | Whether the project is maintained |
| 6 | CI config: `.github/workflows/`, `.gitlab-ci.yml` | What the maintainers actually verify |
| 7 | 3 largest source files by line count | Where the real logic hides |

Record findings as a table. Never ask the user a question before this is done.

## B. 能力清单 rubric

Three tiers, assigned by **frequency of use in the code path**, not by how impressive the feature sounds.

| Tier | Definition | Evidence required |
|---|---|---|
| **核心** | The project is pointless without it. Called on the default path. | Reachable from an entry point without flags |
| **常用** | A normal user hits it within a week. Behind a flag or a second entry point. | Referenced from README *and* present in code |
| **边缘** | Present, but unreachable, undocumented, or half-built. | Code exists; no caller found |

Rules:

- Every row carries `path:line`.
- A feature mentioned only in the README, with no code found, goes in a separate **声明但未找到实现** list — never into 核心.
- If a tier has more than 12 rows, you have not been selective enough. Merge.

## C. 接入成本评估 (only when the user brought a requirement)

Answer six questions. Skip none.

1. **能否实现** — yes / partially / no. If partially, name the boundary precisely.
2. **修改位置** — `file:line` for each touch point. "The auth module" is not an answer.
3. **工作量档位** — XS (<1h, config only) / S (1h-1d, single module) / M (1-3d, cross-module) / L (>3d, architectural). Give the tier **and** the basis for it.
4. **依赖风险** — new runtime deps, license compatibility, unpinned versions, postinstall scripts.
5. **不涵盖功能** — what the user asked for that this change will **not** deliver. This section is mandatory and is usually the most valuable one.
6. **最近替代方案** — if the answer is "no", the closest thing that is in scope.

## D. 风险旗标 (report, do not fix)

Scan for these and list them under 维护坑. Do not attempt remediation.

- Hardcoded credentials, tokens, API keys
- `eval` / `exec` on external input
- Postinstall / preinstall scripts in manifests
- Unpinned dependency ranges (`*`, `latest`, bare `>=`)
- Network calls at import time
- License missing, or a license incompatible with the user's stated use
- Abandoned project signals: last commit age, open issue ratio, unanswered security advisories

## E. Assumption discipline

Write a **假设确认表** at the top of every report:

| # | 假设 | 依据 | 若假设错误的影响 |
|---|---|---|---|

Then continue. Do not wait for confirmation. If the user later corrects an assumption, the table tells you exactly which sections to redo.
