---
name: standards-http
description: HTTP handler 请求流转说明（仅后端）。读 architecture 选型（tech-stack-rule.md 的选型上下文）+ 目录结构（directory-rule.md），展示确认后按架构风格选模板，构造"请求从 HTTP Handler/Controller 到数据库流转路径"的 prompt 用 subagent 执行，输出到 docs/standards/http-handler-rule.md + http-handler-draft.md 并登记 CLAUDE.md 清单。当用户想说明 HTTP handler 怎么写、请求怎么流转、接口实现规范时使用。
---

# standards-http

HTTP handler 说明：给一个完整请求从 HTTP Handler/Controller 到数据库的流转路径。**仅后端服务适用**。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/standards/tech-stack-rule.md`（含选型上下文）、`docs/standards/directory-rule.md`（目录结构）。
- 建议存在：`docs/product/business-flow.md`、`docs/specs/data/`（DB 设计文件）、`docs/specs/API` 或 `docs/specs/grpc`（示例接口）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill（architecture / standards-directory），结束。

## Step 1 — 读 architecture 选择 + 目录结构

读 `docs/standards/tech-stack-rule.md` 顶部的"选型上下文"，提取：**端**、**技术栈**、**后端架构风格**。
读 `docs/standards/directory-rule.md`，确认**目录结构**。
- 若元信息缺失，用 AskUserQuestion 补问。

## Step 2 — 展示并确认（不重复选择）

- 向用户展示一行摘要：端、技术栈、后端架构风格、目录结构来源。
- 用 AskUserQuestion 确认："按以上选择生成 HTTP handler 流转说明？"选项：**确认**（推荐）/ **修改**（选 Other 说明改哪项）。
- 确认后使用记录值；若用户修改，按修改后的值继续。

## Step 3 — 按架构风格选模板

- 扁平业务切片 / 薄层垂直切片 → `templates/flat-slice-http.md`
- 标准 DDD → `templates/ddd-http.md`
- **其他** → AskUserQuestion 细分：标准 MVC（→ `templates/mvc-http.md`）/ 面向对象三层架构（→ `templates/oop-http.md`）/ 自定义（按用户描述；无描述时默认 flat-slice）

## Step 4 — 构造 prompt 并执行（subagent）

### 4.1 构造 prompt

- 用 **Glob 定位并读取**选中的模板文件（`**/skills/standards-http/templates/<file>.md`，不要硬编码缓存路径）。
- 替换模板内 `{语言}` 等占位，从 Step 1 的选型上下文取；`<模块>.yaml` 从 `docs/specs/API/` 下选一个代表性接口。
- prompt 必须**自包含**（subagent 不继承父级规范）。

### 4.2 执行（subagent）

用 Agent 工具起一个 subagent（prompt 用 4.1 构造好的完整内容）：
1. **要读的文件**：`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件、`docs/specs/API/<模块>.yaml`（一个示例接口）、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`。
2. **返回**（只读不写文件）：完整请求流转路径（逐环节：文件/层、做什么、调用什么）、设计理由。
3. **行为约束**：只读不写文件，返回上述结构化内容。

主流程（subagent 返回后，由主流程写文件）：
- `mkdir -p docs/standards`；文件已存在先读再合并/询问。
- 写 `docs/standards/http-handler-rule.md`：请求流转路径 + handler 编写约束（AI 直接照做）。
- 写 `docs/standards/http-handler-draft.md`：设计理由、取舍（人工追溯用）。
- 更新 `docs/standards/CLAUDE.md` 的"当前约束清单"表，补上 http-handler 行（按 init-docs 的 CLAUDE.md 约定）。

## 完成后

- 报告 `docs/standards/http-handler-rule.md` 与 `http-handler-draft.md` 路径。
- 提示新约束已登记到 `docs/standards/CLAUDE.md` 清单。
