---
name: specs-api-mock
description: 接口 Mock 层生成 + demo 接线（demo 真实数据 → 契约 1:1 mock）：契约子 agent 读项目全部接口定义（gRPC proto / HTTP yaml，运行时自行发现）生成 api-mock.js（契约字段命名、流式接口订阅推送、状态化内存 store + localStorage/window.name 镜像），数据从 demo 实际数据按「demo 字段 → 契约字段」映射播种；并行页面子 agent 只读盘点每页数据访问 → 契约 RPC/字段（covered / 未接线 / gap / pure_client）写 map 存档；接线子 agent 单写把 demo 共享数据层改为「异步预载缓存 + 同步渲染」、复制页面换脚本全走 api-mock.js；独立校验子 agent 逐调用点核对 app-mock.js 的 api.* 与接口定义严格一致，不一致循环修正到一致（上限 3 轮）；汇总子 agent 聚合写 docs/specs/review/mock-compare.md 决策单；随后自动生成 demo-review 接口看板（iframe 嵌入业务页 + 实时 RPC 请求/响应面板 + 设备尺寸预览 + 点击接口联动高亮页面对应区域，模板化、任何项目复用）。产出 docs/product/demo-mock/（file:// 直开、无服务器、无网络）。当用户要做接口 mock、demo 接契约、mock 接口层生成、页面走 mock 接口、接口联调前预演时使用。
disable-model-invocation: true
---

# specs-api-mock

把 demo 的真实数据按项目接口定义 1:1 做成 JS mock，复制 demo 页面到 `demo-mock` 并全部改走 mock 接口层，再逐页对照差异，产出确定性结论（数据访问 → RPC/字段 → covered / 未接线 / gap / pure_client）。**只生成 mock 层与接线，不改接口定义、不改原 demo。**

> **主流程只做编排与汇总，不读接口定义原文 / demo JS 全文 / 页面 HTML 全文**（避免上下文超限）；契约生成、页面对照、接线由子 agent 自行完成。
> **通用性**：本 skill 不做任何项目特化——接口定义目录、demo 的数据层结构（共享 JS / 存储 helper / 访问器 / 静态 const）、页面取数方式，全部由子 agent 在运行时读实际项目自行发现。以下所有 `docs/...` 路径均为目标项目 cwd 相对路径。
> **范围边界**：本 skill 产出 mock 层 + 接线 + 对照 + 跨接口总览，覆盖接口满足度判定（`specs-api-review` 已退役并入本 skill）。接口设计质量评审归 `specs-api` 生成时自检，死接口排查归开发后 `review`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/demo/`（≥1 个业务页 HTML + ≥1 个共享 demo JS 数据层，如 `app.js`，文件名运行时 `ls` 发现）。
- **接口定义按协议分支**（gRPC 与 HTTP 互斥，只接其一）：
  - `docs/specs/grpc/` 下存在 ≥1 个 `*.proto` → 协议分支 = gRPC，接口定义目录 = `docs/specs/grpc/`；
  - `docs/specs/API/` 下存在 ≥1 个 `*.yaml` → 协议分支 = HTTP，接口定义目录 = `docs/specs/API/`；
  - 两者皆无 → 提示先运行 `specs-api` 生成接口定义，结束。
  - 两者皆有 → AskUserQuestion 让用户选接哪一支（主 agent 不问、不默认）。
- 产物路径（固定）：`mockDir = docs/product/demo-mock`；`reportPath = docs/specs/review/mock-compare.md`；`mapDir = docs/specs/review/mock-maps`（**中间存档，汇总后即删**）。
- `docs/product/demo-mock/` 已存在 → AskUserQuestion 覆盖重跑 / 保留跳过（交互闸门前置主进程，一次性解决）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 确定页面范围（AskUserQuestion，每次必问）

`ls docs/product/demo/*.html` 列出全部页面。默认推荐 = **排除 `index.html`（风格对比页）与 `preview-*.html`（风格参照页）**，即业务页。用 AskUserQuestion 让用户确认：按推荐清单接 / 增删页面。

- 无任何业务页 → 提示 demo 中无业务页可接，结束。

## Step 2 — 准备 args（主 agent 只做零读取的盘点）

主 agent **不读任何页面 HTML / 接口定义 / JS 全文**（避免上下文超限），只盘点存在性、收集 workflow args：

- `pages`：Step 1 确认的业务页列表（页面名，去 `.html`）。
- `demoDir`：`docs/product/demo`；`protocolDir`：协议分支的接口定义目录（gRPC → `docs/specs/grpc`；HTTP → `docs/specs/API`）；`protocol`：`grpc` / `http`。
- `moduleFiles`：`ls` 接口定义目录所得文件名列表（只拿名字，不读内容）。
- `demoAppJs`：`ls` demo 目录所得共享 JS 文件名（如 `app.js`）；`demoDataJs`：可选的数据 JS 文件名（如 `mock-cards.js`，存在才传，可多个）。
- `mockDir` / `mapDir` / `reportPath` / `apiMockPath`（=`mockDir/api-mock.js`）/ `appMockPath`（=`mockDir/app-mock.js`）/ `contractIndexPath`（=`mockDir/contract-index.json`）。
- `templates`：Glob 定位 `**/skills/specs-api-mock/templates/*.md` 五个模板（`p1-contract-prompt` / `p2-page-mapping-prompt` / `p3-rewire-prompt` / `p3b-validate-prompt` / `p4-aggregate-prompt`）Read 成字符串。
- 契约提取与字段核对**不做**：由 stage1 子 agent 完成（读全部接口定义 + demo 数据层），主 agent 不预读、不建索引。

## Step 3 — 启动 Workflow（契约 → 并行对照 → 单写接线 → 汇总，后台执行）

1. **定位脚本**：Glob `**/skills/specs-api-mock/scripts/specs-api-mock.workflow.js` 得绝对路径。
2. **调用 Workflow 工具**（本 skill 使用 Workflow 工具做多 agent 编排；用户调用本 skill 即视为显式 opt-in，首次可能弹权限提示，放行）：`Workflow({ scriptPath: <绝对路径>, args: {...} })`，记录返回的 taskId。
3. **等待 task-notification**（期间不做其他大动作；可用 `/workflows` 观察进度）。

> workflow 内部结构（**严格串行**，接线需要对照的映射作唯一真相）：
> Stage1 契约子 agent 读全部接口定义 + demo 数据层 → 写 `demo-mock/api-mock.js` + `demo-mock/contract-index.json`（字段级契约索引）+ 返回契约 schema；
> Stage2 **并行**每个业务页一个对照子 agent（**只读不改**、互不依赖），逐数据访问映射到契约 RPC/字段（covered / 未接线 / gap / pure_client），各写 `docs/specs/review/mock-maps/<页面>-map.md`（**中间存档，汇总后由主进程清理**）+ 返回结构化计数；
> Stage3 接线子 agent（**demo-mock 目录唯一写入者**）→ 复制共享 JS 只改数据层缝（异步预载缓存 + 同步渲染）、复制页面换脚本全走 api-mock.js、`__GAP__` 标记无接口来源访问；
> Stage3b **接口格式校验循环**：只读校验子 agent 逐调用点核对 app-mock.js 的 `api.*` 与契约——op 存在性 / 请求字段 ⊆ 契约 / 响应消费 ⊆ 契约 / 流式用 `.subscribe` / 字段名·枚举值按契约——不一致交回接线 agent 修正后复验，**直到 clean（上限 3 轮）**；
> Stage4 汇总子 agent（只读 schema + map 存档 + 校验结果）→ 写 `docs/specs/review/mock-compare.md` 决策单报告。失败/跳过的页面不会静默消失——随通知 `skipped` 标出。

## Step 4 — 生成 demo-review 接口看板（自动，机械步骤，主 agent 直接执行）

接线完成后，自动生成「接口实时 Review 看板」：左侧 iframe 嵌入业务页（可切设备尺寸），右侧实时显示打开页面时与点击按钮触发的每个 RPC 请求/响应（含流式事件）；**点击右侧接口条目会联动高亮左侧页面上该接口喂出来的内容区**（由接线阶段在页面上打的 `data-rpc="<service.op>"` 出处标记驱动，见 Step 3 / p3-rewire-prompt；未打标记的页面该项为 0 命中）。**任何项目通用**——api-spy 只依赖 mock 层固定形状 `window.api.<service>.<rpc>` 与 `data-rpc` 标记约定，与具体服务无关；看板页唯一项目相关项是页面清单，由模板占位符填充。本步**不读接口定义 / demo JS / 页面 HTML**，只做文件级操作。

模板（Glob 定位）：`**/skills/specs-api-mock/templates/api-spy.js`、`**/skills/specs-api-mock/templates/demo-review.html`（后者含占位符 `__PAGES_JSON__`）。

1. **复制 spy**：`cp templates/api-spy.js → mockDir/api-spy.js`（静态资产，原样复制，不修改）。
2. **注入页面**：对 `mockDir/*.html` 中含 `<script src="app-mock.js"></script>` 的页面，在其**前一行**插入 `<script src="api-spy.js"></script>`，保证脚本顺序 `api-mock.js → api-spy.js → app-mock.js`（spy 须在 app-mock 消费 api 前完成包装）。**幂等**（重跑时页面已含 spy 则跳过，防重复注入）：
   `for f in $(grep -l 'app-mock\.js' mockDir/*.html); do grep -q 'api-spy\.js' "$f" && continue; perl -i -pe 's{<script src="app-mock\.js"></script>}{<script src="api-spy.js"></script>\n<script src="app-mock.js"></script>}' "$f"; done`
3. **写看板页**：Read `templates/demo-review.html`，把占位符 `__PAGES_JSON__` 替换为 Step 1 确认的页面名 JSON 数组（`JSON.stringify(pages)`，如 `["home","chat"]`），Write 到 `mockDir/demo-review.html`。看板默认加载页 = 数组首元素（模板已处理）。
4. **校验**：`mockDir/api-spy.js` 存在；注入 spy 的页面数 = 改线页面数；`demo-review.html` 中 `PAGES` 与 Step 1 清单一致、无残留 `__PAGES_JSON__`。

> 说明：spy 仅在 iframe 嵌入时激活（`window.self !== window.top` 守卫），独立打开业务页为 no-op，不影响原产物。看板主题 light/dark 跟随浏览器 `prefers-color-scheme`，需在 DevTools 里 `Cmd+Shift+P → Emulate CSS prefers-color-scheme` 切换（页面内按钮无法驱动浏览器模拟，属浏览器安全限制）。

## Step 5 — 通知到达后：校验 + 清理 + 报告

1. **校验**：确认 `demo-mock/api-mock.js`、`demo-mock/app-mock.js`、`demo-mock/api-spy.js`、`demo-mock/demo-review.html`、复制改写的页面（各页含 spy 注入）、`docs/specs/review/mock-compare.md` 均已写（不轻信 workflow 返回）。
2. **清理**：删除 `docs/specs/review/mock-maps/` 目录（map 仅传输存档，汇总后即删；报告不依赖它们）。
3. **报告**：契约服务数 / RPC 数 / 流式 RPC 数、对照页面数与 covered·未接线·gap·pure_client 计数、缺口总数、**接口格式校验结果（修正轮数 / 是否 clean / 剩余不一致）**、`skipped` 未完成页面（如有）。

## 完成后

- 提示 `demo-mock/` 可直接 file:// 打开预览（数据流经 api-mock.js，无服务器无网络）。
- **接口 Review 看板**：`demo-mock/demo-review.html` file:// 直开——左侧选页 / 切设备尺寸（iPhone 等预设），右侧实时显示打开页面时与点击触发的每个 RPC 请求/响应（含流式事件、caller 定位、open/交互分组）。
- **联动高亮**：点右侧任一接口条目（或勾选工具栏「联动高亮」时点标题）→ 左侧页面上该接口喂出来的内容区（带 `data-rpc` 标记）整体描边变色并滚到视野，再点同一条取消；「清除高亮」按钮一键还原。区域级命中，靠接线阶段打的 `data-rpc="<service.op>"` 出处标记（页面 HTML 静态容器 / app-mock.js 动态模板根），未标记的纯 UI 区不打。
- **看板主题 light/dark**：跟随浏览器 `prefers-color-scheme`，在 DevTools `Cmd+Shift+P → Emulate CSS prefers-color-scheme` 切换（页面内按钮无法驱动浏览器模拟）。
- **缺口工作清单驱动后续接口补充**：对照/接线产出的 gap（契约缺 RPC/字段）→ 按清单运行 `/simple:specs-api` 增量补/改接口，改完重跑本 skill 复核。
- 接真实后端时：把 `api-mock.js` 的实现换成 fetch/gRPC 客户端即可——mock 层与页面接线解耦，页面不用再改。
