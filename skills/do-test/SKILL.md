---
name: do-test
description: 按 API-UCS 编写测试代码（执行型，仅后端，subagent 会写真实测试代码）。主流程只做编排：盘点 docs/specs/API-UCS 数量、控制待办任务、全部完成后更新测试脚本；每个 UCS 的测试由顺序逐一 subagent 各自读取 spec 生成（提取场景→选测试类型→命名规范→覆盖矩阵→编译通过）。当用户要写测试代码时使用。
---

# do-test

按 API-UCS 编写测试代码。**执行型——subagent 在项目里写真实测试代码。仅后端适用。**

> **主流程只做编排，不读业务 spec**（避免上下文超限）；spec 读取由各 subagent 自行完成。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/API-UCS/`（≥1 个 UCS）。
- 建议存在：项目代码已实现（`do-api` 产出）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 盘点 UCS，生成待办/任务清单（主流程只做编排）

- 列出 `docs/specs/API-UCS/` 下所有 UCS 文件，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需测试的 UCS**（如预留、仅占位）。
- 为每个待测试 UCS 生成一个**待办/任务**：`任务N：<模块>.md → 生成该模块测试`，得到**任务清单**。
- **用待办事项分别登记并跟进**每个任务。
- 确认目标项目根目录（默认当前工作目录；`do-api` 产出的代码所在）。

## Step 2 — 逐任务顺序执行（每任务一个 subagent，直接写测试）

按任务清单**顺序**逐一执行：每起一个 subagent 生成一个 UCS 的测试；该任务完成（subagent 报告编译通过）后再处理下一个。**不要并行、不要跳跃**（共享文件——依赖清单、测试辅助 testhelper 等——靠顺序执行避免冲突，具体文件名以所选技术栈为准）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/test-impl-prompt.md` 模板，Glob 定位）：
- **由 subagent 自己读**：本 UCS + tech-stack-rule（语言/测试框架）+ directory-rule + tools-rule + docs/specs/data + 同名 API + 现有源码（handlers/、tools/）。
- 从 UCS 提取场景（Happy/Branch/Negative/Rule/Concurrency）→ 按业务特征选测试类型（单元/集成/E2E）→ 按命名规范写测试文件 → 覆盖矩阵尽量覆盖 → 测试辅助复用或创建 → **编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告编译通过。失败则让该 subagent 修复。

## Step 3 — 全部完成后更新测试脚本

- 更新项目的测试脚本（Makefile 或 package.json scripts 等）：
  - `test-unit` / `test-integration` / `test-e2e` / `test-all` / `test-cover`
- 命令按所选语言测试框架生成（Go 示例：`go test -short ./...` / `go test -run Integration -race ./...` / `go test -run E2E ./...` / `go test -race ./...` / `go test -coverprofile=coverage.out ./...`；其他语言按其测试框架对应）。
- 报告测试脚本命令。

## 完成后

- 报告：生成的测试文件清单（待办逐项状态）、测试脚本命令。
- 提示：可运行 `make test-unit`（或对应脚本）验证。
