你是一位资深的代码审查工程师，请对项目做全库维度的静态审查。**只报告问题，不要修改任何代码。**

**审查范围只扫源码目录，排除 docs/ 目录（docs/ 为规格文档，不作为审查对象）；Step 1 静态工具也只在源码目录内跑。**

## 本次任务参数

- 技术选型：docs/standards/tech-stack-rule.md（语言 / 框架 / 静态检查命令）
- 目录结构：docs/standards/directory-rule.md
- 目标项目源码根目录（排除 docs/）

## Step 1 — 先跑静态工具（确定性证据）

按 tech-stack-rule 可用的静态检查命令，至少跑：
- lint / vet（未使用变量、导入、可疑代码）
- 环依赖检测（Go import cycle / JS dependency-cruiser 或 madge / Python import-linter 等）
- 竞态检测（若语言支持，如 Go -race）
- 文件行数扫描（wc -l 或等价命令，列出超过 300 行的源文件，排除 docs 目录，供 Step 2「文件过大」核对）
收集工具输出作为证据。

## Step 2 — 人工复核 + 补充

1. 环调用：包 import 环 / 模块互相依赖（A→B→A）/ 构造器 DI 环 / 可疑递归调用 / 前端组件循环依赖
2. 孤儿代码：unused 导出符号（全库无调用）/ 死文件（无任何 import）/ 不可达分支 / 被绕过的中间件（注册但未挂路由）
3. 硬编码敏感信息：密钥 / token / 密码 / DB 连接串 / localhost 与内网 IP 硬编码
4. 文件过大：单个源文件超过 300 行（排除 docs 目录 / 自动生成 / 纯数据 / 配置文件）——可读性与维护性显著下降，应拆分（对 Step 1 行数扫描结果复核确认）

## 输出（两步，按顺序执行；不要省略任何一步）

1. **写存档文件**：把每条发现按固定格式逐行写入 docs/review/raw/global.md（先 mkdir -p docs/review/raw）：
   `[P0|P1|P2|P3] <文件>:<行号> — <问题简述> — <为什么是问题> — <修复建议>`
   严重度：P0=安全漏洞/数据损坏；P1=明显 bug/性能问题/契约漂移；P2=代码质量；P3=风格（可选）。
   文件级问题（无具体行号，如「文件过大」）行号留空。
2. **返回结构化发现**：调用 StructuredOutput，把与文件内容**一致**的发现列表作为 `source`（= `global`）对应 `findings` 返回。每条含：`severity`（P0-P3）、`file`、`line`（整数；无行号填 0）、`desc`（简述）、`reason`（为什么是问题）、`suggestion`（修复建议）、`uncertain`（仅存疑才 true，确定不填）。**不要**在文本返回里贴发现全文。
