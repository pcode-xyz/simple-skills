---
name: do-task
description: 按 task-UCS 实现异步任务代码并编写测试（执行型，仅后端，subagent 会写真实代码）。主流程只做编排：盘点 docs/specs/task-UCS 数量、控制待办；两阶段——先顺序逐一 subagent 实现所有 task-UCS（遵守 task-layer-rule 任务四要素、数据模型对齐 DB、按需 tools、编译通过），再顺序逐一 subagent 为所有 task-UCS 写测试（提取场景→选测试类型→覆盖矩阵→测试编译通过）；最后整体编译并确保测试脚本。当用户要实现异步任务代码或写测试时使用。
---

# do-task

按 task-UCS 实现异步任务代码 + 编写测试。**执行型——subagent 在项目里写真实代码。仅后端适用。两阶段：先全部实现，再全部写测试。**

> **主流程只做编排，不读业务 spec**（避免上下文超限）；spec 读取由各 subagent 自行完成。

## 模板文件（本 skill 自带）

- `templates/task-impl-prompt.md` → 任务实现 prompt（Glob 定位，不硬编码缓存路径）
- `templates/task-test-prompt.md` → 任务测试 prompt
- `templates/task-ucs-to-testing-rule.md` → **task-UCS 转测试提取规范**（核心规范，测试 subagent 必须通读；源自 self-driving-services 项目，已随插件打包）

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/task-UCS/`（≥1 个 task-UCS）。
- 建议存在：任务层方案已定（`standards-task` 产出 `task-layer-rule.md`）、项目骨架已搭建。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 盘点 task-UCS，生成待办/任务清单（主流程只做编排）

- 列出 `docs/specs/task-UCS/` 下所有 task-UCS 文件，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需实现/测试的 UCS**（如预留、仅占位）。
- 为每个待处理 task-UCS 登记**两个待办/任务**：`任务N：<模块>.md → 实现` 与 `任务N'：<模块>.md → 测试`。
- 得到**任务清单**：实现任务（Step 2 用）与测试任务（Step 3 用）**分开登记、各自逐一跟进**。
- 确认目标项目根目录（默认当前工作目录）。

## Step 2 — 逐任务实现（每任务一个 subagent，直接写码）

按任务清单**顺序**逐一执行：每起一个 subagent 实现一个 task-UCS；该任务完成（subagent 报告编译通过）后再处理下一个。**不要并行、不要跳跃**——任务注册表、依赖清单等**共享文件**（具体文件名以所选技术栈 / 目录结构为准）靠顺序执行避免冲突。

每个 subagent 的 prompt 必须**自包含**（用 `templates/task-impl-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本 task-UCS + tech-stack-rule（语言/编译命令）+ directory-rule + task-layer-rule + tools-rule + docs/specs/data + 相关 API + 现有任务层源码（位置按 directory-rule / task-layer-rule）。
- 实现该任务所有用例（任务四要素、注册）；数据模型对齐 DB；按需开发 tools；**单任务编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告编译通过。失败则让该 subagent 修复。

**全部实现完成后**：主流程在项目根跑一次整体编译，确认无回归。

## Step 3 — 逐任务写测试（每任务一个 subagent，直接写测试）

按任务清单**顺序**逐一执行：每起一个 subagent 为一个 task-UCS 编写测试；该任务完成（subagent 报告测试编译通过）后再处理下一个。**不要并行、不要跳跃**（测试辅助等共享文件靠顺序执行避免冲突）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/task-test-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本 task-UCS + tech-stack-rule（语言/测试框架）+ directory-rule + task-layer-rule + task-UCS 转测试提取规范（自带模板 `templates/task-ucs-to-testing-rule.md`，必须通读）+ docs/specs/data + 现有任务层源码与测试（位置按 directory-rule / task-layer-rule）。
- 从 task-UCS 提取场景（Happy / Branch / Negative / Rule / Concurrency / 纯函数 / 广播）→ 选测试类型（单元 / 集成）→ 命名规范 + 覆盖矩阵 → 复用测试基建（TestMain / testhelper / Mock 策略）→ **测试编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告测试编译通过。失败则让该 subagent 修复。

**全部测试完成后**：
- 确保测试脚本命令存在（`test-unit` / `test-integration` / `test-e2e` / `test-all` / `test-cover`；用户项目可能已有则跳过，缺失才按语言补建）。

## 完成后

- 报告：实现的 task-UCS 清单 + 测试清单（待办逐项状态）、整体编译结果。
- 提示：可运行测试脚本（如 `make test-unit`）验证，或继续 `ucs-task` / `do-api` 下一轮迭代。
