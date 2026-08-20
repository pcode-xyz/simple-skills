---
name: do-api
description: 按 API-UCS 实现后端接口代码（执行型，仅后端，subagent 会在项目里写真实代码）。主流程只做编排：盘点 docs/specs/API-UCS 数量、控制待办任务、最后整体编译；具体实现由顺序逐一 subagent 各自读取 spec 完成（路由对齐 API、models 对齐 DB、按需开发 tools、单任务编译通过）。当用户要真正实现接口代码时使用。
---

# do-api

按 API-UCS 实现后端接口代码。**执行型——subagent 在项目里写真实代码。仅后端适用。**

> **主流程只做编排，不读业务 spec**（tech-stack-rule / directory-rule / http-handler-rule / tools-rule / DB / API 等由各 subagent 自行读取），避免主流程上下文超限。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/API-UCS/`（≥1 个 UCS）。
- 建议存在：项目骨架已搭建（`do-directory` 产出）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 盘点 UCS，生成待办/任务清单（主流程只做编排）

- 列出 `docs/specs/API-UCS/` 下所有 UCS 文件，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需实现的 UCS**（如预留、仅占位）。
- 为每个待实现 UCS 生成一个**待办/任务**：`任务N：<模块>.md → 实现该模块所有接口`，得到**任务清单**。
- **用待办事项分别登记并跟进**每个任务（每完成一个标为完成）。
- 确认目标项目根目录（默认当前工作目录；`do-directory` 骨架所在）。若目标非空，说明将实现/可能冲突的文件，请用户确认。

## Step 2 — 逐任务顺序执行（每任务一个 subagent，直接写码）

按任务清单**顺序**逐一执行：每起一个 subagent 实现一个 UCS；该任务完成（subagent 报告编译通过）后再处理下一个。**不要并行、不要跳跃**（共享文件 router.go / go.mod / models 靠顺序执行避免冲突）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/api-impl-prompt.md` 模板，Glob 定位）：
- **由 subagent 自己读**：本 UCS + tech-stack-rule（语言/编译命令）+ directory-rule + http-handler-rule + tools-rule + docs/specs/data + 同名 API。
- 实现该 UCS 所有接口；路由对齐 API；models 对齐 DB；按需开发 tools；**单任务编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告编译通过。失败则让该 subagent 修复。

## Step 3 — 全部完成后整体编译

- 所有任务完成后，主流程在项目根跑一次**整体编译**：编译命令按项目形态判断（存在 `go.mod` → `go build ./...`；`package.json` → `npm run build`；`Cargo.toml` → `cargo build`；或读一次 tech-stack-rule 取其编译命令）。
- 报告整体编译结果。

## 完成后

- 报告：实现的 UCS 清单（待办逐项状态）、整体编译结果。
- 提示：可跑起服务自测，或继续 `ucs-api`/`ucs-page` 的下一轮迭代。
