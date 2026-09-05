---
name: specs-design
description: 设计元素提取。按 design.md 规范（Google Labs 设计系统描述格式），从 docs/product/demo 的页面与共享样式（独立 CSS 或页面内联 style）设计令牌中提取设计元素（色板/字体/字号/间距/圆角/阴影/组件），输出 DESIGN.md 到 docs/specs/design/。当用户要做设计系统提取、设计规范文档、DESIGN.md、design tokens 抽取时使用。
disable-model-invocation: true
---

# specs-design

设计元素提取：从 demo 页面与 css 设计令牌中，按 design.md 规范生成设计系统文档（DESIGN.md），输出到 `docs/specs/design/`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/demo/`（≥1 个 HTML 页面）。
- 共享样式来源：`docs/product/demo/` 下的独立 CSS 文件（`css/style.css` 或与页面同级，**Glob 定位**）；若无独立 CSS 文件，样式内联在各页面 `<style>` 中（按内联提取令牌与共享类）。
- 建议存在：`docs/product/sense.md`（Overview 的品牌人格/受众/情绪参考）、`docs/product/business-flow.md`。
- 缺失必选项时，提示先运行 `demo` 生成 demo 页面，结束。

## 参考规范（design.md）

三份源文档已备份到本 skill 的 `refs/` 目录。需要参考原始文档时，**优先读远端**（WebFetch/curl），**远端读不到就从本地 `refs/` 读**，避免网络问题导致流程中断：

- 说明：https://github.com/google-labs-code/design.md/blob/main/README.md ↔ `refs/design-md-readme.md`（Glob 定位 `**/skills/specs-design/refs/design-md-readme.md`）
- 格式规范：https://github.com/google-labs-code/design.md/blob/main/docs/spec.md ↔ `refs/design-md-spec.md`
- 示例：https://github.com/google-labs-code/design.md/blob/main/examples/atmospheric-glass/DESIGN.md ↔ `refs/design-md-example.md`
- 本 skill 的 `templates/design-md-prompt.md` 已内嵌规范全部要点，subagent prompt 用它即可，无需联网。

## 模板文件（本 skill 自带）

- `templates/design-md-prompt.md` → DESIGN.md 生成 prompt（Glob 定位 `**/skills/specs-design/templates/design-md-prompt.md`，不硬编码缓存路径）

## Step 1 — 读 demo，识别设计元素

- **定位共享样式来源**：Glob `docs/product/demo/**/*.css`；有独立 CSS → 读之（`:root` 设计令牌与共享组件类）；无独立 CSS → 样式内联在各页 `<style>`，主流程向 subagent 注入"内联"标记。
- 列出 `docs/product/demo/` 下所有页面 HTML，**报告总数**。
- 读 `docs/product/sense.md`：品牌人格、目标受众、情绪基调（Overview 参考）。

## Step 2 — 确认生成方式（AskUserQuestion）

- **单一 DESIGN.md**（推荐）：全站一套设计系统 → `docs/specs/design/DESIGN.md`。适合共享令牌集中在独立 CSS（或统一内联）的 demo。
- **每页一份**：每页一个 → `docs/specs/design/DESIGN-<页面>.md`（<页面> 为去掉 .html 的文件名）。适合各页风格差异大的 demo。

## Step 3 — 按所选方式生成

### 3A. 单一 DESIGN.md（一个 subagent 直接落盘）

- 起一个 subagent 生成整套设计系统文档；prompt 必须**自包含**（用 `templates/design-md-prompt.md`，Glob 定位）：
  1. **要读的文件**：共享样式来源（独立 CSS 路径，主流程注入；若为内联样式则从各页 `<style>` 提取）、`docs/product/demo/` 下全部页面 HTML、`docs/product/sense.md`。
  2. **生成要求**：按模板产出完整 DESIGN.md——frontmatter（colors/typography/rounded/spacing/components）＋ 正文相关节（Overview/Colors/Typography/Layout/Elevation & Depth/Shapes/Components/Do's and Don'ts，按序）；令牌从共享样式（独立 CSS 或内联）提取、组件从页面提取、中文 prose、令牌与 prose 对应。
  3. **直接写入**：`docs/specs/design/DESIGN.md`（先 `mkdir -p docs/specs/design`）；写完报告写入路径与文件大小。
- 若 demo 页面过多（超过一个 subagent 上下文），提示改用 3B 每页模式。

### 3B. 每页一份（Workflow 逐页并行）

- **闸门前置**：为每个待处理页面检查 `docs/specs/design/DESIGN-<页面>.md` 是否已存在：已存在 → AskUserQuestion（覆盖 / 备份后替换 / 跳过，备份由主进程做），得 `actions`（{页面: gen|skip}）。
- **收集 args**：`pages`（去 `.html`）、`demoDir`（`docs/product/demo`）、`cssPath`（Glob 定位到的独立 CSS 路径；无独立 CSS 则省略走内联标记）、`senseMd`（`docs/product/sense.md`）、`outDir`（`docs/specs/design`）、`templates`（Read `**/skills/specs-design/templates/design-md-prompt.md` 内容字符串）。
- **启动 Workflow**：Glob `**/skills/specs-design/scripts/specs-design.workflow.js` 得绝对路径；调用 `Workflow({ scriptPath, args })`（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）；等待 task-notification（可用 `/workflows` 观察进度）。
- **通知到达后**：抽查各页 DESIGN 文件已写、frontmatter 合法（`---` 围栏、colors/typography/rounded/spacing/components 结构正确）、正文必需节顺序正确（不轻信返回）；报告生成 / 跳过 / 覆盖清单。

## 完成后

- 提示下一步：前端视角运行 `/simple:ucs-page` → `/simple:do-page`（页面实现可引用本设计系统）；如需调整风格，迭代 `/simple:demo`。
