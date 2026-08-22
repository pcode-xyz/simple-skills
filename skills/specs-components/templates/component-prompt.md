# 逐页提取 + 增量合并 prompt 模板（每页一个 subagent）

> 供 specs-components 的逐页 subagent 使用。每个 subagent 只处理**一页**：读当前已累积的 `docs/specs/design/COMPONENTS.md`（前面页面的产物），把本页组件增量合并后写回。主流程把「页面文件名」作为变量填入，prompt 必须自包含（subagent 不继承父级规范）。

## prompt 模板

    你是一位资深前端工程师兼视觉设计师，熟悉跨端组件抽象与设计系统。
    请从本页 demo 提取组件，把本页组件增量合并进组件清单 COMPONENTS.md。

    ## 项目信息（本任务只读这些文件）

    - demo 页面：docs/product/demo/<页面>.html（只读这一页）
    - 共享组件类：docs/product/demo/css/style.css
    - 设计令牌：docs/specs/design/DESIGN.md（token 命名，组件节引用它，不重复定义视觉值）
    - 组件映射表：docs/specs/design/component-map-rule.md（taxonomy 基准）
    - 已累积组件清单：docs/specs/design/COMPONENTS.md（**存在才读**，即前面页面合并的结果）
    - 技术选型：docs/standards/tech-stack-rule.md（存在才读；仅当 COMPONENTS.md 不存在时用于初始化目标端）

    ## 合并规则

    - `COMPONENTS.md` **不存在**（本页是首个页面）→ **初始化**：
      1. 写 `## 目标端`：目标端/框架（取自 tech-stack-rule，取不到写"未定"）+ 一段"适配要点"；
      2. 写 `## 基础组件` 与 `## 领域组件` 大节；
      3. 把本页可复用组件按 `### <规范名>` 填入。
    - `COMPONENTS.md` **已存在** → **读当前状态 → 增量合并 → 写回**（不覆盖既有内容）：
      - 本页组件在清单里已存在 → 只在该组件的"使用页面"追加本页，变体/尺寸/状态/数据取**并集**；
      - 本页组件清单里没有 → 追加新节 `### <规范名>`；
      - 保留 `## 目标端` 头部与所有既有组件节，只改需要改的行。

    ## 组件节格式

    每节 `### <规范名>`，字段：
    - 变体（含可选字段式变体）
    - 尺寸
    - 状态（default/hover/active/disabled/loading/选中）
    - 数据字段
    - 行为
    - 布局角色
    - 使用页面（本页为 page-<页面>；聚合时追加）

    ## 提取要求

    - **归类不翻译**：组件一律用 component-map-rule.md 里的规范组件名；不写任何端组件名（el-button / SwiftUI / ElevatedButton 一律不出现）。
    - **分离**：style.css 的共享组件类与本页复用的视觉模式 → 组件；本页独有布局块 → 不进清单。
    - **两层分类**：通用可复用 → 基础组件（taxonomy 内）；带业务语义 → 领域组件（可新建，语义化命名）。
    - **token 引用**：颜色/字号/间距/圆角/阴影用 DESIGN.md 的 token 引用（`{colors.primary}`），不写具体 CSS 值。
    - **不越界**：不写像素级布局、不写页面级交互流（那是 ucs-page）、不写目标端代码。

    ## 输出约束

    - 严格按"组件节格式"，正文 prose 使用中文。
    - 写入路径：docs/specs/design/COMPONENTS.md（先 mkdir -p docs/specs/design）。
    - 写完报告写入路径与文件大小，不再重复完整内容。
