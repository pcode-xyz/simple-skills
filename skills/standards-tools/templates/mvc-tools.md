# MVC · 工具层（Repository + 基础设施）（prompt 模板）

## prompt 模板

    你是一位资深后端架构师，精通{语言}和 MVC 架构。请你基于项目信息，遵守架构原则，
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

    项目采用 MVC 架构，工具层 = 数据访问（Repository/Model）+ 基础设施组件：
    1. **数据访问归 Repository/Model**：Service 通过 Repository 接口访问数据，不直接写 SQL
    2. **基础设施组件**：日志、队列、外部服务、配置等作为独立工具，Service 按需调用
    3. **面向接口 + 依赖注入**：工具以接口暴露，保证可替换、可测试
    4. **DTO 与实体分离**：工具返回的数据与 API 契约解耦
    5. Service 不感知 HTTP；Controller 不直接接触工具层

    ## 输出要求

    1. 工具层完整目录结构（repositories/、基础设施组件如 log/queue/llm/config 等）
    2. 每个工具的对外接口与职责：数据访问、日志、队列、外部服务
    3. 以一个业务 Service（用示例 API）为例，标注它调用哪些工具、怎么注入与调用
    4. 工具层与 Controller/Service 的边界（谁可以碰工具层）
    5. 组件初始化与注入方式
