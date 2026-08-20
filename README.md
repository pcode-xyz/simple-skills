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

安装后命令前缀为 `simple`，例如 `/simple:doc-init`。

## 技能列表

| 命令 | 说明 |
| --- | --- |
| `/simple:doc-init` | 初始化项目极简文档结构（docs/README.md） |

## 开发

- 新增 skill：在 `skills/<skill-name>/SKILL.md` 写 frontmatter（`name`、`description`）+ 指令正文，并把路径加进 `.claude-plugin/plugin.json` 的 `skills` 数组。
- 校验清单：`claude plugin validate .`
- 发布：推到 GitHub 后 `claude plugin tag .` 打版本标签。
