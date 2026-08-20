---
name: ucs-ws
description: WS 通道用例规约（WS Use Case Specification，仅后端）。从 specs/ws（AsyncAPI 帧契约）+ business-flow/demo 识别实时通道与帧，用 grilling 模式一个通道一个通道探讨清楚（帧功能/收发语义/投递语义/依赖/边界），每通道探讨达成共识后按 ucs-ws-template.md 生成 WS-UCS 直接写入 docs/specs/UCS-ws/<模块>.md。当用户要做 WS 用例规约、WS-UCS 时使用。
---

# ucs-ws

WS 通道用例规约：识别实时通道 → 逐通道探讨清楚 → 生成各通道的帧用例规约。**仅后端适用。**

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/specs/ws/`（≥1 个 AsyncAPI yaml，帧契约）、`docs/product/business-flow.md`。
- 建议存在：`docs/specs/API/` 与 `docs/specs/UCS/`（HTTP 命令/查询配套）、`docs/specs/task-UCS/`（异步任务配套）、`docs/specs/data/`（落库依据）、`docs/product/demo/`（页面实时交互）。
- 缺失必选项时，提示先运行对应 skill（specs-ws / product-business），结束。

## 模板文件（本 skill 自带）

- `templates/ucs-ws-template.md` → WS-UCS 生成模板（Glob 定位 `**/skills/ucs-ws/templates/ucs-ws-template.md`，不硬编码缓存路径）

## Step 1 — 识别 WS 通道候选（主流程）

- 读 `docs/specs/ws/` 下的 AsyncAPI yaml：通道、帧类型、投递语义。
- 结合 `docs/product/business-flow.md` 与 `docs/product/demo/`：实时交互场景（聊天、推送、进度、状态广播）。
- 用 AskUserQuestion 让用户**确认候选通道/模块**：哪些做、哪些合并、哪些不做，得到待探讨清单。

## Step 2 — 逐通道探讨（grilling 模式，一问一答，主流程）

对候选清单中**每个通道，一个通道一个通道**地探讨分析。遵循 grilling 原则：
- **一问一答**：一次只问一个，等用户回答后再继续。
- **每问附推荐答案**：基于 AsyncAPI 帧契约给出建议，用户确认或修正。
- **事实靠查、决策靠问**：帧定义查 specs/ws、业务流查 business-flow；需用户拍板的逐个问。
- **达成共识前不生成**。

对每个通道依次澄清：
1. **帧清单**：该通道有哪些帧（客户端→服务端 / 服务端→客户端）
2. **每帧功能**：做什么、谁触发、收发的业务语义
3. **投递语义**：durable/transient、可重放、幂等键
4. **依赖**：DB 表、Redis 通道、涉及的任务、外部服务
5. **边界与异常**：校验失败、限流、断线重连、前向兼容、心跳

探讨清楚后，记录该通道的**通道契约**（结构化摘要：帧清单/功能/投递语义/依赖/边界），进入 Step 3。

## Step 3 — 生成 WS-UCS（每通道一个 subagent，直接落盘）

每个通道探讨清楚后，起一个 subagent 生成该通道的 WS-UCS：
- 主流程在起 subagent **前**先检查目标文件是否已存在：已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

每个 subagent 的 prompt 必须**自包含**：
1. **要读的文件**：WS-UCS 模板（Glob 定位 `templates/ucs-ws-template.md`）、该通道的**通道契约**、`docs/specs/ws/<模块>.yaml`（帧契约）、`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件、`docs/specs/API/` 与 `docs/specs/UCS/`（HTTP 配套）、`docs/specs/task-UCS/`（异步配套）。
2. **生成要求**：
   - **使用中文**；严格按 `templates/ucs-ws-template.md` 结构逐节填写（通道总览 + 各帧 10 小节 + 模块级技术要点）；空节删除不留空壳；
   - 从通道契约 + AsyncAPI 帧定义提取用例：连接级（建立/重连/错误）与每类帧各占一个用例；主成功场景覆盖"帧收发 → 校验 → DB → 广播/入队"；
   - 帧字段/投递语义对齐 `docs/specs/ws/`；字段对齐 `docs/specs/data/`；
   - 每用例覆盖：参数合法性、业务规则、异常兜底、幂等/有序、投递语义、心跳/限流/前向兼容。
3. **直接写入**：把 WS-UCS 写入确切路径 `docs/specs/UCS-ws/<模块>.md`（先 `mkdir -p docs/specs/UCS-ws`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合模板（通道总览 + 各帧 10 小节 + 技术要点）。异常则让该 subagent 重写或主流程修正。
- 进入下一个通道：重复 Step 2 探讨 → Step 3 生成，直到全部完成。

## 完成后

- 报告：每个通道的探讨结论摘要 + 生成的 WS-UCS 清单。
- 提示：WS-UCS 可对接 `do-api` / `do-task` 的实时部分实现。
