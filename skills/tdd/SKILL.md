---
name: tdd
description: 按现有技术方案与测试架构，完整跑一遍所有测试用例并修正所有 bug，直至全部通过（迭代修复循环）。主流程驱动：跑全量测试 → 收集失败 → 逐失败修复（subagent，修代码不修测试）→ 重跑 → 直到全绿。适用任何有测试的端（后端为主）。当用户要跑测试、修 bug、让测试全绿时使用。
disable-model-invocation: true
---

# tdd

按现有技术方案与测试架构，**完整跑一遍所有测试用例，修正所有 bug，直至测试全部通过**。

> 主流程驱动迭代循环：跑测试 → 收集失败 → 修复 → 重跑，直到全绿。修复细节由 subagent 各自读取。

## 模板文件（本 skill 自带）

- `templates/fix-bug-prompt.md` → 测试失败修复 prompt（Glob 定位，不硬编码缓存路径）
- `templates/acceptance-plan-template.md` → Step 5 规划 subagent 的验收计划输出模板（Glob 定位）

## 前置依赖（先检查，缺失就停）

- 项目根（默认当前工作目录）已有实现代码与测试（`do-api` / `do-task` / `do-ws` 等产出）。
- 必须存在：`docs/standards/tech-stack-rule.md`（语言/测试框架）。
- 建议存在：`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`、相关 `docs/specs/`（UCS / data / ws / API，按被测代码对应）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 读 spec，确认测试命令

- `tech-stack-rule.md`：语言、测试框架、编译/测试命令。
- 项目测试脚本（Makefile / package.json scripts 等）：确认 `test-unit` / `test-integration` / `test-e2e` / `test-all` / `test-cover` 存在哪些；无 test-all 时按 unit → integration → e2e 顺序。

## Step 2 — 运行完整测试套件，收集失败清单

- 运行全量测试（test-all，或按套件顺序）。
- 收集**失败清单**：每个失败测试的路径 + 错误信息（失败原因/断言）。
- 报告当前失败总数。

## Step 3 — 修复循环（直到全部通过）

每轮迭代：

1. **若失败清单为空** → 全部通过，进入 Step 4。
2. **分组失败**：把可能同根因的失败（同文件/同模块）归为一组。
3. **逐组修复**：每组起一个 subagent（用 `templates/fix-bug-prompt.md`，Glob 定位，prompt 自包含）：
   - subagent 读：该组失败测试 + 错误信息 + tech-stack-rule + directory-rule + 相关 spec + 相关源码
   - 修**代码**使测试通过；**不修改测试用例本身**（仅当测试断言与 spec 明确冲突、确认是测试 bug 才可修正并报告理由）
   - subagent 单测验证该测试通过
   - 主流程轻量校验 subagent 报告
4. **重跑全量测试**，更新失败清单。
5. **收敛检查**：若连续 N 轮（默认 5 轮）失败清单未收敛（仍有失败或新增失败），**停下来报告剩余失败**，不无限循环；询问用户是否继续。

> 主流程只做编排（跑测试 / 收集失败 / 派发修复 / 重跑），不读全部 spec；修复上下文由各 subagent 自行读取，避免主流程上下文超限。

## Step 4 — 全部通过后

- 报告：跑了哪些套件、修了哪些 bug（逐个：测试 → 根因 → 修复）、最终测试结果（全绿）。

## Step 5 — 业务 Happy Path 全链路验收测试

在 TDD 全部通过后，基于**业务描述 + 接口定义**，从真实用户视角模拟调用接口，补齐一整套**业务级 happy path 验收测试**，验证业务全生命周期能完整走通。

### Step 5.1 — 先讲清验收故事（用户确认前不落码）

**不要由主流程去读全部业务描述与接口定义**（会撑爆上下文）。改为：先起一个**规划 subagent** 读取相关文档、产出验收路径的总览，主流程只拿它的摘要去讲故事。

规划 subagent 的输入**按目录精准定位**（先看实际目录有哪些，再圈定，不臆测）：
- **业务描述**：`docs/product/sense.md`（用户故事/需求，必读）；有则读 `docs/product/business-flow.md`（业务流程）。均位于 `docs/product/`。
- **接口定义**：`docs/specs/API/`（OpenAPI3.0 接口）、`docs/specs/ws/`（AsyncAPI 通道）、`docs/specs/data/`（数据结构/DB）——按被测代码对应实际存在的取。
- **⚠ 不得读 `docs/specs/*-UCS/`**：`API-UCS/`、`ws-UCS/`、`task-UCS/`、`tools-UCS/` 是逐接口/逐任务的单点验收用例，量大使规划 subagent 上下文撑爆。规划只基于上面业务描述 + 接口定义，由本 subagent 自行聚合出跨入口的验收计划。
- **约束**：`docs/standards/tech-stack-rule.md`、`directory-rule.md`、`tools-rule.md`。

规划 subagent 先按上述目录**自行定位**真实业务入口（哪些是 HTTP / ws / task），据此规划链路，不臆测。

规划 subagent 产出**验收计划**（结构化 markdown，按本 skill 自带模板 `templates/acceptance-plan-template.md` 填充）。按**状态机 + 黄金路径 + 决策表**方法论规划，覆盖四维 + 覆盖自检：

- **黄金生命周期**：业务黄金主路径，从入口一路推进到**终态**；终态即验收锚点——断言业务不变式（最终状态 + 数据一致性），而非只看接口返回码。
- **状态机切换**：把业务显式建模为**状态机**（状态集 + 合法转移）；每条链路沿**合法转移**推进，逐步调用并用 G-W-T（Given 前置状态/数据 → When 一次调用 → Then 结果状态/响应）断言每个"前置状态→动作→结果状态"。
- **判定点 / 分支覆盖**：在每个**决策节点**按**决策表**枚举走向；每条分支一次独立链路，落到不同终态或中间结果。默认把**合法流向的非成功终态**（如 CANCELED / REJECTED）也纳入（它们仍是合法分支）；若只保成功终态，需在计划中显式标注排除。
- **入口装配覆盖**：同一条黄金路径从 HTTP / ws / task 各通道**独立进入**，验证各入口最终收敛到同一业务状态。

**覆盖自检（链路的收敛判据）**：每状态被进入 ≥1 次、每合法转移 ≥1 次、每判定点 ≥1 次、每入口 ≥1 条、所有终态可达。

每条链路在明细中给出：入口类型与接口、覆盖状态/分支、调用序列（逐步入参→预期）、成功判定、前置数据。
- **落盘完整计划到 `docs/specs/acceptance-UCS/<模块>.md`**（先 `mkdir -p docs/specs/acceptance-UCS`；本 skill 会新建该目录）。
- **只把「链路摘要表」返回主流程**（`链路 ID | 名称 | 入口类型 | 覆盖状态/分支 | 判定要点`），不返回全部明细，避免主流程上下文超限。

主流程只用该摘要表，**向用户讲清楚故事**，允许用户补充、调整或删减。用户确认无异议后（有调整则同步改回 `docs/specs/acceptance-UCS/<模块>.md`），才进入落地（落地与执行的 subagent 各自读该验收计划 + 所需 spec）。

### Step 5.2 — 落地到项目（用户确认后）

把确认后的验收测试**落地到项目层**，作为未来可自动验收的测试代码：
- **起一个落地 subagent**，只需读 `docs/specs/acceptance-UCS/<模块>.md`（已确认的验收计划）+ tech-stack-rule / directory-rule，把每条链路转为一条可独立运行的测试；主流程不读全文。
- 与既有测试同结构（集成/e2e 套件），按链路 ID 命名、组织清晰。
- 状态推进的链路按调用序列顺序编排多次调用（每步按"预期中间态"断言）；遵循接口定义（specs/API、ws、*-UCS）。
- 用真实可复现的方式模拟调用，避免依赖一次性临时数据。

### Step 5.3 — 逐条执行（主 agent 跟踪，subagent 串行执行）

- **主 agent 负责任务跟进与编排**：以摘要表的链路 ID 维护待跑/已通过的 checklist（TaskCreate），确认每条都执行并记录结果。
- **subagent 执行每条链路**：每条链路一个 subagent 独立执行；subagent 读 `docs/specs/acceptance-UCS/<模块>.md` 对应链路明细 + 所需 spec + 已落地的测试代码。
- **串行，不并行**：一次仅跑一个 subagent，跑完再起下一个，避免互相干预（共享外部状态/资源）。

每条链路执行后主流程记录：链路 ID → 通过/失败 → 失败原因。全部跑完按摘要表汇报总结果。

## 后续

全部通过后：可跑 `test-cover` 看覆盖率；下一步运行 `docker` 容器化部署。
