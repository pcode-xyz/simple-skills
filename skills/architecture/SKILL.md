---
name: architecture
description: 技术选型。先选端（前端/后端/App/桌面端/小程序），再按端选具体技术栈（每项预录一份自包含的推荐约束块、先给推荐等用户确认），后端额外定架构（薄层垂直切片/DDD/其他），然后构造"资深X架构师"选型 prompt 用 subagent 执行，输出技术栈总览到 docs/standards/tech-stack-rule.md + tech-stack-draft.md 并登记进 CLAUDE.md 约束清单。当用户要做技术选型、定技术栈、架构决策时使用。
---

# architecture

技术选型：端 → 技术栈 →（后端额外定架构）→ 选型分析落盘到 `docs/standards/`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`。
- 建议存在：`docs/specs/data/`（DB 设计文件，table.sql 或 schema.json）、`docs/specs/API` 或 `docs/specs/grpc`（已定义接口）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 选端（AskUserQuestion）

- 前端 / 后端 / App / 桌面端 / 小程序

## Step 2 — 按端选技术栈（每项一份自包含约束块，先给推荐，等用户确认）

**说明**：每个可选项对应一份**自包含的推荐约束块**。用户确认选择后，把该块**整块**注入 Step 4 的 prompt，**严禁混入其他方案的块**（避免跨语言/跨方案串配）。替代方案只写在同选型内部（同语言组件级替代，不会串语言）。运行时 subagent 会核对"当前最流行、与本地环境匹配"，可微调定稿。

### 前端

- **选 Vue3（推荐）** → 约束块：框架 Vue 3、语言 TypeScript、构建 Vite、路由 Vue Router、状态 Pinia、UI Element Plus（组件式开发）、HTTP axios；SSR/全栈加 Nuxt。替代：React/Svelte。
- **选 React** → 约束块：框架 React 19、语言 TypeScript、构建 Vite、路由 React Router、状态 Zustand、UI Ant Design（组件式开发）、HTTP axios/TanStack Query；全栈加 Next.js。替代：Vue3。

### 后端

- **选 Golang（推荐）** → 约束块：Web 框架 Gin（替代 Echo/Fiber/Chi）、ORM GORM（替代 ent/sqlx/sqlc）、配置 viper + 函数式选项（替代 envconfig/koanf）、日志 log/slog（替代 zap/zerolog）、校验 go-playground/validator、认证 golang-jwt/jwt、WebSocket gorilla/websocket、HTTP 客户端 net/http 或 resty、迁移 golang-migrate。
- **选 Node** → 约束块：框架 NestJS（替代 Express/Fastify）、ORM Prisma（替代 TypeORM）、日志 pino、校验 class-validator、认证 @nestjs/jwt（passport）、WebSocket 内置 + Socket.io、HTTP 客户端 axios、迁移 Prisma migrate。
- **选 Rust** → 约束块：框架 Axum（替代 Actix-web）、ORM sqlx（替代 SeaORM/diesel）、日志 tracing、校验 validator、认证 jsonwebtoken、WebSocket tokio-tungstenite、HTTP 客户端 reqwest、迁移 sqlx migrate。

### App

- **选 Flutter（推荐）** → 约束块：UI Flutter（组件式开发）、状态 Riverpod/Provider、路由 go_router、HTTP dio、序列化 json_serializable。替代：React Native。
- **选 React Native** → 约束块：UI 主流 RN 组件库（组件式开发）、导航 React Navigation、状态 Zustand/Redux Toolkit、数据 TanStack Query、HTTP axios、热更新 CodePush。替代：Flutter。

### 桌面端

- **选 Tauri（推荐）** → 约束块：前端 Vue3/React + Vite、后端 Rust、打包 Tauri 内置、更新 Tauri Updater。替代：Electron。
- **选 Electron** → 约束块：前端 Vue3/React、后端 Node、打包 electron-builder、更新 electron-updater。替代：Tauri。

### 小程序

平台：微信（默认）/ 其他。方案**跟随前端栈联动**：

- **前端选 Vue → 选 uni-app（推荐）** → 约束块：UI uni-ui/uView（组件式开发）、多端 微信/支付宝/抖音/H5/App。
- **前端选 React → 选 Taro** → 约束块：UI Taro UI/Ant Design Mobile（组件式开发）、多端 微信/支付宝/抖音/H5。
- 只做微信 → 原生小程序（约束块：微信原生组件、WXML/WXSS、组件式开发）。

## Step 3 — 后端架构（仅选后端时才问）

AskUserQuestion：
- **薄层级垂直切片架构（推荐）**：中间件与工具层做抽象，业务编排保持平铺
- **扁平业务切片**：业务代码零抽象、基础设施平铺，每个接口一个文件自包含
- **标准 DDD 架构**：四层整洁架构（api/application/domain/infra）+ 限界上下文
- 其他（自定义）

记录结果，仅作为选型约束的一句话说明注入 Step 4 的 prompt；**详细的目录结构设计由 `/simple:standards-directory` 完成**。

## Step 4 — 构造选型 prompt 并执行（subagent）

### 4.1 构造 prompt

按所选端 / 技术栈 / 架构，套用下面的**基础模板**替换 {} 占位，构造一条"资深{端}架构师" prompt。prompt 必须**自包含**（subagent 不继承父级规范）。

- **{已确认的约束}**：直接注入用户在 Step 2 选中的那一份约束块（整块原样），**不要混入其他方案的块**。
- **{关键候选}**：从该约束块内的替代方案中列出，作为对比表对象。

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
    - {已确认的约束：Step 2 选中的那份约束块}
    - 需要实现 UI 的端：采用组件式开发
    - 其他中间件根据项目需要选型（JWT、WebSocket、HTTP 客户端等），每个选型需给出理由和替代方案对比
    - 需要选当前最流行的，与本地环境匹配的中间件

架构约束行按 Step 3 的选择注入（一句话约束，选型阶段用；**详细目录设计由 standards-directory 完成**）：
- 垂直切片 → "中间件与工具层需要做抽象，而业务编排需要保持平铺（薄层级的垂直切片架构）"
- 扁平业务切片 → "业务代码零抽象、基础设施平铺，每个接口一个文件自包含；工具库按需直调，不包装成 Service"
- DDD → "工程结构按 DDD 分层（api/application/domain/infra），选型需支持 DI 与仓储模式解耦"
- 其他 → 按用户描述写

### 4.2 执行（subagent）

用 Agent 工具起一个 subagent（prompt 用 4.1 构造好的完整内容）：
1. **要读的文件**：`docs/product/business-flow.md`、`docs/specs/data/` 下 DB 文件、`docs/specs/API` 或 `docs/specs/grpc` 下接口文件、`docs/standards/CLAUDE.md`（了解约束层命名约定）。
2. **返回**（只读不写文件）：技术栈总览（类别/选型/版本/职责）、每个选型的详细理由 + 替代方案对比表、约束清单行（文件名/覆盖范围）。
3. **行为约束**：只读不写文件，返回上述结构化内容。

主流程（subagent 返回后，由主流程写文件）：
- `mkdir -p docs/standards`；文件已存在先读再合并/询问。
- 写 `docs/standards/tech-stack-rule.md`：顶部先写"选型上下文"元信息（**端**、**技术栈概要**、**后端架构风格**，供 standards-directory 读取避免重复选择），再写技术栈总览表 + 明确约束（AI 直接照做）。
- 写 `docs/standards/tech-stack-draft.md`：每个选型理由 + 替代方案对比表（人工追溯用）。
- 更新 `docs/standards/CLAUDE.md` 的"当前约束清单"表，补上 tech-stack 行（按 init-docs 的 CLAUDE.md 约定）。

## 完成后

- 报告 `docs/standards/tech-stack-rule.md` 与 `tech-stack-draft.md` 路径。
- 提示新约束已登记到 `docs/standards/CLAUDE.md` 清单；下一步运行 `standards-directory` 设计目录结构。
