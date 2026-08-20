---
name: api
description: 接口定义。先让用户选 HTTP 还是 gRPC；HTTP 再选标准 RESTful 或只用 GET/POST，按统一 code/data/message 规范，用顺序 subagent 逐页从 demo 页面生成接口，按模块增量合并到 docs/specs/API/模块.yaml（gRPC → docs/specs/grpc/模块.proto）。当用户要做接口设计、API 定义、OpenAPI 文档、proto 定义时使用。
---

# api

接口定义：从产品原型与业务流程生成接口文档。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`、`docs/product/demo/`（≥1 个 HTML 页面）。
- 建议存在：`docs/specs/data/table.sql`（接口字段对齐它；缺失则退化为用 glossary 英文名）、`docs/product/glossary.md`。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 选协议（AskUserQuestion）

- **HTTP**（默认推荐）：OpenAPI 3.0，输出 `docs/specs/API/模块.yaml`
- **gRPC**：proto3，输出 `docs/specs/grpc/模块.proto`

选 HTTP 则进入 Step 2 选风格；选 gRPC 直接跳到 Step 5。

## Step 2 — 选 HTTP 风格（AskUserQuestion）

- **标准 RESTful**（推荐）：GET/POST/PUT/DELETE 语义、资源化 URL、可含路径参数；适合通用后端团队协作
- **只用 GET/POST**：简化风格，URL 无路径参数，query/body 传参；适合快速落地

## Step 3 — HTTP 规范（按 Step 2 所选风格）

两种风格的**公共要求**：
- **使用中文**：描述、注释、样例文案用中文。
- 先读 `docs/product/business-flow.md` 理解业务流程，再去理解要处理的页面。
- 每个接口**严格 OpenAPI 3.0** 格式。
- **统一返回结构**：`{ code, data, message }`——`code=0` 成功、`data` 为具体返回值；`code≠0` 失败、`message` 为错误原因。在 `components/schemas` 定义共享 envelope，每个接口响应用它组合出具体 `data` 结构（可用 `allOf`）。
- **字段对齐 DB**：接口字段名/类型参考 `docs/specs/data/table.sql` 的字段（以 glossary 英文为基准）。
- **server**：`servers: [{ url: https://api.yiqiyo.com }]`，路径不含 `/api` 前缀。
- **每个接口必须给出请求与输出样例**：requestBody 带 `examples`，response 带 `examples`。

### 3A. 只用 GET/POST（简化风格）

- 只允许 GET / POST 两种方法：查询类用 GET（参数放 query），写操作用 POST（参数放 body）。
- **URL 不用路径参数**：不得把路由当参数（如 `/trip/create`，不用 `/trip/{id}`）；参数一律走 query 或 body。

### 3B. 标准 RESTful

- **方法用 RESTful 语义**：GET（查询）、POST（创建）、PUT（更新）、DELETE（删除），需要部分更新可用 PATCH。
- **URL 资源化**：复数资源名 + 路径参数标识资源（如 `GET /trips/{id}`、`POST /trips`、`PUT /trips/{id}`、`DELETE /trips/{id}`）。操作语义走方法，不在 URL 里用动词。
- **HTTP 状态码**：在 envelope 之外，按 RESTful 语义使用状态码（200/201/204/400/404/500 等）；`code/data/message` 仍保留。

## Step 4 — 顺序生成接口（subagent，逐页）

**顺序性子任务，每次只做一个**：用 Agent 工具起一个 subagent，只让它处理 `docs/product/demo/` 的**一个页面**；等它返回并合并结果后，再起下一个处理下一页。**不要并行。**

每个 subagent 任务（只读、不写文件）：
1. 只读指定页面的 HTML；
2. 结合 business-flow.md 的业务流程，理解该页面需要哪些接口；
3. 按 Step 3 所选风格的规范，为每个接口输出 OpenAPI 3.0 定义（含请求/响应样例）；
4. 返回结构化结果：接口清单（`模块/操作`）＋ 每个接口的 OpenAPI 片段。

主流程（每页完成后）：
- 接口名格式：**`模块/操作`**（如 `trip/create`、`trip/like`、`user/favorite`；RESTful 风格下操作名与资源方法对应）。
- **按模块落盘**：`trip/*` → `docs/specs/API/trip.yaml`；`user/*` → `docs/specs/API/user.yaml`。
- **增量合并，不覆盖**：同一模块文件被多页写入时，向 `paths` 补新路径；若某接口已存在（别的页面也需要），复用并核对一致性，不重复定义。
- `mkdir -p docs/specs/API`；文件已存在先读再合并。

## Step 5 — gRPC 适配（基于上面"看着改"）

- `mkdir -p docs/specs/grpc`，输出 proto3 到 `docs/specs/grpc/模块.proto`（如 `trip.proto`、`user.proto`）。
- service 方法按 `模块/操作` 语义命名（如 `rpc TripCreate`），message 字段用 glossary/DB 英文。
- 统一返回：定义公共 `ApiResponse`（`int32 code; string message;` + data），按模块复用。
- 同样遵守：中文注释、非 0 code 表示失败、样例注释给出请求/响应示例、按模块分文件增量合并。

## 完成后

- 报告生成的 yaml / proto 文件清单。
- 提示可对照 business-flow.md 的"关键追溯点"核对接口是否覆盖核心流程。
