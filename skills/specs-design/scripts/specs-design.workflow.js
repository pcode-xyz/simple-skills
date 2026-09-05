// specs-design.workflow.js — 逐页提取设计元素生成 DESIGN.md（仅每页模式 3B），单阶段并行
// 由 /simple:specs-design 调用（用户选「每页一份」时）：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// 3A（单一 DESIGN.md）仍走单个 subagent，不使用本 workflow。
// args = { pages:[页面名], demoDir, cssPath?, senseMd, outDir, actions?, templates:{design} }
export const meta = {
  name: 'specs-design-workflow',
  description: '逐页提取设计元素生成 DESIGN.md（每页模式）',
  phases: [{ title: '提取' }],
}

// ---- args 校验 ----
const required = ['pages', 'demoDir', 'senseMd', 'outDir', 'templates']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `specs-design-workflow args 缺失: ${missing.join(', ')}` }

const tpl = args.templates
const skipGen = (p) => args.actions && args.actions[p] === 'skip'

// ---- schema ----
const DESIGN_RESULT = {
  type: 'object',
  properties: {
    page: { type: 'string' },
    path: { type: 'string' },
    token_groups: { type: 'array', items: { type: 'string' } },
  },
  required: ['page', 'path'],
}

// ---- prompt 构造 ----
function pagePrompt(page) {
  const styleSource = args.cssPath
    ? `独立 CSS：${args.cssPath}`
    : '内联样式：从本页 `<style>` 提取共享令牌（无独立 CSS 文件）'
  const tplDesign = tpl.design
    .replace(/<共享样式来源>/g, styleSource)
    .replace(/<页面>/g, page)
    .replace(/<文件名>/g, `DESIGN-${page}.md`)
  return `你是资深视觉设计师兼前端工程师，熟悉 design.md 规范（Google Labs 定义的设计系统描述格式）。请从 demo 页面「${page}」提取设计元素，产出一份严格符合该规范的 DESIGN 文档，**只生成文档，不改任何页面 / 样式**。

## 项目信息
- 设计令牌基座：${styleSource}
- 本页 demo：${args.demoDir}/${page}.html（页面如何组合令牌、页面特有组件）
- 产品思考锚点：${args.senseMd}（品牌人格、目标受众、情绪基调）

## 执行方式
按下方「## 提取模板」的规范逐节执行：从共享样式（独立 CSS 或本页内联）提取共享令牌基座，从本页提取页面特有组件归入 components，Overview 描述本页语境；正文 prose 使用中文。

## 输出（两步，按顺序；不要省略）
1. **写交付文件**：写入 ${args.outDir}/DESIGN-${page}.md（先 mkdir -p ${args.outDir}），报告写入路径与文件大小。
2. **返回**（StructuredOutput）：{ page, path, token_groups }（token_groups = frontmatter 里出现的令牌组名数组，如 ["colors","typography","components"]）。

## 提取模板
${tplDesign}`
}

// ---- 执行（单阶段并行，无屏障）----
phase('提取')
const todo = (args.pages || []).filter((p) => !skipGen(p))
const results = await parallel(
  todo.map((page) => () => agent(pagePrompt(page), { label: `提取:${page}`, phase: '提取', schema: DESIGN_RESULT }))
)

const ok = results.filter((r) => r && r.path)
const failed = results.map((r, i) => (r ? null : todo[i])).filter(Boolean)
const skippedByAction = (args.pages || []).filter((p) => skipGen(p))

log(`页提取完成：${ok.length}/${todo.length} 页`)
return { reviewed: ok.map((r) => ({ page: r.page, token_groups: r.token_groups || [] })), failed, skippedByAction }
