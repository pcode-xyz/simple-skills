---
name: standards-task
description: 异步任务层技术选型（仅后端）。读 architecture 选型（tech-stack-rule.md）+ 目录/工具层/handler流转，构造"异步任务方案对比"prompt 用 subagent 直接落盘，输出 docs/standards/task-layer-rule.md + task-layer-draft.md 并登记 CLAUDE.md 清单。当用户要做异步任务、消息队列、后台任务、定时任务的选型时使用。
---

# standards-task

异步任务层选型：识别异步候选场景 → 候选方案对比 → 决策 → 输出约束（rule）与分析（draft）。**仅后端适用。**

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/standards/tech-stack-rule.md`（含后端语言）、`docs/standards/directory-rule.md`（目录结构）。
- 建议存在：`docs/standards/tools-rule.md`（工具层）、`docs/standards/http-handler-rule.md`（handler 流转）、`docs/product/business-flow.md`（异步候选场景）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill（architecture / standards-directory），结束。

## 模板文件（本 skill 自带）

- `templates/task-selection-prompt.md` → 异步任务选型 prompt（Glob 定位 `**/skills/standards-task/templates/task-selection-prompt.md`，不硬编码缓存路径）
- 模板中的 `{语言}` → 从 tech-stack-rule 的后端语言取值。

## Step 1 — 读 spec 提取确定清单

- `tech-stack-rule.md`：后端**语言**、异步相关中间件（如已选 Redis/队列）。
- `directory-rule.md`：目录结构（task 层将落在哪）。
- `tools-rule.md`：工具层（异步任务依赖的工具）。
- `http-handler-rule.md`：handler 流转（哪些 handler 会入队）。
- `business-flow.md`：识别异步候选场景（外部 AI 调用、通知、耗时计算、定时任务）。

## Step 2 — 展示并确认（不重复选择）

- 展示一行摘要：端=后端 / 语言 / 目录结构来源 / 识别到的异步候选场景。
- 用 AskUserQuestion 确认："按以上生成异步任务选型？"选项：**确认**（推荐）/ **修改**（选 Other 说明改哪项）。

## Step 3 — 构造选型 prompt 并执行（subagent，直接落盘）

### 3.1 构造 prompt

- 用 **Glob 定位并读取** `templates/task-selection-prompt.md`，替换 `{语言}`（从 Step 1 取）。
- prompt 必须**自包含**（subagent 不继承父级规范）。

### 3.2 执行（subagent）

用 Agent 工具起一个 subagent（prompt 用 3.1 构造好的完整内容）：
1. **要读的文件**：`docs/product/business-flow.md`、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`、`docs/standards/http-handler-rule.md`。
2. **执行**：按模板做问题背景 / 候选对比 / 架构决策 / 最佳实践 / 迁移风险分析；**直接落盘**两个文件：
   - `docs/standards/task-layer-rule.md`（约束，AI 照做）
   - `docs/standards/task-layer-draft.md`（分析，人工追溯）
   （先 `mkdir -p docs/standards`；文件已存在先读再问：覆盖 / 备份后替换 / 跳过。）
3. **行为约束**：只创建/修改上述两个文件；报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**：两个文件存在、rule 含约束要素、draft 含方案对比。
- 更新 `docs/standards/CLAUDE.md` 的"当前约束清单"表，补上 task-layer 行。

## 完成后

- 报告 `docs/standards/task-layer-rule.md` 与 `task-layer-draft.md` 路径。
- 提示：任务层的目录结构已定，可接 `do-directory` 落地脚手架；任务实现遵循 rule 的"四要素 + 新增任务流程"。
