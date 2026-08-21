---
name: product-business
description: 基于 docs/product/sense.md 与 docs/product/demo/ 原型稿，用四色建模法梳理产品业务流程，输出 docs/product/business-flow.md。当用户想梳理业务流程、做产品层面建模、看清核心主脉络的流程时使用。
disable-model-invocation: true
---

# product-business

产品层面的业务流程建模。输入是 `/simple:demo` 的产物（sense.md + HTML 原型稿），输出 `docs/product/business-flow.md`。

## 前置依赖（先检查，缺失就停）

- 必须存在：`docs/product/sense.md`、`docs/product/demo/`（至少一个页面 HTML）。
- 若缺失，提示用户先运行 `/simple:demo` 生成这两样，然后结束，不空跑。

## 四色建模法（核心理念）

一句话：**一个什么样的人或物品，以某种角色，在某个时刻/时间段内，参与某个活动。**

- **什么样的** → DESC（描述原型）
- **人或物品** → PPT（参与方原型）
- **角色** → ROLE（角色原型）
- **某个时刻/时间段内的某个活动** → MI（时标原型 Moment-Interval）

本 skill 只把 **MI / PPT / ROLE** 体现到流程里，**DESC 按要求略过**，也不做进一步 DDD 分析。

## 建模流程

### Step 0 — 读输入，确认产品形态

1. 读 `docs/product/sense.md`，确认：**平台类型**、**最底层产品形态**（产品本质上是什么、核心对象是什么）、核心主脉络（28 定律那 20%）。
2. 读 `docs/product/demo/` 下的 HTML 原型稿（`page-*.html`、`index.html`），提取整体业务流程：用户从进入到获得价值的完整路径，以及页面之间的流转。

### Step 1 — 建立时标原型 MI

寻找**需要追溯的事件**：用户在做这件事的过程中，有哪些关键时刻/时间段留下了"足迹"（如：注册、下单、支付、提交、开始/完成某项活动、状态变更）。这些就是 MI。MI 是业务数据的锚点。

### Step 2 — 建立 PPT 原型

围绕 Step 1 的 MI，寻找**周围的人/事/物**：什么人、什么物品、什么地点在参与/支撑这些活动。丰富模型，让业务概念更完整。

### Step 3 — 建立角色原型 ROLE

从 PPT 中进一步**抽象出角色**：同一个 PPT 在不同流程/时刻可能承担不同角色，把可跨流程复用的角色抽象出来（如：一个"用户"PPT 可能是"下单人""支付人""发起人"等角色）。

### Step 4 — 描述原型 DESC

按要求**略过**：不单独展开 DESC，不进流程。

## 输出 `docs/product/business-flow.md`

`mkdir -p docs/product`。若文件已存在，先问用户：覆盖 / 备份后替换 / 另存。按以下模板组织（缺失项标注"待定"）：

    # <产品名> 业务流程建模（四色建模法）

    - 来源：`docs/product/sense.md`、`docs/product/demo/`
    - 方法：四色建模法（MI / PPT / ROLE），DESC 按需求略过，不做 DDD 分析
    - 平台：<从 sense.md 确认>
    - 最底层产品形态：<从 sense.md 确认>

    ## 一、业务流程梳理

    <从 demo 原型稿梳理出的整体业务流程，以"核心主脉络"为主线，分阶段/步骤列出；每一步说明谁做什么、页面流转到哪>

    （可选：用 mermaid 画一张主流程 flowchart，GitHub 上可渲染）

    ## 二、四色建模元素

    ### 1. 时标原型 MI（Moment-Interval）

    | MI | 发生什么 | 触发/结束 | 追溯意义 |

    ### 2. 参与方原型 PPT（Party / Place / Thing）

    | PPT | 类型（人/物/地点） | 参与的 MI |

    ### 3. 角色原型 ROLE（Role）

    | ROLE | 对应 PPT | 可参与的流程/MI |

    ### 4. 描述原型 DESC

    按要求略过（此节占位说明即可）。

    ## 三、流程 × 四色元素映射

    <把 MI / PPT / ROLE 织入业务流程——这一步是"元素体现到流程"的核心>

    | 流程步骤 | 参与方（PPT） | 角色（ROLE） | 时标（MI） |

    ## 四、关键追溯点（足迹锚点）

    <列出一、二、三中需要被记录/追溯的 MI——它们是后续设计数据与接口协议时的锚点>

## 完成后

- 报告 `docs/product/business-flow.md` 路径。
- 用 `AskUserQuestion` **确认一次**（不做 grilling 式逐项追问）：确认用户是否已阅读该文件、对产品理解是否有偏差。选项示例：`已阅读，无偏差` / `已阅读，有偏差` / `还没读`。
- 按回答分支处理：
  - **有偏差** → 不逐项发问；提示用户直接在对话中说明偏差点，双方以对话方式探讨并修订 `business-flow.md`，探讨结束后收尾。
  - **无偏差 / 还没读** → 直接收尾。
- **收尾（固定）**：结束本 skill，并提示用户——本会话上下文可能已较长，建议用 `/new` 开启新会话以控制上下文，然后**手动**执行 `product-glossary`；**切勿自动帮用户跳转下一步**。
