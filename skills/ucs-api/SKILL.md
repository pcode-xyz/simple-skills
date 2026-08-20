---
name: ucs-api
description: 接口用例规约（Use Case Specification，仅后端）。两阶段：先用顺序 subagent 逐一读 docs/specs/API 的接口文档、按 ucs-template.md 生成用例规约到 docs/specs/API-UCS；再用顺序 subagent 逐一读 UCS 做业务安全审查（6 维度）、按 ucs-review-template.md 输出到 docs/specs/API-UCS-review。当用户要做接口用例规约、UCS、安全审查时使用。
---

# ucs-api

接口用例规约（UCS）生成与安全审查。**仅后端适用。** 两阶段，均用顺序 subagent。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/API/`（≥1 个接口 yaml）。
- 建议存在：`docs/specs/data/`（DB 设计）、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`、`docs/standards/http-handler-rule.md`。
- 缺失必选项时，提示先运行对应 skill（specs-api / specs-db），结束。

## 模板文件（本 skill 自带）

- `templates/ucs-template.md` → UCS 生成模板（Glob 定位 `**/skills/ucs-api/templates/ucs-template.md`，不硬编码缓存路径）
- `templates/ucs-review-template.md` → 安全审查报告模板

## Phase 1 — 生成 UCS（顺序 subagent，逐接口）

### 1.1 盘点接口并排除无关

- 列出 `docs/specs/API/` 下所有接口 yaml，报告总数。
- 用 AskUserQuestion 请用户**排除与业务用例无关的文档**，得到待生成清单。

### 1.2 顺序生成（每个接口一个 subagent，直接落盘）

**顺序性子任务，每次只做一个**：用 Agent 工具起一个 subagent，只处理一个接口文档；等它完成后再处理下一个。**不要并行。** 每个 subagent 产出独立文件，无共享冲突，故**由 subagent 直接写入**。

主流程在起 subagent **前**先检查目标文件是否已存在：
- 已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

每个 subagent 的 prompt 必须**自包含**：
1. **要读的文件**：该接口的 yaml（`docs/specs/API/<模块>.yaml`）、UCS 模板（Glob 定位 `templates/ucs-template.md`）、`docs/specs/data/` 下 DB 文件、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`、`docs/standards/http-handler-rule.md`。
2. **生成要求**：
   - **使用中文**；
   - 严格按 `templates/ucs-template.md` 的结构逐节填写（用例清单、各用例 10 小节、模块级技术要点汇总）；空节删除不留空壳；
   - 每个用例必须覆盖 4 个思考点：
     - **参数合法性**：每个参数的必填/类型/长度/范围/格式校验；
     - **业务视角**：参数间的业务逻辑、业务规则约束；
     - **安全视角**：越权、注入、敏感信息等风险及对策；
     - **网络异常**：超时、重试、幂等、部分失败的处理；
   - 字段名/类型对齐 DB 文件（`docs/specs/data/`），流程对齐 http-handler-rule。
3. **直接写入**：把生成的 UCS 写入确切路径 `docs/specs/API-UCS/<模块>.md`（先 `mkdir -p docs/specs/API-UCS`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合模板（用例清单 + 各用例 10 小节 + 模块级汇总）。异常则让该 subagent 重写或主流程修正。

## Phase 2 — 审查 UCS（顺序 subagent，逐文档）

### 2.1 顺序审查（每个 UCS 文档一个 subagent，直接落盘）

**顺序性子任务，每次只做一个**：用 Agent 工具起一个 subagent，只处理 `docs/specs/API-UCS/` 的一个文档；等它完成后再处理下一个。**不要并行。** 每个 subagent 产出独立文件，由 **subagent 直接写入**。

主流程在起 subagent **前**先检查目标文件是否已存在：
- 已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

每个 subagent 的 prompt 必须**自包含**：
1. **要读的文件**：该 UCS 文档（`docs/specs/API-UCS/<模块>.md`）、对应的 API 文档（`docs/specs/API/<同名>.yaml`）、审查模板（Glob 定位 `templates/ucs-review-template.md`）、`docs/specs/data/` 下 DB 文件、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`。
2. **审查要求**：
   - **使用中文**；按 `templates/ucs-review-template.md` 结构输出；
   - 按 6 个安全维度逐项检查：**水平越权**（写操作是否校验资源归属）、**输入校验**（长度/类型/范围/结构/SQL注入/XSS）、**竞态条件**（并发同资源防护）、**数据泄露**（返回敏感字段）、**幂等性**（重复调用安全）、**状态机**（流转是否严格）；
   - 问题按严重程度 S/M/L 编号，每个严重问题对应到具体用例步骤与触发路径。
3. **直接写入**：把审查报告写入确切路径 `docs/specs/API-UCS-review/<同名>.md`（先 `mkdir -p docs/specs/API-UCS-review`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合审查模板（S/M/L 问题清单 + 6 维度分析）。异常则让该 subagent 重写或主流程修正。

## 完成后

- 报告：生成/跳过/覆盖的 UCS 文件清单、审查文件清单。
- 提示：审查发现的严重问题可回改 UCS 与接口定义，再重新审查。
