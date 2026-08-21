---
name: specs-ws
description: WebSocket 协议定义（AsyncAPI 2.6，仅后端）。从 business-flow/demo 识别实时通道（聊天/推送/进度/状态广播），按"HTTP 承载命令查询、WS 承载事件流"的通道划分原则，逐模块顺序 subagent 生成 AsyncAPI yaml 到 docs/specs/ws/<模块>.yaml。当用户要做 WS 协议、实时通道、AsyncAPI 文档时使用。
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

## Step 2 — 盘点通道模块，生成任务清单（主流程只做编排）

- 把实时场景归组为**通道模块**，列出清单，**报告总数**。
- 用 AskUserQuestion 请用户**确认待生成模块**（哪些做、哪些合并、哪些不做）。
- 为每个待生成模块登记一个**待办/任务**：`任务N：<模块> → docs/specs/ws/<模块>.yaml`，得到**任务清单**。
- **用待办事项分别登记并跟进**每个任务。

## Step 3 — 逐任务顺序执行（每任务一个 subagent，直接落盘）

按任务清单**顺序**逐一执行：每起一个 subagent 生成一个模块的 WS yaml；该任务完成并校验通过后，再处理下一个。**不要并行、不要跳跃。** 每个任务产出独立文件，由 **subagent 直接写入**。

主流程在起 subagent **前**先检查目标文件是否已存在：
- 已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/ws-spec-prompt.md`，Glob 定位）：
1. **要读的文件**：`docs/product/business-flow.md`、`docs/standards/tech-stack-rule.md`（WS 中间件）、`docs/standards/directory-rule.md`、`docs/specs/API/`（配套）、`docs/product/demo/`（实时交互）、`docs/specs/data/`（字段对齐）。
2. **生成要求**：按模板输出 AsyncAPI 2.6 yaml——通道划分原则（HTTP 命令/查询 vs WS 事件/流）、方向语义（subscribe=客户端→服务端、publish=服务端→客户端）、契约三要素（消息目录/生命周期/投递语义 x-delivery-semantics）、servers/channels(bindings+subscribe+publish)/components(messages+schemas)；字段对齐 DB、消息与 HTTP 历史同构、message_id 幂等、心跳 Ping/Pong、前向兼容。
3. **直接写入**：写入确切路径 `docs/specs/ws/<模块>.yaml`（先 `mkdir -p docs/specs/ws`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合 AsyncAPI 2.6（info/servers/channels/components）。异常则让该 subagent 重写或主流程修正。

## 完成后

- 报告：生成 / 跳过 / 覆盖的 WS yaml 清单。
- 提示下一步：运行 `ucs-ws` 生成 WS 通道用例规约。
