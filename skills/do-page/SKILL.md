---
name: do-page
description: 页面开发（执行型，仅写页面的端，subagent 会写真实页面代码）。主流程只做编排：盘点 docs/specs/page-UCS 数量、控制待办任务、最后整体构建；每个页面由顺序逐一 subagent 按 page-UCS + demo + API 实现（组件库从 tech-stack-rule、dark/light 与 mock 跟已实现页面一致、先 mock 数据、单任务编译通过）。当用户要实现页面代码时使用。
---

# do-page

按页面公约实现页面代码。**执行型——subagent 在项目里写真实页面代码。仅写页面的端适用**（前端 / App / 桌面端 / 小程序）。

> **主流程只做编排，不读业务 spec**（避免上下文超限）；spec 读取由各 subagent 自行完成。

## 前置依赖（先检查，缺失就停）

- **非后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 = 后端**，提示此 skill 只服务写页面的端，结束。
- 必须存在：`docs/specs/page-UCS/`（≥1 个页面公约）、`docs/product/demo/`（demo HTML）、`docs/standards/tech-stack-rule.md`（组件库）、`docs/specs/API/`（接口）。
- 建议存在：`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`、项目代码已搭建（`do-directory` / `do-api` 产出）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 盘点页面公约，生成待办/任务清单（主流程只做编排）

- 列出 `docs/specs/page-UCS/` 下所有页面，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需实现的页面**（如预留、仅占位）。
- 为每个待实现页面生成一个**待办/任务**：`任务N：<页面>.md → 实现页面`，得到**任务清单**。
- **用待办事项分别登记并跟进**每个任务。
- 确认目标项目根目录（默认当前工作目录）。

## Step 2 — 逐任务顺序执行（每任务一个 subagent，直接写页面）

按任务清单**顺序**逐一执行：每起一个 subagent 实现一个页面；该任务完成（subagent 报告编译通过）后再处理下一个。**不要并行、不要跳跃**——共享文件（路由、样式主题等，具体文件名以所选技术栈为准）靠顺序执行避免冲突。

每个 subagent 的 prompt 必须**自包含**（用 `templates/page-impl-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本页面公约 + demo HTML + tech-stack-rule（组件库/构建命令）+ directory-rule + tools-rule + 相关 API + 已实现页面（dark/light、mock 惯例）。
- 按公约实现（URL / 数据源 / 组件树 / 组件调整 / 交互流）；组件库从 tech-stack-rule；dark/light 与 mock 与已实现一致；先 mock 数据；**单任务编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告编译通过。失败则让该 subagent 修复。

## Step 3 — 全部完成后整体构建

- 所有页面完成后，主流程在项目根跑一次**整体构建**（构建命令按项目形态判断，或从 tech-stack-rule 取一次），确认无回归。

## 完成后

- 报告：实现的页面清单（待办逐项状态）、整体构建结果。
- 提示：可本地跑起预览，或继续 `ucs-page` 下一轮迭代。
