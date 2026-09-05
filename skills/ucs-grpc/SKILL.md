---
name: ucs-grpc
description: gRPC 接口用例规约（Use Case Specification，仅后端）。三阶段 Workflow pipeline（生成→审查→修正，逐模块并行）：①子 agent 读 docs/specs/grpc 生成 UCS 到 docs/specs/grpc-UCS；②子 agent 逐模块做 6 维度安全审查到 docs/specs/grpc-UCS-review；③子 agent 读审查报告自行评估并按推荐修正 UCS。当用户要做 gRPC 接口用例规约、UCS、安全审查时使用。
disable-model-invocation: true
---

# ucs-grpc

gRPC 接口用例规约（UCS）生成、安全审查与修正。**仅后端适用。** 三阶段（生成→审查→修正），Workflow pipeline 逐模块并行。输入是 `docs/specs/grpc/` 下的模块 proto（service/RPC + 请求/响应 message），统一 `{code, data, message}` envelope、无 HTTP 状态码。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/grpc/`（≥1 个模块 proto）。
- 建议存在：`docs/specs/data/`（DB 设计）、`docs/standards/tech-stack-rule.md`、`docs/standards/directory-rule.md`。
- 缺失必选项时，提示先运行对应 skill（specs-api 的 gRPC 分支 / specs-db），结束。

## 模板文件（本 skill 自带）

- `templates/ucs-grpc-template.md` → UCS 生成模板（Glob 定位 `**/skills/ucs-grpc/templates/ucs-grpc-template.md`，不硬编码缓存路径）
- `templates/ucs-grpc-review-template.md` → 安全审查报告模板

## Step 1 — 盘点 + 前置闸门（主进程，启动 workflow 前一次性解决）

1. **模块清单**：列出 `docs/specs/grpc/` 下所有模块 proto，**报告总数**；用 AskUserQuestion 请用户**排除与业务用例无关的文档**，得到待生成模块清单 `modules`。
2. **文件闸门前置**（不留给 workflow）：
   - 对每个模块检查 `docs/specs/grpc-UCS/<模块>.md` 是否已存在：已存在 → AskUserQuestion 覆盖 / 备份后替换 / 跳过（备份由主进程改名为 `.bak`），得 `actions`（{模块: gen|skip}）；
   - 对每个模块检查 `docs/specs/grpc-UCS-review/<模块>.md` 是否已存在：已存在 → AskUserQuestion 覆盖 / 备份后替换 / 跳过，得 `reviewActions`（{模块: gen|skip}）。
3. **收集 args**：`modules`、`protoDir`（`docs/specs/grpc`）、`ucsDir`（`docs/specs/grpc-UCS`）、`reviewDir`（`docs/specs/grpc-UCS-review`）、`date`（今日日期字符串，填模板版本基线）、`templates`（Read 两个模板内容字符串：Glob 定位 `**/skills/ucs-grpc/templates/ucs-grpc-template.md` / `ucs-grpc-review-template.md`）。

## Step 2 — 启动 Workflow（三阶段 pipeline，后台执行）

1. **定位脚本**：Glob `**/skills/ucs-grpc/scripts/ucs-grpc.workflow.js` 得绝对路径。
2. **调用 Workflow 工具**（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）：`Workflow({ scriptPath: <绝对路径>, args: {...} })`，记录返回的 taskId。
3. **等待 task-notification**（可用 `/workflows` 观察进度）。

> workflow 内部结构：对每个模块跑独立链 **生成 UCS → 6 维安全审查 → 按审查修正**（pipeline，无屏障；每项产出独立文件，无共享冲突）。生成子 agent 读该模块 proto + UCS 模板 + DB + tech-stack + directory（**不读 http-handler-rule**），写 `docs/specs/grpc-UCS/<模块>.md`；审查子 agent 读该 UCS + proto + 审查模板，写 `docs/specs/grpc-UCS-review/<同名>.md`；修正子 agent 读审查报告 + UCS，写回 UCS。`actions`/`reviewActions` 里 skip 的模块不跑对应阶段；失败/跳过的模块随通知标出。

## Step 3 — 通知到达后：校验 + 清理 + 报告

1. **校验**：抽查各模块 UCS 文件已写（Glob/Read 确认，不轻信返回）。
2. **清理**：审查报告已完成修正使命，删除 `docs/specs/grpc-UCS-review/` 目录（连同内容）；若用户想保留，可跳过。
3. **报告**：生成 / 审查 / 修正的文件清单与各模块状态（skipped / gen_only / fixed）。

## 完成后

- 提示：被修正的 UCS（尤其严重问题）可再跑一次本 skill 复审（`reviewActions` 选 gen 重新审查）；下一步（如需）运行 `/simple:ucs-task` 生成异步任务用例规约，否则 `/simple:do-grpc` 实现 gRPC 服务。
