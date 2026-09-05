// product-glossary.workflow.js — 逐页只读对比 demo 原型稿与词汇表，返回分歧/缺失项（单阶段并行，只读）
// 由 /simple:product-glossary 调用（阶段 2）：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// 子 agent 只读、不写文件；主进程收结果后自行合并写 glossary-different.md / 补充 glossary.md。
// args = { pages:[页面名], demoDir, glossaryPath }
export const meta = {
  name: 'product-glossary-workflow',
  description: '逐页只读对比 demo 原型稿与词汇表，返回分歧/缺失项',
  phases: [{ title: '对比' }],
}

// ---- args 校验 ----
const required = ['pages', 'demoDir', 'glossaryPath']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `product-glossary-workflow args 缺失: ${missing.join(', ')}` }

// ---- schema ----
const GLOSSARY_FINDINGS = {
  type: 'object',
  properties: {
    page: { type: 'string' },
    discrepancies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          page_usage: { type: 'string' },
          glossary_def: { type: 'string' },
          point: { type: 'string' },
        },
        required: ['term', 'page_usage', 'glossary_def', 'point'],
      },
    },
    missing: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          page_meaning: { type: 'string' },
          suggested_scope: { type: 'string' },
          suggested_english: { type: 'string' },
        },
        required: ['term', 'page_meaning'],
      },
    },
  },
  required: ['page'],
}

// ---- prompt 构造 ----
function pagePrompt(page) {
  return `你是统一语言词汇的评审员。读取页面「${page}」的 HTML 与词汇表 ${args.glossaryPath}，找出两类发现。**只读：不要修改任何文件、不写文件、不跑其他命令。**

## 步骤
1. 用 Read 读 ${args.demoDir}/${page}.html 的 HTML 内容；
2. 读 ${args.glossaryPath}；
3. 返回结构化发现（见下）。

## 判断标准
- **分歧项**：页面里出现、且 glossary 中有类似业务含义但表述/定义不同的词；
- **缺失项**：页面出现的业务概念在 glossary 中没有。

## 返回（StructuredOutput）
- page：${page}
- discrepancies：[{ term(词), page_usage(页面用法), glossary_def(glossary 定义), point(分歧点) }]
- missing：[{ term(词), page_meaning(页面含义), suggested_scope(建议适用范围), suggested_english(建议英文) }]`
}

// ---- 执行（单阶段并行只读 fan-out，无屏障）----
phase('对比')
const results = await parallel(
  (args.pages || []).map((page) => () => agent(pagePrompt(page), { label: `对比:${page}`, phase: '对比', schema: GLOSSARY_FINDINGS }))
)

const ok = results.filter((r) => r && r.page)
const failed = results.map((r, i) => (r ? null : args.pages[i])).filter(Boolean)

log(`页对比完成：${ok.length}/${results.length} 页`)
return { findings: ok, failed }
