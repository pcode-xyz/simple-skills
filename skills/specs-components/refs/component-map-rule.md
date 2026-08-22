# 组件映射表（component-map-rule）

> 规范组件 → 各端渲染配方。**唯一存放平台知识的地方。**
>
> - 使用约定：`COMPONENTS.md` 与 page-UCS 组件树只写**规范组件名**；`do-page` 实现时据此表查配方。
> - 封闭 taxonomy：表里没有的组件名禁止出现。新增**领域**组件走文末"领域组件登记"；新增基础组件需全局评估（五端配方齐全才收）。
> - 移动端通用适配：无 hover，用 pressed/长按替代；`backdrop-filter` 毛玻璃 → iOS `.ultraThinMaterial`、Android 自实现模糊、Flutter `BackdropFilter`。
> - 参考样例（SwiftUI 组件实现模式，仅参考）：github.com/Meliwat/awesome-ios-design-md（DESIGN-swiftui.md）。

## 基础组件

### Button
- Vue(Element Plus)：`el-button`，type=primary/default/danger，size=default/large/small
- React(Ant Design)：`<Button type="primary">`
- Flutter：`FilledButton` / `OutlinedButton` / `TextButton`（按变体）
- iOS(SwiftUI)：`Button` + `.buttonStyle(.borderedProminent/.bordered/.borderless)` + `.tint`
- Android(Compose)：`Button` / `OutlinedButton` / `TextButton`（按变体）
- 适配：按压态用 isPressed 动画；loading 变体各端均需自处理（禁用 + spinner）。

### IconButton
- Vue(Element Plus)：`el-button :icon` 或 `<el-icon>` 包裹
- React(Ant Design)：`<Button icon={<Icon/>}>` 或 `shape="circle"`
- Flutter：`IconButton`
- iOS(SwiftUI)：`Button` + `Image(systemName:)`
- Android(Compose)：`IconButton`

### Input
- Vue(Element Plus)：`el-input`
- React(Ant Design)：`<Input>`
- Flutter：`TextField` + `InputDecoration`
- iOS(SwiftUI)：`TextField` + `.textFieldStyle(.roundedBorder)`
- Android(Compose)：`OutlinedTextField` / `BasicTextField`
- 适配：状态色（成功/错误）各端用 theme 或边框/底色表达。

### Textarea
- Vue(Element Plus)：`el-input type="textarea"`
- React(Ant Design)：`<Input.TextArea>`
- Flutter：`TextField` + `maxLines: null`
- iOS(SwiftUI)：`TextField` + `axis: .vertical`
- Android(Compose)：`OutlinedTextField` + `maxLines`

### Select / Picker
- Vue(Element Plus)：`el-select`
- React(Ant Design)：`<Select>`
- Flutter：`DropdownButtonFormField`
- iOS(SwiftUI)：`Picker` + `.pickerStyle(.menu/.wheel)`
- Android(Compose)：`ExposedDropdownMenuBox` / `DropdownMenu`
- 适配：移动端滚轮、桌面端下拉；iOS 弹层用 `.pickerStyle(.wheel)`。

### Checkbox
- Vue(Element Plus)：`el-checkbox`
- React(Ant Design)：`<Checkbox>`
- Flutter：`Checkbox`
- iOS(SwiftUI)：`Toggle`
- Android(Compose)：`Checkbox`

### Radio
- Vue(Element Plus)：`el-radio-group` + `el-radio`
- React(Ant Design)：`<Radio.Group>` + `<Radio>`
- Flutter：`Radio` / `RadioListTile`
- iOS(SwiftUI)：`Picker` 或自实现
- Android(Compose)：`RadioButton`

### Switch
- Vue(Element Plus)：`el-switch`
- React(Ant Design)：`<Switch>`
- Flutter：`Switch`
- iOS(SwiftUI)：`Toggle`
- Android(Compose)：`Switch`

### Slider
- Vue(Element Plus)：`el-slider`
- React(Ant Design)：`<Slider>`
- Flutter：`Slider`
- iOS(SwiftUI)：`Slider`
- Android(Compose)：`Slider`

### Stepper
- Vue(Element Plus)：`el-input-number`
- React(Ant Design)：`<InputNumber>`
- Flutter：自实现（`Row` + 加减按钮 + 数字）
- iOS(SwiftUI)：`Stepper`
- Android(Compose)：自实现

### Badge
- Vue(Element Plus)：`el-badge`
- React(Ant Design)：`<Badge>`
- Flutter：`Badge`
- iOS(SwiftUI)：自实现（`ZStack` + `Text` capsule）或 `Badge`（iOS 17+）
- Android(Compose)：`Badge` / `BadgeBox`

### Tag / Chip
- Vue(Element Plus)：`el-tag`
- React(Ant Design)：`<Tag>`
- Flutter：`Chip`
- iOS(SwiftUI)：自实现（`Text` + capsule 背景）或 `LabeledContent`
- Android(Compose)：`AssistChip` / `FilterChip` / `SuggestionChip`
- 适配：可选中态（isSelected）→ Flutter/iOS/Android 用 chip 变体，Vue/React 用 `closable/effect` 或自接状态。

### Card
- Vue(Element Plus)：`el-card`
- React(Ant Design)：`<Card>`
- Flutter：`Card`
- iOS(SwiftUI)：`ZStack`/`VStack` + `background` + `cornerRadius` + `shadow`
- Android(Compose)：`Card`
- 适配：iOS 无 1:1，语义 = 表面容器 + 圆角 + 阴影，用 token 组合。

### List / ListItem
- Vue(Element Plus)：`el-table` / `el-list`
- React(Ant Design)：`<List>`
- Flutter：`ListView.builder` + 自实现行
- iOS(SwiftUI)：`List` + `Section`
- Android(Compose)：`LazyColumn` + `Card`/`Row`
- 适配：语义 = 数据行集合；移动端优先无限滚动，桌面端分页。

### Avatar
- Vue(Element Plus)：`el-avatar`
- React(Ant Design)：`<Avatar>`
- Flutter：`CircleAvatar`
- iOS(SwiftUI)：`AsyncImage` + `Circle` + `clipShape`
- Android(Compose)：自实现（`AsyncImage`/`Glide` + `clip(CircleShape)`）

### NavBar（顶部导航）
- Vue(Element Plus)：自实现 / `el-page-header`
- React(Ant Design)：`Layout` + `Header`
- Flutter：`AppBar`
- iOS(SwiftUI)：`NavigationStack` + `.navigationTitle` + `.navigationBarBackButtonHidden`
- Android(Compose)：`TopAppBar`
- 适配：语义 = 顶部栏 + 标题 + 返回；iOS 用系统导航栏以对齐系统手势。

### TabBar（底部）
- Vue(Element Plus)：`el-tabs`（底部模式）或自实现
- React(Ant Design)：`<Tabs>` 或路由底栏
- Flutter：`BottomNavigationBar` / `NavigationBar`
- iOS(SwiftUI)：`TabView`
- Android(Compose)：`NavigationBar` + `NavigationBarItem`
- 适配：桌面端常无底部 TabBar → 移到顶部或侧边。

### SegmentedControl
- Vue(Element Plus)：`el-radio-group`（button 样式）
- React(Ant Design)：`<Segmented>`
- Flutter：`SegmentedButton`
- iOS(SwiftUI)：`Picker` + `.pickerStyle(.segmented)`
- Android(Compose)：`SingleChoiceSegmentedButtonRow`

### SearchBar
- Vue(Element Plus)：`el-input`（带搜索图标）
- React(Ant Design)：`<Input.Search>`
- Flutter：`SearchBar` / `SearchAnchor`
- iOS(SwiftUI)：`.searchable`（挂 NavigationStack）
- Android(Compose)：`SearchBar`

### Modal / Dialog
- Vue(Element Plus)：`el-dialog`
- React(Ant Design)：`<Modal>`
- Flutter：`showDialog` + `AlertDialog`
- iOS(SwiftUI)：`.alert` / `.sheet` / `fullScreenCover`
- Android(Compose)：`AlertDialog` / `Dialog`
- 适配：语义 = 阻断性弹窗；确认/取消按钮文案按弹窗语义命名。

### BottomSheet
- Vue(Element Plus)：`el-drawer`
- React(Ant Design)：`<Drawer>`
- Flutter：`showModalBottomSheet`
- iOS(SwiftUI)：`.sheet` + `presentationDetents([.medium, .large])`
- Android(Compose)：`ModalBottomSheet`

### Toast
- Vue(Element Plus)：`ElMessage` / `ElNotification`
- React(Ant Design)：`message` API
- Flutter：`SnackBar` 或自实现 overlay
- iOS(SwiftUI)：自实现 overlay（无系统 1:1）
- Android(Compose)：`SnackbarHost` / `Toast`
- 适配：语义 = 轻提示；文案短、自动消失；不用组件库 API 时可自实现。

### Empty
- Vue(Element Plus)：`el-empty`
- React(Ant Design)：`<Empty>`
- Flutter：自实现（`Column` + 图标 + 文案 + 可选 CTA）
- iOS(SwiftUI)：`ContentUnavailableView`（iOS 17+）或自实现
- Android(Compose)：自实现

### Skeleton
- Vue(Element Plus)：`el-skeleton`
- React(Ant Design)：`<Skeleton>`
- Flutter：自实现 shimmer
- iOS(SwiftUI)：`.redacted(reason: .placeholder)`
- Android(Compose)：自实现 shimmer

### Spinner / Progress
- Vue(Element Plus)：`el-loading` / `el-progress`
- React(Ant Design)：`<Spin>` / `<Progress>`
- Flutter：`CircularProgressIndicator` / `LinearProgressIndicator`
- iOS(SwiftUI)：`ProgressView`
- Android(Compose)：`CircularProgressIndicator` / `LinearProgressIndicator`

### Divider
- Vue(Element Plus)：`el-divider`
- React(Ant Design)：`<Divider>`
- Flutter：`Divider`
- iOS(SwiftUI)：`Divider`
- Android(Compose)：`HorizontalDivider` / `VerticalDivider`

### Pagination
- Vue(Element Plus)：`el-pagination`
- React(Ant Design)：`<Pagination>`
- Flutter：自实现
- iOS(SwiftUI)：自实现
- Android(Compose)：自实现
- 适配：移动端多用无限滚动（LazyColumn 分页加载），桌面端保留分页控件。

### Carousel / Banner
- Vue(Element Plus)：`el-carousel`
- React(Ant Design)：`<Carousel>`
- Flutter：`PageView` + 指示器
- iOS(SwiftUI)：`TabView` + `.page` 样式
- Android(Compose)：`HorizontalPager`

### Grid
- Vue(Element Plus)：`el-row` / `el-col`（或 `el-grid`）
- React(Ant Design)：`<Row>` / `<Col>`
- Flutter：`GridView`
- iOS(SwiftUI)：`LazyVGrid` / `LazyHGrid`
- Android(Compose)：`LazyVerticalGrid`
- 适配：语义 = 栅格布局；列数/间距按 demo 语义记录，不写像素。

### FilterBar
- Vue(Element Plus)：自实现（`el-radio-group`/`el-checkbox-group` 横向排列）
- React(Ant Design)：自实现（`Space` + Tag/Segmented）
- Flutter：自实现（`SingleChildScrollView` + `Row` + Chip）
- iOS(SwiftUI)：自实现（`ScrollView(.horizontal)` + FilterChip）
- Android(Compose)：自实现（`LazyRow` + FilterChip）
- 适配：语义 = 筛选项横向排列；移动端可横向滚动。

### Tooltip
- Vue(Element Plus)：`el-tooltip`
- React(Ant Design)：`<Tooltip>`
- Flutter：`Tooltip`
- iOS(SwiftUI)：`.help()`
- Android(Compose)：自实现
- 适配：移动端无 hover → 常省略或改为长按/图标说明。

## 领域组件登记

> `specs-components` 提取到新领域组件时，按此模板追加。**语义与拼装是核心**——各端据此逐端手写；映射表只给拼装模式与参考，不逐端写代码（领域组件逐端形态差异大，写了反而漂移）。

### <组件名>（例：PropertyCard）
- 语义：<一句话，这个组件承载什么业务>
- 数据：<字段列表，含可选字段>
- 变体：<可选字段式变体 / 枚举变体>
- 状态：<default/选中/loading…>
- 拼装：<用哪些基础组件拼装>
- 各端实现：<Vue/React/Flutter/iOS/Android 各自要点；未知写"待实现"或引用参考样例>
