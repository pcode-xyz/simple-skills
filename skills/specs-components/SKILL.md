---
name: specs-components
description: 组件提取。把 docs/product/demo 页面中的可复用视觉单元归类为规范组件（基础组件 + 领域组件），产出平台无关的组件清单 COMPONENTS.md（变体/状态/数据/行为/token 引用）到 docs/specs/design/，并物化规范组件 → 各端（Vue/React/Flutter/iOS/Android）渲染配方的组件映射表 component-map-rule.md。当用户要做组件提取、组件清单、规范组件、跨端组件映射、组件库规格时使用。
disable-model-invocation: true
---

# specs-components

组件提取：从 demo 页面与 DESIGN.md 设计令牌中，把可复用的视觉单元**归类**为"规范组件"，产出平台无关的组件清单 `COMPONENTS.md` 与跨端映射表 `component-map-rule.md`，均写入 `docs/specs/design/`。

**提取只归类、不翻译**——本 skill 不写任何目标端组件代码；平台差异全部收在映射表里，由下游 `do-page` 查表消费。

## 核心逻辑

把 HTML 视觉单元"归类成封闭 taxonomy 中的规范组件 + 记录语义（变体/状态/数据/行为/token 引用）"。不翻译、不写平台代码、不做页面级交互。两条不变量：

- **封闭 taxonomy**：基础组件名必须落进映射表（`component-map-rule.md`）能枚举的集合；提取到新的**领域**组件时走"登记进映射表"通道，不现场发明基础组件名。
- **平台知识只住映射表**：`COMPONENTS.md` 只写规范组件名 + DESIGN.md token 引用，不出现任何端组件名（el-button / SwiftUI / ElevatedButton 一律不写）。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/demo/`（≥1 个页面 HTML）、`docs/specs/design/DESIGN.md`（设计令牌，`specs-design` 产物）。
- 共享样式来源：`docs/product/demo/` 下的独立 CSS 文件（`css/style.css` 或与页面同级，**Glob 定位**）；若无独立 CSS 文件，样式内联在各页面 `<style>` 中（按内联提取共享类）。
- 建议存在：`docs/standards/tech-stack-rule.md`（目标端/框架，用于"适配要点"标注）、`docs/product/sense.md`（领域组件语义参考）。
- 缺失必选项时，提示先运行 `demo` + `specs-design`，结束。

## 模板文件（本 skill 自带）

- `templates/component-prompt.md` → 逐页提取 + 增量合并 prompt（每页一个 subagent，读当前 COMPONENTS.md 增量写回；Glob 定位 `**/skills/specs-components/templates/component-prompt.md`，不硬编码缓存路径）
- `refs/component-map-rule.md` → 默认映射表（taxonomy + 五端配方），首次运行物化到 `docs/specs/design/component-map-rule.md`（Glob 定位 `**/skills/specs-components/refs/component-map-rule.md`）
- `refs/components-md-example.md` → COMPONENTS.md 填充示例（基础组件 + 领域组件各一）

## Step 1 — 读 spec 提取确定清单

- `docs/specs/design/DESIGN.md`：token 命名（colors/typography/rounded/spacing/components），`COMPONENTS.md` 的 token 引用以它为准。
- `docs/standards/tech-stack-rule.md`（存在才读）：目标端 / 框架，用于目标端标注与适配要点。
- 列出 `docs/product/demo/` 下所有页面 HTML，**报告总数**。
- **定位共享样式来源**：Glob `docs/product/demo/**/*.css`；有独立 CSS → 读之（`:root` 设计令牌 + 共享组件类，组件候选来源）；无独立 CSS → 样式内联在各页 `<style>`，主流程向 subagent 注入"内联"标记，subagent 从本页 `<style>` 提取共享类。

## Step 2 — 确认范围（AskUserQuestion）

- 用 AskUserQuestion 请用户**排除与组件提取无关的文档**（如对比壳页、纯样式试水页），得到**确认页面清单**。

## Step 3 — 物化/确认映射表（主流程）

- 若 `docs/specs/design/component-map-rule.md` 不存在 → 从 skill refs（Glob 定位 `**/skills/specs-components/refs/component-map-rule.md`）**复制**为项目副本（先 `mkdir -p docs/specs/design`），作为 taxonomy 基准。
- 若已存在 → 沿用，subagent 以它为 taxonomy 来源（含此前登记过的领域组件）。

## Step 4 — 逐页提取 + 增量合并（每页一个 subagent，顺序执行，不并发）

按确认页面清单**顺序**逐一执行，**不要并行、不要跳跃**——每个 subagent 读**当前已累积的 `COMPONENTS.md`**（前一页产物）后写回，并行会互相覆盖。**不用临时目录**：合并就在增量写回中完成，避免最后一个 subagent 一次性读全部临时文件而超上下文。

每个 subagent 的 prompt 自包含（用 `templates/component-prompt.md`，Glob 定位）：
1. **要读的文件**：**该页** HTML（`docs/product/demo/<页面>.html`）、共享样式来源（主流程注入的独立 CSS 路径；若为内联样式则只读该页 `<style>`）、`docs/specs/design/DESIGN.md`、`docs/specs/design/component-map-rule.md`（taxonomy）、`docs/specs/design/COMPONENTS.md`（**存在才读**，即前面页面累积的结果）、`docs/standards/tech-stack-rule.md`（存在才读；仅首个 subagent 用于初始化目标端）。
2. **生成要求**：
   - `COMPONENTS.md` 不存在（首个页面）→ **初始化**：写 `## 目标端` + 适配要点 + `## 基础组件` / `## 领域组件` 大节 + 本页组件节；
   - `COMPONENTS.md` 已存在（后续页面）→ **读当前状态 → 增量合并 → 写回**：本页已有的组件在该组件"使用页面"追加本页、变体/尺寸/状态/数据取**并集**；本页新组件追加新节；本页独有布局块不进清单；**保留**既有头部与所有既有节，只改需要改的行。
3. **直接写入**：`docs/specs/design/COMPONENTS.md`（先 `mkdir -p docs/specs/design`）；写完报告路径与文件大小。

## Step 5 — 登记新领域组件进映射表（主流程）

- 主流程比对 `COMPONENTS.md` 的组件名与 `docs/specs/design/component-map-rule.md`：
  - 出现映射表里没有的**领域**组件名 → AskUserQuestion 确认后，按映射表的"领域组件登记"模板追加进映射表（含语义、拼装模式、各端实现建议或标注"待实现"）。
  - 出现映射表里没有的**基础**组件名 → 违反封闭 taxonomy，让 subagent 重写为映射表内名称。

## Step 6 — 校验

主流程校验写入的 `COMPONENTS.md`：
- 结构：`## 目标端` / `## 基础组件` / `## 领域组件` 齐全。
- 基础组件名都在 `component-map-rule.md` taxonomy 内；领域组件已在映射表登记。
- token 引用 `{path.to.token}` 在 `DESIGN.md` frontmatter 里都存在。
- 每个组件的"使用页面"在 `docs/product/demo/` 下真实存在。
- 异常则让该 subagent 重写或主流程修正。

## 完成后

- 报告：`COMPONENTS.md` 路径与大小、`component-map-rule.md`（新建 / 沿用 / 追加的领域组件清单）。
- 提示下一步：`ucs-page` 的组件树可改用本清单的规范组件名（配方查 `component-map-rule.md`）；`do-page` 实现时按映射表查配方。
