---
name: do-ws
description: 按 UCS-ws 实现 WS 网关代码并编写测试（执行型，仅后端，subagent 会写真实代码）。主流程只做编排：盘点 docs/specs/ws-UCS 数量、控制待办；两阶段——先顺序逐一 subagent 实现所有 UCS-ws（握手认证/帧处理/广播/房间管理/跨进程转发，帧契约以 specs/ws 为准、编译通过），再顺序逐一 subagent 为所有 UCS-ws 写测试（方向语义、覆盖矩阵、关键约定→测试编译通过）；最后整体编译并确保测试脚本。当用户要实现 WS 网关代码或写测试时使用。
---

# do-ws

按 UCS-ws 实现 WS 网关代码 + 编写测试。**执行型——subagent 在项目里写真实代码。仅后端适用。两阶段：先全部实现，再全部写测试。**

> **主流程只做编排，不读业务 spec**（避免上下文超限）；spec 读取由各 subagent 自行完成。

## 模板文件（本 skill 自带）

- `templates/ws-impl-prompt.md` → WS 网关实现 prompt
- `templates/ws-test-prompt.md` → WS 网关测试 prompt（薄壳）
- `templates/ws-ucs-to-testing-rule.md` → **WS-UCS 转测试提取规范**（核心规范，测试 subagent 必须通读）
（均 Glob 定位，不硬编码缓存路径）

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/ws-UCS/`（≥1 个 UCS-ws）、`docs/specs/ws/`（帧契约）。
- 建议存在：`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`、`docs/specs/data/`。
- 缺失必选项时，提示先运行对应 skill（specs-ws / ucs-ws），结束。

## Step 1 — 盘点 UCS-ws，生成待办/任务清单（主流程只做编排）

- 列出 `docs/specs/ws-UCS/` 下所有 UCS-ws 文件，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需实现/测试的 UCS**（如预留、仅占位）。
- 为每个待处理 UCS-ws 登记**两个待办/任务**：`任务N：<模块>.md → 实现` 与 `任务N'：<模块>.md → 测试`。
- 得到**任务清单**：实现任务（Step 2 用）与测试任务（Step 3 用）**分开登记、各自逐一跟进**。
- 确认目标项目根目录（默认当前工作目录）。

## Step 2 — 逐任务实现（每任务一个 subagent，直接写码）

按任务清单**顺序**逐一执行：每起一个 subagent 实现一个 UCS-ws；该任务完成（subagent 报告编译通过）后再处理下一个。**不要并行、不要跳跃**——路由/注册、依赖清单等**共享文件**（具体文件名以所选技术栈 / 目录结构为准）靠顺序执行避免冲突。

每个 subagent 的 prompt 必须**自包含**（用 `templates/ws-impl-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本 UCS-ws + specs/ws（帧契约）+ tech-stack-rule（WS 中间件/编译命令）+ directory-rule + tools-rule + docs/specs/data（含 struct.md 数据结构定义，如存在）+ 现有网关源码。
- 实现握手认证、帧处理/落库/广播、房间管理、跨进程转发；帧契约与方向语义以 specs/ws 为准；**单任务编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告编译通过。失败则让该 subagent 修复。

**全部实现完成后**：主流程在项目根跑一次整体编译，确认无回归。

## Step 3 — 逐任务写测试（每任务一个 subagent，直接写测试）

按任务清单**顺序**逐一执行：每起一个 subagent 为一个 UCS-ws 编写测试；该任务完成（subagent 报告测试编译通过）后再处理下一个。**不要并行、不要跳跃**（测试辅助等共享文件靠顺序执行避免冲突）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/ws-test-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本 UCS-ws + specs/ws（方向语义）+ tech-stack-rule（测试框架/WS 中间件）+ directory-rule + docs/specs/data（含 struct.md，如存在）+ 现有网关源码与测试；HTTP 历史契约（docs/specs/API/<模块>.yaml）**仅断线重连测试需要**。
- 按 `ws-ucs-to-testing-rule.md` 提取场景与覆盖矩阵；方向语义、握手拒绝、进程内 vs 跨进程广播、断线重连、心跳等关键约定；**测试编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告测试编译通过。失败则让该 subagent 修复。

**全部测试完成后**：
- 确保测试脚本命令存在（`test-unit` / `test-integration` / `test-e2e` / `test-all` / `test-cover`；用户项目可能已有则跳过，缺失才按语言补建）。

## 完成后

- 报告：实现的 UCS-ws 清单 + 测试清单（待办逐项状态）、整体编译结果。
- 提示：可运行测试脚本验证，或继续 `ucs-ws` / `do-api` 下一轮迭代。
