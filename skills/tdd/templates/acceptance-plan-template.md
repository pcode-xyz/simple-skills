# 业务 Happy Path 验收计划：<业务名>

> 规划 subagent 输出模板（Step 5.1）。按本骨架填充，落盘到 `docs/specs/acceptance-UCS/<模块>.md`（先 `mkdir -p docs/specs/acceptance-UCS`）。本文档是「未来自动验收」的固化契约（等同 UCS）：主 agent 只取下方「链路摘要表」向用户讲故事并做跟踪；Step 5.2 落地 subagent 与 Step 5.3 执行 subagent 各自读本文档明细。

## 来源
- 业务描述：`docs/product/sense.md`（必读）；有则 `docs/product/business-flow.md`
- 接口定义：`docs/specs/API/`、`docs/specs/ws/`、`docs/specs/data/`（按实际存在取）
- 约束：`docs/standards/tech-stack-rule.md`、`directory-rule.md`、`tools-rule.md`
- 不读 `docs/specs/*-UCS/`（逐接口验收用例，量大会撑爆上下文）；规划仅基于业务描述 + 接口定义聚合

## 生命周期（状态机 + 黄金路径）
- 状态机：<状态字段> 状态集={<…>}，合法转移 = <转移表 / 决策表>
- 黄金路径：<入口 → … → 终态>（终态即验收锚点：断言业务不变式）
- 判定点 / 分支：<决策节点 → 各走向分支，含是否纳入非成功终态>

## 链路摘要表（主 agent 讲故事 / 跟踪用）
| 链路 ID | 名称 | 入口类型 | 覆盖状态/分支 | 判定要点 |

## 链路明细

### 链路 L1：<名称>
- 入口类型：HTTP / WS / Task
- 入口接口：<HTTP path+method / AsyncAPI channel+publish/subscribe / proto RPC>
- 覆盖状态：<A → B → C，无状态省略>
- 覆盖分支：<分支名，无分支省略>
- 调用序列：
  1. <接口> 入参要点 → 预期 <中间状态/响应>
  2. <接口> 入参要点 → 预期 <中间状态/响应>
  ...
- 成功判定：<最终状态 + 响应断言 + 业务成功标准>
- 前置数据：<所需初始化 / DB 状态 / 前置接口回调>

### 链路 L2：<名称>
- …（同 L1）