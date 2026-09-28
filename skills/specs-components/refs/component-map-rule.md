# 组件映射表（component-map-rule）

> 规范组件 → 各端渲染配方**库**。**唯一存放平台知识的地方。**
>
> - 使用约定：`COMPONENTS.md` 与 page-UCS 组件树只写**规范组件名**；`do-page` 实现时据此表查配方。
> - **本文件是配方库，不是项目产物**：`specs-components` 按项目 `tech-stack-rule.md` 声明的端**裁剪**出项目副本 `docs/specs/design/component-map-rule.md`。裁剪 = 保留项目端行 + 删其余端行；**项目副本里不得残留未选端的任何字样**，含跨端比较语（"移动端…桌面端…"、"iOS 无 1:1"）。
> - 封闭 taxonomy：本表没有的**基础**组件名禁止出现。新增**领域**组件走文末"领域组件登记"；新增**基础**组件走"taxonomy 扩收通道"。
> - **`###` 标题只能是组件名**：切片脚本 `slice-page.py` 以 `re.split(r"\n### ")` 作为唯一的组件边界信号，且 `clean_name()` 会剥掉标题里的全角 `（…）`——端信息上标题会与同名节互相吞并，头部出现 `### xxx` 还会污染"未找到配方"告警。端信息一律写节内行；本文件头部只用 `##` / `####`。
> - 维护本表时按**已有端各自**补行；某端确实不适用（移动端无 hover），该端行写 `N/A + 理由`，不留空。

## taxonomy 扩收通道

默认基础组件名 = 本表已有节。项目里出现本表没有的基础组件时（实例：demo 用了浏览器原生 `<input type="date">`，而表内原无 DatePicker）：

1. **按项目实际端**逐端补配方（**不是**要求所有端齐活）——照"端行撰写规则"；
2. 把新组件名**连各端行回写本表**，下次项目直接复用；
3. 走扩收通道新增基础组件**不算**违反封闭 taxonomy——本通道即为此设。

## 端行撰写规则（密度要求）

每端一行，自包含：**该端落到什么 + 该端怎么适配**。判据：

- **有 1:1**：写控件/原语名 + 关键参数（如 `Pressable` + `hitSlop` 补触区）。
- **无 1:1**：三要素写全——① 为什么无对应物（含 demo 实际用的原语）② 自建形态（原语组合 + 关键 prop）③ 是否必须复刻 demo 形态。
- **本质 N/A**：写 `N/A + 理由`（如 `Tooltip` 在无 hover 的端 = N/A，降级为 `accessibilityHint`）。
- **禁止**端行以裸"自建"/"无对应物"收尾——必须跟出原语组合，或显式 `N/A + 理由`。
- **能力槽 `{slot:<能力>}`**：某能力"用哪个依赖"由项目技术选型决定、不由本表决定时（列表虚拟化 / 图片 / 图标 / 手势动画 / 毛玻璃 / 导航 / SVG / Markdown…），端行写 `{slot:list}` 这样的占位，物化时按 `tech-stack-rule.md` 的技术栈总览表**回填**为项目实际依赖，并在项目副本头部的 `## 能力槽` 表里登记。**回填不到的槽必须问用户或标"待定"，不得沉默留空**（最常见的缺口是图标槽）。

## 端级纪律

按端分列。项目副本**只保留项目端那一份**——`slice-page.py` 会把「基础组件」标题之前的全部内容（`mhead`）原样透传进每份 `.slice/<页面>-map.md`，故端级纪律放头部即可被每个 subagent 读到，**不要逐组件重复**。

> **头部正文不要内联写「基础组件」「领域组件登记」两个字面标题**（写成 `「基础组件」` 这种引号形式）：切片脚本按**行首**精确匹配这两个标题，若正文里的标题字样恰好顶到行首，会被误判成真正的分区标题、切坏 `mhead`。

#### Vue3 + Element Plus

- hover 可用；按压/激活态用 Element 内置态，不自造。
- `backdrop-filter` 毛玻璃直接用。
- 深色主题按 Element 的 `dark` 变量模式整体切换，勿逐处改色值。
- token 先映射到 `--el-*` 变量，再落到 DESIGN token。

#### React + Ant Design

- hover 可用；按压态用 AntD 组件态。
- `backdrop-filter` 毛玻璃直接用。
- 深色主题用 `ConfigProvider` 的 `algorithm` + DESIGN `dark-*` 令牌。
- token 映射到 AntD `theme.token`。

#### React Native

- **无 hover**：按压反馈用 `pressed`（scale .94–.99 + 背景 `{colors.surface-2}` / `{colors.primary-soft}`）；长按替代右键。
- **毛玻璃**：RN 无内置毛玻璃；用头部「能力槽」指定的模糊依赖，无该依赖时降级为半透明底 + 描边。
- **深色主题**：`useColorScheme()` + DESIGN 的 `dark-*` 语义令牌整体替换，勿逐处改色值。
- **安全区与悬浮层避让**：`react-native-safe-area-context`；AI rail / 树浮层 / 建议卡 / 底部操作栏避让安全区与底部 TabBar。
- **token 直取**：样式值一律取自 `core/theme/tokens.ts`（DESIGN.md 的代码对应物），不写裸像素。
- **阴影双写**：iOS 用 `shadowColor/shadowOffset/shadowOpacity/shadowRadius`，Android 用 `elevation`。

#### Flutter（Material 3）

- **无 hover**：`InkWell` 水波纹 / pressed 态。
- **毛玻璃**：`BackdropFilter`。
- **深色主题**：`ThemeData.dark` + `ColorScheme`。
- 滚轮/弹层优先用 Material 内置形态，不自造。

#### iOS（SwiftUI）

- **无 hover**：`.buttonStyle` 按压态；`LongPressGesture` 替代右键。
- **毛玻璃**：`.ultraThinMaterial`。
- **深色主题**：`@Environment(\.colorScheme)` + `Color(.systemBackground)` 等语义色。
- **系统手势对齐**：导航用 `NavigationStack` 系统导航栏，以对齐系统返回手势。
- 参考实现模式（仅参考）：github.com/Meliwat/awesome-ios-design-md（DESIGN-swiftui.md）。

#### Android（Compose + Material 3）

- **无 hover**：`interactionSource` 的 pressed 态。
- **毛玻璃**：自实现模糊（`RenderEffect`，API 31+）或半透明 + 描边。
- **深色主题**：`dynamicDarkColorScheme` / `darkColorScheme`。
- **系统栏内距**：`Scaffold` + `WindowInsets` 处理状态栏/导航栏。

## 基础组件

### Button
- Vue(Element Plus)：`el-button`，type=primary/default/danger，size=default/large/small
- React(Ant Design)：`<Button type="primary">`
- React Native：`Pressable` + `Text`（RN core 无按钮样式，底色/圆角/内距全走 token）；按压态用 `style={({pressed}) => [...]}` 内联置换，**不需动画库**；loading = `disabled` + `ActivityIndicator`。
- Flutter：`FilledButton` / `OutlinedButton` / `TextButton`（按变体）
- iOS(SwiftUI)：`Button` + `.buttonStyle(.borderedProminent/.bordered/.borderless)` + `.tint`
- Android(Compose)：`Button` / `OutlinedButton` / `TextButton`（按变体）
- 适配：按压态用 isPressed 动画；loading 变体需自处理（禁用 + spinner）。

### IconButton
- Vue(Element Plus)：`el-button :icon` 或 `<el-icon>` 包裹
- React(Ant Design)：`<Button icon={<Icon/>}>` 或 `shape="circle"`
- React Native：`Pressable` + `{slot:icon}`（RN core 无图标）；用 `hitSlop` 补触区——视觉 36×36 时触区至少 44×44。
- Flutter：`IconButton`
- iOS(SwiftUI)：`Button` + `Image(systemName:)`
- Android(Compose)：`IconButton`

### Input
- Vue(Element Plus)：`el-input`
- React(Ant Design)：`<Input>`
- React Native：`TextInput`（core）；`placeholderTextColor` 取 `{colors.on-surface-3}`；focus 态用 `onFocus/onBlur` + 边框 token 自接（core 无状态色）。
- Flutter：`TextField` + `InputDecoration`
- iOS(SwiftUI)：`TextField` + `.textFieldStyle(.roundedBorder)`
- Android(Compose)：`OutlinedTextField` / `BasicTextField`
- 适配：状态色（成功/错误）各端用 theme 或边框/底色表达。

### Textarea
- Vue(Element Plus)：`el-input type="textarea"`
- React(Ant Design)：`<Input.TextArea>`
- React Native：`TextInput` + `multiline` + `maxHeight`/`numberOfLines`；Android 需 `textAlignVertical: 'top'` 才顶部对齐。
- Flutter：`TextField` + `maxLines: null`
- iOS(SwiftUI)：`TextField` + `axis: .vertical`
- Android(Compose)：`OutlinedTextField` + `maxLines`

### Select / Picker
- Vue(Element Plus)：`el-select`
- React(Ant Design)：`<Select>`
- React Native：core 无下拉 → `{slot:picker}`（如 `@react-native-picker/picker`）或自建：`Pressable` 触发 + `Modal` + `{slot:list}` 选项列表。移动端惯例是**弹层列表**而非桌面下拉/滚轮。
- Flutter：`DropdownButtonFormField`
- iOS(SwiftUI)：`Picker` + `.pickerStyle(.menu/.wheel)`
- Android(Compose)：`ExposedDropdownMenuBox` / `DropdownMenu`

### Checkbox
- Vue(Element Plus)：`el-checkbox`
- React(Ant Design)：`<Checkbox>`
- React Native：自建——`Pressable` + `View`（选中填 `{colors.primary}` + 白勾，勾用 `{slot:svg}` 或图标）；core 无 Checkbox。
- Flutter：`Checkbox`
- iOS(SwiftUI)：`Toggle`
- Android(Compose)：`Checkbox`

### Radio
- Vue(Element Plus)：`el-radio-group` + `el-radio`
- React(Ant Design)：`<Radio.Group>` + `<Radio>`
- React Native：自建——`Pressable` + `View`（半圆描边 + 选中内点）；core 无 Radio。
- Flutter：`Radio` / `RadioListTile`
- iOS(SwiftUI)：`Picker` 或自实现
- Android(Compose)：`RadioButton`

### Switch
- Vue(Element Plus)：`el-switch`
- React(Ant Design)：`<Switch>`
- React Native：`Switch`（core 内置）；`trackColor` / `thumbColor` / `ios_backgroundColor` 走 token。
- Flutter：`Switch`
- iOS(SwiftUI)：`Toggle`
- Android(Compose)：`Switch`

### Slider
- Vue(Element Plus)：`el-slider`
- React(Ant Design)：`<Slider>`
- React Native：core 已移出 → `{slot:slider}`（如 `@react-native-community/slider`）；自建则为 `View` 轨道 + 圆点（用手势，非 `PanResponder`），值变回调驱动。
- Flutter：`Slider`
- iOS(SwiftUI)：`Slider`
- Android(Compose)：`Slider`

### Stepper
- Vue(Element Plus)：`el-input-number`
- React(Ant Design)：`<InputNumber>`
- React Native：自建——`View` 横排 = 减 `Pressable` + `TextInput`（`keyboardType="numeric"`）+ 加 `Pressable`；边界值禁用对应钮。
- Flutter：自实现（`Row` + 加减按钮 + 数字）
- iOS(SwiftUI)：`Stepper`
- Android(Compose)：自实现

### Badge
- Vue(Element Plus)：`el-badge`
- React(Ant Design)：`<Badge>`
- React Native：自建——`View` 圆角容器 + `Text`；角标（叠在子元素上）用 `position: 'absolute'` + 负偏移。
- Flutter：`Badge`
- iOS(SwiftUI)：自实现（`ZStack` + `Text` capsule）或 `Badge`（iOS 17+）
- Android(Compose)：`Badge` / `BadgeBox`

### Tag / Chip
- Vue(Element Plus)：`el-tag`
- React(Ant Design)：`<Tag>`
- React Native：自建——`View` 胶囊（`borderRadius` 取半高）+ `Text`；可选中态直接填选中底/字色（`{components.chip-active}`），**无库变体可用**。
- Flutter：`Chip` / `FilterChip`（可选中态用后者）
- iOS(SwiftUI)：自实现（`Text` + capsule 背景）或 `LabeledContent`
- Android(Compose)：`AssistChip` / `FilterChip` / `SuggestionChip`

### Card
- Vue(Element Plus)：`el-card`
- React(Ant Design)：`<Card>`
- React Native：`View` + token（底色/圆角/阴影/内距）；阴影按端级纪律双写。
- Flutter：`Card`
- iOS(SwiftUI)：`ZStack`/`VStack` + `background` + `cornerRadius` + `shadow`
- Android(Compose)：`Card`
- 适配：语义 = 表面容器 + 圆角 + 阴影，用 token 组合。

### List / ListItem
- Vue(Element Plus)：`el-table` / `el-list`
- React(Ant Design)：`<List>`
- React Native：`{slot:list}`（按技术选型回填，如 FlashList；未定时用 `FlatList`）+ 行容器 `Pressable`/`View`；`keyExtractor` 必须稳定；翻页用 `onEndReached` 无限滚动。
- Flutter：`ListView.builder` + 自实现行
- iOS(SwiftUI)：`List` + `Section`
- Android(Compose)：`LazyColumn` + `Card`/`Row`
- 适配：语义 = 数据行集合（不是表格）。

### Avatar
- Vue(Element Plus)：`el-avatar`
- React(Ant Design)：`<Avatar>`
- React Native：`{slot:image}` + `borderRadius` 取半宽（圆形）；无图时 `Text` 首字兜底。
- Flutter：`CircleAvatar`
- iOS(SwiftUI)：`AsyncImage` + `Circle` + `clipShape`
- Android(Compose)：自实现（`AsyncImage`/`Glide` + `clip(CircleShape)`）

### NavBar（顶部导航）
- Vue(Element Plus)：自实现 / `el-page-header`
- React(Ant Design)：`Layout` + `Header`
- React Native：`{slot:nav}` 的 native-stack header（`options.title` / `headerLeft` / `headerRight`）；自绘则 `SafeAreaView` 顶部内距 + `View`。
- Flutter：`AppBar`
- iOS(SwiftUI)：`NavigationStack` + `.navigationTitle` + `.navigationBarBackButtonHidden`
- Android(Compose)：`TopAppBar`
- 适配：语义 = 顶部栏 + 标题 + 返回。

### TabBar（底部）
- Vue(Element Plus)：`el-tabs`（底部模式）或自实现
- React(Ant Design)：`<Tabs>` 或路由底栏
- React Native：`{slot:nav}` 的 bottom-tabs；自绘则 `View` + `SafeAreaView` 底部内距 + `{slot:icon}`。
- Flutter：`BottomNavigationBar` / `NavigationBar`
- iOS(SwiftUI)：`TabView`
- Android(Compose)：`NavigationBar` + `NavigationBarItem`
- 适配：语义 = 全局一级导航。

### SegmentedControl
- Vue(Element Plus)：`el-radio-group`（button 样式）
- React(Ant Design)：`<Segmented>`
- React Native：自建——`View` 横排分片 + `Pressable` 逐片染色；要滑动指示块时用 `{slot:gesture}` 做 `translateX`。
- Flutter：`SegmentedButton`
- iOS(SwiftUI)：`Picker` + `.pickerStyle(.segmented)`
- Android(Compose)：`SingleChoiceSegmentedButtonRow`

### SearchBar
- Vue(Element Plus)：`el-input`（带搜索图标）
- React(Ant Design)：`<Input.Search>`
- React Native：`TextInput` + 前置 `{slot:icon}` + 清除钮 `Pressable`；键盘 `returnKeyType="search"`。
- Flutter：`SearchBar` / `SearchAnchor`
- iOS(SwiftUI)：`.searchable`（挂 NavigationStack）
- Android(Compose)：`SearchBar`

### DatePicker
- Vue(Element Plus)：`el-date-picker`（`type="date"` / `type="daterange"`）
- React(Ant Design)：`<DatePicker>`
- React Native：core 无对应物（demo 用的是浏览器原生 `<input type="date">`）→ `{slot:date}`（如 `@react-native-community/datetimepicker`，调起系统日历）或自建三列滚轮（`{slot:list}` × 3 + `snapToInterval` 吸附）；**不必复刻 demo 的浏览器控件形态**，移动端用系统日期选择器即可。
- Flutter：`showDatePicker`（Material 日历对话框）
- iOS(SwiftUI)：`DatePicker` + `.datePickerStyle(.wheel / .graphical)`
- Android(Compose)：`DatePickerDialog` + `DatePicker`（Material3）

### Modal / Dialog
- Vue(Element Plus)：`el-dialog`
- React(Ant Design)：`<Modal>`
- React Native：`Modal`（core，`transparent` + `animationType`）；Android 返回键必须接 `onRequestClose` 否则无法关闭。
- Flutter：`showDialog` + `AlertDialog`
- iOS(SwiftUI)：`.alert` / `.sheet` / `fullScreenCover`
- Android(Compose)：`AlertDialog` / `Dialog`
- 适配：语义 = 阻断性弹窗；确认/取消按钮文案按弹窗语义命名。

### BottomSheet
- Vue(Element Plus)：`el-drawer`
- React(Ant Design)：`<Drawer>`
- React Native：core 无 → 自建：`Modal` + `animationType="slide"` 保底；要拖拽吸附则 `{slot:gesture}` 做 `translateY` + 吸附点。
- Flutter：`showModalBottomSheet`
- iOS(SwiftUI)：`.sheet` + `presentationDetents([.medium, .large])`
- Android(Compose)：`ModalBottomSheet`

### Toast
- Vue(Element Plus)：`ElMessage` / `ElNotification`
- React(Ant Design)：`message` API
- React Native：自建 overlay——绝对定位 `View` + `{slot:gesture}` 淡入淡出；**不用** `ToastAndroid`（仅 Android、样式不可控）。
- Flutter：`SnackBar` 或自实现 overlay
- iOS(SwiftUI)：自实现 overlay（无系统 1:1）
- Android(Compose)：`SnackbarHost` / `Toast`
- 适配：语义 = 轻提示；文案短、自动消失。

### Empty
- Vue(Element Plus)：`el-empty`
- React(Ant Design)：`<Empty>`
- React Native：自建——`View` + `{slot:icon}` + `Text` + 可选 `Pressable` CTA；core 无空态组件。
- Flutter：自实现（`Column` + 图标 + 文案 + 可选 CTA）
- iOS(SwiftUI)：`ContentUnavailableView`（iOS 17+）或自实现
- Android(Compose)：自实现

### Skeleton
- Vue(Element Plus)：`el-skeleton`
- React(Ant Design)：`<Skeleton>`
- React Native：自建——`View` 灰块（`{colors.surface-2}`）+ `{slot:gesture}` 循环透明度/位移；shimmer 渐变需 `{slot:svg}`，可选。
- Flutter：自实现 shimmer
- iOS(SwiftUI)：`.redacted(reason: .placeholder)`
- Android(Compose)：自实现 shimmer

### Spinner / Progress
- Vue(Element Plus)：`el-loading` / `el-progress`
- React(Ant Design)：`<Spin>` / `<Progress>`
- React Native：`ActivityIndicator`（core，转圈）；线性进度自建——`View` 轨道 + 内层 `View` 按百分比设宽。
- Flutter：`CircularProgressIndicator` / `LinearProgressIndicator`
- iOS(SwiftUI)：`ProgressView`
- Android(Compose)：`CircularProgressIndicator` / `LinearProgressIndicator`

### Divider
- Vue(Element Plus)：`el-divider`
- React(Ant Design)：`<Divider>`
- React Native：自建——`View` + `{height: 1}`（纵向为 `width: 1`）+ `{colors.line}`；core 无 Divider。
- Flutter：`Divider`
- iOS(SwiftUI)：`Divider`
- Android(Compose)：`HorizontalDivider` / `VerticalDivider`

### Pagination
- Vue(Element Plus)：`el-pagination`
- React(Ant Design)：`<Pagination>`
- React Native：N/A —— 移动端一律无限滚动（`{slot:list}` 的 `onEndReached`），不复刻分页控件；demo 若出现分页控件按此降级并向用户说明。
- Flutter：自实现
- iOS(SwiftUI)：自实现
- Android(Compose)：自实现
- 适配：语义 = 数据量分页导航（不是无限滚动）。

### Carousel / Banner
- Vue(Element Plus)：`el-carousel`
- React(Ant Design)：`<Carousel>`
- React Native：`{slot:list}` 横向（`horizontal` + `pagingEnabled` + `snapToInterval`）+ 指示点自绘 `View`。
- Flutter：`PageView` + 指示器
- iOS(SwiftUI)：`TabView` + `.page` 样式
- Android(Compose)：`HorizontalPager`

### Grid
- Vue(Element Plus)：`el-row` / `el-col`（或 `el-grid`）
- React(Ant Design)：`<Row>` / `<Col>`
- React Native：`{slot:list}` 的 `numColumns`，或 `View` + `flexWrap: 'wrap'` + 子项百分比宽度；列数按 demo 语义。
- Flutter：`GridView`
- iOS(SwiftUI)：`LazyVGrid` / `LazyHGrid`
- Android(Compose)：`LazyVerticalGrid`
- 适配：语义 = 栅格布局；列数/间距按 demo 语义记录，不写像素。

### FilterBar
- Vue(Element Plus)：自实现（`el-radio-group`/`el-checkbox-group` 横向排列）
- React(Ant Design)：自实现（`Space` + Tag/Segmented）
- React Native：自建——横向 `ScrollView`（`horizontal` + `showsHorizontalScrollIndicator={false}`）+ Tag/Chip 组。
- Flutter：自实现（`SingleChildScrollView` + `Row` + Chip）
- iOS(SwiftUI)：自实现（`ScrollView(.horizontal)` + FilterChip）
- Android(Compose)：自实现（`LazyRow` + FilterChip）
- 适配：语义 = 筛选项横向排列；窄屏可横向滚动。

### Tooltip
- Vue(Element Plus)：`el-tooltip`
- React(Ant Design)：`<Tooltip>`
- React Native：N/A —— 无 hover；降级为 `accessibilityHint`、长按提示或页面内文案说明，不复刻悬浮气泡。
- Flutter：`Tooltip`
- iOS(SwiftUI)：`.help()`
- Android(Compose)：自实现
- 适配：语义 = 悬浮说明（依赖 hover 能力）。

## 领域组件登记

> `specs-components` 提取到新领域组件时，按此模板追加。**语义与拼装是核心**——各端据此逐端手写；映射表只给拼装模式与参考，不逐端写代码（领域组件逐端形态差异大，写了反而漂移）。

### <组件名>（例：PropertyCard）
- 语义：<一句话，这个组件承载什么业务>
- 数据：<字段列表，含可选字段>
- 变体：<可选字段式变体 / 枚举变体>
- 状态：<default/选中/loading…>
- 拼装：<用哪些基础组件拼装>
- 各端实现：<**按项目实际端**逐端列；落了代码的写实现路径，未实现的端写"待实现"；单端项目就是一行>
