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

| 命令 | 说明 |
| --- | --- |
| `/simple:init-docs` | 初始化项目文档目录结构（docs/ 完整子目录树） |
| `/simple:demo` | 产品思考梳理 + 风格化页面 demo（sense.md + HTML demo） |
| `/simple:product-business` | 基于 sense.md + demo 原型稿，用四色建模法梳理业务流程（business-flow.md） |
| `/simple:product-glossary` | 统一语言词汇表：business-flow → glossary.md，subagent 逐页对比 demo，分歧/缺失处理 |
| `/simple:specs-db` | 数据库设计：选 DB 类型（推荐），MySQL 9 条规范生成 table.sql，其他 DB 适配 |
| `/simple:specs-api` | 接口定义：选 HTTP(OpenAPI3.0 → docs/specs/API/) / gRPC(proto3 → docs/specs/grpc/)；HTTP 再选标准 RESTful 或只用 GET/POST；顺序 subagent 逐页生成，按模块合并 |
| `/simple:architecture` | 技术选型：选端→选技术栈（带推荐）→后端定架构→构造选型 prompt 输出 tech-stack-rule/draft |
| `/simple:standards-directory` | 目录结构设计：读 architecture 选型→按架构风格选模板（DDD/扁平切片/MVC/OOP）→输出 directory-rule/draft |
| `/simple:standards-http` | HTTP handler 请求流转说明（仅后端）：按架构风格选模板，输出 http-handler-rule/draft |

## 开发

- 新增 skill：在 `skills/<skill-name>/SKILL.md` 写 frontmatter（`name`、`description`）+ 指令正文，并把路径加进 `.claude-plugin/plugin.json` 的 `skills` 数组。
- 校验清单：`claude plugin validate .`
- 发布：推到 GitHub 后 `claude plugin tag .` 打版本标签。
