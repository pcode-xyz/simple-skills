---
name: do-api
description: 按 API-UCS 实现后端接口代码（执行型，仅后端，subagent 会在项目里写真实代码）。盘点 docs/specs/API-UCS 生成待办/任务清单，顺序逐一 subagent 实现每个 UCS 的接口（路由对齐 API、models 对齐 DB、按需开发 tools），编译通过即验收。当用户要真正实现接口代码时使用。
---

# do-api

按 API-UCS 实现后端接口代码。**执行型——subagent 在项目里写真实代码。仅后端适用。**

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/API-UCS/`（≥1 个 UCS）、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`、`docs/standards/http-handler-rule.md`、`docs/standards/tools-rule.md`、`docs/specs/data/`（DB 设计）。
- 建议存在：`docs/specs/API/`（接口明细）、项目骨架已搭建（`do-directory` 产出）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 读 spec 提取确定清单

- `tech-stack-rule.md`：后端**语言/框架**、**依赖管理**、**编译命令**（Go: `go build ./...`；Node: `npm run build`；Rust: `cargo build` 等）。
- `directory-rule.md`：目录结构（handler/models/路由位置）。
- `http-handler-rule.md`：handler 流转写法。
- `tools-rule.md`：工具层（业务逻辑可能需要的工具）。
- `docs/specs/data/`：DB 表/字段（models 对齐）。
- `docs/specs/API/`：接口约束（路由对齐）。

## Step 2 — 确认目标项目目录与选择

- **确认目标项目根目录**（默认当前工作目录；`do-directory` 产出的骨架所在）。若目标非空，说明将实现/可能冲突的文件，请用户确认。
- 展示一行摘要（语言/框架 / UCS 数量），AskUserQuestion 确认"按以上实现接口"。

## Step 3 — 盘点 UCS，生成待办/任务清单

- 列出 `docs/specs/API-UCS/` 下所有 UCS 文件，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需实现的 UCS**（如预留、仅占位）。
- 为每个待实现 UCS 生成一个**待办/任务**：`任务N：<模块>.md → 实现该模块所有接口`，得到**任务清单**。
- **用待办事项分别登记并跟进**每个任务（每完成一个标为完成）。

## Step 4 — 逐任务顺序执行（每任务一个 subagent，直接写码）

按任务清单**顺序**逐一执行：每起一个 subagent 实现一个 UCS；该任务**编译通过并校验**后再处理下一个。**不要并行、不要跳跃**（共享文件 router.go / go.mod / models 靠顺序执行避免冲突）。

主流程在起 subagent **前**：确认项目根已就绪（骨架存在或本次可创建）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/api-impl-prompt.md` 模板，Glob 定位、替换 `{语言}/{依赖管理}/{编译命令}`）：
1. **要读的文件**：本 UCS（`docs/specs/API-UCS/<模块>.md`）、`tech-stack-rule.md`、`directory-rule.md`、`http-handler-rule.md`、`tools-rule.md`、`docs/specs/data/` 下 DB 文件、同名 API（`docs/specs/API/<同名>.yaml`，如需要）。
2. **实现**：完成该 UCS 所有接口（handler/校验/逻辑/响应封装）；路由对齐 API；models 对齐 DB；按需开发 tools；遵守目录与流转。
3. **编译**：在项目根运行 `{编译命令}`，**通过才结束**。
4. **行为约束**：只改本 UCS 相关文件；共享文件增量追加；不覆盖无关文件。

主流程（每任务完成后）：
- **校验**：subagent 报告编译通过；抽查路由/字段与 spec 一致。失败则让该 subagent 修复或主流程修正。
- 全部任务完成后，**在项目根再跑一次整体编译**确认。

## 完成后

- 报告：实现的 UCS 清单（待办逐项状态）、编译结果。
- 提示：可跑起服务自测，或继续 `ucs-api`/`ucs-page` 的下一轮迭代。
