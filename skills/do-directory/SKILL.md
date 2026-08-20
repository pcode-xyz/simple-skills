---
name: do-directory
description: 按 standards 产出的文档创建项目目录并搭建最基础脚手架（执行型，会在磁盘创建文件）。读 tech-stack-rule.md / directory-rule.md / tools-rule.md（后端另读 http-handler-rule.md）→ 确认目标目录与选择 → 创建目录树 + 基础文件（入口/依赖清单/配置/路由/工具层占位/示例 handler）。当用户要真正初始化项目骨架、创建代码目录时使用。
---

# do-directory

按 standards 产出的 spec 文档，创建项目目录结构并搭建最基础脚手架。**执行型 skill——会在磁盘上创建文件。**

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/standards/tech-stack-rule.md`（含"选型上下文"）、`docs/standards/directory-rule.md`（目录结构）。
- 建议存在：`docs/standards/tools-rule.md`（工具层）、`docs/product/business-flow.md`、`docs/specs/data/`（DB）、`docs/specs/API/`（取一个示例接口）；后端另建议 `docs/standards/http-handler-rule.md`（handler 流转）。
- 缺失必选项时，提示先运行对应 skill（architecture / standards-directory），结束。

## Step 1 — 读 spec 文档，提取"确定清单"

从 spec 文档提取**确定清单**（供 Step 3 使用，不许猜测、不留替代项）：
- `tech-stack-rule.md` 的"选型上下文"：**端**、**技术栈**、**后端架构风格**（仅后端）；以及**语言/框架/中间件的确切选型**。
- `directory-rule.md`：完整目录树、各目录职责、**入口/路由/配置文件的确切位置**。
- `tools-rule.md`：工具层各组件包的**确切包名与位置**。
- 后端读 `http-handler-rule.md`：handler 的**确切写法**。
- 从 `docs/specs/API/` 选一个示例接口，作示例 handler 的参照。

## Step 2 — 确认目标目录与选择

- **确认目标目录**（默认当前工作目录；用户可指定其他路径）。若目标目录已非空，列出将创建/可能冲突的文件，请用户确认后再动。
- 展示一行摘要（端 / 技术栈 / 架构风格），AskUserQuestion 确认"按以上生成脚手架"。
- **不覆盖任何已有文件**；冲突时询问用户（覆盖 / 跳过 / 换个位置）。

## Step 3 — 搭建脚手架

**一切以 Step 1 提取的"确定清单"为唯一依据，不引入 spec 之外的任何方案。**

按清单逐项执行，**每一项都要能在 spec 文档中找到确切出处**：

1. **入口**：按 tech-stack-rule.md 的语言/框架 + directory-rule.md 标注的位置创建**唯一入口**；spec 未指定入口位置时，**停下来问用户**，不自创。
2. **依赖清单**：按 tech-stack-rule.md 的确切选型创建（go.mod / package.json / pubspec.yaml 等），第三方库版本取 tech-stack-rule 记录的具体版本。
3. **配置**：按 tech-stack-rule.md 的配置方案创建 .env.example 与配置加载。
4. **路由**：按 directory-rule.md 标注的位置、http-handler-rule.md 标注的写法创建路由注册文件。
5. **工具层占位**：按 tools-rule.md 的确切包名/位置，为每个组件建包 + 空接口/初始化（不实现完整逻辑）。
6. **示例 handler/页面**：用示例接口、按 http-handler-rule（或对应端的流转约定）搭最小骨架，业务留 TODO。
7. **README**：启动方式、目录说明。

**防偏离约束**：
- 每个创建的目录/文件/库，必须能在 tech-stack-rule.md / directory-rule.md / tools-rule.md / http-handler-rule.md 中找到出处；**spec 未提到的，一律不创建**。
- spec 缺失或文档之间冲突时：**停下来问用户，不自行选择**。
- **不提供"或 xxx / 等"之类的替代方案**。
- 只在目标目录内创建；不覆盖已有文件（冲突时询问）。
- **不实现完整业务逻辑，只搭骨架**；业务留 TODO。
- 代码风格遵循该语言最佳实践。

## Step 4 — 完成后

- 报告：创建了哪些目录、哪些基础文件、示例接口用的哪一个。
- 提示下一步：可先跑通启动，或继续实现首个接口的完整逻辑（接 `standards-http` 的流转约定）。
