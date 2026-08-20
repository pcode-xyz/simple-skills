---
name: tdd
description: 按现有技术方案与测试架构，完整跑一遍所有测试用例并修正所有 bug，直至全部通过（迭代修复循环）。主流程驱动：跑全量测试 → 收集失败 → 逐失败修复（subagent，修代码不修测试）→ 重跑 → 直到全绿。适用任何有测试的端（后端为主）。当用户要跑测试、修 bug、让测试全绿时使用。
---

# tdd

按现有技术方案与测试架构，**完整跑一遍所有测试用例，修正所有 bug，直至测试全部通过**。

> 主流程驱动迭代循环：跑测试 → 收集失败 → 修复 → 重跑，直到全绿。修复细节由 subagent 各自读取。

## 模板文件（本 skill 自带）

- `templates/fix-bug-prompt.md` → 测试失败修复 prompt（Glob 定位，不硬编码缓存路径）

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
- 提示：可跑 `test-cover` 看覆盖率；下一步运行 `docker` 容器化部署。
