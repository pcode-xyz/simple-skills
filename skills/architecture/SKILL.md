---
name: architecture
description: 技术选型。先选端（前端/后端/App/桌面端/小程序），再按端选具体技术栈（每步给出推荐等用户确认），后端额外定架构（薄层垂直切片/DDD/其他），然后构造"资深X架构师"选型 prompt 用 subagent 执行，输出技术栈总览到 docs/standards/tech-stack-rule.md + tech-stack-draft.md 并登记进 CLAUDE.md 约束清单。当用户要做技术选型、定技术栈、架构决策时使用。
---

# architecture

技术选型：端 → 技术栈 →（后端额外定架构）→ 选型分析落盘到 `docs/standards/`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`。
- 建议存在：`docs/specs/data/`（DB 设计文件，table.sql 或 schema.json）、`docs/specs/API` 或 `docs/specs/grpc`（已定义接口）、`docs/standards/CLAUDE.md`（约束层约定）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 选端（AskUserQuestion）

- 前端 / 后端 / App / 桌面端 / 小程序

## Step 2 — 按端选技术栈（每步先给推荐，等用户确认）

### 前端
- 框架：**Vue3（推荐）** / React / 其他
- UI：组件式开发，推荐组件库（Vue → Element Plus，React → Ant Design）；用户可指定其他
- 构建：**Vite（推荐）**

### 后端
- 语言：**Golang（推荐）** / Node / Rust / 其他
- 若选 Golang：默认偏好 Web 框架 Gin、ORM GORM、配置 viper + 函数式选项、日志 zap（仍会在选型分析里做替代方案对比）
- 其他语言按该语言主流方案给推荐（Node → NestJS/Express、Rust → Axum/Actix 等），进 Step 4 对比

### App
- 平台：iOS / 安卓（可多选）
- 方案：原生 / **Flutter（推荐）** / React Native / 其他
- UI：组件式开发 + 对应组件库

### 桌面端
- 方案：**Tauri（推荐）** / Electron / 其他
- UI：组件式开发 + 组件库

### 小程序
- 平台：微信（默认）/ 其他
- 方案：原生 / **Taro（推荐）** / uni-app
- UI：组件式开发 + 对应 UI 库

**通用**：需要实现 UI 的端，都要求**组件式开发**，并在选型 prompt 里明确写上。

## Step 3 — 后端架构（仅选后端时才问）

AskUserQuestion：
- **薄层级垂直切片架构（推荐）**：中间件与工具层做抽象，业务编排保持平铺
- 标准 DDD 架构
- 其他（自定义）

记录结果，注入 Step 4 的 prompt。

## Step 4 — 构造选型 prompt 并执行（subagent）

### 4.1 构造 prompt

按所选端 / 技术栈 / 架构，套用下面的**基础模板**替换 {} 占位，构造一条"资深{端}架构师" prompt。prompt 必须**自包含**（subagent 不继承父级规范）。

基础模板：

    你是一位资深{端}架构师，精通{语言/框架}。现需要你做完整的技术选型分析（只做技术选型即可），
    各选型的详细理由 + 替代方案对比表（{关键候选，如 Gin/Echo/Fiber、GORM/sqlx/ent、zap/zerolog/slog}），
    输出技术栈总览表（类别 / 选型 / 版本 / 职责）。

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 已定义的 API：docs/specs/API（或 docs/specs/grpc）

    ## 技术选型基本要求
    - {架构约束行，见下}
    - {已确认的约束：如 Web 框架 Gin、ORM GORM、配置 viper+函数式选项、日志 zap}
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
