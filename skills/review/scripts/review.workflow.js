// review.workflow.js — 接口+全库并行审查 → 汇总分级写 issues.md
// 由 /simple:review 调用：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// args = { interfaces:[文件名], protocolDir, rawDir, issuesPath, templates:{interface, global, merge} }
export const meta = {
  name: 'review-workflow',
  description: '接口+全库并行审查 → 汇总分级写 issues.md',
  phases: [{ title: '审' }, { title: '汇' }],
}

// ---- args 校验：缺失直接返回错误对象（主循环能从通知读到可读错误，不 throw）----
const required = ['interfaces', 'protocolDir', 'rawDir', 'issuesPath', 'templates']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `review-workflow args 缺失: ${missing.join(', ')}` }

const tpl = args.templates

// ---- schema（普通 const，不受 meta 纯字面量限制）----
const FINDINGS = {
  type: 'object',
  properties: {
    source: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { enum: ['P0', 'P1', 'P2', 'P3'] },
          file: { type: 'string' },
          line: { type: 'integer' }, // 0 = 无行号（文件级问题）
          desc: { type: 'string' },
          reason: { type: 'string' },
          suggestion: { type: 'string' },
          uncertain: { type: 'boolean' }, // 仅存疑才 true
        },
        required: ['severity', 'file', 'desc'],
      },
    },
  },
  required: ['source', 'findings'],
}

const MERGE_RESULT = {
  type: 'object',
  properties: {
    issuesPath: { type: 'string' },
    severityCounts: {
      type: 'object',
      properties: { P0: { type: 'integer' }, P1: { type: 'integer' }, P2: { type: 'integer' }, P3: { type: 'integer' } },
      required: ['P0', 'P1', 'P2', 'P3'],
    },
    dismissed: {
      type: 'array',
      items: {
        type: 'object',
        properties: { desc: { type: 'string' }, reason: { type: 'string' } },
        required: ['desc', 'reason'],
      },
    },
  },
  required: ['issuesPath', 'severityCounts'],
}

// ---- prompt 构造（模板由主进程 Read 进 args，脚本做确定性占位符替换）----
function reviewPrompt(name) {
  return tpl.interface
    .replace(/<接口定义路径>/g, `${args.protocolDir}/${name}`)
    .replace(/<对应文件>/g, name)
    .replace(/<接口>/g, name)
}

function mergePrompt(allFindings, skipped) {
  const json = JSON.stringify(allFindings)
  const inputSection =
    json.length > 60000
      ? `本次发现数量大（约 ${allFindings.length} 条，JSON 超长不再内嵌）。请自行 Read 存档 raw 文件 ${args.rawDir}/*.md 解析全部发现。`
      : `以下是本次全部结构化发现（JSON 数组）：\n${json}`
  const skipNote =
    skipped && skipped.length
      ? `未纳入审查的接口/维度（issues.md 头部需如实标注）：${skipped.join(', ')}`
      : '全部接口/维度均完成审查。'
  return `${tpl.merge}\n\n## 输入发现\n${inputSection}\n\n## 未纳入审查\n${skipNote}`
}

// ---- 执行 ----
phase('审')
const stage1 = await parallel([
  ...(args.interfaces || []).map(
    (name) => () => agent(reviewPrompt(name), { label: `审:${name}`, phase: '审', schema: FINDINGS })
  ),
  // 全库维度必须包成 thunk（直接调用会在数组构造时执行，静默丢失该维度）
  () => agent(tpl.global, { label: '审:全库', phase: '审', schema: FINDINGS }),
])

const ok = stage1.filter((r) => r && Array.isArray(r.findings))
const skipped = stage1
  .map((r, i) => {
    if (r) return null
    if (i === stage1.length - 1) return '全库'
    return args.interfaces[i]
  })
  .filter(Boolean)

phase('汇')
const allFindings = ok.flatMap((r) => r.findings)
const merged = await agent(mergePrompt(allFindings, skipped), { label: '汇:issues.md', phase: '汇', schema: MERGE_RESULT })

log(`审: ${ok.length}/${stage1.length} 个维度完成，共 ${allFindings.length} 条发现`)
return { reviewed: ok.map((r) => ({ source: r.source, count: r.findings.length })), skipped, merged }
