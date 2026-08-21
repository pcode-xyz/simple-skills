---
name: do-db
description: 数据库初始化（仅后端，执行型，会真实连接并建库建表）。读 tech-stack-rule.md（DB 类型/ORM）+ docs/specs/data/ 的 DB 设计文件，确认连接参数与安全策略后创建库/表/集合。防偏离：只建 spec 里的表、绝不 DROP/覆盖。当用户要真正创建数据库、跑迁移、初始化表结构时使用。
disable-model-invocation: true
---

# do-db

数据库初始化：按 `docs/specs/data/` 的 DB 设计文件创建库与表/集合。**执行型 skill——会真实连接数据库并写入。仅后端适用。**

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/standards/tech-stack-rule.md`（DB 类型、ORM、配置方案）、`docs/specs/data/` 下的 DB 设计文件（`table.sql` 或 `schema.json`）。
- 建议存在：`docs/standards/directory-rule.md`（代码侧 DB 相关目录）、`docs/product/business-flow.md`。
- 缺失必选项时，提示先运行对应 skill（specs-db / architecture），结束。

## Step 1 — 读 spec 文档，提取"确定清单"

- `tech-stack-rule.md`：**DB 类型**（MySQL / SQLite / PostgreSQL / MongoDB）、**ORM/迁移方案**（GORM / ent / sqlx / golang-migrate / 原生 SQL 等）、配置方案。
- `docs/specs/data/` 下的 DB 设计文件：
  - `table.sql` → 确切的库名/表/字段/类型/索引（按所选 DB 方言）；
  - `schema.json` → 确切的 collections 与字段结构。
- 提取清单：要创建的库名、表（或集合）清单、每张表的字段定义。**清单只来自 spec，不许自行增删。**

## Step 2 — 确认连接与安全策略

- **确认连接参数**：host / port / 用户名 / 密码 / 库名（或读取已配置的 .env；本地 SQLite 则确认目标文件路径）。
- 展示摘要（端=后端 / DB 类型 / ORM / 目标库），AskUserQuestion 确认后执行。
- **安全策略（必须遵守）**：
  - **绝不执行 DROP DATABASE / DROP TABLE / TRUNCATE / DELETE** 等破坏性语句；
  - 若目标库已存在同名表/集合，**不覆盖、不重建**——列出已存在的，AskUserQuestion：仅补缺失 / 跳过全部 / 结束；
  - 默认只在空库或缺失对象时创建。

## Step 3 — 执行初始化

按 Step 1 的确定清单 + Step 2 的确认结果执行，**每张表/集合必须能在 spec 文件中找到出处**：

- **建库/建集合**：MySQL/PG 创建 database（UTF8）；MongoDB 按 schema.json 创建 collections。
- **建表/迁移**：按 tech-stack-rule.md 的 ORM/迁移方案——GORM AutoMigrate / ent migrate / golang-migrate / 直接执行 table.sql（按所选 DB 方言，遵守 specs-db 的 9 条规范：utf8mb4、无外键、自增主键等）。
- **最小 seed（可选）**：若用户要求，仅插入 spec/示例数据（如基础枚举、示例用户），不做业务造数。
- **校验**：列出最终创建/已存在的表或集合清单，与 spec 对比确认无遗漏、无多余。

**约束**：
- 每个表/集合/字段必须能在 `docs/specs/data/` 文件中找到出处；**spec 未提到的，一律不创建**。
- spec 缺失或与 tech-stack-rule 冲突时：**停下来问用户，不自行选择**。
- 不提供"或 xxx / 等"的替代方案。
- 只做初始化，不实现业务逻辑、不写业务种子数据（除非用户明确要求）。

## Step 4 — 完成后

- 报告：连接的库、创建的表/集合清单、跳过了哪些已存在对象、迁移方案。
- 提示下一步：`do-directory` 已在前面完成骨架搭建——随后运行 `ucs-api` 生成接口用例规约，再 `do-api` 实现接口（把 `tools-rule.md` 的 db 工具组件连上库）。
