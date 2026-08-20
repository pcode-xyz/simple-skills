---
name: specs-api
description: 接口定义。先让用户选 HTTP 还是 gRPC；HTTP 再选标准 RESTful 或只用 GET/POST，按统一 code/data/message 规范，用顺序 subagent 逐页从 demo 页面生成接口，按模块增量合并到 docs/specs/API/模块.yaml（gRPC → docs/specs/grpc/模块.proto）。当用户要做接口设计、API 定义、OpenAPI 文档、proto 定义时使用。
---

# specs-api

接口定义：从产品原型与业务流程生成接口文档。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`、`docs/product/demo/`（≥1 个 HTML 页面）。
- 建议存在：`docs/specs/data/` 下的 DB 设计文件（MySQL/SQLite/PostgreSQL 为 `table.sql`，MongoDB 为 `schema.json`；接口字段名/类型优先对齐它，缺失则退化为用 glossary 英文名）、`docs/product/glossary.md`。
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
- **字段名/类型优先遵守 DB 文件**：接口字段名和类型优先按 `docs/specs/data/` 下的 DB 设计文件描述（MySQL/SQLite/PostgreSQL → `table.sql`，MongoDB → `schema.json`）；缺失时用 glossary 英文名。
- **server**：`servers` 的 url 由用户设置，默认 `http://127.0.0.1`（若用户给了域名则用用户的）；开始生成前与用户确认一次。路径不含 `/api` 前缀。
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

**起 subagent 时 prompt 必须自包含**（subagent 是独立上下文，不继承父级规范，不能只写"按上面规则来"）：

每个 subagent 的 prompt 必须包含——
1. **要读的文件**（逐条列出路径）：
   - 该页面的 HTML（demo 下**只读这一个页面**，不读其他 demo 页面）；
   - `docs/product/business-flow.md`（业务流程上下文）；
   - `docs/specs/data/` 下的 DB 设计文件（MySQL/SQLite/PostgreSQL → `table.sql`，MongoDB → `schema.json`）——**接口字段名/类型以此为准**；
   - `docs/product/glossary.md`（DB 缺失字段的英文名兜底）。
2. **输出规则**（逐条内嵌在 prompt 里，不引用外部）：严格 OpenAPI 3.0、使用中文、统一 `{code,data,message}` envelope（code=0 成功）、方法限制（按所选风格：只用 GET/POST 或 RESTful 方法集）、URL 无路径参数（或资源化）、server url（已确认的默认/用户域名，路径不含 /api 前缀）、**每个接口必须带请求与响应样例**、接口名 `模块/操作` 格式。
3. **行为约束**：只读不写文件，返回结构化结果（接口清单 ＋ 每个接口的 OpenAPI 片段）。

主流程（每页完成后）：
- 接口名格式：**`模块/操作`**（如 `trip/create`、`trip/like`、`user/favorite`；RESTful 风格下操作名与资源方法对应）。
- **按模块落盘**：`trip/*` → `docs/specs/API/trip.yaml`；`user/*` → `docs/specs/API/user.yaml`。
- **增量合并，不覆盖**：同一模块文件被多页写入时，向 `paths` 补新路径；若某接口已存在（别的页面也需要），复用并核对一致性，不重复定义。
- `mkdir -p docs/specs/API`；文件已存在先读再合并。

## Step 5 — gRPC 生成接口（subagent，逐页）

gRPC 与 HTTP 共享前置依赖、Step 4 的顺序 subagent 生成方式与增量合并逻辑，仅输出格式与规范不同。

### 5.1 gRPC 规范（proto3）

- **使用中文**：注释、描述用中文。
- 先读 `docs/product/business-flow.md` 理解业务流程，再去理解要处理的页面。
- **每个模块一个 `.proto` 文件**，proto3 语法：`syntax = "proto3";`、`package <模块>;`（如 `package trip;`）。
- **service / RPC 命名**：按 `模块/操作` 语义——模块作 service（如 `service TripService`），操作作 RPC 方法（如 `rpc Create`、`rpc Like`）；请求/响应 message 命名 `XxxRequest` / `XxxResponse`。
- **字段名/类型优先遵守 DB 文件**：以 `docs/specs/data/` 下的 DB 设计文件为准（MySQL/SQLite/PG → `table.sql`，MongoDB → `schema.json`），缺失用 glossary 英文名。proto 字段用 snake_case；类型按 DB 映射（varchar→`string`、int→`int32`/`int64`、timestamp→`google.protobuf.Timestamp`、非负数→`uint32`/`uint64` 等）。
- **统一返回结构** `{code, data, message}`：每个 RPC 的响应 message 包含 `int32 code`（0 成功，非 0 失败）、`string message`（错误原因），以及**具体化的 data 字段**——proto 无泛型，不用 `google.protobuf.Any`，data 用具体字段。
- **样例**：每个 RPC 在注释里给出请求/响应示例（`// 请求：...` `// 响应：...`）。
- 公共类型（时间戳、分页等）在文件顶部 `import` 或复用模块内 message。

### 5.2 顺序生成（subagent，逐页）

与 Step 4 完全一致的方式：**顺序性子任务，每次只做一个**，用 Agent 工具起 subagent，只让它处理 `docs/product/demo/` 的**一个页面**，等返回合并后再处理下一页，**不要并行**。

起 subagent 时 prompt 必须**自包含**（subagent 不继承父级规范）：
1. **要读的文件**（逐条列出）：该页面 HTML（demo 下只读这一页）＋ `docs/product/business-flow.md` ＋ `docs/specs/data/` 下的 DB 设计文件（字段名/类型以此为准）＋ `docs/product/glossary.md`（兜底）。
2. **输出规则**（逐条内嵌）：上面的 5.1 gRPC 规范——proto3 语法、中文注释、service/RPC 按 `模块/操作`、字段名/类型遵守 DB、统一 `code/data/message` 响应、每个 RPC 带请求/响应样例注释。
3. **行为约束**：只读不写文件，返回结构化结果（接口清单 ＋ 每个接口的 proto 片段）。

主流程（每页完成后）：
- **按模块落盘**：`mkdir -p docs/specs/grpc`；`trip/*` → `docs/specs/grpc/trip.proto`，`user/*` → `docs/specs/grpc/user.proto`。
- **增量合并，不覆盖**：同一 proto 被多页写入时，向 service 补 RPC、向文件补 message；已存在的 RPC/message 复用并核对一致性，不重复定义。

## 完成后

- 报告生成的 yaml / proto 文件清单。
- 提示可对照 business-flow.md 的"关键追溯点"核对接口是否覆盖核心流程。
