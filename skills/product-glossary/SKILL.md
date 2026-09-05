---
name: product-glossary
description: 构建统一语言词汇表。基于 docs/product/business-flow.md 整理核心业务词汇生成 glossary.md，再用 subagent 逐页对比 docs/product/demo/ 的 HTML 原型稿，分歧项输出 glossary-different.md、缺失项补充进 glossary.md。当用户想统一术语、建词汇表、梳理统一语言时使用。
disable-model-invocation: true
---

# product-glossary

构建产品的统一语言（Unified Language）词汇表。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`、`docs/product/demo/`（≥1 个 HTML 页面）。
- 若缺失，提示用户先运行 `/simple:product-business`，然后结束，不空跑。

## 阶段 1 — 从 business-flow.md 生成基础词汇表

读 `docs/product/business-flow.md`，提取所有核心业务词汇，整理成 `docs/product/glossary.md`。

- 每个词条包含：**业务含义**（一句话）、**适用范围**（所属流程/模块）、**英文**（建议英文对应）。
- 组织为表格；缺失信息标注"待定"。`mkdir -p docs/product`。
- 若文件已存在，问用户：覆盖 / 备份后替换 / 另存。

模板：

    # <产品名> 统一语言词汇表

    | 词汇 | 业务含义 | 适用范围 | 英文 |
    | --- | --- | --- | --- |
    | <词> | <一句话业务含义> | <所属流程/模块> | <English term> |

## 阶段 2 — 逐页对比 demo 原型稿（subagent）

### 2.1 盘点页面并排除无关页

- 列出 `docs/product/demo/` 下所有 HTML 页面，报告总数。
- 用 AskUserQuestion 请用户**排除与原型无关的页面**（如 index.html 对比壳页、纯样式试水页等），得到待对比页面清单。

### 2.2 逐页并行对比（Workflow，只读）

- **收集 args**：`pages`（去 `.html`）、`demoDir`（`docs/product/demo`）、`glossaryPath`（`docs/product/glossary.md`）。
- **启动 Workflow**：Glob `**/skills/product-glossary/scripts/product-glossary.workflow.js` 得绝对路径；调用 `Workflow({ scriptPath, args })`（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）；等待 task-notification（可用 `/workflows` 观察进度）。
- **收结果**：workflow 返回每个页面的结构化发现——分歧项 `{term, page_usage, glossary_def, point}` + 缺失项 `{term, page_meaning, suggested_scope, suggested_english}`，以及失败页面清单（如有则报告并决定是否重跑）。

> workflow 内部：每个页面一个子 agent，只读（Read 该页 HTML + glossary.md），不写文件、不跑其他命令；返回 schema 校验的结构化发现。

### 2.3 汇总结果

等 workflow 返回所有页面的发现后：
- **分歧项** → 写入 `docs/product/glossary-different.md`（表格：词汇 | 页面用法 | glossary 定义 | 分歧点）。
- **缺失项** → 直接补充进 `docs/product/glossary.md`（新增行，备注"来源：demo 页面"）。

## 阶段 3 — 逐项确认分歧是否采纳

- 对 `docs/product/glossary-different.md` 中每一项，用 **AskUserQuestion 逐一确认**是否采纳进 glossary.md。
- 每项给出推荐答案，选项例如：
  - 采纳页面用法（更新 glossary 定义/表述）
  - 保留 glossary 现有定义
  - 两者都保留（页面用词标为别名）
- 注意 AskUserQuestion 一次最多 4 问，多于 4 项分多次询问。
- 采纳的更新进 `docs/product/glossary.md`；未采纳的不落文件，仅在汇总时说明。
- **全部确认完后**：把每个分歧项的最终处理在对话中**汇总给用户**（分歧点 + 采纳页面用法 / 保留 glossary / 未采纳），然后**移除** `docs/product/glossary-different.md`（内容已汇总，不再保留文件）。

## 完成后

- 报告 `docs/product/glossary.md`（基础 + 补充 + 已采纳）路径与状态；`glossary-different.md` 已在阶段 3 汇总后移除。
- 提示下一步：运行 `specs-db` 设计数据库（字段名用词汇表英文）。
