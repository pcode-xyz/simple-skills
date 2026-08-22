# simple-skills

simple 的个人效率自动化技能集，打包成 Claude Code 插件（marketplace）。

## 安装

方式一：通过 marketplace 安装（推荐，可后续从 GitHub 更新）

```bash
claude plugin marketplace add <owner>/simple-skills
claude plugin install simple@simple
```

方式二：本地路径调试安装（未推 GitHub 时用）

```bash
claude plugin marketplace add /Users/simple/coding/simple-skills
claude plugin install simple@simple
```

安装后命令前缀为 `simple`，例如 `/simple:init-docs`。

## 技能列表

按流水线阶段分组，命令前缀 `simple`（如 `/simple:init-docs`）。

流水线：**产品思考 → 技术架构与标准 → 数据/接口/协议定义 → 用例规约 → 执行落地 → 质量与部署**

### 产品思考

| 命令 | 说明 |
| --- | --- |
| `/simple:demo` | 产品思考梳理 + 风格化页面 demo（sense.md + HTML demo） |
| `/simple:specs-design` | 设计元素提取：按 design.md 规范从 demo 提取设计系统（色板/字体/字号/间距/圆角/阴影/组件）→ docs/specs/design/DESIGN.md |
| `/simple:product-business` | 基于 sense.md + demo 原型稿，用四色建模法梳理业务流程（business-flow.md） |
| `/simple:product-glossary` | 统一语言词汇表：business-flow → glossary.md，subagent 逐页对比 demo，分歧/缺失处理 |

### 技术架构与标准

| 命令 | 说明 |
| --- | --- |
| `/simple:architecture` | 技术选型：选端→选技术栈（带推荐）→后端定架构→构造选型 prompt 输出 tech-stack-rule/draft |
| `/simple:standards-directory` | 目录结构设计：读 architecture 选型→按架构风格选模板（DDD/扁平切片/MVC/OOP）→输出 directory-rule/draft |
| `/simple:standards-http` | HTTP handler 请求流转说明（仅后端）：按架构风格选模板，输出 http-handler-rule/draft |
| `/simple:standards-tools` | 工具层设计（通用）：按端+架构风格选模板，输出 tools-rule/draft |
| `/simple:standards-task` | 异步任务层选型（仅后端）：候选对比+架构决策 → task-layer-rule/draft |

### 数据 / 接口 / 协议定义

| 命令 | 说明 |
| --- | --- |
| `/simple:specs-db` | 数据库设计：选 DB 类型（推荐），MySQL 9 条规范生成 table.sql，其他 DB 适配 |
| `/simple:specs-data` | 数据结构定义：可靠性视角识别显式结构（DB JSON/跨接口共享/载荷/外部契约）→ struct.md |
| `/simple:specs-api` | 接口定义：选 HTTP(OpenAPI3.0 → docs/specs/API/) / gRPC(proto3 → docs/specs/grpc/)；HTTP 再选标准 RESTful 或只用 GET/POST；顺序 subagent 逐页生成，按模块合并 |
| `/simple:specs-ws` | WS 协议定义（AsyncAPI 2.6，仅后端）：识别实时通道→顺序 subagent 生成 → docs/specs/ws/ |

### 用例规约（UCS）

| 命令 | 说明 |
| --- | --- |
| `/simple:ucs-api` | 接口用例规约 UCS（仅后端）：顺序 subagent 生成 UCS → API-UCS，再安全审查（6 维度）→ API-UCS-review |
| `/simple:ucs-grpc` | gRPC 接口用例规约 UCS（仅后端）：顺序 subagent 生成 UCS → grpc-UCS，再安全审查（6 维度）→ grpc-UCS-review |
| `/simple:ucs-page` | 页面用例规约 Page UCS（仅写页面端）：盘点 demo 页面→逐任务 subagent 生成 → page-UCS |
| `/simple:ucs-task` | 异步任务用例规约 task-UCS（仅后端）：business-flow 梳理 + grilling 逐任务探讨→生成 task-UCS |
| `/simple:ucs-ws` | WS 通道用例规约 WS-UCS（仅后端）：识别通道 + grilling 逐通道探讨→生成 → docs/specs/ws-UCS/ |

### 执行落地

| 命令 | 说明 |
| --- | --- |
| `/simple:init-docs` | 初始化项目文档目录结构（docs/ 完整子目录树） |
| `/simple:do-directory` | 目录脚手架搭建（执行型）：读 standards 文档创建目录树 + 基础文件 |
| `/simple:do-db` | DB 初始化（仅后端，执行型）：按 specs/data 建库建表，禁 DROP、只建 spec 内的表 |
| `/simple:do-api` | 接口编码+测试（仅后端，执行型）：两阶段——先顺序 subagent 实现所有 UCS→编译通过，再顺序 subagent 写测试→更新测试脚本 |
| `/simple:do-grpc` | gRPC 服务编码+测试（仅后端，执行型）：两阶段——先顺序 subagent 实现所有 grpc-UCS→编译通过，再顺序 subagent 写测试→更新测试脚本 |
| `/simple:do-task` | 异步任务编码+测试（仅后端，执行型）：两阶段——先顺序 subagent 实现所有 task-UCS→编译通过，再顺序 subagent 写测试 |
| `/simple:do-ws` | WS 网关编码+测试（仅后端，执行型）：两阶段——先顺序 subagent 实现 UCS-ws→编译通过，再顺序 subagent 写测试 |
| `/simple:do-page` | 页面开发（仅写页面端，执行型）：盘点 page-UCS→顺序 subagent 按公约+demo+API 实现→编译通过 |

### 质量与部署

| 命令 | 说明 |
| --- | --- |
| `/simple:tdd` | 测试全绿修复：跑全量测试→逐失败修复（修代码不修测试）→重跑→直到全部通过 |
| `/simple:docker` | Docker 容器化部署：生成 Dockerfile/compose/readme-docker.md，覆盖日志/资源/卷/环境/DB 初始化 |

## 最佳实践顺序（按视角）

> 完整流水线见上方技能列表；按视角选择执行路径。命令前缀 `simple`。

### 0. 初始化（所有场景前置）

`init-docs` — 初始化项目文档目录结构（docs/ 完整子目录树）。

### 1. 单纯产品视角

只需 `demo` — 产品思考梳理 + 风格化页面 demo，产出 sense.md + HTML demo 即可。
如需把 demo 的设计沉淀为规范文档，追加 `specs-design` — 提取设计系统到 docs/specs/design/DESIGN.md。

### 2. 后端开发视角（完成 demo 后）

product-business → product-glossary → specs-db → specs-api → architecture → specs-data → standards-directory → standards-http → standards-tools →（如需）standards-task → do-directory → do-db → ucs-api →（如需）ucs-task → do-api →（如需）do-task → tdd → docker

> gRPC 后端：specs-api 选 gRPC 后，把 `ucs-api` → `ucs-grpc`、`do-api` → `do-grpc`。

### 3. 前端开发视角（完成 demo 后）

product-business → specs-design（提取设计系统）→ do-directory →（将后端 api 文档放入前端目录）→ ucs-page → do-page → 调通后让 AI 把 mock 切换为正式接口

### 4. 小程序

类似前端（复用前端开发视角的执行路径）。

### 5. 客户端

待实践。

## 开发

- 新增 skill：在 `skills/<skill-name>/SKILL.md` 写 frontmatter（`name`、`description`）+ 指令正文，并把路径加进 `.claude-plugin/plugin.json` 的 `skills` 数组。
- 校验清单：`claude plugin validate .`
- 发布：推到 GitHub 后 `claude plugin tag .` 打版本标签。
