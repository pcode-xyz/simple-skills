---
name: standards-tools
description: 工具层设计（通用，任何端/任何架构方式都有工具层）。读 architecture 选型（tech-stack-rule.md 的选型上下文）+ 目录结构（directory-rule.md），展示确认后按端与架构风格选工具层模板，构造 prompt 用 subagent 执行，输出工具层组织方式到 docs/standards/tools-rule.md + tools-draft.md 并登记 CLAUDE.md 清单。当用户想说明工具层怎么组织、组件库包结构、业务代码如何调用工具时使用。
---

# standards-tools

工具层设计：说明工具层的组织方式（组件库包结构、业务代码如何调用）。**任何端、任何架构方式都可适用**。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/standards/tech-stack-rule.md`（含选型上下文）、`docs/standards/directory-rule.md`（目录结构）。
- 建议存在：`docs/product/business-flow.md`、`docs/specs/data/`（DB 设计文件，后端）、`docs/specs/API` 或 `docs/specs/grpc`（示例接口）、后端另建议 `docs/standards/http-handler-rule.md`（请求流转）。
- 缺失必选项时，提示先运行对应 skill（architecture / standards-directory），结束。

## Step 1 — 读 architecture 选择 + 目录结构

读 `docs/standards/tech-stack-rule.md` 顶部的"选型上下文"，提取：**端**、**技术栈**、**后端架构风格**（仅后端）。
读 `docs/standards/directory-rule.md`，确认**目录结构**。
- 若元信息缺失，用 AskUserQuestion 补问。

## Step 2 — 展示并确认（不重复选择）

- 向用户展示一行摘要：端、技术栈、（后端）架构风格、目录结构来源。
- 用 AskUserQuestion 确认："按以上选择生成工具层设计？"选项：**确认**（推荐）/ **修改**（选 Other 说明改哪项）。
- 确认后使用记录值；若用户修改，按修改后的值继续。

## Step 3 — 按端与架构风格选模板

- **后端** → 按架构风格：
  - 扁平业务切片 / 薄层垂直切片 → `templates/flat-slice-tools.md`
  - 标准 DDD → `templates/ddd-tools.md`（工具层 = infra 实现层）
  - **其他** → AskUserQuestion 细分：标准 MVC（→ `templates/mvc-tools.md`）/ 面向对象三层架构（→ `templates/oop-tools.md`）/ 自定义（按用户描述；无描述时默认 flat-slice）
- **前端** → `templates/frontend-tools.md`
- **App** → `templates/app-tools.md`
- **桌面端** → `templates/desktop-tools.md`
- **小程序** → `templates/miniprogram-tools.md`

## Step 4 — 构造 prompt 并执行（subagent）

### 4.1 构造 prompt

- 用 **Glob 定位并读取**选中的模板文件（`**/skills/standards-tools/templates/<file>.md`，不要硬编码缓存路径）。
- 替换模板内 `{...}` 占位（语言/框架/方案/平台），从 Step 1 的选型上下文取；`<模块>.yaml` 从 `docs/specs/API/` 下选一个代表性接口。
- prompt 必须**自包含**（subagent 不继承父级规范）。

### 4.2 执行（subagent）

用 Agent 工具起一个 subagent（prompt 用 4.1 构造好的完整内容）：
1. **要读的文件**：`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件（后端）、`docs/specs/API/<模块>.yaml`（一个示例接口）、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`；后端另读 `docs/standards/http-handler-rule.md`。
2. **返回**（只读不写文件）：工具层目录结构、各组件对外接口、以示例 handler/页面为例的调用方式、边界与初始化、设计理由。
3. **行为约束**：只读不写文件，返回上述结构化内容。

主流程（subagent 返回后，由主流程写文件）：
- `mkdir -p docs/standards`；文件已存在先读再合并/询问。
- 写 `docs/standards/tools-rule.md`：工具层组织 + 组件包结构 + 业务调用方式（AI 直接照做）。
- 写 `docs/standards/tools-draft.md`：设计理由、取舍（人工追溯用）。
- 更新 `docs/standards/CLAUDE.md` 的"当前约束清单"表，补上 tools 行（按 init-docs 的 CLAUDE.md 约定）。

## 完成后

- 报告 `docs/standards/tools-rule.md` 与 `tools-draft.md` 路径。
- 提示新约束已登记到 `docs/standards/CLAUDE.md` 清单；下一步（如需）运行 `standards-task` 选型异步任务，否则 `do-directory` 搭骨架。
