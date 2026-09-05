// specs-ws.workflow.js — 逐模块生成 WebSocket 协议（AsyncAPI 2.6），单阶段并行
// 由 /simple:specs-ws 调用：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// args = { modules:[...], moduleDescriptions?, outDir, language?, actions?, templates:{ws} }
export const meta = {
  name: 'specs-ws-workflow',
  description: '逐模块生成 WebSocket 协议（AsyncAPI 2.6）',
  phases: [{ title: '生成' }],
}

// ---- args 校验 ----
const required = ['modules', 'outDir', 'templates']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `specs-ws-workflow args 缺失: ${missing.join(', ')}` }

const tpl = args.templates
const skipGen = (m) => args.actions && args.actions[m] === 'skip'

// ---- schema ----
const WS_RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    path: { type: 'string' },
    channel_count: { type: 'integer' },
  },
  required: ['module', 'path'],
}

// ---- prompt 构造 ----
function modulePrompt(module) {
  const tplWs = tpl.ws.replace(/\{语言\}/g, args.language || '所选语言（从 tech-stack-rule 读取）')
  const scope =
    args.moduleDescriptions && args.moduleDescriptions[module]
      ? `\n本模块「${module}」覆盖的实时通道（主进程按业务场景归组）：${args.moduleDescriptions[module]}`
      : ''
  return `你是资深后端工程师。为通道模块「${module}」定义 WebSocket 协议文档（AsyncAPI 2.6），输出至 ${args.outDir}/${module}.yaml。**只写 WS 文档，不改 specs/API。**${scope}

## 执行方式
按下方「## WS 生成模板」的规范逐节执行：先读模板「项目信息」列出的文件，识别本模块的实时通道，再按通道划分原则、方向语义、契约三要素输出 AsyncAPI 2.6。

## 输出（两步，按顺序；不要省略）
1. **写交付文件**：写入 ${args.outDir}/${module}.yaml（先 mkdir -p ${args.outDir}），报告写入路径与文件大小。
2. **返回**（StructuredOutput）：{ module, path, channel_count }。

## WS 生成模板
${tplWs}`
}

// ---- 执行（单阶段并行，无屏障）----
phase('生成')
const todo = (args.modules || []).filter((m) => !skipGen(m))
const results = await parallel(
  todo.map((module) => () => agent(modulePrompt(module), { label: `生成:${module}`, phase: '生成', schema: WS_RESULT }))
)

const ok = results.filter((r) => r && r.path)
const failed = results.map((r, i) => (r ? null : todo[i])).filter(Boolean)
const skippedByAction = (args.modules || []).filter((m) => skipGen(m))

log(`模块处理完成：${ok.length}/${todo.length} 个`)
return { reviewed: ok.map((r) => ({ module: r.module, channel_count: r.channel_count || 0 })), failed, skippedByAction }
