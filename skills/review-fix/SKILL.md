---
name: review-fix
description: 按 review 产出的 issues.md 整改代码（执行型，subagent 会改真实代码）。主流程读 docs/review/issues.md 与用户探讨整改范围与方案 → 为每个整改项登记任务（TaskCreate）并顺序 subagent 落地（每任务读该问题 + 相关代码，按确认方案实施，单点编译/测试通过）→ 全部完成后整体构建 → 把 docs/review/ 下内容（排除 archiving）归档到 docs/review/archiving/{今日日期}。当用户要对 review 发现的问题做整改、修问题、落实 review 整改方案时使用。
disable-model-invocation: true
---

# review-fix

按 `review` 产出的 `docs/review/issues.md` 整改代码。**执行型——subagent 会写真实代码**（与 review 的"只报告不改代码"相对，这里是落地修复）。

> **主流程只做编排与探讨，不读业务代码**（避免上下文超限）；修复由各 subagent 自行读取与实施。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/review/issues.md`（review 产物，整改待办清单）、`docs/standards/tech-stack-rule.md`（语言/框架/构建命令）、项目已实现代码。
- 建议存在：`docs/specs/`（相关规格，修复对齐用）、`docs/standards/directory-rule.md`。
- 缺失必选项时，提示先运行 `review` 生成 issues.md，结束。

## Step 1 — 读 issues.md，确认整改范围

- 读 `docs/review/issues.md`（整改待办清单），**报告各严重度问题数**（P0/P1/P2/P3）。
- 用 AskUserQuestion 与用户**确认整改范围**：全部 / 只修 P0+P1 / 用户指定（列问题逐条勾选）。得到**待修问题清单**。

## Step 2 — 探讨整改方案（主流程 × 用户）

- 对待修问题清单，主流程基于 issues.md 每条自带的**修复建议**整理出整改方案，用 AskUserQuestion 与用户确认：
  - 采纳 issues.md 建议方案 / 用户指定方案 / 跳过该问题；
  - 可批量放行（如"P0/P1 都按建议方案修"）。
- 得到**整改清单**：每个待修问题 + 最终方案。

## Step 3 — 登记任务并逐一落地（每问题一个任务，顺序 subagent）

- 为整改清单里每个问题登记一个**任务/待办**（TaskCreate，pending），描述含严重度 + 问题定位（文件:行号）+ 最终方案。
- **顺序**逐一执行（修复会写共享代码，**不要并行**，与 do-* 一致防冲突）：每任务起一个 subagent（用 `templates/fix-issue-prompt.md`，prompt 自包含）：
  - subagent 读：该问题（issues.md 对应条目）+ 相关代码（按 directory-rule 定位）+ tech-stack-rule（语言/构建/测试命令）+ 相关 spec（存在才读，对齐用）。
  - 按确认的方案实施修复；**实施中若遇需用户确认的岔路（方案需调整 / 改动超范围 / 多个可行做法），subagent 直接用 AskUserQuestion 询问用户后再继续**，不自行假设；**单点验证**（编译 / 相关测试通过）。
  - 主流程轻量校验 subagent 报告 → 任务标记 completed；失败则让该 subagent 修复（或 TaskUpdate 挂起待用户定夺）。
- **全部完成后**：主流程在项目根跑一次**整体构建**（构建命令按 tech-stack-rule 取），确认无回归。

## Step 4 — 归档

- 把 `docs/review/` 下的内容（**排除 `docs/review/archiving/`**）移动到 `docs/review/archiving/{今日日期}/`：
  - 今日日期格式 YYYY-MM-DD（如 `date +%F`）；先 `mkdir -p docs/review/archiving/<日期>`，再移动（`mv`）。
  - 若当日目录已存在，先与用户确认再合并。
- 报告归档路径。

## 完成后

- 报告：整改的问题数（任务逐项状态：pending / in_progress / completed）、整体构建结果、归档路径。
- 提示：归档后 docs/review/ 已清空；下一轮 `review` 发现问题会重建 issues.md，`review-fix` 可再跑。
