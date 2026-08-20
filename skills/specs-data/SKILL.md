---
name: specs-data
description: 数据结构定义（仅后端）。基于 API 接口描述 + DB 设计 + 技术选型，从数据可靠性角度识别"必须显式封装"的数据结构（DB JSON 字段、跨接口共享复杂结构、嵌套对象、载荷、外部服务契约、共享值对象），输出结构定义到 docs/specs/data/struct.md。当用户要做数据结构定义、共享类型、防止各端实现漂移时使用。
---

# specs-data

数据结构定义：从数据可靠性角度，把必须显式封装的数据结构定义出来，输出 `docs/specs/data/struct.md`。**仅后端适用。**

> 分析型 skill——主流程读 spec、分析、确认后直接落盘，无需 subagent。

## 前置依赖（先检查，缺失就停）

- **仅后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 ≠ 后端**，提示此 skill 只服务后端，结束。
- 必须存在：`docs/standards/tech-stack-rule.md`（语言/序列化方式）、`docs/specs/data/`（DB 设计，table.sql 或 schema.json）、`docs/specs/API/`（接口描述）。
- 建议存在：`docs/specs/ws/` 与 `docs/specs/grpc/`（其他通道契约）、相关 `docs/specs/UCS/`、`docs/specs/task-UCS/`（载荷结构）、`docs/specs/data/struct.md`（已存在则增量合并）。
- 缺失必选项时，提示先运行对应 skill（specs-api / specs-db / specs-ws），结束。

## 模板文件（本 skill 自带）

- `templates/struct-template.md` → struct.md 生成模板（Glob 定位，不硬编码缓存路径）

## Step 1 — 读 spec，识别候选结构

- `tech-stack-rule.md`：语言、序列化方式（Go struct + json tag / TS interface 等）。
- `docs/specs/data/`：表/字段，**特别标出 JSON / 无 schema 约束的字段**。
- `docs/specs/API/`、`docs/specs/ws/`、`docs/specs/grpc/`：请求/响应/帧结构。
- `docs/specs/task-UCS/`：队列载荷结构。
- 按以下**可靠性维度**识别候选（`templates/struct-template.md` 的分类）：
  1. **DB JSON 字段**：DB 列类型为 JSON、无 schema 约束
  2. **跨接口/跨端共享结构**：同一结构出现在多个接口或多个端（HTTP/WS/任务）
  3. **复杂嵌套对象**：单接口内也复杂的嵌套体（数组/多层/条件字段）
  4. **载荷结构**：队列 payload、WS 帧、缓存条目、中间件 context 载体
  5. **外部服务契约**：LLM/第三方 API 的请求/响应结构
  6. **共享值对象**：枚举、状态、复合键

## Step 2 — 呈现候选清单，确认范围

- 向用户呈现识别到的候选结构清单（按 6 类分组，注明来源/使用处）。
- 用 AskUserQuestion 确认：哪些定义、哪些合并、哪些不做（一次性简单字段不做）。

## Step 3 — 生成 struct.md（主流程直接落盘）

- 按 `templates/struct-template.md` 组织 `docs/specs/data/struct.md`：
  - 每类结构：清单表 + 每个结构详情（类型声明、字段:类型/必填/约束/示例、来源、使用处）
  - 枚举列出全部取值
  - 字段与 DB / 接口保持一致；冲突以接口契约为准并标注
- 若已存在则先读再增量合并/询问：覆盖 / 备份后替换 / 跳过。
- 字段对齐：DB 字段来自 `docs/specs/data/`，接口字段来自 `docs/specs/API/` 等。

## 完成后

- 报告：定义了哪些结构（按 6 类分组）、跳过了哪些候选。
- 提示下一步：运行 `architecture` 技术选型（struct.md 供 do-* 模型引用，保证各端一致）。
