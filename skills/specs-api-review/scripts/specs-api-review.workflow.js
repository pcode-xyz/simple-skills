// specs-api-review.workflow.js — 页面×接口满足度并行评审 → 聚合写 frontend-page-review.md
// 由 /simple:specs-api-review 调用：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// args = { pages:[页面名], demoDir, protocolDir, moduleFiles?, businessFlow?, rawDir, reportPath, templates:{page, aggregate} }
export const meta = {
  name: 'specs-api-review-workflow',
  description: '页面×接口满足度并行评审 → 聚合写 frontend-page-review.md',
  phases: [{ title: '评' }, { title: '聚' }],
}

// ---- args 校验：缺失直接返回错误对象（主循环能从通知读到可读错误，不 throw）----
const required = ['pages', 'demoDir', 'protocolDir', 'rawDir', 'reportPath', 'templates']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `specs-api-review-workflow args 缺失: ${missing.join(', ')}` }

const tpl = args.templates

// ---- schema ----
const PAGE_REVIEW = {
  type: 'object',
  properties: {
    page: { type: 'string' },
    interactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          position: { type: 'string' },
          trigger: { type: 'string' },
          action: { type: 'string' },
          state: { enum: ['covered', 'placeholder', 'pure_client', 'gap'] },
          interface: { type: 'string' },
          request_fields: { type: 'string' },
          expected_response_usage: { type: 'string' },
          call_shape: { type: 'string' },
          business_point: { type: 'string' },
          pain_point: { type: 'string' },
        },
        required: ['position', 'state'],
      },
    },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          interaction_ref: { type: 'string' },
          need: { type: 'string' },
          expected_request_response: { type: 'string' },
        },
        required: ['need'],
      },
    },
    placeholder_summary: { type: 'string' },
  },
  required: ['page', 'interactions'],
}

const AGGREGATE_RESULT = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    counts: {
      type: 'object',
      properties: {
        covered: { type: 'integer' },
        placeholder: { type: 'integer' },
        pure_client: { type: 'integer' },
        gap: { type: 'integer' },
      },
      required: ['covered', 'placeholder', 'pure_client', 'gap'],
    },
    gapTotal: { type: 'integer' },
    riskTop: {
      type: 'array',
      items: { type: 'object', properties: { title: { type: 'string' }, reason: { type: 'string' } }, required: ['title'] },
    },
  },
  required: ['reportPath', 'counts', 'gapTotal'],
}

// ---- prompt 构造 ----
function pagePrompt(page) {
  return tpl.page
    .replace(/<页面名>/g, page)
    .replace(/<页面 HTML 路径>/g, `${args.demoDir}/${page}.html`)
    .replace(/<接口定义目录路径>/g, args.protocolDir)
    .replace(/<模块文件名列表>/g, (args.moduleFiles || []).join(', '))
    .replace(/<business-flow\.md 路径>/g, args.businessFlow || '（不存在，business_point 一律 null）')
    .replace(/<输出路径>/g, `${args.rawDir}/${page}.md`)
}

function aggregatePrompt(pagesData, skipped) {
  const json = JSON.stringify(pagesData)
  const inputSection =
    json.length > 60000
      ? `页面评审数量大，不再内嵌 JSON。请自行 Read 存档 raw 文件 ${args.rawDir}/page-*.md 解析各页评审。`
      : `以下是各页面评审的结构化发现（JSON 数组）：\n${json}`
  const skipNote = skipped && skipped.length ? `未完成评审的页面（报告中应标注）：${skipped.join(', ')}` : ''
  return (
    `${tpl.aggregate}\n\n## 输入发现\n${inputSection}` +
    `${skipNote ? `\n\n## 未完成评审\n${skipNote}` : ''}` +
    `\n\n## 报告路径\n${args.reportPath}`
  )
}

const countsOf = (arr) =>
  arr.reduce((acc, x) => {
    acc[x.state] = (acc[x.state] || 0) + 1
    return acc
  }, {})

// ---- 执行 ----
phase('评')
const stage1 = await parallel(
  (args.pages || []).map(
    (page) => () => agent(pagePrompt(page), { label: `评:${page}`, phase: '评', schema: PAGE_REVIEW })
  )
)

const ok = stage1.filter((r) => r && Array.isArray(r.interactions))
const skipped = stage1.map((r, i) => (r ? null : args.pages[i])).filter(Boolean)

phase('聚')
const pagesData = ok.map((r) => r)
const merged = await agent(aggregatePrompt(pagesData, skipped), { label: '聚:frontend-page-review.md', phase: '聚', schema: AGGREGATE_RESULT })

log(`评: ${ok.length}/${stage1.length} 页完成`)
return { reviewed: ok.map((r) => ({ page: r.page, counts: countsOf(r.interactions) })), skipped, merged }
