---
name: do-api
description: 按 API-UCS 实现后端接口代码并编写测试（执行型，仅后端，subagent 会写真实代码）。主流程只做编排：盘点 docs/specs/API-UCS 数量、控制待办；两阶段——先顺序逐一 subagent 实现所有 UCS（路由对齐 API、数据模型对齐 DB、按需 tools、单任务编译通过），再顺序逐一 subagent 为所有 UCS 编写测试（从 UCS 提取场景→选测试类型→命名规范→覆盖矩阵→编译通过）；最后整体编译并更新测试脚本。当用户要实现接口代码或写测试时使用。
disable-model-invocation: true
---

# do-api

按 API-UCS 实现后端接口代码 + 编写测试。**执行型——subagent 在项目里写真实代码。仅后端适用。两阶段：先全部实现，再全部写测试。**

> **主流程只做编排，不读业务 spec**（避免上下文超限）；spec 读取由各 subagent 自行完成。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/API-UCS/`（≥1 个 UCS）。
- 建议存在：项目骨架已搭建（`do-directory` 产出）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 盘点 UCS，生成待办/任务清单（主流程只做编排）

- 列出 `docs/specs/API-UCS/` 下所有 UCS 文件，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需实现/测试的 UCS**（如预留、仅占位）。
- 为每个待处理 UCS 登记**两个待办/任务**：`任务N：<模块>.md → 实现` 与 `任务N'：<模块>.md → 测试`。
- 得到**任务清单**：实现任务（Step 2 用）与测试任务（Step 3 用）**分开登记、各自逐一跟进**。
- 确认目标项目根目录（默认当前工作目录；`do-directory` 骨架所在）。

## Step 2 — 逐任务实现（每任务一个 subagent，直接写码）

按任务清单**顺序**逐一执行：每起一个 subagent 实现一个 UCS；该任务完成（subagent 报告编译通过）后再处理下一个。**不要并行、不要跳跃**——路由注册、依赖清单、数据模型等**共享文件**（具体文件名以所选技术栈 / 目录结构为准，不预设为某语言）靠顺序执行避免冲突。

每个 subagent 的 prompt 必须**自包含**（用 `templates/api-impl-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本 UCS + tech-stack-rule（语言/编译命令）+ directory-rule + http-handler-rule + tools-rule + docs/specs/data（含 struct.md 数据结构定义，如存在）+ 同名 API。
- 实现该 UCS 所有接口；路由对齐 API；数据模型对齐 DB；按需开发 tools；**单任务编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告编译通过。失败则让该 subagent 修复。

**全部实现完成后**：主流程在项目根跑一次整体编译，确认无回归。

## Step 3 — 逐任务写测试（每任务一个 subagent，直接写测试）

按任务清单**顺序**逐一执行：每起一个 subagent 为一个 UCS 编写测试；该任务完成（subagent 报告测试编译通过）后再处理下一个。**不要并行、不要跳跃**（测试辅助等共享文件靠顺序执行避免冲突）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/test-impl-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本 UCS + tech-stack-rule（语言/测试框架）+ directory-rule + tools-rule + docs/specs/data（含 struct.md，如存在）+ 同名 API + 现有源码（按 directory-rule 定位）。
- 从 UCS 提取场景（Happy / Branch / Negative / Rule / Concurrency）→ 按业务特征选测试类型（单元 / 集成 / E2E）→ 按命名规范写测试文件 → 覆盖矩阵尽量覆盖 → 测试辅助复用或创建 → **测试编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告测试编译通过。失败则让该 subagent 修复。

**全部测试完成后**：
- 更新项目的测试脚本（Makefile 或 package.json scripts 等）：`test-unit` / `test-integration` / `test-e2e` / `test-all` / `test-cover`，命令按所选语言测试框架生成（Go 示例：`go test -short ./...` / `go test -run Integration -race ./...` / `go test -run E2E ./...` / `go test -race ./...` / `go test -coverprofile=coverage.out ./...`；其他语言按其测试框架对应）。
- 报告测试脚本命令。

## 完成后

- 报告：实现的 UCS 清单 + 测试清单（待办逐项状态）、整体编译结果、测试脚本命令。
- 提示：可跑 `make test-unit`（或对应脚本）验证；下一步（如需）运行 `do-task` 实现异步任务，否则 `tdd` 跑到全绿。
