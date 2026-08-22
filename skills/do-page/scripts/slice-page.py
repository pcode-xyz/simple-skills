#!/usr/bin/env python3
"""按页面从 COMPONENTS.md + component-map-rule.md 派生切片。

用法：python3 slice-page.py <页面名，如 chat>
- 输入：docs/specs/design/COMPONENTS.md、docs/specs/design/component-map-rule.md
- 输出：
  - docs/specs/design/.slice/<页面>.md      → 本页用到的规范组件（ucs-page / do-page 用）
  - docs/specs/design/.slice/<页面>-map.md  → 本页组件的各端映射配方（do-page 用）

设计：确定性文本过滤——只读磁盘写文件，不把全量文件内容输出到 stdout。
供 ucs-page / do-page 主流程在起 subagent 前运行，避免把 70KB+ 全量读进 LLM 上下文。
"""
import os
import re
import sys

page = "page-" + sys.argv[1]
base = "docs/specs/design"
comp_path = os.path.join(base, "COMPONENTS.md")
map_path = os.path.join(base, "component-map-rule.md")
os.makedirs(os.path.join(base, ".slice"), exist_ok=True)

if not os.path.exists(comp_path):
    print("[skip] %s 不存在，跳过切片（组件名回退组件库）" % comp_path)
    sys.exit(0)


def clean_name(title):
    # '### NavBar（顶部导航）' → '### NavBar'：去掉（...）后缀再比，兼容两侧命名不一致
    return re.sub(r"（[^）]*）", "", title).strip()


# 1) COMPONENTS 切片：使用页面含该页的组件节 + 目标端/适配要点头部
text = open(comp_path, encoding="utf-8").read()
head = text.split("## 基础组件")[0]
comps = []
for s in re.split(r"\n### ", "\n" + text)[1:]:
    m = re.search(r"使用页面：([^\n]+)", s)
    if m and page in m.group(1):
        comps.append("### " + s)
slice_path = os.path.join(base, ".slice", "%s.md" % sys.argv[1])
open(slice_path, "w", encoding="utf-8").write(head + "\n" + "".join(comps))

# 2) 映射表切片：按 COMPONENTS 切片组件节标题归一化后匹配（基础 / 领域两区各自匹配）
wanted_clean = set(clean_name(c.split("\n", 1)[0]) for c in comps)
if not os.path.exists(map_path):
    print("切片写入 %s（%d 组件节）；component-map-rule.md 不存在，跳过映射切片"
          % (slice_path, len(comps)))
    sys.exit(0)

mtext = open(map_path, encoding="utf-8").read()
mhead, rest = mtext.split("\n## 基础组件", 1)
basic_region, sep, domain_region = rest.partition("\n## 领域组件登记")
all_map_clean = set(clean_name("### " + b.split("\n", 1)[0].strip())
                    for b in re.split(r"\n### ", "\n" + mtext)[1:])


def slice_region(region):
    out = []
    for b in re.split(r"\n### ", "\n" + region)[1:]:
        title = "### " + b.split("\n", 1)[0].strip()
        if clean_name(title) in wanted_clean:
            out.append("### " + b)
    return out


kept_basic = slice_region(basic_region)
kept_domain = slice_region(domain_region) if sep else []
out = [mhead, "\n## 基础组件\n", "".join(kept_basic)]
if sep:
    out.append("\n## 领域组件登记\n")
    out.append("".join(kept_domain))
map_slice = os.path.join(base, ".slice", "%s-map.md" % sys.argv[1])
open(map_slice, "w", encoding="utf-8").write("".join(out))
print("切片写入 %s（%d 组件节）+ %s（%d 基础 / %d 领域映射节）"
      % (slice_path, len(comps), map_slice, len(kept_basic), len(kept_domain)))
missing = sorted(wanted_clean - all_map_clean)
if missing:
    print("[warn] %d 个组件未在映射表找到配方，do-page 将按组件切片语义手写：%s"
          % (len(missing), "、".join(missing)))
