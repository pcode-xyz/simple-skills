---
name: review
description: 代码质量审查（只报告，不改代码）。主流程只做编排：读 tech-stack-rule 确认语言/框架/静态检查命令 → 接口维度按 docs/specs/API（或 grpc）并行逐个接口 subagent 审（DB 效率/安全/错误处理/事务/幂等/契约漂移与实现遗漏）+ 全库维度 subagent 跑静态工具并审环调用/孤儿代码/硬编码敏感信息（两者并行）→ 汇总 subagent 去重分级写 docs/review/issues.md → 对话报告 P0。当用户要做代码 review、代码质量审查、找明显问题、安全/性能/环依赖排查时使用。
disable-model-invocation: true
---

# review

代码质量审查：发现代码里的**明显问题**，输出带严重度的结构化问题清单。**只报告，不改代码**——修复由用户确认后再单独进行。

> **主流程只做编排，不读业务代码**（避免上下文超限）；代码审读由各 subagent 自行完成。
> **审查范围只覆盖源码，排除 `docs/` 目录**：docs/ 为规格文档（接口定义 / struct / UCS），只作参考读取，**不作为审查对象**——不扫描、不报 docs 内问题（所有检查均适用）。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/standards/tech-stack-rule.md`（语言/框架/ORM/校验库/静态检查命令）、项目已实现代码（`do-api` / `do-task` / `do-page` 等产出）。
- **接口定义目录按协议分支**（HTTP 与 gRPC 互斥，只审其一）：
  - 存在 `docs/specs/API/` → 接口定义目录 = `docs/specs/API/`；
  - 存在 `docs/specs/grpc/` → 接口定义目录 = `docs/specs/grpc/`；
  - 两者皆无 → 接口清单退化：从代码路由发现，并提示接口维度契约核对受限。
- 建议存在：`docs/specs/API-UCS/`（接口用例，边界参考）、`docs/specs/data/`（struct.md）、`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 读 spec，确认方法与清单

- `tech-stack-rule.md`：语言、框架、ORM、校验库、静态检查命令（lint / vet / unused / import-cycle / race 等）。
- 接口清单：按协议分支解析接口定义目录，列出接口总数。
- 确认目标项目根（默认当前工作目录）。

## Step 2 — 启动 Workflow（并行审查 + 汇总，后台执行）

主进程只做收集参数与启动，**不读任何业务代码 / raw 文件**（避免上下文超限）；代码审读由 workflow 内子 agent 自行完成：

1. **准备 args**：
   - `interfaces`：`ls` 接口定义目录所得**文件名数组**（HTTP → `docs/specs/API/*.yaml`；gRPC → `docs/specs/grpc/*.proto`，接口粒度 = proto 文件，一个文件一个子 agent、审文件内全部方法）；
   - `protocolDir`：接口定义目录（`docs/specs/API` 或 `docs/specs/grpc`）；
   - `rawDir`：`docs/review/raw`；`issuesPath`：`docs/review/issues.md`；
   - `templates`：Read 三个模板文件内容字符串（Glob 定位 `**/skills/review/templates/review-interface-prompt.md` / `review-global-prompt.md` / `review-merge-prompt.md`）。
2. **定位脚本**：Glob `**/skills/review/scripts/review.workflow.js` 得绝对路径。
3. **调用 Workflow 工具**（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）：`Workflow({ scriptPath: <绝对路径>, args: {...} })`，记录返回的 taskId。
4. **等待 task-notification**（期间不做其他大动作；可用 `/workflows` 观察进度）。

> workflow 内部结构：Stage1 **并行**——接口维度每接口一个子 agent（按 `templates/review-interface-prompt.md` 的 5 维清单审：DB 效率/安全/错误处理与事务/幂等与并发/契约漂移与遗漏）+ 全库维度一个子 agent（先跑静态工具再人工审环调用/孤儿代码/硬编码/文件过大）。两者只读不改、各写独立 raw 存档文件（`docs/review/raw/interface-<接口>.md` / `global.md`）+ 返回结构化发现（severity/file/line/desc/reason/suggestion/uncertain），无共享写冲突。Stage2 一个汇总子 agent **只读 schema**（不解析 raw）去重分级写 `docs/review/issues.md`。失败的接口/维度不会静默消失——随通知 `skipped` 标出。

## Step 3 — 通知到达后：校验 + 清理 + 报告

1. **校验**：确认 `docs/review/issues.md` 已写、头部严重度统计完整（不轻信 workflow 返回）。
2. **清理**：删除 `docs/review/raw/` 目录（raw 仅传输存档，汇总后即删）。
3. **报告**：审查了哪些接口 / 维度、各严重度问题数、**P0 明细**（读 issues.md 的 P0 分组呈现）、`skipped` 未纳入审查的维度（如有）。

## 完成后

- 提示：`docs/review/issues.md` 为全量分级清单（Step 3 已报告 P0），P0 需优先处理；确认后运行 `/simple:review-fix` 按清单逐项修复（review 本身不改代码）。
