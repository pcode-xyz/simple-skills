// ucs-page.workflow.js — 逐页生成页面用例规约（Page UCS），单阶段并行
// 由 /simple:ucs-page 调用：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// 前置：主进程已对每页跑 slice-components.py 生成 docs/specs/design/.slice/<页面>.md（确定性切片，不在本 workflow 内）。
// args = { pages:[页面名], demoDir, sliceDir, pageUcsDir, apiDir, techStackRule, designMd?, dirRule, toolsRule?, componentLibrary?, actions?, templates:{page} }
export const meta = {
  name: 'ucs-page-workflow',
  description: '逐页生成页面用例规约（Page UCS）',
  phases: [{ title: '生成' }],
}

// ---- args 校验 ----
const required = ['pages', 'demoDir', 'pageUcsDir', 'apiDir', 'techStackRule', 'dirRule', 'templates']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `ucs-page-workflow args 缺失: ${missing.join(', ')}` }

const tpl = args.templates
const skipGen = (p) => args.actions && args.actions[p] === 'skip'

// ---- schema ----
const PAGE_UCS_RESULT = {
  type: 'object',
  properties: {
    page: { type: 'string' },
    path: { type: 'string' },
    interfaces_used: { type: 'array', items: { type: 'string' } },
    slice_used: { type: 'boolean' },
  },
  required: ['page', 'path'],
}

// ---- prompt 构造 ----
function pagePrompt(page) {
  const tplPage = tpl.page.replace(/\{组件库\}/g, args.componentLibrary || '（以本页组件切片为准）')
  return `你是页面用例规约工程师。为页面「${page}」生成页面用例规约（Page UCS），**只生成文档，不改任何页面 / 接口**。

## 输入（读这些文件）
- 本页 HTML：${args.demoDir}/${page}.html
- 本页组件切片（存在才读）：${args.sliceDir}/${page}.md（组件名以它为准；不存在则回退下方模板的「{组件库}」= ${args.componentLibrary || '无切片，回退 tech-stack-rule 组件库'}）
- 页面用例规约模板（下方「## 页面模板」节）
- 接口明细：${args.apiDir}（本页数据相关接口）
- 设计 token（存在才读）：${args.designMd || 'docs/specs/design/DESIGN.md'}
- 技术选型：${args.techStackRule}
- 目录结构：${args.dirRule}
- 工具层（存在才读）：${args.toolsRule || 'docs/standards/tools-rule.md'}

## 生成要求
严格按页面模板结构逐节填写：URL / 数据源 / 组件树 / 组件调整 / 交互流。组件名以本页切片规范组件为准（无切片回退组件库），不写库外组件名；组件调整的颜色/字号/间距用 DESIGN.md token 引用，不写具体值；数据源接口名/路径以 ${args.apiDir} 为准、字段对齐；交互流覆盖页面加载（骨架屏/并行请求/失败重试·空态）、主操作（确认框/调用/成功失败处理）、边界场景（倒计时/重复提交/网络中断）。使用中文。

## 输出（两步，按顺序；不要省略）
1. **写交付文件**：写入 ${args.pageUcsDir}/${page}.md（先 mkdir -p ${args.pageUcsDir}），报告写入路径与文件大小。
2. **返回**（StructuredOutput）：{ page, path, interfaces_used, slice_used }。

## 页面模板
${tplPage}`
}

// ---- 执行（单阶段并行，无屏障）----
phase('生成')
const todo = (args.pages || []).filter((p) => !skipGen(p))
const results = await parallel(
  todo.map((page) => () => agent(pagePrompt(page), { label: `生成:${page}`, phase: '生成', schema: PAGE_UCS_RESULT }))
)

const ok = results.filter((r) => r && r.path)
const failed = results.map((r, i) => (r ? null : todo[i])).filter(Boolean)
const skippedByAction = (args.pages || []).filter((p) => skipGen(p))

log(`页处理完成：${ok.length}/${todo.length} 页`)
return { reviewed: ok.map((r) => ({ page: r.page, slice_used: r.slice_used })), failed, skippedByAction }
