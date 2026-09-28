# COMPONENTS.md 示例（booking 场景）

> 供 specs-components 的 subagent 对齐格式。**格式示意：端与场景均无关，切勿照抄**——端取自本项目 `tech-stack-rule.md`，场景取自本项目 demo，token 值从 DESIGN.md 引用（此处示例值为占位示意）。

## 目标端

- 目标端 / 框架：<端 + 框架，取自 `docs/standards/tech-stack-rule.md` 的"选型上下文"（单端项目就一项）>

> 端级适配**不写在这里**——统一住 `component-map-rule.md` 头部的 `## 端级纪律`（`slice-page.py` 会把它透传进每份映射切片）。本文件是平台无关清单。

## 基础组件

### Button
- 变体：primary / secondary / ghost / danger
- 尺寸：sm / md / lg
- 状态：default / hover / active / disabled / loading
- token：bg={colors.primary} text={colors.on-primary} radius={rounded.md} pad={spacing.md}
- 行为：点击触发主操作；loading 时禁用
- 布局角色：页内操作
- 使用页面：page-01 / page-02

### Card
- 变体：默认 / 可点击
- 状态：default / pressed
- token：bg={colors.surface} radius={rounded.lg} shadow={shadow.card} pad={spacing.md}
- 行为：可点击卡片点击进入详情
- 布局角色：列表项容器
- 使用页面：page-01 / page-02

## 领域组件

### PropertyCard
- 语义：房源卡片，展示照片/名称/区域/距离/评分/价格
- 数据：photo, name, area, distance, score, reviews, price, originalPrice?, scarcity?
- 变体：hasOriginalPrice（可选字段式）/ hasScarcity（可选字段式）
- 状态：默认 / 选中
- 拼装：Card + Avatar + Text + Badge + Button
- token：bg={colors.surface} radius={rounded.lg} shadow={shadow.card}
- 使用页面：page-02

### ReviewScoreBadge
- 语义：评分徽标，按分数区间显示文字标签（Fabulous/Very good/Good/Pleasant）
- 数据：score, reviews
- 变体：score >= 9 → "Fabulous"；8~9 → "Very good"；7~8 → "Good"；其余 → "Pleasant"
- 状态：无
- 拼装：Badge + Text
- token：bg={colors.deal} text={colors.on-deal}
- 使用页面：page-02
