---
name: standards-directory
description: 目录结构设计。读 architecture 写入 tech-stack-rule.md 的"选型上下文"（端/技术栈/后端架构风格），展示给用户确认后按端与架构风格选目录模板，构造目录设计 prompt 用 subagent 执行，输出目录树到 docs/standards/directory-rule.md + directory-draft.md 并登记 CLAUDE.md 清单。当用户要做目录结构设计、工程骨架、代码组织规划时使用。
disable-model-invocation: true
---

# standards-directory

目录结构设计：读 architecture 的选型 → 按端与架构风格选模板 → 构造目录设计 prompt → 输出目录树到 `docs/standards/`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/standards/tech-stack-rule.md`（architecture 产出，含端与技术栈）、`docs/product/business-flow.md`。
- 建议存在：`docs/specs/data/`（DB 设计文件）、`docs/specs/API` 或 `docs/specs/grpc`（已定义接口）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill（architecture / product-business），结束。

## Step 1 — 读 architecture 已记录的选择

读 `docs/standards/tech-stack-rule.md` 顶部的"选型上下文"元信息，提取：**端**、**技术栈**、**后端架构风格**（仅后端）。
- 若该元信息缺失（旧文件或未记录），用 AskUserQuestion 补问端与（如后端）架构风格。

## Step 2 — 展示并确认（不重复选择）

- 向用户展示一行摘要：端、技术栈、（后端）架构风格。
- 用 AskUserQuestion 确认："按以上选择进行目录设计？"选项：**确认**（推荐）/ **修改**（选 Other 说明改哪项）。
- 确认后使用记录值；若用户修改，按修改后的值继续。

### 2.1 端 → 模板映射

- 前端 → `templates/frontend-directory.md`
- 后端 → 按架构风格：
  - 扁平业务切片 / 薄层垂直切片 → `templates/flat-slice-architecture.md`
  - 标准 DDD → `templates/ddd-architecture.md`
  - **其他** → AskUserQuestion 细分：标准 MVC（→ `templates/mvc-architecture.md`）/ 面向对象三层架构（→ `templates/oop-architecture.md`）/ 自定义（按用户描述；无描述时默认 flat-slice）
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
- 提示新约束已登记到 `docs/standards/CLAUDE.md` 清单；下一步运行 `standards-http` 说明 handler 流转。
