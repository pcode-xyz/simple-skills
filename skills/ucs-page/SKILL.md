---
name: ucs-page
description: 页面用例规约（Page UCS，仅写页面的端适用）。主进程跑确定性切片（slice-components.py）后，Workflow 逐页并行子 agent：读该页面 HTML + 组件切片 + 接口明细（HTTP → docs/specs/API，gRPC → docs/specs/grpc）+ page-ucs-template.md（组件名以 specs-components 的 COMPONENTS.md 规范组件为准，缺失回退 tech-stack-rule 组件库），生成页面公约直接写入 docs/specs/page-UCS/<页面>.md。当用户要做页面公约、页面用例规约、页面组件与交互设计时使用。
disable-model-invocation: true
---

# ucs-page

页面用例规约：根据 demo 页面 + 接口明细，生成每个页面的页面公约（URL / 数据源 / 组件树 / 组件调整 / 交互流）。**仅需要写页面的端适用**（前端 / App / 桌面端 / 小程序）。

## 前置依赖（先检查，缺失就停）

- **非后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 = 后端**，提示此 skill 只服务写页面的端，结束。
- **接口明细目录按协议分支**（HTTP 与 gRPC 互斥，只生成其一）：
  - 存在 `docs/specs/API/` → 项目为 HTTP，接口明细目录 = `docs/specs/API/`；
  - 存在 `docs/specs/grpc/` → 项目为 gRPC，接口明细目录 = `docs/specs/grpc/`；
  - 两者皆无 → 接口明细缺失，提示先运行 `specs-api` 生成接口，结束；
  - 两者皆有 → 以 `docs/standards/tech-stack-rule.md` 选型上下文为准，或询问用户。
- 必须存在：`docs/product/demo/`（≥1 个页面 HTML）、`docs/standards/tech-stack-rule.md`（含端/技术栈选型）。
- 建议存在：`docs/specs/design/COMPONENTS.md`（规范组件清单，`specs-components` 产物；缺失时组件名回退为 tech-stack-rule 的组件库）、`docs/specs/design/DESIGN.md`（设计 token）、`docs/standards/directory-rule.md`、`docs/standards/tools-rule.md`、`docs/product/business-flow.md`。
- 缺失必选项时，提示先运行对应 skill，结束。

## 模板文件（本 skill 自带）

- `templates/page-ucs-template.md` → 页面公约模板（Glob 定位 `**/skills/ucs-page/templates/page-ucs-template.md`，不硬编码缓存路径）
- 组件名取值：优先本页组件切片（`docs/specs/design/.slice/<页面>.md`，由 COMPONENTS.md 确定性过滤派生，见 Step 3）；无切片时回退 `tech-stack-rule.md` 的组件库（替换模板 `{组件库}` 占位，如 Element Plus / Ant Design / TDesign / uni-ui / 自定义组件）

## Step 1 — 读 spec 提取确定清单

- `COMPONENTS.md`（存在才读，`docs/specs/design/`）：规范组件清单，主流程按页派生切片给 subagent（组件树/组件调整的组件名来源）。
- `DESIGN.md`（存在才读，`docs/specs/design/`）：设计 token（组件调整的样式引用）。
- `tech-stack-rule.md`：**端**、技术栈；`COMPONENTS.md` 缺失时兼作组件库取值来源。
- `directory-rule.md`：组件/页面目录、通用组件位置。
- `tools-rule.md`：页面如何调用请求工具（数据源引用）。
- **接口明细目录**（HTTP → `docs/specs/API/`；gRPC → `docs/specs/grpc/`）：接口明细（数据源引用）。

## Step 2 — 盘点页面 + 前置闸门（主进程，启动 workflow 前一次性解决）

- 列出 `docs/product/demo/` 下所有页面 HTML，**报告总数**。
- 用 AskUserQuestion 请用户**排除与页面无关的文档**（如 index.html 对比壳页、纯样式试水页），得 `pages`（去 `.html`）。
- **确定性切片前置**：对每个页面跑 `slice-components.py`（Glob 定位 `**/skills/ucs-page/scripts/slice-components.py`，不硬编码缓存路径；在项目根运行 `python3 <脚本路径> <页面名>`），生成 `docs/specs/design/.slice/<页面>.md`（若 COMPONENTS.md 存在；脚本只读磁盘写文件，不把全量 COMPONENTS.md 读进主流程上下文）。
- **文件闸门前置**：对每个页面检查 `docs/specs/page-UCS/<页面>.md` 是否已存在：已存在 → AskUserQuestion 覆盖 / 备份后替换 / 跳过（备份由主进程做），得 `actions`（{页面: gen|skip}）。
- **收集 args**：`pages`、`demoDir`（`docs/product/demo`）、`sliceDir`（`docs/specs/design/.slice`）、`pageUcsDir`（`docs/specs/page-UCS`）、`apiDir`（HTTP → `docs/specs/API`；gRPC → `docs/specs/grpc`）、`techStackRule`、`designMd`、`dirRule`、`toolsRule`、`componentLibrary`（从 tech-stack-rule 取组件库名，无切片时回退用）、`templates`（Read `**/skills/ucs-page/templates/page-ucs-template.md` 内容字符串）。

## Step 3 — 启动 Workflow（逐页并行，后台执行）

1. **定位脚本**：Glob `**/skills/ucs-page/scripts/ucs-page.workflow.js` 得绝对路径。
2. **调用 Workflow 工具**（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）：`Workflow({ scriptPath: <绝对路径>, args: {...} })`，记录返回的 taskId。
3. **等待 task-notification**（可用 `/workflows` 观察进度）。

> workflow 内部结构：Stage 单阶段**并行**每个页面一个子 agent：读该页 HTML + 组件切片 + 页面模板 + 接口明细 + DESIGN.md + tech-stack-rule，写 `docs/specs/page-UCS/<页面>.md`，返回结构化元数据（interfaces_used / slice_used）。`actions` 里 skip 的页面不生成；失败/跳过的页面随通知标出。

## Step 4 — 通知到达后：校验 + 清理 + 报告

1. **校验**：抽查各页面 UCS 文件已写（Glob/Read 确认，不轻信返回）。
2. **清理**：删除 `docs/specs/design/.slice/` 目录。
3. **报告**：生成 / 跳过 / 覆盖的页面公约文件清单。

## 完成后

- 提示下一步：运行 `/simple:do-page` 实现页面（组件按 `component-map-rule.md` 查配方实现）。
