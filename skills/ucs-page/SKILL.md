---
name: ucs-page
description: 页面用例规约（Page UCS，仅写页面的端适用）。盘点 docs/product/demo 的页面生成编号任务清单，逐任务顺序 subagent：读该页面 HTML + docs/specs/API 接口 + page-ucs-template.md（组件库从 tech-stack-rule 取值），生成页面公约直接写入 docs/specs/page-UCS/<页面>.md。当用户要做页面公约、页面用例规约、页面组件与交互设计时使用。
---

# ucs-page

页面用例规约：根据 demo 页面 + 接口明细，生成每个页面的页面公约（URL / 数据源 / 组件树 / 组件调整 / 交互流）。**仅需要写页面的端适用**（前端 / App / 桌面端 / 小程序）。

## 前置依赖（先检查，缺失就停）

- **非后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 = 后端**，提示此 skill 只服务写页面的端，结束。
- 必须存在：`docs/product/demo/`（≥1 个页面 HTML）、`docs/specs/API/`（接口明细）、`docs/standards/tech-stack-rule.md`（含组件库选型）。
- 建议存在：`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`、`docs/product/business-flow.md`。
- 缺失必选项时，提示先运行对应 skill，结束。

## 模板文件（本 skill 自带）

- `templates/page-ucs-template.md` → 页面公约模板（Glob 定位 `**/skills/ucs-page/templates/page-ucs-template.md`，不硬编码缓存路径）
- 模板中的 `{组件库}` 占位 → 从 tech-stack-rule.md 的选型取值替换（如 Element Plus / Ant Design / TDesign / uni-ui / 自定义组件）

## Step 1 — 读 spec 提取确定清单

- `tech-stack-rule.md`：**端**、**组件库**（模板 `{组件库}` 的取值）、技术栈。
- `directory-rule.md`：组件/页面目录、通用组件位置。
- `tools-rule.md`：页面如何调用请求工具（数据源引用）。
- `docs/specs/API/`：接口明细（数据源引用）。

## Step 2 — 盘点页面，生成任务清单

- 列出 `docs/product/demo/` 下所有页面 HTML，**报告总数**。
- 用 AskUserQuestion 请用户**排除与页面无关的文档**（如 index.html 对比壳页、纯样式试水页）。
- 为每个待处理页面生成一个编号任务：`任务N：<页面>.html → docs/specs/page-UCS/<页面>.md`，得到**任务清单**。

## Step 3 — 逐任务顺序执行（每个任务一个 subagent，直接落盘）

按任务清单**顺序**逐一执行：每起一个 subagent 处理一个任务；该任务完成并校验通过后，再处理下一个。**不要并行、不要跳跃。** 每个任务产出独立文件，由 **subagent 直接写入**。

主流程在起 subagent **前**先检查目标文件是否已存在：
- 已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

每个 subagent 的 prompt 必须**自包含**：
1. **要读的文件**：该页面 HTML（`docs/product/demo/<页面>.html`）、页面公约模板（Glob 定位 `templates/page-ucs-template.md`）、相关接口 yaml（`docs/specs/API/` 下与页面数据相关的）、`docs/standards/tech-stack-rule.md`（组件库）。
2. **生成要求**：
   - **使用中文**；
   - 严格按 `templates/page-ucs-template.md` 结构逐节填写（URL / 数据源 / 组件树 / 组件调整 / 交互流）；
   - **组件库以 tech-stack-rule 选择的为准**，替换模板 `{组件库}` 占位；不用库外组件名；
   - 数据源接口名/路径以 `docs/specs/API` 为准；字段对齐；
   - 交互流覆盖：页面加载（骨架屏、并行/条件请求）、主操作（确认弹窗、调用、成功/失败处理）、边界场景（倒计时、状态刷新、禁用、重复提交）。
3. **直接写入**：把页面公约写入确切路径 `docs/specs/page-UCS/<页面>.md`（先 `mkdir -p docs/specs/page-UCS`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合模板（URL / 数据源 / 组件树 / 组件调整 / 交互流）。异常则让该 subagent 重写或主流程修正。

## 完成后

- 报告：生成 / 跳过 / 覆盖的页面公约文件清单。
- 提示：页面公约可对接 `ucs-api`（接口用例规约）与 `do-*`（脚手架实现）。
