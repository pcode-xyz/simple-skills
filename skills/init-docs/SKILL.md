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

## 执行步骤

1. 用 `mkdir -p` 递归创建上述所有目录（幂等，已存在的跳过）。
2. 不删除、不重命名、不移动任何已有文件或目录；`docs/` 下若已有其他内容，原样保留。
3. 创建 `docs/standards/CLAUDE.md`（约束层维护规范模板）：
   - 已存在则跳过（不覆盖用户改动）；
   - 不存在则按下方"CLAUDE.md 模板"创建。

## CLAUDE.md 模板（docs/standards/CLAUDE.md 的内容）

    # 约束层维护规范

    > 本目录存放项目所有**架构约束**，是 AI 编码时的执行依据。

    ---

    ## 一、文件命名约定

    | 后缀 | 含义 | 谁读 | 示例 |
    |-----|------|------|------|
    | `-rule.md` | **直接照做**的约束 | AI 默认读取，作为执行依据 | `tech-stack-rule.md` |
    | `-draft.md` | **完整分析**（方案对比、决策理由） | 仅在追溯决策时人工阅读，AI 默认不读 | `tech-stack-draft.md` |

    **规则**：
    - 一份约束 = 一个 `-rule.md` + 可选的 `-draft.md`
    - `-draft.md` 与 `-rule.md` 同名对齐，便于对照
    - 无分析草稿的约束，可只有 `-rule.md`

    ## 二、当前约束清单

    | 文件 | 覆盖范围 |
    |-----|---------|
    | - | - |

    ## 三、如何新增一条约束

    1. 在 `docs/standards/` 下新建 `<topic>-rule.md`
    2. 如有完整分析过程，同步新建 `<topic>-draft.md`
    3. 在根 `CLAUDE.md` 的「规范文档引用」表中补上条目
    4. 更新本文件第二节"当前约束清单"

    ## 四、如何修改一条约束

    - **直接改** `-rule.md`，保持与 draft 的结论一致（draft 一般不改）
    - 如涉及重大决策变更，更新对应的 `-draft.md` 记录变更理由

    ## 五、与模板层的关系

    - 本目录约束**必须怎么做**
    - `docs/templates/` 提供**抄哪个样板**
    - 约束中可引用模板（如"Handler 写法参考 templates/handler-template.md"）

## 完成后

向用户报告：新创建了哪些目录、哪些目录已存在被跳过、`docs/standards/CLAUDE.md` 是创建还是跳过。
