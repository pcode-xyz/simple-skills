---
name: standards-directory
description: 目录结构设计。读 architecture 的技术选型（docs/standards/tech-stack-rule.md）确定端与技术栈，后端再确认架构风格（DDD/扁平业务切片/薄层垂直切片/其他），按风格与端选择目录设计模板，构造目录设计 prompt 用 subagent 执行，输出目录树到 docs/standards/directory-rule.md + directory-draft.md 并登记 CLAUDE.md 清单。当用户要做目录结构设计、工程骨架、代码组织规划时使用。
---

# standards-directory

目录结构设计：读 architecture 的选型 → 按端与架构风格选模板 → 构造目录设计 prompt → 输出目录树到 `docs/standards/`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/standards/tech-stack-rule.md`（architecture 产出，含端与技术栈）、`docs/product/business-flow.md`。
- 建议存在：`docs/specs/data/`（DB 设计文件）、`docs/specs/API` 或 `docs/specs/grpc`（已定义接口）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill（architecture / product-business），结束。

## Step 1 — 读 architecture 选择

读 `docs/standards/tech-stack-rule.md`（必要时补读 `tech-stack-draft.md`），确认：
- **端**：前端 / 后端 / App / 桌面端 / 小程序；
- **技术栈**：所选语言/框架/中间件。

若 rule 文件缺失这些信息，用 AskUserQuestion 补问。

## Step 2 — 选目录模板（AskUserQuestion）

按端选择模板；**仅后端**额外确认架构风格。

### 2.1 后端架构风格（仅选后端时问）

AskUserQuestion：
- **扁平业务切片（推荐）**：业务零抽象、基础设施平铺 → `templates/flat-slice-architecture.md`
- **薄层垂直切片**：中间件/工具层抽象 + 业务平铺 → `templates/flat-slice-architecture.md`（prompt 内注明工具层可保留少量抽象）
- **标准 DDD**：四层整洁架构 + 限界上下文 → `templates/ddd-architecture.md`
- 其他（自定义）→ 默认 `flat-slice-architecture.md`

### 2.2 端 → 模板映射

- 前端 → `templates/frontend-directory.md`
- 后端 → 按 2.1 选中的模板
- App → `templates/app-directory.md`
- 桌面端 → `templates/desktop-directory.md`
- 小程序 → `templates/miniprogram-directory.md`

## Step 3 — 构造目录设计 prompt 并执行（subagent）

### 3.1 构造 prompt

- 用 **Glob 定位并读取**选中的模板文件（`**/skills/standards-directory/templates/<file>.md`，不要硬编码缓存路径）。
- 替换模板内 `{...}` 占位：`{语言/框架}`、`{技术栈}` 从 Step 1 的 tech-stack-rule.md 取；`{方案}`、`{平台}` 按 Step 2 的端与选择填。
- prompt 必须**自包含**（subagent 不继承父级规范）。

### 3.2 执行（subagent）

用 Agent 工具起一个 subagent（prompt 用 3.1 构造好的完整内容）：
1. **要读的文件**：`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件、`docs/specs/API` 或 `docs/specs/grpc` 下接口文件、`docs/standards/tech-stack-rule.md`。
2. **返回**（只读不写文件）：完整目录树、各目录职责说明、设计理由。
3. **行为约束**：只读不写文件，返回上述结构化内容。

主流程（subagent 返回后，由主流程写文件）：
- `mkdir -p docs/standards`；文件已存在先读再合并/询问。
- 写 `docs/standards/directory-rule.md`：完整目录树 + 各目录职责（AI 直接照做）。
- 写 `docs/standards/directory-draft.md`：设计理由、方案取舍（人工追溯用）。
- 更新 `docs/standards/CLAUDE.md` 的"当前约束清单"表，补上 directory 行（按 init-docs 的 CLAUDE.md 约定）。

## 完成后

- 报告 `docs/standards/directory-rule.md` 与 `directory-draft.md` 路径。
- 提示新约束已登记到 `docs/standards/CLAUDE.md` 清单。
