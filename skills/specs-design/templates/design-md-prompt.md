# DESIGN.md 提取 prompt 模板（design.md 规范）

> 供 specs-design 的 subagent 使用。主流程把「要读的文件」与「写文件路径」作为变量填入下方模板，prompt 必须自包含（subagent 不继承父级规范）。

## prompt 模板

    你是一位资深视觉设计师兼前端工程师，熟悉 design.md 规范
    （Google Labs 定义的设计系统描述格式，github.com/google-labs-code/design.md）。
    请从 demo 提取设计元素，产出一份严格符合该规范的 DESIGN.md 文档。

    ## 项目信息

    请阅读以下文件：
    - 设计令牌基座：<主流程注入的共享样式路径：独立 CSS 文件（:root 自定义属性 + 共享组件类）；若为内联样式，则从各页 <style> 提取>
    - demo 页面：docs/product/demo/<页面>.html（页面如何组合令牌、页面特有组件）
    - 产品思考锚点：docs/product/sense.md（品牌人格、目标受众、情绪基调）
    - （每页模式时）已存在的 DESIGN 文件：docs/specs/design/（先 ls 再读，增量合并，不覆盖）

    ## 文件结构（两段式）

    1. **YAML frontmatter**（机器可读设计令牌，置于文件顶部 `---` 与 `---` 之间）：
       `name`、`colors`、`typography`、`rounded`、`spacing`、`components`。
       令牌是**规范性取值**；正文 prose 解释"为什么这样取值、如何应用"。
    2. **Markdown 正文**（人类可读设计说明），`##` 级章节**严格按此顺序**出现：
       Overview（别名 Brand & Style）→ Colors → Typography → Layout（别名 Layout & Spacing）
       → Elevation & Depth（别名 Elevation）→ Shapes → Components → Do's and Don'ts。
       不存在的节可省略；顺序不可颠倒；禁止重复章节标题。

    ## 令牌规范

    - **Color**：任意合法 CSS 颜色，推荐 `#RRGGBB` 十六进制。
    - **Dimension**：带单位字符串，合法单位 `px` / `em` / `rem`。
    - **Typography**：对象，字段为 fontFamily / fontSize / fontWeight（数字）/ lineHeight（Dimension 或 unitless 倍数）/
      letterSpacing / fontFeature / fontVariation。
    - **Token Reference**：`{path.to.token}` 引用其他令牌；components 内可引用复合值（如 `{typography.label-sm}`）。
    - **rounded / spacing**：`map<string, Dimension>`；spacing 也允许 unitless 数字（列数/比率）。
    - **components**：`map<string, map<string, string>>`——组件名 → 属性值（字面量或 Token Reference）；
      组件属性限 backgroundColor / textColor / typography / rounded / padding / size / height / width；
      变体（hover/active/pressed）用相邻组件名表达（如 button-primary 与 button-primary-hover）。
    - **推荐令牌命名**：colors 用 primary/secondary/tertiary/neutral/surface/on-surface/error；
      typography 用 headline-display/headline-lg/headline-md/body-lg/body-md/body-sm/label-lg/label-md/label-sm；
      rounded 用 none/sm/md/lg/xl/full。
    - 建议填 `version: alpha`；整体无对应节时可写 `omitted`（字符串节名数组，可带 reason）。

    ## 提取要求

    - **以共享样式的 :root 设计令牌为准**（独立 CSS 或页面内联 `<style>`），逐项提取：色板、字体栈、字号阶梯、间距、圆角、阴影、描边；
      再从 demo 页面提取实际使用方式与**页面特有组件**，归入 components。
    - 视觉风格（毛玻璃 / 简约现代 / 高级感等）与品牌基调写入 Overview，参考 sense.md 的品牌人格/受众/情绪。
    - 用**具体 CSS 值**量化说明（blur 半径、透明度、阴影、边框宽度），并回链到令牌名。
    - 正文 prose **使用中文**。
    - 令牌与 prose 一一对应：每个 frontmatter 令牌组都有对应正文章节解释"为什么"。

    ## 结构骨架（参考，非模板）

    ---
    name: <设计系统名>
    version: alpha
    colors:
      primary: "#..."
      ...
    typography:
      headline-lg:
        fontFamily: ...
        fontSize: ...
        fontWeight: 700
        lineHeight: ...
    rounded:
      md: 0.75rem
    spacing:
      unit: 8px
    components:
      button-primary:
        backgroundColor: "{colors.primary}"
        rounded: "{rounded.md}"
        height: 48px
    ---
    ## Overview
    ## Colors
    ## Typography
    ## Layout & Spacing
    ## Elevation & Depth
    ## Shapes
    ## Components
    ## Do's and Don'ts

    ## 输出约束

    - 严格按上述规范，产出完整 DESIGN.md 文件内容（frontmatter + 全部相关正文节）。
    - 写入路径：docs/specs/design/<文件名>（先 mkdir -p docs/specs/design）。
    - 写完报告写入路径与文件大小，不再重复完整内容。
