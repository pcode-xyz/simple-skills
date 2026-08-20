---
name: init-docs
description: 初始化项目文档目录结构（按预定义模板创建 docs/ 下的完整子目录树），并在 docs/standards/ 创建 CLAUDE.md（约束层维护规范）。当项目没有 docs 目录、或用户说"初始化文档/建文档目录/开始记文档"时使用。
---

# init-docs

在项目根目录初始化预定义的文档目录结构，并放入 `docs/standards/CLAUDE.md`（约束层维护规范模板）。幂等：只创建缺失的目录与模板文件，**绝不**删除、重命名或改动任何已有内容。

## 目标目录

- 默认：当前工作目录（项目根）。
- 若用户给了路径参数（如 `/simple:init-docs /path/to/project`），用用户给的路径。

## 目录结构（按此模板创建）

    docs/
    ├── misc/           与项目开发无关的文档
    ├── plans/          Claude Code 的 plan 生成文档存储目录
    ├── product/        产品原型相关文档
    ├── specs/
    │   ├── API/        接口协议文档
    │   ├── ws/         WS 协议文档
    │   ├── data/       数据结构及 DB 设计协议
    │   ├── API-UCS/    接口描述用户规约
    │   ├── ws-UCS/     WS 协议描述用户规约
    │   ├── task-UCS/   异步任务描述用户规约
    │   └── tools-UCS/  工具层描述用户规约
    ├── standards/      技术架构文档（约束层）
    ├── templates/      项目参考模板
    └── prompt/         项目特有提示词

## 模板文件（本 skill 自带）

本 skill 目录下放有模板文件，运行时读取使用：

- `templates/standards-claude.md` → `docs/standards/CLAUDE.md` 的内容

定位方式：本 SKILL.md 同级的 `templates/standards-claude.md`。**不要硬编码路径**（插件缓存路径带版本号），用 Glob 搜索 `**/skills/init-docs/templates/standards-claude.md` 找到后读取。

## 执行步骤

1. 用 `mkdir -p` 递归创建上述所有目录（幂等，已存在的跳过）。
2. 不删除、不重命名、不移动任何已有文件或目录；`docs/` 下若已有其他内容，原样保留。
3. 创建 `docs/standards/CLAUDE.md`：
   - 已存在则跳过（不覆盖用户改动）；
   - 不存在则用 Read 读取模板 `templates/standards-claude.md` 的内容，原样写入 `docs/standards/CLAUDE.md`。

## 完成后

向用户报告：新创建了哪些目录、哪些目录已存在被跳过、`docs/standards/CLAUDE.md` 是创建还是跳过。
