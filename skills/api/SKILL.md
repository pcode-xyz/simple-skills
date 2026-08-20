---
name: api
description: 接口定义。先让用户选 HTTP(OpenAPI 3.0) 还是 gRPC(proto3)，HTTP 按统一 code/data/message 规范，用顺序 subagent 逐页从 demo 页面生成接口，按模块增量合并到 docs/specs/API/模块.yaml。当用户要做接口设计、API 定义、OpenAPI 文档、proto 定义时使用。
---

# api

接口定义：从产品原型与业务流程生成接口文档。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`、`docs/product/demo/`（≥1 个 HTML 页面）。
- 建议存在：`docs/specs/data/table.sql`（接口字段对齐它；缺失则退化为用 glossary 英文名）、`docs/product/glossary.md`。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 选协议（AskUserQuestion）

- **HTTP**（默认推荐）：OpenAPI 3.0，输出 `docs/specs/API/模块.yaml`
- **gRPC**：proto3，输出 `docs/specs/API-UCS/模块.proto`

## Step 2 — 通用规范（HTTP）

- **使用中文**：描述、注释、样例文案用中文。
- 先读 `docs/product/business-flow.md` 理解业务流程，再去理解要处理的页面。
- 每个接口**严格 OpenAPI 3.0** 格式。
- **只用 GET / POST**：查询类用 GET（参数放 query），写操作用 POST（参数放 body）。
- **URL 不用路径参数**：不得把路由当参数（如 `/trip/create`，不用 `/trip/{id}`）；参数一律走 query（GET）或 body（POST）。
- **统一返回结构**：`{ code, data, message }`——`code=0` 成功、`data` 为具体返回值；`code≠0` 失败、`message` 为错误原因。在 `components/schemas` 定义共享 envelope，每个接口响应用它组合出具体 `data` 结构（可用 `allOf`）。
- **字段对齐 DB**：接口字段名/类型参考 `docs/specs/data/table.sql` 的字段（以 glossary 英文为基准）。
- **server**：`servers: [{ url: https://api.yiqiyo.com }]`，路径不含 `/api` 前缀。
- **每个接口必须给出请求与输出样例**：requestBody 带 `examples`，response 带 `examples`。

## Step 3 — 顺序生成接口（subagent，逐页）

**顺序性子任务，每次只做一个**：用 Agent 工具起一个 subagent，只让它处理 `docs/product/demo/` 的**一个页面**；等它返回并合并结果后，再起下一个处理下一页。**不要并行。**

每个 subagent 任务（只读、不写文件）：
1. 只读指定页面的 HTML；
2. 结合 business-flow.md 的业务流程，理解该页面需要哪些接口；
3. 为每个接口输出 OpenAPI 3.0 定义（按 Step 2 规范，含请求/响应样例）；
4. 返回结构化结果：接口清单（`模块/操作`）＋ 每个接口的 OpenAPI 片段。

主流程（每页完成后）：
- 接口名格式：**`模块/操作`**（如 `trip/create`、`trip/like`、`user/favorite`）。
- **按模块落盘**：`trip/create`、`trip/like` → `docs/specs/API/trip.yaml`；`user/favorite` → `docs/specs/API/user.yaml`。
- **增量合并，不覆盖**：同一模块文件被多页写入时，向 `paths` 补新路径；若某接口已存在（别的页面也需要），复用并核对一致性，不重复定义。
- `mkdir -p docs/specs/API`；文件已存在先读再合并。

## Step 4 — gRPC 适配（基于上面"看着改"）

- 输出 proto3 到 `docs/specs/API-UCS/模块.proto`（如 `trip.proto`、`user.proto`）。
- service 方法按 `模块/操作` 语义命名（如 `rpc TripCreate`），message 字段用 glossary/DB 英文。
- 统一返回：定义公共 `ApiResponse`（`int32 code; string message;` + data），按模块复用。
- 同样遵守：中文注释、非 0 code 表示失败、样例注释给出请求/响应示例、按模块分文件增量合并。

## 完成后

- 报告生成的 yaml / proto 文件清单。
- 提示可对照 business-flow.md 的"关键追溯点"核对接口是否覆盖核心流程。
