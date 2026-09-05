---
name: specs-api-review
description: 接口满足度评审（前端视角，只报告不改）。Workflow 并行页面子 agent 判断现有接口（HTTP yaml / gRPC proto）是否满足 demo 各业务页的业务/数据/交互（covered/placeholder/pure_client/gap），汇总 agent 聚合出前端满足度报告（共享接口需求调和 + 缺口/风险），驱动接口升级改造。HTTP 与 gRPC 双分支，产出 docs/specs/review/frontend-page-review.md。当用户要做接口评审、页面接口满足度评估、接口升级改造前评估时使用。
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

## Step 2 — 准备 args（主 agent 只做零读取的盘点）

主 agent **不读任何页面 HTML / 接口定义 / JS 全文**（避免上下文超限），只盘点存在性、收集 workflow args：

- `pages`：Step 1 确认的业务页列表（页面名，去 `.html`）。
- `demoDir`：`docs/product/demo`；`protocolDir`：接口定义目录（gRPC → `docs/specs/grpc/`；HTTP → `docs/specs/API/`）。
- `moduleFiles`：`ls` 接口定义目录所得文件名列表（只拿名字，不读内容）。
- `businessFlow`（存在才传）：`docs/product/business-flow.md`（MI 锚点）。
- `rawDir`：`docs/specs/review/raw`；`reportPath`：`docs/specs/review/frontend-page-review.md`。
- `templates`：Read 两个模板内容字符串（Glob 定位 `**/skills/specs-api-review/templates/p1-page-review-prompt.md` / `review-aggregate-prompt.md`）。
- 接口发现与字段核对**不做**：由 stage1 子 agent 完成（grep 发现 + 读命中文件），主 agent 不预读、不建索引。

## Step 3 — 启动 Workflow（并行评审 + 聚合，后台执行）

1. **定位脚本**：Glob `**/skills/specs-api-review/scripts/specs-api-review.workflow.js` 得绝对路径。
2. **调用 Workflow 工具**（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）：`Workflow({ scriptPath: <绝对路径>, args: {...} })`，记录返回的 taskId。
3. **等待 task-notification**（期间不做其他大动作；可用 `/workflows` 观察进度）。

> workflow 内部结构：Stage1 **并行**每个业务页一个子 agent（只读不改、互不依赖，各写独立 raw 存档文件 `docs/specs/review/raw/<页面>.md` + 返回结构化发现 covered/placeholder/pure_client/gap）；Stage2 一个聚合子 agent **只读 schema**（不解析 raw），按聚合规则（共享接口需求调和 + 三张表 + 页级结论，见 `templates/review-aggregate-prompt.md`）写 `docs/specs/review/frontend-page-review.md`。失败/跳过的页面不会静默消失——随通知 `skipped` 标出。

## Step 4 — 通知到达后：校验 + 报告

1. **校验**：确认 `docs/specs/review/frontend-page-review.md` 已写（不轻信 workflow 返回）。
2. **报告**：审查了哪些页面 / 接口、各状态数量（covered/placeholder/pure_client/gap）与缺口总数、`skipped` 未完成页面（如有）。

## 完成后

- 提示：本 skill 只报告不改接口定义；**按调和结论 + 缺口清单运行 `/simple:specs-api` 增量补/改接口**——这是本 skill 产出的用途（聚合的共享接口需求调和 = 接口升级改造清单），改完可重跑本 skill 复核。接口设计质量（单一职责/歧义/幂等）由 `specs-api` 生成时自检兜底，死接口排查归开发后的 `review`。
