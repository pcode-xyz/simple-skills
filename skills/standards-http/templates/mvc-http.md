# MVC · HTTP 请求流转（prompt 模板）

## prompt 模板

    你是一位资深后端架构师，精通{语言}和 MVC 架构。请你基于项目信息，遵守架构原则，
    在此基础上给出一个完整请求从 HTTP Controller 到数据库的流转路径，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件获取业务流程、数据结构、技术选型：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 一个示例 API：docs/specs/API/<模块>.yaml（选一个代表性接口）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md

    ## 架构原则

    1. **Controller 保持"薄"**：只做 HTTP 适配（解析参数、校验、调用 Service、返回响应），不写业务逻辑、不直接访问数据层
    2. **Service 承载业务**：业务规则、事务、跨模型编排、外部服务调用都在 Service/BLL 层；不感知 HTTP
    3. **Model 只管数据**：ORM schema / 实体与数据访问（Repository），保持"薄"
    4. **DTO / 实体分离**：不直接用数据库实体当 API 响应对象
    5. **依赖注入 + 面向接口**；路由与中间件单独组织

    ## 输出要求

    1. 从示例 API 中选一个接口，给出完整请求从 Controller 到数据库的流转路径（逐层标注）
    2. 每个环节说明：在哪个文件/哪一层、做什么、调用什么
    3. 覆盖：路由 → Controller(参数/DTO) → Service(业务/事务) → Model/Repository → DB → 响应封装
