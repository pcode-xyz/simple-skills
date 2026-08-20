---
name: db
description: 数据库设计。基于 docs/product/business-flow.md 业务描述、docs/product/demo/ 页面、docs/product/glossary.md 字段英文名，先让用户选择 DB 类型（你来推荐），再按所选 DB 生成数据设计，默认 MySQL 输出 docs/specs/data/table.sql。当用户要做数据库设计、建表、schema 设计时使用。
---

# db

数据库设计：根据业务描述与原型稿设计数据层，输出建库脚本/结构。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/business-flow.md`、`docs/product/demo/`（≥1 个 HTML 页面）。
- 建议存在：`docs/product/glossary.md`（字段名优先用其中的英文；缺失则用合理英文名并提醒用户）。
- 缺失必选项时，提示先运行对应 skill（business-flow / demo / glossary），然后结束，不空跑。

## Step 1 — 选 DB 类型（你来推荐）

先读 `docs/product/sense.md`、`docs/product/business-flow.md`，了解产品形态与数据特征。用 AskUserQuestion 让用户选择 DB，**给出你的推荐理由**，把推荐项放在首位：

| DB | 适合场景 | 推荐倾向 |
| --- | --- | --- |
| MySQL | 常见业务系统、关系模型、需要事务与通用生态 | 默认推荐 |
| SQLite | 简单/单机/原型/嵌入式，文件即库 | 轻量场景推荐 |
| PostgreSQL | 复杂查询、高并发、JSON/地理等高级特性 | 有需要时 |
| MongoDB | 文档型、schema 灵活、内容类产品 | 视数据特征 |

选项包含"其他（自定义）"。若用户难以决定，按产品数据特征推荐一个并说明理由。

## Step 2 — 按所选 DB 生成数据设计

读 `docs/product/business-flow.md` 的业务描述 + `docs/product/demo/` 页面 + `docs/product/glossary.md`（字段英文名优先），按所选 DB 语法输出。

- 输出目录：`mkdir -p docs/specs/data`。
- 目标文件已存在时，问用户：覆盖 / 备份后替换 / 另存。

### MySQL 模板（默认，9 条硬性要求）

根据 business-flow.md 业务描述，阅读 demo 里的页面，实现数据库设计（字段名优先使用 glossary.md 里的英文），必须使用标准 MySQL 支持的语法，输出至 `docs/specs/data/table.sql`，遵循：

1. **禁用保留字**：表名、字段名不能是 MySQL 保留字。
2. **不用外键**：不使用 FOREIGN KEY。
3. **自增 ID 主键**：除关联表外，尽量用 `id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`；关联表用联合主键。
4. **字符集 utf8mb4**：表与库统一 `DEFAULT CHARSET=utf8mb4`。
5. **注释清晰**：表注释、字段注释都用 `COMMENT`。
6. **枚举用 varchar**：枚举值用 `VARCHAR` 并定义好长度。
7. **int/bigint 定义长度且非负**：如 `INT(11)`/`BIGINT(20)`，使用 `UNSIGNED`。
8. **尽量不用 NULL**：用 `NOT NULL` + 默认值（空串/0）。
9. **不用 ON UPDATE**：不使用 `ON UPDATE CURRENT_TIMESTAMP` 等类似功能。

### 其他 DB 适配（基于上面要求"看着改"）

- **SQLite**：`INTEGER PRIMARY KEY AUTOINCREMENT`；无 UNSIGNED（非负用 `CHECK(col >= 0)` 或应用层保证）；无 utf8mb4（SQLite 原生 UTF-8，忽略第 4 条）；TEXT/VARCHAR 均可；其余要求同 MySQL（禁保留字、无外键、注释、枚举 varchar、少 NULL、无 ON UPDATE）。仍输出 `docs/specs/data/table.sql`。
- **PostgreSQL**：自增用 `BIGSERIAL`/`IDENTITY`；PG 无 UNSIGNED——非负数用 `CHECK(col >= 0)`；无 ON UPDATE；其余同 MySQL。仍输出 `docs/specs/data/table.sql`。
- **MongoDB**：文档模型，无建表 SQL。输出 `docs/specs/data/schema.json`（collections + 字段名/类型/说明，用 glossary 英文名），附集合设计说明。同样做到：命名避开保留字、尽量少 NULL、说明清晰。

## 完成后

- 报告输出文件路径、表（或集合）清单。
- 提示可对照 business-flow.md 的"关键追溯点（足迹锚点）"检查核心数据锚点是否都已覆盖。
