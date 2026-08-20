---
name: ucs-task
description: 异步任务用例规约（Task Use Case Specification，仅后端）。先从 business-flow 梳理出需要哪些异步任务，用 grilling 模式一个任务一个任务探讨清楚（功能/触发/主流程/依赖/边界），每任务探讨达成共识后按 ucs-task-template.md 生成 task-UCS 直接写入 docs/specs/task-UCS/<模块>.md。当用户要做异步任务用例规约、task-UCS 时使用。
---

# ucs-task

异步任务用例规约（task-UCS）：先梳理需要哪些异步任务，逐任务探讨清楚，再生成各任务的用例规约。**仅后端适用。**

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/product/business-flow.md`（业务流程，异步候选来源）、`docs/standards/tech-stack-rule.md`。
- 建议存在：`docs/standards/task-layer-rule.md` / `task-layer-draft.md`（已选异步方案，作参考）、`docs/specs/data/`（DB）、`docs/standards/tools-rule.md`（工具层）、`docs/standards/http-handler-rule.md`。
- 缺失必选项时，提示先运行对应 skill（product-business / architecture），结束。

## 模板文件（本 skill 自带）

- `templates/ucs-task-template.md` → task-UCS 生成模板（Glob 定位 `**/skills/ucs-task/templates/ucs-task-template.md`，不硬编码缓存路径）

## Step 1 — 从 business-flow 识别异步任务候选（主流程）

- 读 `docs/product/business-flow.md`，识别哪些业务操作**适合异步化**：长耗时 / 外部服务调用 / 通知推送 / 批量处理 / 定时任务 / 需要与请求解耦。
- 结合 `task-layer-rule.md` 已定义的任务作**参考**（可复用），但**不以其清单为准**。
- 用 AskUserQuestion 让用户**确认候选任务清单**：哪些要做、哪些合并、哪些不做，得到待探讨清单。

## Step 2 — 逐任务探讨（grilling 模式，一问一答，主流程）

对候选清单中**每个任务，一个任务一个任务**地探讨分析。遵循 grilling 原则：
- **一问一答**：一次只问一个，等用户回答后再继续；不一次抛多个。
- **每问附推荐答案**：基于上下文给出建议，用户确认或修正。
- **事实靠查、决策靠问**：能从文件系统/业务流查到的先查再问；需用户拍板的逐个问。
- **达成共识前不生成**。

对每个任务依次澄清：
1. **功能**：这个异步任务要实现什么功能？（如"想法 AI 推断"）
2. **触发**：触发方式——消息/事件/定时/入队（如 handler enqueue）
3. **主流程**：执行步骤与工具序列（外部服务调用、DB 操作、广播）
4. **依赖**：外部服务、Redis 键、DB 表、相关工具
5. **边界与异常**：幂等、重试、并发（锁/TTL）、失败降级

探讨清楚后，记录该任务的**任务契约**（结构化摘要：功能/触发/主流程/依赖/边界），进入 Step 3。

## Step 3 — 生成 task-UCS（每任务一个 subagent，直接落盘）

每个任务探讨清楚后，起一个 subagent 生成该任务的 task-UCS：
- 主流程在起 subagent **前**先检查目标文件是否已存在：已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

每个 subagent 的 prompt 必须**自包含**：
1. **要读的文件**：task-UCS 模板（Glob 定位 `templates/ucs-task-template.md`）、该任务的**任务契约**、`docs/standards/task-layer-rule.md` / `task-layer-draft.md`、`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件、`docs/standards/tools-rule.md`、`docs/standards/http-handler-rule.md`、相关任务/工具源码（如需要）。
2. **生成要求**：
   - **使用中文**；严格按 `templates/ucs-task-template.md` 结构逐节填写（模块总览 + 各用例 10 小节 + 模块级技术要点）；空节删除不留空壳；
   - 从任务契约 + 业务流提取用例：主成功场景用工具序列描述，覆盖"参数校验 → 工具调用 → DB 操作 → 广播/落库"；
   - 字段对齐 `docs/specs/data/`；配置/错误码对齐 task-layer-rule 与源码；
   - 每个用例覆盖：参数合法性、业务规则、异常兜底、幂等/重试、并发（锁/TTL）。
3. **直接写入**：把 task-UCS 写入确切路径 `docs/specs/task-UCS/<模块>.md`（先 `mkdir -p docs/specs/task-UCS`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合模板（模块总览 + 各用例 10 小节 + 技术要点）。异常则让该 subagent 重写或主流程修正。
- 进入下一个任务：重复 Step 2 探讨 → Step 3 生成，直到全部完成。

## 完成后

- 报告：每个任务的探讨结论摘要 + 生成的 task-UCS 清单。
- 提示：task-UCS 可对接 `do-api` 的任务实现与测试。
