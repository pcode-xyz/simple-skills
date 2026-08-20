---
name: doc-init
description: 初始化项目极简文档结构（创建 docs/README.md 导航首页）。当项目没有 docs 目录、或用户说"初始化文档/建文档目录/开始记文档"时使用。
---

# doc-init

在目标目录初始化一份极简文档结构。最小可用，不做推测性扩展。

## 目标目录

- 默认：当前工作目录（项目根）。
- 若用户给了路径参数（如 `/simple:doc-init /path/to/project`），用用户给的路径。

## 执行步骤

1. 若 `docs/README.md` 已存在：**不改动**，向用户说明它已存在，结束。
2. 若 `docs/` 不存在：创建 `docs/README.md`（目录随文件自动创建）。
3. 若 `docs/` 存在但缺 `README.md`：只补 `README.md`，不动 docs/ 下其他任何文件。
4. **不**创建任何空子目录或 `.gitkeep` 占位文件——极简版里 `README.md` 本身足以让目录被 git 跟踪。

## README.md 模板

按当前项目实际情况填充：项目名、一句话简介。模板如下（内容略作适配即可）：

    # <项目名> 文档

    <一句话介绍这个项目是做什么的>

    文档索引：项目入口见根目录 [README](../README.md)。

若项目根目录没有 README，把导航链接那行去掉即可。

## 完成后

- 向用户报告创建（或跳过）的文件清单。
- 不要顺手创建 architecture / decisions / guides 等目录；用户需要扩展时再单独提。
