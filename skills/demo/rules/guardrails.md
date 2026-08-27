# 性能 & 无障碍护栏（demo 页不翻车的底线）

> demo skill 生成规则之一，由 `demo-html.md` 指示，生成前（含 subagent）必须 Read 并遵守。
> 适用：Step 4 预览与 Step 7 定稿页，写 `js/preview-<slug>.js` / `js/main.js` 动效和 CSS 时一并遵守。

**主题锁定（明暗模式）**
- 整页一个主题：明或暗由风格配方定（如 luxury=暗、zen=明、minimal=明），**禁止一页内明暗混排**。
- 需要跟随系统明暗时，用 CSS 变量换一套令牌（`:root` + `@media (prefers-color-scheme: dark)`），不要把色值硬编码到每个选择器。

**动效**
- 过渡/动画只用 `transform` 和 `opacity`；不用 `top/left/width/height` 做动画（逐帧触发布局重算，手机浏览器上卡）。
- `@media (prefers-reduced-motion: reduce)` 必须提供降级：无限循环、视差、悬浮动效在 reduced-motion 下塌成静态/瞬间。
- 不为 demo 引重型动效库；需要入场/滚动动效时用原生 CSS transition/animation 或轻量 JS，交互逻辑隔离在独立 JS 文件（预览 `js/preview-<slug>.js` / 定稿 `js/main.js`）。

**性能**
- 图片/字体预留尺寸（`width`/`height` 或 `aspect-ratio`），避免加载时布局跳动（CLS）。
- hero 视觉不拖慢首屏：关键图用 `loading="eager"` + `fetchpriority="high"`，或内联关键样式。
- 不引重库、不铺超清大图；demo 页目标是秒开。

**z-index 纪律**
- 不随手 `z-index: 999`。只在系统级层用 z-index（吸顶导航/弹窗/遮罩）并集中注释刻度；普通元素靠文档顺序。
