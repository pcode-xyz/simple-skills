---
name: specs-api-review
description: 接口满足度评审（前端视角，只报告不改）。并行页面子 agent 判断现有接口（HTTP yaml / gRPC proto）是否满足 demo 各业务页的业务/数据/交互（covered/placeholder/pure_client/gap），主流程增量聚合出前端满足度报告（共享接口需求调和 + 缺口/风险），驱动接口升级改造。HTTP 与 gRPC 双分支，产出 docs/specs/review/frontend-page-review.md。当用户要做接口评审、页面接口满足度评估、接口升级改造前评估时使用。
disable-model-invocation: true
---

# specs-api-review

接口满足度评审：判断已定义的接口是否满足 demo 各页的业务逻辑、数据与交互。**只报告，不改接口定义。**

> **主流程只做编排与汇总，不读页面 HTML / 接口定义原文 / demo JS 全文**（避免上下文超限）；页面审读由子 agent 自行完成。
> **范围边界**：本 skill 只判「接口是否满足页面」；接口设计质量（单一职责/歧义/幂等）归 `specs-api` 生成时自检，死接口排查归开发后的 `review`，不做 DB 一致性核对。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/demo/`（≥1 个业务页 HTML）。
- **接口定义目录按协议分支**（HTTP 与 gRPC 互斥，只审其一）：
  - 存在 `docs/specs/API/` → 接口定义目录 = `docs/specs/API/`（HTTP yaml）；
  - 存在 `docs/specs/grpc/` → 接口定义目录 = `docs/specs/grpc/`（gRPC proto）；
  - 两者皆无 → 提示先运行 `specs-api` 生成接口定义，结束。
- 建议存在：`docs/product/business-flow.md`（MI 锚点；缺失时页面子 agent 的 business_point 退化）。**不读 `docs/specs/data/`**：本 skill 只判接口对页面的满足度，不做 DB 一致性核对（那是 `review` / `specs-data` 的范畴）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 确定页面评审范围（AskUserQuestion，每次必问）

`ls docs/product/demo/*.html` 列出全部页面。默认推荐 = **排除 `index.html`（风格对比页）与 `preview-*.html`（风格参照页）**，即业务页（`page-*.html` 等）。用 AskUserQuestion 让用户确认：按推荐清单审 / 增删页面。

- 无任何业务页 → 提示 demo 中无业务页可审，结束。

## Step 2 — 准备派发上下文（主 agent 只做零读取的盘点）

主 agent **不读任何页面 HTML / 接口定义 / JS 全文**（避免上下文超限），只盘点存在性、把路径传给子 agent：

- **页面清单**：Step 1 确认的业务页列表。
- **接口定义目录 + 模块文件清单**：`ls` 接口定义目录，只拿文件名列表（gRPC → `docs/specs/grpc/*.proto`；HTTP → `docs/specs/API/*.yaml`）。
- **辅助文件路径**（存在才传给对应子 agent）：`docs/product/business-flow.md`（MI 锚点）。
- 接口发现与字段核对**不做**：由 P1 子 agent 完成（grep 发现 + 读命中文件），主 agent 不预读、不建索引。

## Step 3 — 派发页面子 agent（并行）

对 Step 1 的每个业务页各起一个 subagent（`Agent` 工具），提示词 = `templates/p1-page-review-prompt.md` + 该页上下文包（页面路径、接口定义目录与模块文件清单、business-flow.md 路径、**输出文件路径 `docs/specs/review/raw/page-<页面>.md`**）。**并行发起**（只读、互不依赖、各写自己独立的 raw 文件，无共享写冲突）。每个子 agent 把评审（固定格式 markdown）写入自己的 raw 文件、返回 ≤10 行摘要。

> 主流程轻量校验每个返回：确认 raw 文件已写、页面名正确（**就绪 = 文件落盘，不是消息返回**；Step 4 读文件不读消息）。
> **为什么写文件而不是返回 JSON**：与 `review` 的 raw+汇总 模式一致——P1 并行阶段主 agent 上下文保持轻量；结果落盘可重读、可校验，子 agent 返回过长/截断也不丢结果。

## Step 4 — 汇总 → 前端交付物（等全部页面 raw 就绪后）

**增量聚合，不整批读入再整理**：按 Step 1 清单顺序**读一个页面 raw → 对比 → 更新聚合状态 → 再读下一个**。主 agent 全程维护一个紧凑的「聚合状态」（共享接口调和表 + 缺口并集 + 风险累计），每次只把一个页面的内容并入状态，**不做多页大交叉比对**。聚合状态只保留**判定与关键证据**（每接口一行：四维需求摘要 + 判定），不保留页面全文。

### 4.1 增量聚合（用任务登记，强制每次只读一个文件）

`ls docs/specs/review/raw/page-*.md` 后，**用 TaskCreate 为每个页面登记一个任务**（描述 = 读该页 raw → 对比当前聚合状态 → 更新调和表/缺口/风险 → 追加该页一节到 frontend 文档），并按 Step 1 页面顺序经 TaskList 逐项执行、TaskUpdate 标 in_progress / completed。**每个任务只读一个 raw 文件**，禁止跳过或合并多个页面。

每个任务执行 3 步：

1. **读**：只读该页 raw 文件进上下文。
2. **写该页一节**（追加到 frontend 文档）：
   - 交互映射表：**只含与接口相关的交互**（covered / placeholder / gap）；`pure_client` **不展开**，只记一行「N 个纯客户端交互，无接口需求」；
   - 页面级痛点：只从 covered / placeholder 交互的痛点行归集；
   - 缺口清单（gap 项）；占位项（placeholder 项，简述）；
   - **页级结论**：该页接口满足度一句话（covered X / gap Y / 占位 Z）。
3. **并入聚合状态**：
   - 该页每个交互的「接口」逐条并入**共享接口调和表**：状态里没有 → 新建条目（记该页四维需求：请求字段 / 期望响应字段 / 调用形态 / 页面痛点）；已有 → 与新页需求**逐维对比后更新**（差异/冲突当场标注）；
   - 缺口并入全局并集（标注涉及页）；pure_client 只计数，不入状态。

任务完成一个、TaskUpdate 一个，全部 completed 后进入 4.2。**中断恢复**：从任务清单的 pending 项续跑，已完成页的小节已在 frontend 文档中，可据此重建聚合状态。

### 4.2 全部页面处理完，收尾写 frontend 文档

把聚合状态落成两节追加到 frontend 文档：

- **共享接口需求调和**（每接口一节）：四维对比表 + **结论**——满足 / 部分满足（差异明细）/ ⚠️ 冲突待核，一行理由引用表内证据；
- **全局三张表**：覆盖度矩阵（每个接口 → 使用页）、缺口清单（跨页并集，标涉及页）、风险 Top（按 ⚠️ 冲突 / 缺口数 / 痛点共性排序）。

> 覆盖度矩阵只含页面实际使用的接口；**未被任何页面使用**的接口本 skill 不排查——死接口是页面被裁之后才出现的问题，归开发后的 `review` 兜底。

**聚合总则**：
- 结论 = 对 raw 的**分类归纳**（满足 / 部分满足 / 缺口 / 冲突待核），不得引入 raw 之外的任何接口、字段、评价；
- 判定差异/冲突 → 标「⚠️ 冲突待核」附两页原始陈述，**不自行裁决**；
- 与接口无关的交互（pure_client）不进 frontend 文档正文（raw 保留，仅供核对）。

写文件：`mkdir -p docs/specs/review`；文件已存在先问用户：覆盖 / 备份后替换 / 另存。

## 完成后

- 报告 `docs/specs/review/frontend-page-review.md` 路径、审查了哪些页面 / 接口、各状态数量（covered/placeholder/pure_client/gap）与缺口总数。
- 提示：本 skill 只报告不改接口定义；**按调和结论 + 缺口清单运行 `specs-api` 增量补/改接口**——这是本 skill 产出的用途（Step 4 的共享接口需求调和 = 接口升级改造清单），改完可重跑本 skill 复核。接口设计质量（单一职责/歧义/幂等）由 `specs-api` 生成时自检兜底，死接口排查归开发后的 `review`。
