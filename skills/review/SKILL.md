---
name: review
description: 代码质量审查（只报告，不改代码）。主流程只做编排：读 tech-stack-rule 确认语言/框架/静态检查命令 → 接口维度按 docs/specs/API（或 grpc）并行逐个接口 subagent 审（DB 效率/安全/错误处理/事务/幂等/契约漂移与实现遗漏）+ 全库维度 subagent 跑静态工具并审环调用/孤儿代码/硬编码敏感信息（两者并行）→ 汇总 subagent 去重分级写 docs/review/issues.md → 对话报告 P0。当用户要做代码 review、代码质量审查、找明显问题、安全/性能/环依赖排查时使用。
disable-model-invocation: true
---

# review

代码质量审查：发现代码里的**明显问题**，输出带严重度的结构化问题清单。**只报告，不改代码**——修复由用户确认后再单独进行。

> **主流程只做编排，不读业务代码**（避免上下文超限）；代码审读由各 subagent 自行完成。
> **审查范围只覆盖源码，排除 `docs/` 目录**：docs/ 为规格文档（接口定义 / struct / UCS），只作参考读取，**不作为审查对象**——不扫描、不报 docs 内问题（所有检查均适用）。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/standards/tech-stack-rule.md`（语言/框架/ORM/校验库/静态检查命令）、项目已实现代码（`do-api` / `do-task` / `do-page` 等产出）。
- **接口定义目录按协议分支**（HTTP 与 gRPC 互斥，只审其一）：
  - 存在 `docs/specs/API/` → 接口定义目录 = `docs/specs/API/`；
  - 存在 `docs/specs/grpc/` → 接口定义目录 = `docs/specs/grpc/`；
  - 两者皆无 → 接口清单退化：从代码路由发现，并提示接口维度契约核对受限。
- 建议存在：`docs/specs/API-UCS/`（接口用例，边界参考）、`docs/specs/data/`（struct.md）、`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 读 spec，确认方法与清单

- `tech-stack-rule.md`：语言、框架、ORM、校验库、静态检查命令（lint / vet / unused / import-cycle / race 等）。
- 接口清单：按协议分支解析接口定义目录，列出接口总数。
- 确认目标项目根（默认当前工作目录）。

## Step 2 — 接口 + 全库维度并行审查（subagent 各自写独立 raw 文件）

接口维度与全库维度**互不依赖、只读、各写独立的 raw 文件**，可**并行发起**：

- **接口维度**（每接口一个 subagent，`templates/review-interface-prompt.md`）：按接口清单**并行发起**多个 subagent，同时审多个接口。每个 subagent 读：该接口定义（HTTP yaml / gRPC proto）+ 对应 API-UCS（存在才读）+ 该接口 handler/实现代码（按 directory-rule 定位）+ tech-stack-rule（ORM/框架/校验库）+ docs/specs/data/struct.md（存在才读）。审（明显的才报）：
  1. **DB 效率**：N+1（for 循环内查 DB）/ 缺索引 / 无分页 / 批量逐条 / 重复查询无缓存 / 复杂 JOIN / 事务内慢查询 / Raw SQL 拼接
  2. **安全**：参数校验（长度/空值/格式/枚举白名单）/ 注入（SQL/XSS/命令/路径穿越/SSRF）/ 登录态校验 / 所属权校验（IDOR）/ CORS 限流上传 / 敏感信息落日志
  3. **错误处理与事务**：吞错 / 错误不分业务码 / DB 错裸抛 500 / 多写不包事务 / 失败无回滚
  4. **幂等与并发**：重复提交无幂等键 / 共享状态无锁 / 资源生命周期泄漏 / 无超时控制
  5. **契约漂移与遗漏**：返回字段与接口定义/struct.md 不一致；该接口定义但实现缺失 / 找不到对应 handler
  - 写 `docs/review/raw/interface-<接口>.md`（每问题一行，格式见模板），报告该接口问题数。
- **全库维度**（1 个 subagent，`templates/review-global-prompt.md`）：与接口维度**并行发起**。先跑静态工具（按 tech-stack-rule 可用命令，确定性收集证据），再人工审：环调用（包 import 环 / 模块互相依赖 / 构造器 DI 环 / 可疑递归 / 前端组件环）、孤儿代码（unused 符号/导入 / 死文件 / 不可达分支 / 失效中间件）、硬编码敏感信息（密钥/token/密码 / localhost 内网 IP）、文件过大（单源文件超过 300 行，排除 docs 目录 / 自动生成 / 纯数据 / 配置）。写 `docs/review/raw/global.md`，报告问题数。

主流程轻量校验每个返回的 subagent：确认 raw 文件已写、报告了问题数。

> **为什么可并行**：review 只读不改代码，每个 subagent 只写自己独立的 raw 文件（`interface-<接口>.md` / `global.md`），无共享写冲突——与 do-* 的「顺序执行防共享文件冲突」约束不同，这里并行安全。

## Step 3 — 汇总分级（等全部 raw 就绪后，1 个 subagent，review-merge-prompt）

**Step 2 的全部 subagent 完成后**再起（汇总需读全部 raw 文件，是并行批的汇聚点）。用 `templates/review-merge-prompt.md`：
- 读 `docs/review/raw/*.md` 全部 + tech-stack-rule（判断严重度/误报）；
- **去重**（同根因跨接口合并）→ **复核分级**（P0 阻断 / P1 高 / P2 中 / P3 低）→ 按严重度组织写入 `docs/review/issues.md`（**全量**）；
- **返回摘要**：各严重度数量 + **P0 明细清单**（文件:行号 + 简述）。

主流程（汇总 subagent 返回后）：删除 `docs/review/raw/` 目录。

## 完成后

- 报告：审查了哪些接口 / 维度、各严重度问题数、**P0 明细（对话呈现）**、`docs/review/issues.md` 路径。
- 提示：issues.md 为全量分级清单，P0 需优先处理；确认后可按清单逐项修复（review 本身不改代码）。
