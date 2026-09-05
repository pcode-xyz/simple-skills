// ucs-grpc.workflow.js — 逐模块 gRPC UCS 生成 → 6 维安全审查 → 修正（三阶段 pipeline）
// 由 /simple:ucs-grpc 调用：主进程 Glob 定位本文件得绝对路径，传 scriptPath + args。
// args = { modules:[...], protoDir, ucsDir, reviewDir, date?, actions?, reviewActions?, templates:{ucs, ucsReview} }
//   actions:       { module: 'gen'|'skip' }  阶段1 闸门（UCS 文件已存在时用户的决定）
//   reviewActions: { module: 'gen'|'skip' }  阶段2 闸门（审查文件已存在时用户的决定）；skip 则跳过 review+fix
export const meta = {
  name: 'ucs-grpc-workflow',
  description: '逐模块 gRPC UCS 生成 → 6 维安全审查 → 修正（pipeline）',
  phases: [{ title: '生成' }, { title: '审查' }, { title: '修正' }],
}

// ---- args 校验 ----
const required = ['modules', 'protoDir', 'ucsDir', 'reviewDir', 'templates']
const missing = required.filter((k) => args[k] === undefined || args[k] === '')
if (missing.length) return { error: `ucs-grpc-workflow args 缺失: ${missing.join(', ')}` }

const tpl = args.templates
const skipGen = (m) => args.actions && args.actions[m] === 'skip'
const skipReview = (m) => args.reviewActions && args.reviewActions[m] === 'skip'

// ---- schema ----
const GEN_RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    path: { type: 'string' },
    use_case_count: { type: 'integer' },
    rpcs_covered: { type: 'array', items: { type: 'string' } },
  },
  required: ['module', 'path'],
}

const REVIEW_RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    path: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { enum: ['S', 'M', 'L'] },
          uc_ref: { type: 'string' },
          title: { type: 'string' },
          desc: { type: 'string' },
        },
        required: ['severity', 'uc_ref', 'title', 'desc'],
      },
    },
  },
  required: ['module', 'path', 'findings'],
}

const FIX_RESULT = {
  type: 'object',
  properties: {
    module: { type: 'string' },
    path: { type: 'string' },
    fixed_sections: { type: 'array', items: { type: 'string' } },
    skipped: {
      type: 'array',
      items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id'] },
    },
  },
  required: ['module', 'path'],
}

// ---- prompt 构造 ----
const ucsTpl = (module) => tpl.ucs.replace(/\{模块名\}/g, module).replace(/\{YYYY-MM-DD\}/g, args.date || '')
const reviewTpl = (module) => tpl.ucsReview.replace(/\{模块名\}/g, module)

function genPrompt(module) {
  return `你是 gRPC 接口用例规约工程师。为模块「${module}」生成用例规约（UCS）文档，**只生成文档，不改任何接口定义**。

## 输入（读这些文件）
- 接口定义：${args.protoDir}/${module}.proto（本模块全部 service/RPC）
- 数据库设计（存在才读）：docs/specs/data/ 下 DB 文件（字段名/类型以此为准）
- 技术选型：docs/standards/tech-stack-rule.md
- 目录结构：docs/standards/directory-rule.md

## 生成要求
严格按下方「## UCS 结构模板」逐节填写：一、模块总览（1.1 用例清单 / 1.2 错误码号段）→ 二~N 各用例（每个 RPC 至少一个用例，10 小节齐全，空节删除不留空壳）→ N+1 模块级技术要点汇总（Y.1~Y.8）。使用中文。

每个用例必须覆盖 4 个思考点：
- **参数合法性**：请求 message 每个字段的必填/类型/长度/范围/格式校验；
- **业务视角**：字段间的业务逻辑、业务规则约束；
- **安全视角**：越权、注入、敏感信息等风险及对策；
- **网络异常**：超时、重试、幂等、部分失败的处理。

**RPC 语义对齐 proto**：service/RPC、请求/响应 message（\`XxxRequest\`/\`XxxResponse\`）、统一 \`{code,data,message}\` 响应、字段 snake_case 且类型对齐 DB 文件（\`docs/specs/data/\`）；**不读 http-handler-rule**（gRPC 无 HTTP handler，实现约定按 directory-rule）。

## 输出（两步，按顺序；不要省略）
1. **写交付文件**：写入 ${args.ucsDir}/${module}.md（先 mkdir -p ${args.ucsDir}），报告写入路径与文件大小。
2. **返回**（StructuredOutput）：{ module, path, use_case_count, rpcs_covered }。

## UCS 结构模板
${ucsTpl(module)}`
}

function reviewPrompt(module) {
  return `你是安全审查工程师。审查模块「${module}」的 gRPC UCS 文档，**只报告，不改 UCS**。

## 输入（读这些文件）
- 该 UCS：${args.ucsDir}/${module}.md
- 对应接口定义：${args.protoDir}/${module}.proto
- 数据库设计（存在才读）：docs/specs/data/ 下 DB 文件
- 技术选型：docs/standards/tech-stack-rule.md

## 审查要求
按下方「## 审查模板」逐节输出：按 6 个安全维度（水平越权/输入校验/竞态条件/数据泄露/幂等性/状态机）检查，问题按严重度 S/M/L 编号、每个严重问题对应到具体用例步骤与触发路径；无问题的维度保留章节，结论写「已检查，未发现明显问题」。

## 输出（两步，按顺序；不要省略）
1. **写交付文件**：写入 ${args.reviewDir}/${module}.md（先 mkdir -p ${args.reviewDir}），报告写入路径与文件大小。
2. **返回**（StructuredOutput）：{ module, path, findings:[{ severity(S/M/L), uc_ref, title, desc }] }。

## 审查模板
${reviewTpl(module)}`
}

function fixPrompt(module) {
  return `你是用例规约修正工程师。按审查报告修正模块「${module}」的 gRPC UCS，**只改 UCS 文档**。

## 输入（读这些文件）
- 审查报告：${args.reviewDir}/${module}.md
- 对应 UCS：${args.ucsDir}/${module}.md
- 接口定义（必要时读）：${args.protoDir}/${module}.proto

## 修正要求
读审查报告后**自行评估**每个问题（S/M/L）的合理性与修复必要性；按推荐修正 UCS 对应小节（合理的尤其 S/M 逐一修正）；轻微/不适用/与事实不符的可跳过并说明理由；修正后整体仍符合下方「## UCS 结构模板」。

## 输出（两步，按顺序；不要省略）
1. **写回交付文件**：写回 ${args.ucsDir}/${module}.md（覆盖）。
2. **返回**（StructuredOutput）：{ module, path, fixed_sections:[...], skipped:[{ id, reason }] }。

## UCS 结构模板
${ucsTpl(module)}`
}

// ---- 执行（每模块独立链：生成 → 审查 → 修正，无屏障）----
phase('生成')
const results = await pipeline(
  args.modules || [],
  (prev, module) => {
    if (skipGen(module)) return null
    return agent(genPrompt(module), { label: `生成:${module}`, phase: '生成', schema: GEN_RESULT })
  },
  (gen, module) => {
    if (!gen) return null
    if (skipReview(module)) return { skipped: true }
    return agent(reviewPrompt(module), { label: `审查:${module}`, phase: '审查', schema: REVIEW_RESULT })
  },
  (review, module) => {
    if (!review || review.skipped) return null
    return agent(fixPrompt(module), { label: `修正:${module}`, phase: '修正', schema: FIX_RESULT })
  }
)

const statusOf = (r) => {
  if (!r) return 'skipped'
  if (r.skipped) return 'gen_only'
  return 'fixed'
}

log(`模块处理完成：${args.modules.map((m, i) => `${m}=${statusOf(results[i])}`).join(', ')}`)
return { results: args.modules.map((m, i) => ({ module: m, status: statusOf(results[i]) })) }
