# 扁平业务切片 · 工具层（prompt 模板）

## prompt 模板

    你是一位资深后端工程师，精通{语言}和业务驱动开发。请你基于项目信息，遵守架构原则，
    在此基础上说明工具层的组织方式，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 一个示例 API：docs/specs/API/<模块>.yaml（选一个代表性接口）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md
    - Handler 流转流程：docs/standards/http-handler-rule.md

    ## 架构原则（工具层相关）

    项目采用扁平业务切片架构，工具层是平铺的组件库：
    1. **平铺组件库**：日志库、队列库、告警库、LLM 库、地图库、DB 库等，各为一个独立包
    2. **按需直调**：业务 handler 直接调用工具，不包装成 Service、不加中间抽象层
    3. **对内抽象、对外透明**：工具层内部可以有抽象（连接池、重试、封装），但对业务层透明
    4. **零抽象原则**：handler 之间不共享业务逻辑；相似的工具调用各写各的
    5. 业务逻辑全展开：handler 内按业务顺序依次调用 DB 操作、日志、队列、告警等

    ## 输出要求

    1. 工具层的完整包/目录结构（每个组件库 db/log/llm/queue/... 的路径与职责）
    2. 每个组件的对外接口/入口：初始化方式、连接管理、主要方法（业务直接调用的面）
    3. 以一个业务 handler（用示例 API）为例，标注它调用了哪些工具、按什么顺序、怎么调用（示意代码）
    4. 工具层内部允许的抽象范围、对业务透明的边界
    5. 组件如何初始化与注入（配置来源、启动时加载）
