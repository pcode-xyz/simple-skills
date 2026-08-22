---
name: ucs-page
description: 页面用例规约（Page UCS，仅写页面的端适用）。盘点 docs/product/demo 的页面生成编号任务清单，逐任务顺序 subagent：读该页面 HTML + 接口明细（HTTP → docs/specs/API，gRPC → docs/specs/grpc）+ page-ucs-template.md（组件名以 specs-components 的 COMPONENTS.md 规范组件为准，缺失回退 tech-stack-rule 组件库），生成页面公约直接写入 docs/specs/page-UCS/<页面>.md。当用户要做页面公约、页面用例规约、页面组件与交互设计时使用。
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

## Step 2 — 盘点页面，生成任务清单

- 列出 `docs/product/demo/` 下所有页面 HTML，**报告总数**。
- 用 AskUserQuestion 请用户**排除与页面无关的文档**（如 index.html 对比壳页、纯样式试水页）。
- 为每个待处理页面生成一个编号任务：`任务N：<页面>.html → docs/specs/page-UCS/<页面>.md`，得到**任务清单**。

## Step 3 — 逐任务顺序执行（每个任务一个 subagent，直接落盘）

按任务清单**顺序**逐一执行：每起一个 subagent 处理一个任务；该任务完成并校验通过后，再处理下一个。**不要并行、不要跳跃。** 每个任务产出独立文件，由 **subagent 直接写入**。

主流程在起 subagent **前**先检查目标文件是否已存在：
- 已存在 → AskUserQuestion：覆盖 / 备份后替换 / 跳过（跳过则不起该 subagent）。

主流程在起 subagent **前**先为该页生成**组件切片**（若 `docs/specs/design/COMPONENTS.md` 存在）：
- 跑确定性脚本 `slice-components.py`（Glob 定位 `**/skills/ucs-page/scripts/slice-components.py`，不硬编码缓存路径；在项目根运行 `python3 <脚本路径> <页面名>`），生成 `docs/specs/design/.slice/<页面>.md`（先 `mkdir -p docs/specs/design/.slice`）。
- 脚本只读磁盘写文件，**不把全量 COMPONENTS.md 读进主流程上下文**；subagent 只读切片，不读全量。

每个 subagent 的 prompt 必须**自包含**：
1. **要读的文件**：该页面 HTML（`docs/product/demo/<页面>.html`）、页面公约模板（Glob 定位 `templates/page-ucs-template.md`）、相关接口明细（按前置检查解析出的接口明细目录下与页面数据相关的：HTTP → `docs/specs/API/` 的 yaml，gRPC → `docs/specs/grpc/` 的 proto；**prompt 里写具体路径**）、`docs/standards/tech-stack-rule.md`（端/技术栈）、本页组件切片 `docs/specs/design/.slice/<页面>.md`（存在才读，即本页用到的规范组件；无切片即 COMPONENTS.md 缺失，回退 tech-stack-rule 组件库）、`docs/specs/design/DESIGN.md`（存在才读：设计 token）。
2. **生成要求**：
   - **使用中文**；
   - 严格按 `templates/page-ucs-template.md` 结构逐节填写（URL / 数据源 / 组件树 / 组件调整 / 交互流）；
   - **组件名以本页组件切片 `docs/specs/design/.slice/<页面>.md` 的规范组件为准**（组件树写规范组件名）；无切片（COMPONENTS.md 缺失）时回退 `tech-stack-rule` 的组件库（替换模板 `{组件库}` 占位）；不用库外组件名；
   - 组件调整的颜色/字号/间距用 `DESIGN.md` 的 token 引用，不写具体值；
   - 数据源接口名/路径以接口明细目录为准（HTTP → `docs/specs/API`；gRPC → `docs/specs/grpc`）；字段对齐；
   - 交互流覆盖：页面加载（骨架屏、并行/条件请求）、主操作（确认弹窗、调用、成功/失败处理）、边界场景（倒计时、状态刷新、禁用、重复提交）。
3. **直接写入**：把页面公约写入确切路径 `docs/specs/page-UCS/<页面>.md`（先 `mkdir -p docs/specs/page-UCS`）；写完后报告写入路径与文件大小。

主流程（subagent 返回后）：
- **校验**写入的文件：存在、结构符合模板（URL / 数据源 / 组件树 / 组件调整 / 交互流）。异常则让该 subagent 重写或主流程修正。

所有任务完成后，主流程**删除** `docs/specs/design/.slice/` 目录。

## 完成后

- 报告：生成 / 跳过 / 覆盖的页面公约文件清单。
- 提示下一步：运行 `do-page` 实现页面（组件按 `component-map-rule.md` 查配方实现）。
