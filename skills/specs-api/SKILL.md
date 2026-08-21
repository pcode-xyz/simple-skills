---
name: specs-api
description: 接口定义。先让用户选 HTTP 还是 gRPC；HTTP 再选标准 RESTful 或只用 GET/POST，按统一 code/data/message 规范，用顺序 subagent 逐页从 demo 页面生成接口，按模块增量合并到 docs/specs/API/模块.yaml（gRPC → docs/specs/grpc/模块.proto）。当用户要做接口设计、API 定义、OpenAPI 文档、proto 定义时使用。
disable-model-invocation: true
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

> **HTTP 与 gRPC 是互斥路径，只走一条**：选 HTTP → 只执行 Step 2/3/4，到 Step 4 结束；选 gRPC → 只执行 Step 5，到 Step 5 结束。**严禁在完成所选路径后继续执行另一条**（HTTP 路径不得接着跑 Step 5；反之亦然）。

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

## Step 4 — HTTP 接口生成（subagent，逐页直接落盘）

**顺序性子任务，每次只做一个**：用 Agent 工具起一个 subagent，只让它处理 `docs/product/demo/` 的**一个页面**；等它返回后再起下一个处理下一页。**不要并行。** 因顺序执行无并发写冲突，**由 subagent 直接写/合并模块文件**。

**起 subagent 时 prompt 必须自包含**（subagent 是独立上下文，不继承父级规范，不能只写"按上面规则来"）：

每个 subagent 的 prompt 必须包含——
1. **要读的文件**（逐条列出路径）：
   - 该页面的 HTML（demo 下**只读这一个页面**，不读其他 demo 页面）；
   - `docs/product/business-flow.md`（业务流程上下文）；
   - `docs/specs/data/` 下的 DB 设计文件（MySQL/SQLite/PostgreSQL → `table.sql`，MongoDB → `schema.json`）——**接口字段名/类型以此为准**；
   - `docs/product/glossary.md`（DB 缺失字段的英文名兜底）；
   - **`docs/specs/API/` 下已存在的模块 yaml**（`ls` 列出并逐个读，作为模块归属与复用判断的依据；不存在则本页首个接口按新模块建）。
2. **输出规则**（逐条内嵌在 prompt 里，不引用外部）：严格 OpenAPI 3.0、使用中文、统一 `{code,data,message}` envelope（code=0 成功）、方法限制（按所选风格：只用 GET/POST 或 RESTful 方法集）、URL 无路径参数（或资源化）、server url（已确认的默认/用户域名，路径不含 /api 前缀）、**每个接口必须带请求与响应样例**、接口名 `模块/操作` 格式——**逐条识别页面上所有外部连接/操作（表单、按钮、链接等），一个页面可跨多个模块**，每个接口按业务归属命名，不要假设整页属于单一模块；命名参考传入的「已注册模块清单」：同一业务概念复用已有模块名，页面揭示新概念才新命名模块。
3. **模块归属评估**（对照已存在模块 yaml，逐接口判断）：
   - 接口已在某模块文件定义过（别的页面也需要）→ **复用**，核对一致性，不重复定义；
   - 同一业务概念已有对应模块文件 → **归入该模块**，复用模块名，向该文件 `paths` 增量补；
   - 页面揭示新概念、无对应模块 → **新建模块文件**（`docs/specs/API/新模块.yaml`）。
4. **写文件**（subagent 直接执行，非只读）：
   - `mkdir -p docs/specs/API`；**增量合并，不覆盖**已存在文件内容；已存在文件先读再合并；
   - 每页完成后返回**摘要**（新增接口、复用接口、触达/新建的模块文件），不再返回完整 OpenAPI 片段。

主流程（每页 subagent 完成后）：
- **主 agent 不做页面→模块预分配**：模块归属由 subagent 对照已存在文件评估，主 agent 只负责顺序起 subagent、记录摘要。
- **维护已注册模块清单**：把各 subagent 摘要里的模块名累积登记，起下一个 subagent 时作为「命名参考」传入（是数据，不是规范，不违背 prompt 自包含），跨页命名保持一致。
- 将每页摘要（新增/复用接口、模块文件）报告给用户。

> **（HTTP 路径至此结束）** 本 skill 完成，不要继续执行 Step 5（gRPC）。

## Step 5 — gRPC 接口生成（subagent，逐页直接落盘）

> **仅当 Step 1 选了 gRPC 才执行本节**；选了 HTTP 时本节跳过。与 HTTP 路径共享前置依赖、顺序 subagent 生成方式与增量合并逻辑，仅输出格式与规范不同。

### 5.1 gRPC 规范（proto3）

- **使用中文**：注释、描述用中文。
- 先读 `docs/product/business-flow.md` 理解业务流程，再去理解要处理的页面。
- **每个模块一个 `.proto` 文件**，proto3 语法：`syntax = "proto3";`、`package <模块>;`（如 `package trip;`）。
- **service / RPC 命名**：按 `模块/操作` 语义——模块作 service（如 `service TripService`），操作作 RPC 方法（如 `rpc Create`、`rpc Like`）；请求/响应 message 命名 `XxxRequest` / `XxxResponse`。
- **字段名/类型优先遵守 DB 文件**：以 `docs/specs/data/` 下的 DB 设计文件为准（MySQL/SQLite/PG → `table.sql`，MongoDB → `schema.json`），缺失用 glossary 英文名。proto 字段用 snake_case；类型按 DB 映射（varchar→`string`、int→`int32`/`int64`、timestamp→`google.protobuf.Timestamp`、非负数→`uint32`/`uint64` 等）。
- **统一返回结构** `{code, data, message}`：每个 RPC 的响应 message 包含 `int32 code`（0 成功，非 0 失败）、`string message`（错误原因），以及**具体化的 data 字段**——proto 无泛型，不用 `google.protobuf.Any`，data 用具体字段。
- **样例**：每个 RPC 在注释里给出请求/响应示例（`// 请求：...` `// 响应：...`）。
- 公共类型（时间戳、分页等）在文件顶部 `import` 或复用模块内 message。

### 5.2 gRPC 接口生成（subagent，逐页直接落盘）

与 Step 4 完全一致的方式：**顺序性子任务，每次只做一个**，用 Agent 工具起 subagent，只让它处理 `docs/product/demo/` 的**一个页面**，等返回后再处理下一页，**不要并行**。因顺序执行无并发写冲突，**由 subagent 直接写/合并 proto 文件**。

起 subagent 时 prompt 必须**自包含**（subagent 不继承父级规范）：
1. **要读的文件**（逐条列出）：该页面 HTML（demo 下只读这一页）＋ `docs/product/business-flow.md` ＋ `docs/specs/data/` 下的 DB 设计文件（字段名/类型以此为准）＋ `docs/product/glossary.md`（兜底）＋ **`docs/specs/grpc/` 下已存在的模块 proto**（`ls` 列出并逐个读，作为 service 归属与复用判断的依据；不存在则按新模块建）。
2. **输出规则**（逐条内嵌）：上面的 5.1 gRPC 规范——proto3 语法、中文注释、service/RPC 按 `模块/操作`、字段名/类型遵守 DB、统一 `code/data/message` 响应、每个 RPC 带请求/响应样例注释。**service/操作命名同上**：逐条识别页面上所有外部连接/操作，一个页面可跨多个模块，每个 RPC 按业务归属命名，不要假设整页属于单一模块；命名参考传入的「已注册模块清单」：同一业务概念复用已有模块名，页面揭示新概念才新命名模块。
3. **模块归属评估**（对照已存在模块 proto，逐 RPC 判断）：已定义的 RPC → 复用并核对一致性，不重复定义；已有对应 service → 归入该模块，向该文件补 RPC/message；页面揭示新概念 → 新建模块 proto。
4. **写文件**（subagent 直接执行，非只读）：`mkdir -p docs/specs/grpc`；**增量合并，不覆盖**，已存在文件先读再合并；每页完成后返回**摘要**（新增 RPC、复用 RPC、触达/新建的模块 proto），不再返回完整 proto 片段。

主流程（每页完成后）：
- **主 agent 不做页面→模块预分配**：模块归属由 subagent 对照已存在文件评估，主 agent 只负责顺序起 subagent、记录摘要。
- **维护已注册模块清单**：把各 subagent 摘要里的模块名累积登记，起下一个 subagent 时作为「命名参考」传入（是数据，不是规范，不违背 prompt 自包含），跨页命名保持一致。
- 将每页摘要（新增/复用 RPC、模块 proto）报告给用户。

> **（gRPC 路径至此结束）** 本 skill 完成。

## 完成后

- 报告生成的 yaml / proto 文件清单。
- 提示下一步：运行 `architecture` 技术选型（产出 tech-stack-rule.md，`specs-data` 的前置）。
