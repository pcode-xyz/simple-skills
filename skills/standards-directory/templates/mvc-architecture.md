# MVC 架构（后端目录设计 prompt）

## prompt 模板

    你是一位资深后端架构师，精通{语言}和 MVC 架构。请基于项目信息，遵守架构原则，
    设计后端项目目录结构主方案，给出完整的目录树（树形展示），并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 已定义 API：docs/specs/API（或 docs/specs/grpc）
    - 技术选型：docs/standards/tech-stack-rule.md

    ## 架构原则

    1. **Controller 保持"薄"**：只做 HTTP 适配（解析参数、校验、调用 Service、返回响应），不写业务逻辑、不直接访问数据层
    2. **Service 承载业务**：业务规则、事务、跨模型编排、外部服务调用都在 Service/BLL 层；不感知 HTTP
    3. **Model 只管数据**：ORM schema / 实体与数据访问（Repository），保持"薄"
    4. **DTO / 实体分离**：不直接用数据库实体当 API 响应对象，用 DTO 保护契约与敏感字段
    5. **依赖注入 + 面向接口**：保证可测试、可替换
    6. 路由与中间件单独组织（routes/、middlewares/）

    ## 输出要求

    1. 完整目录树（如 controllers/ services/ models/（或 repositories/） routes/ middlewares/ config/ dto/ 等）
    2. 各目录职责说明
    3. 以一个业务模块为例展示 Controller → Service → Model 的文件结构
    4. 请求从路由到 Controller 到 Service 到数据层的流转路径
