# DDD · HTTP 请求流转（prompt 模板）

## prompt 模板

    你是一位资深后端架构师，精通{语言}和 DDD（领域驱动设计）。请你基于项目信息，遵守架构原则，
    在此基础上给出一个完整请求从 HTTP Controller 到数据库的流转路径，并输出至 docs/standards/。

    ## 项目信息

    请阅读以下文件获取业务流程、数据结构、技术选型：
    - 业务流程描述：docs/product/business-flow.md
    - DB 设计文件：docs/specs/data/（table.sql 或 schema.json）
    - 一个示例 API：docs/specs/API/<模块>.yaml（选一个代表性接口）
    - 技术选型：docs/standards/tech-stack-rule.md
    - 目录结构：docs/standards/directory-rule.md

    ## 架构原则

    1. **四层整洁架构**：api/（Controller+DTO）→ application/（UseCase）→ domain/（实体/领域服务/仓储接口）→ infra/（仓储实现等）
    2. **依赖方向**：内层不知道外层。domain 零依赖；application 依赖 domain；api 依赖 application；infra 实现 domain/application 接口
    3. **限界上下文划分**：按业务领域划分子模块，高度内聚
    4. **仓储模式**：领域层只定义 Repository 接口，infra 提供实现
    5. **贫血领域模型 + 领域服务**：实体只含数据与基本校验，复杂逻辑放 Domain Service
    6. **Contract/Impl 分离**、严格 TDD

    ## 输出要求

    1. 从示例 API 中选一个接口，给出完整请求从 Controller 到数据库的流转路径（逐层标注）
    2. 每个环节说明：在哪个文件/哪一层、做什么、调用什么
    3. 覆盖：Controller(DTO) → UseCase(application) → Domain Service → Repository 接口 → infra 实现 → DB → 响应封装
    4. 标注 DI 如何实现依赖倒置（接口在哪里注册、实现在哪注入）
