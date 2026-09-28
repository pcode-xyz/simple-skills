---
name: do-page
description: 页面开发（执行型，仅写页面的端，subagent 会写真实页面代码）。主流程只做编排：盘点 page-UCS 与组件缺口、控制待办任务、最后整体构建并回填组件映射；每个页面由顺序逐一 subagent 按 page-UCS + demo + API 实现（组件按 component-map-rule.md 查配方、项目里没有的组件按 directory-rule 分层独立成文件、样式 token 从 DESIGN.md 取、dark/light 与 mock 跟已实现页面一致、先 mock 数据、单任务编译通过）。当用户要实现页面代码时使用。
disable-model-invocation: true
---

# do-page

按页面公约实现页面代码。**执行型——subagent 在项目里写真实页面代码。仅写页面的端适用**（前端 / App / 桌面端 / 小程序）。

> **主流程只做编排，不读业务 spec**（避免上下文超限）；spec 读取由各 subagent 自行完成。

## 前置依赖（先检查，缺失就停）

- **非后端**：读 `docs/standards/tech-stack-rule.md` 的"选型上下文"，若**端 = 后端**，提示此 skill 只服务写页面的端，结束。
- **接口明细目录按协议分支**（HTTP 与 gRPC 互斥，只生成其一）：
  - 存在 `docs/specs/API/` → 项目为 HTTP，接口明细目录 = `docs/specs/API/`；
  - 存在 `docs/specs/grpc/` → 项目为 gRPC，接口明细目录 = `docs/specs/grpc/`；
  - 两者皆无 → 接口明细缺失，提示先运行 `specs-api` 生成接口，结束；
  - 两者皆有 → 以 `docs/standards/tech-stack-rule.md` 选型上下文为准，或询问用户。
- 必须存在：`docs/specs/page-UCS/`（≥1 个页面公约）、`docs/product/demo/`（demo HTML）、`docs/standards/tech-stack-rule.md`（端/技术栈/构建命令）、接口明细目录（按上协议分支解析）。
- 建议存在：`docs/specs/design/COMPONENTS.md` 与 `docs/specs/design/component-map-rule.md`（规范组件清单 + **按项目端裁剪**的映射表，`specs-components` 产物；主流程按页派生切片给 subagent，缺失时组件名按 tech-stack-rule 的 UI 组件库行取值）、`docs/specs/design/DESIGN.md`（设计 token，样式具体值）、`docs/standards/directory-rule.md`（**Step 2 新建组件的落位依据**——缺它就无法确定基础组件 / 领域组件该放哪个目录）、`docs/standards/tools-rule.md`、项目代码已搭建（`do-directory` / `do-api` 产出）。
- 缺失必选项时，提示先运行对应 skill，结束。

## Step 1 — 盘点页面公约，生成待办/任务清单（主流程只做编排）

- 列出 `docs/specs/page-UCS/` 下所有页面，**报告总数**。
- 用 AskUserQuestion 请用户**排除无需实现的页面**（如预留、仅占位）。
- **盘点组件缺口**（用 Glob 对照目录，不读业务 spec）：比对 `directory-rule.md` 的组件目录树、目标项目里实际存在的组件文件、`COMPONENTS.md` 的规范组件清单，列出两类缺口并报告：
  - **空占位**：目录建了但没有实现文件（只剩 `.gitkeep`）——最易漏，因为目录存在会被误判成"已有"；
  - **已登记未实现**：`COMPONENTS.md` 里登记、项目里找不到实现的组件。
- 缺口按 `COMPONENTS.md` 的"使用页面"行**归入对应页面任务**（由该页 subagent 落地）。归属用 grep 只取缺口组件的 `使用页面：` 行，**不要把 COMPONENTS.md 整份读进主流程上下文**；**归不到任何页面的缺口单独交用户确认**——这类常是 `do-directory` 从 DESIGN.md 的 token 反推出来的空壳（token 是样式语言、未必该成为组件），确认后再决定建或删。
- 为每个待实现页面生成一个**待办/任务**：`任务N：<页面>.md → 实现页面`，得到**任务清单**。
- **用待办事项分别登记并跟进**每个任务。
- 确认目标项目根目录（默认当前工作目录）。

## Step 2 — 逐任务顺序执行（每任务一个 subagent，直接写页面）

按任务清单**顺序**逐一执行：每起一个 subagent 实现一个页面；该任务完成（subagent 报告编译通过）后再处理下一个。**不要并行、不要跳跃**——共享文件（路由、样式主题等，具体文件名以所选技术栈为准）靠顺序执行避免冲突。

主流程在起 subagent **前**先为该页生成**切片**（若 `docs/specs/design/COMPONENTS.md` 存在）：
- 跑确定性脚本 `slice-page.py`（Glob 定位 `**/skills/do-page/scripts/slice-page.py`，不硬编码缓存路径；在项目根运行 `python3 <脚本路径> <页面名>`），生成 `docs/specs/design/.slice/<页面>.md`（本页规范组件）与 `docs/specs/design/.slice/<页面>-map.md`（本页组件各端映射配方）。
- 脚本只读磁盘写文件，**不把全量 COMPONENTS.md / component-map-rule.md 读进主流程上下文**；subagent 只读切片，不读全量。
- **校验映射切片可用**（用 grep 抽查切片，不读入上下文）：看 `<页面>-map.md` 的基础组件区**有没有项目端的行**、头部有没有 `## 端级纪律`。若只有未选端行（如 RN 项目里通篇 Vue/Element、Ant Design、Flutter、SwiftUI、Compose）或头部缺 `## 端级纪律`，说明项目副本没按端裁剪 → 判定映射表不可用：报告 + 提示用户重跑 `specs-components`，本次让 subagent 走 prompt 的"映射表不可用"分支回退到 tech-stack-rule 的 UI 组件库行，**不要静默继续**（否则 subagent 会拿到五个错误框架的配方）。

每个 subagent 的 prompt 必须**自包含**（用 `templates/page-impl-prompt.md`，Glob 定位）：
- **由 subagent 自己读**：本页面公约 + demo HTML + tech-stack-rule（端/技术栈/构建命令）+ 本页组件切片 `docs/specs/design/.slice/<页面>.md` + 本页映射切片 `docs/specs/design/.slice/<页面>-map.md`（存在才读；无切片即 COMPONENTS.md 缺失，回退组件库）+ `docs/specs/design/DESIGN.md`（存在才读：设计 token）+ directory-rule + tools-rule + 相关接口明细（按前置检查解析出的接口明细目录下与页面数据相关的：HTTP → `docs/specs/API/` 的 yaml，gRPC → `docs/specs/grpc/` 的 proto；**prompt 里写具体路径**）+ docs/specs/data/struct.md（如存在）+ 已实现页面（dark/light、mock 惯例）。
- 按公约实现（URL / 数据源 / 组件树 / 组件调整 / 交互流）；组件名按映射切片 `.slice/<页面>-map.md` 查配方、样式 token 从 DESIGN.md 取；**本页用到而项目里没有的组件必须按 directory-rule 的分层独立成文件**（基础 → 通用组件目录，领域 → 跨 feature 复用目录），页面只 import、**不内联复刻**；映射表缺项目端行时回退 tech-stack-rule 的 UI 组件库行；dark/light 与 mock 与已实现一致；先 mock 数据；**单任务编译通过**。

主流程在每个 subagent 返回后只做**轻量校验**：确认该任务已实现、subagent 报告编译通过、**报回的新建组件清单（组件名 → 文件路径）路径落在 directory-rule 的组件分层内**（没有把组件实现内联在页面文件里）。失败则让该 subagent 修复。

## Step 3 — 全部完成后整体构建 + 回填组件映射

- 所有页面完成后，主流程在项目根跑一次**整体构建**（构建命令按项目形态判断，或从 tech-stack-rule 取一次），确认无回归。
- **回填 `docs/specs/design/component-map-rule.md`**：把各 subagent 报回的新建组件路径写进对应领域组件节的 `各端实现` 行（如 `- 各端实现：React Native ✔（\`<路径>\`）；其余端待实现`），只改项目端那一处。不回填的话下次运行仍读到"待实现"，又内联一遍，本轮等于白做。映射表缺失或未按端裁剪时跳过并提示。
- 完成后**删除** `docs/specs/design/.slice/` 目录。

## 完成后

- 报告：实现的页面清单（待办逐项状态）、整体构建结果。
- 提示：可本地跑起预览；调通后让 AI 把 mock 切换为正式接口。
