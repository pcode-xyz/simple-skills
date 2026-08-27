# demo · Phase 2（HTML 生成）

> 这是 demo skill 的 Phase 2，由主 `SKILL.md` 在 Phase 1 完成后指示 Read 载入；**Phase 1 阶段不载入**（Phase 1 纯对话推演，用不到 HTML 规则）。
> 一条线性流水线：**读 sense → 推荐 3 风格 → 用户确认 → 派 3 subagent 出预览 → 同屏对比 → 选定 → 定稿 3 页**。前 6 步「比风格」，最后一步「定稿」。

## 1. 读 sense.md

Read `docs/product/sense.md`，提取四样作为全部后续输入：

- **一句话定位 + 产品调性** → 风格推荐依据（Step 2）
- **核心主脉络** → 代表页与定稿核心页（Step 2、7）
- **核心用户旅程** → 定稿 3 页的页面对应（Step 7）

## 2. 定代表页 + 推荐 3 风格

**代表页**：基于核心主脉络选一张最能代表产品的页（首页或核心功能页），作为 3 套风格对比的公共主题；其余页留到定稿。

**推荐 3 风格**：从风格池按产品调性推荐 3 套，各给一句理由。风格池 16 套（slug 对应配方文件 `styles/<slug>.md`）：

| 风格 | slug | 适合调性 |
|------|------|----------|
| Apple 极简 | apple-minimal | 高端消费、iOS 概念、通用高端 |
| 简约现代 | minimal | 效率工具、B 端、通用 |
| 毛玻璃 | glass | 年轻向、AI、社交 |
| 高级感 | luxury | 金融、理财、会员 |
| 液态玻璃 | liquid-glass | 高端科技、AI、旗舰产品 |
| 安静奢华 | quiet-luxury | 高端品牌、理财、B 端旗舰 |
| 杂志质感 | editorial | 内容平台、生活方式、时尚 |
| 触觉立体 | volumetric | 消费、工具、年轻品质向 |
| 宝石色调 | jewel | 高端消费、会员、品牌精品 |
| 新拟态 | neumorphic | 工具、健康/冥想 |
| 霓虹赛博 | neon | 游戏、潮流、Web3 |
| 和风禅意 | zen | 文化、生活、手工 |
| 明快多彩 | playful | 儿童、社交、消费 |
| 手绘插画 | illustration | 教育、品牌、内容 |
| 复古纸张 | retro | 咖啡、书店、老字号 |
| 数据驾驶舱 | data | B 端、监控、分析 |

示例组合：金融产品 → quiet-luxury + data + liquid-glass（或 luxury + minimal）；年轻社交 → playful + glass + neon。

## 3. 用户确认（AskUserQuestion）

把推荐 3 套 + 理由摆给用户，问：按这 3 套试吗？

- 确认 → 进 Step 4
- 点名替换某套 → 换掉再进 Step 4
- 都不合适 → 回 Step 2 从**没试过的**风格再推 3 套（不直接自定义）；用户明确要自己定 → 自定义（附录 A 的 6 槽位补齐，配色从附录 B 自选，缺槽位先给推荐假设）

## 4. 派 3 个 subagent（全自主、零共享）

并行派 3 个 subagent（`Agent` 工具），每个只拿自己那套配方，互不可见——文案/结构/布局/CSS 各自发挥，比的是整体气质。每个 subagent 的输入模板：

```
1. 产品与主题：docs/product/sense.md + 代表页主题「<Step 2 定的主题>」
2. 风格配方：styles/<slug>.md（只读自己这份，不读其他风格）
3. 规则红线：rules/ai-tells.md + rules/guardrails.md（生成前必读并遵守）
4. 配色：palettes/ 下自选一个文件（按风格调性 + 产品调性），再从该文件配色表选**一行**落成设计令牌——只取一行，不混搭多行
5. 输出规格：
   - 写 preview-<slug>.html + css/preview-<slug>.css（如需交互再加 js/preview-<slug>.js；先 mkdir -p docs/product/demo/css docs/product/demo/js）
   - CSS/JS 独立文件，不内联：<link rel="stylesheet" href="css/preview-<slug>.css">；需要交互时 <script src="js/preview-<slug>.js">（JS 文件名带 slug，避免 3 个 subagent 写同一个 js/main.js 冲突；无交互可不写）
   - 不加设备壳/状态条；普通响应式页，尺寸由浏览器控制
   - 头部留 <!-- 由 /simple:demo 生成 -->
   - 自成设计令牌（:root 色板/字体栈/字号阶梯/间距/圆角/阴影/描边）+ 共享组件类（按钮/卡片/导航/标题区/栅格）
   - 严格按自己配方，禁止跨风格借视觉元素（字体/质感/情绪）
```

若对比时文案漂移干扰判断，主会话可锁定逐字文案、subagent 只改结构/CSS。

## 5. 同屏对比

`index.html` 用 iframe 把 3 个预览页并排，顶部说明栏标每套风格名 + 一句话特征；对比页自身用中性样式，不引入具体风格。

## 6. 选定风格（AskUserQuestion，单选）

从 3 套预览选一（附推荐）。「都不满意」→ 回 Step 2 从**没试过的**风格再推 3 套重试（重走 Step 3~6）；风格池穷尽或用户想自己定，才走自定义（附录 A）。

## 7. 定稿 3 页

用选定风格生成完整页面组，**沿用 Step 4 的生成规则**（含规则红线、输出规格），文件名换成 `page-0X.html` + `css/style.css` + `js/main.js`（此时只有一套风格，CSS/JS 统一为共享文件）：

- `page-01.html` ← 首页（定位/卖点）
- `page-02.html` ← 核心页（主脉络）
- `page-03.html` ← 价值页（行动/详情/CTA）

预览页与预览 CSS **保留**作风格参照（「为什么选这个风格」的留档）。

```
docs/product/demo/
├── index.html            ← 对比页：3 套风格同屏（保留）
├── preview-<slug>.html   ← 3 套风格预览（保留参照）
├── page-01.html          ← 首页 · 定稿风格
├── page-02.html          ← 核心页 · 定稿风格
├── page-03.html          ← 价值页 · 定稿风格
├── css/
│   ├── style.css         ← 定稿风格：设计令牌 + 共享组件
│   └── preview-<slug>.css  ← 预览风格（保留参照）
└── js/
    ├── main.js           ← 定稿共享交互（如需）
    └── preview-<slug>.js   ← 预览交互（保留参照，如有）
```

## 完成后

- 报告 `docs/product/sense.md`、`docs/product/demo/index.html`（风格对比页）与定稿页面路径，提示用户先看对比页选风格、再确认定稿页面。
- 提示下一步：后端视角运行 `product-business` 梳理业务流程；前端视角运行 `ucs-page` → `do-page`。
- 询问是否调整风格、增删页面或修改内容，可迭代。

## 附录 A：6 槽位模板与新增风格

**配方 = 6 槽位**（`styles/<slug>.md` 每段 prompt 都按它填；自定义风格、新增风格也用它；配色不在此列，一律从配色池自选）：

| # | 槽位 | 作用 | 反例（含糊）→ 正例（具体） |
|---|------|------|---------------------------|
| ① | 具名参考风格 | 激活模型训练数据里的风格记忆，其余细节自动补全 | 「现代风格」→「Apple 极简 / Liquid Glass / 时尚杂志版式」 |
| ② | 字体方向 | 指名衬线/无衬线/等宽 + 字体名 | 「优雅字体」→「SF Pro 风格系统无衬线」 |
| ③ | 质感词 | 阴影、圆角、间距、纹理、图标，给具体方向/数值 | 「细腻」→「1px 细边框、低模糊轻阴影、大圆角、大间距」 |
| ④ | 情绪词 | 编码色调与留白的坐标（宁静→低饱和、大留白） | 「好看」→「宁静、克制、安静、高端」 |
| ⑤ | 负向约束 | 显式剪掉模型最高频的翻车点 | （无）→「请勿添加时间/wifi 状态条、无需设备壳、不用默认蓝」 |
| ⑥ | 质量锚 | 给输出定档 | （无）→「作品集品质 / 出版物级 / 像真机」 |

**组装句式**（6 槽位拼成一段可投喂的话，配色另行从配色池自选）：

> 设计一款适用于{载体}的{①风格}界面（使用 html 展示，无需模拟设备外壳，请勿添加时间、wifi 等状态条，尺寸由浏览器控制）。
> 该界面应呈现出{④情绪}，采用{布局}。使用{③质感}、{构图}和{排版}。
> 保持风格{风格关键词}。
> 使用：{②字体}、{③质感逐项}、{⑤负向约束}、{⑥质量锚}

**新增风格**：`styles/` 下新建 `<slug>.md`（按 6 槽位填）+ Step 2 表格加一行。

## 附录 B：配色池与新增配色

共 7 套，每套一个文件 `palettes/<slug>.md`（设计说明 / 比例 / 适合行业 / 配色表）。**配色是唯一配色来源**：风格配方只定义风格，不含配色。文件内「配色表」每行是一套独立配色（同家族的不同质感），选**一行**落成令牌、不混搭。subagent 生成时先选文件再选行（主会话不逐套展示给用户）；用户点名某套时可引用 slug。

| 配色 | slug | 特点 | 常配风格 |
|------|------|------|----------|
| 低奢 | low-luxury | 低饱和同色系、哑光、克制的贵气 | quiet-luxury / luxury / editorial / minimal |
| 轻奢 | light-luxury | 中性底 + 降明度亮色，现代古典融合 | luxury / minimal / editorial |
| 松弛治愈 | relax-heal | 高明度低纯、牛奶感、暖大地色锚点 | zen / quiet-luxury / playful |
| 高热度多巴胺 | dopamine | 超高饱和强撞色、情绪化、社交友好 | playful / neon / glass |
| 意式经典 | italian-classic | 暖色高饱和、经典三原色点缀、中间色承载 | retro / editorial / luxury |
| 克制优雅 | restrained-elegance | 灰调复合色、哑光、安静高级 | quiet-luxury / minimal / zen |
| 碳灰撞色 | carbon-pop | 碳灰基底 + 高饱和亮色，信任感+创新力 | data / neon / luxury / minimal |

**新增配色**：`palettes/` 下新建 `<slug>.md`（设计说明 / 比例 / 适合行业 / 配色表）+ 上表加一行。
