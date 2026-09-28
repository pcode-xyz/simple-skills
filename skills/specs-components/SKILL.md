---
name: specs-components
description: 组件提取。把 docs/product/demo 页面中的可复用视觉单元归类为规范组件（基础组件 + 领域组件），产出平台无关的组件清单 COMPONENTS.md（变体/状态/数据/行为/token 引用）到 docs/specs/design/，并按项目 tech-stack-rule 声明的端物化一份「规范组件 → 该端渲染配方」的组件映射表 component-map-rule.md。当用户要做组件提取、组件清单、规范组件、按端组件映射、组件库规格时使用。
disable-model-invocation: true
---

# specs-components

组件提取：从 demo 页面与 DESIGN.md 设计令牌中，把可复用的视觉单元**归类**为"规范组件"，产出平台无关的组件清单 `COMPONENTS.md` 与按项目端裁剪出的映射表 `component-map-rule.md`，均写入 `docs/specs/design/`。

**提取只归类、不翻译**——本 skill 不写任何目标端组件代码；平台差异全部收在映射表里，由下游 `do-page` 查表消费。

## 核心逻辑

把 HTML 视觉单元"归类成封闭 taxonomy 中的规范组件 + 记录语义（变体/状态/数据/行为/token 引用）"。不翻译、不写平台代码、不做页面级交互。三条不变量：

- **封闭 taxonomy**：基础组件名必须落进映射表（`component-map-rule.md`）能枚举的集合；提取到新的**领域**组件时走"登记进映射表"通道，不现场发明基础组件名。项目确实需要表内没有的**基础**组件时走 refs 的"taxonomy 扩收通道"（按项目端补配方 + 回写本表），不硬塞未选端。
- **平台知识只住映射表**：`COMPONENTS.md` 只写规范组件名 + DESIGN.md token 引用，不出现任何端组件名与端术语（el-button / SwiftUI / `.ultraThinMaterial` / `prefers-color-scheme` 一律不写）——端级适配统一住映射表头部的 `## 端级纪律`。
- **端来自项目**：映射表的端集合取自 `docs/standards/tech-stack-rule.md`，**不是** skill 自带的端清单。单端项目只出一道端。skill 的 refs 是**配方库**（含多端），项目副本是**按端裁剪**的结果。

## 前置依赖（先检查，缺失就停）

- **门禁**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"取**端**。该文件缺失 → 提示先运行 `/simple:architecture`（端与技术栈是它的产物，本 skill 不替它选），结束。
- 必须存在：`docs/product/demo/`（≥1 个页面 HTML）、`docs/specs/design/DESIGN.md`（设计令牌，`specs-design` 产物）。
- 共享样式来源：`docs/product/demo/` 下的独立 CSS 文件（`css/style.css` 或与页面同级，**Glob 定位**）；若无独立 CSS 文件，样式内联在各页面 `<style>` 中（按内联提取共享类）。
- 建议存在：`docs/product/sense.md`（领域组件语义参考）。
- 缺失必选项时，提示先运行 `demo` + `specs-design`，结束。

## 模板文件（本 skill 自带）

- `templates/component-prompt.md` → 逐页提取 + 增量合并 prompt（每页一个 subagent，读当前 COMPONENTS.md 增量写回；Glob 定位 `**/skills/specs-components/templates/component-prompt.md`，不硬编码缓存路径）
- `refs/component-map-rule.md` → **配方库**（taxonomy + 端行撰写规则 + taxonomy 扩收通道 + 按端分列的端级纪律 + 各端配方 + 领域组件登记模板）。**不是项目产物**——首次运行需按项目端**裁剪物化**到 `docs/specs/design/component-map-rule.md`，见 Step 3（Glob 定位 `**/skills/specs-components/refs/component-map-rule.md`）
- `refs/components-md-example.md` → COMPONENTS.md 填充示例（基础组件 + 领域组件各一；端无关，仅示格式）

## Step 1 — 读 spec 提取确定清单

- `docs/specs/design/DESIGN.md`：token 命名（colors/typography/rounded/spacing/components），`COMPONENTS.md` 的 token 引用以它为准。
- `docs/standards/tech-stack-rule.md`（**必读**，前置门禁已确认存在）：端 / 框架（Step 3.1 定端）、UI 组件库行（Step 3.2 定配方基准）、技术栈总览表（Step 3.3 回填能力槽）。
- 列出 `docs/product/demo/` 下所有页面 HTML，**报告总数**。
- **定位共享样式来源**：Glob `docs/product/demo/**/*.css`；有独立 CSS → 读之（`:root` 设计令牌 + 共享组件类，组件候选来源）；无独立 CSS → 样式内联在各页 `<style>`，主流程向 subagent 注入"内联"标记，subagent 从本页 `<style>` 提取共享类。

## Step 2 — 确认范围（AskUserQuestion）

- 用 AskUserQuestion 请用户**排除与组件提取无关的文档**（如对比壳页、纯样式试水页），得到**确认页面清单**。

## Step 3 — 定端 → 定配方基准 → 裁剪物化映射表（主流程）

refs 里的 `component-map-rule.md` 是**各端配方库**，项目副本必须是**按项目端裁剪**的结果。四步：

### 3.1 定端

- 从 `tech-stack-rule.md` 的"选型上下文"取**端**与框架（如"端：移动端 App（iOS / Android）"+"技术栈概要：React Native"）→ 映射到 ref 里的端行（如 `React Native`）。
- ref 里**没有**项目端时（冷门端）→ WebSearch 该端常用做法 + AskUserQuestion 确认后现场生成该端行；报告里建议回写 refs。

### 3.2 定配方基准（组件库 vs 完全自建）

按优先级判断，**命中即止**：

1. `tech-stack-rule.md` 的 **UI 组件库行**能解析出具体基准（库名，或"不引第三方组件库 / core 自建"）→ **直接用，不搜不问**。
2. `docs/specs/design/component-map-rule.md` 已存在且头部有"配方基准"节 → 沿用（含此前登记过的领域组件）。与第 1 条冲突时**以第 1 条为准**，并在报告里提示两者不一致。
3. 第 1 条解析不出（如只写"主流 RN 组件库"这类没指名的空话）或 UI 行缺失 → **兜底**：
   - WebSearch"<框架> 常用 UI 组件库"；
   - 对每个候选取 **GitHub star 数与最后更新时间**作为推荐判据（`api.github.com/repos/<owner>/<repo>` 可直取，或读仓库页）；
   - AskUserQuestion 列 3–4 个候选，**每项标注 `★ star 数 / 最后更新`**，并含"**完全自建（依赖最少）**"一项；
   - 落定结果写进项目副本头部，标注 `来源：本次用户选择（tech-stack-rule 未定稿）`，报告里提示回 `/simple:architecture` 定稿。**不代写** architecture 的产物。

> 基准是"某组件库"时：该库的组件名不能凭空写。以 WebSearch 到的该库组件清单为准逐组件落配方；库与 ref 端行冲突时**以库为准**（ref 给的是 core 自建形态）。

### 3.3 能力槽回填

ref 端行里的 `{slot:*}` 是占位（列表虚拟化 / 图片 / 图标 / 手势动画 / 毛玻璃 / 导航 / SVG / Markdown …）。按 `tech-stack-rule.md` 的技术栈总览表逐槽回填为项目实际依赖（例：`| 列表 | FlashList |` → `{slot:list}` = FlashList）。

- **回填不到的槽必须 AskUserQuestion 或明确标"待定"**，不得沉默留空。最常见的缺口是**图标**槽——IconButton / SearchBar / NavBar 返回键 / Empty 都要它，却最容易被选型漏掉。

### 3.4 裁剪物化

写入 `docs/specs/design/component-map-rule.md`（先 `mkdir -p docs/specs/design`）。**全部操作是删行/换行，不要重写语义**：

1. **头部换成项目版**（**不照抄** ref 头部，否则会把未选端的字样带进来）：`## 目标端`（端 / 框架 / 配方基准 / 来源）+ 项目端那一份 `## 端级纪律` + `## 能力槽`（槽 → 依赖）+ ref 的"端行撰写规则"与"taxonomy 扩收通道"两节。
2. **逐组件保留项目端行，删掉其余端行**。
3. **清掉跨端比较语**：`适配：` 行里残留的"移动端…桌面端…"式对照，按项目端口径改或删（端内行为应写进该端行）。
4. **必须保留 `## 基础组件` 与 `## 领域组件登记` 两个字面标题**，以及 `### <组件名>` 的节结构——`do-page/scripts/slice-page.py` 硬依赖它们：`split("\n## 基础组件", 1)` 找不到会直接崩，`## 领域组件登记` 改名会**静默丢弃**全部领域配方。
5. **`###` 只能放组件名**：端信息、纪律、说明一律不上标题；头部说明用 `##` / `####`。

- 已存在项目副本时同理：**重新裁剪**而非追加（此前登记过的领域组件节要保留）。

## Step 4 — 逐页提取 + 增量合并（每页一个 subagent，顺序执行，不并发）

按确认页面清单**顺序**逐一执行，**不要并行、不要跳跃**——每个 subagent 读**当前已累积的 `COMPONENTS.md`**（前一页产物）后写回，并行会互相覆盖。**不用临时目录**：合并就在增量写回中完成，避免最后一个 subagent 一次性读全部临时文件而超上下文。

每个 subagent 的 prompt 自包含（用 `templates/component-prompt.md`，Glob 定位）：
1. **要读的文件**：**该页** HTML（`docs/product/demo/<页面>.html`）、共享样式来源（主流程注入的独立 CSS 路径；若为内联样式则只读该页 `<style>`）、`docs/specs/design/DESIGN.md`、`docs/specs/design/component-map-rule.md`（taxonomy）、`docs/specs/design/COMPONENTS.md`（**存在才读**，即前面页面累积的结果）、`docs/standards/tech-stack-rule.md`（**必读**；用于写 `## 目标端` 的端声明）。
2. **生成要求**：
   - `COMPONENTS.md` 不存在（首个页面）→ **初始化**：写 `## 目标端`（端 / 框架声明，**不写适配要点**——端级适配统一住映射表头部的 `## 端级纪律`）+ `## 基础组件` / `## 领域组件` 大节 + 本页组件节；
   - `COMPONENTS.md` 已存在（后续页面）→ **读当前状态 → 增量合并 → 写回**：本页已有的组件在该组件"使用页面"追加本页、变体/尺寸/状态/数据取**并集**；本页新组件追加新节；本页独有布局块不进清单；**保留**既有头部与所有既有节，只改需要改的行。
3. **直接写入**：`docs/specs/design/COMPONENTS.md`（先 `mkdir -p docs/specs/design`）；写完报告路径与文件大小。

## Step 5 — 登记新组件进映射表（主流程）

- 主流程比对 `COMPONENTS.md` 的组件名与 `docs/specs/design/component-map-rule.md`：
  - 出现映射表里没有的**领域**组件名 → AskUserQuestion 确认后，按映射表的"领域组件登记"模板追加（含语义、拼装模式、**按项目端逐端**的实现建议——单端项目就是一行，未实现的端写"待实现"）。
  - 出现映射表里没有的**基础**组件名 → 走 refs 的 **taxonomy 扩收通道**：照"端行撰写规则"**按项目端**补配方（不是要求所有端齐活），写进项目副本。**不要**让 subagent 改写成别的名字。
    - 顺带把「组件名 + 各端行」回写 skill refs 的 taxonomy，下次项目直接复用。**refs 不可写**（插件安装目录只读）时不要报错中断——改为在报告里输出一段可直接粘贴的 taxonomy 片段，让用户自己合并。

## Step 6 — 校验

主流程校验写入的 `COMPONENTS.md` 与 `docs/specs/design/component-map-rule.md`：

**COMPONENTS.md**
- 结构：`## 目标端` / `## 基础组件` / `## 领域组件` 齐全。
- **端一致**：`## 目标端` 声明的端与映射表的端集合**完全一致**（两者不一致就是"COMPONENTS 写未定、映射表却五端"那类事故）。
- **端纯净**：全文不得出现端名/端术语（SwiftUI / Compose / Flutter / Element / Ant / iOS / Android / `backdrop-filter` / `prefers-color-scheme`）——COMPONENTS.md 是平台无关清单，端级适配住映射表头部。
- 基础组件名都在 `component-map-rule.md` taxonomy 内；领域组件已在映射表登记。
- token 引用 `{path.to.token}` 在 `DESIGN.md` frontmatter 里都存在。
- 每个组件的"使用页面"在 `docs/product/demo/` 下真实存在。

**component-map-rule.md**
- **端纯净**：只有项目端字样，无未选端（含"移动端…桌面端…"式跨端比较语）。
- **字面标题**：含 `## 基础组件` 与 `## 领域组件登记`（`slice-page.py` 硬依赖；前者改名会崩，后者会静默丢领域配方）。
- **标题纯净**：`###` 只放组件名，无端名/说明性标题。
- **无空话**：端行不得以裸"自建"/"无对应物"收尾——必须跟出原语组合，或显式 `N/A + 理由`。
- **能力槽已回填**：不残留 `{slot:` 占位（回填不到应已问过用户或标"待定"）。

- 异常则让该 subagent 重写或主流程修正。

## 完成后

- 报告：`COMPONENTS.md` 路径与大小；`component-map-rule.md`（**端集合 / 配方基准 / 能力槽回填结果** / 新建或沿用的领域组件清单）。
  - 配方基准若不是从 `tech-stack-rule.md` 读到的（走了 3.2 的兜底），**必须提示**：本次选择未回写 `tech-stack-rule.md`，建议回 `/simple:architecture` 定稿，否则下次运行会再问一遍、且与 `do-page` 的消费口径不一致。
  - 能力槽有标"待定"的，一并列出。
- 提示下一步：`ucs-page` 的组件树可改用本清单的规范组件名（配方查 `component-map-rule.md`）；`do-page` 实现时按映射表查配方。
