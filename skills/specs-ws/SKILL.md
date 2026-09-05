---
name: specs-ws
description: WebSocket 协议定义（AsyncAPI 2.6，仅后端）。从 business-flow/demo 识别实时通道（聊天/推送/进度/状态广播），按"HTTP 承载命令查询、WS 承载事件流"的通道划分原则，Workflow 逐模块并行子 agent 生成 AsyncAPI yaml 到 docs/specs/ws/<模块>.yaml。当用户要做 WS 协议、实时通道、AsyncAPI 文档时使用。
disable-model-invocation: true
---

# specs-ws

WebSocket 协议定义：识别实时通道 → 逐模块生成 AsyncAPI 2.6 yaml。**仅后端适用。** 与 specs-api 互补——HTTP 承载命令/查询，WS 承载事件/流。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/product/business-flow.md`、`docs/standards/tech-stack-rule.md`（WS 中间件）。
- 建议存在：`docs/specs/API/`（配套命令/查询）、`docs/product/demo/`（页面实时交互）、`docs/specs/data/`（字段对齐）、`docs/standards/directory-rule.md`。
- 缺失必选项时，提示先运行对应 skill，结束。

## 模板文件（本 skill 自带）

- `templates/ws-spec-prompt.md` → AsyncAPI 2.6 生成 prompt（Glob 定位 `**/skills/specs-ws/templates/ws-spec-prompt.md`，不硬编码缓存路径）

## Step 1 — 读 spec，识别 WS 通道

- `tech-stack-rule.md`：**WS 中间件**（gorilla/websocket、socket.io 等）、语言。
- `business-flow.md` + `demo/`：识别实时通道场景——聊天、推送、进度事件、状态变更广播等。
- `docs/specs/API/`：配套命令/查询（WS 事件流与 HTTP 的互补边界）。

## Step 2 — 盘点通道模块 + 前置闸门（主进程，启动 workflow 前一次性解决）

- 把实时场景归组为**通道模块**，列出清单，**报告总数**；为每个模块记一句话「覆盖的实时通道」描述（供子 agent 聚焦），得 `moduleDescriptions`。
- 用 AskUserQuestion 请用户**确认待生成模块**（哪些做、哪些合并、哪些不做），得 `modules`。
- **文件闸门前置**：对每个模块检查 `docs/specs/ws/<模块>.yaml` 是否已存在：已存在 → AskUserQuestion 覆盖 / 备份后替换 / 跳过（备份由主进程做），得 `actions`（{模块: gen|skip}）。
- **收集 args**：`modules`、`moduleDescriptions`、`outDir`（`docs/specs/ws`）、`language`（从 tech-stack-rule 取语言名）、`templates`（Read `**/skills/specs-ws/templates/ws-spec-prompt.md` 内容字符串）。

## Step 3 — 启动 Workflow（逐模块并行，后台执行）

1. **定位脚本**：Glob `**/skills/specs-ws/scripts/specs-ws.workflow.js` 得绝对路径。
2. **调用 Workflow 工具**（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）：`Workflow({ scriptPath: <绝对路径>, args: {...} })`，记录返回的 taskId。
3. **等待 task-notification**（可用 `/workflows` 观察进度）。

> workflow 内部结构：Stage 单阶段**并行**每个模块一个子 agent：读 business-flow / tech-stack-rule / directory-rule / specs/API / demo / specs/data，按 ws-spec-prompt 模板输出 AsyncAPI 2.6，写 `docs/specs/ws/<模块>.yaml`，返回结构化元数据（channel_count）。`actions` 里 skip 的模块不生成；失败/跳过的模块随通知标出。

## Step 4 — 通知到达后：校验 + 报告

1. **校验**：抽查各模块 yaml 已写、结构符合 AsyncAPI 2.6（info/servers/channels/components，不轻信返回）。
2. **报告**：生成 / 跳过 / 覆盖的 WS yaml 清单。

## 完成后

- 提示下一步：运行 `/simple:ucs-ws` 生成 WS 通道用例规约。
