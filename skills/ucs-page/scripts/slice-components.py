#!/usr/bin/env python3
"""按页面从 COMPONENTS.md 派生组件切片。

用法：python3 slice-components.py <页面名，如 chat>
- 输入：docs/specs/design/COMPONENTS.md（specs-components 产物）
- 输出：docs/specs/design/.slice/<页面>.md（只含"使用页面"含该页的组件节 + 目标端/适配要点头部）

设计：确定性文本过滤——只读磁盘写文件，不把全量 COMPONENTS.md 输出到 stdout，
供 ucs-page 主流程在起 subagent 前运行，避免把全量读进 LLM 上下文。
"""
import os
import re
import sys

page = "page-" + sys.argv[1]
src = "docs/specs/design/COMPONENTS.md"
if not os.path.exists(src):
    print("[skip] %s 不存在，跳过切片（ucs-page 回退组件库）" % src)
    sys.exit(0)

text = open(src, encoding="utf-8").read()
head = text.split("## 基础组件")[0]  # 标题 + 目标端 + 适配要点头部
comps = []
for s in re.split(r"\n### ", "\n" + text)[1:]:
    m = re.search(r"使用页面：([^\n]+)", s)
    if m and page in m.group(1):
        comps.append("### " + s)

os.makedirs("docs/specs/design/.slice", exist_ok=True)
out = "docs/specs/design/.slice/%s.md" % sys.argv[1]
open(out, "w", encoding="utf-8").write(head + "\n" + "".join(comps))
print("切片写入 %s（%d 组件节）" % (out, len(comps)))
