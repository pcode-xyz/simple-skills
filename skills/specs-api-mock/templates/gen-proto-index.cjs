#!/usr/bin/env node
/* gen-proto-index.cjs — 解析 gRPC 接口定义目录 *.proto → 生成 proto-index.js
 *
 * 用途：demo-review.html 的「proto 格式校验」数据源（仅 gRPC 协议分支；HTTP 分支无需）。
 * 工具是 file:// 直开（无服务器），Chromium 禁止运行时 fetch 其他 file:// 资源，
 * 因此把 proto 接口定义预生成为静态 JS（window.PROTO_INDEX），由 <script src> 加载。
 *
 * 用法：node gen-proto-index.cjs [protoDir] [outPath]
 *   protoDir  接口定义目录（默认 docs/specs/grpc，相对 cwd）
 *   outPath   输出路径（默认 docs/product/demo-mock/proto-index.js，相对 cwd）
 * 示例：node docs/product/demo-mock/gen-proto-index.cjs docs/specs/grpc docs/product/demo-mock/proto-index.js
 *
 * 覆盖范围（与 gRPC 规范对齐）：
 *   - service → rpc（请求/响应 message、stream 标记、RPC 注释）
 *   - 顶层 message（含跨包 common.* 与 oneof）→ 字段（name/type/repeated/comment）
 *   - 类型：uint32/int32/string/bool/google.protobuf.Timestamp/消息引用（同包或 common.*）
 *   约定：目标项目 proto 无 enum/map/reserved/嵌套 message（与本 skill 产出的 gRPC 规范一致）。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const GRPC_DIR = path.resolve(process.cwd(), process.argv[2] || 'docs/specs/grpc');
const OUT = path.resolve(process.cwd(), process.argv[3] || 'docs/product/demo-mock/proto-index.js');

const RE_PACKAGE = /^package\s+(\w+)\s*;/;
const RE_SERVICE = /^service\s+(\w+)\s*\{/;
const RE_MESSAGE = /^message\s+(\w+)\s*\{/;
const RE_ONEOF   = /^\s*oneof\s+(\w+)\s*\{/;
const RE_FIELD   = /^\s*(repeated\s+)?([A-Za-z_][\w.]*)\s+(\w+)\s*=\s*\d+\s*;(.*)$/;
const RE_RPC     = /^\s*rpc\s+(\w+)\s*\(\s*(\w+)\s*\)\s*returns\s*\(\s*(stream\s+)?(\w+)\s*\)\s*;/;

function stripComment(s) {
  return String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/\s?/, '').replace(/\s+$/, '');
}

/* rpc 紧邻上方的连续 // 注释块（含「请求：{…} 响应：{…}」示例行） */
function collectRpcComment(lines, rpcIdx) {
  const out = [];
  for (let i = rpcIdx - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t.startsWith('//')) out.unshift(stripComment(t));
    else if (t === '') continue;              // 允许注释块内空行
    else break;
  }
  return out.join('\n');
}

/* 字段注释 = 行内（; 后）+ 紧随的 // 续行 */
function collectFieldComment(line, lines, idx) {
  const out = [];
  const inline = (RE_FIELD.exec(line) || [])[4] || '';
  if (stripComment(inline)) out.push(stripComment(inline));
  for (let i = idx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('//')) out.push(stripComment(t));
    else break;
  }
  return out.join(' ');
}

function main() {
  if (!fs.existsSync(GRPC_DIR)) {
    console.error('接口定义目录不存在：' + GRPC_DIR);
    process.exit(1);
  }
  const services = {};   // pkg -> { op -> {requestMsg,responseMsg,stream,comment} }
  const messages = {};   // fqName -> { package, oneof, fields[] }
  let streamCount = 0, rpcCount = 0;

  const files = fs.readdirSync(GRPC_DIR).filter(f => f.endsWith('.proto')).sort();
  if (!files.length) {
    console.error('目录下无 *.proto：' + GRPC_DIR);
    process.exit(1);
  }
  for (const file of files) {
    const lines = fs.readFileSync(path.join(GRPC_DIR, file), 'utf8').split('\n');
    let pkg = '', curService = null, curMsg = null, curOneof = '';

    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t || t.startsWith('//')) continue;

      let m = RE_PACKAGE.exec(t);
      if (m) { pkg = m[1]; continue; }

      m = RE_SERVICE.exec(t);
      if (m) { curService = m[1]; continue; }

      m = RE_MESSAGE.exec(t);
      if (m) { curMsg = { name: m[1], fields: [] }; curOneof = ''; continue; }

      if (curMsg) {
        m = RE_ONEOF.exec(t);
        if (m) { curOneof = m[1]; continue; }
        if (t === '}') {
          messages[pkg + '.' + curMsg.name] = { package: pkg, oneof: curOneof, fields: curMsg.fields };
          curMsg = null; curOneof = '';
          continue;
        }
        m = RE_FIELD.exec(t);
        if (m) {
          curMsg.fields.push({
            name: m[3], type: m[2], repeated: !!m[1],
            comment: collectFieldComment(t, lines, i),
          });
          continue;
        }
        continue;   // message 块内其余行（如 oneof 的 }）忽略
      }

      m = RE_RPC.exec(t);
      if (m && curService) {
        const stream = !!m[3];
        if (stream) streamCount++;
        rpcCount++;
        (services[pkg] = services[pkg] || {})[m[1]] = {
          requestMsg: pkg + '.' + m[2],
          responseMsg: pkg + '.' + m[4],
          stream,
          comment: collectRpcComment(lines, i),
        };
        continue;
      }
    }
  }

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'gRPC 接口定义目录 ' + path.relative(process.cwd(), GRPC_DIR) + '/*.proto',
    services,
    messages,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT,
`/* proto-index.js — 由 gen-proto-index.cjs 自动生成，勿手改。
 * 源：${index.source} → 供 demo-review.html 做 proto 格式校验。 */
window.PROTO_INDEX = ${JSON.stringify(index, null, 2)};
`, 'utf8');

  console.log(`已生成 ${path.relative(process.cwd(), OUT)}`);
  console.log(`  services=${Object.keys(services).length} rpcs=${rpcCount} streams=${streamCount} messages=${Object.keys(messages).length}`);
}

main();
