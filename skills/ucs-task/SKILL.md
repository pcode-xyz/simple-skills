---
name: ucs-task
description: 异步任务用例规约（Task Use Case Specification，仅后端）。从 task-layer-rule.md 盘点任务类型生成编号任务清单，逐任务顺序 subagent：读任务相关 spec + ucs-task-template.md（任务适配的 10 小节 + 模块总览/技术要点），生成 task-UCS 直接写入 docs/specs/task-UCS/<模块>.md。当用户要做异步任务用例规约、task-UCS 时使用。
---

# ucs-task

异步任务用例规约（task-UCS）：描述每个异步任务的用例（触发、工具序列、主成功/扩展/异常、业务规则、数据要求）。**仅后端适用。**

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/standards/task-layer-rule.md`（任务层方案：当前任务清单/架构）、`docs/standards/tech-stack-rule.md`。
- 建议存在：`docs/standards/task-layer-draft.md`（任务选型分析）、`docs/product/business-flow.md`、`docs/specs/data/`（DB）、`docs/standards/tools-rule.md`（工具层）、`docs/standards/http-handler-rule.md`。
- 缺失必选项时，提示先运行对应 skill（standards-task / architecture），结束。

## 模板文件（本 skill 自带）

- `templates/ucs-task-template.md` → task-UCS 生成模板（Glob 定位 `**/skills/ucs-task/templates/ucs-task-template.md`，不硬编码缓存路径）

## Step 1 — 读任务清单，生成待办/任务清单（主流程只做编排）

- 读 `docs/standards/task-layer-rule.md` 的"当前任务清单"，列出所有任务类型，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需生成 UCS 的任务**（如预留、仅占位）。
- 为每个待处理任务类型生成一个**待办/任务**：`任务N：<任务类型> → docs/specs/task-UCS/<模块>.md`，得到**任务清单**。
- **用待办事项分别登记并跟进**每个任务。
- 确认目标项目根目录（默认当前工作目录）。

## Step 2 — 逐任务顺序执行（每任务一个 subagent，直接落盘）

按任务清单**顺序**逐一执行：每起一个 subagent 生成一个任务类型的 task-UCS；该任务完成并校验通过后，再处理下一个。**不要并行、不要跳跃。** 每个任务产出独立文件，由 **subagent 直接写入**。

主流程在起 subagent **前**先检查目标文件是否已存在：
- 已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

每个 subagent 的 prompt 必须**自包含**：
1. **要读的文件**：`docs/standards/task-layer-rule.md`（任务归属/架构）、`docs/standards/task-layer-draft.md`（选型背景）、task-UCS 模板（Glob 定位 `templates/ucs-task-template.md`）、`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件、`docs/standards/tools-rule.md`、`docs/standards/http-handler-rule.md`、相关任务/工具源码（如需要）。
2. **生成要求**：
   - **使用中文**；严格按 `templates/ucs-task-template.md` 结构逐节填写（模块总览 + 各用例 10 小节 + 模块级技术要点）；空节删除不留空壳；
   - 从任务实现/业务流提取用例：主成功场景用工具序列描述，覆盖"参数校验 → 工具调用 → DB 操作 → 广播/落库"；
   - 字段对齐 `docs/specs/data/`；错误码/配置对齐 task-layer-rule 与相关源码；
   - 每个用例覆盖：参数合法性、业务规则、异常兜底、幂等/重试、并发（锁/TTL）。
3. **直接写入**：把 task-UCS 写入确切路径 `docs/specs/task-UCS/<模块>.md`（先 `mkdir -p docs/specs/task-UCS`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合模板（模块总览 + 各用例 10 小节 + 技术要点）。异常则让该 subagent 重写或主流程修正。

## 完成后

- 报告：生成 / 跳过 / 覆盖的 task-UCS 文件清单。
- 提示：task-UCS 可对接 `do-api` 的任务实现与测试。
