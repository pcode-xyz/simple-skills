// specs-api-mock.workflow.js — 契约 mock 生成 → 并行页面对照 → 单写接线 → 汇总决策单
// 由 /simple:specs-api-mock 调用：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// args = { pages:[页面名], demoDir, protocolDir, protocol, moduleFiles?, demoAppJs, demoDataJs?,
//          mockDir, mapDir, reportPath, apiMockPath, appMockPath, contractIndexPath, templates }
export const meta = {
  name: 'specs-api-mock-workflow',
  description: '契约 mock 生成 → 并行页面对照 → 单写接线 → 接口格式校验循环 → 汇总写 mock-compare.md',
  phases: [{ title: '契约' }, { title: '对照' }, { title: '接线' }, { title: '校验' }, { title: '汇总' }],
}

// ---- args 校验：缺失直接返回错误对象（主循环能从通知读到可读错误，不 throw）----
const required = ['pages', 'demoDir', 'protocolDir', 'mockDir', 'mapDir', 'reportPath', 'apiMockPath', 'appMockPath', 'contractIndexPath', 'templates']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `specs-api-mock-workflow args 缺失: ${missing.join(', ')}` }

const tpl = args.templates
const dataJsPaths = (args.demoDataJs || []).map((f) => `${args.demoDir}/${f}`).join(', ') || '（不存在）'

// ---- schema（required 最少字段防重试风暴）----
const CONTRACT_RESULT = {
  type: 'object',
  properties: {
    protocol: { type: 'string' },
    apiMockPath: { type: 'string' },
    contractIndexPath: { type: 'string' },
    rpcCount: { type: 'integer' },
    streamingRpc: { type: 'array', items: { type: 'string' } },
    services: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, rpcCount: { type: 'integer' }, streaming: { type: 'array', items: { type: 'string' } } },
        required: ['name'],
      },
    },
    dataDomainsMapped: { type: 'array', items: { type: 'object' } },
    placeholdersNotStubbed: { type: 'array', items: { type: 'string' } },
    apiShape: { type: 'string' },
  },
  required: ['protocol', 'apiMockPath', 'contractIndexPath', 'rpcCount', 'streamingRpc'],
}

const PAGE_MAP = {
  type: 'object',
  properties: {
    page: { type: 'string' },
    dataAccesses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          location: { type: 'string' },
          access: { type: 'string' },
          rpc: { type: 'string' },
          demo_field: { type: 'string' },
          contract_field: { type: 'string' },
          state: { enum: ['covered', 'unwired', 'gap', 'pure_client'] },
          note: { type: 'string' },
        },
        required: ['state'],
      },
    },
    counts: {
      type: 'object',
      properties: { covered: { type: 'integer' }, unwired: { type: 'integer' }, gap: { type: 'integer' }, pure_client: { type: 'integer' } },
      required: ['covered', 'unwired', 'gap', 'pure_client'],
    },
    gaps: {
      type: 'array',
      items: { type: 'object', properties: { access: { type: 'string' }, need: { type: 'string' }, expected_rpc_fields: { type: 'string' } }, required: ['need'] },
    },
  },
  required: ['page', 'dataAccesses', 'counts'],
}

const REWIRE_RESULT = {
  type: 'object',
  properties: {
    apiMockPath: { type: 'string' },
    appMockPath: { type: 'string' },
    rewiredPages: { type: 'array', items: { type: 'string' } },
    accessorsWired: {
      type: 'array',
      items: { type: 'object', properties: { access: { type: 'string' }, rpc: { type: 'string' } }, required: ['access'] },
    },
    accessorsGap: {
      type: 'array',
      items: { type: 'object', properties: { access: { type: 'string' }, gap_ref: { type: 'string' } }, required: ['access'] },
    },
    streamingConsumers: {
      type: 'array',
      items: { type: 'object', properties: { page: { type: 'string' }, rpc: { type: 'string' } }, required: ['page'] },
    },
    assetsCopied: { type: 'array', items: { type: 'string' } },
    pageOpenIssues: {
      type: 'array',
      items: { type: 'object', properties: { page: { type: 'string' }, issue: { type: 'string' } }, required: ['page'] },
    },
  },
  required: ['apiMockPath', 'appMockPath', 'rewiredPages'],
}

const VALIDATION_RESULT = {
  type: 'object',
  properties: {
    clean: { type: 'boolean' },
    checks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          op: { type: 'string' },
          status: { enum: ['ok', 'issue'] },
          issue_type: { enum: ['unknown_rpc', 'req_field_mismatch', 'resp_field_mismatch', 'streaming_misuse', 'field_name_case', 'value_mapping', 'api_surface_missing'] },
          detail: { type: 'string' },
          expected: { type: 'string' },
        },
        required: ['op', 'status'],
      },
    },
  },
  required: ['clean'],
}

const AGGREGATE_RESULT = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    counts: {
      type: 'object',
      properties: { covered: { type: 'integer' }, unwired: { type: 'integer' }, gap: { type: 'integer' }, pure_client: { type: 'integer' } },
      required: ['covered', 'unwired', 'gap', 'pure_client'],
    },
    gapTotal: { type: 'integer' },
    riskTop: {
      type: 'array',
      items: { type: 'object', properties: { title: { type: 'string' }, reason: { type: 'string' } }, required: ['title'] },
    },
  },
  required: ['reportPath', 'counts', 'gapTotal'],
}

// ---- prompt 构造（占位符替换，模板由主进程 Read 进 args）----
function contractPrompt() {
  return tpl.contract
    .replace(/<接口定义目录路径>/g, args.protocolDir)
    .replace(/<模块文件名列表>/g, (args.moduleFiles || []).join(', '))
    .replace(/<demoAppJs路径>/g, `${args.demoDir}/${args.demoAppJs}`)
    .replace(/<demoDataJs路径>/g, dataJsPaths)
    .replace(/<apiMock输出路径>/g, args.apiMockPath)
    .replace(/<contractIndex输出路径>/g, args.contractIndexPath)
    .replace(/<demo目录路径>/g, args.demoDir)
}

function pagePrompt(page) {
  return tpl.page
    .replace(/<页面名>/g, page)
    .replace(/<页面 HTML 路径>/g, `${args.demoDir}/${page}.html`)
    .replace(/<共享 JS 路径>/g, `${args.demoDir}/${args.demoAppJs}`)
    .replace(/<contractIndex路径>/g, args.contractIndexPath)
    .replace(/<接口定义目录路径>/g, args.protocolDir)
    .replace(/<map输出路径>/g, `${args.mapDir}/${page}-map.md`)
}

function rewireBase(okMaps, skipped) {
  const json = JSON.stringify(okMaps)
  const mapsSection =
    json.length > 60000
      ? `对照量大，不再内嵌 JSON。请自行 Read 对照存档文件 ${args.mapDir}/*-map.md 解析各页映射。`
      : `各页对照结构化结果（JSON 数组）：\n${json}`
  const skipNote = skipped && skipped.length ? `未完成对照的页面（保留原 demo 行为，标记 __GAP__）：${skipped.join(', ')}` : ''
  return (
    `${tpl.rewire
      .replace(/<apiMockPath>/g, args.apiMockPath)
      .replace(/<contractIndexPath>/g, args.contractIndexPath)
      .replace(/<mapDir>/g, args.mapDir)
      .replace(/<demoAppJs路径>/g, `${args.demoDir}/${args.demoAppJs}`)
      .replace(/<demoDataJs路径>/g, dataJsPaths)
      .replace(/<appMockPath>/g, args.appMockPath)
      .replace(/<mockDir>/g, args.mockDir)
    }\n\n## 对照存档\n${mapsSection}` +
    `${skipNote ? `\n\n## 未完成对照\n${skipNote}` : ''}`
  )
}

function rewirePrompt(okMaps, skipped) {
  return rewireBase(okMaps, skipped)
}

function rewireFixPrompt(okMaps, skipped, validation) {
  const issues = (validation && validation.checks ? validation.checks : []).filter((c) => c.status !== 'ok')
  return (
    `${rewireBase(okMaps, skipped)}\n\n## 上轮校验问题（必须修正 app-mock.js，修正后再交校验，直到 clean）\n` +
    JSON.stringify(issues, null, 2)
  )
}

function validatePrompt() {
  return tpl.validate
    .replace(/<appMockPath>/g, args.appMockPath)
    .replace(/<contractIndexPath>/g, args.contractIndexPath)
}

function aggregatePrompt(contract, okMaps, rewire, validation, skipped) {
  const mapsJson = JSON.stringify(okMaps)
  const mapsSection =
    mapsJson.length > 60000
      ? `对照量大，不再内嵌 JSON。请自行 Read 对照存档文件 ${args.mapDir}/*-map.md 解析各页映射。`
      : `各页对照结构化结果（JSON 数组）：\n${mapsJson}`
  const skipNote = skipped && skipped.length ? `未完成对照的页面：${skipped.join(', ')}` : ''
  return (
    `${tpl.aggregate}\n\n## 报告路径\n${args.reportPath}` +
    `\n\n## 契约摘要\n${JSON.stringify(contract || {})}` +
    `\n\n## 对照存档\n${args.mapDir}\n${mapsSection}` +
    `\n\n## 接线结果\n${JSON.stringify(rewire || {})}` +
    `\n\n## 校验结果\n${JSON.stringify(validation || {})}` +
    `${skipNote ? `\n\n## 未完成对照\n${skipNote}` : ''}`
  )
}

// ---- 执行（严格串行：接线需要对照的映射作唯一真相）----
phase('契约')
const contract = await agent(contractPrompt(), { label: '契约:api-mock.js', phase: '契约', schema: CONTRACT_RESULT })
if (!contract) return { error: '契约生成失败（未返回 schema）' }

phase('对照')
const maps = await parallel(
  (args.pages || []).map((p) => () => agent(pagePrompt(p), { label: `对照:${p}`, phase: '对照', schema: PAGE_MAP }))
)
const okMaps = maps.filter((r) => r && Array.isArray(r.dataAccesses))
const skipped = maps.map((r, i) => (r ? null : args.pages[i])).filter(Boolean)

phase('接线')
let rewire = await agent(rewirePrompt(okMaps, skipped), { label: '接线:demo-mock', phase: '接线', schema: REWIRE_RESULT })
if (!rewire) return { error: '接线失败（未返回 schema）' }

// 接口格式校验循环：app-mock.js 与契约严格一致，不一致修正到一致为止（上限 3 轮）
const MAX_FIX_ITERS = 3
let fixIter = 0
let validation = null
while (fixIter < MAX_FIX_ITERS) {
  phase('校验')
  validation = await agent(validatePrompt(), { label: `校验:接口格式${fixIter ? fixIter : ''}`, phase: '校验', schema: VALIDATION_RESULT })
  if (!validation) break
  const issues = (validation.checks || []).filter((c) => c.status !== 'ok')
  if (validation.clean || !issues.length) break
  fixIter++
  log(`校验: 第 ${fixIter}/${MAX_FIX_ITERS} 轮发现 ${issues.length} 处不一致，接线修正中`)
  phase('接线')
  rewire = await agent(rewireFixPrompt(okMaps, skipped, validation), { label: `接线:修正${fixIter}`, phase: '接线', schema: REWIRE_RESULT })
  if (!rewire) break
}
log(`校验: ${validation && validation.clean ? '接口格式 clean' : '达到修正上限或校验无返回'}`)

phase('汇总')
const merged = await agent(aggregatePrompt(contract, okMaps, rewire, validation, skipped), { label: '汇总:mock-compare.md', phase: '汇总', schema: AGGREGATE_RESULT })

log(`对照: ${okMaps.length}/${maps.length} 页完成`)
return {
  contract,
  pages: okMaps.map((r) => ({ page: r.page, counts: r.counts })),
  skipped,
  rewire,
  validation,
  fixIter,
  merged,
}
