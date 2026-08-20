---
name: standards-task
description: 异步任务层技术选型（仅后端）。读 architecture 选型（tech-stack-rule.md）+ 目录/工具层/handler流转，按模板直接分析并落盘 docs/standards/task-layer-rule.md + task-layer-draft.md，登记 CLAUDE.md 清单。当用户要做异步任务、消息队列、后台任务、定时任务的选型时使用。
---

# standards-task

异步任务层选型：识别异步候选场景 → 候选方案对比 → 决策 → 输出约束（rule）与分析（draft）。**仅后端适用。**

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/standards/tech-stack-rule.md`（含后端语言）、`docs/standards/directory-rule.md`（目录结构）。
- 建议存在：`docs/standards/tools-rule.md`（工具层）、`docs/product/business-flow.md`（异步候选场景）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill（architecture / standards-directory），结束。

## 模板文件（本 skill 自带）

- `templates/task-selection-prompt.md` → 异步任务选型 prompt（Glob 定位 `**/skills/standards-task/templates/task-selection-prompt.md`，不硬编码缓存路径）
- 模板中的 `{语言}` → 从 tech-stack-rule 的后端语言取值。

## Step 1 — 读 spec 提取确定清单

- `tech-stack-rule.md`：后端**语言**、异步相关中间件（如已选 Redis/队列）。
- `directory-rule.md`：目录结构（task 层将落在哪）。
- `tools-rule.md`：工具层（异步任务依赖的工具）。
- `business-flow.md`：识别异步候选场景（外部 AI 调用、通知、耗时计算、定时任务）。

## Step 2 — 展示并确认（不重复选择）

- 展示一行摘要：端=后端 / 语言 / 目录结构来源 / 识别到的异步候选场景。
- 用 AskUserQuestion 确认："按以上生成异步任务选型？"选项：**确认**（推荐）/ **修改**（选 Other 说明改哪项）。

## Step 3 — 直接分析并落盘（无需 subagent，独立小任务）

### 3.1 读取执行指南

- 用 **Glob 定位并读取** `templates/task-selection-prompt.md`，替换 `{语言}`（从 Step 1 取），得到本次分析要求。

### 3.2 主流程直接执行

按模板的分析要求**由主流程自行完成**（不另起 subagent）：

1. **读输入**：`docs/product/business-flow.md`、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`。
2. **分析**：问题背景（现状 + 需求）→ 候选方案对比（候选表 + 排除分析 + 选型理由）→ 架构设计决策 → 最佳实践 → 迁移风险。
3. **直接落盘**两个文件：
   - `docs/standards/task-layer-rule.md`（约束，AI 照做）
   - `docs/standards/task-layer-draft.md`（分析，人工追溯）
   （先 `mkdir -p docs/standards`；文件已存在先读再问：覆盖 / 备份后替换 / 跳过。）
4. 更新 `docs/standards/CLAUDE.md` 的"当前约束清单"表，补上 task-layer 行。

## 完成后

- 报告 `docs/standards/task-layer-rule.md` 与 `task-layer-draft.md` 路径。
- 提示：任务层的目录结构已定，可接 `do-directory` 落地脚手架；任务实现遵循 rule 的"四要素 + 新增任务流程"。
