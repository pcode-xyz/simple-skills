---
name: architecture
description: 技术选型。先选端（前端/后端/App/桌面端/小程序），再按端选具体技术栈（每端预录推荐栈与配套、先给推荐等用户确认），后端额外定架构（薄层垂直切片/DDD/其他），然后构造"资深X架构师"选型 prompt 用 subagent 执行，输出技术栈总览到 docs/standards/tech-stack-rule.md + tech-stack-draft.md 并登记进 CLAUDE.md 约束清单。当用户要做技术选型、定技术栈、架构决策时使用。
---

# architecture

技术选型：端 → 技术栈 →（后端额外定架构）→ 选型分析落盘到 `docs/standards/`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`。
- 建议存在：`docs/specs/data/`（DB 设计文件，table.sql 或 schema.json）、`docs/specs/API` 或 `docs/specs/grpc`（已定义接口）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 选端（AskUserQuestion）

- 前端 / 后端 / App / 桌面端 / 小程序

## Step 2 — 按端选技术栈（每端预录推荐栈与配套，先给推荐，等用户确认）

**说明**：下表为预录入的推荐栈与配套（2026 已核实的主流选型）。运行时 Step 4 的 subagent 会再核对"当前最流行、与本地环境匹配"，可微调定稿。用户确认或改选后，把最终选择注入 Step 4 的 prompt。

### 前端
推荐：**Vue3（推荐，效率优先 / 中后台）** 或 React（大型复杂 / 全栈，配 Next.js）。用户可指定其他。

| 类别 | 推荐选型 | 职责 | 替代方案 |
| --- | --- | --- | --- |
| 框架 | Vue 3（或 React 19） | UI | 另一者 / Svelte |
| 语言 | TypeScript | 类型安全 | JavaScript |
| 构建 | Vite | 构建与开发服务器 | webpack / Rspack |
| 路由 | Vue Router（Vue） / React Router（React） | 页面路由 | - |
| 状态 | Pinia（Vue） / Zustand（React） | 全局状态 | Redux Toolkit / Jotai |
| UI 组件 | Element Plus（Vue） / Ant Design（React） | 组件库（组件式开发） | Naive UI / TDesign |
| HTTP | axios | 请求 | TanStack Query / fetch |
| 元框架（可选） | Nuxt（Vue） / Next.js（React） | SSR / 全栈 | - |

### 后端
推荐：**Golang（推荐）**；Node / Rust 作为备选（配套见表末）。

| 类别 | 推荐选型 | 职责 | 替代方案 |
| --- | --- | --- | --- |
| Web 框架 | Gin | HTTP 路由 / 中间件 | Echo / Fiber / Chi |
| ORM | GORM | 数据访问 | ent（类型安全/复杂关系）/ sqlx / sqlc |
| 配置 | viper + 函数式选项 | 配置加载 | envconfig / koanf |
| 日志 | **log/slog（默认，2026 标准库共识）** | 结构化日志 | zap（高性能热路径）/ zerolog |
| 校验 | go-playground/validator | 参数校验 | 手写 |
| 认证 | golang-jwt/jwt | JWT | oauth2 |
| WebSocket | gorilla/websocket | 实时 | gobwas/ws |
| HTTP 客户端 | net/http / resty | 调用外部 | - |
| 迁移 | golang-migrate | 表结构版本 | GORM AutoMigrate |
| Node 备选 | NestJS + Prisma/TypeORM | - | Express / Fastify |
| Rust 备选 | Axum + sqlx/SeaORM | - | Actix-web |

### App
平台：iOS / 安卓（可多选）。方案：**Flutter（推荐，视觉一致/多端/复杂动画）** 或 React Native（JS 团队/Web 代码复用/热更新）。

| 类别 | Flutter | React Native |
| --- | --- | --- |
| 状态 | Riverpod / Provider | Zustand / Redux Toolkit |
| 路由 | go_router | React Navigation |
| HTTP | dio | axios |
| 序列化 | json_serializable | 内置 |
| UI | Material / 自定义组件（组件式开发） | 主流 RN 组件库 |
| 热更新 | 不支持 | CodePush |

### 桌面端
方案：**Tauri（推荐，体积小/内存低/安全/Rust 后端）** 或 Electron（渲染一致/生态大/JS-only）。

| 类别 | Tauri | Electron |
| --- | --- | --- |
| 前端 | Vue3/React + Vite | 同左 |
| 后端 | Rust | Node |
| 打包 | Tauri 内置 | electron-builder |
| 更新 | Tauri Updater | electron-updater |

### 小程序
平台：微信（默认）/ 其他。方案：**跟随前端框架联动**——选 Vue 用 **uni-app（推荐）**，选 React 用 **Taro**；只做微信则用原生。

| 类别 | uni-app | Taro |
| --- | --- | --- |
| 前端语法 | Vue 3 | React（或 Vue） |
| UI 库 | uni-ui / uView | Taro UI / Ant Design Mobile |
| 多端 | 微信/支付宝/抖音/H5/App | 微信/支付宝/抖音/H5 |
| 上手 | 低（HBuilderX） | 中（工程化强、TS 完善） |

**通用**：需要实现 UI 的端，都要求**组件式开发**，并在选型 prompt 里明确写上。

## Step 3 — 后端架构（仅选后端时才问）

AskUserQuestion：
- **薄层级垂直切片架构（推荐）**：中间件与工具层做抽象，业务编排保持平铺
- 标准 DDD 架构
- 其他（自定义）

记录结果，注入 Step 4 的 prompt。

## Step 4 — 构造选型 prompt 并执行（subagent）

### 4.1 构造 prompt

按所选端 / 技术栈 / 架构，套用下面的**基础模板**替换 {} 占位，构造一条"资深{端}架构师" prompt。prompt 必须**自包含**（subagent 不继承父级规范）。**已确认的约束行**从 Step 2 选中的配套里取（如"Web 框架 Gin、ORM GORM、配置 viper+函数式选项、日志 log/slog"），并附带替代方案供对比。

基础模板：

    你是一位资深{端}架构师，精通{语言/框架}。现需要你做完整的技术选型分析（只做技术选型即可），
    各选型的详细理由 + 替代方案对比表（{关键候选，如 Gin/Echo/Fiber、GORM/ent/sqlx、slog/zap/zerolog}），
    输出技术栈总览表（类别 / 选型 / 版本 / 职责）。

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 已定义的 API：docs/specs/API（或 docs/specs/grpc）

    ## 技术选型基本要求
    - {架构约束行，见下}
    - {已确认的约束：从 Step 2 配套取}
    - 需要实现 UI 的端：采用组件式开发
    - 其他中间件根据项目需要选型（JWT、WebSocket、HTTP 客户端等），每个选型需给出理由和替代方案对比
    - 需要选当前最流行的，与本地环境匹配的中间件

架构约束行按 Step 3 的选择注入：
- 垂直切片 → "中间件与工具层需要做抽象，而业务编排需要保持平铺（薄层级的垂直切片架构）"
- DDD → "按领域分层（Interface / Application / Domain / Infrastructure），遵循 DDD 战术建模（聚合、实体、值对象、领域服务）"
- 其他 → 按用户描述写

### 4.2 执行（subagent）

用 Agent 工具起一个 subagent（prompt 用 4.1 构造好的完整内容）：
1. **要读的文件**：`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件、`docs/specs/API` 或 `docs/specs/grpc` 下接口文件、`docs/standards/CLAUDE.md`（了解约束层命名约定）。
2. **返回**（只读不写文件）：技术栈总览（类别/选型/版本/职责）、每个选型的详细理由 + 替代方案对比表、约束清单行（文件名/覆盖范围）。
3. **行为约束**：只读不写文件，返回上述结构化内容。

主流程（subagent 返回后，由主流程写文件）：
- `mkdir -p docs/standards`；文件已存在先读再合并/询问。
- 写 `docs/standards/tech-stack-rule.md`：技术栈总览表 + 明确约束（AI 直接照做）。
- 写 `docs/standards/tech-stack-draft.md`：每个选型理由 + 替代方案对比表（人工追溯用）。
- 更新 `docs/standards/CLAUDE.md` 的"当前约束清单"表，补上 tech-stack 行（按 init-docs 的 CLAUDE.md 约定）。

## 完成后

- 报告 `docs/standards/tech-stack-rule.md` 与 `tech-stack-draft.md` 路径。
- 提示新约束已登记到 `docs/standards/CLAUDE.md` 清单。
